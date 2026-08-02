# VitePress-Butterfly 文章仓库模板

这是 [VitePress-Butterfly](https://github.com/57Darling02/VitePress_butterfly) 博客主题的**文章仓库模板**，也是整个博客的使用入口。仓库内置 Obsidian 发布插件和 obsidian-git，手机和平板无需安装 Git；桌面端沿用 obsidian-git 的系统 Git。

博客采用双仓库模型：

```text
本仓库（私密）＝ 你的文章仓库：文章、图片、站点配置，你唯一需要维护的地方
博客仓库（公开）＝ 部署壳：每次构建时自动强制同步主题源码，日常不用碰
```

## 快速开始（约 5 分钟）

### 1. 拿到仓库内容

任选其一：

- **零门槛（推荐）**：直接下载本模板的 ZIP（`Code → Download ZIP`，公开仓库无需登录），解压后重命名为你的博客目录。之后插件会自动为你创建私密文章仓库
- **先建仓库**：点击右上角 `Use this template` 创建自己的私密仓库（名称随意，例如 `my-blog`），再下载 ZIP 或 `git clone`

> 下载的压缩包不包含 `.git` 目录，这没关系——「部署主题」时插件会把本地内容推送到云端，并在本地生成完整的 `.git` 工作副本。

### 3. 用 Obsidian 打开

1. Obsidian → `Open folder as vault`，选择刚才解压/克隆的目录
2. 如果提示受限模式，进入 `设置 → 第三方插件`，关闭受限模式以启用内置插件
3. 打开 `设置 → VitePress Butterfly 发布`

### 4. 填写 PAT 并部署主题

1. 准备一个 GitHub PAT：`GitHub 头像 → Settings → Developer settings → Personal access tokens → Tokens (classic)`，勾选权限 `repo` + `workflow`（只显示一次，建议专用 token）
2. 在插件设置中填入 **GitHub PAT**——这是唯一必填项。文章仓库名会自动识别（Git 克隆目录读取 `.git`，压缩包则按 Vault 名称）；博客仓库名留空时默认 `你的用户名.github.io`
3. 依次点击四项检测（PAT 连通性 → 文章仓库 → 博客仓库 → 就绪检测），全部通过后点击 **部署主题**

「部署主题」由插件**直接通过 GitHub API 完成**（不需要 GitHub Actions 服务器）：

1. 把**本地内容强制推送到文章仓库**（不存在则创建私密仓库）——本地是唯一内容源，云端总是等于本地
2. 博客仓库不存在则创建公开仓库；已存在则直接复用，**它的内容无所谓**（每次构建都会被覆盖）
3. 配置两个仓库的 secrets、启用 Actions 与 GitHub Pages
4. 写入部署工作流并触发首次构建——**每次构建都会先把博客仓库强制同步成主题最新源码**，因此主题永远不会漂移，也无需任何手动同步
5. 本地生成完整 `.git` 工作副本，obsidian-git 直接可用

重复执行「部署主题」是安全的（幂等）：仓库直接复用，本地内容再次覆盖云端，secrets 总是重新写入。

### 5. 开始写作

部署主题完成后本地已有完整 `.git` 工作副本（指向你的文章仓库），之后：

1. 在 Obsidian 中写 Markdown（命令面板可运行 **新建博客文章** 生成带 frontmatter 的文章）
2. obsidian-git 面板：**Commit** → **Push**——推送会自动触发博客重新构建部署
3. 多设备切换时先 **Pull** 同步云端内容

> 文章仓库云端内容永远等于最近一次「部署主题」时的本地内容；之后请用 obsidian-git 的 Push 保持同步。

## 双插件分工

| 插件 | 职责 |
|---|---|
| **VitePress Butterfly Publisher**（内置） | 初始化与部署：推送本地内容到文章仓库、创建/配置博客仓库（部署壳）、配置 secrets、安装部署工作流 |
| **obsidian-git**（内置） | 日常内容同步：Commit / Push / Pull，桌面端与移动端均可 |

> Publisher 直接复用 obsidian-git 的 Git 引擎，不会重复加载第二套 Git。obsidian-git 在移动端内置纯 JS Git，无需安装软件；Publisher 会把 PAT 写入 obsidian-git 的本地凭据，并写入本地 `.git/config` 的远程地址（不会上传），随后可直接 Commit / Push / Pull。

## 内置插件说明

插件面板（`设置 → VitePress Butterfly 发布`）按步骤提供四项检测，每项只验证自己的边界。点击检测后会立即显示旋转加载状态；GitHub 15 秒无响应时会自动结束并提示网络超时：

| 检测 | 验证内容 |
|---|---|
| PAT 连通性 | token 是否有效（`GET /user`），通过后才能继续后续检测 |
| 博客文章仓库 | 解析目标仓库名（Git 克隆目录 / Vault 名称自动识别）；存在与否不重要，部署时都会覆盖 |
| 博客样式仓库 | 解析目标仓库名（留空默认 `用户名.github.io`）；内容不重要，每次构建都强制同步为最新主题 |
| 就绪检测 | 两个仓库名均解析成功后，即可执行「部署主题」 |

操作区提供两个动作：

| 操作 | 作用 |
|---|---|
| 部署主题 | 把本地内容推送到文章仓库（覆盖云端）、配置博客仓库并触发首次构建，本地生成 `.git` 工作副本（幂等，可重复执行） |
| 触发部署 | 不发布内容，直接通知博客仓库重新构建 |

> 发布与拉取交给 obsidian-git：Push 后文章仓库的 trigger 工作流会自动通知博客仓库重建。

### 安全说明

- PAT 只保存在本机 Publisher 设置、obsidian-git 本地凭据（桌面端远程地址也可能包含 PAT）以及 GitHub 加密 secrets 中，不会提交到仓库
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
- 内置双插件：Publisher 负责初始化/部署，obsidian-git 负责日常同步

桌面端高级用户可以在 obsidian-git 中使用完整 Git 能力（历史、diff、分支、回滚）；移动端同样支持（见上文配置）。

## 站点配置

- `site_config.yml`：站点名称、首页、导航、个人信息等全部配置
- `public/`：站点的公共静态资源（头像、背景图等），配置中用 `/文件名` 引用

## 插件更新

内置插件的源码在 `.obsidian/plugins/vitepress-butterfly-publisher/` 内（`src/` + 预编译的 `main.js`）。模板仓库更新后，重新下载 ZIP 或拉取远端即可获得新版本插件；发布插件不会上传插件自身的设置文件。

## 主题与更新

- 主题源码：[57Darling02/VitePress_butterfly](https://github.com/57Darling02/VitePress_butterfly)
- 博客仓库与主题仓库**没有 fork 关系，也不需要任何手动同步**：部署工作流每次构建前都会强制把博客仓库同步成主题最新源码（`git reset --hard upstream/main`），因此主题更新后，下次发布文章即自动生效，博客仓库永远不会漂移

## 常见问题

**PAT 需要什么权限？**
`repo` + `workflow`。插件会把它写入两个仓库的 secrets：博客仓库构建时用它拉取私密文章仓库，文章仓库用它通知博客重新部署。

**文章仓库必须私密吗？**
推荐私密。博客仓库是公开的（GitHub Pages 部署），但你的文章始终只存在于私密仓库中，构建时才被拉取。

**如何排查部署失败？**
- 检查博客仓库 `Actions` 是否已启用（部署主题会自动开启，若被组织策略阻止需手动开启）
- 检查博客仓库 `Settings → Pages` 的 Source 是否为 `GitHub Actions`
- 重新部署主题是安全的（幂等，仓库直接复用，本地内容再次覆盖云端）

**还没部署主题就推送了文章，会报错吗？**
不会。推送/触发部署会检测到尚未初始化并安全跳过，同时提示你先完成「部署主题」。

**博客地址是什么？**
如果博客仓库命名为 `用户名.github.io`，地址就是 `https://用户名.github.io`；如果命名为其他名称，地址为 `https://用户名.github.io/仓库名/`。

**插件源码在哪里？如何构建？**
源码位于 `.obsidian/plugins/vitepress-butterfly-publisher/src/`，在插件目录执行 `pnpm install && pnpm build` 即可重新生成 `main.js`。
