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

    const existingWorkPackages = await getProjectWorkPackages(targetProjectId);
    const idMap = new Map();

    for (const wp of existingWorkPackages) {
        if (wp.subject) {
            idMap.set(wp.subject.trim().toLowerCase(), wp.id);
        }
    }

    const tasksArray = Array.isArray(aiData) ? aiData : (aiData.tasks || []);

    for (const parentTask of tasksArray) {
       let targetParentId = parentTask.id;
       const parentSubjectKey = parentTask.asunto ? parentTask.asunto.trim().toLowerCase() : '';

       if (idMap.has(parentSubjectKey)) {
           targetParentId = idMap.get(parentSubjectKey);
       }

       if (!targetParentId) continue;

       const parentPayload = {};
       if (parentTask.fechaInicio) parentPayload.startDate = parentTask.fechaInicio;
       if (parentTask.fechaFin) parentPayload.dueDate = parentTask.fechaFin;
       if (parentTask.horasEstimadas !== undefined) parentPayload.estimatedTime = `PT${parentTask.horasEstimadas}H`;

       if (Object.keys(parentPayload).length > 0) {
           await updateWorkPackage(targetParentId, parentPayload);
       }

       for (const childTask of parentTask.hijos || []) {
          let targetChildId = childTask.id;
          const childSubjectKey = childTask.asunto ? childTask.asunto.trim().toLowerCase() : '';

          if (idMap.has(childSubjectKey)) {
              targetChildId = idMap.get(childSubjectKey);
          }

          if (!targetChildId) continue;

          const childPayload = {};
          if (childTask.fechaInicio) childPayload.startDate = childTask.fechaInicio;
          if (childTask.fechaFin) childPayload.dueDate = childTask.fechaFin;
          if (childTask.horasEstimadas !== undefined) childPayload.estimatedTime = `PT${childTask.horasEstimadas}H`;
          if (childTask.detalleTecnico) {
              childPayload.description = { format: 'markdown', raw: childTask.detalleTecnico };
          }

          if (Object.keys(childPayload).length > 0) {
              await updateWorkPackage(targetChildId, childPayload);
          }
       }
    }

    return { success: true, projectId: targetProjectId };

  } catch (error) {
    throw error;
  }
};

const getProjectWorkPackages = async (projectId) => {
  try {
    const api = getAxiosInstance();
    let allWorkPackages = [];
    let offset = 1;
    const pageSize = 100;

    while (true) {
        const url = `/api/v3/projects/${projectId}/work_packages?pageSize=${pageSize}&offset=${offset}`;
        const response = await api.get(url);

        const elements = response.data._embedded ? response.data._embedded.elements : [];
        allWorkPackages = allWorkPackages.concat(elements);

        if (elements.length < pageSize) {
            break;
        }
        offset++;
    }

    return allWorkPackages;
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

const getDynamicProjectStructure = async (projectId) => {
  try {
    const workPackages = await getProjectWorkPackages(projectId);
    const parentMap = new Map();
    const allItemsMap = new Map();

    workPackages.forEach(wp => {
       const isParent = !wp._links.parent;
       const taskObj = {
          id: wp.id,
          asunto: wp.subject,
          tipo: wp._links.type.title || 'Tarea',
       };
       allItemsMap.set(wp.id, taskObj);

       if (isParent) {
          taskObj.hijos = [];
          parentMap.set(wp.id, taskObj);
       }
    });

    workPackages.forEach(wp => {
       if (wp._links.parent) {
          const parentHref = wp._links.parent.href;
          const parentId = parseInt(parentHref.split('/').pop(), 10);
          const childObj = allItemsMap.get(wp.id);
          if (parentMap.has(parentId)) {
             parentMap.get(parentId).hijos.push(childObj);
          } else {
             const fallbackParent = allItemsMap.get(parentId);
             if (fallbackParent) {
                 if (!fallbackParent.hijos) fallbackParent.hijos = [];
                 fallbackParent.hijos.push(childObj);
                 parentMap.set(parentId, fallbackParent);
             }
          }
       }
    });

    return Array.from(parentMap.values()).sort((a, b) => a.id - b.id);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  integrateProjectData,
  createProject,
  createWorkPackage,
  getProjects,
  getProjectWorkPackages,
  getDynamicProjectStructure
};
