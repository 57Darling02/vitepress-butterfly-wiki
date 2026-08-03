# VitePress-Butterfly 文章仓库模板

这是 [VitePress-Butterfly](https://github.com/57Darling02/VitePress_butterfly) 的文章仓库模板，也是整个博客的使用入口。仓库已内置 Obsidian 发布插件和 obsidian-git；桌面端与移动端都可以完成首次配置和日常发布。

## 双仓库模型

```text
文章仓库（私密）＝ Markdown、图片和 site_config.yml，日常只维护这里
博客仓库（公开）＝ 主题源码、构建工作流和 GitHub Pages，通常不用手动修改
```

两个仓库通过 GitHub Actions secrets 连接：

| 仓库 | secrets |
|---|---|
| 文章仓库 | `BLOG_REPO`、`PAT` |
| 博客仓库 | `WIKI_URL`、`PAT` |

文章仓库 Push 后，内置的 `trigger.yml` 会通知博客仓库重新构建。

## 快速开始

### 1. 获取并打开 Vault

任选一种方式：

- **第一次使用（推荐）**：下载本仓库 ZIP，解压后用 Obsidian 打开；插件会在配置文章仓库时初始化本地 Git
- **已经有文章仓库**：直接 `git clone` 后用 Obsidian 打开

进入 `设置 → 第三方插件`，关闭受限模式并启用内置的：

- VitePress Butterfly Publisher
- Obsidian Git

### 2. 准备 PAT

在 GitHub 创建 **Tokens (classic)**：

```text
GitHub → Settings → Developer settings
→ Personal access tokens → Tokens (classic)
```

勾选：

- `repo`
- `workflow`

建议创建一个专用于博客的 PAT。PAT 只显示一次，请妥善保存。

### 3. 配置仓库

打开 `设置 → VitePress Butterfly 发布`，依次完成以下三步。

#### 第一步：检测 PAT

1. 输入 PAT
2. 点击 **检测连通性**
3. 显示 `已连接 @用户名` 后，后续配置才会解锁

插件会自动建议：

- 文章仓库名：当前 Vault 目录名
- 博客仓库名：`你的用户名.github.io`

你可以直接使用，也可以修改。PAT 一旦改变，后续区域会重新锁定，必须再次检测。

#### 第二步：配置文章仓库

确认文章仓库名和博客仓库名都已填写，然后：

1. 点击 **检测仓库**（只读检查，可随时重试）
2. 按结果选择：
   - **不存在** → 点 **创建仓库并配置**：先在本地初始化 Git 并提交当前 Vault，确认本地准备成功后才创建私密仓库、上传内容并配置 secrets
   - **已存在** → 点 **配置**：默认只更新 `BLOG_REPO` 和 `PAT`，不碰内容；勾选【覆盖】后才会以当前 Vault 覆盖 `main`

仓库名一旦修改，检测结果自动作废，需要重新检测。插件直接复用 obsidian-git 的 Git 引擎。配置完成后，日常 Commit / Push / Pull 仍由 obsidian-git 负责。

> 勾选【覆盖】会替换目标文章仓库的 `main` 分支内容，请确认仓库名正确。

#### 第三步：配置博客仓库

同样先点 **检测仓库**，再按结果选择：

- **不存在** → 点 **创建仓库并配置**：通过 GitHub 的 **Use this template API**，从 `57Darling02/VitePress_butterfly` 一次性创建公开仓库，再配置 secrets、GitHub Pages 和首次构建
- **已存在** → 点 **仅配置变量**：不修改仓库内容，更新 `WIKI_URL` 和 `PAT` 后触发一次构建

博客仓库已有内容时，插件不会重置或覆盖，只更新 secrets。插件**不提供删除仓库**：如果残留了不想要的仓库，请到 GitHub 网页 `Settings → Danger Zone → Delete this repository` 删除。

> 可选：如需同时部署到 Vercel，在插件设置的「可选：Vercel 部署」中填写 Token、Org ID、Project ID 三项；配置博客仓库时会一并写入 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`。留空则跳过，不影响 GitHub Pages。

## 为什么这套流程更容易重试

所有按钮都可以安全重复点击：

- 仓库检测是只读请求，可无限重试；仓库名修改后需重新检测
- 仓库存在检测和 secrets 写入都是幂等操作
- 主题使用一次 Template API 创建，不再逐文件复制，显著减少网络请求
- 新建文章仓库前会先完成本地 Git 准备，避免本地错误在 GitHub 留下空仓库
- 如果远端创建成功但响应中断，插件会记录未完成状态；重新点击同一个按钮会继续完成上传或配置
- 初始化早期的 Push 或 dispatch 遇到另一仓库尚未就绪时会成功跳过；最后一次有效触发才会构建
- Pages 或首次构建触发失败只会显示警告，不会把已成功创建和配置的仓库判定为失败
- 每次 GitHub 请求最长等待 15 秒，超时后按钮会恢复，可直接重试

## 日常写作与发布

首次配置后，Publisher 通常不再参与文章同步：

1. 在 Obsidian 中编写 Markdown
2. 使用 obsidian-git **Commit**
3. 使用 obsidian-git **Push**
4. 文章仓库的工作流自动通知博客仓库构建

多设备切换前先使用 obsidian-git **Pull**。

插件设置中的 **触发构建** 只用于手动重新构建博客，一般无需点击。

## 双插件分工

| 插件 | 职责 |
|---|---|
| VitePress Butterfly Publisher | PAT 验证、创建/配置两个仓库、配置 GitHub secrets 与 Pages |
| obsidian-git | 日常 Commit / Push / Pull，以及新文章仓库的首次本地 Git 初始化和上传 |

Publisher 会把 GitHub 用户名和 PAT 写入 obsidian-git 的本地凭据；这些数据不会提交到文章仓库。`.gitignore` 已过滤所有插件的 `data.json`。

## 写文章

每篇文章是一个 Markdown 文件，frontmatter 示例：

```md
---
title: Hello World
date: 2026-01-01
author: Me
layout: doc
---

# Hello World
```

- `layout: doc`：普通博客文章，会进入首页、归档和标签页
- `layout: page`：自定义页面
- `layout: shuoshuo`：短内容
- 不带 layout 的 Markdown 不会进入文章流，例如本 README
- 图片支持相对路径、`public/` 根路径和外链

也可以在命令面板运行 **新建博客文章**，自动生成 frontmatter。

## 站点配置

- `site_config.yml`：站点名称、首页、导航、个人信息等配置
- `public/`：头像、背景图等公共静态资源
- `用法拓展/`：更多写作与配置示例

## 安全说明

- 文章仓库默认创建为私密仓库
- 博客仓库创建为公开仓库，以便 GitHub Pages 部署
- PAT 保存在本机插件设置、obsidian-git 本地凭据以及 GitHub 加密 secrets 中
- `.obsidian/plugins/*/data.json` 已加入 `.gitignore`，PAT 不会被提交
- 建议使用专用 PAT；泄露后可随时在 GitHub 吊销

## 常见问题

### PAT 检测通过后为什么重启 Obsidian 又要检测？

验证状态只保留在当前插件会话中。重启后再次点击检测，确保后续写操作使用的是当前有效 PAT。

### 网络中断后要删除仓库重来吗？

不需要。直接重新点击刚才的配置按钮。文章仓库会继续上传或覆盖当前 `main`，博客仓库会继续完成 secrets、Pages 和构建配置。初始化中较早的构建可能成功跳过，最后一次有效触发会部署。

### 已有仓库会被覆盖吗？

文章仓库已存在时默认只更新环境变量；只有勾选【覆盖】后，才会以当前 Vault 内容 force push 覆盖 `main`。博客仓库已存在时仍只更新 `WIKI_URL` 和 `PAT`，不会修改内容。

### 不想要某个仓库了怎么办？

插件不提供删除功能（避免误删）。请到 GitHub 网页打开仓库 `Settings → Danger Zone → Delete this repository` 删除；删除后回到插件重新检测即可。

### 博客仓库创建后 Pages 没有开启怎么办？

进入博客仓库：

```text
Settings → Pages → Source → GitHub Actions
```

然后回到插件点击 **触发构建**。

### 如何更新主题？

已有博客仓库由用户自行维护，插件不会自动覆盖主题。若希望重新使用最新模板，最简单的方式是删除旧博客仓库，再点击 **配置博客仓库** 重新从模板创建。操作前请确认仓库中没有需要保留的自定义内容。

### 插件源码在哪里？

位于：

```text
.obsidian/plugins/vitepress-butterfly-publisher/
```

构建命令：

```bash
cd .obsidian/plugins/vitepress-butterfly-publisher
pnpm install
pnpm build
```
