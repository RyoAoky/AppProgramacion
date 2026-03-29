const { getProjects } = require('../services/openProjectService');

const listProjects = async (req, res) => {
  try {
    const projects = await getProjects();
    return res.status(200).json(projects);
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const details = error.response && error.response.data ? error.response.data : error.message;
    return res.status(status).json({ error: 'Failed to fetch projects', details: details });
  }
};

module.exports = {
  listProjects
};