import {
	App,
	ButtonComponent,
	ExtraButtonComponent,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TextComponent,
} from "obsidian";

import type { RepoCheckResult } from "./services/blog";

export interface PluginSettings {
	pat: string;
	/** Current content repository name (the vault's own repository). */
	repoName: string;
	/** Public blog (theme) repository name. */
	blogRepoName: string;
	/** Theme source repository, force-synced by every blog build. */
	themeRepo: string;
	/** Whether deploy should try to enable GitHub Pages. */
	configurePages: boolean;
	/** Paths published by the last successful push. */
	publishedPaths: string[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
	pat: "",
	repoName: "",
	blogRepoName: "",
	themeRepo: "57Darling02/VitePress_butterfly",
	configurePages: true,
	publishedPaths: [],
};

export interface PublisherSettingsActions {
	/** Step 1: PAT connectivity only; resolves to the authenticated login. */
	onCheckPat(): Promise<string>;
	/** Step 2: content repository resolution + access. */
	onCheckContentRepo(): Promise<RepoCheckResult>;
	/** Step 3: blog (theme) repository access. */
	onCheckBlogRepo(): Promise<RepoCheckResult>;
	/** Step 4: both repositories must be resolvable. */
	onCheckReady(): Promise<void>;
	onSetup(): Promise<unknown>;
	onTrigger(): Promise<unknown>;
}

type SaveSettings = (changes: Partial<PluginSettings>) => Promise<void>;

export class PublisherSettingsTab extends PluginSettingTab {
	private actionButtons: ButtonComponent[] = [];
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
		this.actionButtons = [];

		containerEl.createEl("h2", { text: "VitePress Butterfly 发布" });
		containerEl.createEl("p", {
			text: "本插件负责初始化与部署：创建仓库、推送本地内容、配置 secrets、部署主题。日常的发布与拉取请使用内置的 obsidian-git 插件（桌面端与移动端均可）。",
		});

		const settings = this.getSettings();

		// --- Step 1: PAT ---
		const patSetting = new Setting(containerEl)
			.setName("GitHub PAT")
			.setDesc("需要 repo + workflow 权限，仅保存在本机。");
		const patStatus = this.createStatus(patSetting.descEl);
		patSetting
			.addText((text) => {
				text.inputEl.type = "password";
				text.inputEl.autocomplete = "off";
				text.inputEl.spellcheck = false;
				this.bindText(text, "pat", settings.pat, (value) => value.trim());
			})
			.addExtraButton((button) => {
				this.addCheckButton(
					button,
					patStatus,
					"检测连通性",
					"正在连接 GitHub…",
					() => this.actions.onCheckPat(),
					(login) => this.setStatus(patStatus, "ok", `✓ 已连接 @${login}`),
					"连接失败",
				);
			});

		// --- Step 2: content repository ---
		const contentSetting = new Setting(containerEl)
			.setName("博客文章仓库")
			.setDesc("当前 Vault 对应的文章仓库；留空自动识别（Git 克隆目录或 Vault 名称）。");
		const contentStatus = this.createStatus(contentSetting.descEl);
		contentSetting
			.addText((text) => {
				text.setPlaceholder("自动识别");
				this.bindText(text, "repoName", settings.repoName, (value) => value.trim());
			})
			.addExtraButton((button) => {
				this.addCheckButton(
					button,
					contentStatus,
					"检测仓库",
					"正在检测文章仓库…",
					() => this.actions.onCheckContentRepo(),
					(result) => this.setStatus(
						contentStatus,
						result.ready ? "ok" : "error",
						result.ready
							? `✓ 已就绪：本地内容将推送到 ${result.repository?.owner}/${result.repository?.name}`
							: "✗ 未解析出仓库名：请在上方填写文章仓库名",
					),
					"文章仓库检测失败",
				);
			});

		// --- Step 3: blog (theme) repository ---
		const blogSetting = new Setting(containerEl)
			.setName("博客样式仓库")
			.setDesc("Setup 创建的公开博客仓库；留空默认 你的用户名.github.io。");
		const blogStatus = this.createStatus(blogSetting.descEl);
		blogSetting
			.addText((text) => {
				text.setPlaceholder("yourname.github.io");
				this.bindText(text, "blogRepoName", settings.blogRepoName, (value) => value.trim());
			})
			.addExtraButton((button) => {
				this.addCheckButton(
					button,
					blogStatus,
					"检测仓库",
					"正在检测样式仓库…",
					() => this.actions.onCheckBlogRepo(),
					(result) => this.setStatus(
						blogStatus,
						"ok",
						`✓ 已就绪：${result.repository?.name}（不存在将自动创建，已存在将覆盖为最新主题）`,
					),
					"样式仓库检测失败",
				);
			});

		// --- Step 4: readiness ---
		const readySetting = new Setting(containerEl)
			.setName("就绪检测")
			.setDesc("两个仓库均解析出名字后，即可执行「部署主题」。");
		const readyStatus = this.createStatus(readySetting.descEl);
		readySetting
			.addExtraButton((button) => {
				this.addCheckButton(
					button,
					readyStatus,
					"检测就绪状态",
					"正在检查部署配置…",
					() => this.actions.onCheckReady(),
					() => this.setStatus(
						readyStatus,
						"ok",
						"✓ 双仓库已就绪，点击「部署主题」完成初始化与首次部署",
					),
					"就绪检测失败",
				);
			});

