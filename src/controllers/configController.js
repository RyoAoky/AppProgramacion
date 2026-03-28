const { getConfig, updateConfig } = require('../services/configService');

const getConfiguration = (req, res) => {
  try {
    const config = getConfig();
    return res.status(200).json(config);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve configuration', details: error.message });
  }
};

const updateConfiguration = (req, res) => {
  try {
    const newConfig = req.body;
    const updated = updateConfig(newConfig);
    return res.status(200).json({ message: 'Configuration updated successfully', config: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update configuration', details: error.message });
  }
};

module.exports = {
  getConfiguration,
  updateConfiguration
};