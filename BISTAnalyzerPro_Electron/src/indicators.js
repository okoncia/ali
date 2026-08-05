'use strict';

function ema(values, length) {
  const out = new Array(values.length).fill(null);
  if (!values.length) return out;
  const alpha = 2 / (length + 1);
  let prev = Number(values[0]);
  out[0] = prev;
  for (let i = 1; i < values.length; i++) {
    const v = Number(values[i]);
    if (!Number.isFinite(v)) { out[i] = prev; continue; }
    prev = alpha * v + (1 - alpha) * prev;
    out[i] = prev;
  }
  return out;
}

function vidya(values, length, fixedCmo = 9) {
  const n = values.length;
  const out = new Array(n).fill(0);
  const gains = new Array(n).fill(0);
  const losses = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const d = Number(values[i]) - Number(values[i - 1]);
    gains[i] = d >= 0 ? d : 0;
    losses[i] = d < 0 ? -d : 0;
  }
  const alpha = 2 / (length + 1);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    let sg = 0, sl = 0;
    const start = Math.max(0, i - fixedCmo + 1);
    for (let j = start; j <= i; j++) { sg += gains[j]; sl += losses[j]; }
    const denom = sg + sl;
    const cmo = denom === 0 ? 0 : 100 * (sg - sl) / denom;
    const k = Math.abs(cmo) / 100;
    const src = Number(values[i]);
    const current = Number.isFinite(src) ? alpha * k * src + (1 - alpha * k) * prev : prev;
    out[i] = current;
    prev = current;
  }
  return out;
}

function crossedUp(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return false;
  return a[n - 1] > b[n - 1] && a[n - 2] <= b[n - 2];
}

function turnedUp(a) {
  const n = a.length;
  if (n < 3) return false;
  return a[n - 1] > a[n - 2] && a[n - 2] <= a[n - 3];
}

module.exports = { ema, vidya, crossedUp, turnedUp };
