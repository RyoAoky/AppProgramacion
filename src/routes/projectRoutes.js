const express = require('express');
const { processProjectPayload } = require('../controllers/projectController');

const router = express.Router();

router.post('/project/process', processProjectPayload);

module.exports = router;