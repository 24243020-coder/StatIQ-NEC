// ============================================================
//  STATS ENGINE  –  every calculation the app needs
// ============================================================

// ---------- helpers -----------------------------------------
function parseData(input) {
  if (Array.isArray(input)) return input.map(Number).filter(n => !isNaN(n));
  return String(input).split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
}

function sorted(data) {
  return [...data].sort((a, b) => a - b);
}

// ---------- central tendency --------------------------------
function mean(data) {
  return data.reduce((a, b) => a + b, 0) / data.length;
}

function median(data) {
  const s = sorted(data);
  const n = s.length;
  return n % 2 === 0 ? (s[n / 2 - 1] + s[n / 2]) / 2 : s[Math.floor(n / 2)];
}

function mode(data) {
  const freq = {};
  data.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  const max = Math.max(...Object.values(freq));
  return Object.entries(freq)
    .filter(([, v]) => v === max)
    .map(([k]) => Number(k));
}

// ---------- spread ------------------------------------------
function variance(data, sample = true) {
  const m = mean(data);
  const sum = data.reduce((a, b) => a + (b - m) ** 2, 0);
  return sum / (sample ? data.length - 1 : data.length);
}

function stdDev(data, sample = true) {
  return Math.sqrt(variance(data, sample));
}

// ---------- percentiles / IQR -------------------------------
function percentile(s, p) {
  const idx = (p / 100) * (s.length - 1);
  const lo  = Math.floor(idx);
  const hi  = Math.ceil(idx);
  return s[lo] + (idx - lo) * (s[hi] - s[lo]);
}

function iqrFences(data) {
  const s   = sorted(data);
  const q1  = percentile(s, 25);
  const q3  = percentile(s, 75);
  const iqr = q3 - q1;
  return { q1, q3, iqr, lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr };
}

// ---------- shape -------------------------------------------
function skewness(data) {
  const m = mean(data), sd = stdDev(data), n = data.length;
  return data.reduce((a, b) => a + ((b - m) / sd) ** 3, 0) / n;
}

function kurtosis(data) {
  const m = mean(data), sd = stdDev(data), n = data.length;
  return data.reduce((a, b) => a + ((b - m) / sd) ** 4, 0) / n - 3;
}

// ---------- frequency distribution --------------------------
function frequencyDist(data) {
  const s    = sorted(data);
  const n    = s.length;
  const bins = Math.max(5, Math.min(15, Math.round(1 + 3.322 * Math.log10(n))));
  const min  = s[0], max = s[n - 1];
  const bw   = (max - min) / bins || 1;
  const edges = Array.from({ length: bins + 1 }, (_, i) => min + i * bw);
  const counts = new Array(bins).fill(0);

  data.forEach(v => {
    const i = Math.min(bins - 1, Math.floor((v - min) / bw));
    counts[i]++;
  });

  let cum = 0;
  const table = counts.map((c, i) => {
    cum += c;
    return {
      interval:      `${edges[i].toFixed(2)} – ${edges[i + 1].toFixed(2)}`,
      from:           edges[i],
      to:             edges[i + 1],
      frequency:      c,
      relativeFreq:   +(c / n * 100).toFixed(2),
      cumulativeFreq: cum,
      cumulativePct:  +(cum / n * 100).toFixed(2),
    };
  });

  return { bins: table, binWidth: bw, min, max, n };
}

// ---------- normal distribution / z-scores ------------------
function zScore(value, m, sd) { return (value - m) / sd; }

function normalPDF(z) {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 +
    t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}

// ---------- correlation -------------------------------------
function pearsonR(x, y) {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  const num = x.reduce((a, xi, i) => a + (xi - mx) * (y[i] - my), 0);
  const den = Math.sqrt(
    x.reduce((a, xi) => a + (xi - mx) ** 2, 0) *
    y.reduce((a, yi) => a + (yi - my) ** 2, 0)
  );
  return den === 0 ? 0 : num / den;
}

function spearmanR(x, y) {
  const rank = arr => {
    const s = [...arr].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const r = new Array(arr.length);
    s.forEach((item, idx) => { r[item.i] = idx + 1; });
    return r;
  };
  return pearsonR(rank(x), rank(y));
}

// ---------- simple linear regression -----------------------
function linearRegression(x, y) {
  const n  = x.length;
  const mx = mean(x), my = mean(y);
  const slope = x.reduce((a, xi, i) => a + (xi - mx) * (y[i] - my), 0) /
                x.reduce((a, xi) => a + (xi - mx) ** 2, 0);
  const intercept  = my - slope * mx;
  const predicted  = x.map(xi => slope * xi + intercept);
  const residuals  = y.map((yi, i) => yi - predicted[i]);
  const ssTot      = y.reduce((a, yi) => a + (yi - my) ** 2, 0);
  const ssRes      = residuals.reduce((a, r) => a + r * r, 0);
  const r2         = 1 - ssRes / ssTot;
  const see        = Math.sqrt(ssRes / (n - 2));
  return { slope, intercept, r2, r: pearsonR(x, y), see, predicted, residuals };
}

// ---------- multiple regression  ----------------------------
function multipleRegression(X, y) {
  // X = array of predictor arrays
  const n = y.length, k = X.length;
  const mat = Array.from({ length: n }, (_, i) => [1, ...X.map(col => col[i])]);
  const Xt  = _transpose(mat);
  const coeffs = _gaussianElim(_matMul(Xt, mat), _matVec(Xt, y));
  const predicted = mat.map(row => row.reduce((a, v, j) => a + v * coeffs[j], 0));
  const residuals = y.map((yi, i) => yi - predicted[i]);
  const my   = mean(y);
  const ssTot = y.reduce((a, yi) => a + (yi - my) ** 2, 0);
  const ssRes = residuals.reduce((a, r) => a + r * r, 0);
  const r2    = 1 - ssRes / ssTot;
  const adjR2 = 1 - (1 - r2) * (n - 1) / (n - k - 1);
  const see   = Math.sqrt(ssRes / (n - k - 1));
  return { coeffs, r2, adjR2, see, predicted, residuals };
}

// --- matrix helpers (private) --------------------------------
function _transpose(M) {
  return M[0].map((_, j) => M.map(row => row[j]));
}
function _matMul(A, B) {
  return A.map(row =>
    B[0].map((_, j) => row.reduce((s, _, k) => s + row[k] * B[k][j], 0))
  );
}
function _matVec(A, v) {
  return A.map(row => row.reduce((s, a, j) => s + a * v[j], 0));
}
function _gaussianElim(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++) M[row][j] -= f * M[col][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n] / M[i][i];
    for (let j = i - 1; j >= 0; j--) M[j][n] -= M[j][i] * x[i];
  }
  return x;
}

module.exports = {
  parseData, sorted, mean, median, mode,
  variance, stdDev, percentile, iqrFences,
  skewness, kurtosis, frequencyDist,
  zScore, normalPDF, normalCDF,
  pearsonR, spearmanR,
  linearRegression, multipleRegression,
};
