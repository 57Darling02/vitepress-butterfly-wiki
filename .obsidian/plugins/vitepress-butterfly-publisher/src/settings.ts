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
	onConfigureArticleRepository(): Promise<RepositoryConfigurationResult>;
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
}

export class PublisherSettingsTab extends PluginSettingTab {
	private verifiedPat = "";
	private verifiedLogin = "";
	private repositoryInputs: Disableable[] = [];
	private patButton?: ButtonComponent;
	private patInput?: TextComponent;
	private repositorySection?: HTMLElement;
	private sectionHint?: HTMLElement;
	private articleInput?: TextComponent;
	private blogInput?: TextComponent;
	private articleStatus?: HTMLSpanElement;
	private blogStatus?: HTMLSpanElement;
	private articleCheckButton?: ButtonComponent;
	private articleActionButton?: ButtonComponent;
	private blogCheckButton?: ButtonComponent;
	private blogActionButton?: ButtonComponent;
	private article: RepoAreaState = { state: "idle", check: null };
	private blog: RepoAreaState = { state: "idle", check: null };
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
		this.patButton = undefined;
		this.patInput = undefined;
		this.repositorySection = undefined;
		this.articleStatus = undefined;
		this.blogStatus = undefined;
		this.articleCheckButton = undefined;
		this.articleActionButton = undefined;
		this.blogCheckButton = undefined;
		this.blogActionButton = undefined;

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
		this.setStatus(status, "neutral", "未检测");

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
				text.setValue(this.getSettings().pat);
				text.onChange((value) => {
					const normalized = value.trim();
					void this.saveSettings({ pat: normalized }).catch((error: unknown) => {
						new Notice(this.errorMessage(error, "保存 PAT 失败"));
					});
					if (normalized !== this.verifiedPat) {
						this.verifiedPat = "";
						this.verifiedLogin = "";
						this.patButton?.setButtonText("检测连通性");
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
				button.setButtonText(this.isPatVerified() ? "重新检测" : "检测连通性").setCta();
				button.onClick(() => {
					void this.runPatCheck(button, status);
				});
			});
	}

	// ------------------------------------------------------------------
	// Repository sections (mirror the PAT layout: buttons on the right of
	// the input, status message below the description).
	// ------------------------------------------------------------------

	private renderRepositories(containerEl: HTMLElement): void {
		this.repositorySection = containerEl.createDiv({ cls: "vpb-repository-section" });
		this.repositorySection.createEl("h3", { text: "2. 配置仓库" });
		// The UI explains itself once the PAT is verified: the only visible
		// button is「检测仓库」until a check result branches the options.
		if (!this.isPatVerified()) {
			this.sectionHint = this.repositorySection.createEl("p", {
				cls: "vitepress-butterfly-publisher-hint",
				text: "🔒 PAT 连通性检测通过后即可检测和配置仓库。",
			});
		}
		this.renderArticleSection(this.repositorySection);
		this.renderBlogSection(this.repositorySection);

		this.repositorySection.createEl("h3", { text: "日常操作" });
		new Setting(this.repositorySection)
			.setName("重新构建博客")
			.setDesc("通常无需手动执行；文章仓库 Push 后会自动触发。")
			.addButton((button) => {
				this.repositoryInputs.push(button);
				button.setButtonText("触发构建");
				button.onClick(() => {
					void this.runSimpleAction(button, "触发构建", "触发中…", this.actions.onTrigger);
				});
			});
	}

