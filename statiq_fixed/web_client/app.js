
const API = '';  // backend optional
const charts = {};
const palette = {
  navy:'#10264d',
  navy2:'#1a2b5e',
  gold:'#c9a84c',
  goldSoft:'rgba(201,168,76,0.25)',
  red:'#c94c4c',
  green:'#198754'
};

// ── Local calculation engine so project works in Live Server too ──
function parseData(input) {
  if (Array.isArray(input)) return input.map(Number).filter(n => !isNaN(n));
  return String(input).split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
}
function sorted(data) { return [...data].sort((a,b)=>a-b); }
function mean(data) { return data.reduce((a,b)=>a+b,0)/data.length; }
function median(data) {
  const s = sorted(data), n = s.length;
  return n % 2 === 0 ? (s[n/2-1] + s[n/2]) / 2 : s[Math.floor(n/2)];
}
function mode(data) {
  const freq = {};
  data.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const max = Math.max(...Object.values(freq));
  return Object.entries(freq).filter(([,v]) => v === max).map(([k]) => Number(k));
}
function variance(data, sample=true) {
  const m = mean(data);
  const sum = data.reduce((a,b)=>a + (b-m)**2, 0);
  return sum / (sample ? data.length - 1 : data.length);
}
function stdDev(data, sample=true) { return Math.sqrt(variance(data, sample)); }
function percentile(s, p) {
  const idx = (p/100) * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx);
  return s[lo] + (idx - lo) * (s[hi] - s[lo]);
}
function iqrFences(data) {
  const s = sorted(data), q1 = percentile(s,25), q3 = percentile(s,75), iqr = q3 - q1;
  return { q1, q3, iqr, lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr };
}
function skewness(data) {
  const m = mean(data), sd = stdDev(data), n = data.length;
  return data.reduce((a,b)=>a + ((b-m)/sd)**3, 0) / n;
}
function kurtosis(data) {
  const m = mean(data), sd = stdDev(data), n = data.length;
  return data.reduce((a,b)=>a + ((b-m)/sd)**4, 0) / n - 3;
}
function frequencyDist(data) {
  const s = sorted(data), n = s.length;
  const bins = Math.max(5, Math.min(15, Math.round(1 + 3.322 * Math.log10(n))));
  const min = s[0], max = s[n-1], bw = (max - min) / bins || 1;
  const edges = Array.from({ length: bins + 1 }, (_,i) => min + i * bw);
  const counts = new Array(bins).fill(0);
  data.forEach(v => { const i = Math.min(bins - 1, Math.floor((v - min) / bw)); counts[i]++; });
  let cum = 0;
  const table = counts.map((c,i) => {
    cum += c;
    return {
      interval: `${edges[i].toFixed(2)} – ${edges[i+1].toFixed(2)}`,
      from: edges[i], to: edges[i+1], frequency: c,
      relativeFreq: +(c / n * 100).toFixed(2), cumulativeFreq: cum,
      cumulativePct: +(cum / n * 100).toFixed(2)
    };
  });
  return { bins: table, binWidth: bw, min, max, n };
}
function zScore(value, m, sd) { return (value - m) / sd; }
function normalPDFValue(z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }
function pearsonR(x, y) {
  const mx = mean(x), my = mean(y);
  const num = x.reduce((a,xi,i)=>a + (xi-mx) * (y[i]-my), 0);
  const den = Math.sqrt(x.reduce((a,xi)=>a + (xi-mx)**2,0) * y.reduce((a,yi)=>a + (yi-my)**2,0));
  return den === 0 ? 0 : num / den;
}
function spearmanR(x, y) {
  const rank = arr => {
    const s = [...arr].map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v);
    const r = new Array(arr.length);
    s.forEach((item, idx) => { r[item.i] = idx + 1; });
    return r;
  };
  return pearsonR(rank(x), rank(y));
}
function linearRegression(x, y) {
  const n = x.length, mx = mean(x), my = mean(y);
  const slope = x.reduce((a,xi,i)=>a + (xi-mx) * (y[i]-my), 0) / x.reduce((a,xi)=>a + (xi-mx)**2, 0);
  const intercept = my - slope * mx;
  const predicted = x.map(xi => slope * xi + intercept);
  const residuals = y.map((yi,i) => yi - predicted[i]);
  const ssTot = y.reduce((a,yi)=>a + (yi-my)**2, 0);
  const ssRes = residuals.reduce((a,r)=>a + r*r, 0);
  const r2 = 1 - ssRes / ssTot;
  const see = Math.sqrt(ssRes / (n - 2));
  return { slope, intercept, r2, r: pearsonR(x,y), see, predicted, residuals };
}
function localCompute(endpoint, body) {
  try {
    if (endpoint === 'frequency') {
      const data = parseData(body.data);
      if (data.length < 2) return { success:false, error:'Need at least 2 values' };
      return { success:true, ...frequencyDist(data) };
    }
    if (endpoint === 'averages') {
      const data = parseData(body.data); if (!data.length) return { success:false, error:'No valid numbers' };
      const s = sorted(data), { q1, q3, iqr } = iqrFences(data);
      return { success:true, n:data.length, mean:+mean(data).toFixed(6), median:+median(data).toFixed(6), mode:mode(data), min:s[0], max:s[s.length-1], range:+(s[s.length-1]-s[0]).toFixed(6), q1:+q1.toFixed(6), q3:+q3.toFixed(6), iqr:+iqr.toFixed(6) };
    }
    if (endpoint === 'variability') {
      const data = parseData(body.data); if (data.length < 2) return { success:false, error:'Need at least 2 values' };
      return { success:true, n:data.length, mean:+mean(data).toFixed(6), variance_s:+variance(data,true).toFixed(6), variance_p:+variance(data,false).toFixed(6), std_dev_s:+stdDev(data,true).toFixed(6), std_dev_p:+stdDev(data,false).toFixed(6), cv:+(stdDev(data,true)/mean(data)*100).toFixed(4), skewness:+skewness(data).toFixed(6), kurtosis:+kurtosis(data).toFixed(6) };
    }
    if (endpoint === 'outliers') {
      const data = parseData(body.data); if (data.length < 4) return { success:false, error:'Need at least 4 values' };
      const { q1, q3, iqr, lo, hi } = iqrFences(data);
      const outliers = data.filter(v => v < lo || v > hi), clean = data.filter(v => v >= lo && v <= hi);
      return { success:true, q1:+q1.toFixed(4), q3:+q3.toFixed(4), iqr:+iqr.toFixed(4), lower_fence:+lo.toFixed(4), upper_fence:+hi.toFixed(4), outliers, clean_data:clean, outlier_count:outliers.length };
    }
    if (endpoint === 'normal') {
      const mu = Number(body.mean), sig = Number(body.sd), x = Number(body.value);
      if (isNaN(mu) || isNaN(sig) || isNaN(x) || sig <= 0) return { success:false, error:'Invalid parameters' };
      const z = zScore(x, mu, sig), cdf = normalCDF(z);
      return { success:true, z:+z.toFixed(6), pdf:+(normalPDFValue(z)/sig).toFixed(6), cdf_left:+cdf.toFixed(6), cdf_right:+(1-cdf).toFixed(6), percentile:+(cdf*100).toFixed(4) };
    }
    if (endpoint === 'zscores') {
      const data = parseData(body.data); if (data.length < 2) return { success:false, error:'Need at least 2 values' };
      const m = mean(data), sd = stdDev(data);
      return { success:true, mean:+m.toFixed(6), std_dev:+sd.toFixed(6), z_scores:data.map(v => +zScore(v,m,sd).toFixed(6)), data };
    }
    if (endpoint === 'correlation') {
      const x = parseData(body.x), y = parseData(body.y);
      if (x.length !== y.length || x.length < 3) return { success:false, error:'x and y must be equal length ≥ 3' };
      const r = pearsonR(x, y), n = x.length;
      return { success:true, n, pearson_r:+r.toFixed(6), spearman_r:+spearmanR(x,y).toFixed(6), r_squared:+(r*r).toFixed(6), t_stat:+(r*Math.sqrt((n-2)/(1-r*r))).toFixed(6) };
    }
    if (endpoint === 'regression') {
      const x = parseData(body.x), y = parseData(body.y);
      if (x.length !== y.length || x.length < 3) return { success:false, error:'x and y must be equal length ≥ 3' };
      const r = linearRegression(x, y);
      return { success:true, slope:+r.slope.toFixed(6), intercept:+r.intercept.toFixed(6), r:+r.r.toFixed(6), r2:+r.r2.toFixed(6), see:+r.see.toFixed(6), predicted:r.predicted.map(v=>+v.toFixed(4)), residuals:r.residuals.map(v=>+v.toFixed(4)) };
    }
    return { success:false, error:'Unsupported calculation' };
  } catch (err) {
    return { success:false, error:err.message || 'Calculation failed' };
  }
}

