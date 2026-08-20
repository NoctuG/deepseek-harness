/** Electron main process that owns the local Harness server and desktop window. */

import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, dialog, shell } from 'electron'

const HOST = '127.0.0.1'
const STARTUP_TIMEOUT_MS = 30_000
let serverProcess: ChildProcess | undefined

/** Reserve a loopback port for the child server startup. */
async function availablePort(): Promise<number> {
  return await new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        server.close()
        reject(new Error('desktop: could not reserve a loopback port'))
        return
      }
      server.close(error => error === undefined ? resolvePort(address.port) : reject(error))
    })
  })
}

/** Resolve the installed CLI entry without relying on a shell command. */
function cliEntry(): string {
  const manifest = fileURLToPath(import.meta.resolve('@deepseek-ai/dsh/package.json'))
  return resolve(dirname(manifest), 'lib/bin.js')
}

/** Wait until the local frontend responds or the child exits. */
async function waitUntilReady(url: string, child: ChildProcess): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Harness server exited with code ${String(child.exitCode)}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Connection refusal is expected while the server binds and composes plugins.
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 100))
  }
  throw new Error('Harness server did not become ready within 30 seconds')
}

/** Start the product's ordinary web profile under Electron's Node runtime. */
async function startServer(): Promise<string> {
  const port = await availablePort()
  const url = `http://${HOST}:${String(port)}`
  serverProcess = spawn(process.execPath, [cliEntry(), 'web', '--no-open', '--port', String(port)], {
    cwd: app.getPath('documents'),
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  let diagnostics = ''
  serverProcess.stderr?.on('data', chunk => { diagnostics += String(chunk) })
  try {
    await waitUntilReady(url, serverProcess)
  } catch (error) {
    serverProcess.kill()
    const detail = diagnostics.trim()
    throw new Error(detail === '' ? String(error) : `${String(error)}\n\n${detail}`)
  }
  return url
}

/** Create the hardened desktop browser after the local server is ready. */
async function createWindow(): Promise<void> {
  const url = await startServer()
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#f5f5f5',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    void shell.openExternal(target)
    return { action: 'deny' }
  })
  window.once('ready-to-show', () => window.show())
  await window.loadURL(url)
}

app.on('window-all-closed', () => app.quit())
app.on('before-quit', () => {
  serverProcess?.kill()
  serverProcess = undefined
})

void app.whenReady().then(createWindow).catch(async (error: unknown) => {
  await dialog.showMessageBox({
    type: 'error',
    title: 'DeepSeek Harness',
    message: 'DeepSeek Harness 无法启动',
    detail: error instanceof Error ? error.message : String(error),
  })
  app.quit()
})
