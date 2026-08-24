import {
	App,
	FuzzySuggestModal,
	Modal,
	Notice,
	Setting,
	setIcon,
} from "obsidian";

import {
	type CommentsConfig,
	type FriendLink,
	type MenuItem,
	type SiteConfig,
	SiteConfigService,
	type SocialLink,
} from "../services/site-config";

type ConfigTab = "general" | "home" | "profile" | "navigation" | "media" | "community";

interface ConfigTabDefinition {
	id: ConfigTab;
	label: string;
	icon: string;
}

const TABS: ConfigTabDefinition[] = [
	{ id: "general", label: "基础", icon: "settings-2" },
	{ id: "home", label: "首页", icon: "layout-template" },
	{ id: "profile", label: "资料", icon: "contact-round" },
	{ id: "navigation", label: "导航", icon: "menu" },
	{ id: "media", label: "媒体", icon: "music-2" },
	{ id: "community", label: "社区", icon: "messages-square" },
];

function errorText(error: unknown): string {
	return error instanceof Error && error.message ? error.message : String(error);
}

/**
 * A lightweight blog-admin form for site_config.yml. All edits stay local to
 * this modal until Save; SiteConfigService handles YAML parsing, validation,
 * unknown-key preservation and external-change conflict detection.
 */
export class SiteConfigModal extends Modal {
	private readonly service: SiteConfigService;
	private activeTab: ConfigTab = "general";
	private config?: SiteConfig;
	private source = "";
	private error: string | null = null;
	private loading = true;
	private saving = false;

	constructor(
		app: App,
		private readonly onSaved: () => void,
	) {
		super(app);
		this.service = new SiteConfigService(app);
	}

	onOpen(): void {
		this.modalEl.addClass("vpb-site-config-modal");
		this.render();
		void this.load();
	}

	onClose(): void {
		this.modalEl.removeClass("vpb-site-config-modal");
		this.contentEl.empty();
	}

	// ------------------------------------------------------------------
	// Lifecycle
	// ------------------------------------------------------------------

	private async load(): Promise<void> {
		try {
			const snapshot = await this.service.load();
			this.config = snapshot.config;
			this.source = snapshot.source;
			this.error = null;
		} catch (error) {
			this.error = errorText(error);
		} finally {
			this.loading = false;
			this.render();
		}
	}

	private render(): void {
		this.contentEl.empty();
		this.contentEl.addClass("vpb-site-config");

		if (this.loading) {
			const loading = this.contentEl.createDiv({ cls: "vpb-config-loading" });
			const icon = loading.createSpan();
			setIcon(icon, "loader-2");
			loading.createSpan({ text: "正在读取站点配置…" });
			return;
		}
		if (!this.config) {
			this.renderFatalError();
			return;
		}

		this.renderHeader();
		this.renderTabs();
		const content = this.contentEl.createDiv({ cls: "vpb-config-content" });
		switch (this.activeTab) {
			case "general":
				this.renderGeneral(content);
				break;
			case "home":
				this.renderHome(content);
				break;
			case "profile":
				this.renderProfile(content);
				break;
			case "navigation":
				this.renderNavigation(content);
				break;
			case "media":
				this.renderMedia(content);
				break;
			case "community":
				this.renderCommunity(content);
				break;
		}
		this.renderFooter();
	}

	private renderHeader(): void {
		const header = this.contentEl.createDiv({ cls: "vpb-config-header" });
		const copy = header.createDiv();
		copy.createEl("h3", { text: "配置站点" });
		copy.createEl("p", { text: "保存后会写入 site_config.yml，发布由 Git 同步完成。" });
		const raw = header.createEl("button", {
			cls: "vpb-icon-button",
			attr: { "aria-label": "打开原始 YAML" },
		});
		setIcon(raw, "file-code-2");
		raw.addEventListener("click", () => {
			void this.openRawConfig();
		});
	}

	private renderTabs(): void {
		const tabs = this.contentEl.createDiv({ cls: "vpb-config-tabs" });
		for (const tab of TABS) {
			const button = tabs.createEl("button", {
				cls: `vpb-config-tab${tab.id === this.activeTab ? " is-active" : ""}`,
				attr: { "aria-label": tab.label },
			});
			setIcon(button, tab.icon);
			button.createSpan({ text: tab.label });
			button.addEventListener("click", () => {
				if (this.activeTab === tab.id) return;
				this.activeTab = tab.id;
				this.error = null;
				this.render();
			});
		}
	}

