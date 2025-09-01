const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onToggleSelectMode: (callback) => ipcRenderer.on('toggle-select-mode', callback)
});

