const express = require('express');
const { getConfiguration, updateConfiguration } = require('../controllers/configController');

const router = express.Router();

router.get('/config', getConfiguration);
router.post('/config', updateConfiguration);

module.exports = router;