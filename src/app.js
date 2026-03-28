const express = require('express');
const path = require('path');
const projectRoutes = require('./routes/projectRoutes');
const configRoutes = require('./routes/configRoutes');
const openProjectRoutes = require('./routes/openProjectRoutes');
const statusRoutes = require('./routes/statusRoutes');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', projectRoutes);
app.use('/api', configRoutes);
app.use('/api', openProjectRoutes);
app.use('/api', statusRoutes);

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;