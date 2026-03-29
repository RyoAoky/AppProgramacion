const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('./configService');

const sanitizeFilename = (name) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

const logAITransaction = (projectId, projectName, reqData, resData, type) => {
  try {
    const rootDir = path.join(__dirname, '../../planeaciones');
    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir);
    }

    const projectFolder = path.join(rootDir, `${projectId}-${sanitizeFilename(projectName)}`);
    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(projectFolder, `${timestamp}-${type}.json`);

    fs.writeFileSync(filePath, JSON.stringify({ request: reqData, response: resData }, null, 2), 'utf8');
  } catch (error) {
    console.error('Logging failed:', error);
  }
};

const getProjectStructure = () => {
  try {
    const dataPath = path.join(__dirname, '../data/projectStructure.json');
    if (fs.existsSync(dataPath)) {
      return fs.readFileSync(dataPath, 'utf8');
    }
  } catch (e) {
  }
  return '[]';
};

const generateProjectPlan = async (projectData) => {
  const config = getConfig();
  try {
    const structureTemplate = getProjectStructure();

    const prompt = `
      Analiza el siguiente proyecto:
      Título: ${projectData.title}
      Contexto/Explicación: ${projectData.description}
      Fecha de Inicio del Proyecto: ${projectData.startDate}

      Reglas de Tiempo de Negocio:
      - Los días laborables son estrictamente de Lunes a Viernes.
      - Hay 9 horas laborales por día, en el horario de 08:00 a 13:00 y de 14:00 a 18:00.
      - Usa la fecha de inicio proporcionada para calcular las fechas subsecuentes.

      Aplica OBLIGATORIAMENTE la siguiente estructura base de fases y tareas:
      ${structureTemplate}

      Por favor, realiza lo siguiente basado en esa estructura:
      1. Extrae las "Tareas Resumen" y colócalas en un array llamado "summaryTasks", estimando tiempos y fechas de inicio y fin para cada una. Usa la propiedad "title" (en lugar de "asunto").
      2. Extrae las tareas "hijos" y colócalas en un array "individualTasks". Para cada tarea individual estima tiempos y fechas. Usa la propiedad "parentTitle" con el título exacto de la Tarea Resumen a la que pertenecen.
      3. Analiza cada tarea individual y desglose proponiendo subtareas técnicas en un array "miniTasks" dentro del objeto de cada "individualTask".
      4. Propón un cronograma de reuniones de seguimiento en un array "meetings" (con title, description y suggestedDate).
      5. Devuelve TODA la información OBLIGATORIAMENTE en un formato estructurado JSON puro conteniendo { "summaryTasks": [], "individualTasks": [], "meetings": [] }, sin ningún texto adicional ni marcadores markdown.
    `;

    const requestPayload = {
      model: config.AI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    };

    const response = await axios.post(
      config.AI_API_URL,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.AI_API_KEY}`,
        },
      }
    );

    const resultText = response.data.choices[0].message.content.trim();

    logAITransaction(projectData.projectId, projectData.title, requestPayload, resultText, 'raw');

    let jsonResult;
    try {
        jsonResult = JSON.parse(resultText);
    } catch(e) {
        const jsonMatch = resultText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                jsonResult = JSON.parse(jsonMatch[1]);
            } catch (innerE) {
                logAITransaction(projectData.projectId, projectData.title, requestPayload, { error: 'Parse Error', rawText: resultText }, 'error');
                throw new Error(`Invalid JSON format from AI after extraction: ${innerE.message}. Raw: ${resultText.substring(0, 100)}...`);
            }
        } else {
            logAITransaction(projectData.projectId, projectData.title, requestPayload, { error: 'Parse Error', rawText: resultText }, 'error');
            throw new Error(`Invalid JSON format from AI. No JSON code block found. Raw: ${resultText.substring(0, 100)}...`);
        }
    }

    logAITransaction(projectData.projectId, projectData.title, requestPayload, jsonResult, 'success');

    return jsonResult;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateProjectPlan,
};
