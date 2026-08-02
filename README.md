# VitePress-Butterfly 文章仓库模板

这是 [VitePress-Butterfly](https://github.com/57Darling02/VitePress_butterfly) 博客主题的**文章仓库模板**，也是整个博客的使用入口。

博客采用双仓库模型：

```text
本仓库（私密）＝ 你的文章仓库：文章、图片、站点配置，你唯一需要维护的地方
博客仓库（公开）＝ 主题与构建部署：由 Setup 工作流自动 fork 并配置，日常不用碰
```

## 快速开始（约 5 分钟）

### 1. 创建自己的文章仓库

点击右上角 `Use this template` 创建仓库，名称随意（例如 `my-blog`），并**勾选 Private 保持私密**。

### 2. 准备一个 GitHub PAT

```text
GitHub 头像 → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
```

勾选权限：

```text
repo
workflow
```

复制生成的 token（只显示一次）。

> 建议使用专用 token 而不是主账号 token：即使泄露，影响范围也仅限于博客相关仓库。

### 3. 运行 Setup Blog 工作流

```text
Actions → Setup Blog → Run workflow
```

填写两个输入：

- `blog_repo_name`：你的公开博客仓库名，建议填 `你的用户名.github.io`
- `pat`：上一步生成的 token

工作流会自动完成：

1. fork 主题仓库到你的账号，并命名为 `blog_repo_name`
2. 在两个仓库之间配置好全部 secrets（无需手动操作）
3. 开启博客仓库的 GitHub Pages（Source: GitHub Actions）
4. 触发第一次构建部署

> 该 token 会被写入两个仓库的 secrets（博客构建时需要拉取你的私密文章仓库）。setup 完成后，如果希望更干净，可以删除这次 workflow run 的记录；token 随时可以在 GitHub 上吊销。

### 4. 等待部署完成

在博客仓库的 `Actions` 页面查看构建状态；`Settings → Pages` 查看站点地址。

### 5. 开始写作

把文章仓库克隆到本地，用 Obsidian 打开（见下文），写 Markdown 并推送到 `main` 分支——博客会自动重新构建上线。

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
- 更多写作技巧见 `用法拓展/` 目录下的文章。

## 用 Obsidian 写作（推荐）

本仓库已经内置 Obsidian 配置（`.obsidian/`）：

- 粘贴的图片自动保存到 `附件/`
- 链接使用相对路径 Markdown 格式，与博客构建完全兼容
- 已内置 Git 插件，支持写作后一键备份、推送

首次使用：

1. Obsidian → `Open folder as vault`，选择克隆下来的文章仓库目录
2. 如果提示受限模式，进入 `设置 → 第三方插件`，关闭受限模式以启用内置的 Git 插件
3. 打开 Git 插件设置，填写你的 GitHub 用户名和 PAT（仅保存在本机，不会提交到仓库）
4. 写完后在左侧 Git 面板 commit + push，博客即自动更新

## 站点配置

- `site_config.yml`：站点名称、首页、导航、个人信息等全部配置
- `public/`：站点的公共静态资源（头像、背景图等），配置中用 `/文件名` 引用

## 主题与更新

- 主题源码：[57Darling02/VitePress_butterfly](https://github.com/57Darling02/VitePress_butterfly)
- 主题更新在**博客仓库**（fork）上进行，使用 `git reset --hard upstream/main` 等方式同步上游——因为文章不放在那里，更新永远不会影响你的文章。

## 常见问题

**PAT 需要什么权限？**
`repo` + `workflow`。它会被写入两个仓库的 secrets：博客仓库构建时用它拉取私密文章仓库，文章仓库用它通知博客重新部署。

**文章仓库必须私密吗？**
推荐私密。博客仓库是公开的（GitHub Pages 部署），但你的文章始终只存在于私密仓库中，构建时才被拉取。

**如何排查部署失败？**
- 检查博客仓库 `Actions` 是否已启用（Setup 会自动开启，若被组织策略阻止需手动开启）
- 检查博客仓库 `Settings → Pages` 的 Source 是否为 `GitHub Actions`
- 重新运行 Setup Blog 是安全的（幂等，会复用已存在的博客仓库）

**博客地址是什么？**
如果博客仓库命名为 `用户名.github.io`，地址就是 `https://用户名.github.io`；如果命名为其他名称，地址为 `https://用户名.github.io/仓库名/`。
