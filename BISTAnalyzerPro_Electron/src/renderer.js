const $=id=>document.getElementById(id);
const fields=['symbolCsv','dataFolder','outputFolder','signalMode'];
async function save(){const s={};fields.forEach(k=>s[k]=$(k).value);await window.bistAPI.saveSettings(s);}
async function load(){const s=await window.bistAPI.loadSettings();fields.forEach(k=>{if(s[k])$(k).value=s[k];});}
function log(s){$('log').textContent+=`${new Date().toLocaleTimeString('tr-TR')}  ${s}\n`;$('log').scrollTop=$('log').scrollHeight;}
$('pickSymbols').onclick=async()=>{const p=await window.bistAPI.chooseSymbolCsv();if(p){$('symbolCsv').value=p;save();}};
$('pickData').onclick=async()=>{const p=await window.bistAPI.chooseDataFolder();if(p){$('dataFolder').value=p;save();}};
$('pickOutput').onclick=async()=>{const p=await window.bistAPI.chooseOutputFolder();if(p){$('outputFolder').value=p;save();}};
$('openTV').onclick=async()=>{await window.bistAPI.openTradingView();log('TradingView penceresi açıldı.');};
$('stop').onclick=async()=>{await window.bistAPI.stopScan();log('Durdurma istendi.');};
$('build').onclick=async()=>{
  const cfg={symbolCsv:$('symbolCsv').value,dataFolder:$('dataFolder').value,outputFolder:$('outputFolder').value,signalMode:$('signalMode').value};
  if(!cfg.symbolCsv||!cfg.dataFolder||!cfg.outputFolder){alert('Üç dosya/klasör alanını da seç.');return;}
  save();$('statusText').textContent='Hesaplanıyor';$('dot').style.background='#f59e0b';$('build').disabled=true;log('Rapor hesaplaması başladı.');
  try{const r=await window.bistAPI.buildReport(cfg);log(`Tamamlandı: ${r.out}`);log(`VIDYA ${r.vidyaCount}, EMA ${r.emaCount}, hata ${r.errorCount}`);$('statusText').textContent='Tamamlandı';$('dot').style.background='#22c55e';}
  catch(e){log(`HATA: ${e.message}`);$('statusText').textContent='Hata';$('dot').style.background='#ef4444';alert(e.message);}
  finally{$('build').disabled=false;}
};
window.bistAPI.onProgress(p=>{$('counter').textContent=`${p.current} / ${p.total}`;$('currentSymbol').textContent=p.symbol;$('barFill').style.width=`${p.total?100*p.current/p.total:0}%`;});
window.bistAPI.onLog(log);load();