	private renderFatalError(): void {
		this.contentEl.createEl("h3", { text: "无法读取站点配置" });
		this.contentEl.createEl("div", { text: this.error ?? "未知错误。", cls: "vpb-modal-error" });
		const footer = this.contentEl.createDiv({ cls: "modal-button-container" });
		footer.createEl("button", { text: "重试", cls: "mod-cta" })
			.addEventListener("click", () => {
				this.loading = true;
				this.render();
				void this.load();
			});
		footer.createEl("button", { text: "关闭" }).addEventListener("click", () => this.close());
	}

	private renderFooter(): void {
		if (this.error) {
			this.contentEl.createEl("div", { text: this.error, cls: "vpb-modal-error" });
		}
		const footer = this.contentEl.createDiv({ cls: "modal-button-container vpb-config-footer" });
		footer.createEl("button", { text: "取消", type: "button" })
			.addEventListener("click", () => this.close());
		const save = footer.createEl("button", { text: "保存设置", cls: "mod-cta" });
		save.addEventListener("click", () => {
			void this.save(save);
		});
	}

	private async save(button: HTMLButtonElement): Promise<void> {
		if (!this.config || this.saving) return;
		this.saving = true;
		button.disabled = true;
		button.classList.add("is-pending");
		const loader = button.createSpan({ cls: "vpb-btn-loader" });
		button.insertBefore(loader, button.firstChild);
		setIcon(loader, "loader-2");
		try {
			const snapshot = await this.service.save(this.config, this.source);
			this.source = snapshot.source;
			this.error = null;
			this.onSaved();
			new Notice("站点配置已保存。", 4_000);
			this.close();
		} catch (error) {
			this.error = errorText(error);
			this.saving = false;
			this.render();
			return;
		}
		this.saving = false;
	}

	private async openRawConfig(): Promise<void> {
		const file = this.app.vault.getFileByPath("site_config.yml");
		if (!file) {
			new Notice("请先保存一次站点配置以创建 site_config.yml。", 6_000);
			return;
		}
		await this.app.workspace.getLeaf(false).openFile(file);
	}

	// ------------------------------------------------------------------
	// General / home
	// ------------------------------------------------------------------

	private renderGeneral(container: HTMLElement): void {
		const config = this.requireConfig();
		this.heading(container, "站点信息");
		this.textSetting(container, "站点名称", "浏览器标题和站点主名称。", config.site_name, (value) => {
			config.site_name = value;
		});
		this.textAreaSetting(container, "站点描述", "用于 SEO 描述和分享摘要。", config.site_description, (value) => {
			config.site_description = value;
		});
		this.textSetting(container, "站点域名", "用于 canonical URL 和 sitemap，例如 https://example.com。", config.site_url, (value) => {
			config.site_url = value;
		}, "https://example.com");
		this.dropdownSetting(container, "语言", "页面语言和评论默认语言。", config.lang, {
			"zh-CN": "简体中文",
			"zh-TW": "繁體中文",
			en: "English",
		}, (value) => {
			config.lang = value;
		});
		this.textSetting(container, "作者", "文章与站点的默认作者名。", config.author, (value) => {
			config.author = value;
		});

		this.heading(container, "文章列表");
		this.numberSetting(container, "每页文章数", "首页文章流每页显示的文章数量。", config.pageSize, 1, 100, (value) => {
			config.pageSize = value;
		});
		this.segmentedSetting(container, "排序方式", "首页文章列表的默认排序。", config.sortMethod, [
			{ value: "date", label: "发布日期" },
			{ value: "lastUpdated", label: "最后更新" },
		], (value) => {
			config.sortMethod = value as SiteConfig["sortMethod"];
		});
		this.toggleSetting(container, "显示最后更新时间", "在文章页面显示更新时间。", config.lastUpdated.use, (value) => {
			config.lastUpdated.use = value;
		});

		this.heading(container, "页脚");
		this.textSetting(container, "页脚文案", "页脚第一行文本。", config.footer.message, (value) => {
			config.footer.message = value;
		});
		this.textSetting(container, "版权文案", "页脚第二行文本。", config.footer.copyright, (value) => {
			config.footer.copyright = value;
		});
		this.textSetting(container, "建站日期", "例如 2025-01-01。", config.footer.createdTime, (value) => {
			config.footer.createdTime = value;
		});
	}

