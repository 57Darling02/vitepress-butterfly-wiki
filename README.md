# VitePress-Butterfly 文章仓库模板

这是 [VitePress-Butterfly](https://github.com/57Darling02/VitePress_butterfly) 博客主题的**文章仓库模板**，也是整个博客的使用入口。仓库内置 Obsidian 发布插件，**全程无需安装 Git**，手机、平板、电脑都能用。

博客采用双仓库模型：

```text
本仓库（私密）＝ 你的文章仓库：文章、图片、站点配置，你唯一需要维护的地方
博客仓库（公开）＝ 主题与构建部署：由 Setup 工作流自动 fork 并配置，日常不用碰
```

## 快速开始（约 5 分钟）

### 1. 创建自己的文章仓库

点击右上角 `Use this template` 创建仓库，名称随意（例如 `my-blog`），并**勾选 Private 保持私密**。

### 2. 拿到仓库内容

任选其一：

- **移动端 / 不想装 Git**：GitHub 网页登录后 `Code → Download ZIP`，解压到手机或电脑
- **电脑**：`git clone https://github.com/你的用户名/my-blog.git`

> 私密仓库需要登录 GitHub 才能下载 ZIP。下载的压缩包**不包含** `.git` 目录，这没关系——发布插件通过 GitHub API 工作，不需要本地 Git。

### 3. 用 Obsidian 打开

1. Obsidian → `Open folder as vault`，选择刚才解压/克隆的目录
2. 如果提示受限模式，进入 `设置 → 第三方插件`，关闭受限模式以启用内置插件
3. 打开 `设置 → VitePress Butterfly 发布`

### 4. 填写 PAT 并触发 Setup

1. 准备一个 GitHub PAT：`GitHub 头像 → Settings → Developer settings → Personal access tokens → Tokens (classic)`，勾选权限 `repo` + `workflow`（只显示一次，建议专用 token）
2. 在插件设置中填入 **GitHub PAT**——这是唯一必填项。文章仓库会自动识别（Git 克隆目录读取 `.git`，压缩包则按 Vault 名称匹配）；博客仓库名留空时默认 `你的用户名.github.io`
3. 点击 **触发 Setup**，等待插件提示 Setup 完成（约 1~2 分钟）

Setup 会自动完成：fork 主题仓库 → 配置两个仓库的 secrets → 开启 GitHub Pages → 触发第一次构建部署。你的 PAT 只写入 GitHub 加密的 secrets，**不会出现在任何工作流日志中**；Setup 完成后插件会自动清理它写入的临时 secrets。

### 5. 开始写作

在 Obsidian 中写 Markdown，然后点击 **推送发布**——插件会提交内容并自动触发博客重新构建，等待提示"博客部署成功"即可。多设备切换时先点 **拉取最新** 同步云端内容。

## 内置插件说明

插件面板（`设置 → VitePress Butterfly 发布`）提供四个操作：

| 操作 | 作用 |
|---|---|
| 触发 Setup | 配置 secrets 并运行 Setup 工作流（创建博客仓库，只需一次） |
| 拉取最新 | 用云端 `main` 分支覆盖当前 Vault（本地未发布文件会移入回收站，可恢复） |
| 推送发布 | 提交 Vault 变更并触发博客构建；云端有更新时会询问如何处理 |
| 强制推送 | 放弃云端更新，直接用本地内容覆盖（谨慎使用） |
| 触发部署 | 不发布内容，仅通知博客仓库重新构建 |

### 冲突处理

- **推送发布**时如果云端已有本地没有的提交（比如另一台设备发过文章），插件会弹窗询问：
  - **强制推送（覆盖云端）**：丢弃云端内容，以当前设备为准
  - **取消**：先点 **拉取最新** 再继续
- 单人多设备的冲突通常只在"两台设备同时改同一篇文章"时出现，按上述二选一即可，无需手动合并。

### 安全说明

- PAT 只保存在本机插件设置（`.obsidian/plugins/vitepress-butterfly-publisher/data.json`）和 GitHub 加密 secrets 中，不会随发布上传
- 建议使用专用 PAT；泄露后可随时在 GitHub 吊销
- 文章仓库推荐保持私密；博客仓库是公开的（GitHub Pages 部署）

## 写文章

每篇文章是一个 Markdown 文件，frontmatter 示例：

```md
---
title: Hello World
date: 2026-01-01
author: Me
cover: ./cover.webp
layout: doc
---

# Hello World
```

- 只有带 `layout: doc` 的文章才会进入首页、归档、标签等文章流；不带 layout 的文件不会被发布（例如本 README）。
- 封面和图片支持相对路径（`./cover.webp`、`../附件/xxx.png`），也支持 `/image/xxx.png`（对应 `public/`）和外链。
- 自定义页面用 `layout: page`（参考 `FriendLink/` 示例）；短内容可以用 `layout: shuoshuo`。
- 也可以在 Obsidian 命令面板运行 **新建博客文章**，自动生成带 frontmatter 的文章。
- 更多写作技巧见 `用法拓展/` 目录下的文章。

## 用 Obsidian 写作（推荐）

本仓库内置 Obsidian 配置（`.obsidian/`）：

- 粘贴的图片自动保存到 `附件/`
- 链接使用相对路径 Markdown 格式，与博客构建完全兼容
- 内置发布插件，写作后一键发布上线

桌面端高级用户也可以安装 [obsidian-git](https://github.com/Vinzent03/obsidian-git) 插件获得完整的 Git 体验（历史、diff、回滚），仓库已包含其配置；它与发布插件可以共存，但**日常发布建议只用发布插件**，避免两套流程混淆。

## 站点配置

- `site_config.yml`：站点名称、首页、导航、个人信息等全部配置
- `public/`：站点的公共静态资源（头像、背景图等），配置中用 `/文件名` 引用

## 插件更新

内置插件的源码在 `.obsidian/plugins/vitepress-butterfly-publisher/` 内（`src/` + 预编译的 `main.js`）。模板仓库更新后，重新下载 ZIP 或拉取远端即可获得新版本插件；发布插件不会上传插件自身的设置文件。

## 主题与更新

- 主题源码：[57Darling02/VitePress_butterfly](https://github.com/57Darling02/VitePress_butterfly)
- 主题更新在**博客仓库**（fork）上进行，使用 `git reset --hard upstream/main` 等方式同步上游——因为文章不放在那里，更新永远不会影响你的文章。

## 常见问题

**PAT 需要什么权限？**
`repo` + `workflow`。Setup 工作流会把它写入两个仓库的 secrets：博客仓库构建时用它拉取私密文章仓库，文章仓库用它通知博客重新部署。

**文章仓库必须私密吗？**
推荐私密。博客仓库是公开的（GitHub Pages 部署），但你的文章始终只存在于私密仓库中，构建时才被拉取。

**如何排查部署失败？**
- 检查博客仓库 `Actions` 是否已启用（Setup 会自动开启，若被组织策略阻止需手动开启）
- 检查博客仓库 `Settings → Pages` 的 Source 是否为 `GitHub Actions`
- 重新触发 Setup 是安全的（幂等，会复用已存在的博客仓库）

**还没运行 Setup 就推送了文章，会报错吗？**
不会。推送/触发部署会检测到尚未初始化并安全跳过，同时提示你先完成 Setup。

**博客地址是什么？**
如果博客仓库命名为 `用户名.github.io`，地址就是 `https://用户名.github.io`；如果命名为其他名称，地址为 `https://用户名.github.io/仓库名/`。

**插件源码在哪里？如何构建？**
源码位于 `.obsidian/plugins/vitepress-butterfly-publisher/src/`，在插件目录执行 `pnpm install && pnpm build` 即可重新生成 `main.js`。
