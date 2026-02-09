/* Centralized auth JS for local/demo authentication
   Exposes:
     - authInit() : initialize login modal/controls on the homepage
     - authRequireRole(role, opts) : protect a page and populate username/logout handlers
*/(function(){
  // Default users (will be stored in localStorage under key 'USERS')
  const DEFAULT_USERS = {
    admin: { username: 'admin', password: 'admin123', role: 'admin' },
    manager: { username: 'manager', password: 'manager123', role: 'manager' },
    coursier: { username: 'coursier', password: 'coursier123', role: 'coursier' },
    pharmacien: { username: 'pharmacien', password: 'pharmacien123', role: 'pharmacien' },
  };

  // Helpers for persistent users
  function loadUsers(){
    try{
      const raw = localStorage.getItem('USERS');
      if(!raw){
        // initialize with defaults
        localStorage.setItem('USERS', JSON.stringify(DEFAULT_USERS));
        return Object.assign({}, DEFAULT_USERS);
      }
      return JSON.parse(raw) || {};
    } catch(e){ console.error('Failed to load users', e); return Object.assign({}, DEFAULT_USERS); }
  }

  function saveUsers(users){
    localStorage.setItem('USERS', JSON.stringify(users));
  }

  function getUsers(){ return loadUsers(); }

  function addUser(username, password, role, actor){
    const users = loadUsers();
    if(users[username]) return false; // already exists
    users[username] = { username, password, role };
    saveUsers(users);
    addAudit('create', username, actor || sessionStorage.getItem('username') || 'system', { role });
    return true;
  }

  function updateUser(username, data, actor){
    const users = loadUsers();
    if(!users[username]) return false;
    const before = Object.assign({}, users[username]);
    const updated = Object.assign({}, before, data);
    if(data.username && data.username !== username){
      // rename: move to new key
      users[data.username] = updated;
      delete users[username];
      username = data.username;
    } else {
      users[username] = updated;
    }
    saveUsers(users);
    addAudit('update', username, actor || sessionStorage.getItem('username') || 'system', { before, after: updated });
    return true;
  }

  function deleteUser(username, actor){
    const users = loadUsers();
    if(!users[username]) return false;
    delete users[username];
    saveUsers(users);
    addAudit('delete', username, actor || sessionStorage.getItem('username') || 'system');
    return true;
  }

  // Audit log helpers (stored in localStorage.AUDIT_LOG)
  function addAudit(action, userAffected, byUser, details){
    try{
      const raw = localStorage.getItem('AUDIT_LOG') || '[]';
      const logs = JSON.parse(raw);
      logs.unshift({ action, userAffected, byUser: byUser || sessionStorage.getItem('username') || 'system', details: details || null, timestamp: new Date().toISOString() });
      // keep a reasonable size (e.g., 1000 entries)
      if(logs.length > 1000) logs.length = 1000;
      localStorage.setItem('AUDIT_LOG', JSON.stringify(logs));
    } catch(e){ console.error('Failed to write audit log', e); }
  }

  function getAudits(){
    try{ return JSON.parse(localStorage.getItem('AUDIT_LOG') || '[]'); }catch(e){ return []; }
  }

  function clearAudits(){ localStorage.removeItem('AUDIT_LOG'); }

  // Expose helpers for admin page so it does not need to import anything else
  window.getUsers = getUsers;
  window.addUser = addUser;
  window.updateUser = updateUser;
  window.deleteUser = deleteUser;
  window.addAudit = addAudit;
  window.getAudits = getAudits;
  window.clearAudits = clearAudits;

  function updateUser(username, data){
    const users = loadUsers();
    if(!users[username]) return false;
    users[username] = Object.assign({}, users[username], data);
    // if username changed, handle rename
    if(data.username && data.username !== username){
      users[data.username] = users[username];
      delete users[username];
    }
    saveUsers(users);
    return true;
  }

  function deleteUser(username){
    const users = loadUsers();
    if(!users[username]) return false;
    delete users[username];
    saveUsers(users);
    return true;
  }

  function openModal(modal){ if(modal) modal.classList.add('active'), modal.setAttribute('aria-hidden','false'); }
  function closeModal(modal, form, errorEl){ if(modal) modal.classList.remove('active'), modal.setAttribute('aria-hidden','true'); if(errorEl) errorEl.style.display='none'; if(form) form.reset(); }
  function doLogout(){ sessionStorage.clear(); window.location.href = 'index.html'; }

  function initAuth(){
    // Elements may only exist on index.html
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogin = document.getElementById('mobileLoginLink');
    const modal = document.getElementById('loginModal');
    const overlay = document.getElementById('loginModalOverlay');
    const closeBtn = document.getElementById('loginClose');
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('loginError');

    if(loginBtn) loginBtn.addEventListener('click', function(){
      // if already logged in, quick access
      const r = sessionStorage.getItem('userRole');
      if (r) {
        if (r === 'manager') window.location.href='manager.html';
        else if (r === 'coursier') window.location.href='coursier.html';
        else if (r === 'pharmacien') window.location.href='pharmacien.html';
        return;
      }
      openModal(modal);
    });

    if(mobileLogin) mobileLogin.addEventListener('click', function(e){ e.preventDefault(); openModal(modal); const mm = document.getElementById('mobileMenu'); const mmo = document.getElementById('mobileMenuOverlay'); if(mm) mm.classList.remove('active'); if(mmo) mmo.classList.remove('active'); });
    if(overlay) overlay.addEventListener('click', function(){ closeModal(modal, form, errorEl); });
    if(closeBtn) closeBtn.addEventListener('click', function(){ closeModal(modal, form, errorEl); });
    if(logoutBtn) logoutBtn.addEventListener('click', doLogout);

    if(form) form.addEventListener('submit', function(e){
      e.preventDefault();
      const role = document.getElementById('role').value;
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const user = USERS[role];
      if (user && user.username === username && user.password === password) {
        sessionStorage.setItem('userRole', role);
        sessionStorage.setItem('username', username);
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        // redirect
        if (role === 'manager') window.location.href = 'manager.html';
        else if (role === 'coursier') window.location.href = 'coursier.html';
        else if (role === 'pharmacien') window.location.href = 'pharmacien.html';
      } else {
        if(errorEl){ errorEl.textContent = 'Identifiants incorrects.'; errorEl.style.display = 'block'; }
      }
    });

    // If already logged in, adjust header state
    const current = sessionStorage.getItem('userRole');
    if (current) {
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      if (loginBtn) loginBtn.textContent = 'Mon compte';
    }
  }

  function openRoleModal(role){
    const modal = document.getElementById('loginModal');
    const title = document.getElementById('loginModalTitle');
    const select = document.getElementById('role');
    const username = document.getElementById('username');
    const label = role && role.charAt(0).toUpperCase() + role.slice(1);
    if(title) title.textContent = 'Connexion ' + label;
    if(select) select.value = role;
    if(username){ username.value = ''; setTimeout(()=>username.focus(), 50); }
    if(modal) openModal(modal);
  }

  // Protect a page and optionally attach UI elements
  function authRequireRole(required, opts){
    const role = sessionStorage.getItem('userRole');
    if (role !== required) {
      alert('Accès refusé — connectez-vous en tant que ' + required);
      window.location.href = 'index.html';
      return;
    }
    // populate username if selector provided
    if (opts && opts.usernameId){
      const el = document.getElementById(opts.usernameId);
      if (el) el.textContent = sessionStorage.getItem('username') || el.textContent;
    }
    // attach logout handler
    if (opts && opts.logoutId){
      const lb = document.getElementById(opts.logoutId);
      if (lb) lb.addEventListener('click', doLogout);
    }
  }

  // Expose a simple login helper for dedicated login pages
  function authLogin(role, username, password){
    const users = loadUsers();
    // find a user with matching role and username
    for(const key in users){
      const u = users[key];
      if(u && u.role === role && u.username === username && u.password === password){
        sessionStorage.setItem('userRole', role);
        sessionStorage.setItem('username', username);
        return true;
      }
    }
    return false;
  }

  // Export
  window.authInit = initAuth;
  window.authRequireRole = authRequireRole;
  window.authLogin = authLogin;
  window.openRoleModal = openRoleModal;
})();