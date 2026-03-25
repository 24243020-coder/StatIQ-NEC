const e = require('../utils/statsEngine');

exports.frequency = (req, res) => {
  try {
    const data = e.parseData(req.body.data);
    if (data.length < 2) return res.status(400).json({ error: 'Need at least 2 values' });
    res.json({ success: true, ...e.frequencyDist(data) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.averages = (req, res) => {
  try {
    const data = e.parseData(req.body.data);
    if (!data.length) return res.status(400).json({ error: 'No valid numbers' });
    const s = e.sorted(data);
    const { q1, q3, iqr } = e.iqrFences(data);
    res.json({ success: true, n: data.length,
      mean: +e.mean(data).toFixed(6), median: +e.median(data).toFixed(6),
      mode: e.mode(data), min: s[0], max: s[s.length-1],
      range: +(s[s.length-1]-s[0]).toFixed(6),
      q1: +q1.toFixed(6), q3: +q3.toFixed(6), iqr: +iqr.toFixed(6) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.variability = (req, res) => {
  try {
    const data = e.parseData(req.body.data);
    if (data.length < 2) return res.status(400).json({ error: 'Need at least 2 values' });
    res.json({ success: true, n: data.length,
      mean: +e.mean(data).toFixed(6),
      variance_s: +e.variance(data,true).toFixed(6),
      variance_p: +e.variance(data,false).toFixed(6),
      std_dev_s: +e.stdDev(data,true).toFixed(6),
      std_dev_p: +e.stdDev(data,false).toFixed(6),
      cv: +(e.stdDev(data,true)/e.mean(data)*100).toFixed(4),
      skewness: +e.skewness(data).toFixed(6),
      kurtosis: +e.kurtosis(data).toFixed(6) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.outliers = (req, res) => {
  try {
    const data = e.parseData(req.body.data);
    if (data.length < 4) return res.status(400).json({ error: 'Need at least 4 values' });
    const { q1, q3, iqr, lo, hi } = e.iqrFences(data);
    res.json({ success: true,
      q1: +q1.toFixed(4), q3: +q3.toFixed(4), iqr: +iqr.toFixed(4),
      lower_fence: +lo.toFixed(4), upper_fence: +hi.toFixed(4),
      outliers: data.filter(v => v < lo || v > hi),
      clean_data: data.filter(v => v >= lo && v <= hi),
      outlier_count: data.filter(v => v < lo || v > hi).length });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.normalDist = (req, res) => {
  try {
    const mu = Number(req.body.mean), sig = Number(req.body.sd), x = Number(req.body.value);
    if (isNaN(mu)||isNaN(sig)||isNaN(x)||sig<=0) return res.status(400).json({ error: 'Invalid parameters' });
    const z = e.zScore(x,mu,sig), cdf = e.normalCDF(z);
    res.json({ success: true, z: +z.toFixed(6), pdf: +e.normalPDF(z).toFixed(6),
      cdf_left: +cdf.toFixed(6), cdf_right: +(1-cdf).toFixed(6),
      percentile: +(cdf*100).toFixed(4) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.zScores = (req, res) => {
  try {
    const data = e.parseData(req.body.data);
    if (data.length < 2) return res.status(400).json({ error: 'Need at least 2 values' });
    const m = e.mean(data), sd = e.stdDev(data);
    res.json({ success: true, mean: +m.toFixed(6), std_dev: +sd.toFixed(6),
      z_scores: data.map(v => +e.zScore(v,m,sd).toFixed(6)), data });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.correlation = (req, res) => {
  try {
    const x = e.parseData(req.body.x), y = e.parseData(req.body.y);
    if (x.length !== y.length || x.length < 3) return res.status(400).json({ error: 'x and y must be equal length ≥ 3' });
    const r = e.pearsonR(x,y), n = x.length;
    res.json({ success: true, n, pearson_r: +r.toFixed(6),
      spearman_r: +e.spearmanR(x,y).toFixed(6),
      r_squared: +(r*r).toFixed(6),
      t_stat: +(r*Math.sqrt((n-2)/(1-r*r))).toFixed(6) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.regression = (req, res) => {
  try {
    const x = e.parseData(req.body.x), y = e.parseData(req.body.y);
    if (x.length !== y.length || x.length < 3) return res.status(400).json({ error: 'x and y must be equal length ≥ 3' });
    const r = e.linearRegression(x,y);
    res.json({ success: true, slope: +r.slope.toFixed(6), intercept: +r.intercept.toFixed(6),
      r: +r.r.toFixed(6), r2: +r.r2.toFixed(6), see: +r.see.toFixed(6),
      predicted: r.predicted.map(v=>+v.toFixed(4)),
      residuals: r.residuals.map(v=>+v.toFixed(4)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.multipleRegression = (req, res) => {
  try {
    const X = req.body.X.map(col => e.parseData(col)), y = e.parseData(req.body.y);
    if (X.some(col=>col.length!==y.length)||y.length<X.length+2) return res.status(400).json({ error: 'Invalid dimensions' });
    const r = e.multipleRegression(X,y);
    res.json({ success: true, coefficients: r.coeffs.map(v=>+v.toFixed(6)),
      r2: +r.r2.toFixed(6), adj_r2: +r.adjR2.toFixed(6), see: +r.see.toFixed(6),
      predicted: r.predicted.map(v=>+v.toFixed(4)),
      residuals: r.residuals.map(v=>+v.toFixed(4)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
