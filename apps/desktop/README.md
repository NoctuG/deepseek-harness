# DeepSeek Harness Desktop

English | [中文](README.zh.md)

This application packages the ordinary `web` profile as a Windows x64 desktop client. Electron runs the built `@deepseek-ai/dsh` CLI as a hidden local child process on an ephemeral loopback port, waits for the frontend to respond, and opens it in a sandboxed desktop window. External links leave the application through the operating-system browser, and closing the application stops the child process.

Build the distributable on 64-bit Windows from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm run build:desktop:win
```

The command writes `apps/desktop/dist/DeepSeek-Harness-windows-x64.zip`. Extract the archive and run `DeepSeek Harness.exe`; the client stores profiles, credentials, sessions, and settings under the same `DSH_HOME` used by the CLI. The build downloads the pinned Electron runtime from its GitHub release, so it requires network access.
