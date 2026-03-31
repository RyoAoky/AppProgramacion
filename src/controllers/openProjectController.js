const { getProjects } = require('../services/openProjectService');

const listProjects = async (req, res) => {
  try {
    const projects = await getProjects();

    const projectMap = new Map();
    const rootProjects = [];

    projects.forEach(p => {
      const id = p.id;
      const parentHref = p._links && p._links.parent ? p._links.parent.href : null;
      let parentId = null;
      if (parentHref) {
        const parts = parentHref.split('/');
        parentId = parseInt(parts[parts.length - 1], 10);
      }

      const projectNode = {
        id,
        name: p.name,
        identifier: p.identifier,
        description: p.description && p.description.raw ? p.description.raw : '',
        parentId,
        children: []
      };
      projectMap.set(id, projectNode);
    });

    projectMap.forEach(node => {
      if (node.parentId && projectMap.has(node.parentId)) {
        projectMap.get(node.parentId).children.push(node);
      } else {
        rootProjects.push(node);
      }
    });

    const flattened = [];
    const flattenTree = (nodes, level) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => {
        flattened.push({
          id: node.id,
          name: node.name,
          identifier: node.identifier,
          description: node.description,
          level
        });
        if (node.children.length > 0) {
          flattenTree(node.children, level + 1);
        }
      });
    };

    flattenTree(rootProjects, 0);

    return res.status(200).json(flattened);
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const details = error.response && error.response.data ? error.response.data : error.message;
    return res.status(status).json({ error: 'Failed to fetch projects', details: details });
  }
};

module.exports = {
  listProjects
};