	private renderArticleSection(containerEl: HTMLElement): void {
		const setting = new Setting(containerEl)
			.setName("文章仓库")
			.setDesc("保存文章和站点配置的私密仓库。");
		const status = this.createStatus(setting.descEl);
		this.articleStatus = status;
		this.setStatus(
			status,
			this.namesReady() ? "neutral" : "error",
			this.namesReady() ? "未检测" : "请先填写文章仓库名和博客仓库名",
		);

		setting.addText((text) => {
			this.articleInput = text;
			this.repositoryInputs.push(text);
			text.setPlaceholder("my-blog-wiki");
			text.setValue(this.getSettings().repoName);
			text.onChange((value) => {
				void this.saveSettings({ repoName: value.trim() }).catch((error: unknown) => {
					new Notice(this.errorMessage(error, "保存仓库名失败"));
				});
				// A different name invalidates the previous check result.
				this.article = { state: "idle", check: null };
				this.updateRepoButtons("article");
				this.setStatus(
					status,
					this.namesReady() ? "warn" : "error",
					this.namesReady() ? "仓库名已修改，请重新检测" : "请先填写文章仓库名和博客仓库名",
				);
				this.updateAvailability();
			});
		});

		setting.addButton((button) => {
			this.articleCheckButton = button;
			button.setButtonText("检测仓库");
			button.onClick(() => {
				void this.runRepoCheck("article");
			});
		});

		setting.addButton((button) => {
			this.articleActionButton = button;
			button.setCta();
			button.onClick(() => {
				if (this.article.state === "exists") {
					void this.runRepoAction("article", "overwrite");
				} else if (this.article.state === "missing") {
					void this.runRepoAction("article", "create");
				}
			});
			this.setButtonVisible(button, false);
		});

		this.updateRepoButtons("article");
	}

	private renderBlogSection(containerEl: HTMLElement): void {
		const setting = new Setting(containerEl)
			.setName("博客仓库")
			.setDesc("公开的博客主题仓库，不存在时从官方模板创建。");
		const status = this.createStatus(setting.descEl);
		this.blogStatus = status;
		this.setStatus(
			status,
			this.namesReady() ? "neutral" : "error",
			this.namesReady() ? "未检测" : "请先填写文章仓库名和博客仓库名",
		);

		setting.addText((text) => {
			this.blogInput = text;
			this.repositoryInputs.push(text);
			text.setPlaceholder("yourname.github.io");
			text.setValue(this.getSettings().blogRepoName);
			text.onChange((value) => {
				void this.saveSettings({ blogRepoName: value.trim() }).catch((error: unknown) => {
					new Notice(this.errorMessage(error, "保存仓库名失败"));
				});
				this.blog = { state: "idle", check: null };
				this.updateRepoButtons("blog");
				this.setStatus(
					status,
					this.namesReady() ? "warn" : "error",
					this.namesReady() ? "仓库名已修改，请重新检测" : "请先填写文章仓库名和博客仓库名",
				);
				this.updateAvailability();
			});
		});

		setting.addButton((button) => {
			this.blogCheckButton = button;
			button.setButtonText("检测仓库");
			button.onClick(() => {
				void this.runRepoCheck("blog");
			});
		});

		setting.addButton((button) => {
			this.blogActionButton = button;
			button.setCta();
			button.onClick(() => {
				if (this.blog.state === "exists") {
					void this.runRepoAction("blog", "secrets");
				} else if (this.blog.state === "missing") {
					void this.runRepoAction("blog", "create");
				}
			});
			this.setButtonVisible(button, false);
		});

		this.updateRepoButtons("blog");
	}

	/** Switches the two repo buttons (check + action) to match the state. */
	private updateRepoButtons(which: "article" | "blog"): void {
		const area = which === "article" ? this.article : this.blog;
		const check = which === "article" ? this.articleCheckButton : this.blogCheckButton;
		const action = which === "article" ? this.articleActionButton : this.blogActionButton;
		if (!check || !action) {
			return;
		}

		switch (area.state) {
			case "checking":
				check.setButtonText("检测中…");
				this.setButtonLoading(check, true);
				this.setButtonVisible(action, false);
				break;
			case "exists":
				check.setButtonText("重新检测");
				this.setButtonLoading(check, false);
				action.setButtonText(which === "article" ? "覆盖并配置" : "仅配置变量");
				this.setButtonLoading(action, false);
				this.setButtonVisible(action, true);
				break;
			case "missing":
				check.setButtonText("重新检测");
				this.setButtonLoading(check, false);
				action.setButtonText("创建仓库并配置");
				this.setButtonLoading(action, false);
				this.setButtonVisible(action, true);
				break;
			case "working":
				check.setButtonText("重新检测");
				this.setButtonLoading(check, false);
				action.setButtonText("配置中…");
				this.setButtonLoading(action, true);
				this.setButtonVisible(action, true);
				break;
			default:
				check.setButtonText("检测仓库");
				this.setButtonLoading(check, false);
				this.setButtonVisible(action, false);
				break;
		}
	}

