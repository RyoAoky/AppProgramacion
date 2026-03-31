const express = require('express');
const { addClient } = require('../services/statusService');

const router = express.Router();

router.get('/status', (req, res) => {
  addClient(req, res);
});

module.exports = router;