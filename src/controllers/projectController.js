const aiService = require('../services/aiService');
const openProjectService = require('../services/openProjectService');

exports.createProject = async (req, res) => {
    try {
        const payload = req.body;
        const aiResponse = await aiService.analyzeProject(payload);
        const result = await openProjectService.createProjectStructure(aiResponse);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
