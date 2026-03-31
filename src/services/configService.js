const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../config.json');

const loadInitialConfig = () => {
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
       return {};
    }
  }
  return {};
};

let config = {
  AI_API_URL: process.env.AI_API_URL || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4',
  OPENPROJECT_API_URL: process.env.OPENPROJECT_API_URL || '',
  OPENPROJECT_API_KEY: process.env.OPENPROJECT_API_KEY || '',
  ...loadInitialConfig()
};

const getConfig = () => {
  return config;
};

const updateConfig = (newConfig) => {
  config = { ...config, ...newConfig };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  return config;
};

module.exports = {
  getConfig,
  updateConfig
};