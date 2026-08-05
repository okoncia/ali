'use strict';
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function normalizeHeader(s) {
  return String(s || '').trim().toLowerCase()
    .replaceAll('ı','i').replaceAll('ş','s').replaceAll('ğ','g')
    .replaceAll('ü','u').replaceAll('ö','o').replaceAll('ç','c');
}

function readCsv(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  return parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

function readSymbols(file) {
  const rows = readCsv(file);
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  const symbolKey = keys.find(k => ['sembol','symbol','ticker'].includes(normalizeHeader(k)));
  const descKey = keys.find(k => ['aciklama','description','name'].includes(normalizeHeader(k)));
  const sectorKey = keys.find(k => ['sektor','sector'].includes(normalizeHeader(k)));
  if (!symbolKey) throw new Error('CSV içinde Sembol/Symbol sütunu bulunamadı.');
  const seen = new Set();
  return rows.map(r => ({
    symbol: String(r[symbolKey] || '').trim().replace(/^BIST:/i, '').toUpperCase(),
    description: descKey ? String(r[descKey] || '') : '',
    sector: sectorKey ? String(r[sectorKey] || '') : ''
  })).filter(x => x.symbol && !seen.has(x.symbol) && seen.add(x.symbol));
}

function detectColumns(row) {
  const keys = Object.keys(row || {});
  const map = {};
  for (const k of keys) {
    const h = normalizeHeader(k);
    if (['time','date','datetime','tarih','zaman'].includes(h)) map.time = k;
    if (['open','acilis'].includes(h)) map.open = k;
    if (['high','yuksek'].includes(h)) map.high = k;
    if (['low','dusuk'].includes(h)) map.low = k;
    if (['close','kapanis'].includes(h)) map.close = k;
    if (['volume','hacim'].includes(h)) map.volume = k;
  }
  return map;
}

function parseMarketCsv(file) {
  const rows = readCsv(file);
  if (!rows.length) return [];
  const c = detectColumns(rows[0]);
  if (!c.close || !c.time) throw new Error(`OHLC CSV sütunları bulunamadı: ${path.basename(file)}`);
  return rows.map(r => ({
    time: new Date(r[c.time]),
    open: c.open ? Number(r[c.open]) : NaN,
    high: c.high ? Number(r[c.high]) : NaN,
    low: c.low ? Number(r[c.low]) : NaN,
    close: Number(r[c.close]),
    volume: c.volume ? Number(r[c.volume]) : 0
  })).filter(x => !Number.isNaN(x.time.getTime()) && Number.isFinite(x.close))
    .sort((a,b) => a.time - b.time);
}

function resample4h(rows) {
  const byDay = new Map();
  for (const r of rows) {
    const key = `${r.time.getFullYear()}-${r.time.getMonth()+1}-${r.time.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(r);
  }
  const out = [];
  for (const dayRows of byDay.values()) {
    dayRows.sort((a,b) => a.time-b.time);
    for (let i=0; i<dayRows.length; i+=4) {
      const g = dayRows.slice(i, i+4);
      if (!g.length) continue;
      out.push({
        time: g[g.length-1].time,
        open: g[0].open,
        high: Math.max(...g.map(x => x.high)),
        low: Math.min(...g.map(x => x.low)),
        close: g[g.length-1].close,
        volume: g.reduce((s,x) => s + (Number.isFinite(x.volume) ? x.volume : 0), 0)
      });
    }
  }
  return out.sort((a,b)=>a.time-b.time);
}

function resampleDaily(rows) {
  const byDay = new Map();
  for (const r of rows) {
    const key = `${r.time.getFullYear()}-${r.time.getMonth()+1}-${r.time.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(r);
  }
  const out = [];
  for (const g of byDay.values()) {
    g.sort((a,b)=>a.time-b.time);
    out.push({
      time: g[g.length-1].time,
      open: g[0].open,
      high: Math.max(...g.map(x=>x.high)),
      low: Math.min(...g.map(x=>x.low)),
      close: g[g.length-1].close,
      volume: g.reduce((s,x)=>s+(Number.isFinite(x.volume)?x.volume:0),0)
    });
  }
  return out.sort((a,b)=>a.time-b.time);
}

function locateSymbolFiles(folder, symbol) {
  const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith('.csv'));
  const exact = files.filter(f => f.toUpperCase().includes(symbol.toUpperCase()));
  return exact.map(f => path.join(folder, f));
}

module.exports = { readSymbols, parseMarketCsv, resample4h, resampleDaily, locateSymbolFiles };
