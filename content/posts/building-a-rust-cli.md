---
slug: building-a-rust-cli
title: 用 Rust 写一个命令行工具的完整过程
summary: 从 cargo new 到发布到 crates.io：参数解析、错误处理、彩色输出、跨平台打包，一个周末项目的完整记录。
date: 2026-08-22
tags: [Rust, 工具]
dir: tools/rust
---

我一直想要一个小工具：扫描项目里所有的 TODO 注释，按文件和作者汇总出来。正好借这个机会，把用 Rust 写 CLI 的流程完整走一遍。

## 用 clap 解析参数

```rust
use clap::Parser;

#[derive(Parser)]
#[command(name = "todos", version, about = "扫描代码里的 TODO")]
struct Cli {
    /// 要扫描的目录
    #[arg(default_value = ".")]
    path: std::path::PathBuf,

    /// 以 JSON 格式输出
    #[arg(long)]
    json: bool,
}
```

derive 宏让参数定义和帮助文档写在一起，--help 的输出几乎不需要额外维护。

## 错误处理：anyhow 就够了

对于应用程序来说，anyhow 提供的 Result 和 context 已经足够好用。库才需要用 thiserror 精细地定义错误类型。

- 用 .context() 给每个可能失败的步骤加上人话描述
- 在 main 里返回 anyhow::Result<()>，错误会自动打印
- 用 ignore crate 遍历目录，天然支持 .gitignore

## 打包与发布

最后用 cargo-dist 生成了 GitHub Actions 配置，每次打 tag 自动构建 macOS、Linux、Windows 三个平台的二进制，并生成一行安装脚本。从写下第一行代码到发布，总共一个周末。