// ── Navigation ───────────────────────────────────────────────
function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-'+id).classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── Helpers ──────────────────────────────────────────────────
function metric(label, value, cls='') {
  const small = String(value).length > 8 ? ' small' : '';
  return `<div class="metric ${cls}"><div class="metric-label">${label}</div><div class="metric-value${small}">${value}</div></div>`;
}
function infoBox(cls, html) { return `<div class="info-box ${cls}">${html}</div>`; }
async function post(endpoint, body) {
  try {
    const res = await fetch(API + '/api/' + endpoint, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) throw new Error('Backend unavailable');
    return await res.json();
  } catch (err) {
    return localCompute(endpoint, body);
  }
}
function clearSection(id) {
  document.querySelectorAll(`#sec-${id} textarea, #sec-${id} input`).forEach(el => el.value='');
  const res = document.getElementById(`${id}-results`);
  if (res) res.style.display='none';
  const chartMap = {freq:'freq-chart',avg:'avg-chart',var:'var-chart',outlier:'outlier-chart',normal:'normal-chart',zscore:'zscore-chart',corr:'corr-chart',reg:'reg-chart'};
  if (chartMap[id]) destroyChart(chartMap[id]);
}
function fmt(n) { return typeof n==='number' ? (Number.isInteger(n)?n:n.toFixed(4)) : n; }
function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}
function createChart(id, config) {
  destroyChart(id);
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  charts[id] = new Chart(ctx, config);
  return charts[id];
}
function chartOptions(title) {
  return {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{
      legend:{labels:{color:palette.navy}},
      title:{display:!!title,text:title,color:palette.navy,font:{weight:'bold',size:14}}
    },
    scales:{
      x:{ticks:{color:palette.navy}, grid:{color:'rgba(16,38,77,0.08)'}},
      y:{ticks:{color:palette.navy}, grid:{color:'rgba(16,38,77,0.08)'}}
    }
  };
}
function generateNormalCurve(mean, sd, points=121) {
  const xs = [], ys = [];
  const start = mean - 4*sd, end = mean + 4*sd, step = (end-start)/(points-1);
  for (let i=0;i<points;i++) {
    const x = start + step*i;
    const z = (x-mean)/sd;
    const y = Math.exp(-0.5*z*z)/(sd*Math.sqrt(2*Math.PI));
    xs.push(+x.toFixed(2)); ys.push(y);
  }
  return {xs, ys};
}

