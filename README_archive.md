---
title: VitePress-Butterfly 主题 README
date: 2024-05-20
author: 57Darling02
cover: ./附件/Pasted%20image%2020260426190853.png
tags:
  - VitePress
  - 写作技巧
layout: doc
---

## VitePress-Butterfly 主题外联知识库使用方法

**本仓库是VitePress-Butterfly 主题外联知识库。**

推荐使用obsidian管理本仓库文章。
### obsidian配置
博客通过相对定位获取资源，因此需要
1. 指定插入附件的位置为相对位置
2. 指定插入链接(Link)的位置为相对位置
> 不要使用wiki形式！
3. 展示所有文件类型，用以显示主题配置文件`site_config.yml`
参考配置页面如图:
![](附件/Pasted%20image%2020260426190853.png)
### 自定义网站样式
本仓库根目录下`site_config.yml`为配置文件。修改配置文件，将网站变成你的形状：
进行主题配置信息，更改首页背景图、网站名称、侧边栏个人信息等等。

如果需要使用自定义资源，请直接使用public文件夹。此文件夹中放置图片等资源。

例如：
```
public/avatar.png
public/wallpaper/1.webp
```

配置中这样引用：

```yaml
avatar: "/avatar.png"
background: "/wallpaper/1.webp"
```

## 写文章

### 基本开头
[YAML 格式的 frontmatter](https://jekyllrb.com/docs/front-matter/) 开箱即用：
```md
---
title: Hello World
date: 2026-01-01
author: Me
layout: doc
---

# Hello World
```

文章需要带 `layout: doc`才 会进入首页、归档、标签等文章流。建议把layout属性放在最后。

### markdown写作
见[markdown写作语法](/用法拓展/markdown写作)

## 推送

推送知识库后，它会通知主题仓库重新部署并上线！


## 进阶技巧
只需要一点vue知识，即可部署自己的页面。详情见[自定义一个页面](/用法拓展/写一个页面)


