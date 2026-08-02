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

import type { RepoCheckResult, ReadyCheckResult } from "./services/blog";

export interface PluginSettings {
	pat: string;
	/** Current content repository name (the vault's own repository). */
	repoName: string;
	/** Public blog (theme) repository name. */
	blogRepoName: string;
	/** Theme source repository, used by the Setup workflow. */
	themeRepo: string;
	/** Template repository used to create the content repository on first Setup. */
	templateRepo: string;
	/** Whether Setup should try to enable GitHub Pages. */
	configurePages: boolean;
	/** Paths published by the last successful push. */
	publishedPaths: string[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
	pat: "",
	repoName: "",
	blogRepoName: "",
	themeRepo: "57Darling02/VitePress_butterfly",
	templateRepo: "57Darling02/vitepress-butterfly-wiki",
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
	/** Step 4: both repositories' secrets completeness. */
	onCheckReady(): Promise<ReadyCheckResult>;
	onSetup(): Promise<unknown>;
	onTrigger(): Promise<unknown>;
	onClone(): Promise<unknown>;
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
			text: "本插件负责初始化与部署：创建仓库、配置 secrets、触发 Setup。日常的发布与拉取请使用内置的 obsidian-git 插件（桌面端与移动端均可）。",
		});

		const settings = this.getSettings();

		// --- Step 1: PAT ---
		const patStatus = this.createStatus(containerEl);
		new Setting(containerEl)
			.setName("GitHub PAT")
			.setDesc("需要 repo + workflow 权限，仅保存在本机。")
			.addText((text) => {
				text.inputEl.type = "password";
				text.inputEl.autocomplete = "off";
				text.inputEl.spellcheck = false;
				this.bindText(text, "pat", settings.pat, (value) => value.trim());
			})
			.addExtraButton((button) => {
				this.addCheckButton(button, "检测连通性", () => this.actions.onCheckPat().then(
					(login) => this.setStatus(patStatus, "ok", `✓ 已连接 @${login}`),
					(error) => this.setStatus(patStatus, "error", this.errorMessage(error, "✗ 连接失败")),
				));
			});

		// --- Step 2: content repository ---
		const contentStatus = this.createStatus(containerEl);
		new Setting(containerEl)
			.setName("博客文章仓库")
			.setDesc("当前 Vault 对应的文章仓库；留空自动识别（Git 克隆目录或 Vault 名称）。")
			.addText((text) => {
				text.setPlaceholder("自动识别");
				this.bindText(text, "repoName", settings.repoName, (value) => value.trim());
			})
			.addExtraButton((button) => {
				this.addCheckButton(button, "检测仓库", () => this.actions.onCheckContentRepo().then(
					(result) => this.setStatus(
						contentStatus,
						result.accessible ? "ok" : "warn",
						result.accessible
							? `✓ 可访问 ${result.repository?.owner}/${result.repository?.name}`
							: "未识别到可访问的仓库（触发 Setup 会自动创建）",
					),
					(error) => this.setStatus(contentStatus, "error", this.errorMessage(error, "✗ 检测失败")),
				));
			});

		// --- Step 3: blog (theme) repository ---
		const blogStatus = this.createStatus(containerEl);
		new Setting(containerEl)
			.setName("博客样式仓库")
			.setDesc("Setup 创建的公开博客仓库；留空默认 你的用户名.github.io。")
			.addText((text) => {
				text.setPlaceholder("yourname.github.io");
				this.bindText(text, "blogRepoName", settings.blogRepoName, (value) => value.trim());
			})
			.addExtraButton((button) => {
				this.addCheckButton(button, "检测仓库", () => this.actions.onCheckBlogRepo().then(
					(result) => this.setStatus(
						blogStatus,
						result.accessible ? "ok" : "warn",
						result.accessible
							? `✓ 可访问 ${result.repository?.owner}/${result.repository?.name}`
							: "仓库不存在（触发 Setup 时会创建）",
					),
					(error) => this.setStatus(blogStatus, "error", this.errorMessage(error, "✗ 检测失败")),
				));
			});

		// --- Step 4: readiness ---
		const readyStatus = this.createStatus(containerEl);
		new Setting(containerEl)
			.setName("就绪检测")
			.setDesc("检查两个仓库的 Actions secrets 是否完整配置。")
			.addExtraButton((button) => {
				this.addCheckButton(button, "检测就绪状态", () => this.actions.onCheckReady().then(
					(result) => this.setStatus(
						readyStatus,
						result.ready ? "ok" : "warn",
						result.ready
							? "✓ 全部就绪，推送即可自动部署"
							: this.readinessText(result),
					),
					(error) => this.setStatus(readyStatus, "error", this.errorMessage(error, "✗ 检测失败")),
				));
			});

		// --- Advanced ---
		new Setting(containerEl)
			.setName("主题仓库")
			.setDesc("Setup 工作流 fork 的主题源仓库，一般无需修改。")
			.addText((text) => {
				text.setPlaceholder("57Darling02/VitePress_butterfly");
				this.bindText(text, "themeRepo", settings.themeRepo, (value) => value.trim());
			});

		new Setting(containerEl)
			.setName("模板仓库")
			.setDesc("首次 Setup 时用于创建文章仓库的模板源，一般无需修改。")
			.addText((text) => {
				text.setPlaceholder("57Darling02/vitepress-butterfly-wiki");
				this.bindText(text, "templateRepo", settings.templateRepo, (value) => value.trim());
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
		this.addAction(containerEl, "触发 Setup", "创建博客仓库并配置全部 secrets 与首次部署，完成后自动克隆到本地。", "Setup 运行中...", this.actions.onSetup);
		this.addAction(containerEl, "克隆到本地", "生成 .git 工作副本，之后可用 obsidian-git 进行 Commit / Push / Pull。", "克隆中...", this.actions.onClone);
		this.addAction(containerEl, "触发部署", "通知博客仓库重新构建部署（发布请用 obsidian-git 的 Push）。", "触发中...", this.actions.onTrigger);
	}

	private createStatus(containerEl: HTMLElement): HTMLSpanElement {
		const span = containerEl.createSpan({ cls: "vitepress-butterfly-check-status" });
		span.textContent = "未检测";
		return span;
	}

	private setStatus(
		el: HTMLSpanElement,
		kind: "ok" | "warn" | "error",
		message: string,
	): void {
		el.textContent = message;
		el.removeClass("vpb-ok", "vpb-warn", "vpb-error");
		el.addClass(kind === "ok" ? "vpb-ok" : kind === "warn" ? "vpb-warn" : "vpb-error");
	}

	private addCheckButton(
		button: ExtraButtonComponent,
		tooltip: string,
		run: () => Promise<void>,
	): void {
		button.setIcon("search").setTooltip(tooltip);
		button.onClick(() => {
			button.setDisabled(true);
			void run().finally(() => button.setDisabled(false));
		});
	}

	private readinessText(result: ReadyCheckResult): string {
		const parts: string[] = [];
		if (result.contentMissing.length > 0) {
			parts.push(`文章仓库缺：${result.contentMissing.join("、")}`);
		}
		if (result.blogMissing.length > 0) {
			parts.push(`样式仓库缺：${result.blogMissing.join("、")}`);
		}
		return `未就绪（${parts.join("；")}），请先触发 Setup`;
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

	private runAction(
		button: ButtonComponent,
		label: string,
		pendingLabel: string,
		action: () => Promise<unknown>,
	): void {
		if (this.isActionRunning) {
			return;
		}

		this.isActionRunning = true;
		this.actionButtons.forEach((item) => item.setDisabled(true));
		button.setButtonText(pendingLabel);

		void action()
			.catch((error: unknown) => new Notice(this.errorMessage(error, `${label}失败`)))
			.finally(() => {
				this.isActionRunning = false;
				this.actionButtons.forEach((item) => item.setDisabled(false));
				button.setButtonText(label);
			});
	}

	private errorMessage(error: unknown, fallback: string): string {
		return error instanceof Error && error.message ? error.message : fallback;
	}
}
