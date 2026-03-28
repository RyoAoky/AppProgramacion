const express = require('express');
const { generatePlanning, syncOpenProject } = require('../controllers/projectController');

const router = express.Router();

router.post('/generate-planning', generatePlanning);
router.post('/sync-openproject', syncOpenProject);

module.exports = router;