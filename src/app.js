const express = require('express');
const projectRoutes = require('./routes/projectRoutes');

const app = express();

app.use(express.json());

app.use('/api', projectRoutes);

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;