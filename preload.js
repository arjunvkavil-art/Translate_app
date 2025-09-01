const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
  
  // Dialog methods
  showErrorDialog: (title, content) => ipcRenderer.invoke('show-error-dialog', title, content),
  showInfoDialog: (title, content) => ipcRenderer.invoke('show-info-dialog', title, content),
  
  // Event listeners
  onToggleOverlay: (callback) => ipcRenderer.on('toggle-overlay', callback),
  onToggleCapture: (callback) => ipcRenderer.on('toggle-capture', callback),
  onTogglePause: (callback) => ipcRenderer.on('toggle-pause', callback),
  onSelectRegion: (callback) => ipcRenderer.on('select-region', callback),
  onAppQuitting: (callback) => ipcRenderer.on('app-quitting', callback),
  onError: (callback) => ipcRenderer.on('error', callback),
  
  // Remove event listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Utility functions
  isElectron: true
});

// Handle window unload to clean up listeners
window.addEventListener('beforeunload', () => {
  ipcRenderer.removeAllListeners('toggle-overlay');
  ipcRenderer.removeAllListeners('toggle-capture');
  ipcRenderer.removeAllListeners('toggle-pause');
  ipcRenderer.removeAllListeners('select-region');
  ipcRenderer.removeAllListeners('app-quitting');
  ipcRenderer.removeAllListeners('error');
});