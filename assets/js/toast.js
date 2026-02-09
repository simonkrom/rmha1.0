(function(){
  function ensureContainer(){
    let c = document.getElementById('toast-container');
    if(!c){
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type='info', title=null, timeout=4500){
    const c = ensureContainer();
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    if(title) t.innerHTML = `<div class="title">${title}</div><div class="msg">${message}</div>`;
    else t.innerHTML = `<div class="msg">${message}</div>`;
    c.appendChild(t);
    // force reflow then show
    requestAnimationFrame(()=> t.classList.add('show'));
    const to = setTimeout(()=> {
      t.classList.remove('show');
      setTimeout(()=> t.remove(), 220);
    }, timeout);
    t.addEventListener('click', ()=> { clearTimeout(to); t.classList.remove('show'); setTimeout(()=> t.remove(), 220); });
    return t;
  }

  window.showToast = function(message, type, title, timeout){ return showToast(message, type, title, timeout); };
})();
