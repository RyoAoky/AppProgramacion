const fs = require('fs');
const path = require('path');
const { generateProjectPlan } = require('../services/aiService');
const { integrateProjectData, getDynamicProjectStructure } = require('../services/openProjectService');

const { broadcastStatus } = require('../services/statusService');

const generatePlanning = async (req, res) => {
  try {
    const { projectId, title, description, startDate, summaryTasks, individualTasks } = req.body;

    if (!projectId || !title || !description || !startDate) {
      return res.status(400).json({ error: 'Missing required project data' });
    }

    broadcastStatus('Obteniendo estructura base de OpenProject...');
    const dynamicStructure = await getDynamicProjectStructure(projectId);

    const projectData = { projectId, title, description, startDate, summaryTasks, individualTasks, dynamicStructure };

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

const getProjectHistory = (req, res) => {
  try {
    const { projectId } = req.params;
    const rootDir = path.join(__dirname, '../../planeaciones');
    if (!fs.existsSync(rootDir)) return res.json({ history: [] });

    const folders = fs.readdirSync(rootDir);
    const projectFolder = folders.find(folder => folder.startsWith(`${projectId}-`));

    if (!projectFolder) return res.json({ history: [] });

    const folderPath = path.join(rootDir, projectFolder);
    const files = fs.readdirSync(folderPath);

    const successFiles = files
      .filter(file => file.endsWith('-success.json') || file.endsWith('-raw.json'))
      .sort((a, b) => b.localeCompare(a));

    return res.json({ history: successFiles });
  } catch (error) {
    return res.status(500).json({ error: 'Error reading history' });
  }
};

const getProjectHistoryDetail = (req, res) => {
  try {
    const { projectId, filename } = req.params;
    const rootDir = path.join(__dirname, '../../planeaciones');
    const folders = fs.readdirSync(rootDir);
    const projectFolder = folders.find(folder => folder.startsWith(`${projectId}-`));

    if (!projectFolder) return res.status(404).json({ error: 'Project folder not found' });

    const filePath = path.join(rootDir, projectFolder, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    const fileContent = fs.readFileSync(filePath, 'utf8');
    let jsonData = JSON.parse(fileContent);

    if (filename.endsWith('-raw.json') && typeof jsonData.response === 'string') {
        try {
            const rawText = jsonData.response;
            const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (jsonMatch) {
               jsonData.response = JSON.parse(jsonMatch[1]);
            } else {
               jsonData.response = JSON.parse(rawText);
            }
        } catch (e) {
            return res.status(400).json({ error: 'No se pudo parsear el formato RAW', details: e.message });
        }
    }

    return res.json({ data: jsonData });
  } catch (error) {
    return res.status(500).json({ error: 'Error reading history detail' });
  }
};

module.exports = {
  generatePlanning,
  syncOpenProject,
  getProjectHistory,
  getProjectHistoryDetail
};