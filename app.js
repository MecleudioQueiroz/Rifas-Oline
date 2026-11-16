(() => {
  const SELLER_PAGE = window.MODO === 'vendedor';
  const WA = '556992929501', PIX = '14286769291';
  let TOTAL = 250, PRICE = 10;
  const $ = s => document.querySelector(s), root = $('#root');
  const brl = v => v.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let sold = {}, isAdmin = false, loaded = false, loadErr = false;
  let deferredPrompt = null, installHelp = false, shareUrl = null, shareBlob = null, genBusy = false;
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installBtn = () => standalone() ? '' : '<button class="alt" id="btnInstall">📲 Instalar no celular</button>';
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
      loadErr = false; isAdmin = j.vendedor; TOTAL = j.total; PRICE = j.valor; sold = j.vendidos; loaded = true;
      let dropped = [...sel].filter(n => sold[n] !== undefined);
      dropped.forEach(n => sel.delete(n)); if (dropped.length) { persistSel(); toast('Número(s) ' + dropped.join(', ') + ' foram vendidos e saíram da sua escolha.'); }
      if (modalN === null && !shareUrl && !(document.activeElement && document.activeElement.id === 'search')) render();
    } catch (e) { if (!loaded) { loadErr = true; render(); } else if (!quiet) toast('Sem conexão. Mostrando os últimos dados.'); }
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

  function helpModal() {
    const passos = isIOS()
      ? ['Abra esta página no <b>Safari</b>.', 'Toque em <b>Compartilhar</b> (o quadrado com uma seta para cima, na barra do Safari).', 'Role a lista e toque em <b>Adicionar à Tela de Início</b>.', 'Toque em <b>Adicionar</b>. O ícone aparece na sua tela.']
      : ['Toque nos <b>três pontinhos ⋮</b> do navegador (Chrome).', 'Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.', 'Confirme. O ícone aparece na sua tela.'];
    return `<div class="modal"><div class="modal-box" role="dialog" aria-modal="true"><h2>Instalar no celular</h2>
      <ol style="text-align:left;font-weight:700;font-size:14px;padding-left:20px;margin:8px 0">${passos.map(x => `<li style="margin:6px 0">${x}</li>`).join('')}</ol>
      <div class="dlg-btns"><button id="hOk">Entendi</button></div></div></div>`;
  }

  function render() {
    let h = header();
    if (!loaded) {
      h += `<section class="panel login"><h2>${loadErr ? 'Sem conexão' : 'Carregando os números…'}</h2>
        <p>${loadErr ? 'Não foi possível buscar os números. Confira sua internet e tente de novo.' : 'Aguarde um instante.'}</p>
        ${loadErr ? '<div class="tools"><button id="btnRetry">Tentar de novo</button></div>' : ''}</section>`;
      root.innerHTML = h; return;
    }
    if (SELLER_PAGE && loaded && !isAdmin) {
      h += `<section class="panel login"><h2>Área do vendedor</h2><p>Digite a senha para marcar as vendas.</p>
        <input class="field" id="senha" type="password" placeholder="Senha" autocomplete="current-password">
        <div class="err" id="loginErr">${esc(loginErr)}</div><div class="tools"><button id="btnLogin">Entrar</button>${installBtn()}</div></section>`;
      root.innerHTML = h; return;
    }
    const n = Object.keys(sold).length, free = TOTAL - n, e = ed();
    if (e) {
      h += `<section class="panel"><h2>Painel do vendedor</h2>
        <div class="stats"><span class="stat">Vendidos: <b>${n}</b></span><span class="stat">Disponíveis: <b>${free}</b></span><span class="stat">Arrecadado: <b>${brl(n*PRICE)}</b></span></div>
        <div class="bar"><i style="width:${n/TOTAL*100}%"></i></div>
        <div class="tools">
          ${window.XLSX ? `<label class="filebtn">📂 Abrir Excel<input type="file" id="fileIn" accept=".xlsx,.xls,.csv"></label><button id="btnXlsx">💾 Baixar Excel</button>` : ''}
          <button id="btnImg">📸 Imagem para o Status</button><button class="alt" id="btnLogout">Sair</button>${installBtn()}</div>
        <input class="search" id="search" type="search" placeholder="🔎 Buscar número ou participante..." value="${esc(query)}">
        <div class="filters">${[['all','Todos'],['sold','Vendidos'],['free','Disponíveis']].map(([k,l]) => `<button data-f="${k}" class="${filter===k?'on':''}">${l}</button>`).join('')}</div>
        <p style="text-align:center">Toque em um número para marcar como vendido e informar o participante.</p></section>`;
    } else {
      h += `<section class="panel"><h2>Escolha seus números</h2>
        <p>Toque nos números livres que você quer. Os rosa com ✔ já foram vendidos. Depois, envie sua escolha pelo WhatsApp e faça o PIX.</p>
        <div class="stats"><span class="stat">Disponíveis: <b>${free}</b></span><span class="stat">Vendidos: <b>${n}</b></span></div>
        <div class="bar"><i style="width:${n/TOTAL*100}%"></i></div>
        <div class="tools"><button class="alt" id="btnCopyPix">📋 Copiar chave PIX</button>${installBtn()}</div></section>`;
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
    if (installHelp) h += helpModal();
    if (shareUrl && e) h += `<div class="modal"><div class="modal-box" role="dialog" aria-modal="true" style="max-height:94vh;overflow:auto"><h2>Imagem do Status</h2>
      <p>Pronta para o status do WhatsApp (formato 9:16).</p>
      <img src="${shareUrl}" alt="Prévia da imagem da rifa" style="width:min(60vw,240px);border:2px solid var(--pill-border);border-radius:10px">
      <div class="dlg-btns">${navigator.canShare ? '<button id="btnShareImg">📤 Compartilhar</button>' : ''}<a class="wa" href="${shareUrl}" download="rifa-status.png">⬇ Baixar imagem</a><button class="alt" id="btnCloseImg">Fechar</button></div>
      <p style="margin-top:10px">No celular: toque em Compartilhar e escolha o WhatsApp (Status). Se não aparecer, segure o dedo na imagem para salvar.</p></div></div>`;
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


  /* ---------- imagem para o status do WhatsApp (1080x1920) ---------- */
  async function drawStatus() {
    try {
      await Promise.all(['900 40px "Playfair Display"', 'italic 500 30px "Playfair Display"', '900 30px Nunito', '800 30px Nunito'].map(f => document.fonts.load(f)));
    } catch (e) {}
    const W = 900, H = 1600, K = 1.2, SERIF = '"Playfair Display", Georgia, serif', SANS = 'Nunito, system-ui, sans-serif';
    const cv = document.createElement('canvas'); cv.width = W * K; cv.height = H * K;
    const c = cv.getContext('2d'); c.scale(K, K); c.textAlign = 'center'; c.textBaseline = 'middle';
    const WINE = '#8b1538', ROSE = '#d81b60', PILL = '#fbd3dd', EDGE = '#f4a9bd', INK = '#2b1b20';

    const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    // desenha texto que encolhe até caber na largura
    const fit = (txt, x, y, maxW, size, weight, fam, color, style) => {
      let sz = size; do { c.font = `${style || ''} ${weight} ${sz}px ${fam}`; sz -= 1; } while (c.measureText(txt).width > maxW && sz > 10);
      c.fillStyle = color; c.fillText(txt, x, y);
    };
    const pill = (x, y, w, h, fill, txt, size, weight, fam, color, style, stroke) => {
      rr(x, y, w, h, h / 2); c.fillStyle = fill; c.fill(); if (stroke) { c.setLineDash([8, 6]); c.strokeStyle = EDGE; c.lineWidth = 3; c.stroke(); c.setLineDash([]); }
      fit(txt, x + w / 2, y + h / 2 + 2, w - 36, size, weight, fam, color, style);
    };

    // fundo
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fde4ea'); g.addColorStop(.4, '#fff3f6'); g.addColorStop(1, '#fde4ea');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.font = '84px sans-serif';
    [[48, 56, -.25, 1], [W - 48, 56, .25, -1], [40, H - 4, .25, 1], [W - 40, H - 4, -.25, -1]].forEach(([x, y, a, f]) => { c.save(); c.translate(x, y); c.rotate(a); c.scale(f, 1); c.fillText('🌸', 0, 0); c.restore(); });

    // cabeçalho
    pill(250, 10, 400, 84, PILL, '🌸❤️ RIFA', 68, 900, SERIF, WINE, '', true);
    pill(70, 104, 760, 48, 'rgba(251,211,221,.85)', '🎗️ Participe e contribua com essa causa tão especial!', 29, 500, SERIF, INK, 'italic');
    fit('Contamos com sua solidariedade!', W / 2, 176, 760, 28, 500, SERIF, INK, 'italic');
    pill(180, 198, 540, 54, PILL, '🎁 PRÊMIOS: 3 KITS DA NATURA', 32, 900, SANS, INK);
    pill(60, 264, 420, 48, PILL, '💰 Valor do número: R$ 10,00', 24, 800, SANS, INK);
    pill(492, 264, 348, 48, PILL, '🎟️ Quantidade: 250 números', 24, 800, SANS, INK);
    pill(165, 324, 570, 50, ROSE, '📌 CHAVE PIX PARA PARTICIPAR:', 32, 900, SANS, '#fff');
    pill(250, 380, 400, 56, PILL, '📱 14286769291', 44, 900, SANS, INK);
    fit('👤 Titular: ILZA MARIA DE SOUZA', W / 2, 462, 760, 30, 900, SANS, INK);
    pill(115, 486, 670, 44, PILL, '✅ Envie o comprovante para confirmar sua participação.', 24, 800, SANS, INK);
    pill(195, 540, 510, 50, ROSE, '🟢 69 9292-9501 - WHATSAPP', 30, 900, SANS, '#fff');
    pill(40, 600, 820, 44, PILL, '📢 ATENÇÃO: O sorteio será realizado após a venda de todos os 250', 24, 800, SANS, INK);
    fit('Que Deus abençoe cada pessoa que contribuir com essa causa!', W / 2, 670, 800, 28, 500, SERIF, INK, 'italic');

    // quantidade vendida / livres
    const n = Object.keys(sold).length, livres = TOTAL - n;
    pill(60, 696, 360, 56, '#fff', `✅ Vendidos: ${n}`, 34, 900, SANS, '#b0124b', '', true);
    pill(480, 696, 360, 56, '#fff', `🎟️ Livres: ${livres}`, 34, 900, SANS, '#1b8a4b', '', true);
    pill(110, 764, 680, 54, ROSE, '📋 Números livres ficam em branco', 30, 900, SANS, '#fff');

    // grade
    const gx = 20, gy = 832, cw = 86, rh = 28, rows = TOTAL / 10;
    rr(gx - 2, gy - 2, cw * 10 + 4, rh * rows + 4, 6); c.fillStyle = '#fff'; c.fill();
    for (let i = 1; i <= TOTAL; i++) {
      const col = (i - 1) % 10, row = Math.floor((i - 1) / 10), x = gx + col * cw, y = gy + row * rh, isSold = sold[i] !== undefined;
      if (isSold) { c.fillStyle = '#ffd1de'; c.fillRect(x, y, cw, rh); }
      c.font = `900 21px ${SANS}`; const tw = c.measureText(String(i)).width;
      c.fillStyle = isSold ? '#b0124b' : INK; c.fillText(String(i), x + cw / 2, y + rh / 2 + 1);
      if (isSold) { c.fillRect(x + cw / 2 - tw / 2 - 2, y + rh / 2 + 1, tw + 4, 2.5); }
    }
    c.strokeStyle = '#222'; c.lineWidth = 1;
    for (let r2 = 1; r2 < rows; r2++) { c.beginPath(); c.moveTo(gx, gy + r2 * rh); c.lineTo(gx + cw * 10, gy + r2 * rh); c.stroke(); }
    for (let c2 = 1; c2 < 10; c2++) { c.beginPath(); c.moveTo(gx + c2 * cw, gy); c.lineTo(gx + c2 * cw, gy + rh * rows); c.stroke(); }
    c.lineWidth = 3; rr(gx, gy, cw * 10, rh * rows, 5); c.stroke();

    const d = new Date(), pad = v => String(v).padStart(2, '0');
    fit(`Atualizado em ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`, W / 2, gy + rh * rows + 22, 760, 20, 800, SANS, '#6b4350');

    return new Promise((ok, fail) => cv.toBlob(b => b ? ok(b) : fail(new Error('canvas')), 'image/png'));
  }

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
      case 'btnRetry': loadErr = false; render(); refresh(); break;
      case 'hOk': installHelp = false; render(); break;
      case 'btnImg':
        if (genBusy) break; genBusy = true; t.textContent = '⏳ Gerando…';
        try { shareBlob = await drawStatus(); if (shareUrl) URL.revokeObjectURL(shareUrl); shareUrl = URL.createObjectURL(shareBlob); }
        catch (err) { toast('Não foi possível gerar a imagem.'); }
        genBusy = false; render(); break;
      case 'btnCloseImg': URL.revokeObjectURL(shareUrl); shareUrl = null; shareBlob = null; render(); break;
      case 'btnShareImg':
        try {
          const f = new File([shareBlob], 'rifa-status.png', {type: 'image/png'});
          if (navigator.canShare({files: [f]})) await navigator.share({files: [f], title: 'Rifa Solidária'});
          else toast('Seu aparelho não permite compartilhar daqui. Use Baixar imagem.');
        } catch (err) { if (err && err.name !== 'AbortError') toast('Não foi possível compartilhar. Use Baixar imagem.'); }
        break;
      case 'btnInstall':
        if (deferredPrompt) { deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; render(); }
        else { installHelp = true; render(); }
        break;
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
    if (e.key === 'Escape' && installHelp) { installHelp = false; render(); }
    if (e.key === 'Escape' && shareUrl) { URL.revokeObjectURL(shareUrl); shareUrl = null; shareBlob = null; render(); }
  });

  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; if (loaded && modalN === null) render(); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; installHelp = false; toast('App instalado!'); render(); });
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

  render(); refresh();
  setInterval(() => { if (!document.hidden) refresh(true); }, 20000);
})();
