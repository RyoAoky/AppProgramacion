const axios = require('axios');
const { getConfig } = require('./configService');

const getAxiosInstance = () => {
  const config = getConfig();
  let base = config.OPENPROJECT_API_URL || '';
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  if (base.endsWith('/api/v3')) {
    base = base.slice(0, -7);
  }
  return axios.create({
    baseURL: base,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`apikey:${config.OPENPROJECT_API_KEY}`).toString('base64')}`,
    },
  });
};

const createProject = async (projectData) => {
  try {
    const api = getAxiosInstance();
    const response = await api.post('/api/v3/projects', {
      name: projectData.title,
      identifier: projectData.title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20),
      description: {
        format: 'markdown',
        raw: projectData.description,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createWorkPackage = async (projectId, workPackageData) => {
  try {
    const api = getAxiosInstance();
    const response = await api.post(`/api/v3/projects/${projectId}/work_packages`, workPackageData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateWorkPackage = async (workPackageId, workPackageData) => {
  try {
    const api = getAxiosInstance();
    const lockResponse = await api.get(`/api/v3/work_packages/${workPackageId}`);
    const lockVersion = lockResponse.data.lockVersion;

    const response = await api.patch(
      `/api/v3/work_packages/${workPackageId}`,
      {
        ...workPackageData,
        lockVersion: lockVersion
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const integrateProjectData = async (aiData) => {
  try {
    const targetProjectId = aiData.projectId;

    if (!targetProjectId) {
        throw new Error('Project ID is required to sync data');
    }

    const tasksArray = Array.isArray(aiData) ? aiData : (aiData.tasks || []);

    for (const parentTask of tasksArray) {
       if (!parentTask.id) continue;

       const parentPayload = {};
       if (parentTask.fechaInicio) parentPayload.startDate = parentTask.fechaInicio;
       if (parentTask.fechaFin) parentPayload.dueDate = parentTask.fechaFin;
       if (parentTask.horasEstimadas !== undefined) parentPayload.estimatedTime = `PT${parentTask.horasEstimadas}H`;

       if (Object.keys(parentPayload).length > 0) {
           await updateWorkPackage(parentTask.id, parentPayload);
       }

       for (const childTask of parentTask.hijos || []) {
          if (!childTask.id) continue;

          const childPayload = {};
          if (childTask.fechaInicio) childPayload.startDate = childTask.fechaInicio;
          if (childTask.fechaFin) childPayload.dueDate = childTask.fechaFin;
          if (childTask.horasEstimadas !== undefined) childPayload.estimatedTime = `PT${childTask.horasEstimadas}H`;
          if (childTask.detalleTecnico) {
              childPayload.description = { format: 'markdown', raw: childTask.detalleTecnico };
          }

          if (Object.keys(childPayload).length > 0) {
              await updateWorkPackage(childTask.id, childPayload);
          }
       }
    }

    return { success: true, projectId: targetProjectId };

  } catch (error) {
    throw error;
  }
};

const getProjects = async () => {
  try {
    const api = getAxiosInstance();
    const response = await api.get('/api/v3/projects');
    return response.data._embedded ? response.data._embedded.elements : [];
  } catch (error) {
    throw error;
  }
};

module.exports = {
  integrateProjectData,
  createProject,
  createWorkPackage,
  getProjects
};
