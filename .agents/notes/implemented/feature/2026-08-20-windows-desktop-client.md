# Agent Note: Windows x64 desktop distribution

Status: implemented

English | [中文](2026-08-20-windows-desktop-client.zh.md)

## Problem

The browser application requires users to launch a CLI server and manage a browser tab. Windows users need a conventional graphical executable without a separately managed server window, while the product must retain the existing plugin composition and persistence behavior.

## Decision

The private `@deepseek-ai/dsh-desktop` application packages the built `web` profile with a pinned Windows x64 Electron runtime. Its main process reserves an ephemeral loopback port, launches the installed `@deepseek-ai/dsh` entry through Electron's Node mode with browser handoff disabled, waits for HTTP readiness, and owns the child process for the application's lifetime. The renderer keeps Node integration disabled, enables context isolation and Chromium sandboxing, and sends new-window navigation to the operating-system browser.

The native Windows packaging script builds the repository, deploys the desktop package's production dependency closure, downloads the pinned Electron archive, and emits one extractable x64 zip. Building on Windows ensures native dependencies, including the PowerShell terminal backend, match the target platform.

The `Windows Desktop` workflow exercises that native build on pull requests and relevant `master` changes. It inspects the archive, launches the packaged executable until its main window is responsive, closes the window, and requires a clean exit before retaining the archive. A manual `publish=true` dispatch from the matching `dsh-desktop-v<version>` tag creates the GitHub Release only after the build-and-test job succeeds; the protected `github-release` environment controls publication.

## Alternatives considered

**A remote-only desktop shell.** Requiring an independently installed or hosted Harness server would make the executable a connection client rather than the standard local product and would leave server lifecycle management to the user.

**A second desktop-specific backend.** Reimplementing session, plugin, and tool behavior behind Electron IPC would duplicate the assembled `web` profile and allow browser and desktop behavior to diverge.

**Cross-compilation from Linux.** The dependency graph contains Windows-native modules. A native Windows build is more reliable than downloading or synthesizing those binaries from another operating system.

## Consequences

The desktop client uses the same profile, credentials, sessions, settings, and loopback HTTP transport as `dsh web`, so plugins do not gain a desktop-only execution path. The distribution contains a Chromium runtime and is therefore larger than the CLI. Packaging requires network access to the pinned Electron GitHub release, publication requires an approved environment and an exact version tag, and the zip is unsigned until release infrastructure supplies code signing.
