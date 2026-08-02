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
	RepoCheckResult,
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
	onCheckArticleRepository(): Promise<RepoCheckResult>;
	onCheckBlogRepository(): Promise<RepoCheckResult>;
	onConfigureArticleSecretsOnly(): Promise<RepositoryConfigurationResult>;
	onCreateArticleRepository(): Promise<RepositoryConfigurationResult>;
	onConfigureBlogSecretsOnly(): Promise<RepositoryConfigurationResult>;
	onCreateBlogRepository(): Promise<RepositoryConfigurationResult>;
	onTrigger(): Promise<unknown>;
}

type SaveSettings = (changes: Partial<PluginSettings>) => Promise<void>;
type Disableable = { setDisabled(disabled: boolean): unknown };
type RepoState = "idle" | "checking" | "exists" | "missing" | "working";

interface RepoAreaState {
	state: RepoState;
	check: RepoCheckResult | null;
	message: { kind: "ok" | "error"; text: string } | null;
}

export class PublisherSettingsTab extends PluginSettingTab {
	private verifiedPat = "";
	private verifiedLogin = "";
	private repositoryInputs: Disableable[] = [];
	private articleButtons: { button: ButtonComponent; requiresNames: boolean }[] = [];
	private blogButtons: { button: ButtonComponent; requiresNames: boolean }[] = [];
	private patButton?: ButtonComponent;
	private patInput?: TextComponent;
	private repositorySection?: HTMLElement;
	private articleSectionEl?: HTMLElement;
	private blogSectionEl?: HTMLElement;
	private articleControlsEl?: HTMLElement;
	private blogControlsEl?: HTMLElement;
	private article: RepoAreaState = { state: "idle", check: null, message: null };
	private blog: RepoAreaState = { state: "idle", check: null, message: null };
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
		this.repositoryInputs = [];
		this.articleButtons = [];
		this.blogButtons = [];
		this.patButton = undefined;
		this.patInput = undefined;
		this.repositorySection = undefined;
		this.articleSectionEl = undefined;
		this.blogSectionEl = undefined;
		this.articleControlsEl = undefined;
		this.blogControlsEl = undefined;

		containerEl.createEl("h2", { text: "VitePress Butterfly 发布" });
		containerEl.createEl("p", {
			text: "依次完成：验证 PAT → 检测并配置文章仓库 → 检测并配置博客仓库。每个按钮都可安全重试，网络中断不会重复创建仓库。",
		});

