const { getProjects } = require('../services/openProjectService');

const listProjects = async (req, res) => {
  try {
    const projects = await getProjects();
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch projects', details: error.message || error.toString() });
  }
};

module.exports = {
  listProjects
};