	private renderHome(container: HTMLElement): void {
		const config = this.requireConfig();
		this.heading(container, "视觉体验");
		this.assetSetting(container, "背景", "留空使用主题自适应背景；也可填写 HEX 色值或 public/ 资源路径。", config.background, (value) => {
			config.background = value;
		}, true);
		this.toggleSetting(container, "雨滴效果", "在背景上显示轻量雨滴动画。", config.bg_rainfall, (value) => {
			config.bg_rainfall = value;
		});

		this.heading(container, "首页标题");
		this.textSetting(container, "主标题", "首页中央主标题。", config.home.mainTitle, (value) => {
			config.home.mainTitle = value;
		});
		this.stringListSetting(container, "副标题", "首页轮换显示的短句。", config.home.subTitles, (items) => {
			config.home.subTitles = items;
		}, "新增副标题");
	}

	// ------------------------------------------------------------------
	// Profile / navigation
	// ------------------------------------------------------------------

	private renderProfile(container: HTMLElement): void {
		const config = this.requireConfig();
		this.heading(container, "个人资料");
		this.assetSetting(container, "头像", "建议使用 public/ 中的图片，例如 /Avatar.png。", config.avatar, (value) => {
			config.avatar = value;
		});
		this.textSetting(container, "显示名称", "侧栏个人资料卡标题。", config.name, (value) => {
			config.name = value;
		});
		this.textSetting(container, "签名", "显示在个人名称下方。", config.signature, (value) => {
			config.signature = value;
		});
		this.textAreaSetting(container, "简介", "侧栏个人介绍。", config.introduction, (value) => {
			config.introduction = value;
		});

		this.heading(container, "社交链接");
		this.socialLinksSetting(container, config.socialLinks, (items) => {
			config.socialLinks = items;
		});
	}

	private renderNavigation(container: HTMLElement): void {
		const config = this.requireConfig();
		this.heading(container, "导航菜单");
		container.createEl("p", {
			cls: "vpb-config-hint",
			text: "导航栏显示一个顶层菜单入口（图标 + 文字），点击展开子菜单；子菜单项才是实际导航链接。",
		});
		this.menuItemsSetting(container, config.menuItems, (items) => {
			config.menuItems = items;
		});
	}

	// ------------------------------------------------------------------
	// Media / community
	// ------------------------------------------------------------------

	private renderMedia(container: HTMLElement): void {
		const config = this.requireConfig();
		this.heading(container, "导航音乐");
		this.toggleSetting(container, "启用音乐播放器", "在导航栏显示播放器。", config.musicPlayer.enabled, (value) => {
			config.musicPlayer.enabled = value;
		});
		this.textSetting(container, "音频地址", "支持外链音频地址。", config.musicPlayer.url, (value) => {
			config.musicPlayer.url = value;
		});
		this.textSetting(container, "歌曲名称", "播放器显示名称。", config.musicPlayer.name, (value) => {
			config.musicPlayer.name = value;
		});
		this.textSetting(container, "艺术家", "播放器副标题。", config.musicPlayer.artist, (value) => {
			config.musicPlayer.artist = value;
		});
		this.assetSetting(container, "封面", "可选择 public/ 中图片或填写外链。", config.musicPlayer.cover, (value) => {
			config.musicPlayer.cover = value;
		});
		this.toggleSetting(container, "自动播放", "由浏览器策略决定是否实际自动播放。", config.musicPlayer.autoplay, (value) => {
			config.musicPlayer.autoplay = value;
		});
		this.sliderSetting(container, "音量", "默认播放音量。", config.musicPlayer.volume, (value) => {
			config.musicPlayer.volume = value;
		});
	}

