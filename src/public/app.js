document.addEventListener('DOMContentLoaded', () => {
  const configForm = document.getElementById('configForm');
  const configStatus = document.getElementById('configStatus');
  const refreshProjectsBtn = document.getElementById('refreshProjects');
  const projectsTable = document.querySelector('#projectsTable tbody');
  const statusBar = document.getElementById('statusBar');
  const statusMessage = document.getElementById('statusMessage');
  const generationModal = new bootstrap.Modal(document.getElementById('generationModal'));
  const btnConfirmGeneration = document.getElementById('btnConfirmGeneration');
  const btnConfirmGenerationSpinner = document.getElementById('btnConfirmGenerationSpinner');
  const projectExplanation = document.getElementById('projectExplanation');
  const projectStartDate = document.getElementById('projectStartDate');

  const historySelect = document.getElementById('historySelect');
  const btnLoadHistory = document.getElementById('btnLoadHistory');

  const validationModal = new bootstrap.Modal(document.getElementById('validationModal'));
  const aiProposalContent = document.getElementById('aiProposalContent');
  const opFormatTableBody = document.querySelector('#opFormatTable tbody');
  const btnApproveSync = document.getElementById('btnApproveSync');

  let currentAIProposal = null;
  let currentTargetProject = null;

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
          const prefix = project.level > 0 ? '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat(project.level) + '↳ ' : '';
          const safeDescription = project.description ? project.description.substring(0, 100) + (project.description.length > 100 ? '...' : '') : '';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${project.id}</td>
            <td>${prefix}${project.name}</td>
            <td>${project.identifier}</td>
            <td>${safeDescription}</td>
            <td><button class="btn btn-sm btn-primary btn-generate" data-id="${project.id}" data-name="${project.name}">Generar Planeación IA</button></td>
          `;
          projectsTable.appendChild(tr);
        });

        document.querySelectorAll('.btn-generate').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            currentTargetProject = {
              id: e.target.getAttribute('data-id'),
              name: e.target.getAttribute('data-name')
            };

            projectExplanation.value = '';

            const today = new Date();
            projectStartDate.value = today.toISOString().split('T')[0];

            await loadHistoryOptions(currentTargetProject.id);
            generationModal.show();
          });
        });
      } else {
         projectsTable.innerHTML = '<tr><td colspan="5" class="text-center">No hay proyectos.</td></tr>';
      }
    } catch (e) {
      projectsTable.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error: ${e.message}</td></tr>`;
    }
  };

  const loadHistoryOptions = async (projectId) => {
    historySelect.innerHTML = '<option value="">Cargando historial...</option>';
    try {
      const res = await fetch(`/api/history/${projectId}`);
      const data = await res.json();
      historySelect.innerHTML = '<option value="">Selecciona una planeación previa...</option>';
      if (data.history && data.history.length > 0) {
        data.history.forEach(file => {
           const option = document.createElement('option');
           option.value = file;
           option.textContent = file;
           historySelect.appendChild(option);
        });
      } else {
         historySelect.innerHTML = '<option value="">No hay historial previo.</option>';
      }
    } catch (e) {
      historySelect.innerHTML = '<option value="">Error al cargar historial.</option>';
    }
  };

  const handleLoadHistoryClick = async () => {
     const selectedFile = historySelect.value;
     if (!selectedFile) {
        Swal.fire('Atención', 'Por favor selecciona un archivo del historial.', 'warning');
        return;
     }

     try {
       const res = await fetch(`/api/history/${currentTargetProject.id}/${selectedFile}`);
       if (!res.ok) throw new Error('No se pudo cargar el detalle del historial');
       const json = await res.json();

       generationModal.hide();
       currentAIProposal = json.data.response;
       showValidationModal(currentAIProposal);

     } catch (e) {
       Swal.fire('Error', e.message, 'error');
     }
  };

  const confirmGeneration = async () => {
    if (!currentTargetProject) return;

    const explanation = projectExplanation.value.trim();
    const startDate = projectStartDate.value;

    if (!explanation || !startDate) {
        Swal.fire('Atención', 'Debes ingresar la explicación y la fecha de inicio.', 'warning');
        return;
    }

    btnConfirmGeneration.disabled = true;
    btnConfirmGenerationSpinner.classList.remove('d-none');

    await triggerAIGeneration(currentTargetProject.id, currentTargetProject.name, explanation, startDate);

    btnConfirmGeneration.disabled = false;
    btnConfirmGenerationSpinner.classList.add('d-none');
  };

  const triggerAIGeneration = async (projectId, projectName, explanation, startDate) => {
    showStatus('Iniciando proceso...');
    try {
      const basePayload = {
        projectId: projectId,
        title: projectName,
        description: explanation,
        startDate: startDate,
        summaryTasks: [],
        individualTasks: []
      };

      const res = await fetch('/api/generate-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePayload)
      });

      const json = await res.json();

      if (!res.ok) {
        const errorDetails = typeof json.details === 'object' ? JSON.stringify(json.details, null, 2) : (json.details || '');
        const errorMsg = json.error ? `${json.error}. ${errorDetails}` : 'Fallo desconocido';
        throw new Error(errorMsg);
      }

      generationModal.hide();
      currentAIProposal = json.data.tasks.tasks;
      showValidationModal(currentAIProposal);
      showStatus('Esperando confirmación humana...');

    } catch (error) {
      generationModal.hide();
      Swal.fire('Error en la IA', error.message, 'error');
      showStatus(`Error: ${error.message}`, true);
    }
  };

  const showValidationModal = (proposalData) => {
    aiProposalContent.textContent = JSON.stringify(proposalData, null, 2);

    opFormatTableBody.innerHTML = '';

    if (Array.isArray(proposalData)) {
       proposalData.forEach(parent => {
          const parentRow = document.createElement('tr');
          parentRow.innerHTML = `
            <td>${parent.id}</td>
            <td class="fw-bold"><i class="bi bi-chevron-down"></i> ${parent.asunto}</td>
            <td class="text-warning fw-bold">${parent.tipo.toUpperCase()}</td>
            <td><span class="badge bg-secondary">Nuevo</span></td>
            <td>${parent.fechaInicio}</td>
            <td>${parent.horasEstimadas}h</td>
          `;
          opFormatTableBody.appendChild(parentRow);

          if (parent.hijos && Array.isArray(parent.hijos)) {
             parent.hijos.forEach(hijo => {
                const childRow = document.createElement('tr');
                childRow.innerHTML = `
                  <td>${hijo.id}</td>
                  <td class="ps-4">
                     ${hijo.asunto}
                     <div class="mt-2 text-muted small" style="white-space: pre-wrap;"><strong>Detalle Técnico:</strong>\n${hijo.detalleTecnico || 'Sin detalle'}</div>
                  </td>
                  <td class="text-primary">${hijo.tipo.toUpperCase()}</td>
                  <td><span class="badge bg-secondary">Nuevo</span></td>
                  <td>${hijo.fechaInicio}</td>
                  <td>${hijo.horasEstimadas}h</td>
                `;
                opFormatTableBody.appendChild(childRow);
             });
          }
       });
    }

    validationModal.show();
  };

  const syncToOpenProject = async () => {
    if (!currentAIProposal) return;
    validationModal.hide();

    showStatus('Enviando aprobación y sincronizando...');

    let timerInterval;
    Swal.fire({
      title: 'Sincronizando con OpenProject...',
      html: 'Por favor espera, no cierres la ventana.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const payload = {
        projectId: currentTargetProject.id,
        tasks: currentAIProposal
      };

      const res = await fetch('/api/sync-openproject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Fallo de sincronización');

      Swal.fire('¡Éxito!', 'Sincronización finalizada exitosamente.', 'success');
      showStatus('Sincronización finalizada exitosamente.');
    } catch (error) {
      Swal.fire('Error', `Fallo la sincronización: ${error.message}`, 'error');
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
  btnConfirmGeneration.addEventListener('click', confirmGeneration);
  btnLoadHistory.addEventListener('click', handleLoadHistoryClick);
  btnApproveSync.addEventListener('click', syncToOpenProject);

  loadConfig();
  loadProjects();
  setupSSE();
});