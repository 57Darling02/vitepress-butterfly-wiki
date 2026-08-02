# VitePress-Butterfly 文章仓库模板

这是 [VitePress-Butterfly](https://github.com/57Darling02/VitePress_butterfly) 博客主题的**文章仓库模板**，也是整个博客的使用入口。仓库内置 Obsidian 发布插件和 obsidian-git，手机和平板无需安装 Git；桌面端沿用 obsidian-git 的系统 Git。

博客采用双仓库模型：

```text
本仓库（私密）＝ 你的文章仓库：文章、图片、站点配置，你唯一需要维护的地方
博客仓库（公开）＝ 主题与构建部署：由 Setup 工作流自动 fork 并配置，日常不用碰
```

## 快速开始（约 5 分钟）

### 1. 拿到仓库内容

任选其一：

- **零门槛（推荐）**：直接下载本模板的 ZIP（`Code → Download ZIP`，公开仓库无需登录），解压后重命名为你的博客目录。之后插件会自动为你创建私密文章仓库
- **先建仓库**：点击右上角 `Use this template` 创建自己的私密仓库（名称随意，例如 `my-blog`），再下载 ZIP 或 `git clone`

> 下载的压缩包不包含 `.git` 目录，这没关系——检测和 Setup 通过 GitHub API 完成；随后 Publisher 会调用 obsidian-git 初始化本地工作副本。

### 3. 用 Obsidian 打开

1. Obsidian → `Open folder as vault`，选择刚才解压/克隆的目录
2. 如果提示受限模式，进入 `设置 → 第三方插件`，关闭受限模式以启用内置插件
3. 打开 `设置 → VitePress Butterfly 发布`

### 4. 填写 PAT 并触发 Setup

1. 准备一个 GitHub PAT：`GitHub 头像 → Settings → Developer settings → Personal access tokens → Tokens (classic)`，勾选权限 `repo` + `workflow`（只显示一次，建议专用 token）
2. 在插件设置中填入 **GitHub PAT**——这是唯一必填项。文章仓库会自动识别（Git 克隆目录读取 `.git`，压缩包则按 Vault 名称匹配）；博客仓库名留空时默认 `你的用户名.github.io`
3. 点击 **触发 Setup**：如果未识别到已有仓库，插件会先从模板自动创建你的私密文章仓库（名称默认用 Vault 名，可在设置中修改），然后运行 Setup 工作流（约 1~2 分钟）

Setup 会自动完成：fork 主题仓库 → 配置两个仓库的 secrets → 开启 GitHub Pages → 触发第一次构建部署。你的 PAT 只写入 GitHub 加密的 secrets，**不会出现在任何工作流日志中**；Setup 完成后插件会自动清理它写入的临时 secrets。

### 5. 开始写作

Setup 完成后插件会调用内置的 obsidian-git，**自动初始化文章仓库的 Git 工作副本**（生成 `.git` 并配置本地凭据），之后：

1. 在 Obsidian 中写 Markdown（命令面板可运行 **新建博客文章** 生成带 frontmatter 的文章）
2. obsidian-git 面板：**Commit** → **Push**——推送会自动触发博客重新构建部署
3. 多设备切换时先 **Pull** 同步云端内容

> 如果自动克隆失败，可在插件操作区点击「克隆到本地」重试；或手动用 obsidian-git 的 Clone 命令（URL 填 `https://<PAT>@github.com/你的用户名/文章仓库.git`）。

## 双插件分工

| 插件 | 职责 |
|---|---|
| **VitePress Butterfly Publisher**（内置） | 初始化与部署：创建文章仓库、配置 secrets、触发 Setup、克隆到本地、触发重建 |
| **obsidian-git**（内置） | 日常内容同步：Commit / Push / Pull，桌面端与移动端均可 |

> Publisher 直接复用 obsidian-git 的 Git 引擎，不会重复加载第二套 Git。obsidian-git 在移动端内置纯 JS Git，无需安装软件；Publisher 会把 PAT 写入 obsidian-git 的本地凭据，并写入本地 `.git/config` 的远程地址（不会上传），随后可直接 Commit / Push / Pull。

## 内置插件说明

插件面板（`设置 → VitePress Butterfly 发布`）按步骤提供四项检测，每项只验证自己的边界。点击检测后会立即显示旋转加载状态；GitHub 15 秒无响应时会自动结束并提示网络超时：

| 检测 | 验证内容 |
|---|---|
| PAT 连通性 | token 是否有效（`GET /user`），不涉及任何仓库 |
| 博客文章仓库 | 文章仓库能否访问（Git 克隆目录 / Vault 名称自动识别） |
| 博客样式仓库 | 博客仓库能否访问（留空默认 `用户名.github.io`） |
| 就绪检测 | 两个仓库的 Actions secrets 是否完整（Setup 完成后才就绪） |

操作区提供三个动作：

| 操作 | 作用 |
|---|---|
| 触发 Setup | 创建博客仓库、配置全部 secrets 并触发首次部署，完成后自动克隆到本地（只需一次） |
| 克隆到本地 | 生成 `.git` 工作副本（Setup 失败时可手动重试） |
| 触发部署 | 不发布内容，仅通知博客仓库重新构建 |

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