		this.renderPat(containerEl);
		this.renderRepositories(containerEl);
		this.updateAvailability();
	}

	// ------------------------------------------------------------------
	// PAT
	// ------------------------------------------------------------------

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

	// ------------------------------------------------------------------
	// Repository areas (each with its own detect → act state machine).
	// ------------------------------------------------------------------

	private renderRepositories(containerEl: HTMLElement): void {
		this.repositorySection = containerEl.createDiv({ cls: "vpb-repository-section" });
		this.repositorySection.createEl("h3", { text: "2. 配置仓库" });
		const hint = this.repositorySection.createEl("p", {
			cls: "vitepress-butterfly-publisher-hint",
			text: this.isPatVerified()
				? "先点「检测仓库」确认状态：不存在 → 创建并配置；已存在 → 仅更新环境变量，不改仓库内容。"
				: "🔒 PAT 连通性检测通过后即可检测和配置仓库。",
		});
		hint.setAttribute("aria-live", "polite");

		this.articleSectionEl = this.repositorySection.createDiv();
		this.blogSectionEl = this.repositorySection.createDiv();
		this.renderArticleSection();
		this.renderBlogSection();

		this.repositorySection.createEl("h3", { text: "日常操作" });
		new Setting(this.repositorySection)
			.setName("重新构建博客")
			.setDesc("通常无需手动执行；文章仓库 Push 后会自动触发。")
			.addButton((button) => {
				button.setButtonText("触发构建");
				this.repositoryInputs.push(button);
				button.onClick(() => {
					void this.runSimpleAction(button, "触发构建", "触发中…", this.actions.onTrigger);
				});
			});
	}

	private renderArticleSection(): void {
		if (!this.articleSectionEl) {
			return;
		}
		this.articleSectionEl.empty();
		this.articleControlsEl = undefined;
		const setting = new Setting(this.articleSectionEl)
			.setName("文章仓库")
			.setDesc("保存文章和站点配置的私密仓库。");
		setting.addText((text) => {
			this.repositoryInputs.push(text);
			text.setPlaceholder("my-blog-wiki");
			text.setValue(this.getSettings().repoName);
			text.onChange((value) => {
				void this.saveSettings({ repoName: value.trim() }).catch((error: unknown) => {
					new Notice(this.errorMessage(error, "保存仓库名失败"));
				});
				// A different name invalidates the previous check result.
				this.article = { state: "idle", check: null, message: null };
				this.renderArticleControls();
			});
		});
		this.articleControlsEl = this.articleSectionEl.createDiv({ cls: "vpb-repo-controls" });
		this.renderArticleControls();
	}

	private renderBlogSection(): void {
		if (!this.blogSectionEl) {
			return;
		}
		this.blogSectionEl.empty();
		this.blogControlsEl = undefined;
		const setting = new Setting(this.blogSectionEl)
			.setName("博客仓库")
			.setDesc("公开的博客主题仓库，不存在时从官方模板创建。");
		setting.addText((text) => {
			this.repositoryInputs.push(text);
			text.setPlaceholder("yourname.github.io");
			text.setValue(this.getSettings().blogRepoName);
			text.onChange((value) => {
				void this.saveSettings({ blogRepoName: value.trim() }).catch((error: unknown) => {
					new Notice(this.errorMessage(error, "保存仓库名失败"));
				});
				this.blog = { state: "idle", check: null, message: null };
				this.renderBlogControls();
			});
		});
		this.blogControlsEl = this.blogSectionEl.createDiv({ cls: "vpb-repo-controls" });
		this.renderBlogControls();
	}

	private renderArticleControls(): void {
		this.renderRepoControls(this.articleControlsEl, this.article, "article");
	}

	private renderBlogControls(): void {
		this.renderRepoControls(this.blogControlsEl, this.blog, "blog");
	}

	private renderRepoControls(
		container: HTMLElement | undefined,
		area: RepoAreaState,
		which: "article" | "blog",
	): void {
		if (!container) {
			return;
		}
		container.empty();
		const buttons = which === "article" ? this.articleButtons : this.blogButtons;
		buttons.length = 0;

		const statusEl = container.createDiv({ cls: "vitepress-butterfly-check-status" });
		const actionsEl = container.createDiv({ cls: "vpb-repo-actions" });

		if (area.message) {
			statusEl.textContent = area.message.text;
			statusEl.addClass(area.message.kind === "ok" ? "vpb-ok" : "vpb-error");
		} else {
			switch (area.state) {
				case "checking":
					statusEl.textContent = "正在检测…";
					statusEl.addClass("vpb-loading");
					break;
				case "exists":
					statusEl.textContent = area.check?.pendingResume
						? "✓ 仓库已存在（上次创建未完成，可点「创建仓库并配置」继续）"
						: "✓ 仓库已存在";
					statusEl.addClass("vpb-ok");
					break;
				case "missing":
					statusEl.textContent = "✓ 仓库不存在，可以创建";
					statusEl.addClass("vpb-ok");
					break;
				case "working":
					statusEl.textContent = "正在配置…（网络中断可直接重试）";
					statusEl.addClass("vpb-loading");
					break;
				default:
					statusEl.textContent = this.namesReady()
						? "未检测"
						: "请先填写文章仓库名和博客仓库名";
			}
		}

		const namesReady = this.namesReady();
		switch (area.state) {
			case "checking":
				this.addRepoButton(actionsEl, "检测中…", false, undefined, false, buttons).setDisabled(true);
				break;
			case "exists":
				this.addRepoButton(actionsEl, "重新检测", false, () => void this.runRepoCheck(which), false, buttons);
				this.addRepoButton(actionsEl, "仅配置变量", true, () => void this.runRepoAction(which, "secrets"), false, buttons);
				break;
			case "missing":
				this.addRepoButton(actionsEl, "重新检测", false, () => void this.runRepoCheck(which), false, buttons);
				this.addRepoButton(actionsEl, "创建仓库并配置", true, () => void this.runRepoAction(which, "create"), false, buttons);
				break;
			case "working":
				this.addRepoButton(actionsEl, "重新检测", false, undefined, false, buttons).setDisabled(true);
				this.addRepoButton(actionsEl, "配置中…", true, undefined, false, buttons).setDisabled(true);
				break;
			default:
				this.addRepoButton(actionsEl, "检测仓库", false, () => void this.runRepoCheck(which), true, buttons);
		}
	}

	private addRepoButton(
		container: HTMLElement,
		label: string,
		cta: boolean,
		onClick: (() => void) | undefined,
		requiresNames: boolean,
		buttons: { button: ButtonComponent; requiresNames: boolean }[],
	): ButtonComponent {
		const button = new ButtonComponent(container).setButtonText(label);
		if (cta) {
			button.setCta();
		}
		if (onClick) {
			button.onClick(onClick);
		}
		buttons.push({ button, requiresNames });
		return button;
	}

	private namesReady(): boolean {
		const settings = this.getSettings();
		return Boolean(settings.repoName.trim() && settings.blogRepoName.trim());
	}

	private async runRepoCheck(which: "article" | "blog"): Promise<void> {
		if (this.isPatChecking || this.isActionRunning) {
			return;
		}
		const area = which === "article" ? this.article : this.blog;
		area.message = null;
		area.state = "checking";
		this.renderRepoControls(
			which === "article" ? this.articleControlsEl : this.blogControlsEl,
			area,
			which,
		);
		this.updateAvailability();
		await yieldToUi();

		try {
			const result = which === "article"
				? await this.actions.onCheckArticleRepository()
				: await this.actions.onCheckBlogRepository();
			area.check = result;
			area.state = result.exists ? "exists" : "missing";
		} catch (error) {
			area.state = "idle";
			area.message = { kind: "error", text: `✗ ${this.errorMessage(error, "检测失败")}` };
		} finally {
			this.renderRepoControls(
				which === "article" ? this.articleControlsEl : this.blogControlsEl,
				area,
				which,
			);
			this.updateAvailability();
		}
	}

	private async runRepoAction(
		which: "article" | "blog",
		mode: "secrets" | "create",
	): Promise<void> {
		if (this.isPatChecking || this.isActionRunning) {
			return;
		}
		const area = which === "article" ? this.article : this.blog;
		area.message = null;
		area.state = "working";
		this.renderRepoControls(
			which === "article" ? this.articleControlsEl : this.blogControlsEl,
			area,
			which,
		);
		this.updateAvailability();
		await yieldToUi();

		try {
			const result = which === "article"
				? mode === "secrets"
					? await this.actions.onConfigureArticleSecretsOnly()
					: await this.actions.onCreateArticleRepository()
				: mode === "secrets"
					? await this.actions.onConfigureBlogSecretsOnly()
					: await this.actions.onCreateBlogRepository();

			area.check = {
				exists: true,
				repository: result.repository,
				private: false,
				pendingResume: false,
			};
			area.state = "exists";
			area.message = {
				kind: "ok",
				text: mode === "secrets"
					? `✓ ${this.fullName(result)} 环境变量已更新`
					: result.created
						? `✓ 已创建并配置 ${this.fullName(result)}`
						: `✓ 已继续完成 ${this.fullName(result)} 的配置`,
			};
			if (result.warning) {
				new Notice(result.warning, 8_000);
			}
			new Notice(`${which === "article" ? "文章仓库" : "博客仓库"}配置完成。`, 4_000);
		} catch (error) {
			area.state = area.check?.exists ? "exists" : area.check ? "missing" : "idle";
			area.message = { kind: "error", text: `✗ ${this.errorMessage(error, "配置失败")}` };
		} finally {
			this.renderRepoControls(
				which === "article" ? this.articleControlsEl : this.blogControlsEl,
				area,
				which,
			);
			this.updateAvailability();
		}
	}

	// ------------------------------------------------------------------
	// PAT check
	// ------------------------------------------------------------------

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

	// ------------------------------------------------------------------
	// Shared UI helpers
	// ------------------------------------------------------------------

	private updateAvailability(): void {
		const enabled = this.isPatVerified() && !this.isPatChecking && !this.isActionRunning;
		this.repositoryInputs.forEach((input) => input.setDisabled(!enabled));
		for (const item of [...this.articleButtons, ...this.blogButtons]) {
			item.button.setDisabled(!enabled || (item.requiresNames && !this.namesReady()));
		}
		this.repositorySection?.toggleClass("is-locked", !this.isPatVerified());
		this.patInput?.setDisabled(this.isPatChecking || this.isActionRunning);
		this.patButton?.setDisabled(this.isPatChecking || this.isActionRunning);
	}

	private isPatVerified(): boolean {
		return Boolean(this.verifiedPat) && this.getSettings().pat.trim() === this.verifiedPat;
	}

	private createStatus(containerEl: HTMLElement): HTMLSpanElement {
		const span = containerEl.createSpan({ cls: "vitepress-butterfly-check-status" });
		span.textContent = "未检测";
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
