const axios = require('axios');

const getAxiosInstance = () => {
  return axios.create({
    baseURL: process.env.OPENPROJECT_API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`apikey:${process.env.OPENPROJECT_API_KEY}`).toString('base64')}`,
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

const integrateProjectData = async (aiData) => {
  try {
    const project = await createProject(aiData);

    const summaryTasksMap = {};

    for (const summaryTask of aiData.summaryTasks || []) {
       const wp = await createWorkPackage(project.id, {
          subject: summaryTask.title,
          description: { format: 'markdown', raw: summaryTask.description || '' },
          startDate: summaryTask.startDate,
          dueDate: summaryTask.endDate,
          estimatedTime: summaryTask.estimatedTime,
       });
       summaryTasksMap[summaryTask.id || summaryTask.title] = wp.id;
    }

    const individualTasksMap = {};

    for (const task of aiData.individualTasks || []) {
      const parentId = summaryTasksMap[task.parentId || task.parentTitle];
      const payload = {
          subject: task.title,
          description: { format: 'markdown', raw: task.description || '' },
          startDate: task.startDate,
          dueDate: task.endDate,
          estimatedTime: task.estimatedTime,
      };
      if (parentId) {
         payload._links = {
             parent: { href: `/api/v3/work_packages/${parentId}` }
         }
      }
      const wp = await createWorkPackage(project.id, payload);
      individualTasksMap[task.id || task.title] = wp.id;

      for (const miniTask of task.miniTasks || []) {
         await createWorkPackage(project.id, {
              subject: miniTask.title,
              description: { format: 'markdown', raw: miniTask.description || '' },
              estimatedTime: miniTask.estimatedTime,
              _links: {
                  parent: { href: `/api/v3/work_packages/${wp.id}` }
              }
         });
      }
    }

    for (const meeting of aiData.meetings || []) {
       await createWorkPackage(project.id, {
           subject: meeting.title,
           description: { format: 'markdown', raw: meeting.description || '' },
           startDate: meeting.suggestedDate,
           dueDate: meeting.suggestedDate,
       });
    }

    return { success: true, projectId: project.id };

  } catch (error) {
    throw error;
  }
};

module.exports = {
  integrateProjectData,
  createProject,
  createWorkPackage
};
