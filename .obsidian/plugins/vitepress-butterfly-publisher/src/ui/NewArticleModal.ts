import { App, Modal, Notice, Setting } from "obsidian";

export interface NewArticleInput {
	title: string;
	directory?: string;
}

export class NewArticleModal extends Modal {
	private title = "";
	private directory = "";
	private isSubmitting = false;

	constructor(
		app: App,
		private readonly onSubmit: (input: NewArticleInput) => Promise<void>,
	) {
		super(app);
	}

	onOpen(): void {
		this.title = "";
		this.directory = "";
		this.isSubmitting = false;

		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "新建文章" });

		const formEl = contentEl.createEl("form");
		formEl.addEventListener("submit", (event) => {
			event.preventDefault();
			void this.submit();
		});

		let titleInput: HTMLInputElement | undefined;
		new Setting(formEl)
			.setName("标题")
			.setDesc("文章文件名将由标题生成。")
			.addText((text) => {
				text.setPlaceholder("输入文章标题");
				text.onChange((value) => {
					this.title = value;
				});
				titleInput = text.inputEl;
			});

		new Setting(formEl)
			.setName("目录")
			.setDesc("留空则创建在 Vault 根目录。")
			.addText((text) => {
				text.setPlaceholder("例如 tutorial");
				text.onChange((value) => {
					this.directory = value;
				});
			});

		const actionsEl = formEl.createDiv({ cls: "modal-button-container" });
		const cancelButton = actionsEl.createEl("button", { text: "取消", type: "button" });
		cancelButton.addEventListener("click", () => this.close());

		actionsEl.createEl("button", {
			text: "创建文章",
			cls: "mod-cta",
			type: "submit",
		});

		window.setTimeout(() => titleInput?.focus(), 0);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async submit(): Promise<void> {
		if (this.isSubmitting) {
			return;
		}

		const title = this.title.trim();
		if (!title) {
			new Notice("请输入文章标题");
			return;
		}

		this.isSubmitting = true;
		try {
			const directory = this.directory.trim();
			await this.onSubmit({ title, ...(directory ? { directory } : {}) });
			this.close();
		} catch (error) {
			new Notice(error instanceof Error && error.message ? error.message : "创建文章失败");
		} finally {
			this.isSubmitting = false;
		}
	}
}
