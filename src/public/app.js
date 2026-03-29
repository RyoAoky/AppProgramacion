document.addEventListener('DOMContentLoaded', () => {
  const configForm = document.getElementById('configForm');
  const configStatus = document.getElementById('configStatus');
  const refreshProjectsBtn = document.getElementById('refreshProjects');
  const projectsTable = document.querySelector('#projectsTable tbody');
  const statusBar = document.getElementById('statusBar');
  const statusMessage = document.getElementById('statusMessage');
  const validationModal = new bootstrap.Modal(document.getElementById('validationModal'));
  const aiProposalContent = document.getElementById('aiProposalContent');
  const btnApproveSync = document.getElementById('btnApproveSync');

  let currentAIProposal = null;

  const showStatus = (msg, isError = false) => {
    statusBar.style.display = 'block';
    statusBar.className = `alert ${isError ? 'alert-danger' : 'alert-info'}`;
    statusMessage.textContent = msg;
  };

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      document.getElementById('AI_API_URL').value = data.AI_API_URL || '';
      document.getElementById('AI_API_KEY').value = data.AI_API_KEY || '';
      document.getElementById('AI_MODEL').value = data.AI_MODEL || 'gpt-4';
      document.getElementById('OPENPROJECT_API_URL').value = data.OPENPROJECT_API_URL || '';
      document.getElementById('OPENPROJECT_API_KEY').value = data.OPENPROJECT_API_KEY || '';
    } catch (e) {
      console.error(e);
    }
  };

  const updateConfig = async (e) => {
    e.preventDefault();
    const configData = {
      AI_API_URL: document.getElementById('AI_API_URL').value,
      AI_API_KEY: document.getElementById('AI_API_KEY').value,
      AI_MODEL: document.getElementById('AI_MODEL').value,
      OPENPROJECT_API_URL: document.getElementById('OPENPROJECT_API_URL').value,
      OPENPROJECT_API_KEY: document.getElementById('OPENPROJECT_API_KEY').value,
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      if (res.ok) {
        configStatus.textContent = 'Configuración guardada correctamente.';
        configStatus.className = 'mt-2 text-success';
        configStatus.style.display = 'block';
        setTimeout(() => configStatus.style.display = 'none', 3000);
        loadProjects();
      } else {
        throw new Error('Error saving config');
      }
    } catch (error) {
      configStatus.textContent = 'Error al guardar la configuración.';
      configStatus.className = 'mt-2 text-danger';
      configStatus.style.display = 'block';
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        const errData = await res.json();
        const details = errData.details ? JSON.stringify(errData.details) : 'Error desconocido';
        throw new Error(`Falló al obtener proyectos: ${details}`);
      }
      const data = await res.json();
      projectsTable.innerHTML = '';
      if (data && data.length > 0) {
        data.forEach(project => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${project.id}</td>
            <td>${project.name}</td>
            <td>${project.identifier}</td>
            <td><button class="btn btn-sm btn-primary btn-generate" data-id="${project.id}" data-name="${project.name}">Generar Planeación IA</button></td>
          `;
          projectsTable.appendChild(tr);
        });

        document.querySelectorAll('.btn-generate').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const name = e.target.getAttribute('data-name');
            await triggerAIGeneration(id, name);
          });
        });
      } else {
         projectsTable.innerHTML = '<tr><td colspan="4" class="text-center">No hay proyectos.</td></tr>';
      }
    } catch (e) {
      projectsTable.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${e.message}</td></tr>`;
    }
  };

  const triggerAIGeneration = async (projectId, projectName) => {
    showStatus('Iniciando proceso...');
    try {
      const basePayload = {
        projectId: projectId,
        title: projectName,
        description: `Planificación para el proyecto ${projectName}`,
        summaryTasks: [],
        individualTasks: []
      };

      const res = await fetch('/api/generate-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePayload)
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Fallo desconocido');

      currentAIProposal = json.data;
      aiProposalContent.textContent = JSON.stringify(currentAIProposal, null, 2);
      validationModal.show();
      showStatus('Esperando confirmación humana...');

    } catch (error) {
      showStatus(`Error: ${error.message}`, true);
    }
  };

  const syncToOpenProject = async () => {
    if (!currentAIProposal) return;
    validationModal.hide();
    showStatus('Enviando aprobación y sincronizando...');
    try {
      const res = await fetch('/api/sync-openproject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentAIProposal)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Fallo de sincronización');
      showStatus('Sincronización finalizada exitosamente.');
    } catch (error) {
      showStatus(`Error de sincronización: ${error.message}`, true);
    }
  };

  const setupSSE = () => {
    const eventSource = new EventSource('/api/status');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if(data.status) {
         showStatus(data.status);
      }
    };
    eventSource.onerror = () => {
       console.log("SSE Connection lost. Reconnecting...");
    }
  };

  configForm.addEventListener('submit', updateConfig);
  refreshProjectsBtn.addEventListener('click', loadProjects);
  btnApproveSync.addEventListener('click', syncToOpenProject);

  loadConfig();
  loadProjects();
  setupSSE();
});