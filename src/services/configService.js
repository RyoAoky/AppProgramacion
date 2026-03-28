let config = {
  AI_API_URL: process.env.AI_API_URL || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4',
  OPENPROJECT_API_URL: process.env.OPENPROJECT_API_URL || '',
  OPENPROJECT_API_KEY: process.env.OPENPROJECT_API_KEY || ''
};

const getConfig = () => {
  return config;
};

const updateConfig = (newConfig) => {
  config = { ...config, ...newConfig };
  return config;
};

module.exports = {
  getConfig,
  updateConfig
};