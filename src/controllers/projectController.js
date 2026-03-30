const { generateProjectPlan } = require('../services/aiService');
const { integrateProjectData } = require('../services/openProjectService');

const { broadcastStatus } = require('../services/statusService');

const generatePlanning = async (req, res) => {
  try {
    const { projectId, title, description, startDate, summaryTasks, individualTasks } = req.body;

    if (!projectId || !title || !description || !startDate) {
      return res.status(400).json({ error: 'Missing required project data' });
    }

    const projectData = { projectId, title, description, startDate, summaryTasks, individualTasks };

    broadcastStatus('Conectando con IA...');
    const aiPlan = await generateProjectPlan(projectData);

    broadcastStatus('Propuesta de IA recibida. Esperando Confirmación...');

    return res.status(200).json({
      message: 'Plan generated successfully',
      data: { projectId, tasks: aiPlan },
    });

  } catch (error) {
    broadcastStatus('Error al conectar con IA');
    const status = error.response ? error.response.status : 500;
    const details = error.response && error.response.data ? error.response.data : error.message;
    return res.status(status).json({
      error: 'An error occurred while generating the plan',
      details: details,
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
    const status = error.response ? error.response.status : 500;
    const details = error.response && error.response.data ? error.response.data : error.message;
    return res.status(status).json({
      error: 'An error occurred while syncing with OpenProject',
      details: details,
    });
  }
};

module.exports = {
  generatePlanning,
  syncOpenProject
};