import {
	App,
	ButtonComponent,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TextComponent,
} from "obsidian";

import type {
	PatCheckResult,
	RepositoryConfigurationResult,
} from "./services/blog";

export interface PluginSettings {
	pat: string;
	/** Private article repository name. */
	repoName: string;
	/** Public blog repository name. */
	blogRepoName: string;
	/** Retry marker for a repository created by this plugin but not fully uploaded. */
	pendingArticleRepo: string;
	/** Retry marker for a generated blog repository not fully configured yet. */
	pendingBlogRepo: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	pat: "",
	repoName: "",
	blogRepoName: "",
	pendingArticleRepo: "",
	pendingBlogRepo: "",
};

export interface PublisherSettingsActions {
	onCheckPat(): Promise<PatCheckResult>;
	onConfigureArticleRepository(): Promise<RepositoryConfigurationResult>;
	onConfigureBlogRepository(): Promise<RepositoryConfigurationResult>;
	onTrigger(): Promise<unknown>;
}

type SaveSettings = (changes: Partial<PluginSettings>) => Promise<void>;
type Disableable = { setDisabled(disabled: boolean): unknown };

export class PublisherSettingsTab extends PluginSettingTab {
	private verifiedPat = "";
	private verifiedLogin = "";
	private repositoryControls: Disableable[] = [];
	private patButton?: ButtonComponent;
	private patInput?: TextComponent;
	private repositorySection?: HTMLElement;
	private isPatChecking = false;
	private isActionRunning = false;

	constructor(
		app: App,
		plugin: Plugin,
		private readonly getSettings: () => PluginSettings,
		private readonly saveSettings: SaveSettings,
		private readonly actions: PublisherSettingsActions,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.repositoryControls = [];
		this.patButton = undefined;
		this.patInput = undefined;
		this.repositorySection = undefined;

		containerEl.createEl("h2", { text: "VitePress Butterfly 发布" });
		containerEl.createEl("p", {
			text: "首次使用只需依次完成：验证 PAT → 配置文章仓库 → 配置博客仓库。网络中断时重新点击当前按钮即可，不会重复创建仓库。",
		});

		this.renderPat(containerEl);
		this.renderRepositories(containerEl);
		this.updateAvailability();
	}

