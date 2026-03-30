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
    return `${timestamp}-${type}.json`;
  } catch (error) {
    console.error('Logging failed:', error);
    return null;
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

const obtenerEjemploPerfectoJSON = () => {
  return JSON.stringify([
    {
      "id": 1618,
      "asunto": "Inicio del Proyecto",
      "tipo": "Tarea Resumen",
      "fechaInicio": "2026-03-30",
      "fechaFin": "2026-03-30",
      "horasEstimadas": 3,
      "hijos": [
        {
          "id": 1619,
          "asunto": "Identificación de la necesidad o problema.",
          "tipo": "Tarea",
          "fechaInicio": "2026-03-30",
          "fechaFin": "2026-03-30",
          "horasEstimadas": 0.5,
          "detalleTecnico": "- [ ] **[0.5h] Definición del módulo:** Validar integración del nuevo checklist en la intranet existente."
        }
      ]
    },
    {
      "id": 1642,
      "asunto": "Desarrollo / Construcción",
      "tipo": "Tarea Resumen",
      "fechaInicio": "2026-03-31",
      "fechaFin": "2026-04-01",
      "horasEstimadas": 12,
      "hijos": [
        {
          "id": 1644,
          "asunto": "Programación de módulos",
          "tipo": "Tarea",
          "fechaInicio": "2026-03-31",
          "fechaFin": "2026-04-01",
          "horasEstimadas": 6,
          "detalleTecnico": "- [ ] **[4.0h] Desarrollo CRUD Insumos:** Construir ABM de insumos (Categoría, Nombre, ID, Estado).\n- [ ] **[2.0h] Desarrollo Frontend Checklist:** Crear vista principal y modal de búsqueda."
        },
        {
          "id": 1645,
          "asunto": "Integración de componentes",
          "tipo": "Tarea",
          "fechaInicio": "2026-04-01",
          "fechaFin": "2026-04-01",
          "horasEstimadas": 4,
          "detalleTecnico": "- [ ] **[2.0h] Consumo de API HIS:** Conectar el input de búsqueda (nombre/prefactura) con el backend del HIS.\n- [ ] **[2.0h] Guardado de transacciones:** Vincular el checklist marcado con la prefactura importada."
        }
      ]
    }
  ]);
};

const generateProjectPlan = async (projectData) => {
  const config = getConfig();
  try {
    const structureTemplate = getProjectStructure();
    const ejemploIdeal = obtenerEjemploPerfectoJSON();

    const prompt = `
      Eres un Project Manager Experto en metodologías ágiles.
      Analiza y estima el siguiente proyecto:

      Título: ${projectData.title}
      Contexto/Explicación: ${projectData.description}
      Fecha de Inicio del Proyecto: ${projectData.startDate}

      REGLAS DEL ENTORNO Y ESCALA DEL PROYECTO (¡ESTRICTAS!):
      - Este es un MINI-PROYECTO integrado a una Intranet existente. No hay infraestructura desde cero.
      - TIEMPOS ÁGILES: El total del proyecto debe rondar entre 20 y 45 horas en total. Sé agresivo optimizando.
      - Burocracia mínima: Solo interactúan 1 Desarrollador, 1 Usuario Clave y 1 Subgerente.
      - Fase de Soporte y Mantenimiento: 0 horas estimadas. No se cuantifica.
      - Capacitación y Cierre: Máximo 1 a 2 horas en total.

      REGLAS DE TIEMPO DE NEGOCIO:
      - Días laborables: Lunes a Viernes.
      - Horario: 9 horas diarias (08:00 a 13:00 y 14:00 a 18:00).
      - Las fechas ("fechaInicio", "fechaFin") deben calcularse de forma secuencial evitando fines de semana.

      ESTRUCTURA BASE OBLIGATORIA (DEBES MANTENER LOS MISMOS IDs QUE VIENEN AQUÍ):
      ${structureTemplate}

      INSTRUCCIONES DE SALIDA:
      1. Extrae las tareas padre respetando su ID original, asígnales tiempos (horasEstimadas) y fechas.
      2. Extrae las tareas "hijos" respetando su ID original, asigna "horasEstimadas" (en fracciones si es necesario, ej: 0.5) y fechas.
      3. CRÍTICO: En cada tarea "hijo", crea una clave llamada "detalleTecnico". El valor debe ser un ÚNICO STRING en formato Markdown.
         - Usa OBLIGATORIAMENTE la sintaxis: "- [ ] **[X.Xh] Asunto:** Descripción".
         - REGLA MATEMÁTICA ESTRICTA: La suma de las horas indicadas entre corchetes [X.Xh] en el "detalleTecnico" DEBE SER EXACTAMENTE IGUAL al valor numérico de "horasEstimadas" de esa tarea hijo.
      4. DEBES DEVOLVER UN ARREGLO JSON PURO CON ESTA ESTRUCTURA (NI MAS NI MENOS).

      REFERENCIA DE FORMATO (EJEMPLO IDEAL):
      ⚠️ ¡ADVERTENCIA CRÍTICA!: El siguiente JSON es SOLO un ejemplo de la ESTRUCTURA y el FORMATO Markdown que debes usar. NO copies el contenido técnico (los CRUDs, Insumos o el sistema HIS).
      Debes inventar el "detalleTecnico" basándote ESTRICTAMENTE en el Contexto/Explicación del proyecto actual (puede ser un reporte gerencial, una API, una web, etc.), pero manteniendo esta misma estructura de JSON y Markdown:
      ${ejemploIdeal}
    `;

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };

    let apiUrl = config.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    const response = await axios.post(
      apiUrl,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': config.AI_API_KEY
        },
      }
    );

    const rawResponse = response.data;
    let resultText = '';

    if (rawResponse.candidates && rawResponse.candidates[0].content.parts[0].text) {
      resultText = rawResponse.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Unexpected response structure from Gemini API');
    }

    logAITransaction(projectData.projectId, projectData.title, requestPayload, resultText, 'raw');

    let jsonResult;
    try {
        jsonResult = JSON.parse(resultText);
    } catch(e) {
        const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
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

    const savedFilename = logAITransaction(projectData.projectId, projectData.title, requestPayload, jsonResult, 'success');

    return { tasks: jsonResult, historyFile: savedFilename };

  } catch (error) {
    if (error.response) {
       console.error("AI API Error Response:", error.response.data);
    } else {
       console.error("Error al generar el plan:", error);
    }
    throw error;
  }
};

module.exports = {
  generateProjectPlan,
};