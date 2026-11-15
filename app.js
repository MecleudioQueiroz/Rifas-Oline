(() => {
  const SELLER_PAGE = window.MODO === 'vendedor';
  const WA = '556992929501', PIX = '14286769291';
  let TOTAL = 250, PRICE = 10;
  const $ = s => document.querySelector(s), root = $('#root');
  const brl = v => v.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let sold = {}, isAdmin = false, loaded = false;
  let sel = new Set(), filter = 'all', query = '', modalN = null, loginErr = '';
  try { JSON.parse(localStorage.getItem('rifa_sel') || '[]').forEach(n => sel.add(+n)); } catch (e) {}
  const persistSel = () => { try { localStorage.setItem('rifa_sel', JSON.stringify([...sel])); } catch (e) {} };

  async function api(a, body) {
    const r = await fetch('api.php?a=' + a, body ? {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), credentials:'same-origin'} : {credentials:'same-origin'});
    const j = await r.json().catch(() => ({erro:'Resposta inválida do servidor.'}));
    if (!r.ok) { const e = new Error(j.erro || 'Erro'); e.status = r.status; throw e; }
    return j;
  }
  async function refresh(quiet) {
    try {
      const j = await api('list');
      isAdmin = j.vendedor; TOTAL = j.total; PRICE = j.valor; sold = j.vendidos; loaded = true;
      let dropped = [...sel].filter(n => sold[n] !== undefined);
      dropped.forEach(n => sel.delete(n)); if (dropped.length) { persistSel(); toast('Número(s) ' + dropped.join(', ') + ' foram vendidos e saíram da sua escolha.'); }
      if (modalN === null && !(document.activeElement && document.activeElement.id === 'search')) render();
    } catch (e) { if (!quiet) toast('Não foi possível carregar os dados.'); }
  }
  const ed = () => SELLER_PAGE && isAdmin;

  function header() {
    return `<div class="flower f-tl">🌸</div><div class="flower f-tr">🌸</div>
    <div class="title-wrap"><span>🌸❤️</span><h1>RIFA</h1></div>
    <span class="pill italic">🎗️ Participe e contribua com essa causa tão especial!</span>
    <p class="plain">Contamos com sua solidariedade!</p>
    <span class="pill" style="font-size:21px;padding:5px 14px">🎁 PRÊMIOS: 3 KITS DA NATURA</span>
    <div class="row2"><span class="pill">💰 Valor do número: R$ 10,00</span><span class="pill">🎟️ Quantidade: 250 números</span></div>
    <span class="banner">📌 CHAVE PIX PARA PARTICIPAR:</span><span class="pix">📱 ${PIX}</span>
    <div style="font-weight:900;font-size:18px;margin-top:4px">👤 Titular: ILZA MARIA DE SOUZA</div>
    <span class="pill" style="margin-top:6px">✅ Envie o comprovante para confirmar sua participação.</span>
    <span class="wa-pill">🟢 69 9292-9501 - WHATSAPP</span>
    <span class="pill" style="margin-top:9px">📢 <b>ATENÇÃO:</b> O sorteio será realizado após a venda de todos os 250</span>
    <p class="plain" style="font-size:19px">Que Deus abençoe cada pessoa que contribuir com essa causa!</p>`;
  }

  function render() {
    let h = header();
    if (SELLER_PAGE && loaded && !isAdmin) {
      h += `<section class="panel login"><h2>Área do vendedor</h2><p>Digite a senha para marcar as vendas.</p>
        <input class="field" id="senha" type="password" placeholder="Senha" autocomplete="current-password">
        <div class="err" id="loginErr">${esc(loginErr)}</div><div class="tools"><button id="btnLogin">Entrar</button></div></section>`;
      root.innerHTML = h; return;
    }
    const n = Object.keys(sold).length, free = TOTAL - n, e = ed();
    if (e) {
      h += `<section class="panel"><h2>Painel do vendedor</h2>
        <div class="stats"><span class="stat">Vendidos: <b>${n}</b></span><span class="stat">Disponíveis: <b>${free}</b></span><span class="stat">Arrecadado: <b>${brl(n*PRICE)}</b></span></div>
        <div class="bar"><i style="width:${n/TOTAL*100}%"></i></div>
        <div class="tools">
          ${window.XLSX ? `<label class="filebtn">📂 Abrir Excel<input type="file" id="fileIn" accept=".xlsx,.xls,.csv"></label><button id="btnXlsx">💾 Baixar Excel</button>` : ''}
          <button class="alt" id="btnLogout">Sair</button></div>
        <input class="search" id="search" type="search" placeholder="🔎 Buscar número ou participante..." value="${esc(query)}">
        <div class="filters">${[['all','Todos'],['sold','Vendidos'],['free','Disponíveis']].map(([k,l]) => `<button data-f="${k}" class="${filter===k?'on':''}">${l}</button>`).join('')}</div>
        <p style="text-align:center">Toque em um número para marcar como vendido e informar o participante.</p></section>`;
    } else {
      h += `<section class="panel"><h2>Escolha seus números</h2>
        <p>Toque nos números livres que você quer. Os rosa com ✔ já foram vendidos. Depois, envie sua escolha pelo WhatsApp e faça o PIX.</p>
        <div class="stats"><span class="stat">Disponíveis: <b>${free}</b></span><span class="stat">Vendidos: <b>${n}</b></span></div>
        <div class="bar"><i style="width:${n/TOTAL*100}%"></i></div>
        <div class="tools"><button class="alt" id="btnCopyPix">📋 Copiar chave PIX</button></div></section>`;
    }
    h += `<span class="list-title">📋 Lista de Números e Participantes</span><div class="grid ${e?'':'buyer'}">`;
    for (let i = 1; i <= TOTAL; i++) {
      const s = sold[i] !== undefined, nm = s && e ? String(sold[i]).toLowerCase() : '';
      let show = true;
      if (e) { if (filter === 'sold') show = s; if (filter === 'free') show = !s; if (query && !(String(i) === query || nm.includes(query))) show = false; }
      const label = s ? `Número ${i}, vendido${e && sold[i] ? ' para ' + sold[i] : ''}` : `Número ${i}, livre${sel.has(i) && !e ? ', escolhido' : ''}`;
      h += `<button class="cell${s?' sold':''}${!e && sel.has(i)?' sel':''}${show?'':' hide'}" data-n="${i}" aria-label="${esc(label)}"><span class="n">${i}</span>${e && s && sold[i] ? `<span class="who">${esc(sold[i])}</span>` : ''}</button>`;
    }
    h += '</div>';
    if (e) {
      const by = {}; Object.keys(sold).forEach(k => { const nm = String(sold[k]).trim() || '(sem nome)'; (by[nm] = by[nm] || []).push(+k); });
      const names = Object.keys(by).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      h += `<section class="panel people"><h2>👥 Participantes (${names.length})</h2><ul>` + (names.length ? names.map(nm => { const ns = by[nm].sort((a, b) => a - b); return `<li><span>${esc(nm)}</span><span>${ns.join(', ')} · ${brl(ns.length*PRICE)}</span></li>`; }).join('') : '<li><span>Nenhum número vendido ainda.</span></li>') + '</ul></section>';
    } else if (sel.size) {
      const nums = [...sel].sort((a, b) => a - b), total = brl(nums.length * PRICE);
      const msg = `Olá! Quero reservar na rifa o(s) número(s): ${nums.join(', ')} (${nums.length} x R$ 10,00 = ${total}). Meu nome: `;
      h += `<div class="cart"><div class="cart-in"><div class="cart-txt"><b>${nums.length} ${nums.length>1?'números':'número'} · ${total}</b><span class="cart-nums">${nums.join(', ')}</span></div>
        <button class="alt" id="btnClearSel">Limpar</button><a class="wa" href="https://wa.me/${WA}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a></div></div>`;
    }
    if (modalN !== null) {
      const has = sold[modalN] !== undefined;
      h += `<div class="modal"><div class="modal-box" role="dialog" aria-modal="true"><h2>Número ${modalN}</h2><p>${has ? 'Vendido. Edite o nome ou desmarque.' : 'Informe o nome do participante'}</p>
        <input class="field" id="mName" type="text" maxlength="60" autocomplete="off" placeholder="Nome do participante" value="${has ? esc(sold[modalN]) : ''}">
        <div class="dlg-btns"><button id="mOk">${has ? '✔ Salvar' : '✔ Marcar vendido'}</button>${has ? '<button class="alt" id="mUn">Desmarcar</button>' : ''}<button class="alt" id="mCancel">Cancelar</button></div></div></div>`;
    }
    const keep = document.activeElement && document.activeElement.id === 'search';
    root.innerHTML = h;
    if (modalN !== null) { const i = $('#mName'); i && i.focus(); }
    else if (keep) { const i = $('#search'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }

  let tt;
  function toast(m) { const o = $('.toast'); o && o.remove(); const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); clearTimeout(tt); tt = setTimeout(() => t.remove(), 2600); }

  async function save(call) {
    try { await call(); modalN = null; await refresh(); }
    catch (e) { if (e.status === 401) { isAdmin = false; render(); toast('Sessão expirada. Entre de novo.'); } else toast(e.message || 'Não foi possível salvar.'); }
  }

  root.addEventListener('click', async ev => {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.n) {
      const n = +t.dataset.n;
      if (ed()) { modalN = n; render(); }
      else if (sold[n] !== undefined) toast('O número ' + n + ' já foi vendido.');
      else { sel.has(n) ? sel.delete(n) : sel.add(n); persistSel(); render(); }
      return;
    }
    if (t.dataset.f) { filter = t.dataset.f; render(); return; }
    switch (t.id) {
      case 'btnLogin': {
        try { await api('login', {senha: $('#senha').value}); loginErr = ''; await refresh(); }
        catch (e) { loginErr = e.message; render(); }
        break; }
      case 'btnLogout': await api('logout', {}); isAdmin = false; await refresh(); break;
      case 'mOk': { const v = $('#mName').value; save(() => api('set', {n: modalN, nome: v})); break; }
      case 'mUn': save(() => api('unset', {n: modalN})); break;
      case 'mCancel': modalN = null; render(); break;
      case 'btnClearSel': sel.clear(); persistSel(); render(); break;
      case 'btnXlsx': {
        const rows = [['Número','Status','Participante','Valor (R$)']];
        for (let i = 1; i <= TOTAL; i++) rows.push([i, sold[i] !== undefined ? 'VENDIDO' : 'DISPONÍVEL', sold[i] || '', sold[i] !== undefined ? PRICE : '']);
        const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = [{wch:9},{wch:14},{wch:34},{wch:11}];
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Rifa'); XLSX.writeFile(wb, 'rifa-controle.xlsx'); break; }
      case 'btnCopyPix':
        try { await navigator.clipboard.writeText(PIX); toast('Chave PIX copiada: ' + PIX); } catch (e) { toast('Chave PIX: ' + PIX); }
        break;
    }
  });
  root.addEventListener('input', e => { if (e.target.id === 'search') { query = e.target.value.trim().toLowerCase(); render(); } });
  root.addEventListener('change', async e => {
    if (e.target.id !== 'fileIn' || !e.target.files[0]) return;
    try {
      const wb = XLSX.read(await e.target.files[0].arrayBuffer(), {type:'array'});
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:''}), out = {};
      rows.forEach(r => { const n = parseInt(r[0], 10); if (!(n >= 1 && n <= TOTAL)) return;
        const st = String(r[1]).trim().toUpperCase(), nome = String(r[2] || '').trim();
        if (st.startsWith('VENDID') || st === 'SIM' || st === 'X' || (st === '' && nome)) out[n] = nome; });
      if (!confirm('Substituir as vendas atuais pelas ' + Object.keys(out).length + ' vendas da planilha?')) return;
      save(() => api('import', {vendidos: out}));
    } catch (err) { toast('Não foi possível ler o arquivo.'); }
  });
  root.addEventListener('keydown', e => {
    if (e.target.id === 'mName' && e.key === 'Enter') $('#mOk').click();
    if (e.target.id === 'senha' && e.key === 'Enter') $('#btnLogin').click();
    if (e.key === 'Escape' && modalN !== null) { modalN = null; render(); }
  });

  render(); refresh();
  setInterval(() => { if (!document.hidden) refresh(true); }, 20000);
})();