	private renderPat(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "1. 连接 GitHub" });
		const setting = new Setting(containerEl)
			.setName("GitHub PAT")
			.setDesc("使用具有 repo + workflow 权限的 Tokens (classic)；仅保存在本机和 GitHub 加密 secrets 中。");
		const status = this.createStatus(setting.descEl);
		const settings = this.getSettings();

		if (this.isPatVerified()) {
			this.setStatus(status, "ok", `✓ 已连接 @${this.verifiedLogin}`);
		}

		setting
			.addText((text) => {
				this.patInput = text;
				text.inputEl.type = "password";
				text.inputEl.autocomplete = "off";
				text.inputEl.spellcheck = false;
				text.setPlaceholder("ghp_...");
				text.setValue(settings.pat);
				text.onChange((value) => {
					const normalized = value.trim();
					void this.saveSettings({ pat: normalized }).catch((error: unknown) => {
						new Notice(this.errorMessage(error, "保存 PAT 失败"));
					});
					if (normalized !== this.verifiedPat) {
						this.verifiedPat = "";
						this.verifiedLogin = "";
						this.setStatus(
							status,
							normalized ? "warn" : "error",
							normalized ? "PAT 已修改，请重新检测" : "请先输入 PAT",
						);
						this.updateAvailability();
					}
				});
			})
			.addButton((button) => {
				this.patButton = button;
				button.setButtonText("检测连通性").setCta();
				button.onClick(() => {
					void this.runPatCheck(button, status);
				});
			});
	}

	private renderRepositories(containerEl: HTMLElement): void {
		this.repositorySection = containerEl.createDiv({ cls: "vpb-repository-section" });
		this.repositorySection.createEl("h3", { text: "2. 配置仓库" });
		const hint = this.repositorySection.createEl("p", {
			cls: "vitepress-butterfly-publisher-hint",
			text: this.isPatVerified()
				? "仓库已存在时只更新环境变量，不修改仓库内容；仓库不存在时才执行初始化。"
				: "🔒 PAT 连通性检测通过后即可填写和配置仓库。",
		});
		hint.setAttribute("aria-live", "polite");

		const settings = this.getSettings();

		const articleSetting = new Setting(this.repositorySection)
			.setName("文章仓库")
			.setDesc("保存文章和站点配置的私密仓库。不存在时上传当前 Vault；已存在时仅更新 BLOG_REPO 和 PAT。");
		const articleStatus = this.createStatus(articleSetting.descEl);
		articleSetting
			.addText((text) => {
				text.setPlaceholder("my-blog-wiki");
				this.bindRepositoryName(text, "repoName", settings.repoName, articleStatus);
				this.repositoryControls.push(text);
			})
			.addButton((button) => {
				button.setButtonText("配置文章仓库");
				this.repositoryControls.push(button);
				button.onClick(() => {
					void this.runRepositoryAction(
						button,
						articleStatus,
						"配置文章仓库",
						"配置中…",
						this.actions.onConfigureArticleRepository,
						(result) => result.created
							? `✓ 已创建、上传并配置 ${this.fullName(result)}`
							: result.initialized
								? `✓ 已继续完成 ${this.fullName(result)} 的首次上传与配置`
								: `✓ ${this.fullName(result)} 已存在，仅更新了环境变量`,
					);
				});
			});

		const blogSetting = new Setting(this.repositorySection)
			.setName("博客仓库")
			.setDesc("公开的博客主题仓库。不存在时从官方模板创建；已存在时仅更新 WIKI_URL 和 PAT。");
		const blogStatus = this.createStatus(blogSetting.descEl);
		blogSetting
			.addText((text) => {
				text.setPlaceholder("yourname.github.io");
				this.bindRepositoryName(text, "blogRepoName", settings.blogRepoName, blogStatus);
				this.repositoryControls.push(text);
			})
			.addButton((button) => {
				button.setButtonText("配置博客仓库").setCta();
				this.repositoryControls.push(button);
				button.onClick(() => {
					void this.runRepositoryAction(
						button,
						blogStatus,
						"配置博客仓库",
						"配置中…",
						this.actions.onConfigureBlogRepository,
						(result) => result.created
							? `✓ 已从模板创建并配置 ${this.fullName(result)}`
							: result.initialized
								? `✓ 已继续完成 ${this.fullName(result)} 的首次配置`
								: `✓ ${this.fullName(result)} 已存在，仅更新了环境变量`,
					);
				});
			});

		this.repositorySection.createEl("h3", { text: "日常操作" });
		new Setting(this.repositorySection)
			.setName("重新构建博客")
			.setDesc("通常无需手动执行；文章仓库 Push 后会自动触发。")
			.addButton((button) => {
				button.setButtonText("触发构建");
				this.repositoryControls.push(button);
				button.onClick(() => {
					void this.runSimpleAction(button, "触发构建", "触发中…", this.actions.onTrigger);
				});
			});
	}

	private bindRepositoryName(
		text: TextComponent,
		key: "repoName" | "blogRepoName",
		value: string,
		status: HTMLSpanElement,
	): void {
		text.setValue(value);
		text.onChange((nextValue) => {
			void this.saveSettings({ [key]: nextValue.trim() }).catch((error: unknown) => {
				new Notice(this.errorMessage(error, "保存仓库名失败"));
			});
			this.setStatus(status, "warn", "仓库名已修改，请重新配置");
		});
	}

	private async runPatCheck(
		button: ButtonComponent,
		status: HTMLSpanElement,
	): Promise<void> {
		if (this.isPatChecking || this.isActionRunning) {
			return;
		}
		const patAtStart = this.getSettings().pat.trim();
		if (!patAtStart) {
			this.setStatus(status, "error", "✗ 请先输入 PAT");
			return;
		}

		this.isPatChecking = true;
		this.updateAvailability();
		button.setButtonText("检测中…");
		this.setStatus(status, "loading", "正在连接 GitHub…");
		await yieldToUi();

		try {
			const result = await this.actions.onCheckPat();
			if (this.getSettings().pat.trim() !== patAtStart) {
				throw new Error("PAT 已在检测过程中修改，请重新检测。");
			}

			const changes: Partial<PluginSettings> = {};
			const settings = this.getSettings();
			if (!settings.repoName.trim()) {
				changes.repoName = result.suggestedArticleRepoName;
			}
			if (!settings.blogRepoName.trim()) {
				changes.blogRepoName = result.suggestedBlogRepoName;
			}
			if (Object.keys(changes).length > 0) {
				await this.saveSettings(changes);
			}

			this.verifiedPat = patAtStart;
			this.verifiedLogin = result.login;
			this.display();
		} catch (error) {
			this.verifiedPat = "";
			this.verifiedLogin = "";
			this.setStatus(status, "error", `✗ ${this.errorMessage(error, "连接失败")}`);
		} finally {
			this.isPatChecking = false;
			if (this.patButton) {
				this.patButton.setButtonText("检测连通性");
			}
			this.updateAvailability();
		}
	}

	private async runRepositoryAction(
		button: ButtonComponent,
		status: HTMLSpanElement,
		label: string,
		pendingLabel: string,
		action: () => Promise<RepositoryConfigurationResult>,
		successMessage: (result: RepositoryConfigurationResult) => string,
	): Promise<void> {
		if (!this.isPatVerified() || this.isActionRunning) {
			return;
		}

		this.isActionRunning = true;
		button.setButtonText(pendingLabel);
		this.setStatus(status, "loading", `${pendingLabel} 网络中断时可直接重试`);
		this.updateAvailability();
		await yieldToUi();

		try {
			const result = await action();
			this.setStatus(
				status,
				result.warning ? "warn" : "ok",
				result.warning ? `${successMessage(result)}；${result.warning}` : successMessage(result),
			);
			new Notice(`${label}完成。`, 4_000);
		} catch (error) {
			this.setStatus(status, "error", `✗ ${this.errorMessage(error, `${label}失败`)}`);
		} finally {
			this.isActionRunning = false;
			button.setButtonText(label);
			this.updateAvailability();
		}
	}

	private async runSimpleAction(
		button: ButtonComponent,
		label: string,
		pendingLabel: string,
		action: () => Promise<unknown>,
	): Promise<void> {
		if (!this.isPatVerified() || this.isActionRunning) {
			return;
		}
		this.isActionRunning = true;
		button.setButtonText(pendingLabel);
		this.updateAvailability();
		await yieldToUi();
		try {
			await action();
		} catch (error) {
			new Notice(this.errorMessage(error, `${label}失败`), 8_000);
		} finally {
			this.isActionRunning = false;
			button.setButtonText(label);
			this.updateAvailability();
		}
	}

	private updateAvailability(): void {
		const repositoriesEnabled = this.isPatVerified() && !this.isActionRunning && !this.isPatChecking;
		this.repositoryControls.forEach((control) => control.setDisabled(!repositoriesEnabled));
		this.repositorySection?.toggleClass("is-locked", !this.isPatVerified());
		this.patInput?.setDisabled(this.isPatChecking || this.isActionRunning);
		this.patButton?.setDisabled(this.isPatChecking || this.isActionRunning);
	}

	private isPatVerified(): boolean {
		return Boolean(this.verifiedPat) && this.getSettings().pat.trim() === this.verifiedPat;
	}

	private createStatus(containerEl: HTMLElement): HTMLSpanElement {
		const span = containerEl.createSpan({ cls: "vitepress-butterfly-check-status" });
		span.textContent = "未配置";
		span.setAttribute("aria-live", "polite");
		return span;
	}

	private setStatus(
		el: HTMLSpanElement,
		kind: "loading" | "ok" | "warn" | "error",
		message: string,
	): void {
		el.textContent = message;
		el.removeClass("vpb-loading", "vpb-ok", "vpb-warn", "vpb-error");
		el.addClass(`vpb-${kind}`);
	}

	private fullName(result: RepositoryConfigurationResult): string {
		return `${result.repository.owner}/${result.repository.name}`;
	}

	private errorMessage(error: unknown, fallback: string): string {
		return error instanceof Error && error.message ? error.message.trim() : fallback;
	}
}

function yieldToUi(): Promise<void> {
	return new Promise((resolve) => {
		let resolved = false;
		const finish = (): void => {
			if (!resolved) {
				resolved = true;
				resolve();
			}
		};
		window.requestAnimationFrame(finish);
		window.setTimeout(finish, 50);
	});
}
