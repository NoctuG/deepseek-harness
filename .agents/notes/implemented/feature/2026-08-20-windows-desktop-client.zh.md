# Agent Note: Windows x64 桌面分发

Status: implemented

[English](2026-08-20-windows-desktop-client.md) | 中文

## Problem

浏览器应用要求用户启动 CLI（命令行界面）服务器并管理浏览器标签页。Windows 用户需要无需单独管理服务器窗口的常规图形化可执行文件，同时产品必须保留现有插件组合与持久化行为。

## Decision

私有 `@deepseek-ai/dsh-desktop` 应用把构建后的 `web` profile 与固定版本的 Windows x64 Electron 运行时打包。其主进程预留随机 loopback 端口，通过 Electron 的 Node 模式启动已安装的 `@deepseek-ai/dsh` 入口并禁用浏览器交接，等待 HTTP 就绪，并在应用生命周期内持有子进程。renderer 禁用 Node 集成、启用上下文隔离与 Chromium sandbox，并把新窗口导航交给操作系统浏览器。

原生 Windows 打包脚本构建仓库、部署桌面包的生产依赖闭包、下载固定版本的 Electron 压缩包，并生成一个可解压的 x64 zip。在 Windows 上构建可确保包括 PowerShell 终端后端在内的原生依赖与目标平台匹配。

`Windows Desktop` workflow 会针对 Pull Request 与 `master` 上的相关变更执行原生构建。它检查压缩包，启动已打包的可执行文件直至主窗口可以响应，关闭窗口，并要求进程正常退出后才保留压缩包。只有从匹配的 `dsh-desktop-v<version>` tag 手动以 `publish=true` dispatch，且构建与测试 job 成功后，才会创建 GitHub Release；受保护的 `github-release` environment 控制发布。

## Alternatives considered

**仅远程桌面外壳。** 要求用户另行安装或托管 Harness 服务器，会使可执行文件成为连接客户端而非标准本地产品，并把服务器生命周期管理留给用户。

**桌面专用的另一套后端。** 在 Electron IPC 后方重新实现会话、插件和工具行为，会复制已组装的 `web` profile，并使浏览器与桌面行为可能产生差异。

**从 Linux 交叉编译。** 依赖图包含 Windows 原生模块。在原生 Windows 上构建比从其他操作系统下载或合成这些二进制文件更可靠。

## Consequences

桌面客户端与 `dsh web` 使用相同的 profile、凭据、会话、设置与 loopback HTTP 传输，因此插件不会获得仅适用于桌面的执行路径。分发包包含 Chromium 运行时，体积会大于 CLI。打包需要通过网络访问固定版本的 Electron GitHub release，发布需要获得 environment 批准并使用精确的版本 tag；在发布基础设施提供代码签名前，生成的 zip 不会带有签名。
