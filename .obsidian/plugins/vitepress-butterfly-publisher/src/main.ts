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
				onCheckPat: () => this.blog.checkPat(),
				onCheckContentRepo: () => this.blog.checkContentRepo(),
				onCheckBlogRepo: () => this.blog.checkBlogRepo(),
				onCheckReady: () => this.blog.checkReady(),
				onSetup: () => this.blog.setup(),
				onTrigger: () => this.blog.triggerDeploy(),
				onClone: () => this.blog.cloneToVault(),
			}),
		);

		this.addCommand({
			id: "setup-blog",
			name: "触发 Setup（创建博客仓库）",
			callback: () => this.runWithFeedback("触发 Setup", () => this.blog.setup()),
		});
		this.addCommand({
			id: "clone-repo",
			name: "克隆文章仓库到本地",
			callback: () => this.runWithFeedback("克隆", () => this.blog.cloneToVault()),
		});
		this.addCommand({
			id: "trigger-deploy",
			name: "触发博客重建",
			callback: () => this.runWithFeedback("触发部署", () => this.blog.triggerDeploy()),
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
