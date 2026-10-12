---
slug: my-dev-setup-2026
title: 我的 2026 开发环境配置
summary: 终端、编辑器、键盘和一些小工具。不追求最新，只追求顺手——这一套我已经用了一年多没大改过。
date: 2026-06-15
tags: [工具, 随笔]
dir: notes
---

经常有朋友问我用什么工具。与其每次回答，不如写下来。先说结论：工具没有好坏，顺手最重要，而顺手来自长期不折腾。

## 终端

- 终端：Ghostty，启动快，配置是一个纯文本文件
- Shell：zsh + starship 提示符，只显示目录、git 分支和运行时版本
- 常用工具：ripgrep、fd、fzf、zoxide、lazygit

## 编辑器

日常主力是 VS Code，开了 Vim 模式。插件控制在二十个以内，每半年清理一次没用的。字体用 JetBrains Mono，字号 14，行高 1.6。

```json
{
  "editor.fontFamily": "JetBrains Mono",
  "editor.fontSize": 14,
  "editor.lineHeight": 1.6,
  "editor.minimap.enabled": false,
  "workbench.startupEditor": "none"
}
```

## 硬件

一台 MacBook Pro，一块 27 寸 4K 显示器，一把 75% 配列的机械键盘，茶轴。桌上永远有一本纸质笔记本，画架构图的时候我还是更喜欢用笔。
