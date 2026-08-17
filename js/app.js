let currentUser = null;

function parseInterests(str) {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

(function showPendingToast() {
  const pending = sessionStorage.getItem('pendingToast');
  if (!pending) return;
  sessionStorage.removeItem('pendingToast');
  const { message, type } = JSON.parse(pending);
  showToast(message, type);
})();

function renderPagination(containerId, meta, onPageChange) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  if (!meta || meta.totalPages <= 1) return;

  for (let p = 1; p <= meta.totalPages; p++) {
    const btn = document.createElement('button');
    btn.textContent = String(p);
    if (p === meta.page) btn.classList.add('active');
    btn.addEventListener('click', () => onPageChange(p));
    el.appendChild(btn);
  }
}

// ---------- Auth ----------

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  try {
    const { data } = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    currentUser = data.user;
    enterApp();
    showToast('Logged in successfully', 'success');
  } catch (err) {
    errorEl.textContent = err.message;
    showToast(err.message, 'error');
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const interests = parseInterests(document.getElementById('regInterests').value);
  const errorEl = document.getElementById('registerError');
  errorEl.textContent = '';

  try {
    const { data } = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password, interests },
    });
    setToken(data.token);
    currentUser = data.user;
    enterApp();
    showToast('Account created successfully', 'success');
  } catch (err) {
    errorEl.textContent = err.message;
    showToast(err.message, 'error');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  setToken(null);
  currentUser = null;
  sessionStorage.setItem('pendingToast', JSON.stringify({ message: 'Logged out successfully', type: 'success' }));
  location.reload();
});

document.querySelectorAll('#authSection .tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#authSection .tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('#authSection .tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Form').classList.add('active');
  });
});

// ---------- App shell ----------

function enterApp() {
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('appSection').classList.remove('hidden');
  document.getElementById('userInfo').classList.remove('hidden');
  document.getElementById('userLabel').textContent = `${currentUser.name} (${currentUser.role})`;

  if (currentUser.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach((el) => el.classList.remove('hidden'));
    document.getElementById('notesHeading').textContent = 'All Notes (admin view)';
  }

  loadNotes(1);
}

document.querySelectorAll('#appSection nav .tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#appSection nav .tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('#appSection .view').forEach((v) => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');

    if (btn.dataset.view === 'notes') loadNotes(1);
    if (btn.dataset.view === 'admin') loadUsers(1);
    if (btn.dataset.view === 'interests') loadInterests(1);
  });
});

// ---------- Notes ----------

document.getElementById('noteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('noteTitle').value;
  const content = document.getElementById('noteContent').value;
  await apiRequest('/notes', { method: 'POST', body: { title, content } });
  e.target.reset();
  loadNotes(1);
});

async function loadNotes(page) {
  const { data, meta } = await apiRequest('/notes', { params: { page, limit: 5 } });
  const list = document.getElementById('notesList');
  list.innerHTML = '';

  data.forEach((note) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h3>${escapeHtml(note.title)}</h3>
      <p>${escapeHtml(note.content)}</p>
      <small>Owner: ${escapeHtml(note.owner)}</small>
      <div class="actions">
        <button type="button" data-id="${note._id}" class="edit-note">Edit</button>
        <button type="button" data-id="${note._id}" class="delete-note">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });

  renderPagination('notesPagination', meta, loadNotes);

  list.querySelectorAll('.delete-note').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this note?')) return;
      await apiRequest(`/notes/${btn.dataset.id}`, { method: 'DELETE' });
      loadNotes(meta.page);
    });
  });

  list.querySelectorAll('.edit-note').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const title = prompt('New title (blank = keep current):');
      const content = prompt('New content (blank = keep current):');
      const body = {};
      if (title) body.title = title;
      if (content) body.content = content;
      if (Object.keys(body).length === 0) return;
      await apiRequest(`/notes/${btn.dataset.id}`, { method: 'PATCH', body });
      loadNotes(meta.page);
    });
  });
}

// ---------- Posts ----------

document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('postTitle').value;
  const content = document.getElementById('postContent').value;
  await apiRequest('/posts', { method: 'POST', body: { title, content } });
  e.target.reset();
  alert('Post created.');
});

document.getElementById('loadPostsBtn').addEventListener('click', () => {
  const userId = document.getElementById('postsUserId').value.trim() || currentUser.id;
  loadPosts(userId, 1);
});

async function loadPosts(userId, page) {
  const { data, meta } = await apiRequest(`/posts/user/${userId}`, { params: { page, limit: 5 } });
  const list = document.getElementById('postsList');
  list.innerHTML = '';

  data.forEach((post) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <p>${escapeHtml(post.content)}</p>
      <small>By ${escapeHtml(post.author.name)} (${escapeHtml(post.author.email)})</small>
    `;
    list.appendChild(div);
  });

  renderPagination('postsPagination', meta, (p) => loadPosts(userId, p));
}

// ---------- Admin: Users ----------

document.getElementById('createUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('newUserName').value;
  const email = document.getElementById('newUserEmail').value;
  const password = document.getElementById('newUserPassword').value;
  const role = document.getElementById('newUserRole').value;
  const interests = parseInterests(document.getElementById('newUserInterests').value);
  await apiRequest('/admin/users', { method: 'POST', body: { name, email, password, role, interests } });
  e.target.reset();
  loadUsers(1);
});

async function loadUsers(page) {
  const { data, meta } = await apiRequest('/admin/users', { params: { page, limit: 5 } });
  const list = document.getElementById('usersList');
  list.innerHTML = '';

  data.forEach((user) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h3>${escapeHtml(user.name)} <span class="badge">${escapeHtml(user.role)}</span></h3>
      <p>${escapeHtml(user.email)}</p>
      <small>Interests: ${(user.interests || []).map(escapeHtml).join(', ') || '-'}</small>
      <div class="actions">
        <button type="button" data-id="${user._id}" class="toggle-role">Toggle Role</button>
        <button type="button" data-id="${user._id}" class="delete-user">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });

  renderPagination('usersPagination', meta, loadUsers);

  list.querySelectorAll('.delete-user').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this user?')) return;
      await apiRequest(`/admin/users/${btn.dataset.id}`, { method: 'DELETE' });
      loadUsers(1);
    });
  });

  list.querySelectorAll('.toggle-role').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const user = data.find((u) => u._id === btn.dataset.id);
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await apiRequest(`/admin/users/${btn.dataset.id}`, { method: 'PATCH', body: { role: newRole } });
      loadUsers(meta.page);
    });
  });
}

// ---------- Admin: Interests ----------

document.getElementById('loadInterestsBtn').addEventListener('click', () => loadInterests(1));

async function loadInterests(page) {
  const { data, meta } = await apiRequest('/admin/users/grouped-by-interests', { params: { page, limit: 5 } });
  const list = document.getElementById('interestsList');
  list.innerHTML = '';

  data.forEach((group) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h3>${escapeHtml(group._id)} <span class="badge">${group.count}</span></h3>
      <ul>${group.users.map((u) => `<li>${escapeHtml(u.name)} (${escapeHtml(u.email)})</li>`).join('')}</ul>
    `;
    list.appendChild(div);
  });

  renderPagination('interestsPagination', meta, loadInterests);
}

// ---------- Bootstrap ----------

(async function init() {
  const token = getToken();
  if (!token) return;

  try {
    const { data } = await apiRequest('/users/me');
    currentUser = { id: data._id, name: data.name, email: data.email, role: data.role };
    enterApp();
  } catch {
    setToken(null);
  }
})();