// ── FREQUENCY ────────────────────────────────────────────────
async function calcFreq() {
  const data = document.getElementById('freq-data').value.trim();
  if (!data) return alert('Please enter data values.');
  const res = await post('frequency', {data});
  if (!res.success) return alert(res.error);
  const r = document.getElementById('freq-results');
  r.style.display='block';
  document.getElementById('freq-metrics').innerHTML =
    metric('N (Count)', res.n) +
    metric('Min', fmt(res.min)) +
    metric('Max', fmt(res.max)) +
    metric('Bin Width', fmt(res.binWidth), 'gold');
  const tb = document.getElementById('freq-tbody');
  tb.innerHTML = res.bins.map(b =>
    `<tr><td>${b.interval}</td><td>${b.frequency}</td><td>${b.relativeFreq}%</td><td>${b.cumulativeFreq}</td><td>${b.cumulativePct}%</td></tr>`
  ).join('');
  createChart('freq-chart', {
    type:'bar',
    data:{
      labels:res.bins.map(b=>b.interval),
      datasets:[
        {label:'Frequency', data:res.bins.map(b=>b.frequency), backgroundColor:palette.goldSoft, borderColor:palette.gold, borderWidth:2},
        {label:'Cumulative Frequency', data:res.bins.map(b=>b.cumulativeFreq), type:'line', borderColor:palette.navy2, backgroundColor:palette.navy2, tension:0.25, yAxisID:'y1'}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{labels:{color:palette.navy}}, title:{display:true, text:'Frequency Distribution Graph', color:palette.navy, font:{weight:'bold',size:14}}},
      scales:{
        x:{ticks:{color:palette.navy}, grid:{color:'rgba(16,38,77,0.08)'}},
        y:{ticks:{color:palette.navy}, grid:{color:'rgba(16,38,77,0.08)'}, beginAtZero:true},
        y1:{position:'right', ticks:{color:palette.gold}, grid:{drawOnChartArea:false}, beginAtZero:true}
      }
    }
  });
}

