const axios = require('axios');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
let config = {};

try {
  if (fs.existsSync(configPath)) {
    const rawData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(rawData);
  }
} catch (error) {
  process.exit(1);
}

let base = config.OPENPROJECT_API_URL || '';
if (base.endsWith('/')) {
  base = base.slice(0, -1);
}
if (base.endsWith('/api/v3')) {
  base = base.slice(0, -7);
}

const api = axios.create({
  baseURL: base,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(`apikey:${config.OPENPROJECT_API_KEY}`).toString('base64')}`,
  },
});

const templateData = [
  {
    "id": 1618,
    "asunto": "Inicio del Proyecto",
    "tipo": "Tarea Resumen",
    "hijos": [
      {
        "id": 1619,
        "asunto": "Identificación de la necesidad o problema.",
        "tipo": "Tarea"
      },
      {
        "id": 1620,
        "asunto": "Definición del alcance preliminar",
        "tipo": "Tarea"
      },
      {
        "id": 1621,
        "asunto": "Identificación de stakeholders (Dueños de procesos)",
        "tipo": "Tarea"
      },
      {
        "id": 1622,
        "asunto": "Elaboración del acta de constitución del proyecto",
        "tipo": "Tarea"
      },
      {
        "id": 1623,
        "asunto": "Aprobación inicial del proyecto.",
        "tipo": "Tarea"
      }
    ]
  },
  {
    "id": 1624,
    "asunto": "Levantamiento y Análisis de Requerimientos",
    "tipo": "Tarea Resumen",
    "hijos": [
      {
        "id": 1625,
        "asunto": "Reuniones con usuarios clave",
        "tipo": "Tarea"
      },
      {
        "id": 1626,
        "asunto": "Identificación de requerimientos funcionales y no funcionales.",
        "tipo": "Tarea"
      },
      {
        "id": 1627,
        "asunto": "Modelado de procesos (AS-IS y TO-BE).",
        "tipo": "Tarea"
      },
      {
        "id": 1628,
        "asunto": "Elaboración del documento de especificación de requerimientos (ERS).",
        "tipo": "Tarea"
      },
      {
        "id": 1629,
        "asunto": "Validación y aprobación de requerimientos",
        "tipo": "Tarea"
      }
    ]
  },
  {
    "id": 1630,
    "asunto": "Planificación del Proyecto",
    "tipo": "Tarea Resumen",
    "hijos": [
      {
        "id": 1631,
        "asunto": "Definición del cronograma (WBS)",
        "tipo": "Tarea"
      },
      {
        "id": 1632,
        "asunto": "Estimación de tiempos y recursos",
        "tipo": "Tarea"
      },
      {
        "id": 1633,
        "asunto": "Asignación de roles y responsabilidades",
        "tipo": "Tarea"
      },
      {
        "id": 1634,
        "asunto": "Plan de gestión de riesgos",
        "tipo": "Tarea"
      },
      {
        "id": 1635,
        "asunto": "Plan de comunicaciones",
        "tipo": "Tarea"
      }
    ]
  },
  {
    "id": 1636,
    "asunto": "Diseño del Sistema",
    "tipo": "Tarea Resumen",
    "hijos": [
      {
        "id": 1637,
        "asunto": "Diseño de arquitectura (backend, frontend, base de datos).",
        "tipo": "Tarea"
      },
      {
        "id": 1638,
        "asunto": "Diseño de base de datos",
        "tipo": "Tarea"
      },
      {
        "id": 1639,
        "asunto": "Diseño de interfaces (mockups o prototipos).",
        "tipo": "Tarea"
      },
      {
        "id": 1640,
        "asunto": "Definición de estándares de desarrollo",
        "tipo": "Tarea"
      },
      {
        "id": 1641,
        "asunto": "Revisión y aprobación del diseño",
        "tipo": "Tarea"
      }
    ]
  },
  {
    "id": 1642,
    "asunto": "Desarrollo / Construcción",
    "tipo": "Tarea Resumen",
    "hijos": [
      {
        "id": 1643,
        "asunto": "Configuración del entorno de desarrollo",
        "tipo": "Tarea"
      },
      {
        "id": 1644,
        "asunto": "Programación de módulos",
        "tipo": "Tarea"
      },
      {
        "id": 1645,
        "asunto": "Integración de componentes",
        "tipo": "Tarea"
      },
      {
        "id": 1646,
        "asunto": "Control de versiones",
        "tipo": "Tarea"
      },
      {
        "id": 1647,
        "asunto": "Documentación técnica",
        "tipo": "Tarea"
      }
    ]
  },
  {
    "id": 1648,
    "asunto": "Pruebas",
    "tipo": "Tarea Resumen",
    "hijos": [
      {
        "id": 1649,
        "asunto": "Pruebas unitarias",
        "tipo": "Tarea"
      },
      {
        "id": 1650,
        "asunto": "Pruebas de integración",
        "tipo": "Tarea"
      },
      {
        "id": 1651,
        "asunto": "Pruebas funcionales",
        "tipo": "Tarea"
      },
      {
        "id": 1652,
        "asunto": "Pruebas de usuario",
        "tipo": "Tarea"
      },
      {
        "id": 1653,
        "asunto": "Corrección de errores",
        "tipo": "Tarea"
      }
    ]
  },
  {
    "id": 1654,
    "asunto": "Implementación",
    "tipo": "Tarea Resumen",
    "hijos": [
      {
        "id": 1655,
        "asunto": "Preparación del entorno productivo.",
        "tipo": "Tarea"
      },
      {
        "id": 1656,
        "asunto": "Migración de datos (si aplica).",
        "tipo": "Tarea"
      },
      {
        "id": 1657,
        "asunto": "Despliegue del sistema.",
        "tipo": "Tarea"
      },
      {
        "id": 1658,
        "asunto": "Validación en producción.",
        "tipo": "Tarea"
      },
      {
        "id": 1659,
        "asunto": "Aprobación final.",
        "tipo": "Tarea"
      }
    ]
  },
  {
    "id": 1660,
    "asunto": "Capacitación y Cierre",
    "tipo": "Tarea Resumen",
    "hijos": [
      {
        "id": 1661,
        "asunto": "Capacitación a usuarios finales.",
        "tipo": "Tarea"
      },
      {
        "id": 1662,
        "asunto": "Entrega de manuales (usuario y técnico).",
        "tipo": "Tarea"
      },
      {
        "id": 1663,
        "asunto": "Acta de conformidad.",
        "tipo": "Tarea"
      },
      {
        "id": 1664,
        "asunto": "Cierre formal del proyecto.",
        "tipo": "Tarea"
      }
    ]
  },
  {
    "id": 1665,
    "asunto": "Soporte y Mantenimiento",
    "tipo": "Tarea Resumen",
    "hijos": [
      {
        "id": 1666,
        "asunto": "Soporte post implementación.",
        "tipo": "Tarea"
      },
      {
        "id": 1667,
        "asunto": "Monitoreo del sistema.",
        "tipo": "Tarea"
      },
      {
        "id": 1668,
        "asunto": "Actualizaciones y mejoras",
        "tipo": "Tarea"
      },
      {
        "id": 1669,
        "asunto": "Gestión de incidencias.",
        "tipo": "Tarea"
      }
    ]
  }
];

const cleanTask = async (taskId) => {
  try {
    const lockResponse = await api.get(`/api/v3/work_packages/${taskId}`);
    const lockVersion = lockResponse.data.lockVersion;

    await api.patch(`/api/v3/work_packages/${taskId}`, {
      lockVersion: lockVersion,
      startDate: null,
      dueDate: null,
      estimatedTime: null,
      description: {
        format: 'markdown',
        raw: ''
      }
    });
    console.log(`Task ${taskId} cleaned.`);
  } catch (error) {
    console.error(`Error cleaning task ${taskId}:`, error.message);
  }
};

const runClean = async () => {
  for (const parent of templateData) {
    if (parent.id) {
      await cleanTask(parent.id);
    }
    for (const child of parent.hijos || []) {
      if (child.id) {
        await cleanTask(child.id);
      }
    }
  }
  console.log('Cleanup finished.');
};

runClean();