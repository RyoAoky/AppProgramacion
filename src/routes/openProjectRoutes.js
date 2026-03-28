const express = require('express');
const { listProjects } = require('../controllers/openProjectController');

const router = express.Router();

router.get('/projects', listProjects);

module.exports = router;