const { generateProjectPlan } = require('../services/aiService');
const { integrateProjectData } = require('../services/openProjectService');

const { broadcastStatus } = require('../services/statusService');

const generatePlanning = async (req, res) => {
  try {
    const { projectId, title, description, summaryTasks, individualTasks } = req.body;

    if (!projectId || !title || !description) {
      return res.status(400).json({ error: 'Missing required project data' });
    }

    const projectData = { projectId, title, description, summaryTasks, individualTasks };

    broadcastStatus('Conectando con IA...');
    const aiPlan = await generateProjectPlan(projectData);

    broadcastStatus('Propuesta de IA recibida. Esperando Confirmación...');

    return res.status(200).json({
      message: 'Plan generated successfully',
      data: { ...projectData, ...aiPlan },
    });

  } catch (error) {
    broadcastStatus('Error al conectar con IA');
    return res.status(500).json({
      error: 'An error occurred while generating the plan',
      details: error.message || error.toString(),
    });
  }
};

const syncOpenProject = async (req, res) => {
  try {
    const projectData = req.body;
    if (!projectData || !projectData.projectId) {
        return res.status(400).json({ error: 'Missing required project data' });
    }

    broadcastStatus('Sincronizando con OpenProject...');
    const result = await integrateProjectData(projectData);
    broadcastStatus('Sincronización completada exitosamente');

    return res.status(200).json({
      message: 'Project successfully integrated into OpenProject',
      data: result,
    });

  } catch (error) {
    broadcastStatus('Error al sincronizar con OpenProject');
    return res.status(500).json({
      error: 'An error occurred while syncing with OpenProject',
      details: error.message || error.toString(),
    });
  }
};

module.exports = {
  generatePlanning,
  syncOpenProject
};