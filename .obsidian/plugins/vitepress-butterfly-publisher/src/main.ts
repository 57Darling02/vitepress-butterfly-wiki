import { Notice, Plugin } from "obsidian";

import {
	DEFAULT_SETTINGS,
	PluginSettings,
	PublisherSettingsTab,
} from "./settings";
import { BlogService } from "./services/blog";
import { NewArticleModal } from "./ui/NewArticleModal";
import { TFile } from "obsidian";

export default class VitePressButterflyPublisher extends Plugin {
	settings!: PluginSettings;
	private blog!: BlogService;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.blog = new BlogService({
			app: this.app,
			getSettings: () => this.settings,
			saveSettings: async (changes) => {
				this.settings = { ...this.settings, ...changes };
				await this.saveData(this.settings);
			},
		});

		this.addSettingTab(
			new PublisherSettingsTab(this.app, this, () => this.settings, (changes) => this.updateSettings(changes), {
				onValidate: () => this.runWithFeedback("验证配置", () => this.blog.validate().then((result) => {
					const state = result.setupSecretsPresent ? "Setup 已完成" : "Setup 未完成";
					if (result.repository) {
						new Notice(`验证通过：@${result.login}，仓库 ${result.repository.owner}/${result.repository.name}（${state}）`);
					} else {
						new Notice(`验证通过：@${result.login}。未识别到文章仓库，触发 Setup 时会自动创建。`);
					}
				})),
				onSetup: () => this.blog.setup(),
				onTrigger: () => this.blog.triggerDeploy(),
				onPull: () => this.blog.pull(),
				onPush: () => this.blog.push(),
				onForcePush: () => this.blog.forcePush(),
			}),
		);

		this.addCommand({
			id: "push-blog",
			name: "推送发布博客",
			callback: () => this.runWithFeedback("推送发布", () => this.blog.push()),
		});
		this.addCommand({
			id: "pull-blog",
			name: "拉取云端最新内容",
			callback: () => this.runWithFeedback("拉取最新", () => this.blog.pull()),
		});
		this.addCommand({
			id: "setup-blog",
			name: "触发 Setup（创建博客仓库）",
			callback: () => this.runWithFeedback("触发 Setup", () => this.blog.setup()),
		});
		this.addCommand({
			id: "new-article",
			name: "新建博客文章",
			callback: () => {
				new NewArticleModal(this.app, async (input) => {
					await this.createArticle(input.title, input.directory ?? "");
				}).open();
			},
		});
	}

	onunload(): void {
		// Nothing to clean up.
	}

	async loadSettings(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
	}

	async updateSettings(changes: Partial<PluginSettings>): Promise<void> {
		this.settings = { ...this.settings, ...changes };
		await this.saveData(this.settings);
	}


	private async createArticle(title: string, directory: string): Promise<void> {
		const safeName = title.trim().replace(/[\\/:*?"<>|#^\[\]]/g, "-").replace(/\s+/g, "-");
		if (!safeName) {
			throw new Error("无法从标题生成文件名。");
		}

		const folder = directory.trim().replace(/^\/+|\/+$/g, "");
		const path = folder ? `${folder}/${safeName}.md` : `${safeName}.md`;
		if (this.app.vault.getFileByPath(path)) {
			throw new Error(`文件已存在：${path}`);
		}

		const frontmatter = [
			"---",
			`title: ${title.trim()}`,
			`date: ${new Date().toISOString().slice(0, 10)}`,
			"layout: doc",
			"---",
			"",
			`# ${title.trim()}`,
			"",
		].join("\n");

		if (folder) {
			await this.app.vault.createFolder(folder).catch(() => undefined);
		}
		const file = await this.app.vault.create(path, frontmatter);
		this.app.workspace.getLeaf(false).openFile(file as TFile);
	}

	private async runWithFeedback(name: string, action: () => Promise<unknown>): Promise<void> {
		try {
			await action();
		} catch (error) {
			new Notice(`${name}失败：${error instanceof Error ? error.message : String(error)}`);
		}
	}
}
