'use strict';
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { ema, vidya, crossedUp, turnedUp } = require('./indicators');
const { parseMarketCsv, resample4h, resampleDaily, locateSymbolFiles } = require('./data');

const LENS = [5,8,14,21,23,28,34,44,55];

function analyzeVidya(info, tf, rows, signalMode='vidya_turn') {
  const close = rows.map(r=>r.close);
  if (close.length < 60) throw new Error(`Yetersiz veri: ${close.length} bar`);
  const vv = Object.fromEntries(LENS.map(n=>[n, vidya(close,n,9)]));
  const row = { Sembol: info.symbol, Açıklama: info.description, Sektör: info.sector, Periyot: tf,
    'Son Zaman': rows.at(-1).time, Kapanış: close.at(-1) };
  for (const n of LENS) {
    row[`VIDYA${n}`] = vv[n].at(-1);
    row[`VIDYA${n} Eğimi`] = vv[n].at(-1) > vv[n].at(-2) ? 'Yukarı' : 'Aşağı';
  }
  const parts=[];
  for (const n of [5,8,14,21,23]) {
    const sig = signalMode === 'price_cross' ? crossedUp(close,vv[n]) : turnedUp(vv[n]);
    row[`V${n} Sinyal`] = sig ? 1 : 0; parts.push(sig?1:0);
  }
  const s1 = crossedUp(vv[28],vv[34]), s2 = crossedUp(vv[44],vv[55]);
  row['V28/34 Sinyal']=s1?1:0; row['V44/55 Sinyal']=s2?1:0;
  row.Puan = parts.reduce((a,b)=>a+b,0)+(s1?1:0)+(s2?1:0);
  return row;
}

function analyzeEma(info, tf, rows) {
  const close=rows.map(r=>r.close);
  if(close.length<60) throw new Error(`Yetersiz veri: ${close.length} bar`);
  const ee=Object.fromEntries(LENS.map(n=>[n,ema(close,n)]));
  const row={Sembol:info.symbol,Açıklama:info.description,Sektör:info.sector,Periyot:tf,'Son Zaman':rows.at(-1).time,Kapanış:close.at(-1)};
  for(const n of LENS) row[`EMA${n}`]=ee[n].at(-1);
  row['Tam Boğa Sıralaması']=LENS.slice(0,-1).every((n,i)=>ee[n].at(-1)>ee[LENS[i+1]].at(-1))?1:0;
  row['Fiyat EMA55 Üstünde']=close.at(-1)>ee[55].at(-1)?1:0;
  row['EMA5/14 Yukarı Kesişim']=crossedUp(ee[5],ee[14])?1:0;
  row['EMA5/34 Yukarı Kesişim']=crossedUp(ee[5],ee[34])?1:0;
  return row;
}

function addSheet(wb,name,rows){
  const ws=XLSX.utils.json_to_sheet(rows);
  ws['!autofilter']={ref:ws['!ref']||'A1:A1'};
  ws['!freeze']={xSplit:1,ySplit:1};
  XLSX.utils.book_append_sheet(wb,ws,name);
}

async function buildReport({symbols,dataFolder,outputFolder,signalMode='vidya_turn',onProgress=()=>{},isStopped=()=>false}){
  const vidyaRows=[],emaRows=[],errors=[];
  for(let i=0;i<symbols.length;i++){
    if(isStopped()) break;
    const info=symbols[i];
    onProgress({current:i+1,total:symbols.length,symbol:info.symbol});
    try{
      const candidates=locateSymbolFiles(dataFolder,info.symbol);
      if(!candidates.length) throw new Error('Bu sembole ait CSV bulunamadı');
      const file=candidates[0];
      const h1=parseMarketCsv(file);
      const frames=[['1 Saat',h1],['4 Saat',resample4h(h1)],['Günlük',resampleDaily(h1)]];
      for(const [tf,rows] of frames){
        try{vidyaRows.push(analyzeVidya(info,tf,rows,signalMode));}catch(e){errors.push({Sembol:info.symbol,Periyot:tf,Tür:'VIDYA',Hata:e.message});}
        try{emaRows.push(analyzeEma(info,tf,rows));}catch(e){errors.push({Sembol:info.symbol,Periyot:tf,Tür:'EMA',Hata:e.message});}
      }
    }catch(e){errors.push({Sembol:info.symbol,Periyot:'-',Tür:'Dosya',Hata:e.message});}
  }
  vidyaRows.sort((a,b)=>a.Periyot.localeCompare(b.Periyot,'tr')||b.Puan-a.Puan||a.Sembol.localeCompare(b.Sembol));
  emaRows.sort((a,b)=>a.Periyot.localeCompare(b.Periyot,'tr')||b['Tam Boğa Sıralaması']-a['Tam Boğa Sıralaması']||a.Sembol.localeCompare(b.Sembol));
  const wb=XLSX.utils.book_new();
  addSheet(wb,'VIDYA',vidyaRows); addSheet(wb,'EMA',emaRows); addSheet(wb,'Hatalar',errors);
  addSheet(wb,'Bilgi',[{Ayar:'VIDYA',Değer:'Fixed CMO 9 / CMO / Close'},{Ayar:'Sinyal Modu',Değer:signalMode},{Ayar:'Üretilen',Değer:new Date()}]);
  fs.mkdirSync(outputFolder,{recursive:true});
  const out=path.join(outputFolder,`BIST_VIDYA_EMA_${new Date().toISOString().slice(0,10)}.xlsx`);
  XLSX.writeFile(wb,out,{compression:true});
  return {out,vidyaCount:vidyaRows.length,emaCount:emaRows.length,errorCount:errors.length};
}

module.exports={buildReport};
