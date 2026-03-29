const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('./configService');

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
      Descripción: ${projectData.description}

      Aplica OBLIGATORIAMENTE la siguiente estructura base de fases y tareas:
      ${structureTemplate}

      Por favor, realiza lo siguiente basado en esa estructura:
      1. Extrae las "Tareas Resumen" y colócalas en un array llamado "summaryTasks", estimando tiempos y fechas de inicio y fin para cada una. Usa la propiedad "title" (en lugar de "asunto").
      2. Extrae las tareas "hijos" y colócalas en un array "individualTasks". Para cada tarea individual estima tiempos y fechas. Usa la propiedad "parentTitle" con el título exacto de la Tarea Resumen a la que pertenecen.
      3. Analiza cada tarea individual y desglose proponiendo subtareas técnicas en un array "miniTasks" dentro del objeto de cada "individualTask".
      4. Propón un cronograma de reuniones de seguimiento en un array "meetings" (con title, description y suggestedDate).
      5. Devuelve TODA la información OBLIGATORIAMENTE en un formato estructurado JSON puro conteniendo { "summaryTasks": [], "individualTasks": [], "meetings": [] }, sin ningún texto adicional ni marcadores markdown.
    `;

    const response = await axios.post(
      config.AI_API_URL,
      {
        model: config.AI_MODEL || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.AI_API_KEY}`,
        },
      }
    );

    const resultText = response.data.choices[0].message.content.trim();
    let jsonResult;
    try {
        jsonResult = JSON.parse(resultText);
    } catch(e) {
        const jsonMatch = resultText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            jsonResult = JSON.parse(jsonMatch[1]);
        } else {
            throw new Error('Invalid JSON format from AI');
        }
    }

    return jsonResult;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateProjectPlan,
};