// ── AVERAGES ─────────────────────────────────────────────────
async function calcAvg() {
  const data = document.getElementById('avg-data').value.trim();
  if (!data) return alert('Please enter data values.');
  const res = await post('averages', {data});
  if (!res.success) return alert(res.error);
  document.getElementById('avg-results').style.display='block';
  document.getElementById('avg-metrics').innerHTML =
    metric('Mean', fmt(res.mean), 'gold') +
    metric('Median', fmt(res.median)) +
    metric('Mode', Array.isArray(res.mode)?res.mode.join(', '):res.mode) +
    metric('N', res.n) +
    metric('Min', fmt(res.min)) +
    metric('Max', fmt(res.max)) +
    metric('Range', fmt(res.range)) +
    metric('Q1', fmt(res.q1),'green') +
    metric('Q3', fmt(res.q3),'green') +
    metric('IQR', fmt(res.iqr),'green');
  const modeNote = Array.isArray(res.mode) && res.mode.length > 1
    ? `Multimodal distribution — modes: ${res.mode.join(', ')}`
    : `The mode is ${Array.isArray(res.mode)?res.mode[0]:res.mode}`;
  document.getElementById('avg-info').innerHTML =
    infoBox('info-blue', `<b>Mean = ${fmt(res.mean)}</b> — the arithmetic average of all ${res.n} values.`) +
    infoBox('info-green', `<b>Median = ${fmt(res.median)}</b> — the middle value when sorted.`) +
    infoBox('info-amber', `<b>${modeNote}</b>`);
  const modeValue = Array.isArray(res.mode) ? res.mode[0] : res.mode;
  createChart('avg-chart', {
    type:'bar',
    data:{
      labels:['Mean','Median','Mode','Q1','Q3'],
      datasets:[{label:'Value', data:[res.mean,res.median,modeValue,res.q1,res.q3], backgroundColor:[palette.goldSoft,palette.goldSoft,palette.goldSoft,'rgba(25,135,84,0.18)','rgba(25,135,84,0.18)'], borderColor:[palette.gold,palette.gold,palette.gold,palette.green,palette.green], borderWidth:2}]
    },
    options: chartOptions('Measures of Central Tendency')
  });
}

