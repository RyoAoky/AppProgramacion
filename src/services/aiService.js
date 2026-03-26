const axios = require('axios');

const generateProjectPlan = async (projectData) => {
  try {
    const prompt = `
      Analiza el siguiente proyecto:
      Título: ${projectData.title}
      Descripción: ${projectData.description}
      Tareas de resumen: ${JSON.stringify(projectData.summaryTasks)}
      Tareas individuales: ${JSON.stringify(projectData.individualTasks)}

      Por favor, realiza lo siguiente:
      1. Estimar y proponer tiempos de desarrollo y fechas sugeridas (inicio y fin) para cada tarea de resumen y tarea individual.
      2. Proponer un cronograma de reuniones de seguimiento (creándolas como elementos en la estructura).
      3. Analizar cada tarea individual y desglosarla proponiendo "mini-tareas" o subtareas técnicas adicionales para dar una guía más clara a mis programadores.
      4. Devuelve TODA la información OBLIGATORIAMENTE en un formato estructurado JSON puro, sin ningún texto adicional.
    `;

    const response = await axios.post(
      process.env.AI_API_URL,
      {
        model: process.env.AI_MODEL || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
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