	private setButtonVisible(button: ButtonComponent, visible: boolean): void {
		// The HTML `hidden` attribute is overridden by Obsidian's button CSS
		// (display rules), so visibility is controlled via inline style.
		button.buttonEl.style.display = visible ? "" : "none";
	}

	private setButtonLoading(button: ButtonComponent, loading: boolean): void {
		button.buttonEl.classList.toggle("vpb-check-running", loading);
		if (loading) {
			button.setIcon("loader-2");
		} else {
			button.buttonEl.querySelector("svg")?.remove();
		}
	}

	// ------------------------------------------------------------------
	// Repository flows
	// ------------------------------------------------------------------

	private async runRepoCheck(which: "article" | "blog"): Promise<void> {
		if (this.isPatChecking || this.isActionRunning) {
			return;
		}
		const area = which === "article" ? this.article : this.blog;
		const status = which === "article" ? this.articleStatus : this.blogStatus;
		if (!status) {
			return;
		}

		area.state = "checking";
		this.updateRepoButtons(which);
		this.setStatus(status, "loading", "正在检测…");
		this.updateAvailability();
		await yieldToUi();

		try {
			const result = which === "article"
				? await this.actions.onCheckArticleRepository()
				: await this.actions.onCheckBlogRepository();
			area.check = result;
			area.state = result.exists ? "exists" : "missing";
			this.setStatus(
				status,
				"ok",
				result.exists
					? result.pendingResume
						? "✓ 仓库已存在（上次配置未完成，可以继续配置）"
						: "✓ 仓库已存在"
					: "✓ 仓库不存在，可以创建",
			);
		} catch (error) {
			area.state = "idle";
			this.setStatus(status, "error", `✗ ${this.errorMessage(error, "检测失败")}`);
		} finally {
			this.updateRepoButtons(which);
			this.updateAvailability();
		}
	}

