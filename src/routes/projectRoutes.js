const express = require('express');
const { generatePlanning, syncOpenProject, getProjectHistory, getProjectHistoryDetail } = require('../controllers/projectController');

const router = express.Router();

router.post('/generate-planning', generatePlanning);
router.post('/sync-openproject', syncOpenProject);
router.get('/history/:projectId', getProjectHistory);
router.get('/history/:projectId/:filename', getProjectHistoryDetail);

module.exports = router;