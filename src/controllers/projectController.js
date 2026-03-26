const { generateProjectPlan } = require('../services/aiService');
const { integrateProjectData } = require('../services/openProjectService');

const processProjectPayload = async (req, res) => {
  try {
    const { title, description, summaryTasks, individualTasks } = req.body;

    if (!title || !description || !summaryTasks || !individualTasks) {
      return res.status(400).json({ error: 'Missing required project data' });
    }

    const projectData = { title, description, summaryTasks, individualTasks };

    const aiPlan = await generateProjectPlan(projectData);

    const mergedData = { ...projectData, ...aiPlan };

    const result = await integrateProjectData(mergedData);

    return res.status(200).json({
      message: 'Project successfully processed and integrated into OpenProject',
      data: result,
      aiPlan: aiPlan
    });

  } catch (error) {
    return res.status(500).json({
      error: 'An error occurred while processing the project',
      details: error.message || error.toString(),
    });
  }
};

module.exports = {
  processProjectPayload,
};