'use strict';
const { app, BrowserWindow, dialog, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { readSymbols } = require('./data');
const { buildReport } = require('./report');

let mainWindow;
let tradingWindow;
let stopped=false;
const settingsFile=()=>path.join(app.getPath('userData'),'settings.json');

function createWindow(){
  mainWindow=new BrowserWindow({width:1180,height:820,minWidth:980,minHeight:700,backgroundColor:'#0b1220',
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});
  mainWindow.loadFile(path.join(__dirname,'index.html'));
}

app.whenReady().then(()=>{createWindow(); app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

ipcMain.handle('choose-symbol-csv',async()=>{const r=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'CSV',extensions:['csv']} ]});return r.canceled?null:r.filePaths[0];});
ipcMain.handle('choose-data-folder',async()=>{const r=await dialog.showOpenDialog({properties:['openDirectory']});return r.canceled?null:r.filePaths[0];});
ipcMain.handle('choose-output-folder',async()=>{const r=await dialog.showOpenDialog({properties:['openDirectory','createDirectory']});return r.canceled?null:r.filePaths[0];});
ipcMain.handle('load-settings',()=>{try{return JSON.parse(fs.readFileSync(settingsFile(),'utf8'));}catch{return {};}});
ipcMain.handle('save-settings',(_e,s)=>{fs.mkdirSync(path.dirname(settingsFile()),{recursive:true});fs.writeFileSync(settingsFile(),JSON.stringify(s,null,2));return true;});
ipcMain.handle('open-tradingview',async()=>{
  if(tradingWindow&&!tradingWindow.isDestroyed()){tradingWindow.focus();return true;}
  tradingWindow=new BrowserWindow({width:1400,height:900,title:'TradingView — BIST Analyzer Pro',webPreferences:{partition:'persist:tradingview',contextIsolation:true,nodeIntegration:false}});
  tradingWindow.webContents.setWindowOpenHandler(({url})=>{shell.openExternal(url);return{action:'deny'};});
  await tradingWindow.loadURL('https://www.tradingview.com/chart/');
  return true;
});
ipcMain.handle('stop-scan',()=>{stopped=true;return true;});
ipcMain.handle('build-report',async(_e,cfg)=>{
  stopped=false;
  const symbols=readSymbols(cfg.symbolCsv);
  return await buildReport({...cfg,symbols,onProgress:(p)=>mainWindow.webContents.send('scan-progress',p),isStopped:()=>stopped});
});
ipcMain.handle('start-scan',async(_e,cfg)=>{
  // TradingView has no supported bulk historical-data API. This action opens the persistent session
  // and prepares the app to ingest downloaded CSV files from the selected folder.
  if(!tradingWindow||tradingWindow.isDestroyed()) await ipcMain.emit('open-tradingview');
  mainWindow.webContents.send('scan-log','TradingView açıldı. Grafik CSV dosyaları seçilen veri klasörüne indikçe Rapor Oluştur kullanılabilir.');
  return {ok:true,mode:'assisted-export'};
});
