declare module 'electron' {
  export const app: {
    getPath(name: 'documents'): string
    on(name: string, listener: () => void): void
    quit(): void
    whenReady(): Promise<void>
  }
  export class BrowserWindow {
    constructor(options: Record<string, unknown>)
    readonly webContents: {
      setWindowOpenHandler(handler: (details: { url: string }) => { action: 'deny' }): void
    }
    loadURL(url: string): Promise<void>
    once(name: 'ready-to-show', listener: () => void): void
    show(): void
  }
  export const dialog: {
    showMessageBox(options: Record<string, unknown>): Promise<unknown>
  }
  export const shell: {
    openExternal(url: string): Promise<void>
  }
}
