import {
	App,
	ButtonComponent,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TextComponent,
} from "obsidian";

export interface PluginSettings {
	pat: string;
	/** Current content repository name (the vault's own repository). */
	repoName: string;
	/** Public blog repository name, used by the Setup workflow. */
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
	onValidate(): Promise<unknown>;
	onSetup(): Promise<unknown>;
	onTrigger(): Promise<unknown>;
	onPull(): Promise<unknown>;
	onPush(): Promise<unknown>;
	onForcePush(): Promise<unknown>;
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
			text: "当前 Vault 就是文章仓库。填入 GitHub PAT 后即可触发 Setup、发布文章、拉取更新，全程无需安装 Git。",
		});

		const settings = this.getSettings();

		new Setting(containerEl)
			.setName("GitHub PAT")
			.setDesc("需要 repo + workflow 权限。仅保存在本机插件设置中，不会上传。")
			.addText((text) => {
				text.inputEl.type = "password";
				text.inputEl.autocomplete = "off";
				text.inputEl.spellcheck = false;
				this.bindText(text, "pat", settings.pat, (value) => value.trim());
			});

		new Setting(containerEl)
			.setName("文章仓库名")
			.setDesc("留空时自动识别（Git 克隆目录或 Vault 名称匹配）；首次 Setup 未识别到时会以该名称创建仓库，默认使用 Vault 名称。")
			.addText((text) => {
				text.setPlaceholder("自动识别");
				this.bindText(text, "repoName", settings.repoName, (value) => value.trim());
			});

		new Setting(containerEl)
			.setName("博客仓库名")
			.setDesc("Setup 工作流创建的公开博客仓库名；留空则使用 你的用户名.github.io。")
			.addText((text) => {
				text.setPlaceholder("yourname.github.io");
				this.bindText(text, "blogRepoName", settings.blogRepoName, (value) => value.trim());
			});

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

		containerEl.createEl("h3", { text: "操作" });
		this.addAction(containerEl, "验证配置", "检查 PAT 与仓库访问，并显示 Setup 状态。", "验证中...", this.actions.onValidate);
		this.addAction(containerEl, "触发 Setup", "配置 Actions secrets 并运行 Setup 工作流，创建博客仓库。", "Setup 运行中...", this.actions.onSetup);
		this.addAction(containerEl, "拉取最新", "用云端 main 分支内容覆盖当前 Vault（本地未发布内容移入回收站）。", "拉取中...", this.actions.onPull);
		this.addAction(containerEl, "推送发布", "将 Vault 变更提交到云端并触发博客构建；云端有更新时会询问。", "发布中...", this.actions.onPush, true);
		this.addAction(containerEl, "强制推送", "放弃云端已有更新，直接用本地内容覆盖（谨慎）。", "强制发布中...", this.actions.onForcePush);
		this.addAction(containerEl, "触发部署", "不发布内容，仅通知博客仓库重新构建部署。", "触发中...", this.actions.onTrigger);
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