// ── VARIABILITY ──────────────────────────────────────────────
async function calcVar() {
  const data = document.getElementById('var-data').value.trim();
  if (!data) return alert('Please enter data values.');
  const res = await post('variability', {data});
  if (!res.success) return alert(res.error);
  document.getElementById('var-results').style.display='block';
  const skewDesc = res.skewness > 0.5 ? 'Positively skewed (right tail)' :
                   res.skewness < -0.5 ? 'Negatively skewed (left tail)' : 'Approximately symmetric';
  document.getElementById('var-metrics').innerHTML =
    metric('Std Dev (s)', fmt(res.std_dev_s), 'gold') +
    metric('Std Dev (σ)', fmt(res.std_dev_p)) +
    metric('Variance (s²)', fmt(res.variance_s)) +
    metric('Variance (σ²)', fmt(res.variance_p)) +
    metric('CV (%)', fmt(res.cv),'green') +
    metric('Skewness', fmt(res.skewness)) +
    metric('Kurtosis', fmt(res.kurtosis));
  document.getElementById('var-info').innerHTML =
    infoBox('info-blue', `<b>CV = ${fmt(res.cv)}%</b> — Coefficient of Variation measures relative spread.`) +
    infoBox('info-amber', `<b>Skewness = ${fmt(res.skewness)}</b> — ${skewDesc}.`);
  createChart('var-chart', {
    type:'bar',
    data:{
      labels:['Variance (s²)','Variance (σ²)','Std Dev (s)','Std Dev (σ)','CV %','Skewness','Kurtosis'],
      datasets:[{label:'Statistic', data:[res.variance_s,res.variance_p,res.std_dev_s,res.std_dev_p,res.cv,res.skewness,res.kurtosis], backgroundColor:['rgba(201,168,76,0.25)','rgba(201,168,76,0.18)','rgba(16,38,77,0.18)','rgba(16,38,77,0.12)','rgba(25,135,84,0.18)','rgba(201,76,76,0.16)','rgba(201,76,76,0.22)'], borderColor:[palette.gold,palette.gold,palette.navy,palette.navy,palette.green,palette.red,palette.red], borderWidth:2}]
    },
    options: chartOptions('Measures of Variability')
  });
}

// ── OUTLIERS ─────────────────────────────────────────────────
async function calcOutlier() {
  const data = document.getElementById('outlier-data').value.trim();
  if (!data) return alert('Please enter data values.');
  const res = await post('outliers', {data});
  if (!res.success) return alert(res.error);
  document.getElementById('outlier-results').style.display='block';
  document.getElementById('outlier-metrics').innerHTML =
    metric('Q1', fmt(res.q1)) +
    metric('Q3', fmt(res.q3)) +
    metric('IQR', fmt(res.iqr), 'gold') +
    metric('Lower Fence', fmt(res.lower_fence), 'red') +
    metric('Upper Fence', fmt(res.upper_fence), 'red') +
    metric('Outliers Found', res.outlier_count, res.outlier_count>0?'red':'green');
  document.getElementById('outlier-info').innerHTML = res.outlier_count > 0
    ? infoBox('info-red', `<b>${res.outlier_count} outlier(s) detected:</b> ${res.outliers.join(', ')} — values outside [${fmt(res.lower_fence)}, ${fmt(res.upper_fence)}].`)
    : infoBox('info-green', `<b>No outliers detected.</b> All values fall within the IQR fences [${fmt(res.lower_fence)}, ${fmt(res.upper_fence)}].`);
  document.getElementById('outlier-list').innerHTML = res.outlier_count > 0
    ? infoBox('info-blue', `<b>Clean data (${res.clean_data.length} values):</b> ${res.clean_data.join(', ')}`) : '';
  const sortedAll = [...res.clean_data, ...res.outliers].sort((a,b)=>a-b);
  createChart('outlier-chart', {
    type:'bar',
    data:{
      labels:sortedAll.map((_,i)=>'Value '+(i+1)),
      datasets:[{
        label:'Data Values',
        data:sortedAll,
        backgroundColor:sortedAll.map(v => (res.outliers.includes(v) ? 'rgba(201,76,76,0.22)' : 'rgba(16,38,77,0.14)')),
        borderColor:sortedAll.map(v => (res.outliers.includes(v) ? palette.red : palette.navy)),
        borderWidth:2
      }]
    },
    options: chartOptions('Outlier Detection Graph')
  });
}

