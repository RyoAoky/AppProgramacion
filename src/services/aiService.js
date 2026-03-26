const axios = require('axios');

exports.analyzeProject = async (payload) => {
    try {
        const prompt = `
        Analiza el siguiente proyecto.
        Título: ${payload.title}
        Descripción: ${payload.description}
        Tareas de resumen: ${JSON.stringify(payload.summaryTasks)}
        Tareas individuales: ${JSON.stringify(payload.individualTasks)}

        Instrucciones:
        1. Estima y propón tiempos de desarrollo y fechas sugeridas (inicio y fin) para cada tarea de resumen y tarea individual.
        2. Propón un cronograma de reuniones de seguimiento (creándolas como elementos en la estructura).
        3. Analiza cada tarea individual y desglosala proponiendo mini-tareas o subtareas técnicas adicionales.
        4. Devuelve toda esta información obligatoriamente en un formato estructurado JSON puro, sin texto adicional ni bloques de código (no uses comillas invertidas de markdown).
        `;

        const response = await axios.post(
            process.env.AI_API_URL,
            {
                prompt: prompt
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let aiData = response.data.choices ? response.data.choices[0].message.content : response.data;
        if (typeof aiData === 'string') {
            aiData = JSON.parse(aiData);
        }

        return aiData;

    } catch (error) {
        throw new Error('AI Service Error: ' + error.message);
    }
};
