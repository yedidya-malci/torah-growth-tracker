import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data)
  },
  invoke: (channel: string, data?: any) => {
    return ipcRenderer.invoke(channel, data)
  }
})
