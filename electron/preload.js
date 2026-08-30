/**
 * Preload - safe bridge for local file access
 * file: electron/preload.js:1
 */
const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('animeCave', {
  isElectron: true,
  version: 'V1',
  openExternal: (url) => shell.openExternal(url),
  pickVideo: () => ipcRenderer.invoke('pick-video'),
  platform: process.platform
});
