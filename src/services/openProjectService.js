const axios = require('axios');

const openProjectApi = axios.create({
    baseURL: process.env.OPENPROJECT_API_URL,
    headers: {
        'Authorization': `Basic ${Buffer.from(`apikey:${process.env.OPENPROJECT_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json'
    }
});

exports.createProjectStructure = async (aiData) => {
    try {
        const projectResponse = await openProjectApi.post('/api/v3/projects', {
            name: aiData.project.title,
            description: {
                raw: aiData.project.description
            }
        });

        const projectId = projectResponse.data.id;

        const results = {
            project: projectResponse.data,
            summaryTasks: [],
            individualTasks: [],
            meetings: []
        };

        if (aiData.summaryTasks && Array.isArray(aiData.summaryTasks)) {
            for (const task of aiData.summaryTasks) {
                const taskResponse = await openProjectApi.post(`/api/v3/projects/${projectId}/work_packages`, {
                    subject: task.title,
                    startDate: task.startDate,
                    dueDate: task.endDate,
                    estimatedTime: task.estimatedTime
                });
                results.summaryTasks.push(taskResponse.data);
            }
        }

        if (aiData.individualTasks && Array.isArray(aiData.individualTasks)) {
            for (const task of aiData.individualTasks) {
                const taskResponse = await openProjectApi.post(`/api/v3/projects/${projectId}/work_packages`, {
                    subject: task.title,
                    startDate: task.startDate,
                    dueDate: task.endDate,
                    estimatedTime: task.estimatedTime
                });

                const taskId = taskResponse.data.id;
                results.individualTasks.push(taskResponse.data);

                if (task.miniTasks && Array.isArray(task.miniTasks)) {
                    for (const miniTask of task.miniTasks) {
                         await openProjectApi.post(`/api/v3/projects/${projectId}/work_packages`, {
                            subject: miniTask.title,
                            parent: { href: `/api/v3/work_packages/${taskId}` }
                        });
                    }
                }
            }
        }

        if (aiData.meetings && Array.isArray(aiData.meetings)) {
            for (const meeting of aiData.meetings) {
                const meetingResponse = await openProjectApi.post(`/api/v3/projects/${projectId}/work_packages`, {
                    subject: meeting.title,
                    startDate: meeting.date,
                    dueDate: meeting.date,
                    type: { href: '/api/v3/types/meeting' }
                });
                results.meetings.push(meetingResponse.data);
            }
        }

        return results;

    } catch (error) {
        throw new Error('OpenProject Service Error: ' + error.message);
    }
};
