const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/statsController');

router.post('/frequency',            ctrl.frequency);
router.post('/averages',             ctrl.averages);
router.post('/variability',          ctrl.variability);
router.post('/outliers',             ctrl.outliers);
router.post('/normal',               ctrl.normalDist);
router.post('/zscores',              ctrl.zScores);
router.post('/correlation',          ctrl.correlation);
router.post('/regression',           ctrl.regression);
router.post('/multiple-regression',  ctrl.multipleRegression);

module.exports = router;
