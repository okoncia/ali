const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bistAPI', {
  chooseSymbolCsv: () => ipcRenderer.invoke('choose-symbol-csv'),
  chooseDataFolder: () => ipcRenderer.invoke('choose-data-folder'),
  chooseOutputFolder: () => ipcRenderer.invoke('choose-output-folder'),
  openTradingView: () => ipcRenderer.invoke('open-tradingview'),
  startScan: (config) => ipcRenderer.invoke('start-scan', config),
  stopScan: () => ipcRenderer.invoke('stop-scan'),
  buildReport: (config) => ipcRenderer.invoke('build-report', config),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  onProgress: (cb) => ipcRenderer.on('scan-progress', (_e, data) => cb(data)),
  onLog: (cb) => ipcRenderer.on('scan-log', (_e, data) => cb(data)),
});
