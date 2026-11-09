/**
 * StaffConnect - Departments Management
 */

let departmentsList = [];

document.addEventListener('DOMContentLoaded', () => {
  const user = protectPage();
  if (!user) return;

  initDepartmentsPage(user);
});

async function initDepartmentsPage(user) {
  setupDepartmentsUI(user);
  await loadDepartments();
}

function setupDepartmentsUI(user) {
  const addDeptBtn = document.getElementById('openAddDeptModalBtn');
  if (addDeptBtn) {
    if (user.role !== 'ROLE_ADMIN') {
      addDeptBtn.style.display = 'none';
    } else {
      addDeptBtn.addEventListener('click', openAddDeptModal);
    }
  }

  const addForm = document.getElementById('addDepartmentForm');
  if (addForm) {
    addForm.addEventListener('submit', handleAddDepartment);
  }

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobileSidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
}

async function loadDepartments() {
  try {
    const res = await api.get('/departments');
    if (res.success && res.data) {
      departmentsList = res.data;
      renderDepartmentCards();
    }
  } catch (error) {
    console.error('Failed to load departments:', error);
    showToast('Failed to load departments list', 'error');
  }
}

function renderDepartmentCards() {
  const container = document.getElementById('departmentsGrid');
  if (!container) return;

  const user = api.getUser();
  const isAdmin = user && user.role === 'ROLE_ADMIN';

  if (departmentsList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        No departments created yet.
      </div>
    `;
    return;
  }

  let html = '';
  departmentsList.forEach(dept => {
    html += `
      <div class="stat-card" style="flex-direction: column; align-items: flex-start; gap: 18px;">
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="stat-icon blue" style="width:44px; height:44px; font-size:1.1rem;">
              <i class="fas fa-building"></i>
            </div>
            <div>
              <h3 style="font-size:1.15rem; font-weight:700; color:var(--text-main);">${escapeHtml(dept.name)}</h3>
              <span style="font-size:0.75rem; font-weight:700; color:var(--primary); font-family:monospace; background:var(--primary-subtle); padding:2px 8px; border-radius:4px;">${escapeHtml(dept.code)}</span>
            </div>
          </div>
          ${isAdmin ? `
            <button class="btn-icon delete" title="Delete Department" onclick="handleDeleteDept(${dept.id}, '${escapeHtml(dept.name)}')">
              <i class="fas fa-trash-alt"></i>
            </button>
          ` : ''}
        </div>

        <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">
          ${escapeHtml(dept.description || 'No department description available.')}
        </p>

        <div style="width:100%; border-top:1px solid var(--border-light); padding-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.82rem;">
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.72rem; text-transform:uppercase;">Department Head</span>
            <strong style="color:var(--text-main);">${escapeHtml(dept.headName || 'Not Assigned')}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.72rem; text-transform:uppercase;">Headcount</span>
            <strong style="color:var(--primary); font-size:0.95rem;">${dept.employeeCount || 0} Staff</strong>
          </div>
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.72rem; text-transform:uppercase;">Location</span>
            <strong style="color:var(--text-main);">${escapeHtml(dept.location || 'Headquarters')}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.72rem; text-transform:uppercase;">Annual Budget</span>
            <strong style="color:var(--text-main);">$${(dept.budget || 0).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openAddDeptModal() {
  const form = document.getElementById('addDepartmentForm');
  if (form) form.reset();
  const modal = document.getElementById('addDeptModal');
  if (modal) modal.classList.add('show');
}

function closeAddDeptModal() {
  const modal = document.getElementById('addDeptModal');
  if (modal) modal.classList.remove('show');
}

async function handleAddDepartment(e) {
  e.preventDefault();

  const deptData = {
    name: document.getElementById('deptName').value.trim(),
    code: document.getElementById('deptCode').value.trim().toUpperCase(),
    description: document.getElementById('deptDescription').value.trim(),
    headName: document.getElementById('deptHead').value.trim(),
    location: document.getElementById('deptLocation').value.trim(),
    budget: parseFloat(document.getElementById('deptBudget').value) || 0
  };

  const submitBtn = document.getElementById('submitAddDeptBtn');
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    const res = await api.post('/departments', deptData);
    if (res.success) {
      showToast(`Department '${deptData.name}' created!`, 'success');
      closeAddDeptModal();
      await loadDepartments();
    }
  } catch (error) {
    showToast(error.message || 'Could not create department', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Create Department';
  }
}

async function handleDeleteDept(id, name) {
  if (!confirm(`Are you sure you want to delete the department '${name}'?`)) return;

  try {
    const res = await api.delete(`/departments/${id}`);
    if (res.success) {
      showToast('Department removed successfully', 'success');
      await loadDepartments();
    }
  } catch (error) {
    showToast(error.message || 'Could not delete department', 'error');
  }
}
