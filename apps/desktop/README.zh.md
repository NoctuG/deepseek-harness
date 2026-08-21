# DeepSeek Harness 桌面客户端

[English](README.md) | 中文

此应用将普通 `web` profile 打包为 Windows x64 桌面客户端。Electron 在随机 loopback 端口上以隐藏的本地子进程运行构建后的 `@deepseek-ai/dsh` CLI（命令行界面），等待前端响应后在启用 sandbox 的桌面窗口中打开前端。外部链接通过操作系统浏览器打开；关闭应用会停止子进程。

请在 64 位 Windows 上从仓库根目录构建可分发产物：

```powershell
pnpm install --frozen-lockfile
pnpm run build:desktop:win
```

该命令生成 `apps/desktop/dist/DeepSeek-Harness-windows-x64.zip`。解压后运行 `DeepSeek Harness.exe`；客户端与 CLI 使用相同的 `DSH_HOME` 存储 profile、凭据、会话和设置。构建过程会从 Electron 的 GitHub release 下载固定版本的运行时，因此需要网络访问。

`Windows Desktop` GitHub Actions workflow 会在原生 Windows 上构建压缩包、验证必需文件、启动已打包的可执行文件、等待主窗口出现并将其正常关闭。Pull Request 与 `master` 上的相关变更会把通过验证的压缩包保存为 workflow artifact。发布 release 时，创建并推送 `dsh-desktop-v<apps/desktop package version>`，在该 tag 上以 `publish=true` dispatch workflow，并批准 `github-release` environment；发布 job 只使用成功的构建与测试 job 所生成的 artifact。