	private renderCommunity(container: HTMLElement): void {
		const config = this.requireConfig();
		this.heading(container, "友链");
		this.friendLinksSetting(container, config.friendlink, (items) => {
			config.friendlink = items;
		});

		this.heading(container, "Giscus 评论");
		this.toggleSetting(container, "启用评论", "需要先在 giscus.app 获取仓库和分类标识。", config.comments.enabled, (value) => {
			config.comments.enabled = value;
		});
		this.textSetting(container, "服务地址", "通常保持 https://giscus.app。", config.comments.host, (value) => {
			config.comments.host = value;
		}, "https://giscus.app");
		this.textSetting(container, "仓库", "格式：owner/repository。", config.comments.repo, (value) => {
			config.comments.repo = value;
		});
		this.textSetting(container, "仓库 ID", "Giscus repo-id。", config.comments.repoId, (value) => {
			config.comments.repoId = value;
		});
		this.textSetting(container, "分类", "例如 Announcements。", config.comments.category, (value) => {
			config.comments.category = value;
		});
		this.textSetting(container, "分类 ID", "Giscus category-id。", config.comments.categoryId, (value) => {
			config.comments.categoryId = value;
		});
		this.dropdownSetting(container, "映射方式", "页面与讨论串的映射策略。", config.comments.mapping, {
			title: "标题",
			pathname: "路径",
			url: "完整 URL",
			ogTitle: "OG 标题",
		}, (value) => {
			config.comments.mapping = value;
		});
		this.toggleSetting(container, "严格映射", "只匹配完全一致的页面映射。", config.comments.strict === "1", (value) => {
			config.comments.strict = value ? "1" : "0";
		});
		this.toggleSetting(container, "显示反应", "在评论区显示 GitHub 反应。", config.comments.reactionsEnabled === "1", (value) => {
			config.comments.reactionsEnabled = value ? "1" : "0";
		});
		this.toggleSetting(container, "输出元数据", "让 Giscus 向页面发送 discussion metadata。", config.comments.emitMetadata === "1", (value) => {
			config.comments.emitMetadata = value ? "1" : "0";
		});
		this.dropdownSetting(container, "输入框位置", "新评论输入框显示的位置。", config.comments.inputPosition, {
			top: "顶部",
			bottom: "底部",
		}, (value) => {
			config.comments.inputPosition = value;
		});
		this.dropdownSetting(container, "评论主题", "跟随站点或固定评论区主题。", config.comments.theme, {
			preferred_color_scheme: "跟随系统",
			light: "浅色",
			dark: "深色",
		}, (value) => {
			config.comments.theme = value;
		});
		this.dropdownSetting(container, "评论语言", "Giscus 界面语言。", config.comments.lang, {
			"zh-CN": "简体中文",
			"zh-TW": "繁體中文",
			en: "English",
		}, (value) => {
			config.comments.lang = value;
		});
		this.dropdownSetting(container, "加载方式", "lazy 可延后加载评论区。", config.comments.loading, {
			lazy: "延后加载",
			eager: "立即加载",
		}, (value) => {
			config.comments.loading = value;
		});
	}

	// ------------------------------------------------------------------
	// Field helpers
	// ------------------------------------------------------------------

	private heading(container: HTMLElement, text: string): void {
		container.createEl("h4", { text, cls: "vpb-config-heading" });
	}

	private textSetting(
		container: HTMLElement,
		name: string,
		desc: string,
		value: string,
		onChange: (value: string) => void,
		placeholder = "",
	): void {
		new Setting(container)
			.setName(name)
			.setDesc(desc)
			.addText((text) => {
				text.setValue(value);
				if (placeholder) text.setPlaceholder(placeholder);
				text.onChange(onChange);
			});
	}

	private textAreaSetting(
		container: HTMLElement,
		name: string,
		desc: string,
		value: string,
		onChange: (value: string) => void,
	): void {
		new Setting(container)
			.setName(name)
			.setDesc(desc)
			.addTextArea((text) => {
				text.setValue(value);
				text.inputEl.rows = 3;
				text.onChange(onChange);
			});
	}