// ── NORMAL DIST ──────────────────────────────────────────────
async function calcNormal() {
  const mean = document.getElementById('norm-mean').value;
  const sd   = document.getElementById('norm-sd').value;
  const x    = document.getElementById('norm-x').value;
  if (!mean||!sd||!x) return alert('Please fill all three fields.');
  const res = await post('normal', {mean,sd,value:x});
  if (!res.success) return alert(res.error);
  document.getElementById('normal-results').style.display='block';
  document.getElementById('normal-metrics').innerHTML =
    metric('Z-Score', fmt(res.z), 'gold') +
    metric('PDF f(x)', fmt(res.pdf)) +
    metric('P(X ≤ x)', fmt(res.cdf_left), 'green') +
    metric('P(X > x)', fmt(res.cdf_right), 'red') +
    metric('Percentile', fmt(res.percentile)+'th', 'gold');
  document.getElementById('normal-info').innerHTML =
    infoBox('info-blue', `For X = ${x} with μ = ${mean} and σ = ${sd}: <b>Z = ${fmt(res.z)}</b>`) +
    infoBox('info-green', `<b>P(X ≤ ${x}) = ${fmt(res.cdf_left)}</b> — ${(res.cdf_left*100).toFixed(2)}% of data falls at or below this value.`) +
    infoBox('info-amber', `<b>P(X > ${x}) = ${fmt(res.cdf_right)}</b> — ${(res.cdf_right*100).toFixed(2)}% of data exceeds this value.`);
  const curve = generateNormalCurve(Number(mean), Number(sd));
  createChart('normal-chart', {
    type:'line',
    data:{
      labels:curve.xs,
      datasets:[
        {label:'Normal Curve', data:curve.ys, borderColor:palette.navy, backgroundColor:'rgba(16,38,77,0.08)', tension:0.25, fill:true, pointRadius:0},
        {label:'Selected X', data:curve.xs.map(v => Math.abs(v-Number(x))<((curve.xs[1]-curve.xs[0])/2)?Math.max(...curve.ys):null), borderColor:palette.gold, pointBackgroundColor:palette.gold, showLine:false, pointRadius:5}
      ]
    },
    options: chartOptions('Normal Distribution Curve')
  });
}

// ── Z-SCORES ─────────────────────────────────────────────────
async function calcZscore() {
  const data = document.getElementById('zscore-data').value.trim();
  if (!data) return alert('Please enter data values.');
  const res = await post('zscores', {data});
  if (!res.success) return alert(res.error);
  document.getElementById('zscore-results').style.display='block';
  document.getElementById('zscore-metrics').innerHTML =
    metric('Mean', fmt(res.mean), 'gold') +
    metric('Std Dev', fmt(res.std_dev));
  const tb = document.getElementById('zscore-tbody');
  tb.innerHTML = res.data.map((v,i) => {
    const z = res.z_scores[i];
    const interp = z > 2 ? 'Far above mean' : z < -2 ? 'Far below mean' :
                   z > 1 ? 'Above mean' : z < -1 ? 'Below mean' : 'Near mean';
    return `<tr><td>${i+1}</td><td>${v}</td><td><b>${fmt(z)}</b></td><td>${interp}</td></tr>`;
  }).join('');
  createChart('zscore-chart', {
    type:'line',
    data:{
      labels:res.data.map((_,i)=>'X'+(i+1)),
      datasets:[
        {label:'Original Values', data:res.data, borderColor:palette.gold, backgroundColor:'rgba(201,168,76,0.22)', tension:0.25},
        {label:'Z-Scores', data:res.z_scores, borderColor:palette.navy, backgroundColor:'rgba(16,38,77,0.14)', tension:0.25}
      ]
    },
    options: chartOptions('Z-Score Graph')
  });
}