		// --- Advanced ---
		new Setting(containerEl)
			.setName("主题仓库")
			.setDesc("博客仓库每次构建时强制同步的主题源仓库，一般无需修改。")
			.addText((text) => {
				text.setPlaceholder("57Darling02/VitePress_butterfly");
				this.bindText(text, "themeRepo", settings.themeRepo, (value) => value.trim());
			});

		new Setting(containerEl)
			.setName("启用 GitHub Pages")
			.setDesc("Setup 时尝试把博客仓库的 Pages 配置为 GitHub Actions 构建。")
			.addToggle((toggle) => {
				toggle.setValue(settings.configurePages);
				toggle.onChange((value) => {
					void this.saveSettings({ configurePages: value }).catch((error: unknown) => {
						new Notice(this.errorMessage(error, "保存设置失败"));
					});
				});
			});

		// --- Actions ---
		containerEl.createEl("h3", { text: "操作" });
		this.addAction(containerEl, "部署主题", "将本地内容推送到文章仓库（覆盖云端），配置博客仓库 secrets 与 Pages，并触发首次构建。", "部署中...", this.actions.onSetup);
		this.addAction(containerEl, "触发部署", "直接通知博客仓库重新构建部署（发布请用 obsidian-git 的 Push）。", "触发中...", this.actions.onTrigger);
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
		el.addClass(
			kind === "loading"
				? "vpb-loading"
				: kind === "ok"
					? "vpb-ok"
					: kind === "warn"
						? "vpb-warn"
						: "vpb-error",
		);
	}

	private addCheckButton<T>(
		button: ExtraButtonComponent,
		statusEl: HTMLSpanElement,
		tooltip: string,
		pendingMessage: string,
		run: () => Promise<T>,
		onSuccess: (result: T) => void,
		failureLabel: string,
	): void {
		button.setIcon("search").setTooltip(tooltip);
		button.onClick(() => {
			void this.runCheck(
				button,
				statusEl,
				tooltip,
				pendingMessage,
				run,
				onSuccess,
				failureLabel,
			);
		});
	}

	private async runCheck<T>(
		button: ExtraButtonComponent,
		statusEl: HTMLSpanElement,
		tooltip: string,
		pendingMessage: string,
		run: () => Promise<T>,
		onSuccess: (result: T) => void,
		failureLabel: string,
	): Promise<void> {
		if (button.extraSettingsEl.classList.contains("vpb-check-running")) {
			return;
		}

		button.setDisabled(true).setIcon("loader-2").setTooltip(pendingMessage);
		button.extraSettingsEl.classList.add("vpb-check-running");
		button.extraSettingsEl.setAttribute("aria-busy", "true");
		this.setStatus(statusEl, "loading", pendingMessage);

		// Let Obsidian paint the loading state before starting native networking.
		await yieldToUi();

		try {
			onSuccess(await run());
		} catch (error) {
			const detail = this.errorMessage(error, failureLabel);
			this.setStatus(
				statusEl,
				"error",
				detail === failureLabel ? `✗ ${failureLabel}` : `✗ ${failureLabel}：${detail}`,
			);
		} finally {
			button.setDisabled(false).setIcon("search").setTooltip(tooltip);
			button.extraSettingsEl.classList.remove("vpb-check-running");
			button.extraSettingsEl.removeAttribute("aria-busy");
		}
	}

	private bindText(
		text: TextComponent,
		key: Exclude<keyof PluginSettings, "configurePages" | "publishedPaths">,
		value: string,
		normalize: (value: string) => string,
	): void {
		text.setValue(value);
		text.onChange((nextValue) => {
			void this.saveSettings({ [key]: normalize(nextValue) }).catch((error: unknown) => {
				new Notice(this.errorMessage(error, "保存设置失败"));
			});
		});
	}

	private addAction(
		containerEl: HTMLElement,
		name: string,
		description: string,
		pendingLabel: string,
		action: () => Promise<unknown>,
		isCta = false,
	): void {
		new Setting(containerEl)
			.setName(name)
			.setDesc(description)
			.addButton((button) => {
				button.setButtonText(name);
				if (isCta) {
					button.setCta();
				}
				this.actionButtons.push(button);
				button.onClick(() => this.runAction(button, name, pendingLabel, action));
			});
	}

	private async runAction(
		button: ButtonComponent,
		label: string,
		pendingLabel: string,
		action: () => Promise<unknown>,
	): Promise<void> {
		if (this.isActionRunning) {
			return;
		}

		this.isActionRunning = true;
		this.actionButtons.forEach((item) => item.setDisabled(true));
		button.setButtonText(pendingLabel);
		await yieldToUi();

		try {
			await action();
		} catch (error) {
			new Notice(this.errorMessage(error, `${label}失败`));
		} finally {
			this.isActionRunning = false;
			this.actionButtons.forEach((item) => item.setDisabled(false));
			button.setButtonText(label);
		}
	}

	private errorMessage(error: unknown, fallback: string): string {
		return error instanceof Error && error.message ? error.message : fallback;
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