	private numberSetting(
		container: HTMLElement,
		name: string,
		desc: string,
		value: number,
		minimum: number,
		maximum: number,
		onChange: (value: number) => void,
	): void {
		new Setting(container)
			.setName(name)
			.setDesc(desc)
			.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.min = String(minimum);
				text.inputEl.max = String(maximum);
				text.setValue(String(value));
				text.onChange((next) => {
					const number = Number(next);
					if (Number.isInteger(number) && number >= minimum && number <= maximum) {
						onChange(number);
					}
				});
			});
	}

	private toggleSetting(
		container: HTMLElement,
		name: string,
		desc: string,
		value: boolean,
		onChange: (value: boolean) => void,
	): void {
		new Setting(container)
			.setName(name)
			.setDesc(desc)
			.addToggle((toggle) => {
				toggle.setValue(value);
				toggle.onChange(onChange);
			});
	}

	private dropdownSetting(
		container: HTMLElement,
		name: string,
		desc: string,
		value: string,
		options: Record<string, string>,
		onChange: (value: string) => void,
	): void {
		new Setting(container)
			.setName(name)
			.setDesc(desc)
			.addDropdown((dropdown) => {
				dropdown.addOptions(options);
				dropdown.setValue(value in options ? value : Object.keys(options)[0]);
				dropdown.onChange(onChange);
			});
	}

	private segmentedSetting(
		container: HTMLElement,
		name: string,
		desc: string,
		value: string,
		options: { value: string; label: string }[],
		onChange: (value: string) => void,
	): void {
		const setting = new Setting(container).setName(name).setDesc(desc);
		const segment = setting.controlEl.createDiv({ cls: "vpb-segmented" });
		for (const option of options) {
			const button = segment.createEl("button", {
				text: option.label,
				cls: option.value === value ? "is-active" : "",
			});
			button.addEventListener("click", () => {
				onChange(option.value);
				segment.querySelectorAll("button").forEach((item) => {
					item.classList.toggle("is-active", item === button);
				});
			});
		}
	}

	private sliderSetting(
		container: HTMLElement,
		name: string,
		desc: string,
		value: number,
		onChange: (value: number) => void,
	): void {
		new Setting(container)
			.setName(name)
			.setDesc(desc)
			.addSlider((slider) => {
				slider.setLimits(0, 1, 0.1);
				slider.setDisplayFormat((next) => `${Math.round(next * 100)}%`);
				slider.setValue(value);
				slider.onChange(onChange);
			});
	}

	private assetSetting(
		container: HTMLElement,
		name: string,
		desc: string,
		value: string,
		onChange: (value: string) => void,
		allowColor = false,
	): void {
		const setting = new Setting(container)
			.setName(name)
			.setDesc(desc)
			.addText((text) => {
				text.setValue(value);
				text.setPlaceholder(allowColor ? "#1e293b 或 /image/background.webp" : "/image/avatar.png");
				text.onChange(onChange);
			})
			.addExtraButton((button) => {
				button.setIcon("image");
				button.setTooltip("从 public/ 选择图片");
				button.onClick(() => {
					void this.chooseAsset((asset) => {
						onChange(asset);
						const input = setting.controlEl.querySelector<HTMLInputElement>("input");
						if (input) input.value = asset;
					});
				});
			});
	}

	// ------------------------------------------------------------------
	// Editable lists
	// ------------------------------------------------------------------

	private stringListSetting(
		container: HTMLElement,
		name: string,
		desc: string,
		items: string[],
		onChange: (items: string[]) => void,
		addLabel: string,
	): void {
		const section = this.listSection(container, name, desc);
		const list = section.createDiv({ cls: "vpb-config-list" });
		const render = (): void => {
			list.empty();
			items.forEach((item, index) => {
				const row = list.createDiv({ cls: "vpb-list-row" });
				const input = row.createEl("input", { type: "text", value: item });
				input.addEventListener("input", () => {
					items[index] = input.value;
					onChange([...items]);
				});
				this.rowButtons(row, index, items.length, () => {
					items.splice(index, 1);
					onChange([...items]);
					render();
				}, () => {
					move(items, index, -1);
					onChange([...items]);
					render();
				}, () => {
					move(items, index, 1);
					onChange([...items]);
					render();
				});
			});
		};
		render();
		this.addListButton(section, addLabel, () => {
			items.push("");
			onChange([...items]);
			render();
		});
	}

	private socialLinksSetting(
		container: HTMLElement,
		items: SocialLink[],
		onChange: (items: SocialLink[]) => void,
	): void {
		const section = this.listSection(container, "社交链接", "显示在侧栏资料卡中的外部链接。");
		const list = section.createDiv({ cls: "vpb-config-list" });
		const render = (): void => {
			list.empty();
			items.forEach((item, index) => {
				const row = list.createDiv({ cls: "vpb-config-record" });
				this.recordText(row, "名称", item.name, (value) => { item.name = value; onChange([...items]); });
				this.recordText(row, "图标", item.icon, (value) => { item.icon = value; onChange([...items]); }, "github 或 fa-brands fa-github");
				this.recordText(row, "自定义图标", item.iconUrl ?? "", (value) => { item.iconUrl = value || undefined; onChange([...items]); }, "/image/github.svg");
				this.recordText(row, "链接", item.url, (value) => { item.url = value; onChange([...items]); }, "https://...");
				this.rowButtons(row, index, items.length, () => {
					items.splice(index, 1);
					onChange([...items]);
					render();
				}, () => { move(items, index, -1); onChange([...items]); render(); }, () => { move(items, index, 1); onChange([...items]); render(); });
			});
		};
		render();
		this.addListButton(section, "新增社交链接", () => {
			items.push({ name: "", icon: "link", url: "" });
			onChange([...items]);
			render();
		});
	}

	private friendLinksSetting(
		container: HTMLElement,
		items: FriendLink[],
		onChange: (items: FriendLink[]) => void,
	): void {
		const section = this.listSection(container, "友链列表", "友链页面读取这组数据。", "vpb-config-list-section");
		const list = section.createDiv({ cls: "vpb-config-list" });
		const render = (): void => {
			list.empty();
			items.forEach((item, index) => {
				const row = list.createDiv({ cls: "vpb-config-record" });
				this.recordText(row, "名称", item.Name, (value) => { item.Name = value; onChange([...items]); });
				this.recordText(row, "链接", item.Url, (value) => { item.Url = value; onChange([...items]); }, "https://...");
				this.recordText(row, "头像", item.Avatar, (value) => { item.Avatar = value; onChange([...items]); });
				this.recordText(row, "简介", item.Desc, (value) => { item.Desc = value; onChange([...items]); });
				this.rowButtons(row, index, items.length, () => {
					items.splice(index, 1);
					onChange([...items]);
					render();
				}, () => { move(items, index, -1); onChange([...items]); render(); }, () => { move(items, index, 1); onChange([...items]); render(); });
			});
		};
		render();
		this.addListButton(section, "新增友链", () => {
			items.push({ Name: "", Url: "", Avatar: "", Desc: "" });
			onChange([...items]);
			render();
		});
	}

	private menuItemsSetting(
		container: HTMLElement,
		items: MenuItem[],
		onChange: (items: MenuItem[]) => void,
	): void {
		const notify = (): void => onChange([...items]);
		const render = (): void => {
			container.empty();

			// Top level: exactly one menu container (icon + text, no link).
			const topSection = this.listSection(
				container,
				"顶层菜单",
				"最上层只能有一个菜单入口，不配置链接。",
			);
			if (items.length === 0) {
				this.addListButton(topSection, "新增导航菜单", () => {
					items.push(newMenuItem(items, true));
					notify();
					render();
				});
				return;
			}

			const item = items[0];
			const topRow = topSection.createDiv({ cls: "vpb-config-record" });
			this.recordText(topRow, "名称", item.label, (value) => { item.label = value; notify(); });
			this.recordText(topRow, "图标", item.icon ?? "", (value) => { item.icon = value || undefined; notify(); }, "compass 或 fa-brands fa-github");
			const topActions = topRow.createDiv({ cls: "vpb-record-actions" });
			this.smallButton(topActions, "删除顶层菜单", "trash-2", () => {
				items.splice(0, 1);
				notify();
				render();
			}, false, true);

			// Second level: the actual navigation links.
			const children = (item.children ??= []);
			const listSection = this.listSection(
				container,
				"子菜单项",
				"点击顶层菜单后展开的导航链接，每项配置图标、文字和链接。",
			);
			const list = listSection.createDiv({ cls: "vpb-config-list" });
			const renderChildren = (): void => {
				list.empty();
				children.forEach((child, index) => {
					const row = list.createDiv({ cls: "vpb-config-record" });
					this.recordText(row, "名称", child.label, (value) => { child.label = value; notify(); });
					this.recordText(row, "图标", child.icon ?? "", (value) => { child.icon = value || undefined; notify(); }, "users 或 fa-brands fa-github");
					this.recordText(row, "链接", child.link ?? "", (value) => { child.link = value || undefined; notify(); }, "/FriendLink/ 或 https://...");
					this.rowButtons(row, index, children.length, () => {
						children.splice(index, 1);
						notify();
						renderChildren();
					}, () => { move(children, index, -1); notify(); renderChildren(); }, () => { move(children, index, 1); notify(); renderChildren(); });
				});
			};
			renderChildren();
			this.addListButton(listSection, "新增导航项", () => {
				children.push(newMenuItem(children));
				notify();
				renderChildren();
			});
		};
		render();
	}

	private listSection(container: HTMLElement, name: string, desc: string, cls = ""): HTMLElement {
		const section = container.createDiv({ cls: `vpb-list-section ${cls}`.trim() });
		section.createEl("h5", { text: name });
		section.createEl("p", { text: desc, cls: "vpb-config-hint" });
		return section;
	}

	private addListButton(container: HTMLElement, label: string, onClick: () => void): void {
		const button = container.createEl("button", { text: label, cls: "vpb-list-add" });
		button.addEventListener("click", onClick);
	}

	private rowButtons(
		container: HTMLElement,
		index: number,
		length: number,
		onRemove: () => void,
		onUp: () => void,
		onDown: () => void,
	): void {
		const actions = container.createDiv({ cls: "vpb-record-actions" });
		this.smallButton(actions, "上移", "arrow-up", onUp, index === 0);
		this.smallButton(actions, "下移", "arrow-down", onDown, index === length - 1);
		this.smallButton(actions, "删除", "trash-2", onRemove, false, true);
	}

	private smallButton(
		container: HTMLElement,
		label: string,
		icon: string,
		onClick: () => void,
		disabled = false,
		warning = false,
	): void {
		const button = container.createEl("button", {
			cls: `vpb-icon-button${warning ? " is-warning" : ""}`,
			attr: { "aria-label": label },
		});
		button.disabled = disabled;
		setIcon(button, icon);
		button.addEventListener("click", onClick);
	}

	private recordText(
		container: HTMLElement,
		label: string,
		value: string,
		onChange: (value: string) => void,
		placeholder = "",
	): void {
		const field = container.createDiv({ cls: "vpb-record-field" });
		field.createEl("label", { text: label });
		const input = field.createEl("input", { type: "text", value });
		if (placeholder) input.placeholder = placeholder;
		input.addEventListener("input", () => onChange(input.value));
	}

	private async chooseAsset(onChoose: (path: string) => void): Promise<void> {
		const assets = await this.service.listPublicAssets();
		if (assets.length === 0) {
			new Notice("public/ 目录中没有可选图片。", 5_000);
			return;
		}
		new AssetSuggestModal(this.app, assets, onChoose).open();
	}

	private requireConfig(): SiteConfig {
		if (!this.config) throw new Error("站点配置尚未加载。");
		return this.config;
	}
}

class AssetSuggestModal extends FuzzySuggestModal<string> {
	constructor(
		app: App,
		private readonly assets: string[],
		private readonly onChoose: (path: string) => void,
	) {
		super(app);
		this.setPlaceholder("搜索 public/ 中的图片");
	}

	getItems(): string[] {
		return this.assets;
	}

	getItemText(item: string): string {
		return item;
	}

	onChooseItem(item: string): void {
		this.onChoose(item);
	}
}

function move<T>(items: T[], from: number, direction: -1 | 1): void {
	const to = from + direction;
	if (to < 0 || to >= items.length) return;
	[items[from], items[to]] = [items[to], items[from]];
}

function newMenuItem(siblings: MenuItem[], isContainer = false): MenuItem {
	const base = "menu";
	const keys = new Set(siblings.map((item) => item.key));
	let index = siblings.length + 1;
	let key = `${base}-${index}`;
	while (keys.has(key)) {
		index += 1;
		key = `${base}-${index}`;
	}
	return isContainer
		? { key, label: "新菜单", icon: "circle", children: [] }
		: { key, label: "新导航", icon: "link", link: "/" };
}