// ── CORRELATION ──────────────────────────────────────────────
async function calcCorr() {
  const x = document.getElementById('corr-x').value.trim();
  const y = document.getElementById('corr-y').value.trim();
  if (!x||!y) return alert('Please enter both X and Y values.');
  const res = await post('correlation', {x,y});
  if (!res.success) return alert(res.error);
  document.getElementById('corr-results').style.display='block';
  const r = res.pearson_r;
  const strength = Math.abs(r)>=0.9?'Very Strong':Math.abs(r)>=0.7?'Strong':Math.abs(r)>=0.5?'Moderate':Math.abs(r)>=0.3?'Weak':'Very Weak';
  const direction = r>0?'Positive':'Negative';
  document.getElementById('corr-metrics').innerHTML =
    metric('Pearson r', fmt(res.pearson_r), Math.abs(r)>=0.7?'green':'gold') +
    metric('Spearman ρ', fmt(res.spearman_r)) +
    metric('R² (CoD)', fmt(res.r_squared), 'gold') +
    metric('t-Statistic', fmt(res.t_stat)) +
    metric('n', res.n);
  document.getElementById('corr-info').innerHTML =
    infoBox('info-blue', `<b>r = ${fmt(r)}</b> — ${strength} ${direction} linear correlation.`) +
    infoBox('info-green', `<b>R² = ${fmt(res.r_squared)}</b> — ${(res.r_squared*100).toFixed(1)}% of variance in Y is explained by X.`);
  const xArr = x.split(/[\s,]+/).map(Number).filter(n=>!isNaN(n));
  const yArr = y.split(/[\s,]+/).map(Number).filter(n=>!isNaN(n));
  createChart('corr-chart', {
    type:'scatter',
    data:{
      datasets:[{
        label:'X vs Y',
        data:xArr.map((xi,i)=>({x:xi,y:yArr[i]})),
        backgroundColor:'rgba(201,168,76,0.5)',
        borderColor:palette.navy,
        borderWidth:1.5,
        pointRadius:5
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{labels:{color:palette.navy}}, title:{display:true, text:'Correlation Scatter Plot', color:palette.navy, font:{weight:'bold',size:14}}},
      scales:{
        x:{type:'linear', position:'bottom', ticks:{color:palette.navy}, grid:{color:'rgba(16,38,77,0.08)'}},
        y:{ticks:{color:palette.navy}, grid:{color:'rgba(16,38,77,0.08)'}}
      }
    }
  });
}

// ── REGRESSION ───────────────────────────────────────────────
async function calcReg() {
  const x = document.getElementById('reg-x').value.trim();
  const y = document.getElementById('reg-y').value.trim();
  if (!x||!y) return alert('Please enter both X and Y values.');
  const res = await post('regression', {x,y});
  if (!res.success) return alert(res.error);
  document.getElementById('reg-results').style.display='block';
  const sign = res.intercept>=0?'+':'-';
  document.getElementById('reg-metrics').innerHTML =
    metric('Slope (b)', fmt(res.slope), 'gold') +
    metric('Intercept (a)', fmt(res.intercept)) +
    metric('r', fmt(res.r), 'green') +
    metric('R²', fmt(res.r2), 'green') +
    metric('SEE', fmt(res.see));
  document.getElementById('reg-info').innerHTML =
    infoBox('info-blue', `<b>Regression Equation: Ŷ = ${fmt(res.slope)}X ${sign} ${Math.abs(res.intercept).toFixed(4)}</b>`) +
    infoBox('info-green', `<b>R² = ${fmt(res.r2)}</b> — the model explains ${(res.r2*100).toFixed(1)}% of the variability.`);
  const xArr = x.split(/[\s,]+/).map(Number).filter(n=>!isNaN(n));
  const yArr = y.split(/[\s,]+/).map(Number).filter(n=>!isNaN(n));
  const tb = document.getElementById('reg-tbody');
  tb.innerHTML = xArr.map((xi,i) =>
    `<tr><td>${xi}</td><td>${yArr[i]}</td><td>${fmt(res.predicted[i])}</td><td>${fmt(res.residuals[i])}</td></tr>`
  ).join('');
  document.getElementById('reg-table-wrap').style.display='block';
  const points = xArr.map((xi,i)=>({x:xi,y:yArr[i]})).sort((a,b)=>a.x-b.x);
  const line = xArr.map((xi,i)=>({x:xi,y:res.predicted[i]})).sort((a,b)=>a.x-b.x);
  createChart('reg-chart', {
    data:{
      datasets:[
        {type:'scatter', label:'Actual Values', data:points, backgroundColor:'rgba(201,168,76,0.55)', borderColor:palette.navy, pointRadius:5},
        {type:'line', label:'Regression Line', data:line, borderColor:palette.navy, backgroundColor:'rgba(16,38,77,0.08)', tension:0}
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{labels:{color:palette.navy}}, title:{display:true, text:'Linear Regression Graph', color:palette.navy, font:{weight:'bold',size:14}}},
      scales:{
        x:{type:'linear', position:'bottom', ticks:{color:palette.navy}, grid:{color:'rgba(16,38,77,0.08)'}},
        y:{ticks:{color:palette.navy}, grid:{color:'rgba(16,38,77,0.08)'}}
      }
    }
  });
}

// ── Z-TABLE ──────────────────────────────────────────────────
function buildZTable() {
  const cols = [0.00,0.01,0.02,0.03,0.04,0.05,0.06,0.07,0.08,0.09];
  const rows = [];
  for (let i=-34;i<=34;i++) rows.push((i/10).toFixed(1));
  const tbl = document.getElementById('ztable');
  let html = '<thead><tr><th>z</th>'+cols.map(c=>`<th>${c.toFixed(2)}</th>`).join('')+'</tr></thead><tbody>';
  rows.forEach(r => {
    html += `<tr><td class="z-row-head">${r}</td>`;
    cols.forEach(c => {
      const z = parseFloat(r)+c;
      const p = normalCDF(z);
      html += `<td onclick="highlightZ(${z.toFixed(2)},${p.toFixed(4)})" title="z=${z.toFixed(2)}">${p.toFixed(4)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  tbl.innerHTML = html;
}

function highlightZ(z, p) {
  const box = document.getElementById('ztable-highlight');
  box.style.display='block';
  box.innerHTML = `<b>z = ${z}</b> → P(Z ≤ ${z}) = <b>${p}</b> &nbsp;|&nbsp; P(Z > ${z}) = <b>${(1-p).toFixed(4)}</b>`;
}

function normalCDF(z) {
  const t=1/(1+0.2316419*Math.abs(z));
  const d=0.3989423*Math.exp(-z*z/2);
  const p=d*t*(0.3193815+t*(-0.3565638+t*(1.7814779+t*(-1.8212560+t*1.3302744))));
  return z>0?1-p:p;
}

// ── T-TABLE ──────────────────────────────────────────────────
function buildTTable() {
  const alphas=[0.10,0.05,0.025,0.01,0.005,0.001];
  const dfs=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,40,60,80,100,120,1000];
  const tCrit=(df,a)=>{
    // Approximation using Wilson-Hilferty
    const x=df,p=1-a;
    const z=(()=>{
      const t=Math.sqrt(-2*Math.log(1-p));
      return t-(2.515517+0.802853*t+0.010328*t*t)/(1+1.432788*t+0.189269*t*t+0.001308*t*t*t);
    })();
    return +(z*(1+z*z/(2*x))*Math.sqrt(1+z*z/(2*x)+(z*z*z*z-5*z*z/2-1)/(8*x*x))).toFixed(4);
  };
  const tbl=document.getElementById('ttable');
  let html='<thead><tr><th>df \\ α (two-tail)</th>'+alphas.map(a=>`<th>${a}</th>`).join('')+'</tr></thead><tbody>';
  dfs.forEach(df=>{
    html+=`<tr><td class="df-col">${df}</td>`;
    alphas.forEach(a=>{ html+=`<td>${tCrit(df,a/2)}</td>`; });
    html+='</tr>';
  });
  html+='</tbody>';
  tbl.innerHTML=html;
}

// ── INIT ─────────────────────────────────────────────────────
buildZTable();
buildTTable();