	private async runRepoAction(
		which: "article" | "blog",
		mode: "overwrite" | "secrets" | "create",
	): Promise<void> {
		if (this.isPatChecking || this.isActionRunning) {
			return;
		}
		const area = which === "article" ? this.article : this.blog;
		const status = which === "article" ? this.articleStatus : this.blogStatus;
		if (!status) {
			return;
		}

		this.isActionRunning = true;
		area.state = "working";
		this.updateRepoButtons(which);
		this.setStatus(status, "loading", "正在配置…（网络中断可直接重试）");
		this.updateAvailability();
		await yieldToUi();

		try {
			const result = which === "article"
				? mode === "overwrite"
					? await this.actions.onConfigureArticleRepository()
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
			this.setStatus(
				status,
				"ok",
				mode === "overwrite"
					? `✓ 已覆盖并配置 ${this.fullName(result)}`
					: mode === "secrets"
						? `✓ ${this.fullName(result)} 环境变量已更新`
					: result.created
						? `✓ 已创建并配置 ${this.fullName(result)}`
						: `✓ 已继续完成 ${this.fullName(result)} 的配置`,
			);
			if (result.warning) {
				new Notice(result.warning, 8_000);
			}
			new Notice(`${which === "article" ? "文章仓库" : "博客仓库"}配置完成。`, 4_000);
		} catch (error) {
			area.state = area.check?.exists ? "exists" : area.check ? "missing" : "idle";
			this.setStatus(status, "error", `✗ ${this.errorMessage(error, "配置失败")}`);
		} finally {
			this.isActionRunning = false;
			this.updateRepoButtons(which);
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
		this.setButtonLoading(button, true);
		this.setStatus(status, "loading", "正在连接 GitHub…");
		await yieldToUi();

		try {
			const result = await this.actions.onCheckPat();
			if (this.getSettings().pat.trim() !== patAtStart) {
				throw new Error("PAT 已在检测过程中修改，请重新检测。");
			}

			this.verifiedPat = patAtStart;
			this.verifiedLogin = result.login;

			// Auto-fill empty repository names and surface the change in the
			// input fields, without rebuilding the whole settings page.
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
				this.articleInput?.setValue(this.getSettings().repoName);
				this.blogInput?.setValue(this.getSettings().blogRepoName);
			}

			this.patButton?.setButtonText("重新检测");
			this.sectionHint?.remove();
			this.setStatus(status, "ok", `✓ 已连接 @${result.login}`);
			this.updateRepoStatusHints();
			this.updateAvailability();
		} catch (error) {
			this.verifiedPat = "";
			this.verifiedLogin = "";
			this.setStatus(status, "error", `✗ ${this.errorMessage(error, "连接失败")}`);
		} finally {
			this.isPatChecking = false;
			if (this.patButton) {
				this.setButtonLoading(this.patButton, false);
				if (!this.isPatVerified()) {
					this.patButton.setButtonText("检测连通性");
				}
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
		this.setButtonLoading(button, true);
		this.updateAvailability();
		await yieldToUi();
		try {
			await action();
		} catch (error) {
			new Notice(this.errorMessage(error, `${label}失败`), 8_000);
		} finally {
			this.isActionRunning = false;
			button.setButtonText(label);
			this.setButtonLoading(button, false);
			this.updateAvailability();
		}
	}

	// ------------------------------------------------------------------
	// Shared UI helpers
	// ------------------------------------------------------------------

	private updateRepoStatusHints(): void {
		if (!this.articleStatus || !this.blogStatus) {
			return;
		}
		if (this.namesReady()) {
			this.setStatus(this.articleStatus, "neutral", "未检测");
			this.setStatus(this.blogStatus, "neutral", "未检测");
		} else {
			this.setStatus(this.articleStatus, "error", "请先填写文章仓库名和博客仓库名");
			this.setStatus(this.blogStatus, "error", "请先填写文章仓库名和博客仓库名");
		}
	}

	private updateAvailability(): void {
		const enabled = this.isPatVerified() && !this.isPatChecking && !this.isActionRunning;
		this.repositoryInputs.forEach((input) => input.setDisabled(!enabled));
		const pairs: [ButtonComponent | undefined, boolean][] = [
			[this.articleCheckButton, this.isButtonLocked("article", "check")],
			[this.articleActionButton, this.isButtonLocked("article", "action")],
			[this.blogCheckButton, this.isButtonLocked("blog", "check")],
			[this.blogActionButton, this.isButtonLocked("blog", "action")],
		];
		for (const [button, locked] of pairs) {
			button?.setDisabled(!enabled || locked);
		}
		this.repositorySection?.toggleClass("is-locked", !this.isPatVerified());
		this.patInput?.setDisabled(this.isPatChecking || this.isActionRunning);
		this.patButton?.setDisabled(this.isPatChecking || this.isActionRunning);
	}

	private isButtonLocked(which: "article" | "blog", role: "check" | "action"): boolean {
		const area = which === "article" ? this.article : this.blog;
		if (area.state === "checking" || area.state === "working") {
			return true;
		}
		if (role === "check" && area.state === "idle") {
			return !this.namesReady();
		}
		if (role === "action") {
			return area.state !== "exists" && area.state !== "missing";
		}
		return false;
	}

	private isPatVerified(): boolean {
		return Boolean(this.verifiedPat) && this.getSettings().pat.trim() === this.verifiedPat;
	}

	private namesReady(): boolean {
		const settings = this.getSettings();
		return Boolean(settings.repoName.trim() && settings.blogRepoName.trim());
	}

	private createStatus(containerEl: HTMLElement): HTMLSpanElement {
		const span = containerEl.createSpan({ cls: "vitepress-butterfly-check-status" });
		span.setAttribute("aria-live", "polite");
		return span;
	}

	private setStatus(
		el: HTMLSpanElement,
		kind: "neutral" | "loading" | "ok" | "warn" | "error",
		message: string,
	): void {
		el.textContent = message;
		el.removeClass("vpb-loading", "vpb-ok", "vpb-warn", "vpb-error");
		if (kind !== "neutral") {
			el.addClass(`vpb-${kind}`);
		}
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
