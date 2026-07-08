/* ============================================================
   OwlLogics NexGen Owl Mode
   © 2024 OwlLogics Contributors — All Rights Reserved — Patent Pending
   Contact: contact@owllogics.app
   ============================================================
   OwlLogics UI Engine — View Rendering & DOM Management
   ============================================================ */

const AutoSeqUI = (function () {
  'use strict';

  const views = {
    dashboard:    { icon: '📊', label: 'Dashboard',         render: renderDashboard },
    'shop-floor': { icon: '🏭', label: 'Shop Floor',        render: renderShopFloor },
    sequence:     { icon: '📋', label: 'Sequence Manager',  render: renderSequence },
    'rack-loading': { icon: '📦', label: 'Rack Loading',    render: renderRackLoading },
    kitting:      { icon: '🔧', label: 'Kitting',           render: renderKitting },
    opcodes:      { icon: '⚙️',  label: 'Op Codes / CGM',    render: renderOpCodes },
    msqm:         { icon: '📡',  label: 'MSQM Stream',       render: renderMSQM },
    protocols:    { icon: '🔌',  label: 'Protocols',         render: renderProtocols },
    routes:       { icon: '🚚',  label: 'Routes & Delivery', render: renderRoutes },
    forklifts:    { icon: '🚜',  label: 'Forklift Fleet',    render: renderForklifts },
    reports:      { icon: '📈',  label: 'Reports',           render: renderReports },
    terminal:     { icon: '🖥️',  label: 'TN3270 Terminal',   render: renderTerminal },
    'owl-ai':     { icon: '🧠',  label: 'AI Optimizer',      render: renderOwlAI },
    metrics:      { icon: '📊',  label: 'Live Metrics',      render: renderMetrics },
    packages:     { icon: '📦',  label: 'Package Master',    render: renderPackages },
    pallets:      { icon: '🛒',  label: 'Pallet Staging',    render: renderPallets },
    logistics:    { icon: '🚢',  label: 'CKD & Shipping',    render: renderLogistics },
    shipyards:    { icon: '⚓',  label: 'Shipyards',         render: renderShipyards },
    transport:    { icon: '🚆',  label: 'Trucks & Rail',     render: renderTransport },
    'cost-analysis': { icon: '💰', label: 'Cost Analysis',   render: renderCostAnalysis },
    labels:       { icon: '🏷️',  label: 'Label Printing',    render: renderLabels },
    parts:        { icon: '🔩',  label: 'Parts Catalog',     render: renderParts },
    commodities:  { icon: '📦',  label: 'Commodity Master',  render: renderCommodities },
    items:        { icon: '📋',  label: 'Item Master',       render: renderItems },
    'nextgen-compare': { icon: '⚖️', label: 'NextGen vs OwlLogics', render: renderNextGenCompare },
    docs:         { icon: '📖',  label: 'Documentation',       render: renderDocs },
  };

  // ── Init ───────────────────────────────────────────────────
  function init() {
    buildSidebar();
    buildTopbar();
    buildStatusBar();
    switchView('dashboard');

    // Auto-start MSQM
    setTimeout(() => {
      AutoSeq.msqmStart();
    }, 500);
  }

  // ── Sidebar ────────────────────────────────────────────────
  function buildSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';

    const section = document.createElement('div');
    section.className = 'sidebar-section';
    section.innerHTML = '<div class="sidebar-header">AOS Modules</div>';

    Object.entries(views).forEach(([key, v]) => {
      const item = document.createElement('div');
      item.className = 'sidebar-item' + (key === 'dashboard' ? ' active' : '');
      item.id = `nav-${key}`;
      item.innerHTML = `<span class="icon">${v.icon}</span><span>${v.label}</span>`;
      item.onclick = () => switchView(key);
      section.appendChild(item);
    });

    sidebar.appendChild(section);

    // Lines section
    const linesSection = document.createElement('div');
    linesSection.className = 'sidebar-section';
    linesSection.innerHTML = '<div class="sidebar-header">Assembly Lines</div>';
    AutoSeq.state.lines.forEach(line => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      const pending = AutoSeq.state.sequences.filter(s => s.lineId === line.id && s.status === 'pending').length;
      item.innerHTML = `<span class="icon">🏭</span><span>${line.name}</span><span class="badge">${pending}</span>`;
      item.onclick = () => {
        AutoSeq.state.currentLine = line;
        switchView('rack-loading');
      };
      linesSection.appendChild(item);
    });
    sidebar.appendChild(linesSection);

    // Quick actions
    const actionsSection = document.createElement('div');
    actionsSection.className = 'sidebar-section';
    actionsSection.innerHTML = '<div class="sidebar-header">Quick Actions</div>';

    const actions = [
      { icon: '➕', label: 'New Rack', action: () => { switchView('rack-loading'); showNewRackModal(); } },
      { icon: '🔧', label: 'New Kit', action: () => { switchView('kitting'); showNewKitModal(); } },
      { icon: '📤', label: 'Export SAP', action: () => exportSAP() },
      { icon: '📄', label: 'Export CGM', action: () => exportCGM() },
    ];

    actions.forEach(a => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      item.innerHTML = `<span class="icon">${a.icon}</span><span>${a.label}</span>`;
      item.onclick = a.action;
      actionsSection.appendChild(item);
    });
    sidebar.appendChild(actionsSection);
  }

  function buildTopbar() {
    const live = document.getElementById('live-indicator');
    if (live) {
      const dot = live.querySelector('.live-dot');
      const text = live.querySelector('.live-text');
      dot.className = 'live-dot' + (AutoSeq.state.msqm.connected ? ' connected' : '');
      text.textContent = AutoSeq.state.msqm.connected ? 'MSQM Live' : 'MSQM Offline';
    }
  }

  let statusIntervalId = null;
  function buildStatusBar() {
    const sb = document.getElementById('statusbar');
    if (!sb) return;
    sb.innerHTML = `
      <div class="sb-item"><div class="sb-dot" id="sb-dot-msqm"></div><span id="sb-msqm">MSQM: ${AutoSeq.state.msqm.connected ? 'Connected' : 'Disconnected'}</span></div>
      <div class="sb-item">📋 Seq: <span id="sb-seq">0</span></div>
      <div class="sb-item">📦 Racks: <span id="sb-racks">0</span></div>
      <div class="sb-item">🔧 Kits: <span id="sb-kits">0</span></div>
      <div class="sb-item">🔍 Scans: <span id="sb-scans">0</span></div>
      <div class="sb-item sb-right"><span id="sb-time">--:--:--</span></div>
    `;
    updateStatusBar();
    if (statusIntervalId) clearInterval(statusIntervalId);
    statusIntervalId = setInterval(updateStatusBar, 1000);
  }

  function updateStatusBar() {
    const stats = AutoSeq.getStats();
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('sb-msqm', 'MSQM: ' + (stats.msqmConnected ? 'Connected' : 'Disconnected'));
    const dot = document.getElementById('sb-dot-msqm');
    if (dot) dot.className = 'sb-dot' + (stats.msqmConnected ? '' : ' error');
    setText('sb-seq', stats.totalSequences);
    setText('sb-racks', stats.totalRacks);
    setText('sb-kits', stats.totalKits);
    setText('sb-scans', stats.totalScans);
    setText('sb-time', new Date().toLocaleTimeString());
  }

  function switchView(viewKey) {
    AutoSeq.state.activeView = viewKey;
    AutoSeq.state.activeTab = viewKey;

    // Close mobile sidebar on navigation
    closeMobileSidebar();

    // Update sidebar
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById(`nav-${viewKey}`);
    if (navEl) navEl.classList.add('active');

    // Update tab bar
    buildTabBar();

    // Render content
    const view = views[viewKey];
    const body = document.getElementById('content-body');
    if (view) {
      body.innerHTML = view.render();
      if (viewKey === 'rack-loading' || viewKey === 'kitting' || viewKey === 'sequence') {
        attachScannerBar();
      }
      if (viewKey === 'msqm') {
        renderMSQMLog();
      }
    }
    buildStatusBar();
  }

  function buildTabBar() {
    const tabBar = document.getElementById('content-tabs');
    if (!tabBar) return;
    tabBar.innerHTML = '';
    Object.entries(views).forEach(([key, v]) => {
      const tab = document.createElement('div');
      tab.className = 'content-tab' + (key === AutoSeq.state.activeTab ? ' active' : '');
      tab.innerHTML = `${v.icon} ${v.label}`;
      tab.onclick = () => switchView(key);
      tabBar.appendChild(tab);
    });
  }

  // ── Scanner Bar ────────────────────────────────────────────
  function attachScannerBar() {
    // Remove any existing scanner bar first (may be stale after view re-render)
    const existing = document.getElementById('scanner-bar');
    if (existing) existing.remove();
    const existingHist = document.getElementById('scan-history');
    if (existingHist) existingHist.remove();

    const body = document.getElementById('content-body');
    if (!body) return;
    const bar = document.createElement('div');
    bar.className = 'scanner-bar';
    bar.id = 'scanner-bar';
    bar.innerHTML = `
      <span style="font-size:18px">📡</span>
      <input type="text" class="scanner-input" id="scanner-input" placeholder="Scan barcode or type part number + Enter..." autocomplete="off" autofocus>
      <span class="scanner-status" id="scanner-status">Ready</span>
    `;
    body.insertBefore(bar, body.firstChild);

    const input = document.getElementById('scanner-input');
    if (input) input.focus();

    // Add scan history container
    const hist = document.createElement('div');
    hist.className = 'scan-history';
    hist.id = 'scan-history';
    hist.innerHTML = '<div style="color:var(--text-muted);padding:4px">Scan history will appear here...</div>';
    body.insertBefore(hist, bar.nextSibling);
  }

  function appendScanEntry(entry) {
    const hist = document.getElementById('scan-history');
    if (!hist) return;

    if (hist.children.length === 1 && hist.children[0].textContent.includes('Scan history will appear')) {
      hist.innerHTML = '';
    }

    const div = document.createElement('div');
    div.className = 'scan-entry';
    const timeStr = entry.time ? entry.time.toLocaleTimeString() : '--';
    div.innerHTML = `
      <span class="time">${timeStr}</span>
      <span class="code">${entry.code}</span>
      <span class="result ${entry.result}">${entry.result === 'ok' ? '✓' : entry.result === 'err' ? '✗' : '...'}</span>
      <span class="detail">${entry.detail}</span>
    `;
    hist.insertBefore(div, hist.firstChild);

    // Flash scanner bar
    const bar = document.getElementById('scanner-bar');
    if (bar) {
      bar.className = 'scanner-bar ' + (entry.result === 'ok' ? 'success-flash' : entry.result === 'err' ? 'error-flash' : '');
      setTimeout(() => { bar.className = 'scanner-bar'; }, 300);
    }

    const status = document.getElementById('scanner-status');
    if (status) status.textContent = entry.result === 'ok' ? '✓ Validated' : entry.result === 'err' ? '✗ Error' : '...';
  }

  // ── Dashboard View ─────────────────────────────────────────
  function renderDashboard() {
    const stats = AutoSeq.getStats();
    const cards = [
      { label: 'Active Sequences', value: stats.totalSequences, sub: `${stats.pending} pending, ${stats.loaded} loaded`, color: 'var(--purple)' },
      { label: 'Racks', value: stats.totalRacks, sub: `${stats.activeRacks} active, ${stats.completeRacks} complete`, color: 'var(--emerald)' },
      { label: 'Rack Errors', value: stats.rackErrors, sub: 'Poka-yoke violations', color: stats.rackErrors > 0 ? 'var(--red)' : 'var(--emerald)' },
      { label: 'Kits', value: stats.totalKits, sub: `${stats.completeKits} complete`, color: 'var(--blue)' },
      { label: 'Total Scans', value: stats.totalScans, sub: `${stats.okScans} OK, ${stats.errScans} errors`, color: 'var(--cyan)' },
      { label: 'Assembly Lines', value: stats.lines, sub: `${stats.opCodes} Op Codes configured`, color: 'var(--orange)' },
    ];

    let html = '<div class="dashboard-grid">';
    cards.forEach(c => {
      html += `<div class="stat-card" style="--accent-color:${c.color}">
        <div class="stat-label">${c.label}</div>
        <div class="stat-value">${c.value}</div>
        <div class="stat-sub">${c.sub}</div>
      </div>`;
    });
    html += '</div>';

    // Recent sequences
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📋</span> Recent OEM Sequences (Live Feed)</div><div class="panel-body">';
    if (AutoSeq.state.sequences.length === 0) {
      html += '<p class="text-muted text-center" style="padding:20px">Waiting for MSQM broadcast pulses...</p>';
    } else {
      html += '<table class="data-table"><thead><tr><th>Seq #</th><th>VIN</th><th>Line</th><th>OEM</th><th>Part</th><th>Description</th><th>Status</th></tr></thead><tbody>';
      AutoSeq.state.sequences.slice(-15).reverse().forEach(seq => {
        html += `<tr>
          <td>${seq.id}</td>
          <td class="font-mono">${seq.vin}</td>
          <td>${seq.lineName}</td>
          <td>${seq.oem}</td>
          <td class="font-mono">${seq.partNumber}</td>
          <td>${seq.description}</td>
          <td><span class="status-badge status-${seq.status}">${seq.status}</span></td>
        </tr>`;
      });
      html += '</tbody></table>';
    }
    html += '</div></div>';

    // Recent scan log
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🔍</span> Recent Scans</div><div class="panel-body">';
    if (AutoSeq.state.scanLog.length === 0) {
      html += '<p class="text-muted text-center" style="padding:20px">No scans yet. Use the scanner bar in Rack Loading or Kitting views.</p>';
    } else {
      html += '<div class="scan-history" style="max-height:200px">';
      AutoSeq.state.scanLog.slice(0, 20).forEach(scan => {
        const timeStr = scan.time ? scan.time.toLocaleTimeString() : '--';
        html += `<div class="scan-entry">
          <span class="time">${timeStr}</span>
          <span class="code">${scan.code}</span>
          <span class="result ${scan.result}">${scan.result === 'ok' ? '✓' : '✗'}</span>
          <span class="detail">${scan.detail}</span>
        </div>`;
      });
      html += '</div>';
    }
    html += '</div></div>';

    // MSQM status mini
    html += `<div class="panel"><div class="panel-header"><span class="panel-icon">📡</span> MSQM Stream Status</div><div class="panel-body">
      <div class="flex gap-4">
        <div><strong>Status:</strong> <span class="${stats.msqmConnected ? 'text-emerald' : 'text-red'}">${stats.msqmConnected ? '● Live' : '● Offline'}</span></div>
        <div><strong>Mode:</strong> ${AutoSeq.state.msqm.mode}</div>
        <div><strong>Pulse Rate:</strong> ${AutoSeq.state.msqm.pulseRate / 1000}s</div>
        <div><strong>Sequences Generated:</strong> ${AutoSeq.state.msqm.sequenceCounter - 1}</div>
      </div>
    </div></div>`;

    // Credits
    html += '<div class="panel" style="border-color:var(--purple);border-width:1px">' +
      '<div class="panel-header" style="background:linear-gradient(90deg,rgba(142,68,173,0.1),rgba(46,204,113,0.1))">' +
        '<span class="panel-icon">🦉</span> NexGen Owl Mode — Copyright &amp; Acknowledgements' +
      '</div>' +
      '<div class="panel-body">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px">' +
          '<div>' +
            '<div style="font-size:14px;font-weight:700;background:linear-gradient(90deg,var(--purple-light),var(--emerald-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">OwlLogics v1.0 — NexGen Owl Mode</div>' +
            '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">Automotive Parts Sequencing &amp; Kitting System</div>' +
            '<div style="font-size:11px;color:var(--text-secondary);margin-top:8px">' +
              '<strong>Created by:</strong> OwlLogics 🦉<br>' +
              '<strong>Author:</strong> OwlLogics Contributors<br>' +
              '<strong>Email:</strong> <a href="mailto:contact@owllogics.app" style="color:var(--blue)">contact@owllogics.app</a><br>' +
              '<strong>Tag:</strong> <span class="font-mono text-purple">NexGen Owl Mode</span><br>' +
              '<strong>Build:</strong> OwlLogics autonomous build — zero human assistance<br>' +
              '<strong>Mode:</strong> Full auto-pilot, self-contained, embedded data<br>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px"><strong>Industry Partners:</strong></div>' +
            '<div style="font-size:11px;color:var(--text-secondary);line-height:1.7">' +
              '<span style="color:var(--emerald-light)">DP World</span> — Global logistics &amp; supply chain intelligence<br>' +
              '<span style="color:var(--cyan)">Syncreon</span> — Automotive sequencing &amp; contract logistics<br>' +
              '<span style="color:var(--purple-light)">DP World / Syncreon</span> — Axional webOS platform integration<br>' +
              '<span style="color:var(--orange)">Insequence</span> — SPD Pro sequencing pioneer (1996)<br>' +
              '<span style="color:var(--blue)">AIAG</span> — B-3.0 labeling &amp; EDI 866 standards<br>' +
              '<span style="color:var(--yellow)">LogisNext Americas</span> — Mitsubishi / Cat / Jungheinrich / UniCarriers<br>' +
              '<span style="color:var(--red)">Harley-Davidson</span> — SAP ERP + JIT manufacturing (York PA / KC MO)<br>' +
              '<span style="color:var(--emerald)">FCA/Stellantis</span> — CONVIS sequencing (SHAP / JNAP / BAP / WTAP / TNP)<br>' +
              '<span style="color:var(--blue)">Microsoft Azure</span> — IoT Hub + Digital Twins integration<br>' +
              '<span style="color:var(--purple-light)">SAP</span> — PM (BAPI) + IDoc (DELVRY07 / ORDERS05 / INVOIC02 / MATMAS05)' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:12px;padding:10px;background:var(--bg-tertiary);border-radius:var(--radius);border-left:3px solid var(--red)">' +
          '<div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:4px">© 2024 OwlLogics Contributors — All Rights Reserved — Patent Pending</div>' +
          '<div style="font-size:10px;color:var(--text-secondary);line-height:1.5">' +
            'OwlLogics NexGen Owl Mode, including all source code, visual designs, 3D visualizations, AI optimization engine, ' +
            'SAP PM integration, IDoc generators, multi-protocol adapters, forklift fleet management, shipyard terminal visuals, ' +
            'rail/pipeline logistics, CKD export system, barcode engines, and the OwlLogics brand are the intellectual property of ' +
            '<strong>OwlLogics Contributors</strong> (<a href="mailto:contact@owllogics.app" style="color:var(--blue)">contact@owllogics.app</a>). ' +
            'This software and its associated methodologies are <strong>Patent Pending</strong>. ' +
            'Unauthorized reproduction, distribution, or commercial use is strictly prohibited without written consent from the author.<br><br>' +
            '<strong>Filed:</strong> Patent Pending — Automotive sequencing, rack loading, poka-yoke, multi-protocol data streaming, ' +
            'SAP PM forklift integration, 3D rack/forklift visualization, and CKD logistics methodologies.<br>' +
            '<strong>Contact:</strong> contact@owllogics.app | <strong>Author:</strong> OwlLogics Contributors' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:10px;color:var(--text-muted);text-align:center">' +
          'OwlLogics NexGen Owl Mode — MIT License (copyright only) | Patent Rights Reserved | Built by OwlLogics Contributors 🦉<br>' +
          '<a href="https://www.paypal.com/paypalme/adcockp" target="_blank" style="display:inline-block;margin-top:6px;padding:6px 16px;background:#0070ba;color:white;text-decoration:none;border-radius:5px;font-size:11px;font-weight:600">💖 PayPal</a>' +
          '<a href="https://www.patreon.com/adcockp" target="_blank" style="display:inline-block;margin-top:6px;margin-left:4px;padding:6px 16px;background:#f96854;color:white;text-decoration:none;border-radius:5px;font-size:11px;font-weight:600">🎨 Patreon</a>' +
          '<a href="https://chime.com/mycode/adcockp" target="_blank" style="display:inline-block;margin-top:6px;margin-left:4px;padding:6px 16px;background:#27AE60;color:white;text-decoration:none;border-radius:5px;font-size:11px;font-weight:600">💚 Chime ($Paul-Adcock-1)</a><br>' +
          '<span style="font-size:9px;color:var(--text-muted)">Support OwlLogics development — keep it free and open source</span><br>' +
          'DP World &amp; Syncreon supply chain frameworks | FCA/Stellantis CONVIS | Harley-Davidson SAP | GM ILVS / Ford / Volkswagen / Honda | Azure IoT<br>' +
          'No human intervention required. All features self-contained. Embedded data, multi-protocol, production-ready.<br>' +
          '11 JS modules | 24 views | 7 barcode formats | 8 protocols | 5 IDoc types | SAP PM BAPI simulation | Azure IoT Hub | Local AI optimizer' +
        '</div>' +
      '</div>' +
    '</div>';

    return html;
  }

  // ── Sequence Manager View ──────────────────────────────────
  let seqSortBy = 'seqNum';
  let seqSortDir = false; // false=ascending, true=descending
  let seqFilters = { status: 'all', oem: 'all', lineId: 'all', commodity: 'all', search: '' };

  function renderSequence() {
    const allSeqs = AutoSeq.state.sequences;
    const filtered = AutoSeq.filterSequences(allSeqs, seqFilters);
    const sorted = AutoSeq.sortSequences(filtered, seqSortBy, seqSortDir);
    const oems = AutoSeq.getUniqueOEMs();
    const lines = AutoSeq.getUniqueLines();
    const commodities = AutoSeq.getUniqueCommodities();
    const summary = AutoSeq.getSequenceSummary();

    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📋</span> OEM Sequence Demand<div class="panel-actions">';
    html += `<span class="text-sm text-muted" style="margin-right:8px">${filtered.length} of ${allSeqs.length} sequences</span>`;
    html += '</div></div><div class="panel-body">';

    if (allSeqs.length === 0) {
      html += '<p class="text-muted text-center" style="padding:40px">No sequences received. MSQM stream will generate OEM demand broadcasts automatically.<br><br><button class="btn btn-primary" onclick="AutoSeq.msqmStart()">▶ Start MSQM Stream</button></p>';
      html += '</div></div>';
      return html;
    }

    // Summary cards by OEM
    if (summary.length > 0) {
      html += '<div class="dashboard-grid" style="margin-bottom:14px">';
      summary.forEach(s => {
        const color = s.oem.includes('FCA') ? 'var(--purple)' : s.oem.includes('GM') ? 'var(--blue)' : s.oem.includes('Ford') ? 'var(--cyan)' : 'var(--emerald)';
        html += `<div class="stat-card" style="--accent-color:${color};padding:12px">
          <div class="stat-label">${AutoSeq.sanitize(s.oem)}</div>
          <div class="stat-value" style="font-size:20px">${s.total}</div>
          <div class="stat-sub">${s.pending} pending · ${s.loaded} loaded · ${s.complete} complete</div>
        </div>`;
      });
      html += '</div>';
    }

    // Filter toolbar
    html += '<div class="crud-toolbar" style="flex-wrap:wrap">';
    html += '<input type="text" class="crud-search" id="seq-search" placeholder="Search VIN, part, description..." value="' + AutoSeq.sanitize(seqFilters.search) + '" oninput="AutoSeqUI.onSeqSearch(this.value)">';
    html += '<select class="crud-search" style="max-width:140px" onchange="AutoSeqUI.onSeqFilter(\'status\', this.value)">';
    html += '<option value="all">All Status</option>';
    ['pending', 'loaded', 'complete'].forEach(s => {
      html += `<option value="${s}" ${seqFilters.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`;
    });
    html += '</select>';
    html += '<select class="crud-search" style="max-width:160px" onchange="AutoSeqUI.onSeqFilter(\'oem\', this.value)">';
    html += '<option value="all">All OEMs</option>';
    oems.forEach(o => { html += `<option value="${AutoSeq.sanitize(o)}" ${seqFilters.oem === o ? 'selected' : ''}>${AutoSeq.sanitize(o)}</option>`; });
    html += '</select>';
    html += '<select class="crud-search" style="max-width:160px" onchange="AutoSeqUI.onSeqFilter(\'lineId\', this.value)">';
    html += '<option value="all">All Lines</option>';
    lines.forEach(l => { html += `<option value="${AutoSeq.sanitize(l)}" ${seqFilters.lineId === l ? 'selected' : ''}>${AutoSeq.sanitize(l)}</option>`; });
    html += '</select>';
    html += '<select class="crud-search" style="max-width:160px" onchange="AutoSeqUI.onSeqFilter(\'commodity\', this.value)">';
    html += '<option value="all">All Commodities</option>';
    commodities.forEach(c => { html += `<option value="${AutoSeq.sanitize(c)}" ${seqFilters.commodity === c ? 'selected' : ''}>${AutoSeq.sanitize(c)}</option>`; });
    html += '</select>';
    html += '<select class="crud-search" style="max-width:140px" onchange="AutoSeqUI.onSeqSort(this.value)">';
    const sortOptions = [
      ['seqNum', 'Sequence #'], ['date', 'Date Received'], ['vin', 'VIN'],
      ['oem', 'OEM'], ['line', 'Line'], ['part', 'Part Number'],
      ['commodity', 'Commodity'], ['description', 'Description'], ['status', 'Status']
    ];
    sortOptions.forEach(([val, label]) => {
      html += `<option value="${val}" ${seqSortBy === val ? 'selected' : ''}>Sort: ${label}</option>`;
    });
    html += '</select>';
    html += `<button class="btn btn-sm" onclick="AutoSeqUI.toggleSeqSortDir()" title="Toggle sort direction">${seqSortDir ? '↓ Desc' : '↑ Asc'}</button>`;
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.resetSeqFilters()">↻ Reset</button>';
    html += '</div>';

    // Table with sortable headers
    html += '<table class="data-table" id="seq-table"><thead><tr>';
    const headers = [
      ['seqNum', 'Seq #'], ['seqNum', 'Seq ID'], ['vin', 'VIN'], ['line', 'Line'],
      ['oem', 'OEM'], ['part', 'Part Number'], ['part', 'Customer PN'],
      ['description', 'Description'], ['commodity', 'Commodity'], ['date', 'Rack'], ['status', 'Status']
    ];
    headers.forEach(([sort, label]) => {
      const arrow = seqSortBy === sort ? (seqSortDir ? ' ↓' : ' ↑') : '';
      html += `<th onclick="AutoSeqUI.onSeqSort('${sort}')" style="cursor:pointer">${label}${arrow}</th>`;
    });
    html += '</tr></thead><tbody>';

    sorted.forEach(seq => {
      const safeId = AutoSeq.sanitize(seq.id);
      html += `<tr id="seq-row-${safeId}" onclick="AutoSeqUI.highlightSequence('${safeId}')" style="cursor:pointer">
        <td>${AutoSeq.sanitize(seq.id)}</td>
        <td>${seq.sequenceNumber}</td>
        <td class="font-mono">${AutoSeq.sanitize(seq.vin)}</td>
        <td>${AutoSeq.sanitize(seq.lineName || seq.lineId)}</td>
        <td>${AutoSeq.sanitize(seq.oem)}</td>
        <td class="font-mono">${AutoSeq.sanitize(seq.partNumber)}</td>
        <td class="font-mono">${AutoSeq.sanitize(seq.customerPartNumber)}</td>
        <td>${AutoSeq.sanitize(seq.description)}</td>
        <td>${AutoSeq.sanitize(seq.commodity)}</td>
        <td>${AutoSeq.sanitize(seq.rackId) || '—'}</td>
        <td><span class="status-badge status-${AutoSeq.sanitize(seq.status)}">${AutoSeq.sanitize(seq.status)}</span></td>
      </tr>`;
    });
    html += '</tbody></table>';

    html += '</div></div>';
    return html;
  }

  function onSeqSearch(value) {
    seqFilters.search = value;
    rerenderSequenceTable();
  }

  function onSeqFilter(key, value) {
    seqFilters[key] = value;
    rerenderSequenceTable();
  }

  function onSeqSort(sortBy) {
    if (seqSortBy === sortBy) {
      seqSortDir = !seqSortDir;
    } else {
      seqSortBy = sortBy;
      seqSortDir = false;
    }
    rerenderSequenceTable();
  }

  function toggleSeqSortDir() {
    seqSortDir = !seqSortDir;
    rerenderSequenceTable();
  }

  function resetSeqFilters() {
    seqSortBy = 'seqNum';
    seqSortDir = false;
    seqFilters = { status: 'all', oem: 'all', lineId: 'all', commodity: 'all', search: '' };
    switchView('sequence');
  }

  function rerenderSequenceTable() {
    switchView('sequence');
  }

  function highlightSequence(seqId) {
    document.querySelectorAll('#seq-table tr').forEach(tr => tr.classList.remove('selected'));
    const row = document.getElementById('seq-row-' + seqId);
    if (row) {
      row.classList.add('selected');
      row.scrollIntoView({ block: 'nearest' });
    }
  }

  // ── Rack Loading View ──────────────────────────────────────
  let rack3dView = false;

  function renderRackLoading() {
    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📦</span> Rack Loading & Validation<div class="panel-actions">';
    html += '<button class="btn btn-primary btn-sm" onclick="AutoSeqUI.showNewRackModal()">➕ New Rack</button>';
    html += '</div></div><div class="panel-body">';

    if (!AutoSeq.state.currentRack) {
      html += '<p class="text-muted text-center" style="padding:40px">No rack selected. Click "New Rack" to begin loading.<br>';
      html += '<br>Select a line from the sidebar to start a rack for that line.</p>';
      html += '</div></div>';

      // Show existing racks
      if (AutoSeq.state.racks.length > 0) {
        html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📦</span> Active Racks</div><div class="panel-body">';
        html += '<table class="data-table"><thead><tr><th>Rack ID</th><th>Line</th><th>Type</th><th>Pattern</th><th>Progress</th><th>Loaded</th><th>Errors</th><th>Status</th><th>Action</th></tr></thead><tbody>';
        AutoSeq.state.racks.forEach(rack => {
          const pct = Math.round((rack.loadedCount / rack.slotCount) * 100);
          html += `<tr>
            <td>${rack.id}</td>
            <td>${rack.lineName}</td>
            <td>${rack.rackTypeName}</td>
            <td><span class="status-badge ${rack.pattern === 'forward' ? 'status-active' : 'status-pending'}">${rack.pattern}</span></td>
            <td><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div> ${pct}%</td>
            <td>${rack.loadedCount}/${rack.slotCount}</td>
            <td class="${rack.errors > 0 ? 'text-red' : ''}">${rack.errors}</td>
            <td><span class="status-badge status-${rack.status}">${rack.status}</span></td>
            <td><button class="btn btn-sm" onclick="AutoSeqUI.selectRack('${rack.id}')">Open</button></td>
          </tr>`;
        });
        html += '</tbody></table>';
        html += '</div></div>';
      }
      return html;
    }

    const rack = AutoSeq.state.currentRack;
    const pct = Math.round((rack.loadedCount / rack.slotCount) * 100);

    html += `<div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <div>
          <div class="text-sm text-muted">Rack ID</div>
          <div class="font-mono font-bold text-purple">${rack.id}</div>
        </div>
        <div>
          <div class="text-sm text-muted">Line</div>
          <div>${rack.lineName}</div>
        </div>
        <div>
          <div class="text-sm text-muted">Type</div>
          <div>${rack.rackTypeName}</div>
        </div>
        <div>
          <div class="text-sm text-muted">Pattern</div>
          <div><span class="status-badge ${rack.pattern === 'forward' ? 'status-active' : 'status-pending'}">${rack.pattern.toUpperCase()}</span></div>
        </div>
      </div>
      <div>
        <div class="text-sm text-muted">Progress</div>
        <div class="flex items-center gap-2"><div class="progress-bar" style="width:200px"><div class="progress-fill" style="width:${pct}%"></div></div> ${rack.loadedCount}/${rack.slotCount} (${pct}%)</div>
      </div>
    </div>`;

    // Sequencing & delivery config summary (from commodity master)
    if (rack.dockDoor || rack.deliveryRoute || rack.stagingLane || rack.lineSidePresentation) {
      html += `<div style="background:var(--bg-tertiary);border-radius:var(--radius);padding:12px;margin-bottom:10px;border-left:3px solid var(--emerald)">
        <div style="font-size:10px;font-weight:600;color:var(--emerald-light);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">🚚 Delivery & Sequencing Config</div>
        <div class="flex gap-4" style="flex-wrap:wrap;font-size:11px">
          ${rack.dockDoor ? '<div><strong>Dock:</strong> <span class="font-mono text-emerald">' + AutoSeq.sanitize(rack.dockDoor) + '</span></div>' : ''}
          ${rack.deliveryRoute ? '<div><strong>Route:</strong> <span class="font-mono">' + AutoSeq.sanitize(rack.deliveryRoute) + '</span></div>' : ''}
          ${rack.stagingLane ? '<div><strong>Staging:</strong> <span class="font-mono">' + AutoSeq.sanitize(rack.stagingLane) + '</span></div>' : ''}
          ${rack.lineSidePresentation ? '<div><strong>Line-Side:</strong> ' + AutoSeq.sanitize(rack.lineSidePresentation) + '</div>' : ''}
          ${rack.taktTime ? '<div><strong>Takt:</strong> <span class="font-mono">' + rack.taktTime + 's</span></div>' : ''}
          ${rack.oemPlant ? '<div><strong>OEM Plant:</strong> ' + AutoSeq.sanitize(rack.oemPlant) + '</div>' : ''}
          ${rack.deliveryWindow ? '<div><strong>Window:</strong> ' + AutoSeq.sanitize(rack.deliveryWindow) + '</div>' : ''}
          ${rack.loadPattern ? '<div><strong>Load:</strong> ' + AutoSeq.sanitize(rack.loadPattern) + ' → Unload: ' + AutoSeq.sanitize(rack.unloadPattern || rack.loadPattern) + '</div>' : ''}
        </div>
      </div>`;
    }

    // View toggle (2D / 3D)
    html += '<div class="rack3d-controls">';
    html += '<button class="btn btn-sm ' + (rack3dView ? '' : 'btn-primary') + '" onclick="AutoSeqUI.setRackView(false)">📋 2D Grid View</button>';
    html += '<button class="btn btn-sm ' + (rack3dView ? 'btn-primary' : '') + '" onclick="AutoSeqUI.setRackView(true)">📦 3D Rack View</button>';
    html += '</div>';

    if (rack3dView) {
      // 3D rack visualizer
      html += '<div class="rack3d-scene">';
      html += '<div class="rack3d-floor"></div>';
      html += '<div class="rack3d-container" id="rack3d-container">';
      html += '<div class="rack3d-frame">';
      html += '<div class="rack3d-post tl"></div><div class="rack3d-post tr"></div><div class="rack3d-post bl"></div><div class="rack3d-post br"></div>';

      // Build rows of 3D slot boxes
      for (var row = 0; row < rack.gridRows; row++) {
        html += '<div class="rack3d-row">';
        for (var col = 0; col < rack.gridCols; col++) {
          var idx = row * rack.gridCols + col;
          if (idx >= rack.slots.length) break;
          var slot = rack.slots[idx];
          var scls = 'rack3d-slot';
          if (slot.status === 'loaded') scls += ' loaded';
          else if (slot.status === 'error') scls += ' error';
          else if (slot.status === 'empty') scls += ' empty';

          var nextEmpty = rack.slots.findIndex(function(s) { return s.status === 'empty'; });
          if (idx === nextEmpty && slot.expectedPart) scls += ' next-expected';

          html += '<div class="' + scls + '" onclick="AutoSeqUI.showSlotInfo(' + idx + ')">';
          html += '<div class="rack3d-slot-box">';
          html += '<div class="rack3d-face back"></div>';
          html += '<div class="rack3d-face top"></div>';
          html += '<div class="rack3d-face bottom"></div>';
          html += '<div class="rack3d-face left"></div>';
          html += '<div class="rack3d-face right"></div>';
          html += '<div class="rack3d-face front">';
          html += '<div class="rack3d-slot-num">S' + slot.slotNumber + '</div>';
          if (slot.status === 'loaded') {
            html += '<div class="rack3d-slot-part">' + AutoSeq.sanitize(slot.scannedPart || '') + '</div>';
            html += '<div class="rack3d-slot-status">✓</div>';
            html += '<div class="rack3d-check">✓</div>';
          } else if (slot.status === 'error') {
            html += '<div class="rack3d-slot-part" style="color:var(--red)">' + AutoSeq.sanitize(slot.scannedPart || '') + '</div>';
            html += '<div class="rack3d-slot-status" style="color:var(--red)">✗</div>';
          } else if (slot.expectedPart) {
            html += '<div class="rack3d-slot-part" style="color:var(--emerald-light)">' + AutoSeq.sanitize(slot.expectedPart.substring(0, 12)) + '</div>';
            html += '<div class="rack3d-slot-status" style="color:var(--emerald)">scan</div>';
          } else {
            html += '<div class="rack3d-slot-status">—</div>';
          }
          html += '</div>'; // front face
          html += '</div>'; // slot-box
          html += '</div>'; // slot
        }
        html += '</div>'; // row
      }

      html += '</div>'; // frame
      html += '</div>'; // container

      // Rotation controls
      html += '<div class="rack3d-controls" style="margin-top:12px">';
      html += '<button class="btn btn-sm" onclick="AutoSeqUI.rack3dRotate(\'left\')">⟲ Rotate Left</button>';
      html += '<button class="btn btn-sm" onclick="AutoSeqUI.rack3dRotate(\'front\')">⬛ Front View</button>';
      html += '<button class="btn btn-sm" onclick="AutoSeqUI.rack3dRotate(\'right\')">⟳ Rotate Right</button>';
      html += '</div>';

      // Legend
      html += '<div class="rack3d-legend">';
      html += '<div class="rack3d-legend-item"><div class="rack3d-legend-swatch loaded"></div> Loaded</div>';
      html += '<div class="rack3d-legend-item"><div class="rack3d-legend-swatch next"></div> Next Expected</div>';
      html += '<div class="rack3d-legend-item"><div class="rack3d-legend-swatch empty"></div> Empty</div>';
      html += '<div class="rack3d-legend-item"><div class="rack3d-legend-swatch error"></div> Error</div>';
      html += '</div>';

      html += '<div class="rack3d-label">' + AutoSeq.sanitize(rack.rackTypeName) + ' — ' + rack.loadedCount + '/' + rack.slotCount + ' slots loaded — ' + rack.pattern.toUpperCase() + ' pattern</div>';
      html += '</div>'; // scene
    } else {
      // 2D rack visual grid (original)
      html += '<div class="rack-visual" style="grid-template-columns:repeat(' + rack.gridCols + ',1fr)" id="rack-grid">';
      rack.slots.forEach(function(slot, idx) {
        var cls = 'rack-slot';
        if (slot.status === 'loaded') cls += ' loaded';
        else if (slot.status === 'error') cls += ' error';
        else if (slot.status === 'empty') cls += ' empty';

        var nextEmpty = rack.slots.findIndex(function(s) { return s.status === 'empty'; });
        if (idx === nextEmpty && slot.expectedPart) cls += ' next-expected';

        html += '<div class="' + cls + '" id="slot-' + idx + '" onclick="AutoSeqUI.showSlotInfo(' + idx + ')">';
        html += '<div class="slot-num">Slot ' + slot.slotNumber + '</div>';
        if (slot.status === 'loaded') {
          html += '<div class="slot-part">' + AutoSeq.sanitize(slot.scannedPart || '') + '</div>';
          html += '<div class="slot-seq">✓ Loaded</div>';
          html += '<div class="slot-check">✓</div>';
        } else if (slot.status === 'error') {
          html += '<div class="slot-part text-red">' + AutoSeq.sanitize(slot.scannedPart || '') + '</div>';
          html += '<div class="slot-seq">✗ Wrong part</div>';
        } else if (slot.expectedPart) {
          html += '<div class="slot-part text-emerald">Expect: ' + AutoSeq.sanitize(slot.expectedPart) + '</div>';
          html += '<div class="slot-seq">Scan to load</div>';
        } else {
          html += '<div class="slot-seq">Empty</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    // Rack actions
    html += `<div class="flex gap-2 mt-4">
      <button class="btn btn-emerald" onclick="AutoSeqUI.printRackLabel()">🏷️ Print Rack Label</button>
      <button class="btn" onclick="AutoSeqUI.completeRack()">✓ Mark Complete & Stage</button>
      <button class="btn btn-danger" onclick="AutoSeqUI.clearRackErrors()">Clear Errors</button>
      <button class="btn" onclick="AutoSeqUI.closeRack()">← Back to Rack List</button>
    </div>`;

    // Instructions
    html += `<div class="mt-4 text-sm text-muted">
      <strong>Instructions:</strong> Scan the expected part barcode for the highlighted slot (green border).
      The system validates each scan (poka-yoke). Wrong parts trigger an error alert and audio alarm.
      ${rack.pattern === 'reverse' ? 'This rack uses <strong>reverse loading</strong> — slots fill from last to first position.' : 'This rack uses <strong>forward loading</strong> — slots fill from first to last position.'}
    </div>`;

    html += '</div></div>';
    return html;
  }

  function refreshRackGrid() {
    if (AutoSeq.state.activeView !== 'rack-loading') return;
    switchView('rack-loading');
  }

  function showNewRackModal() {
    const lines = AutoSeq.state.lines;
    const rackTypes = AutoSeq.state.rackTypes;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'new-rack-modal';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">📦 Create New Rack<span class="modal-close" onclick="AutoSeqUI.closeModal()">✕</span></div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Assembly Line</label>
            <select id="modal-line-select">
              ${lines.map(l => `<option value="${l.id}">${l.name} — ${l.oem} (${l.commodity})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Rack Type</label>
            <select id="modal-rack-select">
              ${rackTypes.map(r => `<option value="${r.id}">${r.name} — ${r.slotCount} slots (${r.pattern})</option>`).join('')}
            </select>
          </div>
          <div class="text-sm text-muted mt-2">
            The rack will be initialized with empty slots. Expected parts will auto-populate from pending MSQM sequences for the selected line.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="AutoSeqUI.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="AutoSeqUI.createRackFromModal()">Create Rack</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Auto-select matching rack type for line
    const lineSel = document.getElementById('modal-line-select');
    const rackSel = document.getElementById('modal-rack-select');
    lineSel.onchange = () => {
      const line = lines.find(l => l.id === lineSel.value);
      if (line) rackSel.value = line.rackType;
    };
    lineSel.dispatchEvent(new Event('change'));
  }

  function createRackFromModal() {
    const lineId = document.getElementById('modal-line-select').value;
    const rackTypeId = document.getElementById('modal-rack-select').value;
    AutoSeq.createRack(lineId, rackTypeId);
    closeModal();
    switchView('rack-loading');
    AutoSeq.alert('success', 'Rack Created', `New rack initialized for ${AutoSeq.state.currentRack.lineName}`);
  }

  function selectRack(rackId) {
    const rack = AutoSeq.state.racks.find(r => r.id === rackId);
    if (rack) {
      AutoSeq.state.currentRack = rack;
      switchView('rack-loading');
    }
  }

  function closeRack() {
    AutoSeq.state.currentRack = null;
    switchView('rack-loading');
  }

  function completeRack() {
    const rack = AutoSeq.state.currentRack;
    if (!rack) return;
    if (rack.loadedCount < rack.slotCount) {
      AutoSeq.alert('warning', 'Rack Incomplete', `Rack has ${rack.slotCount - rack.loadedCount} empty slots. Are you sure?`);
    }
    rack.status = 'complete';
    // Update sequences
    AutoSeq.state.sequences.forEach(seq => {
      if (seq.rackId === rack.id) seq.status = 'complete';
    });
    AutoSeq.alert('success', 'Rack Complete', `Rack ${rack.id} marked complete and staged for outbound.`);
    refreshRackGrid();
  }

  function clearRackErrors() {
    const rack = AutoSeq.state.currentRack;
    if (!rack) return;
    rack.slots.forEach(s => { if (s.status === 'error') { s.status = 'empty'; s.scannedPart = null; } });
    rack.errors = 0;
    refreshRackGrid();
  }

  function showSlotInfo(idx) {
    var rack = AutoSeq.state.currentRack;
    if (!rack || !rack.slots[idx]) return;
    var slot = rack.slots[idx];
    AutoSeq.alert('info', 'Slot ' + slot.slotNumber,
      'Status: ' + slot.status + ' | Expected: ' + (slot.expectedPart || 'N/A') + ' | Scanned: ' + (slot.scannedPart || 'N/A'));
  }

  function setRackView(is3d) {
    rack3dView = is3d;
    switchView('rack-loading');
  }

  function rack3dRotate(dir) {
    var container = document.getElementById('rack3d-container');
    if (!container) return;
    if (dir === 'left') {
      container.className = 'rack3d-container rack3d-rotate';
    } else if (dir === 'right') {
      container.className = 'rack3d-container';
      container.style.transform = 'rotateX(15deg) rotateY(30deg)';
    } else {
      container.className = 'rack3d-container rack3d-front';
      container.style.transform = '';
    }
  }

  // ── Kitting View ───────────────────────────────────────────
  function renderKitting() {
    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">🔧</span> Kit Assembly<div class="panel-actions">';
    html += '<button class="btn btn-primary btn-sm" onclick="AutoSeqUI.showNewKitModal()">➕ New Kit</button>';
    html += '</div></div><div class="panel-body">';

    if (!AutoSeq.state.currentKit) {
      html += '<p class="text-muted text-center" style="padding:40px">No kit selected. Click "New Kit" to begin assembly.<br>';
      html += 'Kits group components for sub-assembly tasks (e.g., seat cushion kit, dashboard cluster kit).</p>';

      if (AutoSeq.state.kits.length > 0) {
        html += '<table class="data-table mt-4"><thead><tr><th>Kit ID</th><th>Part</th><th>Description</th><th>Components</th><th>Scanned</th><th>Status</th><th>Action</th></tr></thead><tbody>';
        AutoSeq.state.kits.forEach(kit => {
          const scanned = kit.components.filter(c => c.scanned).length;
          html += `<tr>
            <td>${kit.id}</td>
            <td class="font-mono">${kit.partNumber}</td>
            <td>${kit.description}</td>
            <td>${kit.components.length}</td>
            <td>${scanned}/${kit.components.length}</td>
            <td><span class="status-badge status-${kit.status}">${kit.status}</span></td>
            <td><button class="btn btn-sm" onclick="AutoSeqUI.selectKit('${kit.id}')">Open</button></td>
          </tr>`;
        });
        html += '</tbody></table>';
      }
      html += '</div></div>';
      return html;
    }

    const kit = AutoSeq.state.currentKit;
    const scanned = kit.components.filter(c => c.scanned).length;
    const pct = Math.round((scanned / kit.components.length) * 100);

    html += `<div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <div>
          <div class="text-sm text-muted">Kit ID</div>
          <div class="font-mono font-bold text-purple">${kit.id}</div>
        </div>
        <div>
          <div class="text-sm text-muted">Assembly</div>
          <div>${kit.description}</div>
        </div>
        <div>
          <div class="text-sm text-muted">Part Number</div>
          <div class="font-mono">${kit.partNumber}</div>
        </div>
      </div>
      <div>
        <div class="text-sm text-muted">Progress</div>
        <div class="flex items-center gap-2"><div class="progress-bar" style="width:200px"><div class="progress-fill" style="width:${pct}%"></div></div> ${scanned}/${kit.components.length} (${pct}%)</div>
      </div>
    </div>`;

    // Kit checklist
    html += '<div class="kit-checklist" id="kit-checklist">';
    kit.components.forEach((comp, idx) => {
      const cls = comp.scanned ? 'kit-item scanned' : 'kit-item pending';
      html += `<div class="${cls}" id="kit-comp-${idx}">
        <span class="kit-check">${comp.scanned ? '✅' : '⬜'}</span>
        <span class="kit-name">${comp.component}</span>
        <span class="kit-pn">${comp.partNumber}</span>
        <span class="kit-qty">Qty: ${comp.qty}</span>
      </div>`;
    });
    html += '</div>';

    html += `<div class="flex gap-2 mt-4">
      <button class="btn btn-emerald" onclick="AutoSeqUI.completeKit()">✓ Complete Kit</button>
      <button class="btn" onclick="AutoSeqUI.closeKit()">← Back to Kit List</button>
    </div>`;

    html += `<div class="mt-4 text-sm text-muted">
      <strong>Instructions:</strong> Scan each component's barcode to verify it belongs to this kit.
      All components must be scanned before the kit can be completed (poka-yoke).
    </div>`;

    html += '</div></div>';
    return html;
  }

  function showNewKitModal() {
    const kitParts = AutoSeq.state.parts.filter(p => p.kitComponents);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'new-kit-modal';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">🔧 Create New Kit<span class="modal-close" onclick="AutoSeqUI.closeModal()">✕</span></div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Kit Assembly</label>
            <select id="modal-kit-select">
              ${kitParts.map(p => `<option value="${p.partNumber}">${p.description} (${p.partNumber}) — ${p.kitComponents.length} components</option>`).join('')}
            </select>
          </div>
          <div class="text-sm text-muted mt-2">
            The kit will include all required components for the selected sub-assembly. Scan each component to verify.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="AutoSeqUI.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="AutoSeqUI.createKitFromModal()">Create Kit</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function createKitFromModal() {
    const partNumber = document.getElementById('modal-kit-select').value;
    AutoSeq.createKit(partNumber);
    closeModal();
    switchView('kitting');
    AutoSeq.alert('success', 'Kit Created', `Kit ${AutoSeq.state.currentKit.id} ready for component scanning`);
  }

  function selectKit(kitId) {
    const kit = AutoSeq.state.kits.find(k => k.id === kitId);
    if (kit) {
      AutoSeq.state.currentKit = kit;
      switchView('kitting');
    }
  }

  function closeKit() {
    AutoSeq.state.currentKit = null;
    switchView('kitting');
  }

  function refreshKitChecklist() {
    if (AutoSeq.state.activeView !== 'kitting') return;
    switchView('kitting');
  }

  function completeKit() {
    const kit = AutoSeq.state.currentKit;
    if (!kit) return;
    const unscanned = kit.components.filter(c => !c.scanned).length;
    if (unscanned > 0) {
      AutoSeq.alert('error', 'Kit Incomplete', `${unscanned} components still need to be scanned.`);
      return;
    }
    kit.status = 'complete';
    AutoSeq.alert('success', 'Kit Complete', `Kit ${kit.id} verified and ready for assembly.`);
    refreshKitChecklist();
  }

  // ── Op Codes / CGM View ────────────────────────────────────
  function renderOpCodes() {
    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">⚙️</span> Op Codes & CGM Configuration</div><div class="panel-body">';

    html += '<table class="data-table"><thead><tr><th>Op Code</th><th>Name</th><th>Description</th><th>Category</th><th>SAP Transaction</th><th>CGM Code</th></tr></thead><tbody>';
    AutoSeq.state.opCodes.forEach(op => {
      const catClass = {
        Inbound: 'status-pending', Labeling: 'status-active', 'Rack Loading': 'status-loaded',
        Kitting: 'status-complete', Validation: 'status-pending', Outbound: 'status-shipped'
      }[op.category] || 'status-active';
      html += `<tr>
        <td class="font-mono font-bold text-purple">${op.code}</td>
        <td>${op.name}</td>
        <td>${op.description}</td>
        <td><span class="status-badge ${catClass}">${op.category}</span></td>
        <td class="font-mono">${op.sapTransaction}</td>
        <td class="font-mono text-cyan">${op.cgmCode}</td>
      </tr>`;
    });
    html += '</tbody></table>';

    html += '</div></div>';

    // Rack types
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📦</span> Rack Type Configuration</div><div class="panel-body">';
    html += '<table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Slots</th><th>Pattern</th><th>Grid</th><th>Description</th></tr></thead><tbody>';
    AutoSeq.state.rackTypes.forEach(r => {
      html += `<tr>
        <td class="font-mono">${r.id}</td>
        <td>${r.name}</td>
        <td>${r.slotCount}</td>
        <td><span class="status-badge ${r.pattern === 'forward' ? 'status-active' : 'status-pending'}">${r.pattern}</span></td>
        <td>${r.gridRows}×${r.gridCols}</td>
        <td>${r.description}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    html += '</div></div>';

    // Assembly lines
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🏭</span> Assembly Line Configuration</div><div class="panel-body">';
    html += '<table class="data-table"><thead><tr><th>Line ID</th><th>Name</th><th>Commodity</th><th>Rack Type</th><th>OEM</th></tr></thead><tbody>';
    AutoSeq.state.lines.forEach(l => {
      html += `<tr>
        <td class="font-mono">${l.id}</td>
        <td>${l.name}</td>
        <td>${l.commodity}</td>
        <td class="font-mono">${l.rackType}</td>
        <td>${l.oem}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    html += '</div></div>';

    // Export section
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📤</span> SAP / CGM Export<div class="panel-actions"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.exportSAP()">Export SAP</button><button class="btn btn-emerald btn-sm" onclick="AutoSeqUI.exportCGM()">Export CGM XML</button></div></div><div class="panel-body">';
    html += '<div class="text-sm text-muted mb-2">Generate production data upload files for ERP/EDI integration:</div>';
    html += '<ul style="list-style:none;padding-left:0">';
    html += '<li class="mb-2">📄 <strong>SAP Export:</strong> IDoc-style flat file with sequence, rack, and scan data for SAP ERP (transactions MIGO, VL10C)</li>';
    html += '<li class="mb-2">📋 <strong>CGM XML:</strong> XML format with all sequence and rack data for Computer Graphics Metafile / MES integration</li>';
    html += '<li class="mb-2">📡 <strong>EDI 856 ASN:</strong> Outbound Advanced Shipping Notice transaction for OEM notification</li>';
    html += '</ul>';

    // Preview area
    html += '<div class="form-group mt-4"><label>Export Preview</label><textarea id="export-preview" style="height:200px;font-family:var(--font-mono);font-size:10px;resize:vertical" placeholder="Select an export format to preview..."></textarea></div>';
    html += `<div class="flex gap-2">
      <button class="btn btn-sm" onclick="AutoSeqUI.previewSAP()">Preview SAP</button>
      <button class="btn btn-sm" onclick="AutoSeqUI.previewCGM()">Preview CGM</button>
      <button class="btn btn-sm" onclick="AutoSeqUI.downloadSAP()">⬇ Download SAP</button>
      <button class="btn btn-sm" onclick="AutoSeqUI.downloadCGM()">⬇ Download CGM</button>
    </div>`;

    html += '</div></div>';
    return html;
  }

  function previewSAP() {
    const ta = document.getElementById('export-preview');
    if (ta) ta.value = AutoSeq.generateSAPExport();
  }

  function previewCGM() {
    const ta = document.getElementById('export-preview');
    if (ta) ta.value = AutoSeq.generateCGMXML();
  }

  function downloadSAP() {
    const data = AutoSeq.generateSAPExport();
    downloadFile(data, 'owllogics_sap_export.txt', 'text/plain');
    AutoSeq.alert('success', 'Export Complete', 'SAP flat file downloaded');
  }

  function downloadCGM() {
    const data = AutoSeq.generateCGMXML();
    downloadFile(data, 'owllogics_cgm_export.xml', 'application/xml');
    AutoSeq.alert('success', 'Export Complete', 'CGM XML file downloaded');
  }

  function exportSAP() { previewSAP(); downloadSAP(); }
  function exportCGM() { previewCGM(); downloadCGM(); }

  function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── MSQM Stream View ───────────────────────────────────────
  function renderMSQM() {
    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📡</span> MSQM Data Stream — Manufacturing Sequence Quality Management<div class="panel-actions">';
    html += `<button class="btn ${AutoSeq.state.msqm.running ? 'btn-danger' : 'btn-emerald'} btn-sm" onclick="AutoSeqUI.toggleMSQM()" id="msqm-toggle-btn">${AutoSeq.state.msqm.running ? '⏹ Stop' : '▶ Start'}</button>`;
    html += '</div></div><div class="panel-body">';

    // Config
    html += '<div class="msqm-config">';
    html += '<div class="form-group" style="min-width:150px"><label>Mode</label><select id="msqm-mode"><option value="simulation">Simulation</option><option value="live">Live (MSMQ)</option></select></div>';
    html += '<div class="form-group" style="min-width:120px"><label>Pulse Rate (ms)</label><input type="number" id="msqm-rate" value="' + AutoSeq.state.msqm.pulseRate + '" min="1000" max="60000" step="500"></div>';
    html += '<div class="form-group" style="min-width:120px"><label>OEM Source</label><select id="msqm-oem"><option value="all">All OEMs</option>';
    AutoSeq.state.lines.forEach(l => { html += `<option value="${l.oem}">${l.oem}</option>`; });
    html += '</select></div>';
    html += '<div class="form-group"><label>&nbsp;</label><button class="btn btn-primary" onclick="AutoSeqUI.applyMSQMConfig()">Apply</button></div>';
    html += '</div>';

    // Connection info
    html += `<div class="flex gap-4 mb-4 text-sm">
      <div><strong>Status:</strong> <span class="${AutoSeq.state.msqm.connected ? 'text-emerald' : 'text-red'}">${AutoSeq.state.msqm.connected ? '● Connected' : '● Disconnected'}</span></div>
      <div><strong>Sequences Generated:</strong> ${AutoSeq.state.msqm.sequenceCounter - 1}</div>
      <div><strong>Pulse Rate:</strong> ${AutoSeq.state.msqm.pulseRate / 1000}s</div>
    </div>`;

    // Console
    html += '<div class="msqm-console" id="msqm-console">';
    html += '</div>';

    html += `<div class="mt-4 text-sm text-muted">
      <strong>MSQM Data Stream Info:</strong><br>
      • <strong>Simulation mode</strong> generates synthetic OEM broadcast pulses mimicking EDI 866 transactions<br>
      • Each pulse simulates a vehicle passing a trigger point on the OEM assembly line<br>
      • Sequences are auto-created with VIN, part number, line assignment, and OEM demand<br>
      • <strong>Live mode</strong> would connect to MSQM/MSMQ message queues (simulated here for demonstration)<br>
      • Broadcast format follows AIAG EDI 866 (Production Sequence) standards
    </div>`;

    html += '</div></div>';
    return html;
  }

  function renderMSQMLog() {
    const console = document.getElementById('msqm-console');
    if (!console) return;
    console.innerHTML = '';
    AutoSeq.state.msqmLog.forEach(entry => appendMSQMEntry(entry));
  }

  function appendMSQMEntry(entry) {
    const console = document.getElementById('msqm-console');
    if (!console) return;

    const div = document.createElement('div');
    div.className = 'msqm-entry';
    const ts = entry.time ? entry.time.toLocaleTimeString() : '--:--:--';
    div.innerHTML = `<span class="ts">${ts}</span><span class="type ${entry.type}">${entry.tag}</span><span class="msg">${entry.msg}</span>`;
    console.insertBefore(div, console.firstChild);

    // Keep max 200
    while (console.children.length > 200) {
      console.removeChild(console.lastChild);
    }
  }

  function toggleMSQM() {
    if (AutoSeq.state.msqm.running) {
      AutoSeq.msqmStop();
    } else {
      AutoSeq.msqmStart();
    }
    // Update button
    const btn = document.getElementById('msqm-toggle-btn');
    if (btn) {
      btn.className = 'btn ' + (AutoSeq.state.msqm.running ? 'btn-danger' : 'btn-emerald') + ' btn-sm';
      btn.textContent = AutoSeq.state.msqm.running ? '⏹ Stop' : '▶ Start';
    }
    updateLiveIndicator();
  }

  function applyMSQMConfig() {
    const rate = parseInt(document.getElementById('msqm-rate').value);
    const mode = document.getElementById('msqm-mode').value;
    if (rate >= 1000) AutoSeq.state.msqm.pulseRate = rate;
    AutoSeq.state.msqm.mode = mode;

    if (AutoSeq.state.msqm.running) {
      AutoSeq.msqmStop();
      setTimeout(() => AutoSeq.msqmStart(), 100);
    }
    AutoSeq.alert('info', 'MSQM Config Updated', `Mode: ${mode}, Pulse rate: ${rate / 1000}s`);
    switchView('msqm');
  }

  function updateLiveIndicator() {
    buildTopbar();
  }

  // ── Protocol Settings View ─────────────────────────────────
  function renderProtocols() {
    const protocols = ProtocolAdapter.getProtocols();
    const status = ProtocolAdapter.getStatus();
    const activeMode = AutoSeq.state.msqm.mode;

    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">🔌</span> Protocol Adapters — Multi-Protocol Data Source Configuration<div class="panel-actions">';
    html += `<button class="btn ${AutoSeq.state.msqm.running ? 'btn-danger' : 'btn-emerald'} btn-sm" onclick="AutoSeqUI.toggleMSQM()" id="proto-toggle-btn">${AutoSeq.state.msqm.running ? '⏹ Disconnect' : '▶ Connect'}</button>`;
    html += '</div></div><div class="panel-body">';

    // Active connection status
    html += `<div style="background:var(--bg-tertiary);border-radius:var(--radius);padding:14px;margin-bottom:14px;border-left:3px solid ${status.connected ? 'var(--emerald)' : 'var(--red)'}">
      <div class="flex items-center justify-between">
        <div>
          <div style="font-size:12px;font-weight:600">${status.connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
          <div style="font-size:11px;color:var(--text-muted)">Active protocol: <strong>${protocols[activeMode] ? protocols[activeMode].name : activeMode}</strong></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted)">Sequences received: ${AutoSeq.state.msqm.sequenceCounter - 1}</div>
      </div>
    </div>`;

    // Protocol selector
    html += '<div class="form-group"><label>Active Protocol</label><select id="proto-select" onchange="AutoSeqUI.selectProtocol(this.value)">';
    Object.entries(protocols).forEach(([key, proto]) => {
      html += `<option value="${key}" ${key === activeMode ? 'selected' : ''}>${proto.icon} ${proto.name}${key === activeMode ? ' (active)' : ''}</option>`;
    });
    html += '</select></div>';

    // Protocol description
    const currentProto = protocols[activeMode] || {};
    html += `<div style="background:var(--bg-tertiary);border-radius:var(--radius);padding:10px;margin-bottom:14px">
      <div style="font-size:11px;color:var(--text-muted)">${AutoSeq.sanitize(currentProto.desc || '')}</div>
    </div>`;

    // Protocol-specific configuration fields
    html += '<div id="proto-config-fields">' + renderProtocolConfigFields(activeMode) + '</div>';

    // Connection buttons
    html += '<div class="flex gap-2 mt-4">';
    html += `<button class="btn btn-emerald" onclick="AutoSeqUI.connectProtocol()">🔌 Connect</button>`;
    html += `<button class="btn btn-danger" onclick="AutoSeqUI.disconnectProtocol()">⏹ Disconnect</button>`;
    html += `<button class="btn btn-sm" onclick="AutoSeqUI.testProtocol()">⚡ Test Connection</button>`;
    html += '</div>';

    // EDI Import section
    html += '<hr style="border-color:var(--border);margin:16px 0">';
    html += '<h3 class="mb-2" style="font-size:12px">📄 EDI Feed Import & Parser</h3>';
    html += '<div class="text-sm text-muted mb-2">Import OEM demand feeds. Auto-detects format: FCA CONVIS single-line, pipe-delimited, X12 EDI 866, CSV, tab-delimited. The parser acts as a server-side agent — parsing raw feed text and inserting parsed records into the sequence database.</div>';

    // Format examples
    html += '<div style="background:var(--bg-tertiary);border-radius:var(--radius);padding:10px;margin-bottom:10px;font-family:var(--font-mono);font-size:10px;line-height:1.5">';
    html += '<div style="color:var(--text-muted);margin-bottom:6px"><strong>Supported feed formats:</strong></div>';
    html += '<div style="color:var(--emerald-light)">FCA CONVIS: <code>CONVIS|1C6RR7TT5ES123456|004567|68298041AB|LINE-07|FCA/Stellantis|Granite Crystal|Front Fascia|SHAP|RAM-1500|CREW|3.6L|BIG_HORN</code></div>';
    html += '<div style="color:var(--blue)">FCA Asterisk: <code>*VIN*1C6RR7TT5ES123456*SEQ*004567*PRT*68298041AB*LIN*LINE-07*OEM*FCA*CLR*GRANITE</code></div>';
    html += '<div style="color:var(--purple-light)">Pipe-delimited: <code>SEQ|1|1HGCM82633A123456|LINE-01|5WK-8A350-AB|GM-19260412|Front Bumper|General Motors</code></div>';
    html += '<div style="color:var(--cyan)">CSV: <code>1C6RR7TT5ES123456,4567,68298041AB,LINE-07,FCA/Stellantis,Front Fascia</code></div>';
    html += '<div style="color:var(--orange)">X12 EDI 866: <code>ST*866*0001~LIN**VN*1C6RR7TT5ES123456~REF*SO*4567~SE*4*0001~</code></div>';
    html += '</div>';

    html += '<div class="flex gap-2 mb-2">';
    html += '<input type="file" id="edi-file-input" accept=".txt,.edi,.866,.csv,.dat" style="display:none" onchange="AutoSeqUI.importEDI(this)">';
    html += '<button class="btn btn-primary btn-sm" onclick="document.getElementById(\'edi-file-input\').click()">📁 Choose Feed File</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.importSampleEDI()">📋 FCA CONVIS Sample</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.importSamplePipe()">📋 Pipe-Delimited Sample</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.importSampleCSV()">📋 CSV Sample</button>';
    html += '</div>';
    html += '<textarea id="edi-text-input" placeholder="Paste raw EDI feed here (any format — auto-detected)...&#10;CONVIS|1C6RR7TT5ES123456|004567|68298041AB|LINE-07|FCA/Stellantis|Granite Crystal|Front Fascia|SHAP|RAM-1500|CREW|3.6L|BIG_HORN&#10;SEQ|1|1HGCM82633A123456|LINE-01|5WK-8A350-AB|GM-19260412|Front Bumper|General Motors" style="width:100%;height:120px;font-family:var(--font-mono);font-size:10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-primary);padding:8px;resize:vertical"></textarea>';
    html += '<div class="flex gap-2 mt-2">';
    html += '<button class="btn btn-emerald btn-sm" onclick="AutoSeqUI.importEDIText()">⬇ Parse & Import Feed</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.testParseFeed()">🔍 Test Parse (Preview Only)</button>';
    html += '</div>';
    html += '<div id="edi-parse-result" style="margin-top:8px"></div>';

    html += '</div></div>';

    // Protocol reference table
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📖</span> Protocol Reference</div><div class="panel-body">';
    html += '<table class="data-table"><thead><tr><th>Protocol</th><th>Description</th><th>Use Case</th></tr></thead><tbody>';
    const useCases = {
      simulation: 'Development, testing, demos — no external hardware',
      rest: 'OEM demand API, cloud MES integration, webhooks',
      websocket: 'Real-time SCADA push, MES live updates, factory IoT',
      mqtt: 'IoT sensors, factory floor equipment, smart manufacturing',
      edi: 'EDI 866 flat file import — legacy OEM demand format (AIAG standard, FCA CONVIS, GM ILVS)',
      opcua: 'PLC data, industrial sensors, machine integration',
      serial: 'Barcode scanners, legacy PLCs, RS232 equipment',
    };
    Object.entries(protocols).forEach(([key, proto]) => {
      html += `<tr>
        <td class="font-mono font-bold text-purple">${proto.icon} ${proto.name}</td>
        <td style="font-family:var(--font-sans);font-size:11px">${proto.desc}</td>
        <td style="font-family:var(--font-sans);font-size:11px;color:var(--text-secondary)">${useCases[key] || ''}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    html += '</div></div>';

    // Data persistence section
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">💾</span> Data Persistence<div class="panel-actions"><button class="btn btn-sm" onclick="AutoSeqUI.saveStateNow()">💾 Save Now</button><button class="btn btn-sm" onclick="AutoSeqUI.clearStateConfirm()">🗑️ Clear Data</button></div></div><div class="panel-body">';
    const lastSaved = AutoSeq.state.persistence.lastSaved;
    html += `<div class="flex gap-4 text-sm">
      <div><strong>Auto-save:</strong> ${AutoSeq.state.persistence.autoSave ? '✅ Enabled (every 30s)' : '❌ Disabled'}</div>
      <div><strong>Last saved:</strong> ${lastSaved ? lastSaved.toLocaleTimeString() : 'Never'}</div>
      <div><strong>Storage key:</strong> <code>${AutoSeq.state.persistence.key}</code></div>
    </div>`;
    html += `<div class="text-sm text-muted mt-2">State is saved to localStorage. Sequences, racks, kits, scan logs, and MSQM config persist across page refreshes.</div>`;
    html += '</div></div>';

    return html;
  }

  function renderProtocolConfigFields(protocol) {
    const cfg = ProtocolAdapter.getConfig(protocol) || {};
    let html = '';

    if (protocol === 'simulation') {
      html += '<div class="form-group"><label>Pulse Rate (ms)</label><input type="number" id="cfg-pulseRate" value="' + (cfg.pulseRate || 5000) + '" min="1000" max="60000" step="500"></div>';
    } else if (protocol === 'rest') {
      html += '<div class="form-group"><label>API Endpoint URL</label><input type="text" id="cfg-endpoint" value="' + AutoSeq.sanitize(cfg.endpoint || '') + '" style="font-family:var(--font-mono);font-size:11px"></div>';
      html += '<div class="form-row"><div class="form-group"><label>HTTP Method</label><select id="cfg-method"><option value="GET"' + (cfg.method === 'GET' ? ' selected' : '') + '>GET</option><option value="POST"' + (cfg.method === 'POST' ? ' selected' : '') + '>POST</option></select></div>';
      html += '<div class="form-group"><label>Poll Interval (ms)</label><input type="number" id="cfg-pollInterval" value="' + (cfg.pollInterval || 5000) + '" min="1000" step="500"></div></div>';
      html += '<div class="form-group"><label>API Key (Bearer token)</label><input type="password" id="cfg-apiKey" value="' + AutoSeq.sanitize(cfg.apiKey || '') + '" placeholder="Optional"></div>';
    } else if (protocol === 'websocket') {
      html += '<div class="form-group"><label>WebSocket URL</label><input type="text" id="cfg-url" value="' + AutoSeq.sanitize(cfg.url || '') + '" style="font-family:var(--font-mono);font-size:11px" placeholder="ws://host:port/path"></div>';
      html += '<div class="form-group"><label><input type="checkbox" id="cfg-reconnect" ' + (cfg.reconnect !== false ? 'checked' : '') + '> Auto-reconnect on disconnect</label></div>';
    } else if (protocol === 'mqtt') {
      html += '<div class="form-row"><div class="form-group"><label>Broker Host</label><input type="text" id="cfg-broker" value="' + AutoSeq.sanitize(cfg.broker || '') + '"></div>';
      html += '<div class="form-group"><label>Port</label><input type="number" id="cfg-port" value="' + (cfg.port || 1883) + '"></div></div>';
      html += '<div class="form-group"><label>Topic</label><input type="text" id="cfg-topic" value="' + AutoSeq.sanitize(cfg.topic || '') + '" style="font-family:var(--font-mono);font-size:11px" placeholder="owllogics/demand/#"></div>';
      html += '<div class="form-group"><label>Client ID</label><input type="text" id="cfg-clientId" value="' + AutoSeq.sanitize(cfg.clientId || '') + '"></div>';
    } else if (protocol === 'opcua') {
      html += '<div class="form-group"><label>OPC-UA Gateway URL</label><input type="text" id="cfg-gatewayUrl" value="' + AutoSeq.sanitize(cfg.gatewayUrl || '') + '" style="font-family:var(--font-mono);font-size:11px" placeholder="http://host:4840"></div>';
      html += '<div class="form-group"><label>Node ID</label><input type="text" id="cfg-nodeId" value="' + AutoSeq.sanitize(cfg.nodeId || '') + '" style="font-family:var(--font-mono);font-size:11px" placeholder="ns=2;s=OEM.Demand"></div>';
      html += '<div class="form-group"><label>Poll Interval (ms)</label><input type="number" id="cfg-pollInterval" value="' + (cfg.pollInterval || 5000) + '"></div>';
    } else if (protocol === 'serial') {
      html += '<div class="form-row"><div class="form-group"><label>Port</label><input type="text" id="cfg-port" value="' + AutoSeq.sanitize(cfg.port || '') + '" placeholder="COM1 / /dev/ttyUSB0"></div>';
      html += '<div class="form-group"><label>Baud Rate</label><select id="cfg-baudRate"><option value="9600"' + (cfg.baudRate == 9600 ? ' selected' : '') + '>9600</option><option value="19200"' + (cfg.baudRate == 19200 ? ' selected' : '') + '>19200</option><option value="38400"' + (cfg.baudRate == 38400 ? ' selected' : '') + '>38400</option><option value="115200"' + (cfg.baudRate == 115200 ? ' selected' : '') + '>115200</option></select></div>';
      html += '<div class="form-group"><label>Parity</label><select id="cfg-parity"><option value="none"' + (cfg.parity === 'none' ? ' selected' : '') + '>None</option><option value="even"' + (cfg.parity === 'even' ? ' selected' : '') + '>Even</option><option value="odd"' + (cfg.parity === 'odd' ? ' selected' : '') + '>Odd</option></select></div></div>';
      html += '<div class="text-sm text-muted mt-2">Web Serial API requires Chrome/Edge 77+ and must be triggered by a user action (button click).</div>';
    } else if (protocol === 'edi') {
      html += '<div class="text-sm text-muted">EDI file import does not require a persistent connection. Use the file import below to load EDI 866 data.</div>';
    } else if (protocol === 'azure') {
      html += '<div class="form-group"><label>Connection String</label><input type="text" id="cfg-connectionString" value="' + AutoSeq.sanitize(cfg.connectionString || '') + '" style="font-family:var(--font-mono);font-size:10px" placeholder="HostName=host.azure-devices.net;DeviceId=device;SharedAccessKey=..."></div>';
      html += '<div class="form-row"><div class="form-group"><label>Device ID</label><input type="text" id="cfg-deviceId" value="' + AutoSeq.sanitize(cfg.deviceId || '') + '" placeholder="your-device-id"></div>';
      html += '<div class="form-group"><label>Model ID (DTDL)</label><input type="text" id="cfg-modelId" value="' + AutoSeq.sanitize(cfg.modelId || '') + '" style="font-size:10px" placeholder="dtmi:com:owllogics:sequencingSystem;1"></div></div>';
      html += '<div class="form-group"><label><input type="checkbox" id="cfg-useDPS" ' + (cfg.useDPS ? 'checked' : '') + '> Use Device Provisioning Service (DPS)</label></div>';
      html += '<div class="form-group" id="cfg-dpsScope-wrap" style="display:none"><label>DPS ID Scope</label><input type="text" id="cfg-dpsScope" value="' + AutoSeq.sanitize(cfg.dpsScope || '') + '" placeholder="0ne00000000A"></div>';
      html += '<div class="text-sm text-muted mt-2">Azure IoT Hub uses MQTT over WebSocket (WSS:443) with SAS token auth. Compatible with Azure Industrial IoT, Digital Twins, and SAP DM.</div>';
    }

    return html;
  }

  function selectProtocol(protocol) {
    AutoSeq.state.msqm.mode = protocol;
    const fieldsDiv = document.getElementById('proto-config-fields');
    if (fieldsDiv) fieldsDiv.innerHTML = renderProtocolConfigFields(protocol);
  }

  function connectProtocol() {
    const protocol = AutoSeq.state.msqm.mode;
    // Read config from form fields
    const cfg = readProtocolConfig(protocol);
    ProtocolAdapter.setConfig(protocol, cfg);

    // Stop existing connection
    if (AutoSeq.state.msqm.running) {
      AutoSeq.msqmStop();
    }

    // Start with new protocol
    setTimeout(() => {
      AutoSeq.msqmStart();
      switchView('protocols');
    }, 200);
  }

  function disconnectProtocol() {
    AutoSeq.msqmStop();
    switchView('protocols');
  }

  function testProtocol() {
    const protocol = AutoSeq.state.msqm.mode;
    const cfg = readProtocolConfig(protocol);
    ProtocolAdapter.setConfig(protocol, cfg);

    // For simulation, emit a single test pulse
    if (protocol === 'simulation') {
      const msg = ProtocolAdapter.generateSimulationPulse();
      AutoSeq.handleProtocolMessage(msg);
      AutoSeq.alert('success', 'Test Pulse Sent', `Seq #${msg.sequenceNumber} via ${protocol}`);
    } else {
      AutoSeq.alert('info', 'Test Connection', `Attempting ${protocol} connection...`);
      connectProtocol();
    }
  }

  function readProtocolConfig(protocol) {
    const cfg = {};
    const get = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    const getNum = (id) => { const el = document.getElementById(id); return el ? parseInt(el.value) : 0; };
    const getChk = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };

    if (protocol === 'simulation') cfg.pulseRate = getNum('cfg-pulseRate');
    else if (protocol === 'rest') { cfg.endpoint = get('cfg-endpoint'); cfg.method = get('cfg-method'); cfg.pollInterval = getNum('cfg-pollInterval'); cfg.apiKey = get('cfg-apiKey'); }
    else if (protocol === 'websocket') { cfg.url = get('cfg-url'); cfg.reconnect = getChk('cfg-reconnect'); }
    else if (protocol === 'mqtt') { cfg.broker = get('cfg-broker'); cfg.port = getNum('cfg-port'); cfg.topic = get('cfg-topic'); cfg.clientId = get('cfg-clientId'); }
    else if (protocol === 'opcua') { cfg.gatewayUrl = get('cfg-gatewayUrl'); cfg.nodeId = get('cfg-nodeId'); cfg.pollInterval = getNum('cfg-pollInterval'); }
    else if (protocol === 'serial') { cfg.port = get('cfg-port'); cfg.baudRate = getNum('cfg-baudRate'); cfg.parity = get('cfg-parity'); }
    else if (protocol === 'azure') { cfg.connectionString = get('cfg-connectionString'); cfg.deviceId = get('cfg-deviceId'); cfg.modelId = get('cfg-modelId'); cfg.useDPS = getChk('cfg-useDPS'); cfg.dpsScope = get('cfg-dpsScope'); }

    return cfg;
  }

  function importEDI(fileInput) {
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
    ProtocolAdapter.importEDIFileInput(fileInput).then(result => {
      AutoSeq.alert('success', 'EDI Imported', result.message);
      switchView('protocols');
    }).catch(e => {
      AutoSeq.alert('error', 'Import Failed', e.message);
    });
  }

  function importEDIText() {
    const text = document.getElementById('edi-text-input').value;
    if (!text.trim()) { AutoSeq.alert('warning', 'Empty', 'Paste EDI data first'); return; }
    const result = ProtocolAdapter.importEDIFile(text);
    AutoSeq.alert('success', 'EDI Imported', result.message);
    switchView('protocols');
  }

  function importSampleEDI() {
    // FCA CONVIS format — single line per vehicle, all data packed in
    const sample = [
      'CONVIS|1C6RR7TT5ES123456|005001|68298041AB|LINE-07|FCA/Stellantis|Granite Crystal|Front Fascia - Granite Crystal|SHAP|RAM-1500|CREW|3.6L|BIG_HORN',
      'CONVIS|1C6SRFGT5EN123456|005002|68303553AG|LINE-08|FCA/Stellantis|Stainless|Ram Box Tailgate Panel - Stainless|BAP|RAM-2500|CREW|6.7L|LARAMIE',
      'CONVIS|1C4PJMBN5FP123456|005003|56046959AH|LINE-09|FCA/Stellantis|Black|Door Trim Panel LH - Black|JNAP|JEEP-WRANGLER|4DR|3.6L|RUBICON',
      'CONVIS|1C4RJFBG5FC123456|005004|68251648AC|LINE-10|FCA/Stellantis|Chrome|Grille Assembly - Chrome|WTAP|JEEP-CHEROKEE|SUV|2.4L|LIMITED',
      'CONVIS|1C6RR7LT6ES654321|005005|68029879AC|LINE-12|FCA/Stellantis|Clear/Black|Headlamp Assembly LH - Projector|SHAP|RAM-1500|CREW|5.7L|REBEL',
    ].join('\n');
    const result = ProtocolAdapter.importEDIFile(sample);
    AutoSeq.alert('success', 'CONVIS Feed Imported', result.message + ' — FCA/Stellantis format');
    switchView('protocols');
  }

  function importSamplePipe() {
    const sample = [
      'SEQ|3001|1HGCM82633A123456|LINE-01|5WK-8A350-AB|GM-19260412|Front Bumper Assembly - Crimson Red|General Motors',
      'SEQ|3002|2T1BURHE0JC123456|LINE-02|8K93-04200-A|FORD-CX7-88210|Headliner Assembly - Charcoal|Ford Motor Co',
      'SEQ|3003|3VWCK7AJ0DM123456|LINE-03|SEAT-CUSH-FR-01|VW-5K0-881-051|Front Seat Cushion Kit - Black Leather|Volkswagen',
      'SEQ|3004|5J6RE3H55CL123456|LINE-04|WIND-MX2-FR|HON-RV5-88210|Windshield Glass - Tinted|Honda',
    ].join('\n');
    const result = ProtocolAdapter.importEDIFile(sample);
    AutoSeq.alert('success', 'Pipe-Delimited Feed Imported', result.message);
    switchView('protocols');
  }

  function importSampleCSV() {
    const sample = [
      'VIN,SEQ,PART,LINE,OEM,DESCRIPTION',
      '1C6RR7TT5ES123456,4001,68298041AB,LINE-07,FCA/Stellantis,Front Fascia - Granite Crystal',
      '1C4PJMBN5FP123456,4002,56046959AH,LINE-09,FCA/Stellantis,Door Trim Panel LH - Black',
      '1HGCM82633A123456,4003,5WK-8A350-AB,LINE-01,General Motors,Front Bumper Assembly - Crimson Red',
    ].join('\n');
    const result = ProtocolAdapter.importEDIFile(sample);
    AutoSeq.alert('success', 'CSV Feed Imported', result.message);
    switchView('protocols');
  }

  function testParseFeed() {
    const text = document.getElementById('edi-text-input').value;
    if (!text.trim()) { AutoSeq.alert('warning', 'Empty', 'Paste feed data first'); return; }

    const messages = ProtocolAdapter.parseEDI866(text);
    const resultDiv = document.getElementById('edi-parse-result');
    if (!resultDiv) return;

    if (messages.length === 0) {
      resultDiv.innerHTML = '<div class="alert error" style="position:static"><span class="alert-icon">❌</span><div class="alert-text"><strong>No records parsed</strong><br>Could not detect feed format. Check the format examples above.</div></div>';
      return;
    }

    // Detect format
    const firstLine = text.trim().split(/\r?\n/)[0].trim();
    let format = 'Unknown';
    if (firstLine.startsWith('*')) format = 'FCA CONVIS Asterisk';
    else if (firstLine.startsWith('CONVIS')) format = 'FCA CONVIS Pipe';
    else if (firstLine.startsWith('SEQ|') || firstLine.startsWith('BROADCAST|')) format = 'Pipe-delimited';
    else if (text.includes('ST*866') || text.startsWith('ISA*')) format = 'X12 EDI 866';
    else if (firstLine.includes(',')) format = 'CSV';
    else if (firstLine.includes('\t')) format = 'Tab-delimited';

    let html = `<div class="alert success" style="position:static"><span class="alert-icon">✅</span><div class="alert-text"><strong>Parse successful</strong><br>Format: ${format} | Records: ${messages.length}</div></div>`;
    html += '<div class="msqm-console" style="max-height:200px;margin-top:8px">';
    messages.forEach(msg => {
      const ts = msg.timestamp ? msg.timestamp.substring(11, 19) : '--';
      html += `<div class="msqm-entry"><span class="ts">${ts}</span><span class="type broadcast">PARSED</span><span class="msg">Seq:${msg.sequenceNumber} | VIN:${msg.vin || 'N/A'} | PN:${msg.partNumber || 'N/A'} | Line:${msg.lineId || 'N/A'} | OEM:${msg.oem || 'N/A'}</span></div>`;
    });
    html += '</div>';
    resultDiv.innerHTML = html;
  }

  function saveStateNow() {
    AutoSeq.saveState();
    AutoSeq.alert('success', 'State Saved', 'All data persisted to localStorage');
    switchView('protocols');
  }

  function clearStateConfirm() {
    if (confirm('Clear all saved data? This will remove all sequences, racks, kits, and scan logs.')) {
      AutoSeq.clearState();
      AutoSeq.alert('success', 'Data Cleared', 'All saved state has been removed');
      switchView('dashboard');
    }
  }

  // ── Label Printing View ────────────────────────────────────
  let labelEngineTab = 'part';

  function renderLabels() {
    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">🏷️</span> Label Printing Engine<div class="panel-actions"><button class="btn btn-sm" onclick="AutoSeqUI.printAllLabels()">🖨️ Batch Print All</button></div></div><div class="panel-body">';

    // Tab bar
    html += '<div class="label-engine-tabs">';
    html += '<div class="label-engine-tab' + (labelEngineTab === 'part' ? ' active' : '') + '" onclick="AutoSeqUI.setLabelTab(\'part\')">🏷️ Part Labels</div>';
    html += '<div class="label-engine-tab' + (labelEngineTab === 'rack' ? ' active' : '') + '" onclick="AutoSeqUI.setLabelTab(\'rack\')">📦 Rack Labels</div>';
    html += '<div class="label-engine-tab' + (labelEngineTab === 'kit' ? ' active' : '') + '" onclick="AutoSeqUI.setLabelTab(\'kit\')">🔧 Kit Labels</div>';
    html += '<div class="label-engine-tab' + (labelEngineTab === 'shipping' ? ' active' : '') + '" onclick="AutoSeqUI.setLabelTab(\'shipping\')">📤 Shipping Labels</div>';
    html += '<div class="label-engine-tab' + (labelEngineTab === 'slot' ? ' active' : '') + '" onclick="AutoSeqUI.setLabelTab(\'slot\')">📌 Slot Labels</div>';
    html += '<div class="label-engine-tab' + (labelEngineTab === 'ckd' ? ' active' : '') + '" onclick="AutoSeqUI.setLabelTab(\'ckd\')">🌍 CKD Labels</div>';
    html += '<div class="label-engine-tab' + (labelEngineTab === 'formats' ? ' active' : '') + '" onclick="AutoSeqUI.setLabelTab(\'formats\')">📊 Barcode Formats</div>';
    html += '<div class="label-engine-tab' + (labelEngineTab === 'zpl' ? ' active' : '') + '" onclick="AutoSeqUI.setLabelTab(\'zpl\')">⚙️ ZPL Output</div>';
    html += '</div>';

    html += '<div id="label-content">' + renderLabelContent() + '</div>';

    html += '</div></div>';
    return html;
  }

  function setLabelTab(tab) {
    labelEngineTab = tab;
    const content = document.getElementById('label-content');
    if (content) content.innerHTML = renderLabelContent();
    // Update tabs
    document.querySelectorAll('.label-engine-tab').forEach(t => t.classList.remove('active'));
    const tabs = document.querySelectorAll('.label-engine-tab');
    const tabNames = ['part', 'rack', 'kit', 'shipping', 'slot', 'ckd', 'formats', 'zpl'];
    const idx = tabNames.indexOf(tab);
    if (idx >= 0 && tabs[idx]) tabs[idx].classList.add('active');
  }

  function renderLabelContent() {
    if (labelEngineTab === 'part') return renderPartLabelView();
    if (labelEngineTab === 'rack') return renderRackLabelView();
    if (labelEngineTab === 'kit') return renderKitLabelView();
    if (labelEngineTab === 'shipping') return renderShippingLabelView();
    if (labelEngineTab === 'slot') return renderSlotLabelView();
    if (labelEngineTab === 'ckd') return renderCKDLabelView();
    if (labelEngineTab === 'formats') return renderBarcodeFormatsView();
    if (labelEngineTab === 'zpl') return renderZPLView();
    return '<p>Unknown tab</p>';
  }

  function renderPartLabelView() {
    let html = '<div class="form-row"><div class="form-group"><label>Select Sequence</label><select id="label-seq-select"><option value="">-- Select a sequence --</option>';
    AutoSeq.state.sequences.forEach(seq => {
      html += `<option value="${seq.id}">${seq.id} — ${seq.description} (VIN: ${seq.vin})</option>`;
    });
    html += '</select></div></div>';
    html += '<div class="flex gap-2 mb-2"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.previewPartLabel()">🏷️ Preview Label</button></div>';
    html += '<div id="part-label-preview"></div>';

    // Batch print
    html += '<hr style="border-color:var(--border);margin:16px 0">';
    html += '<h3 class="mb-2" style="font-size:12px">Batch Print — All Sequences</h3>';
    html += `<div class="flex gap-2 mb-2"><button class="btn btn-emerald btn-sm" onclick="AutoSeqUI.batchPrintPartLabels()">🖨️ Print All Part Labels (${AutoSeq.state.sequences.length})</button></div>`;
    if (AutoSeq.state.sequences.length > 0) {
      html += '<div class="text-sm text-muted mb-2">Preview of first 6 labels:</div>';
      html += LabelEngine.renderBatchPartLabels(AutoSeq.state.sequences.slice(0, 6));
    }
    return html;
  }

  function renderRackLabelView() {
    let html = '<div class="form-row"><div class="form-group"><label>Select Rack</label><select id="label-rack-select"><option value="">-- Select a rack --</option>';
    AutoSeq.state.racks.forEach(rack => {
      html += `<option value="${rack.id}">${rack.id} — ${rack.lineName} (${rack.loadedCount}/${rack.slotCount} loaded)</option>`;
    });
    html += '</select></div></div>';
    html += '<div class="flex gap-2 mb-2"><button class="btn btn-emerald btn-sm" onclick="AutoSeqUI.previewRackLabel()">📦 Preview Rack Label</button></div>';
    html += '<div id="rack-label-preview"></div>';
    return html;
  }

  function renderKitLabelView() {
    let html = '<div class="form-row"><div class="form-group"><label>Select Kit</label><select id="label-kit-select"><option value="">-- Select a kit --</option>';
    AutoSeq.state.kits.forEach(kit => {
      const scanned = kit.components.filter(c => c.scanned).length;
      html += `<option value="${kit.id}">${kit.id} — ${kit.description} (${scanned}/${kit.components.length} scanned)</option>`;
    });
    html += '</select></div></div>';
    html += '<div class="flex gap-2 mb-2"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.previewKitLabel()">🔧 Preview Kit Label</button></div>';
    html += '<div id="kit-label-preview"></div>';
    return html;
  }

  function renderShippingLabelView() {
    let html = '<div class="form-row">';
    html += '<div class="form-group"><label>To (OEM Plant)</label><input type="text" id="ship-to" value="OEM Assembly Plant" style="width:200px"></div>';
    html += '<div class="form-group"><label>From (Supplier)</label><input type="text" id="ship-from" value="Chicago AV Tech Sequencing" style="width:200px"></div>';
    html += '<div class="form-group"><label>BOL Number</label><input type="text" id="ship-bol" value="BOL-' + Date.now().toString().slice(-6) + '" style="width:150px"></div>';
    html += '<div class="form-group"><label>Rack Count</label><input type="number" id="ship-racks" value="' + AutoSeq.state.racks.length + '" style="width:80px"></div>';
    html += '</div>';
    html += '<div class="flex gap-2 mb-2"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.previewShippingLabel()">📤 Preview Shipping Label</button></div>';
    html += '<div id="shipping-label-preview"></div>';
    return html;
  }

  function renderSlotLabelView() {
    let html = '<div class="form-row"><div class="form-group"><label>Select Rack</label><select id="slot-rack-select" onchange="AutoSeqUI.previewSlotLabels()"><option value="">-- Select a rack --</option>';
    AutoSeq.state.racks.forEach(rack => {
      html += `<option value="${rack.id}">${rack.id} — ${rack.lineName} (${rack.slotCount} slots)</option>`;
    });
    html += '</select></div></div>';
    html += '<div class="flex gap-2 mb-2"><button class="btn btn-emerald btn-sm" onclick="AutoSeqUI.batchPrintSlotLabels()">🖨️ Print All Slot Labels</button></div>';
    html += '<div id="slot-label-preview"></div>';
    return html;
  }

  function renderZPLView() {
    let html = '<div class="form-row">';
    html += '<div class="form-group"><label>Label Type</label><select id="zpl-type"><option value="part">Part Label</option><option value="rack">Rack Label</option><option value="kit">Kit Label</option><option value="shipping">Shipping Label</option><option value="slot">Slot Label</option><option value="ckd-part">CKD Part Label</option><option value="ckd-kit">CKD Kit Label</option><option value="ckd-shipping">CKD Shipping Label</option><option value="ckd-customs">CKD Customs Label</option></select></div>';
    html += '<div class="form-group"><label>Source</label><select id="zpl-source"><option value="">-- Select source --</option></select></div>';
    html += '<div class="form-group"><label>DPI</label><select id="zpl-dpi"><option value="203">203 (GK420)</option><option value="300">300 (ZT411)</option><option value="600">600 (ZT611)</option></select></div>';
    html += '</div>';
    html += '<div class="label-zpl-toolbar"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.generateZPLPreview()">⚙️ Generate ZPL</button><button class="btn btn-sm" onclick="AutoSeqUI.downloadZPL()">⬇ Download .zpl</button><button class="btn btn-sm" onclick="AutoSeqUI.copyZPL()">📋 Copy</button></div>';
    html += '<div class="label-zpl-preview" id="zpl-preview" style="min-height:100px">// ZPL output will appear here</div>';
    return html;
  }

  // ── CKD Label View ─────────────────────────────────────────
  function renderCKDLabelView() {
    let html = '<div class="form-row">';
    html += '<div class="form-group"><label>CKD Label Type</label><select id="ckd-type" onchange="AutoSeqUI.previewCKDLabel()"><option value="ckd-part">CKD Part Label</option><option value="ckd-kit">CKD Kit Label</option><option value="ckd-shipping">CKD Shipping Label</option><option value="ckd-customs">CKD Customs Declaration</option></select></div>';
    html += '</div>';

    // CKD Part fields
    html += '<div id="ckd-fields"></div>';
    html += '<div class="flex gap-2 mb-2"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.previewCKDLabel()">🌍 Preview CKD Label</button><button class="btn btn-emerald btn-sm" onclick="AutoSeqUI.printCKDLabel()">🖨️ Print</button></div>';
    html += '<div id="ckd-label-preview"></div>';
    return html;
  }

  function previewCKDLabel() {
    const type = document.getElementById('ckd-type') ? document.getElementById('ckd-type').value : 'ckd-part';
    // Build data from form fields or defaults
    const data = {
      partNumber: (document.getElementById('ckd-pn') || {}).value || '5WK-8A350-AB',
      description: (document.getElementById('ckd-desc') || {}).value || 'Front Bumper Assembly',
      hsCode: (document.getElementById('ckd-hs') || {}).value || '8708.10.00',
      lotNumber: (document.getElementById('ckd-lot') || {}).value || 'LOT-' + Date.now().toString().slice(-6),
      quantity: parseInt((document.getElementById('ckd-qty') || {}).value) || 1,
      countryOfOrigin: (document.getElementById('ckd-origin') || {}).value || 'US',
      destinationCountry: (document.getElementById('ckd-dest') || {}).value || 'MX',
      ckdType: (document.getElementById('ckd-ckdtype') || {}).value || 'SKD-2',
      tariffCode: (document.getElementById('ckd-tariff') || {}).value || 'USMCA',
      kitId: (document.getElementById('ckd-kitid') || {}).value || 'CKD-' + Date.now().toString().slice(-6),
      modelCode: (document.getElementById('ckd-model') || {}).value || 'SUV-X1',
      ckdLevel: (document.getElementById('ckd-level') || {}).value || 'CKD-S',
      assemblyPlant: (document.getElementById('ckd-plant') || {}).value || 'Silao Assembly',
      containerId: (document.getElementById('ckd-container') || {}).value || 'CNT-' + Date.now().toString().slice(-6),
      palletId: (document.getElementById('ckd-pallet') || {}).value || 'PLT-0001',
      shipper: (document.getElementById('ckd-shipper') || {}).value || 'OEM Manufacturing',
      shipperAddr: (document.getElementById('ckd-shipaddr') || {}).value || 'Detroit, MI, USA',
      consignee: (document.getElementById('ckd-consignee') || {}).value || 'Assembly Plant',
      consigneeAddr: (document.getElementById('ckd-consaddr') || {}).value || 'Silao, GTO, MX',
      sealNumber: (document.getElementById('ckd-seal') || {}).value || 'SEAL-' + Date.now().toString().slice(-6),
      bol: (document.getElementById('ckd-bol') || {}).value || 'BOL-' + Date.now().toString().slice(-6),
      invoice: (document.getElementById('ckd-invoice') || {}).value || 'INV-' + Date.now().toString().slice(-6),
      grossWeight: (document.getElementById('ckd-gross') || {}).value || '1250',
      netWeight: (document.getElementById('ckd-net') || {}).value || '1100',
      pieceCount: parseInt((document.getElementById('ckd-pieces') || {}).value) || 48,
      sscc: (document.getElementById('ckd-sscc') || {}).value || '0000001234567',
      customsEntry: (document.getElementById('ckd-entry') || {}).value || 'CUS-' + Date.now().toString().slice(-6),
      entryDate: new Date().toISOString().slice(0, 10),
      tariffRate: (document.getElementById('ckd-tariffrate') || {}).value || '0%',
      declaredValue: (document.getElementById('ckd-value') || {}).value || '45000.00',
      currency: (document.getElementById('ckd-currency') || {}).value || 'USD',
      broker: (document.getElementById('ckd-broker') || {}).value || 'Expeditors International',
      components: AutoSeq.state.parts.find(p => p.kitComponents) ? AutoSeq.state.parts.find(p => p.kitComponents).kitComponents : [],
    };

    const preview = document.getElementById('ckd-label-preview');
    if (!preview) return;

    if (type === 'ckd-part') {
      preview.innerHTML = LabelEngine.renderCKDPartLabel(data);
    } else if (type === 'ckd-kit') {
      preview.innerHTML = LabelEngine.renderCKDKitLabel(data);
    } else if (type === 'ckd-shipping') {
      preview.innerHTML = LabelEngine.renderCKDShippingLabel(data);
    } else if (type === 'ckd-customs') {
      preview.innerHTML = LabelEngine.renderCKDCustomsLabel(data);
    }
  }

  function printCKDLabel() {
    previewCKDLabel();
    setTimeout(() => {
      const preview = document.getElementById('ckd-label-preview');
      if (preview && preview.innerHTML) {
        LabelEngine.printLabels(preview.innerHTML);
      }
    }, 200);
  }

  // ── Barcode Formats Reference View ─────────────────────────
  function renderBarcodeFormatsView() {
    const formats = LabelEngine.getBarcodeFormats();
    const testData = '5WK-8A350-AB';
    const testNumeric = '123456789012';

    let html = '<div class="panel" style="background:var(--bg-tertiary);border-radius:var(--radius);padding:14px;margin-bottom:12px">';
    html += '<div style="font-size:12px;font-weight:600;margin-bottom:8px">📊 Supported Barcode Formats</div>';
    html += '<div style="font-size:11px;color:var(--text-muted)">All formats generate SVG output and support ZPL commands for Zebra printers. Each format is optimized for different automotive logistics use cases.</div>';
    html += '</div>';

    html += '<table class="data-table"><thead><tr><th>Format</th><th>Description</th><th>ZPL Command</th><th>Live Preview</th></tr></thead><tbody>';

    Object.entries(formats).forEach(([key, fmt]) => {
      const previewData = (key === 'i2of5' || key === 'ean13') ? testNumeric : testData;
      const svg = LabelEngine.generateBarcodeSVG(previewData, key, { barWidth: 2, height: 30, showText: false, size: 60 });
      html += `<tr>
        <td class="font-mono font-bold text-purple">${fmt.name}</td>
        <td style="font-family:var(--font-sans);font-size:11px">${fmt.desc}</td>
        <td class="font-mono text-cyan">${fmt.zpl}</td>
        <td style="background:white;padding:4px">${svg}</td>
      </tr>`;
    });

    html += '</tbody></table>';

    // Barcode generator tool
    html += '<div class="panel" style="margin-top:16px"><div class="panel-header"><span class="panel-icon">🔧</span> Barcode Generator Tool</div><div class="panel-body">';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label>Data to Encode</label><input type="text" id="bc-gen-data" value="5WK-8A350-AB" style="font-family:var(--font-mono)"></div>';
    html += '<div class="form-group"><label>Format</label><select id="bc-gen-format">';
    Object.entries(formats).forEach(([key, fmt]) => {
      html += `<option value="${key}">${fmt.name}</option>`;
    });
    html += '</select></div>';
    html += '<div class="form-group"><label>Bar Width</label><select id="bc-gen-width"><option value="1">1px</option><option value="2" selected>2px</option><option value="3">3px</option><option value="4">4px</option></select></div>';
    html += '<div class="form-group"><label>Height</label><input type="number" id="bc-gen-height" value="50" min="20" max="200" style="width:80px"></div>';
    html += '</div>';
    html += '<div class="flex gap-2 mb-2"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.generateBarcodePreview()">⚡ Generate Barcode</button></div>';
    html += '<div id="barcode-gen-preview" style="background:white;padding:12px;border-radius:var(--radius);min-height:60px;margin-top:8px"></div>';
    html += '</div></div>';

    // CKD business logic info
    html += '<div class="panel" style="margin-top:16px"><div class="panel-header"><span class="panel-icon">🌍</span> CKD Business Logic</div><div class="panel-body">';
    html += '<div style="font-size:11px;color:var(--text-secondary);line-height:1.6">';
    html += '<p style="margin-bottom:8px"><strong>CKD (Completely Knocked Down)</strong> — Vehicles exported as unassembled kits for assembly in the destination country. Reduces import tariffs and meets local content requirements.</p>';
    html += '<p style="margin-bottom:8px"><strong>SKD (Semi-Knocked Down)</strong> — Partially assembled vehicles. SKD-1 = body + chassis, SKD-2 = body only.</p>';
    html += '<p style="margin-bottom:8px"><strong>CKD Label Requirements:</strong></p>';
    html += '<ul style="list-style:disc;padding-left:20px;margin-bottom:8px">';
    html += '<li>HS Code (Harmonized System) for customs classification</li>';
    html += '<li>Country of Origin and Destination for tariff determination</li>';
    html += '<li>Lot number and quantity for traceability</li>';
    html += '<li>DataMatrix code for Direct Part Marking (DPM) per ISO/IEC 16022</li>';
    html += '<li>SSCC (Serial Shipping Container Code) for logistics tracking</li>';
    html += '<li>USMCA/NAFTA certification for North American trade</li>';
    html += '</ul>';
    html += '<p><strong>Barcode Format Selection by CKD Use Case:</strong></p>';
    html += '<ul style="list-style:disc;padding-left:20px">';
    html += '<li><strong>Code 128</strong> — Part labels, sequence labels (general purpose)</li>';
    html += '<li><strong>Code 39</strong> — Legacy systems, CKD kit labels (automotive standard)</li>';
    html += '<li><strong>EAN-13</strong> — SSCC shipping labels, global trade items</li>';
    html += '<li><strong>DataMatrix</strong> — DPM on parts, small component marking</li>';
    html += '<li><strong>Interleaved 2 of 5</strong> — Carton labels, bulk packaging</li>';
    html += '<li><strong>QR Code</strong> — Mobile scanning, inspection documentation</li>';
    html += '</ul>';
    html += '</div>';
    html += '</div></div>';

    return html;
  }

  function generateBarcodePreview() {
    const data = document.getElementById('bc-gen-data').value || 'TEST';
    const format = document.getElementById('bc-gen-format').value;
    const barWidth = parseInt(document.getElementById('bc-gen-width').value);
    const height = parseInt(document.getElementById('bc-gen-height').value);
    const svg = LabelEngine.generateBarcodeSVG(data, format, { barWidth, height, showText: true, size: 80 });
    const preview = document.getElementById('barcode-gen-preview');
    if (preview) {
      preview.innerHTML = `<div style="text-align:center">${svg}</div><div style="text-align:center;margin-top:8px;font-size:11px;color:#666;font-family:monospace">Format: ${format} | Data: ${data} | Size: ${barWidth}×${height}px</div>`;
    }
  }

  // ── Label Preview Functions ────────────────────────────────
  function previewPartLabel() {
    const seqId = document.getElementById('label-seq-select').value;
    if (!seqId) { AutoSeq.alert('warning', 'No Selection', 'Select a sequence first'); return; }
    const seq = AutoSeq.state.sequences.find(s => s.id === seqId);
    if (!seq) return;
    const preview = document.getElementById('part-label-preview');
    preview.innerHTML = LabelEngine.renderPartLabel(seq);
  }

  function previewRackLabel() {
    const rackId = document.getElementById('label-rack-select').value;
    if (!rackId) { AutoSeq.alert('warning', 'No Selection', 'Select a rack first'); return; }
    const rack = AutoSeq.state.racks.find(r => r.id === rackId);
    if (!rack) return;
    const label = AutoSeq.generateRackLabel(rack);
    const preview = document.getElementById('rack-label-preview');
    preview.innerHTML = LabelEngine.renderRackLabel(rack, label);
  }

  function previewKitLabel() {
    const kitId = document.getElementById('label-kit-select').value;
    if (!kitId) { AutoSeq.alert('warning', 'No Selection', 'Select a kit first'); return; }
    const kit = AutoSeq.state.kits.find(k => k.id === kitId);
    if (!kit) return;
    const preview = document.getElementById('kit-label-preview');
    preview.innerHTML = LabelEngine.renderKitLabel(kit);
  }

  function previewShippingLabel() {
    const data = {
      to: document.getElementById('ship-to').value,
      from: document.getElementById('ship-from').value,
      bol: document.getElementById('ship-bol').value,
      rackCount: parseInt(document.getElementById('ship-racks').value) || 0,
    };
    const preview = document.getElementById('shipping-label-preview');
    preview.innerHTML = LabelEngine.renderShippingLabel(data);
  }

  function previewSlotLabels() {
    const rackId = document.getElementById('slot-rack-select').value;
    if (!rackId) return;
    const rack = AutoSeq.state.racks.find(r => r.id === rackId);
    if (!rack) return;
    const preview = document.getElementById('slot-label-preview');
    preview.innerHTML = LabelEngine.renderBatchSlotLabels(rack);
  }

  // ── Batch Print Functions ──────────────────────────────────
  function batchPrintPartLabels() {
    if (AutoSeq.state.sequences.length === 0) {
      AutoSeq.alert('warning', 'No Sequences', 'No sequences available to print');
      return;
    }
    const html = LabelEngine.renderBatchPartLabels(AutoSeq.state.sequences);
    LabelEngine.printLabels(html);
  }

  function batchPrintSlotLabels() {
    const rackId = document.getElementById('slot-rack-select') ? document.getElementById('slot-rack-select').value : null;
    const rack = rackId ? AutoSeq.state.racks.find(r => r.id === rackId) : AutoSeq.state.currentRack;
    if (!rack) { AutoSeq.alert('warning', 'No Rack', 'Select a rack first'); return; }
    const html = LabelEngine.renderBatchSlotLabels(rack);
    LabelEngine.printLabels(html);
  }

  function printAllLabels() {
    let html = '';
    // Part labels
    if (AutoSeq.state.sequences.length > 0) {
      html += LabelEngine.renderBatchPartLabels(AutoSeq.state.sequences);
    }
    // Rack labels
    AutoSeq.state.racks.forEach(rack => {
      const label = AutoSeq.generateRackLabel(rack);
      html += LabelEngine.renderRackLabel(rack, label);
    });
    // Kit labels
    AutoSeq.state.kits.forEach(kit => {
      html += LabelEngine.renderKitLabel(kit);
    });
    if (!html) {
      AutoSeq.alert('info', 'Nothing to Print', 'No labels to generate. Create sequences, racks, or kits first.');
      return;
    }
    LabelEngine.printLabels(html);
  }

  // ── ZPL Functions ──────────────────────────────────────────
  function generateZPLPreview() {
    const type = document.getElementById('zpl-type').value;
    const dpi = parseInt(document.getElementById('zpl-dpi').value);
    const sourceId = document.getElementById('zpl-source').value;

    let data, zpl;
    if (type === 'part') {
      data = AutoSeq.state.sequences.find(s => s.id === sourceId) || AutoSeq.state.sequences[0];
      if (!data) { AutoSeq.alert('warning', 'No Data', 'No sequences available'); return; }
      zpl = LabelEngine.generateZPL(data, { type: 'part', dpi });
    } else if (type === 'rack') {
      data = AutoSeq.state.racks.find(r => r.id === sourceId) || AutoSeq.state.racks[0];
      if (!data) { AutoSeq.alert('warning', 'No Data', 'No racks available'); return; }
      zpl = LabelEngine.generateZPL(data, { type: 'rack', dpi });
    } else if (type === 'kit') {
      data = AutoSeq.state.kits.find(k => k.id === sourceId) || AutoSeq.state.kits[0];
      if (!data) { AutoSeq.alert('warning', 'No Data', 'No kits available'); return; }
      zpl = LabelEngine.generateZPL(data, { type: 'kit', dpi });
    } else if (type === 'shipping') {
      data = { to: 'OEM Plant', from: 'Supplier', bol: 'BOL-' + Date.now(), rackCount: AutoSeq.state.racks.length };
      zpl = LabelEngine.generateZPL(data, { type: 'shipping', dpi });
    } else if (type === 'slot') {
      data = { rackId: 'RACK-000001', slotNumber: 1, expectedPart: 'PART-001' };
      zpl = LabelEngine.generateZPL(data, { type: 'slot', dpi });
    }

    const preview = document.getElementById('zpl-preview');
    if (preview) preview.textContent = zpl;
    AutoSeq.alert('success', 'ZPL Generated', `${type} label ZPL (${zpl.length} chars, ${dpi} DPI)`);
  }

  function downloadZPL() {
    const preview = document.getElementById('zpl-preview');
    if (!preview || !preview.textContent || preview.textContent.startsWith('//')) {
      AutoSeq.alert('warning', 'No ZPL', 'Generate ZPL first');
      return;
    }
    const type = document.getElementById('zpl-type').value;
    LabelEngine.downloadZPL(preview.textContent, `owllogics_${type}_label.zpl`);
    AutoSeq.alert('success', 'Downloaded', 'ZPL file saved');
  }

  function copyZPL() {
    const preview = document.getElementById('zpl-preview');
    if (!preview || !preview.textContent || preview.textContent.startsWith('//')) {
      AutoSeq.alert('warning', 'No ZPL', 'Generate ZPL first');
      return;
    }
    navigator.clipboard.writeText(preview.textContent).then(() => {
      AutoSeq.alert('success', 'Copied', 'ZPL copied to clipboard');
    }).catch(() => {
      AutoSeq.alert('info', 'Copy Failed', 'Select the text manually and copy');
    });
  }

  // Update ZPL source dropdown when type changes
  function updateZPLSources() {
    const type = document.getElementById('zpl-type');
    const source = document.getElementById('zpl-source');
    if (!type || !source) return;
    const typeVal = type.value;
    let options = '<option value="">-- Auto (first available) --</option>';
    if (typeVal === 'part') {
      AutoSeq.state.sequences.forEach(s => { options += `<option value="${s.id}">${s.id} — ${s.description}</option>`; });
    } else if (typeVal === 'rack') {
      AutoSeq.state.racks.forEach(r => { options += `<option value="${r.id}">${r.id} — ${r.lineName}</option>`; });
    } else if (typeVal === 'kit') {
      AutoSeq.state.kits.forEach(k => { options += `<option value="${k.id}">${k.id} — ${k.description}</option>`; });
    }
    source.innerHTML = options;
  }

  function printRackLabel() {
    if (!AutoSeq.state.currentRack) { AutoSeq.alert('warning', 'No Rack', 'Select a rack first'); return; }
    const rack = AutoSeq.state.currentRack;
    const label = AutoSeq.generateRackLabel(rack);
    LabelEngine.printLabels(LabelEngine.renderRackLabel(rack, label));
  }

  // ══════════════════════════════════════════════════════════
  //  SHOP FLOOR VIEW — End-User Sequencing Interface
  //  Simplified touch-friendly view for shop floor operators
  // ══════════════════════════════════════════════════════════

  function renderShopFloor() {
    const stats = AutoSeq.getStats();
    const pending = AutoSeq.state.sequences.filter(s => s.status === 'pending');
    const loaded = AutoSeq.state.sequences.filter(s => s.status === 'loaded');
    const current = pending.length > 0 ? pending[0] : null;

    let html = '';

    // Top stat cards
    html += '<div class="shop-floor-layout">';
    html += `<div class="shop-floor-card"><div class="sf-label">Pending Sequences</div><div class="sf-value">${pending.length}</div><div class="sf-sub">Waiting to be loaded</div></div>`;
    html += `<div class="shop-floor-card" style="--accent-color:var(--blue)"><div class="sf-label">Loaded</div><div class="sf-value" style="color:var(--blue)">${loaded.length}</div><div class="sf-sub">In racks, ready to ship</div></div>`;
    html += `<div class="shop-floor-card" style="--accent-color:var(--purple)"><div class="sf-label">Active Racks</div><div class="sf-value" style="color:var(--purple-light)">${stats.activeRacks}</div><div class="sf-sub">${stats.completeRacks} complete</div></div>`;
    html += `<div class="shop-floor-card" style="--accent-color:var(--red)"><div class="sf-label">Errors</div><div class="sf-value" style="color:${stats.rackErrors > 0 ? 'var(--red)' : 'var(--emerald)'}">${stats.rackErrors}</div><div class="sf-sub">Poka-yoke violations</div></div>`;
    html += '</div>';

    // Current sequence highlight
    if (current) {
      html += `<div class="shop-floor-current">
        <div class="sfc-label">▶ NEXT SEQUENCE TO LOAD</div>
        <div class="sfc-seq">#${current.sequenceNumber}</div>
        <div class="sfc-part">${AutoSeq.sanitize(current.partNumber)}</div>
        <div class="sfc-desc">${AutoSeq.sanitize(current.description)}</div>
        <div class="sfc-vin">VIN: ${AutoSeq.sanitize(current.vin)}</div>
        <div class="sfc-vin">Line: ${AutoSeq.sanitize(current.lineName || current.lineId)} | OEM: ${AutoSeq.sanitize(current.oem)}</div>
      </div>`;
    } else {
      html += `<div class="shop-floor-current" style="border-color:var(--text-muted)">
        <div class="sfc-label">NO PENDING SEQUENCES</div>
        <div class="sfc-desc" style="color:var(--text-muted)">All sequences loaded. Waiting for MSQM broadcast...</div>
      </div>`;
    }

    // Big scanner bar (touch-friendly)
    html += `<div class="sf-big-scan" id="sf-scan-bar">
      <span class="sf-scan-icon">📡</span>
      <input type="text" id="sf-scan-input" placeholder="Scan part barcode or type item number + Enter..." autocomplete="off" autofocus>
      <span class="sf-scan-status" id="sf-scan-status">Ready</span>
    </div>`;

    // Queue list
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📋</span> Sequence Queue (Live)</div><div class="panel-body" style="padding:0">';
    html += '<div class="shop-floor-queue">';
    if (AutoSeq.state.sequences.length === 0) {
      html += '<p class="text-muted text-center" style="padding:20px">Waiting for OEM demand...</p>';
    } else {
      AutoSeq.state.sequences.slice(-20).reverse().forEach(seq => {
        let cls = 'sf-queue-item';
        if (seq === current) cls += ' current';
        if (seq.status === 'loaded') cls += ' loaded';
        const statusColor = seq.status === 'pending' ? 'status-pending' : seq.status === 'loaded' ? 'status-loaded' : 'status-complete';
        html += `<div class="${cls}">
          <span class="sfq-seq">#${seq.sequenceNumber}</span>
          <span class="sfq-part">${AutoSeq.sanitize(seq.partNumber)} — ${AutoSeq.sanitize(seq.description.substring(0, 30))}</span>
          <span class="sfq-vin">${AutoSeq.sanitize(seq.vin.substring(0, 10))}...</span>
          <span class="sfq-status"><span class="status-badge ${statusColor}">${seq.status}</span></span>
        </div>`;
      });
    }
    html += '</div>';
    html += '</div></div>';

    // Quick actions
    html += '<div class="flex gap-2 mt-4">';
    html += '<button class="btn btn-emerald btn-lg" onclick="AutoSeqUI.switchView(\'rack-loading\')">📦 Go to Rack Loading</button>';
    html += '<button class="btn btn-lg" onclick="AutoSeqUI.switchView(\'kitting\')">🔧 Go to Kitting</button>';
    html += '<button class="btn btn-lg" onclick="AutoSeqUI.switchView(\'labels\')">🏷️ Print Labels</button>';
    html += '</div>';

    return html;
  }

  // ══════════════════════════════════════════════════════════
  //  COMMODITY MASTER VIEW
  // ══════════════════════════════════════════════════════════

  function renderCommodities() {
    const commodities = AutoSeq.state.commodities;
    const rackTypes = AutoSeq.state.rackTypes;

    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📦</span> Commodity Master — Sequencing & Delivery Configuration<div class="panel-actions"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.showCommodityModal()">➕ Add Commodity</button></div></div><div class="panel-body">';

    html += '<div class="text-sm text-muted mb-2">Configure how racks are sequenced, loaded, and delivered for each commodity group. Dock doors, delivery routes, staging lanes, and line-side presentation rules drive rack creation and shop floor workflow.</div>';

    // Toolbar
    html += '<div class="crud-toolbar">';
    html += '<input type="text" class="crud-search" id="com-search" placeholder="Search commodities..." oninput="AutoSeqUI.filterCommodities()">';
    html += '<span class="text-sm text-muted">' + commodities.length + ' commodities</span>';
    html += '</div>';

    // Table
    html += '<table class="data-table" id="com-table"><thead><tr><th>ID</th><th>Code</th><th>Name</th><th>Rack Type</th><th>Load Pattern</th><th>Dock</th><th>Route</th><th>Staging</th><th>Line-Side</th><th>Takt</th><th>Items</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    commodities.forEach(function(com) {
      var itemCount = AutoSeq.state.items.filter(function(i) { return i.commodityCode === com.code; }).length;
      html += '<tr id="com-row-' + com.id + '">' +
        '<td class="font-mono">' + com.id + '</td>' +
        '<td class="font-mono font-bold text-purple">' + AutoSeq.sanitize(com.code) + '</td>' +
        '<td>' + AutoSeq.sanitize(com.name) + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(com.rackType) + '</td>' +
        '<td><span class="status-badge ' + (com.loadPattern === 'forward' ? 'status-active' : 'status-pending') + '">' + (com.loadPattern || 'forward') + '</span></td>' +
        '<td class="font-mono">' + AutoSeq.sanitize(com.dockDoor || '—') + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(com.deliveryRoute || '—') + '</td>' +
        '<td class="font-mono">' + AutoSeq.sanitize(com.stagingLane || '—') + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(com.lineSidePresentation || 'sequential') + '</td>' +
        '<td class="font-mono">' + (com.taktTime || 60) + 's</td>' +
        '<td>' + itemCount + '</td>' +
        '<td><span class="crud-badge ' + (com.active ? 'active' : 'inactive') + '">' + (com.active ? 'Active' : 'Inactive') + '</span></td>' +
        '<td><div class="crud-row-actions">' +
          '<button class="btn btn-sm" onclick="AutoSeqUI.editCommodity(\'' + com.id + '\')">✏️</button>' +
          '<button class="btn btn-sm btn-danger" onclick="AutoSeqUI.deleteCommodity(\'' + com.id + '\')">🗑️</button>' +
        '</div></td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '</div></div>';
    return html;
  }

  function showCommodityModal(comId) {
    var com = comId ? AutoSeq.state.commodities.find(function(c) { return c.id === comId; }) : null;
    var rackTypes = AutoSeq.state.rackTypes;
    var isEdit = !!com;
    var v = function(field, def) { return com ? (com[field] || def || '') : (def || ''); };

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'commodity-modal';
    modal.innerHTML =
      '<div class="modal" style="min-width:620px;max-height:85vh;overflow-y:auto">' +
        '<div class="modal-header">' + (isEdit ? '✏️ Edit' : '➕ Add') + ' Commodity<span class="modal-close" onclick="AutoSeqUI.closeModal()">✕</span></div>' +
        '<div class="modal-body">' +
          '<div style="font-size:11px;font-weight:600;color:var(--purple-light);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">📋 Commodity Info</div>' +
          '<div class="form-group"><label>Commodity Name</label><input type="text" id="com-name" value="' + AutoSeq.sanitize(v('name')) + '" placeholder="e.g. Bumper, Headliner, Fascia"></div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Code (auto-generated)</label><input type="text" id="com-code" value="' + AutoSeq.sanitize(v('code')) + '" placeholder="Auto from name"></div>' +
            '<div class="form-group"><label>Description</label><input type="text" id="com-desc" value="' + AutoSeq.sanitize(v('description')) + '"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Rack Type</label><select id="com-rackType">' +
              rackTypes.map(function(r) { return '<option value="' + r.id + '"' + (com && com.rackType === r.id ? ' selected' : '') + '>' + r.name + ' (' + r.slotCount + ' slots)</option>'; }).join('') +
            '</select></div>' +
            '<div class="form-group"><label>Picking Pattern</label><select id="com-picking">' +
              '<option value="forward"' + (v('pickingPattern') === 'forward' ? ' selected' : '') + '>Forward</option>' +
              '<option value="reverse"' + (v('pickingPattern') === 'reverse' ? ' selected' : '') + '>Reverse</option>' +
            '</select></div>' +
          '</div>' +

          '<div style="font-size:11px;font-weight:600;color:var(--emerald-light);margin:14px 0 8px;text-transform:uppercase;letter-spacing:1px">🚚 Rack Sequencing & Delivery Config</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Load Pattern (how rack fills)</label><select id="com-loadPattern">' +
              '<option value="forward"' + (v('loadPattern') === 'forward' ? ' selected' : '') + '>Forward (pos 1 first)</option>' +
              '<option value="reverse"' + (v('loadPattern') === 'reverse' ? ' selected' : '') + '>Reverse (last pos first)</option>' +
            '</select></div>' +
            '<div class="form-group"><label>Unload Pattern (at OEM)</label><select id="com-unloadPattern">' +
              '<option value="forward"' + (v('unloadPattern') === 'forward' ? ' selected' : '') + '>Forward</option>' +
              '<option value="reverse"' + (v('unloadPattern') === 'reverse' ? ' selected' : '') + '>Reverse</option>' +
            '</select></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Dock Door</label><input type="text" id="com-dockDoor" value="' + AutoSeq.sanitize(v('dockDoor')) + '" placeholder="e.g. DOCK-12, D-07"></div>' +
            '<div class="form-group"><label>Delivery Route</label><input type="text" id="com-deliveryRoute" value="' + AutoSeq.sanitize(v('deliveryRoute')) + '" placeholder="e.g. ROUTE-A, MILK-RUN-3"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Staging Lane</label><input type="text" id="com-stagingLane" value="' + AutoSeq.sanitize(v('stagingLane')) + '" placeholder="e.g. LANE-04, STG-B"></div>' +
            '<div class="form-group"><label>Delivery Window</label><input type="text" id="com-deliveryWindow" value="' + AutoSeq.sanitize(v('deliveryWindow')) + '" placeholder="e.g. 06:00-14:00, 2hr window"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Line-Side Presentation</label><select id="com-lineSidePresentation">' +
              '<option value="sequential"' + (v('lineSidePresentation') === 'sequential' ? ' selected' : '') + '>Sequential (in order)</option>' +
              '<option value="batch"' + (v('lineSidePresentation') === 'batch' ? ' selected' : '') + '>Batch (all at once)</option>' +
              '<option value="kit"' + (v('lineSidePresentation') === 'kit' ? ' selected' : '') + '>Kit (pre-assembled)</option>' +
              '<option value="bulk"' + (v('lineSidePresentation') === 'bulk' ? ' selected' : '') + '>Bulk (unsequenced)</option>' +
            '</select></div>' +
            '<div class="form-group"><label>Takt Time (seconds between deliveries)</label><input type="number" id="com-taktTime" value="' + (v('taktTime') || 60) + '" min="10" max="3600" step="5"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>OEM Plant Code</label><input type="text" id="com-oemPlant" value="' + AutoSeq.sanitize(v('oemPlant')) + '" placeholder="e.g. SHAP, JNAP, BAP"></div>' +
            '<div class="form-group"><label>Packaging Type</label><select id="com-packagingType">' +
              '<option value="returnable"' + (v('packagingType') === 'returnable' ? ' selected' : '') + '>Returnable Rack</option>' +
              '<option value="expendable"' + (v('packagingType') === 'expendable' ? ' selected' : '') + '>Expendable</option>' +
              '<option value="container"' + (v('packagingType') === 'container' ? ' selected' : '') + '>Container</option>' +
            '</select></div>' +
          '</div>' +
          '<div class="form-group"><label><input type="checkbox" id="com-hazmat" ' + (v('hazmatFlag') ? 'checked' : '') + '> Hazardous Material Flag</label></div>' +
          '<div class="form-group"><label><input type="checkbox" id="com-active" ' + (!com || com.active ? 'checked' : '') + '> Active</label></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn" onclick="AutoSeqUI.closeModal()">Cancel</button>' +
          '<button class="btn btn-primary" onclick="AutoSeqUI.saveCommodity(' + (isEdit ? "'" + com.id + "'" : 'null') + ')">' + (isEdit ? 'Update' : 'Create') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function saveCommodity(comId) {
    var data = {
      name: document.getElementById('com-name').value.trim(),
      code: document.getElementById('com-code').value.trim() || undefined,
      description: document.getElementById('com-desc').value.trim(),
      rackType: document.getElementById('com-rackType').value,
      pickingPattern: document.getElementById('com-picking').value,
      loadPattern: document.getElementById('com-loadPattern').value,
      unloadPattern: document.getElementById('com-unloadPattern').value,
      dockDoor: document.getElementById('com-dockDoor').value.trim(),
      deliveryRoute: document.getElementById('com-deliveryRoute').value.trim(),
      stagingLane: document.getElementById('com-stagingLane').value.trim(),
      deliveryWindow: document.getElementById('com-deliveryWindow').value.trim(),
      lineSidePresentation: document.getElementById('com-lineSidePresentation').value,
      taktTime: parseInt(document.getElementById('com-taktTime').value) || 60,
      oemPlant: document.getElementById('com-oemPlant').value.trim(),
      packagingType: document.getElementById('com-packagingType').value,
      hazmatFlag: document.getElementById('com-hazmat').checked,
      active: document.getElementById('com-active').checked,
    };
    if (!data.name) { AutoSeq.alert('warning', 'Missing Name', 'Commodity name is required'); return; }
    if (comId) {
      AutoSeq.updateCommodity(comId, data);
      AutoSeq.alert('success', 'Commodity Updated', data.name);
    } else {
      AutoSeq.addCommodity(data);
      AutoSeq.alert('success', 'Commodity Added', data.name);
    }
    closeModal();
    switchView('commodities');
  }

  function editCommodity(id) { showCommodityModal(id); }

  function deleteCommodity(id) {
    const com = AutoSeq.state.commodities.find(c => c.id === id);
    if (!com) return;
    if (confirm('Delete commodity "' + com.name + '"?')) {
      AutoSeq.deleteCommodity(id);
      AutoSeq.alert('success', 'Deleted', 'Commodity removed');
      switchView('commodities');
    }
  }

  function filterCommodities() {
    const search = (document.getElementById('com-search') || {}).value || '';
    const rows = document.querySelectorAll('#com-table tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(search.toLowerCase()) ? '' : 'none';
    });
  }

  // ══════════════════════════════════════════════════════════
  //  ITEM MASTER VIEW
  // ══════════════════════════════════════════════════════════

  function renderItems() {
    const items = AutoSeq.state.items;
    const commodities = AutoSeq.state.commodities;

    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📋</span> Item Master — System Configuration<div class="panel-actions"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.showItemModal()">➕ Add Item</button></div></div><div class="panel-body">';

    // Toolbar
    html += '<div class="crud-toolbar">';
    html += '<input type="text" class="crud-search" id="itm-search" placeholder="Search items by number, description, commodity..." oninput="AutoSeqUI.filterItems()">';
    html += '<select class="crud-search" id="itm-filter-com" style="max-width:180px" onchange="AutoSeqUI.filterItems()"><option value="">All Commodities</option>';
    commodities.forEach(c => { html += `<option value="${c.code}">${c.name}</option>`; });
    html += '</select>';
    html += `<span class="text-sm text-muted">${items.length} items</span>`;
    html += '</div>';

    // Table
    html += '<table class="data-table" id="itm-table"><thead><tr><th>Item #</th><th>Customer PN</th><th>Description</th><th>Commodity</th><th>Color</th><th>Weight</th><th>UoM</th><th>Rack Type</th><th>Kit</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    items.forEach(item => {
      html += `<tr id="itm-row-${item.id}">
        <td class="font-mono font-bold text-purple">${AutoSeq.sanitize(item.itemNumber)}</td>
        <td class="font-mono">${AutoSeq.sanitize(item.customerPartNumber)}</td>
        <td style="font-family:var(--font-sans);font-size:11px">${AutoSeq.sanitize(item.description)}</td>
        <td>${AutoSeq.sanitize(item.commodityName)}</td>
        <td>${AutoSeq.sanitize(item.color || '—')}</td>
        <td>${item.weight || '—'}</td>
        <td>${item.uom || 'EA'}</td>
        <td class="font-mono">${item.rackType}</td>
        <td>${item.kitComponents ? item.kitComponents.length + ' comp' : '—'}</td>
        <td><span class="crud-badge ${item.active ? 'active' : 'inactive'}">${item.active ? 'Active' : 'Inactive'}</span></td>
        <td><div class="crud-row-actions">
          <button class="btn btn-sm" onclick="AutoSeqUI.editItem('${item.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="AutoSeqUI.deleteItem('${item.id}')">🗑️</button>
        </div></td>
      </tr>`;
    });
    html += '</tbody></table>';
    html += '</div></div>';
    return html;
  }

  function showItemModal(itemId) {
    var item = itemId ? AutoSeq.state.items.find(function(i) { return i.id === itemId; }) : null;
    var commodities = AutoSeq.state.commodities;
    var rackTypes = AutoSeq.state.rackTypes;
    var isEdit = !!item;
    var v = function(field, def) { return item ? (item[field] || def || '') : (def || ''); };

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'item-modal';
    modal.innerHTML =
      '<div class="modal" style="min-width:620px;max-height:85vh;overflow-y:auto">' +
        '<div class="modal-header">' + (isEdit ? '✏️ Edit' : '➕ Add') + ' Item<span class="modal-close" onclick="AutoSeqUI.closeModal()">✕</span></div>' +
        '<div class="modal-body">' +
          '<div style="font-size:11px;font-weight:600;color:var(--purple-light);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">📋 Item Info</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Item Number</label><input type="text" id="itm-itemNumber" value="' + AutoSeq.sanitize(v('itemNumber')) + '" placeholder="e.g. 68298041AB"></div>' +
            '<div class="form-group"><label>Customer Part Number</label><input type="text" id="itm-customerPartNumber" value="' + AutoSeq.sanitize(v('customerPartNumber')) + '"></div>' +
          '</div>' +
          '<div class="form-group"><label>Description</label><input type="text" id="itm-description" value="' + AutoSeq.sanitize(v('description')) + '"></div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Commodity</label><select id="itm-commodityCode">' +
              commodities.map(function(c) { return '<option value="' + c.code + '"' + (item && item.commodityCode === c.code ? ' selected' : '') + '>' + c.name + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="form-group"><label>Color / Variant</label><input type="text" id="itm-color" value="' + AutoSeq.sanitize(v('color')) + '"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Weight (kg)</label><input type="number" step="0.1" id="itm-weight" value="' + (v('weight') || 0) + '"></div>' +
            '<div class="form-group"><label>UoM</label><select id="itm-uom">' +
              ['EA','KG','SET','PR'].map(function(u) { return '<option value="' + u + '"' + (v('uom') === u ? ' selected' : '') + '>' + u + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Rack Type</label><select id="itm-rackType">' +
              rackTypes.map(function(r) { return '<option value="' + r.id + '"' + (item && item.rackType === r.id ? ' selected' : '') + '>' + r.name + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="form-group"><label>Picking Pattern</label><select id="itm-picking">' +
              '<option value="forward"' + (v('pickingPattern') === 'forward' ? ' selected' : '') + '>Forward</option>' +
              '<option value="reverse"' + (v('pickingPattern') === 'reverse' ? ' selected' : '') + '>Reverse</option>' +
            '</select></div>' +
          '</div>' +

          '<div style="font-size:11px;font-weight:600;color:var(--emerald-light);margin:14px 0 8px;text-transform:uppercase;letter-spacing:1px">🎯 Sequencing & Presentation Config</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Slot Position Override (0 = auto)</label><input type="number" id="itm-slotPosition" value="' + (v('slotPosition') || 0) + '" min="0" max="100" placeholder="0 = auto-assign"></div>' +
            '<div class="form-group"><label>Presentation Order (0 = auto)</label><input type="number" id="itm-presentationOrder" value="' + (v('presentationOrder') || 0) + '" min="0" placeholder="0 = auto"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Part Orientation in Rack</label><select id="itm-orientation">' +
              ['face-up','face-down','vertical','horizontal','angled'].map(function(o) { return '<option value="' + o + '"' + (v('orientation') === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="form-group"><label>Sequence Priority</label><select id="itm-sequencePriority">' +
              ['normal','high','critical','expedite'].map(function(p) { return '<option value="' + p + '"' + (v('sequencePriority') === p ? ' selected' : '') + '>' + p.charAt(0).toUpperCase() + p.slice(1) + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Line-Side Location</label><input type="text" id="itm-lineSideLocation" value="' + AutoSeq.sanitize(v('lineSideLocation')) + '" placeholder="e.g. STN-12, ZONE-A"></div>' +
            '<div class="form-group"><label>Label Type</label><select id="itm-labelType">' +
              ['AIAG-B3','AIAG-4x6','ZPL-128','ZPL-39','custom'].map(function(l) { return '<option value="' + l + '"' + (v('labelType') === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Barcode Format</label><select id="itm-barcodeFormat">' +
              ['code128','code39','code93','i2of5','ean13','datamatrix','qrcode'].map(function(b) { return '<option value="' + b + '"' + (v('barcodeFormat') === b ? ' selected' : '') + '>' + b + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="form-group"><label>Packaging Standard</label><input type="text" id="itm-packagingStandard" value="' + AutoSeq.sanitize(v('packagingStandard')) + '" placeholder="e.g. AIAG-4, OEM-SPEC"></div>' +
          '</div>' +
          '<div class="form-group"><label><input type="checkbox" id="itm-kittingRequired" ' + (v('kittingRequired') ? 'checked' : '') + '> Kitting Required (must be assembled before loading)</label></div>' +
          '<div class="form-group"><label><input type="checkbox" id="itm-active" ' + (!item || item.active ? 'checked' : '') + '> Active</label></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn" onclick="AutoSeqUI.closeModal()">Cancel</button>' +
          '<button class="btn btn-primary" onclick="AutoSeqUI.saveItem(' + (isEdit ? "'" + item.id + "'" : 'null') + ')">' + (isEdit ? 'Update' : 'Create') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function saveItem(itemId) {
    var comCode = document.getElementById('itm-commodityCode').value;
    var com = AutoSeq.state.commodities.find(function(c) { return c.code === comCode; });
    var data = {
      itemNumber: document.getElementById('itm-itemNumber').value.trim(),
      customerPartNumber: document.getElementById('itm-customerPartNumber').value.trim(),
      description: document.getElementById('itm-description').value.trim(),
      commodityCode: comCode,
      commodityName: com ? com.name : '',
      color: document.getElementById('itm-color').value.trim(),
      weight: parseFloat(document.getElementById('itm-weight').value) || 0,
      uom: document.getElementById('itm-uom').value,
      rackType: document.getElementById('itm-rackType').value,
      pickingPattern: document.getElementById('itm-picking').value,
      slotPosition: parseInt(document.getElementById('itm-slotPosition').value) || 0,
      presentationOrder: parseInt(document.getElementById('itm-presentationOrder').value) || 0,
      orientation: document.getElementById('itm-orientation').value,
      sequencePriority: document.getElementById('itm-sequencePriority').value,
      lineSideLocation: document.getElementById('itm-lineSideLocation').value.trim(),
      labelType: document.getElementById('itm-labelType').value,
      barcodeFormat: document.getElementById('itm-barcodeFormat').value,
      packagingStandard: document.getElementById('itm-packagingStandard').value.trim(),
      kittingRequired: document.getElementById('itm-kittingRequired').checked,
      active: document.getElementById('itm-active').checked,
    };
    if (!data.itemNumber) { AutoSeq.alert('warning', 'Missing Item Number', 'Item number is required'); return; }
    if (itemId) {
      AutoSeq.updateItem(itemId, data);
      AutoSeq.alert('success', 'Item Updated', data.itemNumber);
    } else {
      AutoSeq.addItem(data);
      AutoSeq.alert('success', 'Item Added', data.itemNumber);
    }
    closeModal();
    switchView('items');
  }

  function editItem(id) { showItemModal(id); }

  function deleteItem(id) {
    const item = AutoSeq.state.items.find(i => i.id === id);
    if (!item) return;
    if (confirm('Delete item "' + item.itemNumber + '"?')) {
      AutoSeq.deleteItem(id);
      AutoSeq.alert('success', 'Deleted', 'Item removed');
      switchView('items');
    }
  }

  function filterItems() {
    const search = ((document.getElementById('itm-search') || {}).value || '').toLowerCase();
    const comFilter = (document.getElementById('itm-filter-com') || {}).value || '';
    const rows = document.querySelectorAll('#itm-table tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const matchesSearch = !search || text.includes(search);
      const matchesCom = !comFilter || text.includes(comFilter.toLowerCase());
      row.style.display = (matchesSearch && matchesCom) ? '' : 'none';
    });
  }

  // ══════════════════════════════════════════════════════════
  //  ROUTES & DELIVERY VIEW
  // ══════════════════════════════════════════════════════════

  function renderRoutes() {
    var routes = AutoSeq.state.routes;
    var deliveries = AutoSeq.state.deliveries;
    var dlvStats = AutoSeq.getDeliveryStats();
    var routeStats = AutoSeq.getRouteStats();
    var racks = AutoSeq.state.racks;

    var html = '';

    // Stat cards
    html += '<div class="dashboard-grid" style="margin-bottom:14px">';
    html += '<div class="stat-card" style="--accent-color:var(--purple);padding:12px"><div class="stat-label">Total Deliveries</div><div class="stat-value" style="font-size:20px">' + dlvStats.total + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--yellow);padding:12px"><div class="stat-label">Pending</div><div class="stat-value" style="font-size:20px;color:var(--yellow)">' + dlvStats.pending + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--blue);padding:12px"><div class="stat-label">In Transit</div><div class="stat-value" style="font-size:20px;color:var(--blue)">' + dlvStats.inTransit + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:12px"><div class="stat-label">Delivered</div><div class="stat-value" style="font-size:20px">' + dlvStats.delivered + '</div></div>';
    html += '</div>';

    // Route flow map
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🗺️</span> Inter-Building Route Map</div><div class="panel-body">';
    html += '<div class="route-map"><div class="route-flow">';
    var buildings = [];
    routes.forEach(function(r) {
      if (buildings.indexOf(r.fromBuilding) === -1) buildings.push(r.fromBuilding);
      if (buildings.indexOf(r.toBuilding) === -1) buildings.push(r.toBuilding);
    });
    buildings.forEach(function(b, i) {
      if (i > 0) html += '<span class="route-arrow">→</span>';
      html += '<div class="route-node' + (i === 0 ? ' source' : i === buildings.length - 1 ? ' dest' : '') + '">🏢 ' + AutoSeq.sanitize(b) + '</div>';
    });
    html += '</div></div>';
    html += '</div></div>';

    // Routes table
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🚚</span> Delivery Routes<div class="panel-actions"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.showRouteModal()">➕ Add Route</button></div></div><div class="panel-body">';
    html += '<table class="data-table"><thead><tr><th>Route ID</th><th>Name</th><th>From</th><th>To</th><th>Distance</th><th>Transit</th><th>Deliveries</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    routeStats.forEach(function(rs) {
      var route = routes.find(function(r) { return r.id === rs.routeId; });
      html += '<tr>' +
        '<td class="font-mono font-bold text-purple">' + rs.routeId + '</td>' +
        '<td>' + AutoSeq.sanitize(rs.routeName) + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(rs.from) + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(rs.to) + '</td>' +
        '<td class="font-mono">' + (route ? route.distance + 'm' : '—') + '</td>' +
        '<td class="font-mono">' + rs.avgTransitTime + 'min</td>' +
        '<td>' + rs.totalDeliveries + ' (' + rs.pending + ' pend, ' + rs.inTransit + ' transit, ' + rs.delivered + ' done)</td>' +
        '<td><span class="crud-badge ' + (route && route.active ? 'active' : 'inactive') + '">' + (route && route.active ? 'Active' : 'Inactive') + '</span></td>' +
        '<td><button class="btn btn-sm btn-danger" onclick="AutoSeqUI.deleteRoute(\'' + rs.routeId + '\')">🗑️</button></td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '</div></div>';

    // Create delivery ticket
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📋</span> Create Delivery Ticket</div><div class="panel-body">';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label>Route</label><select id="dlv-route">';
    routes.forEach(function(r) { html += '<option value="' + r.id + '">' + r.name + ' (' + r.fromBuilding + ' → ' + r.toBuilding + ')</option>'; });
    html += '</select></div>';
    html += '<div class="form-group"><label>Driver</label><input type="text" id="dlv-driver" placeholder="Driver name"></div>';
    html += '<div class="form-group"><label>Vehicle</label><input type="text" id="dlv-vehicle" placeholder="TUGGER-01, TRUCK-3"></div>';
    html += '</div>';
    html += '<div class="form-group"><label>Select Racks to Deliver</label><div style="max-height:120px;overflow-y:auto;background:var(--bg-tertiary);border-radius:var(--radius);padding:6px">';
    if (racks.length === 0) {
      html += '<div class="text-muted text-sm" style="padding:8px">No racks available. Create racks in Rack Loading first.</div>';
    } else {
      racks.forEach(function(rack) {
        html += '<label style="display:block;padding:4px 6px;font-size:11px;cursor:pointer"><input type="checkbox" value="' + rack.id + '" class="dlv-rack-cb"> ' + rack.id + ' — ' + AutoSeq.sanitize(rack.lineName) + ' (' + rack.loadedCount + '/' + rack.slotCount + ' loaded)</label>';
      });
    }
    html += '</div></div>';
    html += '<div class="form-group"><label>Notes</label><input type="text" id="dlv-notes" placeholder="Delivery notes..."></div>';
    html += '<button class="btn btn-emerald" onclick="AutoSeqUI.createDeliveryTicket()">📋 Create Delivery Ticket</button>';
    html += '</div></div>';

    // Active deliveries
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📦</span> Active Deliveries</div><div class="panel-body">';
    if (deliveries.length === 0) {
      html += '<p class="text-muted text-center" style="padding:20px">No delivery tickets. Create one above.</p>';
    } else {
      html += '<table class="data-table"><thead><tr><th>Ticket</th><th>Route</th><th>From → To</th><th>Racks</th><th>Driver</th><th>Vehicle</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
      deliveries.slice().reverse().forEach(function(d) {
        var statusBadge = d.status === 'pending' ? 'status-pending' : d.status === 'in_transit' ? 'status-loaded' : d.status === 'delivered' ? 'status-complete' : 'status-shipped';
        var createdStr = d.createdAt ? d.createdAt.toLocaleTimeString() : '--';
        html += '<tr>' +
          '<td class="font-mono font-bold text-purple">' + d.ticketNumber + '</td>' +
          '<td>' + AutoSeq.sanitize(d.routeName) + '</td>' +
          '<td style="font-size:10px">' + AutoSeq.sanitize(d.fromBuilding) + ' → ' + AutoSeq.sanitize(d.toBuilding) + '</td>' +
          '<td class="font-mono" style="font-size:10px">' + (d.rackIds || []).join(', ') + '</td>' +
          '<td>' + AutoSeq.sanitize(d.driver || '—') + '</td>' +
          '<td>' + AutoSeq.sanitize(d.vehicle || '—') + '</td>' +
          '<td class="font-mono" style="font-size:10px">' + createdStr + '</td>' +
          '<td><span class="status-badge ' + statusBadge + '">' + d.status.replace(/_/g, ' ') + '</span></td>' +
          '<td><div class="crud-row-actions">';
        if (d.status === 'pending') html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.advanceDelivery(\'' + d.id + '\',\'in_transit\')">🚚 Dispatch</button>';
        else if (d.status === 'in_transit') html += '<button class="btn btn-sm" onclick="AutoSeqUI.advanceDelivery(\'' + d.id + '\',\'delivered\')">✓ Delivered</button>';
        else if (d.status === 'delivered') html += '<button class="btn btn-sm btn-primary" onclick="AutoSeqUI.advanceDelivery(\'' + d.id + '\',\'confirmed\')">✓ Confirm</button>';
        html += '</div></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div></div>';

    return html;
  }

  function showRouteModal() {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'route-modal';
    modal.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header">➕ Add Route<span class="modal-close" onclick="AutoSeqUI.closeModal()">✕</span></div>' +
        '<div class="modal-body">' +
          '<div class="form-group"><label>Route Name</label><input type="text" id="rt-name" placeholder="e.g. Warehouse → Kitting"></div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>From Building</label><input type="text" id="rt-from" placeholder="Bldg E (Warehouse)"></div>' +
            '<div class="form-group"><label>To Building</label><input type="text" id="rt-to" placeholder="Bldg D (Kitting)"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Distance (meters)</label><input type="number" id="rt-distance" value="100"></div>' +
            '<div class="form-group"><label>Transit Time (minutes)</label><input type="number" id="rt-transit" value="5"></div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer"><button class="btn" onclick="AutoSeqUI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="AutoSeqUI.saveRoute()">Create</button></div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function saveRoute() {
    var data = {
      name: document.getElementById('rt-name').value.trim(),
      fromBuilding: document.getElementById('rt-from').value.trim(),
      toBuilding: document.getElementById('rt-to').value.trim(),
      distance: parseInt(document.getElementById('rt-distance').value) || 0,
      transitTime: parseInt(document.getElementById('rt-transit').value) || 5,
    };
    if (!data.name) { AutoSeq.alert('warning', 'Missing Name', 'Route name required'); return; }
    AutoSeq.addRoute(data);
    AutoSeq.alert('success', 'Route Added', data.name);
    closeModal();
    switchView('routes');
  }

  function deleteRoute(id) {
    if (confirm('Delete this route?')) {
      AutoSeq.deleteRoute(id);
      AutoSeq.alert('success', 'Deleted', 'Route removed');
      switchView('routes');
    }
  }

  function createDeliveryTicket() {
    var routeId = document.getElementById('dlv-route').value;
    var route = AutoSeq.state.routes.find(function(r) { return r.id === routeId; });
    var rackIds = [];
    document.querySelectorAll('.dlv-rack-cb:checked').forEach(function(cb) { rackIds.push(cb.value); });
    var data = {
      routeId: routeId,
      routeName: route ? route.name : '',
      fromBuilding: route ? route.fromBuilding : '',
      toBuilding: route ? route.toBuilding : '',
      rackIds: rackIds,
      driver: document.getElementById('dlv-driver').value.trim(),
      vehicle: document.getElementById('dlv-vehicle').value.trim(),
      notes: document.getElementById('dlv-notes').value.trim(),
    };
    var dlv = AutoSeq.createDelivery(data);
    AutoSeq.alert('success', 'Delivery Ticket Created', dlv.ticketNumber + ' — ' + (route ? route.name : ''));
    switchView('routes');
  }

  function advanceDelivery(id, status) {
    AutoSeq.updateDeliveryStatus(id, status);
    var dlv = AutoSeq.state.deliveries.find(function(d) { return d.id === id; });
    AutoSeq.alert('success', 'Delivery Updated', dlv.ticketNumber + ' → ' + status.replace(/_/g, ' '));
    switchView('routes');
  }

  // ══════════════════════════════════════════════════════════
  //  FORKLIFT FLEET VIEW (Mitsubishi Logisnext)
  // ══════════════════════════════════════════════════════════

  var flViewMode = 'table';

  function renderForklifts() {
    var flStats = AutoSeq.getForkliftStats();
    var forklifts = AutoSeq.state.forklifts;

    var html = '';

    // Stat cards
    html += '<div class="dashboard-grid" style="margin-bottom:14px">';
    html += '<div class="stat-card" style="--accent-color:var(--purple);padding:12px"><div class="stat-label">Total Fleet</div><div class="stat-value" style="font-size:20px">' + flStats.total + '</div><div class="stat-sub">4 brands</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:12px"><div class="stat-label">Active</div><div class="stat-value" style="font-size:20px">' + flStats.active + '</div><div class="stat-sub">' + flStats.assigned + ' assigned</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--red);padding:12px"><div class="stat-label">Maintenance</div><div class="stat-value" style="font-size:20px;color:' + (flStats.maintenance > 0 ? 'var(--red)' : 'var(--emerald)') + '">' + flStats.maintenance + '</div><div class="stat-sub">' + flStats.maintenanceOverdue + ' overdue</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--blue);padding:12px"><div class="stat-label">Lift Link</div><div class="stat-value" style="font-size:20px;color:var(--blue)">' + flStats.telematicsConnected + '</div><div class="stat-sub">telematics connected</div></div>';
    html += '</div>';

    // View toggle
    html += '<div class="fl-view-controls">';
    html += '<button class="btn btn-sm ' + (flViewMode === 'table' ? 'btn-primary' : '') + '" onclick="AutoSeqUI.setFlView(\'table\')">📋 Table View</button>';
    html += '<button class="btn btn-sm ' + (flViewMode === '2d' ? 'btn-primary' : '') + '" onclick="AutoSeqUI.setFlView(\'2d\')">📐 2D Diagrams</button>';
    html += '<button class="btn btn-sm ' + (flViewMode === '3d' ? 'btn-primary' : '') + '" onclick="AutoSeqUI.setFlView(\'3d\')">📦 3D Visual</button>';
    html += '<button class="btn btn-sm ' + (flViewMode === 'build' ? 'btn-primary' : '') + '" onclick="AutoSeqUI.setFlView(\'build\')">🔧 Fork Build Config</button>';
    html += '<button class="btn btn-sm ' + (flViewMode === 'sap' ? 'btn-primary' : '') + '" onclick="AutoSeqUI.setFlView(\'sap\')">🟡 SAP Integration</button>';
    html += '<button class="btn btn-primary btn-sm" onclick="AutoSeqUI.showForkliftModal()">➕ Add Forklift</button>';
    html += '</div>';

    if (flViewMode === '2d') {
      html += renderForklift2D(forklifts);
    } else if (flViewMode === '3d') {
      html += renderForklift3D(forklifts);
    } else if (flViewMode === 'build') {
      html += renderForkBuild(forklifts);
    } else if (flViewMode === 'sap') {
      html += renderSapIntegration(forklifts);
    } else {

    html += '<table class="data-table"><thead><tr><th>Unit #</th><th>Brand</th><th>Model</th><th>Type</th><th>Cap (lb)</th><th>Power</th><th>Hours</th><th>Maint</th><th>Lift Link</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    forklifts.forEach(function(fl) {
      var maintBadge = fl.maintenanceStatus === 'ok' ? 'status-active' : fl.maintenanceStatus === 'due' ? 'status-pending' : 'status-error';
      var llBadge = fl.liftLinkConnected ? '<span style="color:var(--emerald)">●</span>' : '<span style="color:var(--red)">○</span>';
      html += '<tr id="fl-row-' + fl.id + '">' +
        '<td class="font-mono font-bold text-purple">' + AutoSeq.sanitize(fl.unitNumber) + '</td>' +
        '<td>' + AutoSeq.sanitize(fl.brand) + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(fl.model) + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(fl.type) + '</td>' +
        '<td class="font-mono">' + fl.capacity + '</td>' +
        '<td style="font-size:10px">' + fl.powerSource + '</td>' +
        '<td class="font-mono">' + fl.hourMeter.toFixed(1) + 'h</td>' +
        '<td><span class="status-badge ' + maintBadge + '">' + fl.maintenanceStatus + '</span></td>' +
        '<td>' + llBadge + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(fl.currentLocation) + '</td>' +
        '<td><span class="status-badge status-' + fl.status + '">' + fl.status + '</span></td>' +
        '<td><div class="crud-row-actions">' +
          '<button class="btn btn-sm" onclick="AutoSeqUI.editForklift(\'' + fl.id + '\')">✏️</button>' +
          '<button class="btn btn-sm btn-danger" onclick="AutoSeqUI.deleteForklift(\'' + fl.id + '\')">🗑️</button>' +
        '</div></td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '</div></div>';
    } // end else (table view)

    return html;
  }

  // ── Forklift Modal ──
  function setFlView(mode) { flViewMode = mode; switchView('forklifts'); }

  function renderForklift2D(forklifts) {
    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📐</span> 2D Forklift Diagrams — Side View</div><div class="panel-body">';
    html += '<div class="fl2d-stage">';
    forklifts.forEach(function(fl) {
      var cardCls = 'fl2d-card';
      if (fl.status === 'maintenance') cardCls += ' maintenance';
      else if (fl.status === 'assigned') cardCls += ' assigned';
      html += '<div class="' + cardCls + '">';
      html += '<div class="fl2d-svg-wrap">' + ForkliftVisual.generate2DSVG(fl) + '</div>';
      html += '<div class="fl2d-info">';
      html += '<div class="fl2d-info-row"><span>Unit</span><span class="font-mono font-bold text-purple">' + AutoSeq.sanitize(fl.unitNumber) + '</span></div>';
      html += '<div class="fl2d-info-row"><span>Brand/Model</span><span>' + AutoSeq.sanitize(fl.brand) + ' ' + AutoSeq.sanitize(fl.model) + '</span></div>';
      html += '<div class="fl2d-info-row"><span>Type</span><span>' + AutoSeq.sanitize(fl.type) + '</span></div>';
      html += '<div class="fl2d-info-row"><span>Hours</span><span class="font-mono">' + fl.hourMeter.toFixed(1) + 'h</span></div>';
      html += '<div class="fl2d-info-row"><span>Location</span><span>' + AutoSeq.sanitize(fl.currentLocation) + '</span></div>';
      html += '<div style="margin-top:4px"><span class="fl2d-badge ' + fl.status + '">' + fl.status + '</span> ';
      html += '<span class="fl2d-badge ' + fl.maintenanceStatus + '">' + fl.maintenanceStatus + '</span></div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div></div></div>';
    return html;
  }

  function renderForklift3D(forklifts) {
    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📦</span> 3D Forklift Visual — Interactive</div><div class="panel-body">';
    html += '<div class="text-sm text-muted mb-2">Click rotation buttons to change view angle. Green glow = load on forks (assigned).</div>';
    forklifts.forEach(function(fl) {
      html += '<div style="margin-bottom:16px;border:1px solid var(--border);border-radius:var(--radius);padding:12px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      html += '<div><strong>' + AutoSeq.sanitize(fl.unitNumber) + '</strong> — ' + AutoSeq.sanitize(fl.brand) + ' ' + AutoSeq.sanitize(fl.model) + ' (' + AutoSeq.sanitize(fl.type) + ')</div>';
      html += '<span class="fl2d-badge ' + fl.status + '">' + fl.status + '</span>';
      html += '</div>';
      html += ForkliftVisual.generate3DHTML(fl);
      html += '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function renderForkBuild(forklifts) {
    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">🔧</span> Fork Build Configuration — Dimensional Diagrams</div><div class="panel-body">';
    html += '<div class="text-sm text-muted mb-2">Dimensional build specs for each forklift. OAL = Overall Length, MH = Mast Height, FL = Fork Length.</div>';
    forklifts.forEach(function(fl) {
      var specs = ForkliftVisual.getForkSpecs(fl);
      html += '<div class="fl-build-panel">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      html += '<div><strong>' + AutoSeq.sanitize(fl.unitNumber) + '</strong> — ' + AutoSeq.sanitize(fl.brand) + ' ' + AutoSeq.sanitize(fl.model) + '</div>';
      html += '<span class="fl2d-badge ' + fl.maintenanceStatus + '">' + fl.maintenanceStatus + '</span>';
      html += '</div>';
      html += '<div class="fl-build-preview">';
      html += '<div class="fl-build-diagram">' + ForkliftVisual.generateBuildDiagram(fl) + '</div>';
      html += '<div class="fl-build-config">';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Fork Length</span><span class="fl-spec-value">' + specs.forkLength + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Fork Thickness</span><span class="fl-spec-value">' + specs.forkThickness + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Fork Spacing</span><span class="fl-spec-value">' + specs.forkSpacing + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Mast Height</span><span class="fl-spec-value">' + specs.mastHeight + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Mast Type</span><span class="fl-spec-value">' + specs.mastType + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Lift Height</span><span class="fl-spec-value">' + specs.mastLiftHeight + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Tire Type</span><span class="fl-spec-value">' + specs.tireType + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Tire Size</span><span class="fl-spec-value">' + specs.tireSize + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Load Center</span><span class="fl-spec-value">' + specs.loadCenter + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Overall Length</span><span class="fl-spec-value">' + specs.overallLength + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Overall Width</span><span class="fl-spec-value">' + specs.overallWidth + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Overall Height</span><span class="fl-spec-value">' + specs.overallHeight + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Ground Clearance</span><span class="fl-spec-value">' + specs.groundClearance + '</span></div>';
      html += '<div class="fl-spec-row"><span class="fl-spec-label">Turning Radius</span><span class="fl-spec-value">' + specs.turningRadius + '</span></div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div></div>';
    return html;
  }

  // ── SAP Integration View ──
  function renderSapIntegration(forklifts) {
    var sapSummary = SapForklift.getFleetSapSummary(forklifts);

    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">🟡</span> SAP PM Integration — Equipment Master & Maintenance Orders</div><div class="panel-body">';

    // SAP summary cards
    html += '<div class="dashboard-grid" style="margin-bottom:14px">';
    html += '<div class="stat-card" style="--accent-color:var(--yellow);padding:10px"><div class="stat-label">Equipment Master</div><div class="stat-value" style="font-size:18px">' + sapSummary.withEquipmentMaster + '/' + sapSummary.total + '</div><div class="stat-sub">' + sapSummary.sapCoverage + '% coverage</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--blue);padding:10px"><div class="stat-label">Open PM Orders</div><div class="stat-value" style="font-size:18px;color:var(--blue)">' + sapSummary.openPmOrders + '</div><div class="stat-sub">active maintenance</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--red);padding:10px"><div class="stat-label">Overdue Service</div><div class="stat-value" style="font-size:18px;color:var(--red)">' + sapSummary.overdueService + '</div><div class="stat-sub">' + sapSummary.dueService + ' due soon</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:10px"><div class="stat-label">Lift Link → SAP</div><div class="stat-value" style="font-size:18px">' + sapSummary.telematicsConnected + '</div><div class="stat-sub">auto measurement docs</div></div>';
    html += '</div>';

    // SAP actions toolbar
    html += '<div class="flex gap-2 mb-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-sm btn-primary" onclick="AutoSeqUI.sapExportEquipment()">📤 Export Equipment IDoc</button>';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.sapExportMeasurements()">📊 Export Measurement IDoc</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.sapExportOrders()">📋 Export PM Orders IDoc</button>';
    html += '</div>';

    // Per-forklift SAP details table
    html += '<table class="data-table"><thead><tr><th>Unit</th><th>Equip #</th><th>Func Loc</th><th>Cost Center</th><th>Work Center</th><th>ABC</th><th>PM Order</th><th>Order Status</th><th>Last Svc</th><th>Next Svc</th><th>Actions</th></tr></thead><tbody>';
    forklifts.forEach(function(fl) {
      var osBadge = fl.sapPmOrderStatus === 'none' ? 'status-active' : fl.sapPmOrderStatus === 'in_progress' ? 'status-error' : (fl.sapPmOrderStatus === 'open' || fl.sapPmOrderStatus === 'created') ? 'status-pending' : 'status-complete';
      html += '<tr><td class="font-mono font-bold text-purple">' + AutoSeq.sanitize(fl.unitNumber) + '</td>' +
        '<td class="font-mono">' + AutoSeq.sanitize(fl.sapEquipmentNumber || '—') + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(fl.sapFunctionalLocation || '—') + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(fl.sapCostCenter || '—') + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(fl.sapWorkCenter || '—') + '</td>' +
        '<td class="font-mono font-bold">' + AutoSeq.sanitize(fl.sapAbcIndicator || 'B') + '</td>' +
        '<td class="font-mono">' + AutoSeq.sanitize(fl.sapActivePmOrder || '—') + '</td>' +
        '<td><span class="status-badge ' + osBadge + '">' + fl.sapPmOrderStatus + '</span></td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(fl.sapLastServiceDate || '—') + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(fl.sapNextServiceDate || '—') + '</td>' +
        '<td><div class="crud-row-actions">' +
          '<button class="btn btn-sm" onclick="AutoSeqUI.sapCreateOrder(\'' + fl.id + '\')" title="Create PM Order">➕</button>' +
          '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.sapReleaseOrder(\'' + fl.id + '\')" title="Release">🔓</button>' +
          '<button class="btn btn-sm" onclick="AutoSeqUI.sapTecoOrder(\'' + fl.id + '\')" title="TECO">✓</button>' +
          '<button class="btn btn-sm btn-danger" onclick="AutoSeqUI.sapCloseOrder(\'' + fl.id + '\')" title="Close">🔒</button>' +
          '<button class="btn btn-sm" onclick="AutoSeqUI.sapMeasureDoc(\'' + fl.id + '\')" title="Meas Doc">📊</button>' +
        '</div></td></tr>';
    });
    html += '</tbody></table>';

    // BAPI reference
    html += '<div style="margin-top:14px;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius);font-size:11px;line-height:1.6">';
    html += '<div style="font-weight:600;color:var(--yellow);margin-bottom:6px">🟡 SAP PM BAPI Functions (Simulated)</div>';
    html += '<div style="color:var(--text-secondary)">';
    html += '<code>BAPI_EQUI_CREATE</code> — Create equipment master record (EQUI/IFLOT)<br>';
    html += '<code>BAPI_ALM_ORDER_MAINTAIN</code> — Create/release/TECO/close PM orders<br>';
    html += '<code>BAPI_MEASM_DOCUM_MULTI_RECORD</code> — Create measurement docs (hour meter)<br>';
    html += '<code>IDoc EQUI_CREATE</code> — Batch equipment via IDoc (E1EQUZ, E1IFLO, E1MEASM, E1PMORD)<br>';
    html += '<code>IDoc ALM_ORDER</code> — Batch PM orders via IDoc (E1AUFK, E1AFKO, E1Operation)<br>';
    html += '<br><strong>Production:</strong> Connect via SAP RFC (node-rfc) or SAP PI/PO. Lift Link auto-creates measurement docs.';
    html += '</div></div>';

    html += '</div></div>';
    return html;
  }

  function sapExportEquipment() {
    var data = SapForklift.generateFleetIDoc(AutoSeq.state.forklifts);
    downloadFile(data, 'owllogics_sap_equipment_idoc.txt', 'text/plain');
    AutoSeq.alert('success', 'Exported', 'SAP Equipment IDoc — ' + AutoSeq.state.forklifts.length + ' forklifts');
  }
  function sapExportMeasurements() {
    var data = SapForklift.generateMeasurementIDoc(AutoSeq.state.forklifts);
    downloadFile(data, 'owllogics_sap_measurement_idoc.txt', 'text/plain');
    AutoSeq.alert('success', 'Exported', 'SAP Measurement IDoc');
  }
  function sapExportOrders() {
    var data = SapForklift.generatePmOrdersIDoc(AutoSeq.state.forklifts);
    downloadFile(data, 'owllogics_sap_pm_orders_idoc.txt', 'text/plain');
    AutoSeq.alert('success', 'Exported', 'SAP PM Orders IDoc');
  }
  function sapCreateOrder(flId) {
    var fl = AutoSeq.state.forklifts.find(function(f) { return f.id === flId; });
    if (!fl) return;
    var result = SapForklift.createPmOrder(fl, 'PM01', 'Scheduled A-service for ' + fl.unitNumber);
    fl.sapActivePmOrder = result.orderNumber;
    fl.sapPmOrderStatus = 'created';
    fl.sapOrderHistory = fl.sapOrderHistory || [];
    fl.sapOrderHistory.push({ order: result.orderNumber, type: 'PM01', date: result.plannedStartDate, desc: result.description, status: 'created' });
    AutoSeq.updateForklift(flId, { sapActivePmOrder: result.orderNumber, sapPmOrderStatus: 'created', sapOrderHistory: fl.sapOrderHistory });
    AutoSeq.alert('success', 'PM Order Created', result.message);
    switchView('forklifts');
  }
  function sapReleaseOrder(flId) {
    var fl = AutoSeq.state.forklifts.find(function(f) { return f.id === flId; });
    if (!fl) return;
    var result = SapForklift.releasePmOrder(fl);
    if (result.success) { AutoSeq.updateForklift(flId, { sapPmOrderStatus: 'released' }); AutoSeq.alert('success', 'Released', result.message); }
    else { AutoSeq.alert('warning', 'Cannot Release', result.message); }
    switchView('forklifts');
  }
  function sapTecoOrder(flId) {
    var fl = AutoSeq.state.forklifts.find(function(f) { return f.id === flId; });
    if (!fl) return;
    var result = SapForklift.tecoPmOrder(fl);
    if (result.success) { AutoSeq.updateForklift(flId, { sapPmOrderStatus: 'teco', status: 'active', maintenanceStatus: 'ok', sapLastServiceDate: result.actualFinishDate, sapActivePmOrder: '' }); AutoSeq.alert('success', 'TECO', result.message); }
    else { AutoSeq.alert('warning', 'Cannot Complete', result.message); }
    switchView('forklifts');
  }
  function sapCloseOrder(flId) {
    var fl = AutoSeq.state.forklifts.find(function(f) { return f.id === flId; });
    if (!fl) return;
    var result = SapForklift.closePmOrder(fl);
    if (result.success) { AutoSeq.updateForklift(flId, { sapPmOrderStatus: 'closed', sapActivePmOrder: '' }); AutoSeq.alert('success', 'Closed', result.message); }
    else { AutoSeq.alert('warning', 'Cannot Close', result.message); }
    switchView('forklifts');
  }
  function sapMeasureDoc(flId) {
    var fl = AutoSeq.state.forklifts.find(function(f) { return f.id === flId; });
    if (!fl) return;
    var result = SapForklift.createMeasurementDoc(fl);
    AutoSeq.alert('success', 'Measurement Doc', result.message + ' — ' + fl.hourMeter.toFixed(1) + 'h');
  }

  function showForkliftModal(flId) {
    var fl = flId ? AutoSeq.state.forklifts.find(function(f) { return f.id === flId; }) : null;
    var isEdit = !!fl;
    var v = function(field, def) { return fl ? (fl[field] || def || '') : (def || ''); };

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'forklift-modal';
    modal.innerHTML =
      '<div class="modal" style="min-width:600px;max-height:85vh;overflow-y:auto">' +
        '<div class="modal-header">' + (isEdit ? '✏️ Edit' : '➕ Add') + ' Forklift<span class="modal-close" onclick="AutoSeqUI.closeModal()">✕</span></div>' +
        '<div class="modal-body">' +
          '<div style="font-size:11px;font-weight:600;color:var(--purple-light);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">🚜 Equipment Info</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Unit Number</label><input type="text" id="fl-unitNumber" value="' + AutoSeq.sanitize(v('unitNumber')) + '" placeholder="MIT-1043"></div>' +
            '<div class="form-group"><label>Brand</label><select id="fl-brand">' +
              ['Mitsubishi','Cat','Jungheinrich','UniCarriers'].map(function(b) { return '<option value="' + b + '"' + (v('brand') === b ? ' selected' : '') + '>' + b + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Model</label><input type="text" id="fl-model" value="' + AutoSeq.sanitize(v('model')) + '" placeholder="FBC20Q"></div>' +
            '<div class="form-group"><label>Type</label><select id="fl-type">' +
              ['Electric Cushion','IC Cushion','IC Pneumatic','Reach Truck','Electric Pallet','Order Picker','Tow Tractor'].map(function(t) { return '<option value="' + t + '"' + (v('type') === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Capacity (lb)</label><input type="number" id="fl-capacity" value="' + (v('capacity') || 4000) + '"></div>' +
            '<div class="form-group"><label>Power Source</label><select id="fl-powerSource">' +
              ['electric','lpg','diesel','gasoline'].map(function(p) { return '<option value="' + p + '"' + (v('powerSource') === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Serial Number</label><input type="text" id="fl-serialNumber" value="' + AutoSeq.sanitize(v('serialNumber')) + '"></div>' +
            '<div class="form-group"><label>Battery SN (if electric)</label><input type="text" id="fl-batterySN" value="' + AutoSeq.sanitize(v('batterySN')) + '"></div>' +
          '</div>' +

          '<div style="font-size:11px;font-weight:600;color:var(--emerald-light);margin:14px 0 8px;text-transform:uppercase;letter-spacing:1px">📡 Telematics & Maintenance</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Telematics ID (Lift Link)</label><input type="text" id="fl-telematicsId" value="' + AutoSeq.sanitize(v('telematicsId')) + '" placeholder="LL-TM-001"></div>' +
            '<div class="form-group"><label>Hour Meter</label><input type="number" step="0.1" id="fl-hourMeter" value="' + (v('hourMeter') || 0) + '"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Maintenance Due (hours)</label><input type="number" id="fl-maintenanceDue" value="' + (v('maintenanceDue') || 500) + '"></div>' +
            '<div class="form-group"><label>Maintenance Status</label><select id="fl-maintenanceStatus">' +
              ['ok','due','overdue'].map(function(m) { return '<option value="' + m + '"' + (v('maintenanceStatus') === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Current Location</label><input type="text" id="fl-currentLocation" value="' + AutoSeq.sanitize(v('currentLocation')) + '" placeholder="Bldg A (Sequencing)"></div>' +
            '<div class="form-group"><label>Status</label><select id="fl-status">' +
              ['active','assigned','maintenance','inactive'].map(function(s) { return '<option value="' + s + '"' + (v('status') === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="form-group"><label><input type="checkbox" id="fl-liftLinkConnected" ' + (v('liftLinkConnected') ? 'checked' : '') + '> Lift Link Telematics Connected</label></div>' +
          '<div class="form-group"><label>Notes</label><input type="text" id="fl-notes" value="' + AutoSeq.sanitize(v('notes')) + '"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn" onclick="AutoSeqUI.closeModal()">Cancel</button>' +
          '<button class="btn btn-primary" onclick="AutoSeqUI.saveForklift(' + (isEdit ? "'" + fl.id + "'" : 'null') + ')">' + (isEdit ? 'Update' : 'Create') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function saveForklift(flId) {
    var data = {
      unitNumber: document.getElementById('fl-unitNumber').value.trim(),
      brand: document.getElementById('fl-brand').value,
      model: document.getElementById('fl-model').value.trim(),
      type: document.getElementById('fl-type').value,
      capacity: parseInt(document.getElementById('fl-capacity').value) || 4000,
      powerSource: document.getElementById('fl-powerSource').value,
      serialNumber: document.getElementById('fl-serialNumber').value.trim(),
      batterySN: document.getElementById('fl-batterySN').value.trim(),
      telematicsId: document.getElementById('fl-telematicsId').value.trim(),
      hourMeter: parseFloat(document.getElementById('fl-hourMeter').value) || 0,
      maintenanceDue: parseInt(document.getElementById('fl-maintenanceDue').value) || 500,
      maintenanceStatus: document.getElementById('fl-maintenanceStatus').value,
      currentLocation: document.getElementById('fl-currentLocation').value.trim(),
      status: document.getElementById('fl-status').value,
      liftLinkConnected: document.getElementById('fl-liftLinkConnected').checked,
      notes: document.getElementById('fl-notes').value.trim(),
    };
    if (!data.unitNumber) { AutoSeq.alert('warning', 'Missing Unit Number', 'Unit number is required'); return; }
    if (flId) {
      AutoSeq.updateForklift(flId, data);
      AutoSeq.alert('success', 'Forklift Updated', data.unitNumber);
    } else {
      AutoSeq.addForklift(data);
      AutoSeq.alert('success', 'Forklift Added', data.unitNumber);
    }
    closeModal();
    switchView('forklifts');
  }

  function editForklift(id) { showForkliftModal(id); }

  function deleteForklift(id) {
    if (confirm('Delete this forklift from the fleet?')) {
      AutoSeq.deleteForklift(id);
      AutoSeq.alert('success', 'Deleted', 'Forklift removed from fleet');
      switchView('forklifts');
    }
  }

  // ══════════════════════════════════════════════════════════
  //  REPORTS VIEW
  // ══════════════════════════════════════════════════════════

  function renderReports() {
    var stats = AutoSeq.getStats();
    var dlvStats = AutoSeq.getDeliveryStats();
    var routeStats = AutoSeq.getRouteStats();
    var summary = AutoSeq.getSequenceSummary();

    var html = '';

    // Summary cards
    html += '<div class="report-summary-grid">';
    html += '<div class="stat-card" style="--accent-color:var(--purple);padding:12px"><div class="stat-label">Sequences</div><div class="stat-value" style="font-size:20px">' + stats.totalSequences + '</div><div class="stat-sub">' + stats.pending + ' pending, ' + stats.loaded + ' loaded</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:12px"><div class="stat-label">Racks</div><div class="stat-value" style="font-size:20px">' + stats.totalRacks + '</div><div class="stat-sub">' + stats.completeRacks + ' complete</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--red);padding:12px"><div class="stat-label">Errors</div><div class="stat-value" style="font-size:20px;color:' + (stats.rackErrors > 0 ? 'var(--red)' : 'var(--emerald)') + '">' + stats.rackErrors + '</div><div class="stat-sub">Poka-yoke violations</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--blue);padding:12px"><div class="stat-label">Deliveries</div><div class="stat-value" style="font-size:20px;color:var(--blue)">' + dlvStats.total + '</div><div class="stat-sub">' + dlvStats.inTransit + ' in transit</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--cyan);padding:12px"><div class="stat-label">Scans</div><div class="stat-value" style="font-size:20px;color:var(--cyan)">' + stats.totalScans + '</div><div class="stat-sub">' + stats.okScans + ' OK, ' + stats.errScans + ' errors</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--orange);padding:12px"><div class="stat-label">Kits</div><div class="stat-value" style="font-size:20px;color:var(--orange)">' + stats.totalKits + '</div><div class="stat-sub">' + stats.completeKits + ' complete</div></div>';
    html += '</div>';

    // OEM breakdown report
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📊</span> OEM Sequence Breakdown Report</div><div class="panel-body">';
    if (summary.length === 0) {
      html += '<p class="text-muted text-center" style="padding:20px">No sequences to report.</p>';
    } else {
      html += '<table class="data-table"><thead><tr><th>OEM</th><th>Total</th><th>Pending</th><th>Loaded</th><th>Complete</th><th>Completion %</th></tr></thead><tbody>';
      summary.forEach(function(s) {
        var pct = s.total > 0 ? Math.round((s.complete / s.total) * 100) : 0;
        html += '<tr><td class="font-bold">' + AutoSeq.sanitize(s.oem) + '</td><td>' + s.total + '</td><td>' + s.pending + '</td><td>' + s.loaded + '</td><td>' + s.complete + '</td><td><div class="progress-bar" style="width:100px"><div class="progress-fill" style="width:' + pct + '%"></div></div> ' + pct + '%</td></tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div></div>';

    // Route throughput report
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🚚</span> Route Throughput Report</div><div class="panel-body">';
    html += '<table class="data-table"><thead><tr><th>Route</th><th>From → To</th><th>Total Deliveries</th><th>Pending</th><th>In Transit</th><th>Delivered</th><th>Avg Transit</th></tr></thead><tbody>';
    routeStats.forEach(function(rs) {
      html += '<tr><td class="font-bold text-purple">' + AutoSeq.sanitize(rs.routeName) + '</td><td style="font-size:10px">' + AutoSeq.sanitize(rs.from) + ' → ' + AutoSeq.sanitize(rs.to) + '</td><td>' + rs.totalDeliveries + '</td><td>' + rs.pending + '</td><td>' + rs.inTransit + '</td><td>' + rs.delivered + '</td><td class="font-mono">' + rs.avgTransitTime + 'min</td></tr>';
    });
    html += '</tbody></table>';
    html += '</div></div>';

    // Rack status report
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📦</span> Rack Status Report</div><div class="panel-body">';
    if (AutoSeq.state.racks.length === 0) {
      html += '<p class="text-muted text-center" style="padding:20px">No racks to report.</p>';
    } else {
      html += '<table class="data-table"><thead><tr><th>Rack ID</th><th>Line</th><th>Pattern</th><th>Loaded</th><th>Errors</th><th>Dock</th><th>Route</th><th>Status</th></tr></thead><tbody>';
      AutoSeq.state.racks.forEach(function(rack) {
        var pct = Math.round((rack.loadedCount / rack.slotCount) * 100);
        html += '<tr><td class="font-mono font-bold text-purple">' + rack.id + '</td><td>' + AutoSeq.sanitize(rack.lineName) + '</td><td>' + rack.pattern + '</td><td>' + rack.loadedCount + '/' + rack.slotCount + ' (' + pct + '%)</td><td class="' + (rack.errors > 0 ? 'text-red' : '') + '">' + rack.errors + '</td><td class="font-mono">' + AutoSeq.sanitize(rack.dockDoor || '—') + '</td><td class="font-mono">' + AutoSeq.sanitize(rack.deliveryRoute || '—') + '</td><td><span class="status-badge status-' + rack.status + '">' + rack.status + '</span></td></tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div></div>';

    // Exception report
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">⚠️</span> Exception Report</div><div class="panel-body">';
    var errors = AutoSeq.state.scanLog.filter(function(s) { return s.result === 'err'; });
    var errorRacks = AutoSeq.state.racks.filter(function(r) { return r.errors > 0; });
    if (errors.length === 0 && errorRacks.length === 0) {
      html += '<p class="text-muted text-center" style="padding:20px">✅ No exceptions — all clear!</p>';
    } else {
      if (errorRacks.length > 0) {
        html += '<div style="margin-bottom:12px"><strong>Rack Errors:</strong></div>';
        html += '<table class="data-table"><thead><tr><th>Rack</th><th>Line</th><th>Errors</th><th>Status</th></tr></thead><tbody>';
        errorRacks.forEach(function(r) {
          html += '<tr><td class="font-mono">' + r.id + '</td><td>' + AutoSeq.sanitize(r.lineName) + '</td><td class="text-red font-bold">' + r.errors + '</td><td><span class="status-badge status-error">' + r.status + '</span></td></tr>';
        });
        html += '</tbody></table>';
      }
      if (errors.length > 0) {
        html += '<div style="margin:12px 0"><strong>Scan Errors (' + errors.length + '):</strong></div>';
        html += '<div class="scan-history" style="max-height:200px">';
        errors.slice(0, 20).forEach(function(scan) {
          html += '<div class="scan-entry"><span class="time">' + (scan.time ? scan.time.toLocaleTimeString() : '--') + '</span><span class="code">' + AutoSeq.sanitize(scan.code) + '</span><span class="result err">✗</span><span class="detail">' + AutoSeq.sanitize(scan.detail) + '</span></div>';
        });
        html += '</div>';
      }
    }
    html += '</div></div>';

    // Export
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📤</span> Export Reports & SAP IDocs</div><div class="panel-body">';

    // Standard exports
    html += '<div style="font-size:11px;font-weight:600;color:var(--purple-light);margin-bottom:6px">Standard Exports</div>';
    html += '<div class="flex gap-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-primary btn-sm" onclick="AutoSeqUI.exportSAP()">📄 SAP Export</button>';
    html += '<button class="btn btn-emerald btn-sm" onclick="AutoSeqUI.exportCGM()">📋 CGM XML</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.downloadDeliveryReport()">🚚 Delivery Report (CSV)</button>';
    html += '</div>';

    // SAP IDoc exports
    html += '<div style="font-size:11px;font-weight:600;color:var(--yellow);margin:14px 0 6px">🟡 SAP IDoc Exports (Harley-Davidson + OEM)</div>';
    html += '<div class="flex gap-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-sm btn-primary" onclick="AutoSeqUI.exportIDocDELVRY()">📦 DELVRY07 (ASN/Delivery)</button>';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.exportIDocDESADV()">📤 DESADV07 (Despatch Advice)</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.exportIDocORDERS()">📋 ORDERS05 (Purchase Order)</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.exportIDocINVOIC()">💰 INVOIC02 (Invoice)</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.exportIDocMATMAS()">🔩 MATMAS05 (Material Master)</button>';
    html += '<button class="btn btn-sm btn-danger" onclick="AutoSeqUI.exportIDocBatch()">📋 Batch IDoc (All)</button>';
    html += '</div>';

    // IDoc reference
    html += '<div style="margin-top:12px;padding:10px;background:var(--bg-tertiary);border-radius:var(--radius);font-size:10px;line-height:1.5;color:var(--text-secondary)">';
    html += '<strong style="color:var(--yellow)">Harley-Davidson SAP Plants:</strong><br>';
    html += '🟡 YORK-PA — York Vehicle Operations, 1425 Eden Rd, York PA 17402 (Bldg 3 Assembly, Schedule Issuer: 1001S101)<br>';
    html += '🟡 KC-MO — Kansas City Plant, 9400 Universal Ave, Kansas City MO 64129 (Schedule Issuer: 1001S102)<br>';
    html += '🟡 MENOMONEE — Tomahawk Operations, Tomahawk WI (Paint & Plastics)<br><br>';
    html += '<strong>IDoc Message Types:</strong><br>';
    html += 'DELVRY07 (EDI 856) — ASN/Delivery with VIN tracking (E1EDL33, E1EDL34)<br>';
    html += 'DESADV07 (EDI 856) — Despatch advice variant<br>';
    html += 'ORDERS05 (EDI 850) — Purchase order with schedule agreement ref<br>';
    html += 'INVOIC02 (EDI 810) — Invoice with line items and totals<br>';
    html += 'MATMAS05 — Material master for parts catalog (E1MARAM, E1MAKT)<br>';
    html += '</div>';

    html += '</div></div>';

    return html;
  }

  function downloadDeliveryReport() {
    var rows = [['Ticket', 'Route', 'From', 'To', 'Racks', 'Driver', 'Vehicle', 'Status', 'Created', 'Dispatched', 'Delivered', 'Confirmed', 'Notes']];
    AutoSeq.state.deliveries.forEach(function(d) {
      rows.push([
        d.ticketNumber, d.routeName, d.fromBuilding, d.toBuilding,
        (d.rackIds || []).join('; '), d.driver, d.vehicle, d.status,
        d.createdAt ? d.createdAt.toISOString() : '',
        d.dispatchedAt ? d.dispatchedAt.toISOString() : '',
        d.deliveredAt ? d.deliveredAt.toISOString() : '',
        d.confirmedAt ? d.confirmedAt.toISOString() : '',
        d.notes || ''
      ]);
    });
    var csv = rows.map(function(r) { return r.map(function(c) { return '"' + (c || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'owllogics_delivery_report.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    AutoSeq.alert('success', 'Downloaded', 'Delivery report CSV saved');
  }

  // ── SAP IDoc Export Functions ──
  function exportIDocDELVRY() {
    var seqs = AutoSeq.state.sequences.length > 0 ? AutoSeq.state.sequences : [];
    var rack = AutoSeq.state.racks[0] || null;
    var data = SapIDoc.generateDELVRY(seqs, rack, null);
    downloadFile(data, 'owllogics_idoc_delvry07.txt', 'text/plain');
    AutoSeq.alert('success', 'IDoc Exported', 'DELVRY07 — ' + seqs.length + ' items');
  }
  function exportIDocDESADV() {
    var seqs = AutoSeq.state.sequences.length > 0 ? AutoSeq.state.sequences : [];
    var data = SapIDoc.generateDESADV(seqs, AutoSeq.state.racks[0] || null);
    downloadFile(data, 'owllogics_idoc_desadv07.txt', 'text/plain');
    AutoSeq.alert('success', 'IDoc Exported', 'DESADV07 — ' + seqs.length + ' items');
  }
  function exportIDocORDERS() {
    var seqs = AutoSeq.state.sequences.length > 0 ? AutoSeq.state.sequences : [];
    var data = SapIDoc.generateORDERS(seqs, null);
    downloadFile(data, 'owllogics_idoc_orders05.txt', 'text/plain');
    AutoSeq.alert('success', 'IDoc Exported', 'ORDERS05 — ' + seqs.length + ' line items');
  }
  function exportIDocINVOIC() {
    var seqs = AutoSeq.state.sequences.length > 0 ? AutoSeq.state.sequences : [];
    var data = SapIDoc.generateINVOIC(seqs, AutoSeq.state.racks[0] || null, { unitPrice: 125.00 });
    downloadFile(data, 'owllogics_idoc_invoic02.txt', 'text/plain');
    AutoSeq.alert('success', 'IDoc Exported', 'INVOIC02 — ' + seqs.length + ' line items');
  }
  function exportIDocMATMAS() {
    var parts = AutoSeq.state.parts;
    var data = SapIDoc.generateMATMAS(parts);
    downloadFile(data, 'owllogics_idoc_matmas05.txt', 'text/plain');
    AutoSeq.alert('success', 'IDoc Exported', 'MATMAS05 — ' + parts.length + ' materials');
  }
  function exportIDocBatch() {
    var seqs = AutoSeq.state.sequences;
    var racks = AutoSeq.state.racks;
    var parts = AutoSeq.state.parts;
    var data = SapIDoc.generateBatchIDoc(seqs, racks, parts, null);
    downloadFile(data, 'owllogics_idoc_batch_all.txt', 'text/plain');
    AutoSeq.alert('success', 'IDoc Batch Exported', 'All message types — ' + seqs.length + ' seqs, ' + parts.length + ' parts');
  }

  // ══════════════════════════════════════════════════════════
  //  TN3270 TERMINAL EMULATOR VIEW
  // ══════════════════════════════════════════════════════════

  function renderTerminal() {
    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">🖥️</span> TN3270 Terminal Emulator — Mainframe Integration<div class="panel-actions"><span class="tn3270-status" id="tn-status">● Disconnected</span></div></div><div class="panel-body">';

    // Connection config
    html += '<div class="tn3270-toolbar">';
    html += '<div class="form-group" style="margin:0;min-width:180px"><label>Host</label><input type="text" id="tn-host" value="" placeholder="mainframe.host.com" style="font-family:monospace;font-size:11px"></div>';
    html += '<div class="form-group" style="margin:0;min-width:80px"><label>Port</label><input type="number" id="tn-port" value="23" style="font-family:monospace"></div>';
    html += '<div class="form-group" style="margin:0;min-width:120px"><label>Terminal Type</label><select id="tn-type"><option value="IBM-3278-2">IBM-3278-2 (24x80)</option><option value="IBM-3278-3">IBM-3278-3 (32x80)</option><option value="IBM-3278-4">IBM-3278-4 (43x80)</option><option value="IBM-3278-5">IBM-3278-5 (27x132)</option></select></div>';
    html += '<button class="btn btn-emerald btn-sm" onclick="AutoSeqUI.tnConnect()" style="margin-top:16px">🔌 Connect</button>';
    html += '<button class="btn btn-danger btn-sm" onclick="AutoSeqUI.tnDisconnect()" style="margin-top:16px">⏹ Disconnect</button>';
    html += '</div>';

    // Terminal screen
    html += '<div class="tn3270-screen tn-green" id="tn-screen">';
    html += '*** OwlLogics TN3270 Terminal Emulator ***\n';
    html += '\n';
    html += 'Status: DISCONNECTED\n';
    html += '\n';
    html += 'Enter host and port above, then click Connect.\n';
    html += '\n';
    html += 'Common mainframe systems:\n';
    html += '  - IBM z/OS, z/VM, TSO/ISPF\n';
    html += '  - CICS transactions (Enter TRANSID like CICS, CICS, IMS)\n';
    html += '  - SAP via SAP Console (VT100 mode)\n';
    html += '  - DP World / Syncreon Axional webOS (via TN3270 gateway)\n';
    html += '\n';
    html += 'Note: This is a simulation terminal. In production, connect\n';
    html += 'via WebSocket-to-TN3270 gateway or direct TCP socket.\n';
    html += '</div>';

    // Input line
    html += '<div class="tn3270-input-row">';
    html += '<span style="color:var(--emerald-light);font-family:monospace;font-size:14px">▶</span>';
    html += '<input type="text" class="tn3270-input" id="tn-input" placeholder="Type command or transaction ID (e.g. CICS, LOGON, ENTER)..." autocomplete="off">';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnSend()">↵ Enter</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnClear()">🗑️ Clear</button>';
    html += '</div>';

    // PF keys
    html += '<div class="tn3270-toolbar" style="flex-wrap:wrap;margin-top:8px">';
    html += '<span class="text-xs text-muted">PF Keys:</span>';
    for (var i = 1; i <= 12; i++) {
      html += '<button class="tn3270-pfkey" onclick="AutoSeqUI.tnPFKey(' + i + ')">PF' + i + '</button>';
    }
    html += '<button class="tn3270-pfkey" onclick="AutoSeqUI.tnSendKey(\'ENTER\')">↵ Enter</button>';
    html += '<button class="tn3270-pfkey" onclick="AutoSeqUI.tnSendKey(\'CLEAR\')">Clear</button>';
    html += '<button class="tn3270-pfkey" onclick="AutoSeqUI.tnSendKey(\'RESET\')">Reset</button>';
    html += '<button class="tn3270-pfkey" onclick="AutoSeqUI.tnSendKey(\'SYSREQ\')">SysReq</button>';
    html += '</div>';

    // Quick connect presets
    html += '<div style="margin-top:12px;padding:10px;background:var(--bg-tertiary);border-radius:var(--radius)">';
    html += '<div style="font-size:11px;font-weight:600;margin-bottom:6px">⚡ Quick Connect Presets:</div>';

    // IBM Z Xplore — Free, real z/OS
    html += '<div style="font-size:10px;font-weight:600;color:var(--emerald-light);margin-bottom:4px">🟢 IBM Z Xplore — Free Real z/OS (No Cost, Register Online)</div>';
    html += '<div class="flex gap-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'204.90.115.200\', 623, \'IBM-3278-2\', \'IBM Z Xplore\')">🟢 IBM Z Xplore (204.90.115.200:623)</button>';
    html += '</div>';
    html += '<div style="font-size:9px;color:var(--text-muted);margin:4px 0;line-height:1.5">';
    html += '<strong>Register free:</strong> <a href="https://ibmzxplore.influitive.com/users/sign_up" style="color:var(--blue)" target="_blank">ibmzxplore.influitive.com</a> — Anyone can register (student or learner). You get a username + password after completing Challenge 1. Real IBM z/OS system with TSO, ISPF, CICS, USS.<br>';
    html += '<strong>Logon:</strong> Type <code>LOGON</code> then your assigned userid, then password from the challenge email.';
    html += '</div>';

    // Coursera COBOL — Free, real z/OS
    html += '<div style="font-size:10px;font-weight:600;color:var(--emerald-light);margin:10px 0 4px">🟢 Coursera COBOL Course — Free Real z/OS</div>';
    html += '<div class="flex gap-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'192.86.32.250\', 623, \'IBM-3278-2\', \'Coursera COBOL\')">🟢 Coursera COBOL Mainframe (192.86.32.250:623)</button>';
    html += '</div>';
    html += '<div style="font-size:9px;color:var(--text-muted);margin:4px 0;line-height:1.5">';
    html += '<strong>Enroll free:</strong> <a href="https://www.coursera.org/learn/cobol-programming-vscode" style="color:var(--blue)" target="_blank">coursera.org/learn/cobol-programming-vscode</a> — Free audit. Then request mainframe access via the IBM form link in the course. You get credentials by email.';
    html += '</div>';

    // Local & Enterprise
    html += '<div style="font-size:10px;font-weight:600;color:var(--purple-light);margin:10px 0 4px">🖥️ Local & Enterprise</div>';
    html += '<div class="flex gap-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnPreset(\'localhost\', 23, \'IBM-3278-2\', \'Local Test\')">🖥️ Local Test (localhost:23)</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnPreset(\'your-company-tn3270.com\', 23, \'IBM-3278-2\', \'Syncreon Axional\')">🏢 Syncreon Axional</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnPreset(\'your-company-mainframe-ssl.com\', 992, \'IBM-3278-2\', \'DP World Mainframe\')">🏢 DP World Mainframe</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnPreset(\'your-oem-tn3270.com\', 23, \'IBM-3278-2\', \'FCA CONVIS\')">🏢 FCA CONVIS System</button>';
    html += '</div>';

    // MVS 3.8j TK4- (Hercules — default credentials)
    html += '<div style="font-size:10px;font-weight:600;color:var(--yellow);margin:10px 0 4px">🟡 MVS 3.8j TK4- (Hercules Turnkey — Default Credentials)</div>';
    html += '<div class="flex gap-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnPreset(\'localhost\', 3270, \'IBM-3278-2\', \'MVS TK4 Local\')">🟡 MVS TK4- Local (localhost:3270)</button>';
    html += '</div>';
    html += '<div style="font-size:9px;color:var(--text-muted);margin:4px 0;line-height:1.5">';
    html += '<strong>Default logins (MVS 3.8j Turnkey 4-):</strong><br>';
    html += '&nbsp;&nbsp;<code>IBMUSER</code> / <code>SYS1</code> — Full system authority<br>';
    html += '&nbsp;&nbsp;<code>HERC01</code> / <code>PASS4U</code> — Regular user<br>';
    html += '&nbsp;&nbsp;<code>HERC02</code> / <code>PASS4U</code> — Regular user<br>';
    html += '&nbsp;&nbsp;<code>HERC03</code> / <code>PASS4U</code> — Regular user<br>';
    html += '&nbsp;&nbsp;<code>HERC04</code> / <code>PASS4U</code> — Regular user<br>';
    html += 'Download MVS TK4- from: <a href="https://github.com/mvs-tk4/mvs-tk4" style="color:var(--blue)" target="_blank">github.com/mvs-tk4/mvs-tk4</a> — Run locally with Hercules emulator. Free and open source.';
    html += '</div>';

    // Public mainframes
    html += '<div style="font-size:10px;font-weight:600;color:var(--cyan);margin:10px 0 4px">🌐 Public Community Mainframes (Free — Test Drive)</div>';
    html += '<div class="flex gap-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'tso.raksha.com\', 23, \'IBM-3278-2\', \'Raksha TSO\')">🎓 Raksha TSO (MVS 3.8j)</button>';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'mvs.kijsi.com\', 23, \'IBM-3278-2\', \'Kijsi MVS\')">🎓 Kijsi MVS Classic</button>';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'mzweeker.eu\', 23, \'IBM-3278-2\', \'Mzweeker\')">🎓 Mzweeker (z/VM)</button>';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'trails.bbs.fi\', 23, \'IBM-3278-2\', \'Trails BBS\')">🎓 Trails BBS (Finland)</button>';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'twilightbbs.com\', 23, \'IBM-3278-2\', \'Twilight BBS\')">🎓 Twilight BBS</button>';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'rbbs.dcmsc.org\', 23, \'IBM-3278-2\', \'RBBS DC\')">🎓 RBBS Washington DC</button>';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'bbs.fozztexx.com\', 23, \'IBM-3278-2\', \'Fozztexx BBS\')">🎓 Fozztexx BBS</button>';
    html += '<button class="btn btn-sm btn-emerald" onclick="AutoSeqUI.tnPreset(\'uncommon.us\', 23, \'IBM-3278-2\', \'Uncommon BBS\')">🎓 Uncommon BBS</button>';
    html += '</div>';
    html += '<div style="font-size:9px;color:var(--text-muted);margin:4px 0;line-height:1.5">';
    html += 'Try <code>LOGON GUEST</code> or <code>LOGON DEMO</code> on public systems. Some may require registration on their website. Community-maintained — availability varies.';
    html += '</div>';

    // University mainframes
    html += '<div style="font-size:10px;font-weight:600;color:var(--blue);margin:10px 0 4px">🏛️ University Mainframes (Educational)</div>';
    html += '<div class="flex gap-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnPreset(\'marist.edu\', 23, \'IBM-3278-2\', \'Marist College\')">🏛️ Marist College (z/VM)</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnPreset(\'vm.marist.edu\', 23, \'IBM-3278-2\', \'Marist VM\')">🏛️ Marist VM ESA</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnPreset(\'listhost.valdosta.edu\', 23, \'IBM-3278-2\', \'Valdosta State\')">🏛️ Valdosta State</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.tnPreset(\'sine.bbs.fi\', 23, \'IBM-3278-2\', \'SINE Helsinki\')">🏛️ SINE (Helsinki Univ)</button>';
    html += '</div>';

    // SSL / Connection explanation
    html += '<div style="font-size:10px;font-weight:600;color:var(--orange);margin:12px 0 4px">🔐 About SSL & Browser Connections</div>';
    html += '<div style="font-size:9px;color:var(--text-secondary);line-height:1.6;padding:8px;background:rgba(243,156,18,0.05);border-radius:var(--radius);border-left:3px solid var(--orange)">';
    html += '<strong>Browser limitation:</strong> Web browsers cannot make raw TCP/Telnet connections directly. The OwlLogics TN3270 terminal currently operates in <strong>simulation mode</strong> — it simulates mainframe responses for testing and training.<br><br>';
    html += '<strong>For real connections</strong> from a browser, you need a <strong>WebSocket-to-TN3270 gateway</strong> running on your machine or a server:<br>';
    html += '&nbsp;&nbsp;1. Install <a href="https://x3270.miraheze.org/wiki/Downloads" style="color:var(--blue)" target="_blank">x3270 suite</a> (includes s3270 server) on your machine<br>';
    html += '&nbsp;&nbsp;2. The gateway bridges WebSocket (browser) → TN3270 (mainframe)<br>';
    html += '&nbsp;&nbsp;3. For SSL: use <a href="https://letsencrypt.org/" style="color:var(--blue)" target="_blank">Let\'s Encrypt</a> (free SSL certs) on your gateway<br>';
    html += '&nbsp;&nbsp;4. Point OwlLogics to <code>wss://your-gateway:443</code> in the host field<br><br>';
    html += '<strong>Free SSL:</strong> <a href="https://letsencrypt.org/" style="color:var(--blue)" target="_blank">Let\'s Encrypt</a> provides free, automated SSL certificates. Use with nginx or Caddy reverse proxy to secure your TN3270 WebSocket gateway.';
    html += '</div>';

    // x3270 download section
    html += '<div style="font-size:10px;font-weight:600;color:var(--emerald-light);margin:12px 0 4px">📥 Download x3270 — Free Open Source TN3270 Client</div>';
    html += '<div style="font-size:9px;color:var(--text-secondary);line-height:1.7;padding:10px;background:rgba(46,204,113,0.05);border-radius:var(--radius);border-left:3px solid var(--emerald)">';
    html += '<strong>x3270</strong> is the industry-standard free/open-source TN3270 terminal suite (wc3270 for Windows, c3270 for console, s3270 as a server gateway).<br><br>';
    html += '<strong>Windows Installer (recommended):</strong><br>';
    html += '&nbsp;&nbsp;wc3270 4.5ga5 (stable, 64-bit): <a href="https://prdownloads.sourceforge.net/x3270/wc3270-4.5ga5-setup.exe?download" style="color:var(--blue)" target="_blank">wc3270-4.5ga5-setup.exe</a> (5.4 MB)<br>';
    html += '&nbsp;&nbsp;wx3270 1.3ga4 (GUI front-end): <a href="https://sourceforge.net/projects/x3270/files/wx3270/wx3270-1.3ga4-setup.exe/download" style="color:var(--blue)" target="_blank">wx3270-1.3ga4-setup.exe</a> (6.8 MB)<br><br>';
    html += '<strong>Windows Portable (no install):</strong><br>';
    html += '&nbsp;&nbsp;64-bit: <a href="https://prdownloads.sourceforge.net/x3270/wc3270-4.5ga5-noinstall-64.zip?download" style="color:var(--blue)" target="_blank">wc3270-4.5ga5-noinstall-64.zip</a> (6.4 MB)<br>';
    html += '&nbsp;&nbsp;32-bit: <a href="https://prdownloads.sourceforge.net/x3270/wc3270-4.5ga5-noinstall-32.zip?download" style="color:var(--blue)" target="_blank">wc3270-4.5ga5-noinstall-32.zip</a> (6.2 MB)<br><br>';
    html += '<strong>macOS:</strong> <code>brew install x3270</code> (includes c3270, s3270, pr3287)<br><br>';
    html += '<strong>Source code:</strong> <a href="https://prdownloads.sourceforge.net/x3270/suite3270-4.5ga5-src.tgz?download" style="color:var(--blue)" target="_blank">suite3270-4.5ga5-src.tgz</a> (14.3 MB)<br><br>';
    html += '<strong>Full downloads page:</strong> <a href="https://x3270.miraheze.org/wiki/Downloads" style="color:var(--blue)" target="_blank">x3270.miraheze.org/wiki/Downloads</a><br><br>';
    html += '<strong>How to connect with wc3270:</strong><br>';
    html += '&nbsp;&nbsp;1. Install wc3270 using the setup.exe above<br>';
    html += '&nbsp;&nbsp;2. Launch wc3270 from Start Menu<br>';
    html += '&nbsp;&nbsp;3. Connection → Connect → enter host:port from presets above<br>';
    html += '&nbsp;&nbsp;4. For IBM Z Xplore: <code>204.90.115.200:623</code><br>';
    html += '&nbsp;&nbsp;5. For MVS TK4- local: <code>localhost:3270</code> (logon as IBMUSER/SYS1)<br>';
    html += '&nbsp;&nbsp;6. For SSL: add <code>-tls</code> flag or check "TLS" in connection dialog';
    html += '</div>';

    html += '</div>';

    html += '</div></div>';

    // Info panel
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📖</span> TN3270 Reference</div><div class="panel-body">';
    html += '<div style="font-size:11px;color:var(--text-secondary);line-height:1.6">';
    html += '<p><strong>TN3270</strong> is the Telnet protocol variant used to connect to IBM mainframe terminals (3270 series). It supports:</p>';
    html += '<ul style="list-style:disc;padding-left:20px;margin:8px 0">';
    html += '<li><strong>24x80 screen</strong> — standard terminal dimensions (24 rows, 80 columns)</li>';
    html += '<li><strong>PF1-PF12</strong> — Program Function keys for navigation and commands</li>';
    html += '<li><strong>EBCDIC encoding</strong> — mainframe character set (translated to ASCII)</li>';
    html += '<li><strong>Protected fields</strong> — screen areas you can\'t edit (labels, menus)</li>';
    html += '<li><strong>ATTR fields</strong> — display attributes (color, intensity, protected)</li>';
    html += '</ul>';
    html += '<p><strong>Common mainframe transactions:</p>';
    html += '<ul style="list-style:disc;padding-left:20px;margin:8px 0">';
    html += '<li><code>LOGON</code> — Sign on to TSO/ISPF</li>';
    html += '<li><code>CICS</code> — Start CICS transaction server</li>';
    html += '<li><code>SDSF</code> — System Display and Search Facility</li>';
    html += '<li><code>TSO</code> — Time Sharing Option command prompt</li>';
    html += '<li><code>ISPF</code> — Interactive System Productivity Facility</li>';
    html += '</ul>';
    html += '<p><strong>Production Connection:</strong> In a real deployment, the TN3270 emulator connects via a WebSocket-to-TN3270 gateway (e.g., x3270, tn3270.js, or a custom bridge). The gateway handles EBCDIC translation, terminal negotiation, and screen buffer management. SSL/TLS (port 992) is used for secure connections.</p>';
    html += '</div>';
    html += '</div></div>';

    return html;
  }

  // TN3270 functions
  var tnConnected = false;
  var tnScreen = [];
  var tnCursorRow = 0;
  var tnCursorCol = 0;

  function tnConnect() {
    var host = document.getElementById('tn-host').value;
    var port = parseInt(document.getElementById('tn-port').value) || 23;
    if (!host) { AutoSeq.alert('warning', 'No Host', 'Enter a mainframe host address'); return; }

    tnConnected = true;
    var status = document.getElementById('tn-status');
    if (status) { status.textContent = '● Connecting to ' + host + ':' + port; status.style.color = 'var(--yellow)'; }

    // Simulate connection
    setTimeout(function() {
      if (!tnConnected) return;
      if (status) { status.textContent = '● Connected to ' + host + ':' + port; status.style.color = 'var(--emerald)'; }
      tnWriteScreen('*** CONNECTED TO ' + host + ':' + port + ' ***\n');
      tnWriteScreen('Terminal: ' + document.getElementById('tn-type').value + '\n');
      tnWriteScreen('\n');
      tnWriteScreen('Welcome to IBM z/OS\n');
      tnWriteScreen('\n');
      tnWriteScreen('Enter your logonid:\n');
      tnWriteScreen('\n');
      tnWriteScreen(' LOGON ===>\n');
      AutoSeq.alert('success', 'Connected', host + ':' + port);
    }, 800);
  }

  function tnDisconnect() {
    tnConnected = false;
    var status = document.getElementById('tn-status');
    if (status) { status.textContent = '● Disconnected'; status.style.color = 'var(--text-muted)'; }
    tnWriteScreen('\n*** DISCONNECTED ***\n');
  }

  function tnSend() {
    var input = document.getElementById('tn-input');
    if (!input) return;
    var cmd = input.value;
    input.value = '';
    if (!cmd) return;
    tnWriteScreen('▶ ' + cmd + '\n');

    // Simulate mainframe responses
    var upper = cmd.toUpperCase();
    if (upper === 'LOGON' || upper.startsWith('LOGON ')) {
      tnWriteScreen('IKT01466 ENTER YOUR PASSWORD:\n');
      tnWriteScreen(' PASSWORD ===>\n');
    } else if (upper === 'CICS') {
      tnWriteScreen('\n*** CICS Transaction Server ***\n');
      tnWriteScreen('\nDFHCE3549 Sign-on to CICS successful\n');
      tnWriteScreen('DFHCE3550 Please type your terminal id: OWLLOGIC\n');
      tnWriteScreen('\nCICS/ESA 4.3\n');
      tnWriteScreen('  1. CESN  - Sign on\n');
      tnWriteScreen('  2. CESF  - Sign off\n');
      tnWriteScreen('  3. CEMT  - Master terminal\n');
      tnWriteScreen('  4. CEDF  - Execution diagnostic\n');
      tnWriteScreen('\n');
    } else if (upper === 'SDSF') {
      tnWriteScreen('\n*** SDSF - System Display ***\n');
      tnWriteScreen('\n  DA   - Active jobs\n');
      tnWriteScreen('  I    - Job log\n');
      tnWriteScreen('  O    - Output queue\n');
      tnWriteScreen('  ST   - Status\n');
      tnWriteScreen('\nCommand ===>\n');
    } else if (upper === 'ISPF') {
      tnWriteScreen('\n*** ISPF/PDF PRIMARY OPTION MENU ***\n');
      tnWriteScreen('\n  0  Settings\n');
      tnWriteScreen('  1  View\n');
      tnWriteScreen('  2  Edit\n');
      tnWriteScreen('  3  Utilities\n');
      tnWriteScreen('  4  Foreground\n');
      tnWriteScreen('  5  Batch\n');
      tnWriteScreen('  6  Command\n');
      tnWriteScreen('  7  Dialog Test\n');
      tnWriteScreen('  M  More\n');
      tnWriteScreen('\nOption ===>\n');
    } else if (upper === 'HELP') {
      tnWriteScreen('\nAvailable commands:\n');
      tnWriteScreen('  LOGON    - Sign on to TSO/ISPF\n');
      tnWriteScreen('  LOGON GUEST - Guest logon (public mainframes)\n');
      tnWriteScreen('  CICS     - Start CICS transaction server\n');
      tnWriteScreen('  SDSF     - System Display and Search Facility\n');
      tnWriteScreen('  ISPF     - Interactive System Productivity Facility\n');
      tnWriteScreen('  TSO      - Time Sharing Option prompt\n');
      tnWriteScreen('  VM       - z/VM CP commands (public systems)\n');
      tnWriteScreen('  XEDIT    - VM editor\n');
      tnWriteScreen('  HELP     - This list\n');
      tnWriteScreen('  CLEAR    - Clear screen\n');
      tnWriteScreen('\nPublic mainframes: try LOGON GUEST or LOGON DEMO\n');
    } else if (upper === 'VM' || upper === 'CP') {
      tnWriteScreen('\n*** z/VM CP ***\n');
      tnWriteScreen('VM/ESA Release 2.4.0\n');
      tnWriteScreen('  LOGON  userid   - Log on to VM\n');
      tnWriteScreen('  DIAL   userid   - Dial another user\n');
      tnWriteScreen('  QUERY  USERS    - Show connected users\n');
      tnWriteScreen('  XEDIT  fn ft fm - Edit a file\n');
      tnWriteScreen('\nEnter command:\n');
    } else if (upper === 'XEDIT') {
      tnWriteScreen('\n*** XEDIT - VM Editor ***\n');
      tnWriteScreen('Editing: NEW FILE\n');
      tnWriteScreen('  INPUT  - Enter input mode\n');
      tnWriteScreen('  FILE   - Save and quit\n');
      tnWriteScreen('  QUIT   - Quit without saving\n');
      tnWriteScreen('  TOP    - Go to top\n');
      tnWriteScreen('  BOTTOM - Go to bottom\n');
      tnWriteScreen('\n====> \n');
    } else if (upper === 'LOGON GUEST' || upper === 'LOGON DEMO') {
      tnWriteScreen('\nIKT01466 Guest logon processing...\n');
      tnWriteScreen('Welcome to the public mainframe!\n');
      tnWriteScreen('\n*** ISPF/PDF PRIMARY OPTION MENU ***\n');
      tnWriteScreen('\n  0  Settings\n');
      tnWriteScreen('  1  View\n');
      tnWriteScreen('  2  Edit\n');
      tnWriteScreen('  3  Utilities\n');
      tnWriteScreen('  6  Command\n');
      tnWriteScreen('  M  More\n');
      tnWriteScreen('\nOption ===>\n');
    } else {
      tnWriteScreen('READY\n');
    }
  }

  function tnPFKey(num) {
    tnWriteScreen('[PF' + num + ']\n');
    if (num === 3) tnWriteScreen('*** EXIT ***\n');
    else if (num === 12) tnWriteScreen('*** CANCEL ***\n');
  }

  function tnSendKey(key) {
    tnWriteScreen('[' + key + ']\n');
    if (key === 'CLEAR') tnClear();
  }

  function tnClear() {
    tnScreen = [];
    var screen = document.getElementById('tn-screen');
    if (screen) {
      screen.textContent = '*** SCREEN CLEARED ***\n\nReady.\n';
    }
  }

  function tnWriteScreen(text) {
    var screen = document.getElementById('tn-screen');
    if (!screen) return;
    screen.textContent += text;
    screen.scrollTop = screen.scrollHeight;
  }

  function tnPreset(host, port, type, name) {
    var hostEl = document.getElementById('tn-host');
    var portEl = document.getElementById('tn-port');
    var typeEl = document.getElementById('tn-type');
    if (hostEl) hostEl.value = host;
    if (portEl) portEl.value = port;
    if (typeEl) typeEl.value = type;
    AutoSeq.alert('info', 'Preset Loaded', name + ' — click Connect');
  }

  // ══════════════════════════════════════════════════════════
  //  AI OPTIMIZER VIEW
  // ══════════════════════════════════════════════════════════

  function renderOwlAI() {
    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">🧠</span> OwlAI Optimization Engine — Local Inference<div class="panel-actions"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.runAIAnalysis()">🔍 Run Full Analysis</button></div></div><div class="panel-body">';

    html += '<div class="text-sm text-muted mb-2">OwlAI v' + OwlAI.version + ' — rule-based optimization engine. No API keys, no cloud calls, 100% local inference. Analyzes sequences, routes, forklifts, and racks for efficiency improvements.</div>';

    // Quick action buttons
    html += '<div class="flex gap-2 mb-2" style="flex-wrap:wrap">';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.runAISeq()">📋 Optimize Sequences</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.runAIRoutes()">🚚 Optimize Routes</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.runAIForklifts()">🚜 Optimize Forklifts</button>';
    html += '<button class="btn btn-sm" onclick="AutoSeqUI.runAIRacks()">📦 Optimize Racks</button>';
    html += '</div>';

    html += '<div id="ai-results"></div>';

    html += '</div></div>';
    return html;
  }

  function runAIAnalysis() {
    var report = OwlAI.runFullAnalysis(AutoSeq.state);
    MetricsDashboard.incrementAI();
    renderAIResults(report);
    AutoSeq.alert('success', 'AI Analysis Complete', report.summary);
  }

  function runAISeq() {
    var result = OwlAI.optimizeSequences(AutoSeq.state.sequences);
    MetricsDashboard.incrementAI();
    renderAIResults({ sections: { sequences: result }, summary: result.recommendations.length + ' sequence recommendations' });
  }

  function runAIRoutes() {
    var result = OwlAI.optimizeRoutes(AutoSeq.state.routes, AutoSeq.state.deliveries);
    MetricsDashboard.incrementAI();
    renderAIResults({ sections: { routes: result }, summary: result.recommendations.length + ' route recommendations' });
  }

  function runAIForklifts() {
    var result = OwlAI.optimizeForkliftAssignment(AutoSeq.state.forklifts, AutoSeq.state.deliveries);
    MetricsDashboard.incrementAI();
    renderAIResults({ sections: { forklifts: result }, summary: result.recommendations.length + ' forklift recommendations' });
  }

  function runAIRacks() {
    var result = OwlAI.optimizeRackLoading(AutoSeq.state.racks);
    MetricsDashboard.incrementAI();
    renderAIResults({ sections: { racks: result }, summary: result.recommendations.length + ' rack recommendations' });
  }

  function renderAIResults(report) {
    var container = document.getElementById('ai-results');
    if (!container) return;

    var html = '';

    // Summary
    html += '<div class="ai-recommendation ' + (report.criticalCount > 0 ? 'critical' : 'low') + '">';
    html += '<span class="ai-rec-type ' + (report.criticalCount > 0 ? 'critical' : 'info') + '">SUMMARY</span>';
    html += '<span class="ai-rec-priority">' + (report.timestamp || new Date().toISOString()) + '</span>';
    html += '<div style="margin-top:4px">' + AutoSeq.sanitize(report.summary || 'Analysis complete') + '</div>';
    html += '</div>';

    // Sections
    if (report.sections) {
      Object.keys(report.sections).forEach(function(key) {
        var section = report.sections[key];
        html += '<div class="ai-section-header">' + key.toUpperCase() + ' — ' + (section.engine || 'OwlAI') + '</div>';

        // Metrics
        if (section.metrics) {
          Object.keys(section.metrics).forEach(function(mk) {
            html += '<div class="ai-metric-row"><span style="color:var(--text-muted)">' + mk + '</span><span class="font-mono">' + section.metrics[mk] + '</span></div>';
          });
        }

        // Recommendations
        if (section.recommendations) {
          section.recommendations.forEach(function(rec) {
            var cls = rec.priority || 'low';
            html += '<div class="ai-recommendation ' + cls + '">';
            html += '<span class="ai-rec-type ' + (rec.type || 'info') + '">' + (rec.type || 'INFO') + '</span>';
            html += '<span class="ai-rec-priority">' + (rec.priority || 'low') + '</span>';
            html += '<div style="margin-top:4px">' + AutoSeq.sanitize(rec.message) + '</div>';
            html += '</div>';
          });
        }

        // Assignments (forklift)
        if (section.assignments && section.assignments.length > 0) {
          html += '<div style="margin-top:8px"><strong>Assignments:</strong></div>';
          html += '<table class="data-table" style="margin-top:4px"><thead><tr><th>Forklift</th><th>Capacity</th><th>Delivery</th><th>Racks</th><th>Status</th></tr></thead><tbody>';
          section.assignments.forEach(function(a) {
            html += '<tr><td class="font-mono">' + AutoSeq.sanitize(a.forkliftUnit) + '</td><td>' + a.forkliftCapacity + 'lb</td><td class="font-mono">' + AutoSeq.sanitize(a.deliveryTicket) + '</td><td>' + a.rackCount + '</td><td>' + (a.capacityOK ? '✓' : '⚠') + '</td></tr>';
          });
          html += '</tbody></table>';
        }
      });
    }

    container.innerHTML = html;
  }

  // ══════════════════════════════════════════════════════════
  //  LIVE METRICS DASHBOARD VIEW
  // ══════════════════════════════════════════════════════════

  function renderMetrics() {
    MetricsDashboard.updateFromState();
    var m = MetricsDashboard.getAllMetrics();

    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📊</span> Live Metrics Dashboard — Real-Time Operations<div class="panel-actions"><button class="btn btn-sm" onclick="AutoSeqUI.refreshMetrics()">↻ Refresh</button></div></div><div class="panel-body">';

    // Uptime
    html += '<div style="text-align:center;margin-bottom:14px;font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">Uptime: <strong style="color:var(--emerald)">' + m.uptimeFormatted + '</strong> | MSQM: <strong style="color:' + (m.gauges.msqmConnected ? 'var(--emerald)' : 'var(--red)') + '">' + (m.gauges.msqmConnected ? '● LIVE' : '○ OFFLINE') + '</strong></div>';

    // Gauges
    html += '<div class="metrics-grid">';
    html += MetricsDashboard.renderGauge('Fleet Utilization', m.gauges.fleetUtilization, 100, '%');
    html += MetricsDashboard.renderGauge('Rack Utilization', m.gauges.rackUtilization, 100, '%');
    html += MetricsDashboard.renderGauge('Pending Sequences', m.gauges.pendingSequences, 20, '');
    html += MetricsDashboard.renderGauge('Active Racks', m.gauges.activeRacks, 10, '');
    html += MetricsDashboard.renderGauge('In Transit', m.gauges.inTransitDeliveries, 10, '');
    html += MetricsDashboard.renderGauge('Lift Link Devices', m.gauges.liftLinkDevices, 10, '');
    html += '</div>';

    // Counters
    html += '<div class="ai-section-header">Counters</div>';
    html += '<div class="metrics-grid">';
    html += MetricsDashboard.renderCounter('Sequences Received', m.counters.sequencesReceived, '📡');
    html += MetricsDashboard.renderCounter('Total Scans', m.counters.scansTotal, '📊');
    html += MetricsDashboard.renderCounter('Scan Errors', m.counters.scansError, '⚠');
    html += MetricsDashboard.renderCounter('Racks Created', m.counters.racksCreated, '📦');
    html += MetricsDashboard.renderCounter('Racks Completed', m.counters.racksCompleted, '✓');
    html += MetricsDashboard.renderCounter('Deliveries', m.counters.deliveriesCreated, '🚚');
    html += MetricsDashboard.renderCounter('Delivered', m.counters.deliveriesDelivered, '✓');
    html += MetricsDashboard.renderCounter('IDocs Exported', m.counters.idocsExported, '🟡');
    html += MetricsDashboard.renderCounter('AI Analyses', m.counters.aiAnalysesRun, '🧠');
    html += '</div>';

    // Sparklines
    html += '<div class="ai-section-header">Throughput Trends (last 10 min)</div>';
    html += '<div class="metrics-grid">';
    html += '<div>' + MetricsDashboard.renderSparkline(m.throughput.sequencesPerMin, 'Seq/min', '#8E44AD') + '</div>';
    html += '<div>' + MetricsDashboard.renderSparkline(m.throughput.scansPerMin, 'Scans/min', '#2ECC71') + '</div>';
    html += '</div>';

    html += '</div></div>';
    return html;
  }

  function refreshMetrics() { switchView('metrics'); }

  // ══════════════════════════════════════════════════════════
  //  PACKAGE MASTER VIEW
  // ══════════════════════════════════════════════════════════

  function renderPackages() {
    var pkgs = Logistics.state.packages;
    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📦</span> Package Master — Packaging Specifications & Cost<div class="panel-actions"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.showPackageModal()">➕ Add Package</button></div></div><div class="panel-body">';

    html += '<table class="data-table"><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Dimensions (in)</th><th>Weight</th><th>Max Load</th><th>Cost</th><th>Reusable</th><th>Material</th><th>Hazmat</th><th>Actions</th></tr></thead><tbody>';
    pkgs.forEach(function(pkg) {
      html += '<tr>' +
        '<td class="font-mono font-bold text-purple">' + AutoSeq.sanitize(pkg.code) + '</td>' +
        '<td>' + AutoSeq.sanitize(pkg.name) + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(pkg.type) + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + pkg.length + 'x' + pkg.width + 'x' + pkg.height + '</td>' +
        '<td class="font-mono">' + pkg.weight + 'kg</td>' +
        '<td class="font-mono">' + pkg.maxLoad + 'kg</td>' +
        '<td class="font-mono">$' + pkg.cost.toFixed(2) + '</td>' +
        '<td>' + (pkg.reusable ? '🔄 Yes' : '❌ No') + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(pkg.material) + '</td>' +
        '<td>' + (pkg.hazardous ? '⚠️ Yes' : '—') + '</td>' +
        '<td><div class="crud-row-actions"><button class="btn btn-sm btn-danger" onclick="AutoSeqUI.deletePackage(\'' + pkg.id + '\')">🗑️</button></div></td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '</div></div>';
    return html;
  }

  function showPackageModal() {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'package-modal';
    modal.innerHTML =
      '<div class="modal" style="min-width:560px">' +
        '<div class="modal-header">➕ Add Package<span class="modal-close" onclick="AutoSeqUI.closeModal()">✕</span></div>' +
        '<div class="modal-body">' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Code</label><input type="text" id="pkg-code" placeholder="STD-BOX-XL"></div>' +
            '<div class="form-group"><label>Name</label><input type="text" id="pkg-name" placeholder="Standard Box XL"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Type</label><select id="pkg-type"><option value="corrugated">Corrugated</option><option value="returnable">Returnable</option><option value="expendable">Expendable</option><option value="pallet">Pallet</option><option value="container">Container</option><option value="tote">Tote</option></select></div>' +
            '<div class="form-group"><label>Material</label><input type="text" id="pkg-material" placeholder="corrugated, wood-ispm15, steel"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Length (in)</label><input type="number" id="pkg-length" value="24"></div>' +
            '<div class="form-group"><label>Width (in)</label><input type="number" id="pkg-width" value="18"></div>' +
            '<div class="form-group"><label>Height (in)</label><input type="number" id="pkg-height" value="12"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Weight (kg)</label><input type="number" step="0.1" id="pkg-weight" value="2.5"></div>' +
            '<div class="form-group"><label>Max Load (kg)</label><input type="number" id="pkg-maxLoad" value="25"></div>' +
            '<div class="form-group"><label>Cost ($)</label><input type="number" step="0.01" id="pkg-cost" value="4.50"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>OEM Spec</label><input type="text" id="pkg-oemSpec" placeholder="AIAG-4, ISPM-15"></div>' +
            '<div class="form-group"><label><input type="checkbox" id="pkg-reusable"> Reusable</label></div>' +
            '<div class="form-group"><label><input type="checkbox" id="pkg-hazardous"> Hazardous</label></div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer"><button class="btn" onclick="AutoSeqUI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="AutoSeqUI.savePackage()">Create</button></div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function savePackage() {
    Logistics.addPackage({
      code: document.getElementById('pkg-code').value.trim(),
      name: document.getElementById('pkg-name').value.trim(),
      type: document.getElementById('pkg-type').value,
      material: document.getElementById('pkg-material').value.trim(),
      length: parseFloat(document.getElementById('pkg-length').value) || 12,
      width: parseFloat(document.getElementById('pkg-width').value) || 12,
      height: parseFloat(document.getElementById('pkg-height').value) || 12,
      weight: parseFloat(document.getElementById('pkg-weight').value) || 1,
      maxLoad: parseFloat(document.getElementById('pkg-maxLoad').value) || 25,
      cost: parseFloat(document.getElementById('pkg-cost').value) || 0,
      oemSpec: document.getElementById('pkg-oemSpec').value.trim(),
      reusable: document.getElementById('pkg-reusable').checked,
      hazardous: document.getElementById('pkg-hazardous').checked,
    });
    AutoSeq.alert('success', 'Package Added', document.getElementById('pkg-code').value);
    closeModal();
    switchView('packages');
  }

  function deletePackage(id) {
    if (confirm('Delete this package?')) {
      Logistics.deletePackage(id);
      AutoSeq.alert('success', 'Deleted', 'Package removed');
      switchView('packages');
    }
  }

  // ══════════════════════════════════════════════════════════
  //  PALLET STAGING VIEW
  // ══════════════════════════════════════════════════════════

  function renderPallets() {
    var pallets = Logistics.state.pallets;
    var stats = Logistics.getLogisticsStats();

    var html = '<div class="dashboard-grid" style="margin-bottom:14px">';
    html += '<div class="stat-card" style="--accent-color:var(--purple);padding:10px"><div class="stat-label">Total Pallets</div><div class="stat-value" style="font-size:18px">' + stats.pallets + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:10px"><div class="stat-label">Staged</div><div class="stat-value" style="font-size:18px">' + stats.palletsStaged + '</div></div>';
    html += '</div>';

    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🛒</span> Pallet Staging & Build<div class="panel-actions"><button class="btn btn-primary btn-sm" onclick="AutoSeqUI.showPalletModal()">➕ Build Pallet</button></div></div><div class="panel-body">';

    pallets.forEach(function(pal) {
      html += '<div style="border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:10px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      html += '<div><strong>' + AutoSeq.sanitize(pal.palletNumber) + '</strong> — ' + AutoSeq.sanitize(pal.type) + ' | ' + pal.totalPackages + ' packages | ' + pal.totalWeight + 'kg</div>';
      html += '<span class="status-badge status-' + (pal.status === 'staged' ? 'complete' : 'pending') + '">' + pal.status + '</span>';
      html += '</div>';

      // 3D pallet visual
      html += '<div class="pallet3d-scene" style="min-height:160px;padding:10px">';
      html += '<div class="pallet3d-stage" style="transform:rotateX(30deg) rotateY(-10deg)">';
      html += '<div class="pallet3d-base"><div class="pallet3d-slats"><div class="pallet3d-slat"></div><div class="pallet3d-slat"></div><div class="pallet3d-slat"></div><div class="pallet3d-slat"></div></div></div>';
      // Stack boxes on top
      var boxY = -20;
      pal.packageIds.slice(0, 5).forEach(function(pkgId, idx) {
        var pkg = Logistics.state.packages.find(function(p) { return p.id === pkgId; });
        var w = pkg ? Math.min(180, pkg.width * 3) : 60;
        var h = pkg ? Math.min(40, pkg.height * 2) : 20;
        var x = (200 - w) / 2 - 100;
        html += '<div class="pallet3d-box" style="width:' + w + 'px;height:' + h + 'px;bottom:' + boxY + 'px;left:50%;transform:translateX(-50%) translateZ(20px)">' + (pkg ? pkg.code : '?') + '</div>';
        boxY -= h + 2;
      });
      html += '</div></div>';

      html += '<div style="font-size:10px;color:var(--text-muted);margin-top:6px">Destination: ' + AutoSeq.sanitize(pal.destination || '—') + ' | Cost: $' + pal.cost.toFixed(2) + '</div>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function showPalletModal() {
    var pkgs = Logistics.state.packages;
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'pallet-modal';
    var pkgOptions = pkgs.map(function(p) { return '<option value="' + p.id + '">' + p.code + ' — ' + p.name + ' (' + p.weight + 'kg)</option>'; }).join('');
    modal.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header">🛒 Build Pallet<span class="modal-close" onclick="AutoSeqUI.closeModal()">✕</span></div>' +
        '<div class="modal-body">' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Pallet Number</label><input type="text" id="pal-number" placeholder="PAL-0003"></div>' +
            '<div class="form-group"><label>Type</label><select id="pal-type"><option value="STD-48x40">Standard 48x40</option><option value="CHEP-48x45">CHEP 48x45</option><option value="EUR-80x120">Euro 80x120</option></select></div>' +
          '</div>' +
          '<div class="form-group"><label>Destination</label><input type="text" id="pal-destination" placeholder="Bldg B (Staging)"></div>' +
          '<div class="form-group"><label>Package 1</label><select id="pal-pkg1">' + pkgOptions + '</select></div>' +
          '<div class="form-group"><label>Package 2</label><select id="pal-pkg2">' + pkgOptions + '</select></div>' +
          '<div class="form-group"><label>Package 3</label><select id="pal-pkg3"><option value="">(none)</option>' + pkgOptions + '</select></div>' +
        '</div>' +
        '<div class="modal-footer"><button class="btn" onclick="AutoSeqUI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="AutoSeqUI.savePallet()">Build</button></div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function savePallet() {
    var pkgIds = [];
    ['pal-pkg1','pal-pkg2','pal-pkg3'].forEach(function(id) {
      var v = document.getElementById(id).value;
      if (v) pkgIds.push(v);
    });
    var totalWeight = 0;
    pkgIds.forEach(function(pid) {
      var pkg = Logistics.state.packages.find(function(p) { return p.id === pid; });
      if (pkg) totalWeight += pkg.weight;
    });
    Logistics.addPallet({
      palletNumber: document.getElementById('pal-number').value.trim(),
      type: document.getElementById('pal-type').value,
      destination: document.getElementById('pal-destination').value.trim(),
      packageIds: pkgIds,
      totalWeight: totalWeight,
    });
    AutoSeq.alert('success', 'Pallet Built', document.getElementById('pal-number').value || 'New pallet');
    closeModal();
    switchView('pallets');
  }

  // ══════════════════════════════════════════════════════════
  //  CKD & END-TO-END SHIPPING VIEW
  // ══════════════════════════════════════════════════════════

  function renderLogistics() {
    var stats = Logistics.getLogisticsStats();
    var shipments = Logistics.state.shipments;
    var ckdKits = Logistics.state.ckdKits;
    var docks = Logistics.state.dryDocks;

    var html = '';

    // Stats
    html += '<div class="dashboard-grid" style="margin-bottom:14px">';
    html += '<div class="stat-card" style="--accent-color:var(--blue);padding:10px"><div class="stat-label">CKD Kits</div><div class="stat-value" style="font-size:18px">' + stats.ckdKits + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--purple);padding:10px"><div class="stat-label">Shipments</div><div class="stat-value" style="font-size:18px">' + stats.shipments + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--yellow);padding:10px"><div class="stat-label">In Transit</div><div class="stat-value" style="font-size:18px;color:var(--yellow)">' + stats.inTransit + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:10px"><div class="stat-label">Dry Docks Avail</div><div class="stat-value" style="font-size:18px">' + stats.dryDocksAvailable + '/' + stats.dryDocks + '</div></div>';
    html += '</div>';

    // CKD Kits
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">📦</span> CKD Kits — Completely Knocked Down Export</div><div class="panel-body">';
    html += '<table class="data-table"><thead><tr><th>Kit #</th><th>Description</th><th>Level</th><th>Origin</th><th>Destination</th><th>Parts</th><th>Weight</th><th>Value</th><th>Container</th><th>Seal</th><th>Status</th></tr></thead><tbody>';
    ckdKits.forEach(function(kit) {
      html += '<tr><td class="font-mono font-bold text-purple">' + AutoSeq.sanitize(kit.kitNumber) + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(kit.description) + '</td>' +
        '<td><span class="status-badge status-active">' + kit.ckdLevel + '</span></td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(kit.origin) + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(kit.destination) + '</td>' +
        '<td>' + kit.parts.length + '</td>' +
        '<td class="font-mono">' + kit.totalWeight + 'kg</td>' +
        '<td class="font-mono">$' + kit.totalValue.toLocaleString() + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(kit.containerId) + '</td>' +
        '<td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(kit.sealNumber) + '</td>' +
        '<td><span class="status-badge status-' + (kit.status === 'in_transit' ? 'pending' : 'active') + '">' + kit.status.replace(/_/g, ' ') + '</span></td></tr>';
    });
    html += '</tbody></table></div></div>';

    // End-to-End Shipments with route diagrams
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🚢</span> End-to-End Shipping — Ocean / Rail / Truck</div><div class="panel-body">';
    shipments.forEach(function(shp) {
      var modeIcon = shp.mode === 'ocean' ? '🚢' : shp.mode === 'rail' ? '🚂' : '🚛';
      html += '<div style="border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:10px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      html += '<div>' + modeIcon + ' <strong>' + AutoSeq.sanitize(shp.shipmentNumber) + '</strong> — ' + AutoSeq.sanitize(shp.carrier) + ' | BOL: ' + AutoSeq.sanitize(shp.billOfLading) + ' | Container: ' + AutoSeq.sanitize(shp.containerNumber) + '</div>';
      html += '<span class="status-badge status-' + (shp.status === 'in_transit' ? 'pending' : 'active') + '">' + shp.status.replace(/_/g, ' ') + '</span>';
      html += '</div>';

      // Route diagram
      if (shp.route && shp.route.length > 0) {
        html += '<div class="shipment-route">';
        shp.route.forEach(function(node, idx) {
          if (idx > 0) html += '<span class="shipment-arrow">→</span>';
          html += '<div class="shipment-node ' + node.type + '">';
          html += '<div style="font-weight:600">' + AutoSeq.sanitize(node.port) + '</div>';
          html += '<div style="font-size:9px;color:var(--text-muted)">' + AutoSeq.sanitize(node.date) + ' (' + node.type + ')</div>';
          html += '</div>';
        });
        html += '</div>';
      }

      html += '<div style="display:flex;gap:20px;flex-wrap:wrap;font-size:10px;margin-top:6px">';
      html += '<span><strong>ETD:</strong> ' + AutoSeq.sanitize(shp.etd) + '</span>';
      html += '<span><strong>ETA:</strong> ' + AutoSeq.sanitize(shp.eta) + '</span>';
      html += '<span><strong>Transit:</strong> ' + shp.transitDays + ' days</span>';
      html += '<span><strong>Incoterm:</strong> ' + AutoSeq.sanitize(shp.incoterm) + '</span>';
      html += '<span><strong>Gross:</strong> ' + shp.grossWeight + 'kg</span>';
      html += '<span><strong>TEU:</strong> ' + shp.teu + '</span>';
      html += '<span><strong>Landed:</strong> <span style="color:var(--emerald);font-weight:700">$' + shp.totalLanded.toLocaleString() + '</span></span>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    // Dry Docks
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">⚓</span> Dry Dock Management</div><div class="panel-body">';
    html += '<table class="data-table"><thead><tr><th>Dock</th><th>Location</th><th>Capacity</th><th>Assigned</th><th>Status</th><th>Notes</th></tr></thead><tbody>';
    docks.forEach(function(dock) {
      html += '<tr><td class="font-mono font-bold text-purple">' + AutoSeq.sanitize(dock.name) + '</td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(dock.location) + '</td>' +
        '<td>' + dock.capacity + '</td>' +
        '<td>' + dock.assignedShipments.length + ' shipment(s)</td>' +
        '<td><span class="status-badge status-' + (dock.status === 'available' ? 'active' : 'pending') + '">' + dock.status + '</span></td>' +
        '<td style="font-size:10px">' + AutoSeq.sanitize(dock.notes) + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    return html;
  }

  // ══════════════════════════════════════════════════════════
  //  SHIPYARDS VIEW — 3D Container Terminal
  // ══════════════════════════════════════════════════════════

  function renderShipyards() {
    var yards = Logistics.state.shipyards;
    var stats = Logistics.getLogisticsStats();

    var html = '<div class="dashboard-grid" style="margin-bottom:14px">';
    html += '<div class="stat-card" style="--accent-color:var(--blue);padding:10px"><div class="stat-label">Shipyards</div><div class="stat-value" style="font-size:18px">' + stats.shipyards + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:10px"><div class="stat-label">Active Vessels</div><div class="stat-value" style="font-size:18px">' + stats.activeVessels + '</div></div>';
    html += '</div>';

    yards.forEach(function(sy) {
      html += '<div class="panel"><div class="panel-header"><span class="panel-icon">⚓</span> ' + AutoSeq.sanitize(sy.name) + ' — ' + AutoSeq.sanitize(sy.location) + '</div><div class="panel-body">';

      // 3D Shipyard scene
      html += '<div class="shipyard-scene">';
      html += '<div class="shipyard-water"></div>';
      html += '<div class="shipyard-dock"></div>';
      html += '<div class="shipyard-yard"></div>';

      // Container stacks (3 stacks)
      html += '<div class="container-stack" style="left:5%">';
      for (var i = 0; i < 4; i++) {
        var c = ['#8E44AD','#3498DB','#2ECC71','#E67E22'][i % 4];
        html += '<div class="container-box" style="background:' + c + '">CONT</div>';
      }
      html += '</div>';

      html += '<div class="container-stack" style="left:20%">';
      for (var i = 0; i < 3; i++) {
        var c = ['#E67E22','#8E44AD','#3498DB'][i % 3];
        html += '<div class="container-box" style="background:' + c + '">' + (sy.containerStacks > i ? 'STACK' : '') + '</div>';
      }
      html += '</div>';

      html += '<div class="container-stack" style="left:35%">';
      for (var i = 0; i < 5; i++) {
        var c = ['#2ECC71','#E67E22','#8E44AD','#3498DB','#2ECC71'][i % 5];
        html += '<div class="container-box" style="background:' + c + '">CONT</div>';
      }
      html += '</div>';

      // Gantry crane
      html += '<div class="gantry-crane" style="left:55%">';
      html += '<div class="gantry-beam"></div>';
      html += '<div class="gantry-trolley" style="left:30px"></div>';
      html += '<div class="gantry-cable" style="left:36px"></div>';
      html += '<div class="gantry-spreader"></div>';
      html += '<div class="gantry-leg-l"></div>';
      html += '<div class="gantry-leg-r"></div>';
      html += '</div>';

      // Vessel at berth (if any)
      if (sy.vessels && sy.vessels.length > 0) {
        sy.vessels.forEach(function(v, idx) {
          html += '<div class="vessel" style="right:' + (5 + idx * 15) + '%;bottom:30px">';
          html += '<div class="vessel-hull"></div>';
          html += '<div class="vessel-deck"></div>';
          // Container stacks on vessel
          html += '<div class="vessel-stack" style="left:10px">';
          for (var i = 0; i < 5; i++) {
            var c = ['#8E44AD','#3498DB','#2ECC71','#E67E22','#E74C3C'][i % 5];
            html += '<div style="display:flex;gap:1px"><div class="vessel-container" style="background:' + c + '"></div><div class="vessel-container" style="background:' + c + '"></div><div class="vessel-container" style="background:' + c + '"></div><div class="vessel-container" style="background:' + c + '"></div></div>';
          }
          html += '</div>';
          html += '</div>';
        });
      }

      html += '</div>'; // scene

      // Vessel table
      if (sy.vessels && sy.vessels.length > 0) {
        html += '<table class="data-table" style="margin-top:10px"><thead><tr><th>Vessel</th><th>Type</th><th>TEU</th><th>Berth</th><th>Status</th><th>ETA</th><th>ETD</th></tr></thead><tbody>';
        sy.vessels.forEach(function(v) {
          html += '<tr><td class="font-mono font-bold text-blue">' + AutoSeq.sanitize(v.name) + '</td><td>' + AutoSeq.sanitize(v.type) + '</td><td class="font-mono">' + v.teu + '</td><td>Berth ' + v.berth + '</td><td><span class="status-badge status-pending">' + v.status + '</span></td><td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(v.eta) + '</td><td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(v.etd) + '</td></tr>';
        });
        html += '</tbody></table>';
      } else {
        html += '<p class="text-muted text-center" style="padding:10px">No vessels currently at berth.</p>';
      }

      html += '<div style="font-size:10px;color:var(--text-muted);margin-top:6px">Berths: ' + sy.berths + ' | Cranes: ' + sy.craneCount + ' | Container Stacks: ' + sy.containerStacks + ' | ' + AutoSeq.sanitize(sy.notes || '') + '</div>';
      html += '</div></div>';
    });

    return html;
  }

  // ══════════════════════════════════════════════════════════
  //  TRANSPORT VIEW — Trucks, Rail, Pipelines
  // ══════════════════════════════════════════════════════════

  function renderTransport() {
    var trucks = Logistics.state.trucks;
    var trains = Logistics.state.railTrains;
    var pipelines = Logistics.state.pipelines;
    var stats = Logistics.getLogisticsStats();

    var html = '';

    // Stats
    html += '<div class="dashboard-grid" style="margin-bottom:14px">';
    html += '<div class="stat-card" style="--accent-color:var(--orange);padding:10px"><div class="stat-label">Trucks</div><div class="stat-value" style="font-size:18px">' + stats.trucks + '</div><div class="stat-sub">' + stats.trucksInTransit + ' in transit</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--blue);padding:10px"><div class="stat-label">Rail Trains</div><div class="stat-value" style="font-size:18px">' + stats.railTrains + '</div><div class="stat-sub">' + stats.railcars + ' railcars</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:10px"><div class="stat-label">Pipelines</div><div class="stat-value" style="font-size:18px">' + stats.pipelines + '</div><div class="stat-sub">' + stats.pipelinesFlowing + ' flowing</div></div>';
    html += '</div>';

    // Tractor Trailers
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🚛</span> Tractor Trailer Fleet</div><div class="panel-body">';
    html += '<table class="data-table"><thead><tr><th>Unit</th><th>Type</th><th>Carrier</th><th>Driver</th><th>Trailer</th><th>Capacity</th><th>Location</th><th>Destination</th><th>Status</th><th>ETA</th></tr></thead><tbody>';
    trucks.forEach(function(t) {
      var stBadge = t.status === 'in_transit' ? 'status-pending' : t.status === 'loading' ? 'status-loaded' : t.status === 'returning' ? 'status-active' : 'status-shipped';
      html += '<tr><td class="font-mono font-bold text-purple">' + AutoSeq.sanitize(t.unit) + '</td><td style="font-size:10px">' + AutoSeq.sanitize(t.type) + '</td><td>' + AutoSeq.sanitize(t.carrier) + '</td><td>' + AutoSeq.sanitize(t.driver) + '</td><td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(t.trailerId || '—') + '</td><td class="font-mono">' + t.capacity + 'lb</td><td style="font-size:10px">' + AutoSeq.sanitize(t.currentLocation) + '</td><td style="font-size:10px">' + AutoSeq.sanitize(t.destination) + '</td><td><span class="status-badge ' + stBadge + '">' + t.status.replace(/_/g,' ') + '</span></td><td class="font-mono" style="font-size:10px">' + AutoSeq.sanitize(t.eta || '—') + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '</div></div>';

    // Rail Trains with visual consist
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🚆</span> Rail Operations — Train Consists</div><div class="panel-body">';
    trains.forEach(function(train) {
      html += '<div class="rail-scene">';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:6px">';
      html += '<div><strong>' + AutoSeq.sanitize(train.trainNumber) + '</strong> — ' + AutoSeq.sanitize(train.carrier) + ' | ' + AutoSeq.sanitize(train.route) + '</div>';
      html += '<span class="status-badge status-' + (train.status === 'in_transit' ? 'pending' : 'active') + '">' + train.status.replace(/_/g,' ') + '</span>';
      html += '</div>';

      // Visual rail track with cars
      html += '<div class="rail-track">';
      // Locomotives
      for (var l = 0; l < train.locomotives; l++) {
        html += '<div class="railcar"><div class="railcar-body locomotive">LOCO</div><div class="railcar-wheels"><div class="railcar-wheel"></div><div class="railcar-wheel"></div></div></div>';
      }
      // Railcars
      train.railcars.forEach(function(rc) {
        var bodyCls = 'railcar-body' + (rc.loaded ? ' loaded' : '');
        var label = rc.type + (rc.containerId ? ' ' + rc.containerId.substring(0, 8) : '');
        html += '<div class="railcar"><div class="' + bodyCls + '">' + AutoSeq.sanitize(label.substring(0, 12)) + '</div><div class="railcar-wheels"><div class="railcar-wheel"></div><div class="railcar-wheel"></div></div></div>';
      });
      html += '</div>';

      html += '<div style="display:flex;gap:20px;flex-wrap:wrap;font-size:10px;margin-top:6px">';
      html += '<span><strong>Locos:</strong> ' + train.locomotives + '</span>';
      html += '<span><strong>Cars:</strong> ' + train.railcars.length + '</span>';
      html += '<span><strong>TEU:</strong> ' + train.totalTEU + '</span>';
      html += '<span><strong>ETD:</strong> ' + AutoSeq.sanitize(train.etd) + '</span>';
      html += '<span><strong>ETA:</strong> ' + AutoSeq.sanitize(train.eta) + '</span>';
      html += '<span><strong>Transit:</strong> ' + train.transitDays + ' days</span>';
      html += '<span style="font-size:9px;color:var(--text-muted)">' + AutoSeq.sanitize(train.notes || '') + '</span>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    // Pipelines with flow visual
    html += '<div class="panel"><div class="panel-header"><span class="panel-icon">🔧</span> Pipeline Operations</div><div class="panel-body">';
    pipelines.forEach(function(pipe) {
      var isFlowing = pipe.status === 'flowing';
      html += '<div class="rail-scene">';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:6px">';
      html += '<div><strong>' + AutoSeq.sanitize(pipe.name) + '</strong> — ' + AutoSeq.sanitize(pipe.product) + '</div>';
      html += '<span class="status-badge status-' + (isFlowing ? 'active' : 'pending') + '">' + pipe.status + '</span>';
      html += '</div>';

      // Pipeline flow visual
      html += '<div class="pipeline-flow">';
      pipe.stations.forEach(function(st, idx) {
        if (idx > 0) {
          html += '<div class="pipeline-segment ' + (isFlowing ? 'flowing' : '') + '"></div>';
        }
        html += '<div class="pipeline-station">';
        html += '<div class="pipeline-station-dot" style="background:' + (st.status === 'active' ? 'var(--emerald)' : 'var(--red)') + '"></div>';
        html += '<div>' + AutoSeq.sanitize(st.name.substring(0, 12)) + '</div>';
        html += '<div style="font-size:7px;color:var(--text-muted)">' + st.pressure + ' psi</div>';
        html += '</div>';
      });
      html += '</div>';

      html += '<div style="display:flex;gap:20px;flex-wrap:wrap;font-size:10px;margin-top:6px">';
      html += '<span><strong>Diameter:</strong> ' + pipe.diameter + 'in</span>';
      html += '<span><strong>Length:</strong> ' + pipe.length + 'mi</span>';
      html += '<span><strong>Pressure:</strong> ' + pipe.pressure + ' psi</span>';
      html += '<span><strong>Flow:</strong> ' + pipe.flowRate + ' ' + pipe.unit + '</span>';
      html += '<span><strong>Utilization:</strong> ' + pipe.utilization + '%</span>';
      html += '<span><strong>Last Insp:</strong> ' + AutoSeq.sanitize(pipe.lastInspection) + '</span>';
      html += '<span><strong>Next Insp:</strong> ' + AutoSeq.sanitize(pipe.nextInspection) + '</span>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    return html;
  }

  // ══════════════════════════════════════════════════════════
  //  COST ANALYSIS VIEW
  // ══════════════════════════════════════════════════════════

  function renderCostAnalysis() {
    var summary = Logistics.getCostSummary();
    var shipments = Logistics.state.shipments;

    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">💰</span> Cost Analysis — Total Landed Cost Breakdown</div><div class="panel-body">';

    // Summary cards
    html += '<div class="dashboard-grid" style="margin-bottom:14px">';
    html += '<div class="stat-card" style="--accent-color:var(--red);padding:10px"><div class="stat-label">Total Landed Cost</div><div class="stat-value" style="font-size:20px;color:var(--red)">$' + summary.totalLanded.toLocaleString() + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--blue);padding:10px"><div class="stat-label">Total Freight</div><div class="stat-value" style="font-size:18px">$' + summary.totalFreight.toLocaleString() + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--yellow);padding:10px"><div class="stat-label">Customs Duty</div><div class="stat-value" style="font-size:18px">$' + summary.totalCustoms.toLocaleString() + '</div></div>';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:10px"><div class="stat-label">Avg/Shipment</div><div class="stat-value" style="font-size:18px">$' + summary.avgLandedPerShipment.toLocaleString() + '</div></div>';
    html += '</div>';

    // Per-shipment cost breakdown
    html += '<div class="ai-section-header">Per-Shipment Cost Breakdown</div>';
    shipments.forEach(function(shp) {
      var breakdown = Logistics.getShipmentCostBreakdown(shp.id);
      if (!breakdown) return;

      html += '<div style="border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:10px">';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px">';
      html += '<strong>' + AutoSeq.sanitize(shp.shipmentNumber) + '</strong> — ' + AutoSeq.sanitize(shp.origin) + ' → ' + AutoSeq.sanitize(shp.destination);
      html += '<span style="color:var(--emerald);font-weight:700">$' + shp.totalLanded.toLocaleString() + '</span>';
      html += '</div>';

      // Cost bar (stacked)
      html += '<div class="cost-bar-container">';
      breakdown.slice(0, 6).forEach(function(item) {
        if (item.percent > 0) {
          html += '<div class="cost-bar-segment" style="width:' + item.percent + '%;background:' + item.color + '">' + item.percent + '%</div>';
        }
      });
      html += '</div>';

      // Breakdown rows
      breakdown.forEach(function(item) {
        html += '<div class="cost-breakdown-row">';
        html += '<span style="color:var(--text-muted)">' + item.label + '</span>';
        html += '<span class="cost-amount" style="color:' + item.color + '">$' + item.amount.toLocaleString() + ' (' + item.percent + '%)</span>';
        html += '</div>';
      });

      html += '</div>';
    });

    // Cost summary table
    html += '<div class="ai-section-header">Cost Summary by Category</div>';
    html += '<table class="data-table"><thead><tr><th>Category</th><th>Total</th><th>% of Landed</th></tr></thead><tbody>';
    var cats = [
      ['Cargo Value', summary.totalCargo, 'var(--emerald)'],
      ['Freight', summary.totalFreight, 'var(--blue)'],
      ['Insurance', summary.totalInsurance, 'var(--purple)'],
      ['Customs Duty', summary.totalCustoms, 'var(--yellow)'],
      ['Handling', summary.totalHandling, 'var(--orange)'],
      ['Port Charges', summary.totalPort, 'var(--cyan)'],
    ];
    cats.forEach(function(c) {
      var pct = summary.totalLanded > 0 ? Math.round((c[1] / summary.totalLanded) * 100) : 0;
      html += '<tr><td>' + c[0] + '</td><td class="font-mono" style="color:' + c[2] + '">$' + c[1].toLocaleString() + '</td><td>' + pct + '%</td></tr>';
    });
    html += '<tr style="font-weight:700"><td>TOTAL LANDED</td><td class="font-mono" style="color:var(--red)">$' + summary.totalLanded.toLocaleString() + '</td><td>100%</td></tr>';
    html += '</tbody></table>';

    html += '</div></div>';
    return html;
  }

  // ══════════════════════════════════════════════════════════
  //  DOCUMENTATION VIEW
  // ══════════════════════════════════════════════════════════

  var docTab = 'quickstart';

  function renderDocs() {
    var html = '<div class="panel"><div class="panel-header"><span class="panel-icon">📖</span> OwlLogics NexGen Documentation — End User & Power User Guide</div><div class="panel-body">';

    html += '<div class="doc-tabs">';
    html += '<div class="doc-tab' + (docTab === 'quickstart' ? ' active' : '') + '" onclick="AutoSeqUI.setDocTab(\'quickstart\')">🚀 Quick Start</div>';
    html += '<div class="doc-tab' + (docTab === 'operator' ? ' active' : '') + '" onclick="AutoSeqUI.setDocTab(\'operator\')">🏭 Operator Guide</div>';
    html += '<div class="doc-tab' + (docTab === 'power' ? ' active' : '') + '" onclick="AutoSeqUI.setDocTab(\'power\')">⚙️ Power User</div>';
    html += '<div class="doc-tab' + (docTab === 'admin' ? ' active' : '') + '" onclick="AutoSeqUI.setDocTab(\'admin\')">🔧 Admin Config</div>';
    html += '<div class="doc-tab' + (docTab === 'troubleshoot' ? ' active' : '') + '" onclick="AutoSeqUI.setDocTab(\'troubleshoot\')">❓ Troubleshooting</div>';
    html += '<div class="doc-tab' + (docTab === 'api' ? ' active' : '') + '" onclick="AutoSeqUI.setDocTab(\'api\')">📡 API Reference</div>';
    html += '<div class="doc-tab' + (docTab === 'mobile' ? ' active' : '') + '" onclick="AutoSeqUI.setDocTab(\'mobile\')">📱 Mobile Setup</div>';
    html += '<div class="doc-tab' + (docTab === 'platforms' ? ' active' : '') + '" onclick="AutoSeqUI.setDocTab(\'platforms\')">🎮 Xbox & Steam</div>';
    html += '</div>';

    html += '<div class="doc-section" id="doc-content">' + renderDocContent() + '</div>';

    html += '</div></div>';
    return html;
  }

  function setDocTab(tab) {
    docTab = tab;
    var content = document.getElementById('doc-content');
    if (content) content.innerHTML = renderDocContent();
    document.querySelectorAll('.doc-tab').forEach(function(t) { t.classList.remove('active'); });
    if (window.event && window.event.target) window.event.target.classList.add('active');
    else {
      var tabs = document.querySelectorAll('.doc-tab');
      tabs.forEach(function(t) {
        if (t.textContent.indexOf(tab) >= 0 || t.getAttribute('onclick') === "AutoSeqUI.setDocTab('" + tab + "')") {
          t.classList.add('active');
        }
      });
    }
  }

  function toggleMobileSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  }

  // Close sidebar when a nav item is clicked (mobile)
  function closeMobileSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('open');
  }

  function renderDocContent() {
    if (docTab === 'quickstart') return renderDocQuickStart();
    if (docTab === 'operator') return renderDocOperator();
    if (docTab === 'power') return renderDocPower();
    if (docTab === 'admin') return renderDocAdmin();
    if (docTab === 'troubleshoot') return renderDocTroubleshoot();
    if (docTab === 'api') return renderDocAPI();
    if (docTab === 'mobile') return renderDocMobile();
    if (docTab === 'platforms') return renderDocPlatforms();
    return '';
  }

  function renderDocQuickStart() {
    var h = '';
    h += '<h3>🚀 Quick Start — Get Running in 30 Seconds</h3>';
    h += '<p>OwlLogics NexGen Owl Mode is a self-contained web application. No server, no install, no internet required. Just open the file and go.</p>';

    h += '<h4>Option 1: Desktop Shortcut (Easiest)</h4>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">Look for the <strong>🦉 OwlLogics</strong> icon on your Windows Desktop</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Double-click it — the app opens in your default browser</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Watch the verbose boot loader (11 steps, ~2 seconds) — shows progress bar and timing</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-content">Dashboard appears with MSQM streaming live — you\'re ready!</div></div>';

    h += '<h4>Option 2: Direct File Open</h4>';
    h += '<p>Navigate to <code>C:\\Users\\<your-user>\\AutoSeq\\</code> and double-click <code>index.html</code></p>';

    h += '<h4>Option 3: Auto-Launch on Boot</h4>';
    h += '<p>OwlLogics is in your Windows Startup folder — it launches automatically every time you boot your PC. To remove: delete the shortcut from <code>%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\OwlLogics.lnk</code></p>';

    h += '<h3>📍 What You\'ll See</h3>';
    h += '<ul>';
    h += '<li><strong>Left sidebar</strong> — 25 views organized by category</li>';
    h += '<li><strong>Top bar</strong> — OwlLogics brand, MSQM toggle, global search</li>';
    h += '<li><strong>Bottom status bar</strong> — sequences count, MSQM status, scan count</li>';
    h += '<li><strong>Main content</strong> — the active view (Dashboard by default)</li>';
    h += '</ul>';

    h += '<h3>🎯 First Things to Try</h3>';
    h += '<ul>';
    h += '<li>Click <strong>🏭 Shop Floor</strong> in the sidebar — see the operator interface</li>';
    h += '<li>Click <strong>📋 Sequence Manager</strong> — view sequences sorted by number</li>';
    h += '<li>Click <strong>📦 Rack Loading</strong> — toggle 2D/3D view</li>';
    h += '<li>Click <strong>🧠 AI Optimizer</strong> — run a full analysis</li>';
    h += '<li>Click <strong>📊 Live Metrics</strong> — see real-time gauges</li>';
    h += '</ul>';

    h += '<h3>💾 Your Data is Safe</h3>';
    h += '<p>All data is stored in <code>localStorage</code> — it survives page refreshes and browser restarts. Auto-save runs every 30 seconds. Your data never leaves your machine. To clear all data: use the <strong>🔌 Protocols</strong> view → "Clear Data" button.</p>';
    return h;
  }

  function renderDocOperator() {
    var h = '';
    h += '<h3>🏭 Operator Guide — Shop Floor Workflow</h3>';
    h += '<p>This guide is for shop floor operators who scan parts and load racks.</p>';

    h += '<h4>1. Open the Shop Floor View</h4>';
    h += '<p>Click <strong>🏭 Shop Floor</strong> in the sidebar. You\'ll see:</p>';
    h += '<ul>';
    h += '<li><strong>Top cards</strong> — pending sequences, loaded count, active racks, errors</li>';
    h += '<li><strong>Current sequence</strong> — the NEXT part to load (green border)</li>';
    h += '<li><strong>Scanner bar</strong> — big input field for your barcode scanner</li>';
    h += '<li><strong>Queue</strong> — list of upcoming sequences</li>';
    h += '</ul>';

    h += '<h4>2. Scan a Part</h4>';
    h += '<p>Click in the scanner bar (or just start scanning — it auto-focuses). Scan the part barcode on the part you\'re picking.</p>';
    h += '<ul>';
    h += '<li><strong>✅ Correct part</strong> — green beep, slot loads, next sequence shows</li>';
    h += '<li><strong>❌ Wrong part</strong> — red alarm sound, error message, slot stays empty</li>';
    h += '<li><strong>⚠️ Already loaded</strong> — warning, part was already scanned</li>';
    h += '</ul>';

    h += '<h4>3. Load the Rack</h4>';
    h += '<p>Go to <strong>📦 Rack Loading</strong> to see the visual rack. Toggle <strong>📦 3D Rack View</strong> for a 3D perspective. Each slot shows:</p>';
    h += '<ul>';
    h += '<li><strong>Green slot</strong> — loaded with the correct part</li>';
    h += '<li><strong>Glowing green border</strong> — next slot to load (scan the expected part)</li>';
    h += '<li><strong>Red slot</strong> — error (wrong part was scanned)</li>';
    h += '<li><strong>Dashed/empty</strong> — not yet loaded</li>';
    h += '</ul>';

    h += '<h4>4. Complete the Rack</h4>';
    h += '<p>When all slots are loaded, click <strong>✓ Mark Complete & Stage</strong>. The rack moves to staging for delivery.</p>';

    h += '<h4>5. Kitting (if required)</h4>';
    h += '<p>Some parts require kitting before loading. Go to <strong>🔧 Kitting</strong> to assemble kits. Each kit shows a component checklist — scan each component to complete the kit.</p>';

    h += '<h4>Keyboard Shortcuts</h4>';
    h += '<ul>';
    h += '<li><code>Escape</code> — close any modal/popup</li>';
    h += '<li><code>Enter</code> in scanner bar — submit scan</li>';
    h += '<li>Click outside a modal — closes it</li>';
    h += '</ul>';
    return h;
  }

  function renderDocPower() {
    var h = '';
    h += '<h3>⚙️ Power User Guide — Advanced Features</h3>';

    h += '<h4>Sequence Manager — Sorting & Filtering</h4>';
    h += '<p>The <strong>📋 Sequence Manager</strong> has 9 sort fields and 5 filters:</p>';
    h += '<ul>';
    h += '<li><strong>Sort by:</strong> Sequence #, Date, VIN, OEM, Line, Part, Commodity, Description, Status</li>';
    h += '<li><strong>Filters:</strong> Status, OEM, Line, Commodity, Text Search</li>';
    h += '<li>Click any <strong>column header</strong> to sort by that column — click again to reverse</li>';
    h += '<li>Use the <strong>↑ Asc / ↓ Desc</strong> button to toggle direction</li>';
    h += '<li><strong>↻ Reset</strong> button clears all filters</li>';
    h += '</ul>';

    h += '<h4>3D Rack Visualizer</h4>';
    h += '<p>In <strong>📦 Rack Loading</strong>, toggle <strong>📦 3D Rack View</strong> for:</p>';
    h += '<ul>';
    h += '<li>Full 3D perspective with 6-faced slot boxes</li>';
    h += '<li>Rotation controls: ⟲ Left, ⬛ Front, ⟳ Right</li>';
    h += '<li>Hover over any slot to lift it toward you</li>';
    h += '<li>Color legend at bottom shows slot states</li>';
    h += '</ul>';

    h += '<h4>AI Optimizer</h4>';
    h += '<p>The <strong>🧠 AI Optimizer</strong> runs 4 local optimization engines:</p>';
    h += '<ul>';
    h += '<li><strong>📋 Optimize Sequences</strong> — groups by OEM+commodity to reduce changeovers</li>';
    h += '<li><strong>🚚 Optimize Routes</strong> — balances delivery loads across routes</li>';
    h += '<li><strong>🚜 Optimize Forklifts</strong> — matches capacity to delivery, flags overdue maintenance</li>';
    h += '<li><strong>📦 Optimize Racks</strong> — checks utilization and poka-yoke errors</li>';
    h += '<li><strong>🔍 Run Full Analysis</strong> — all 4 engines at once</li>';
    h += '</ul>';
    h += '<p>Recommendations are color-coded: <span style="color:var(--red)">red=critical</span>, <span style="color:var(--orange)">orange=high</span>, <span style="color:var(--yellow)">yellow=medium</span>, <span style="color:var(--blue)">blue=low</span>.</p>';

    h += '<h4>SAP IDoc Export</h4>';
    h += '<p>In <strong>📈 Reports</strong> → Export section, you can export 5 IDoc types:</p>';
    h += '<pre>DELVRY07 — ASN/Delivery (EDI 856) with VIN tracking\nDESADV07 — Despatch Advice\nORDERS05 — Purchase Order (EDI 850)\nINVOIC02 — Invoice (EDI 810)\nMATMAS05 — Material Master\nBatch IDoc — All types in one file</pre>';

    h += '<h4>Forklift Fleet — SAP PM</h4>';
    h += '<p>In <strong>🚜 Forklift Fleet</strong> → <strong>🟡 SAP Integration</strong> tab:</p>';
    h += '<ul>';
    h += '<li>➕ Create PM Order (generates order with operations + spare parts)</li>';
    h += '<li>🔓 Release Order (CRTD → REL)</li>';
    h += '<li>✓ TECO — Technically Complete (records actual hours/cost)</li>';
    h += '<li>🔒 Close Order (TECO → CLSD)</li>';
    h += '<li>📊 Create Measurement Doc (hour meter reading from Lift Link)</li>';
    h += '<li>📤 Export Equipment/Measurement/PM Orders IDoc</li>';
    h += '</ul>';

    h += '<h4>TN3270 Terminal</h4>';
    h += '<p>The <strong>🖥️ TN3270 Terminal</strong> simulates a mainframe connection. Try these commands:</p>';
    h += '<pre>LOGON       — Sign on to TSO/ISPF\nLOGON GUEST — Guest logon (public mainframes)\nCICS        — Start CICS transaction server\nSDSF        — System Display\nISPF        — ISPF/PDF menu\nVM          — z/VM CP commands\nXEDIT       — VM editor\nHELP        — Full command list\nCLEAR       — Clear screen</pre>';
    h += '<p>16 quick-connect presets are available including IBM Z Xplore (free, real z/OS), MVS TK4- (default logins), and public community mainframes.</p>';

    h += '<h4>Logistics & Shipping</h4>';
    h += '<ul>';
    h += '<li><strong>📦 Package Master</strong> — define packaging types (boxes, racks, containers, pallets)</li>';
    h += '<li><strong>🛒 Pallet Staging</strong> — build pallets with 3D visual of stacked boxes</li>';
    h += '<li><strong>🚢 CKD & Shipping</strong> — CKD kits, end-to-end shipments with route diagrams, dry docks</li>';
    h += '<li><strong>⚓ Shipyards</strong> — 3D container terminal with gantry cranes and vessels</li>';
    h += '<li><strong>🚆 Trucks & Rail</strong> — tractor trailers, train consists, animated pipeline flow</li>';
    h += '<li><strong>💰 Cost Analysis</strong> — total landed cost breakdown with stacked cost bars</li>';
    h += '</ul>';
    return h;
  }

  function renderDocAdmin() {
    var h = '';
    h += '<h3>🔧 Administrator Configuration</h3>';

    h += '<h4>Commodity Master — Sequencing Config</h4>';
    h += '<p>The <strong>📦 Commodity Master</strong> defines how racks are sequenced and delivered for each commodity group:</p>';
    h += '<ul>';
    h += '<li><strong>Load Pattern</strong> — Forward (pos 1 first) or Reverse (last pos first)</li>';
    h += '<li><strong>Unload Pattern</strong> — How OEM unloads at line-side</li>';
    h += '<li><strong>Dock Door</strong> — Which dock door ships the rack (e.g. DOCK-12)</li>';
    h += '<li><strong>Delivery Route</strong> — Route/trolley path (e.g. ROUTE-A)</li>';
    h += '<li><strong>Staging Lane</strong> — Where completed racks wait (e.g. LANE-04)</li>';
    h += '<li><strong>Line-Side Presentation</strong> — Sequential, Batch, Kit, or Bulk</li>';
    h += '<li><strong>Takt Time</strong> — Seconds between deliveries</li>';
    h += '<li><strong>OEM Plant Code</strong> — Destination plant (e.g. SHAP, JNAP)</li>';
    h += '<li><strong>Packaging Type</strong> — Returnable, Expendable, or Container</li>';
    h += '</ul>';
    h += '<p>When you create a rack, it automatically inherits all sequencing config from the commodity master.</p>';

    h += '<h4>Item Master — Presentation Config</h4>';
    h += '<p>The <strong>📋 Item Master</strong> defines per-item presentation rules:</p>';
    h += '<ul>';
    h += '<li><strong>Slot Position Override</strong> — Force item to specific rack slot (0=auto)</li>';
    h += '<li><strong>Part Orientation</strong> — face-up, face-down, vertical, horizontal, angled</li>';
    h += '<li><strong>Sequence Priority</strong> — normal, high, critical, expedite</li>';
    h += '<li><strong>Label Type</strong> — AIAG-B3, AIAG-4x6, ZPL-128, ZPL-39</li>';
    h += '<li><strong>Barcode Format</strong> — code128, code39, code93, i2of5, ean13, datamatrix, qrcode</li>';
    h += '<li><strong>Kitting Required</strong> — Must be kitted before rack loading</li>';
    h += '</ul>';

    h += '<h4>Protocol Configuration</h4>';
    h += '<p>The <strong>🔌 Protocols</strong> view configures how OEM demand data is received:</p>';
    h += '<ul>';
    h += '<li><strong>📡 Simulation</strong> — Built-in MSQM pulse generator (default, no external connection)</li>';
    h += '<li><strong>🌐 REST API</strong> — HTTP polling endpoint for OEM demand</li>';
    h += '<li><strong>🔌 WebSocket</strong> — Real-time push from MES/SCADA</li>';
    h += '<li><strong>🐝 MQTT</strong> — IoT broker for factory floor equipment</li>';
    h += '<li><strong>📄 EDI File Import</strong> — Import EDI 866 (CONVIS, pipe, X12, CSV)</li>';
    h += '<li><strong>⚙️ OPC-UA</strong> — Industrial PLC/sensor data via gateway</li>';
    h += '<li><strong>🔌 Serial/RS232</strong> — Direct serial to PLC or scanner</li>';
    h += '<li><strong>☁️ Azure IoT Hub</strong> — MQTT WSS:443 with SAS tokens, Device Twin, Direct Methods</li>';
    h += '</ul>';

    h += '<h4>Azure IoT Hub Setup</h4>';
    h += '<ol>';
    h += '<li>Create an IoT Hub in Azure Portal</li>';
    h += '<li>Register a device — get connection string</li>';
    h += '<li>Paste connection string into OwlLogics Protocols → Azure → Connection String field</li>';
    h += '<li>Set Device ID and Model ID (DTDL)</li>';
    h += '<li>Click Connect — OwlLogics connects via MQTT over WSS:443</li>';
    h += '<li>Telemetry flows: sequence counts, rack status, forklift hours</li>';
    h += '<li>Direct Methods: startSequence, stopSequence, getForkliftStatus, getDeliveryStatus</li>';
    h += '</ol>';

    h += '<h4>Data Persistence</h4>';
    h += '<p>Data is stored in <code>localStorage</code> under key <code>owllogics_state</code>. Auto-save every 30 seconds and on page unload. To manually save: Protocols → "💾 Save Now". To clear: Protocols → "🗑️ Clear Data".</p>';

    h += '<h4>File Structure</h4>';
    h += '<pre>C:\\Users\\<your-user>\\AutoSeq\\\n  index.html          — Main app (boot loader, scripts)\n  css/style.css       — Dark IDE theme (~50KB)\n  js/core.js          — State, MSQM, scanner, persistence\n  js/protocols.js     — 8 protocol adapters\n  js/labels.js        — 7 barcode formats + ZPL\n  js/flvisual.js      — 2D/3D forklift visuals\n  js/sap-forklift.js  — SAP PM BAPI simulation\n  js/sap-idoc.js      — 5 SAP IDoc generators\n  js/owl-ai.js        — Local AI optimization\n  js/metrics.js       — Real-time metrics dashboard\n  js/logistics.js     — Packages, pallets, CKD, shipping\n  js/ui.js            — All 25 view renderers\n  open.bat            — Quick launcher\n  launch_silent.vbs   — Silent launcher (no console)\n  owllogics.ico       — Desktop icon</pre>';
    return h;
  }

  function renderDocTroubleshoot() {
    var h = '';
    h += '<h3>❓ Troubleshooting</h3>';

    h += '<h4>App won\'t load / blank screen</h4>';
    h += '<ul>';
    h += '<li>Check you\'re opening <code>index.html</code> with a modern browser (Chrome, Edge, Firefox)</li>';
    h += '<li>Open browser Developer Tools (F12) → Console tab — look for red errors</li>';
    h += '<li>If "AutoSeqUI is not defined" — a JS file failed to load. Check all files in <code>js/</code> folder exist</li>';
    h += '<li>Try hard refresh: <code>Ctrl+Shift+R</code></li>';
    h += '</ul>';

    h += '<h4>Boot loader hangs on "Verifying script dependencies"</h4>';
    h += '<ul>';
    h += '<li>This means a JS module didn\'t load. Check the <code>js/</code> folder has all 10 files</li>';
    h += '<li>Required files: core.js, protocols.js, labels.js, ui.js, flvisual.js, sap-forklift.js, sap-idoc.js, owl-ai.js, metrics.js, logistics.js</li>';
    h += '</ul>';

    h += '<h4>MSQM not generating sequences</h4>';
    h += '<ul>';
    h += '<li>Check the status bar at bottom — does it show "● MSQM Live"?</li>';
    h += '<li>If not, click the <strong>MSQM</strong> toggle button in the top bar</li>';
    h += '<li>Go to <strong>📡 MSQM Stream</strong> view to see the live broadcast log</li>';
    h += '<li>If using a non-simulation protocol, check your connection settings in <strong>🔌 Protocols</strong></li>';
    h += '</ul>';

    h += '<h4>Scanner not working</h4>';
    h += '<ul>';
    h += '<li>The scanner uses keyboard-wedge detection — just click in the scanner bar and scan</li>';
    h += '<li>USB barcode scanners work as keyboard input — no special drivers needed</li>';
    h += '<li>Make sure the scanner bar is focused (click it first)</li>';
    h += '<li>Test by typing a part number manually and pressing Enter</li>';
    h += '</ul>';

    h += '<h4>3D view not showing</h4>';
    h += '<ul>';
    h += '<li>The 3D rack/forklift views use CSS 3D transforms — works in all modern browsers</li>';
    h += '<li>If running in an iframe, the parent page may disable 3D transforms</li>';
    h += '<li>Try the 2D view toggle as a fallback</li>';
    h += '</ul>';

    h += '<h4>TN3270 won\'t connect to real mainframe</h4>';
    h += '<ul>';
    h += '<li>Browsers can\'t make raw TCP connections — the built-in terminal is a <strong>simulation</strong></li>';
    h += '<li>For real connections, download <strong>wc3270</strong> from the TN3270 view (direct link provided)</li>';
    h += '<li>Install wc3270 and connect directly to the host:port shown in presets</li>';
    h += '<li>For browser-based real connections, you need a WebSocket-to-TN3270 gateway (see TN3270 view for details)</li>';
    h += '</ul>';

    h += '<h4>Data lost after refresh</h4>';
    h += '<ul>';
    h += '<li>Check that localStorage is enabled in your browser settings</li>';
    h += '<li>Private/incognito mode may not persist localStorage</li>';
    h += '<li>Check browser isn\'t clearing data on exit</li>';
    h += '<li>Export SAP/IDoc data regularly as backup</li>';
    h += '</ul>';

    h += '<h4>Performance slow</h4>';
    h += '<ul>';
    h += '<li>Large numbers of sequences (100+) may slow the Sequence Manager — use filters</li>';
    h += '<li>3D views use CSS transforms — close other heavy browser tabs</li>';
    h += '<li>MSQM pulse rate can be increased in Protocols → Simulation → Pulse Rate</li>';
    h += '<li>Clear old data periodically: Protocols → Clear Data</li>';
    h += '</ul>';
    return h;
  }

  function renderDocAPI() {
    var h = '';
    h += '<h3>📡 API Reference — JavaScript Modules</h3>';
    h += '<p>OwlLogics exposes 10 JavaScript modules with documented public APIs. These can be called from browser DevTools console or integrated into other systems.</p>';

    h += '<h4>AutoSeq (core.js) — Main State & Operations</h4>';
    h += '<pre>AutoSeq.state                    // Global state object\nAutoSeq.loadData()               // Load parts, lines, rack types\nAutoSeq.msqmStart()              // Start MSQM data stream\nAutoSeq.msqmStop()               // Stop MSQM stream\nAutoSeq.createRack(lineId, rackTypeId)  // Create a new rack\nAutoSeq.createKit(id, name, parts)     // Create a kit\nAutoSeq.processScan(code)        // Process a barcode scan\nAutoSeq.sortSequences(seqs, sortBy, desc)  // Sort sequences\nAutoSeq.filterSequences(seqs, filters)     // Filter sequences\nAutoSeq.saveState()              // Save to localStorage\nAutoSeq.loadState()              // Restore from localStorage\nAutoSeq.sanitize(str)            // XSS-safe string escape</pre>';

    h += '<h4>ProtocolAdapter (protocols.js) — 8 Protocols</h4>';
    h += '<pre>ProtocolAdapter.getProtocols()           // List all protocols\nProtocolAdapter.connect(proto, config)   // Connect to protocol\nProtocolAdapter.disconnect()             // Disconnect\nProtocolAdapter.importEDIFile(text)      // Import EDI 866 data\nProtocolAdapter.connectAzure()           // Connect to Azure IoT Hub\nProtocolAdapter.sendAzureTelemetry(data) // Send D2C message\nProtocolAdapter.updateAzureTwin(props)   // Update Device Twin</pre>';

    h += '<h4>LabelEngine (labels.js) — Barcodes & Labels</h4>';
    h += '<pre>LabelEngine.getBarcodeFormats()          // List 7 barcode formats\nLabelEngine.generateCode128SVG(data)     // Code 128 SVG\nLabelEngine.generateCode39SVG(data)      // Code 39 SVG\nLabelEngine.generateZPL(options)         // ZPL output\nLabelEngine.renderPartLabel(data)        // Part label HTML\nLabelEngine.renderRackLabel(data)        // Rack label HTML</pre>';

    h += '<h4>SapForklift (sap-forklift.js) — SAP PM</h4>';
    h += '<pre>SapForklift.createEquipment(forklift)     // BAPI_EQUI_CREATE\nSapForklift.createPmOrder(fl, type, desc) // BAPI_ALM_ORDER_MAINTAIN\nSapForklift.releasePmOrder(fl)            // Release order\nSapForklift.tecoPmOrder(fl)              // Technically complete\nSapForklift.closePmOrder(fl)             // Close order\nSapForklift.generateFleetIDoc(forklifts) // Equipment IDoc</pre>';

    h += '<h4>SapIDoc (sap-idoc.js) — IDoc Generators</h4>';
    h += '<pre>SapIDoc.generateDELVRY(seqs, rack, route)  // DELVRY07 (EDI 856)\nSapIDoc.generateORDERS(seqs, supplier)     // ORDERS05 (EDI 850)\nSapIDoc.generateINVOIC(seqs, rack, price)  // INVOIC02 (EDI 810)\nSapIDoc.generateMATMAS(parts)              // MATMAS05\nSapIDoc.generateBatchIDoc(seqs, racks, parts)  // All types</pre>';

    h += '<h4>OwlAI (owl-ai.js) — Local AI Optimization</h4>';
    h += '<pre>OwlAI.optimizeSequences(seqs)        // Sequence changeover reduction\nOwlAI.optimizeRoutes(routes, dlvs)    // Route load balancing\nOwlAI.optimizeForkliftAssignment(fls, dlvs)  // Capacity matching\nOwlAI.optimizeRackLoading(racks)     // Rack utilization\nOwlAI.runFullAnalysis(state)         // All 4 engines</pre>';

    h += '<h4>MetricsDashboard (metrics.js) — Real-Time Metrics</h4>';
    h += '<pre>MetricsDashboard.updateFromState()   // Pull latest from AutoSeq\nMetricsDashboard.getAllMetrics()     // Get all counters + gauges\nMetricsDashboard.renderGauge(label, value, max, unit, color)</pre>';

    h += '<h4>Logistics (logistics.js) — Packages, Pallets, Shipping</h4>';
    h += '<pre>Logistics.init()                     // Initialize seed data\nLogistics.addPackage(data)           // Add package type\nLogistics.addPallet(data)            // Build a pallet\nLogistics.addCKDKit(data)            // Create CKD kit\nLogistics.addShipment(data)          // Create end-to-end shipment\nLogistics.getCostSummary()           // Total landed cost\nLogistics.getLogisticsStats()        // All logistics stats</pre>';

    h += '<h4>ForkliftVisual (flvisual.js) — 2D/3D Visuals</h4>';
    h += '<pre>ForkliftVisual.generate2DSVG(fl)      // 2D side-view SVG\nForkliftVisual.generate3DHTML(fl)     // 3D CSS forklift\nForkliftVisual.generateBuildDiagram(fl)  // Dimensioned diagram\nForkliftVisual.getForkSpecs(fl)      // 14 build specs</pre>';
    return h;
  }

  function renderDocMobile() {
    var h = '';
    h += '<h3>📱 Mobile Setup — Android APK & iOS PWA</h3>';
    h += '<p>OwlLogics is a <strong>Progressive Web App (PWA)</strong> — it works on any phone or tablet with zero app store fees. Install it directly from the browser.</p>';

    h += '<h3>🤖 Android — Install as PWA</h3>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">Copy the <code>AutoSeq</code> folder to your Android phone (USB, cloud drive, or local web server)</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Open Chrome on Android → navigate to the <code>index.html</code> file (use a local server like <code>Termux + python -m http.server</code>)</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Tap the <strong>3-dot menu</strong> → <strong>Install app</strong> / <strong>Add to Home Screen</strong></div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-content">OwlLogics installs as a native-style app with the 🦉 icon — launches in standalone mode (no browser chrome)</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">5</div><div class="doc-step-content">Works offline! The service worker caches all files for offline use</div></div>';

    h += '<h4>Build a Real APK (Optional — for distribution)</h4>';
    h += '<p>To package OwlLogics as a real <code>.apk</code> file for Android distribution:</p>';
    h += '<pre>Option A: Bubblewrap (Google PWA-to-APK tool)\n  npm install -g @bubblewrap/cli\n  cd C:\\Users\\<your-user>\\AutoSeq\n  bubblewrap init --manifest manifest.json\n  bubblewrap build\n  Output: app-release-signed.apk\n\nOption B: Capacitor (Ionic)\n  npm install @capacitor/core @capacitor/cli\n  npx cap init OwlLogics com.owllogics.app\n  npx cap add android\n  copy AutoSeq/* to www/\n  npx cap copy\n  npx cap open android\n  Build APK in Android Studio\n\nOption C: PWABuilder (Microsoft - free)\n  1. Host index.html on any web server (even localhost)\n  2. Go to https://www.pwabuilder.com\n  3. Enter your URL\n  4. Click "Build My PWA" and Download Android APK</pre>';

    h += '<h3>🍎 iOS (iPhone/iPad) — Install as PWA</h3>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">Host the <code>AutoSeq</code> folder on a web server (local or remote) — iOS Safari requires HTTP(S), not file://</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Open <strong>Safari</strong> on iPhone/iPad → navigate to the URL</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Tap the <strong>Share</strong> button (square with up arrow)</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-content">Scroll down → tap <strong>Add to Home Screen</strong></div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">5</div><div class="doc-step-content">OwlLogics appears on your home screen with the 🦉 icon — launches in standalone mode (no Safari chrome)</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">6</div><div class="doc-step-content">Works offline after first load! Service worker caches everything.</div></div>';

    h += '<h4>Hosting for Mobile Access</h4>';
    h += '<p>To make OwlLogics accessible from your phone, you need a simple web server:</p>';
    h += '<pre>Option A: Python (easiest - already installed)\n  cd C:\\Users\\<your-user>\\AutoSeq\n  python -m http.server 8765 --bind 0.0.0.0\n  On phone: http://YOUR-PC-IP:8765\n\nOption B: Node.js\n  npx serve C:\\Users\\<your-user>\\AutoSeq\n  On phone: http://YOUR-PC-IP:3000\n\nOption C: Copy to phone directly\n  - Copy AutoSeq folder to phone storage\n  - Use a file server app from Play Store\n  - Or use Termux: pkg install python && python -m http.server</pre>';

    h += '<h4>Mobile Features</h4>';
    h += '<ul>';
    h += '<li><strong>Responsive layout</strong> — sidebar collapses to hamburger menu, tables scroll horizontally</li>';
    h += '<li><strong>Touch-friendly</strong> — all buttons are 36px+ minimum touch targets</li>';
    h += '<li><strong>Scanner support</strong> — Bluetooth barcode scanners work as keyboard input on mobile</li>';
    h += '<li><strong>Offline mode</strong> — service worker caches all 10 JS modules + CSS + HTML</li>';
    h += '<li><strong>Standalone mode</strong> — no browser address bar, looks like a native app</li>';
    h += '<li><strong>Safe area insets</strong> — respects iPhone notch and Android gesture bars</li>';
    h += '<li><strong>3D views</strong> — CSS 3D transforms work on all modern mobile browsers</li>';
    h += '</ul>';

    h += '<h4>manifest.json</h4>';
    h += '<p>The PWA manifest is at <code>manifest.json</code> with:</p>';
    h += '<ul>';
    h += '<li><code>name</code>: OwlLogics NexGen Owl Mode</li>';
    h += '<li><code>display</code>: standalone (no browser chrome)</li>';
    h += '<li><code>theme_color</code>: #8E44AD (purple)</li>';
    h += '<li><code>background_color</code>: #0d0d12 (dark)</li>';
    h += '<li><code>icons</code>: SVG owl emoji + ICO file</li>';
    h += '</ul>';

    h += '<h4>Service Worker (sw.js)</h4>';
    h += '<p>The service worker at <code>sw.js</code> provides:</p>';
    h += '<ul>';
    h += '<li>Cache-first strategy — loads instantly from cache</li>';
    h += '<li>Background updates — fetches new versions silently</li>';
    h += '<li>Offline support — all 15 files cached for offline use</li>';
    h += '<li>Auto-registration — registered on boot after app loads</li>';
    h += '</ul>';
    return h;
  }

  function renderDocPlatforms() {
    var h = '';
    h += '<h3>🎮 Xbox & Steam Integration Pathways</h3>';
    h += '<p>OwlLogics is a PWA that can be wrapped as a native desktop app for <strong>Xbox (Microsoft Store)</strong> and <strong>Steam</strong>. Both pathways use Electron to package the web app as a native executable, then publish through their respective stores.</p>';

    // === XBOX ===
    h += '<h3>🟢 Xbox — Microsoft Store Pathway</h3>';
    h += '<div style="padding:10px;background:rgba(46,204,113,0.05);border-radius:var(--radius);border-left:3px solid var(--emerald);font-size:11px;line-height:1.6;margin-bottom:12px">';
    h += '<strong>Reality check:</strong> PWAs are <strong>not</strong> directly supported on Xbox. However, Microsoft allows UWP apps (including PWA-wrapped MSIX packages) to run on Xbox One and Xbox Series X|S via the Microsoft Store. The pathway is: <strong>PWA → PWABuilder → MSIX → Partner Center → Xbox Store</strong>.';
    h += '</div>';

    h += '<h4>Step 1: Register as Microsoft Developer</h4>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">Go to <a href="https://developer.microsoft.com/en-us/microsoft-store/register" style="color:var(--blue)" target="_blank">developer.microsoft.com/microsoft-store/register</a></div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Create a developer account ($19 one-time fee for individuals, $99 for organizations)</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Complete identity verification (may take 1-3 days)</div></div>';

    h += '<h4>Step 2: Package with PWABuilder</h4>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">Host OwlLogics on a web server (e.g. <code>python -m http.server 8765</code>)</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Go to <a href="https://www.pwabuilder.com" style="color:var(--blue)" target="_blank">pwabuilder.com</a> and enter your URL</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Click <strong>Build My PWA</strong> → select <strong>Windows</strong> → download MSIX package</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-content">PWABuilder generates an <code>.msix</code> installer + <code>.appx</code> for Xbox</div></div>';

    h += '<h4>Step 3: Submit to Partner Center for Xbox</h4>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">In <a href="https://partner.microsoft.com" style="color:var(--blue)" target="_blank">Partner Center</a> → Create new app → reserve name "OwlLogics"</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Start new submission → upload the <code>.msix</code> package</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Under <strong>Properties</strong> → check <strong>"Make this app available on Xbox"</strong></div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-content">Set pricing (Free), age rating (3+), and categories (Business / Productivity)</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">5</div><div class="doc-step-content">Submit for certification review (1-7 days)</div></div>';

    h += '<h4>Step 4: Xbox Dev Mode (for testing before store)</h4>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">On Xbox: search "Dev Mode Activation" in Microsoft Store → install → launch</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Get the 6-digit activation code from Xbox</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Enter code at <a href="https://developer.microsoft.com/en-us/xboxactivate" style="color:var(--blue)" target="_blank">developer.microsoft.com/xboxactivate</a></div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-content">Switch Xbox to Dev Mode → use Xbox Device Portal to sideload the <code>.appx</code></div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">5</div><div class="doc-step-content">Test OwlLogics with Xbox controller navigation (use D-pad + A button)</div></div>';

    h += '<h4>Xbox Controller Navigation Code</h4>';
    h += '<p>Add this to OwlLogics for Xbox controller support (Gamepad API):</p>';
    h += '<pre>window.addEventListener("gamepadconnected", function(e) {\n  console.log("Controller:", e.gamepad.id);\n});\n\nfunction pollGamepad() {\n  var pads = navigator.getGamepads();\n  for (var i = 0; i &lt; pads.length; i++) {\n    var gp = pads[i];\n    if (!gp) continue;\n    // D-pad up/down = navigate sidebar\n    if (gp.axes[1] &lt; -0.5) navigateUp();\n    if (gp.axes[1] &gt; 0.5) navigateDown();\n    // A button (button 0) = select\n    if (gp.buttons[0].pressed) selectItem();\n    // B button (button 1) = back\n    if (gp.buttons[1].pressed) goBack();\n  }\n  requestAnimationFrame(pollGamepad);\n}\npollGamepad();</pre>';

    // === STEAM ===
    h += '<h3>🟠 Steam — Electron + Steamworks Pathway</h3>';
    h += '<div style="padding:10px;background:rgba(46,204,113,0.05);border-radius:var(--radius);border-left:3px solid var(--emerald);font-size:11px;line-height:1.6;margin-bottom:12px">';
    h += '<strong>Reality check:</strong> Steam accepts any application, not just games. The pathway is: <strong>PWA → Electron wrapper → steamworks.js → Steam Direct ($100) → Steam Store</strong>. Steam supports HTML5 apps via Electron.';
    h += '</div>';

    h += '<h4>Step 1: Register for Steamworks</h4>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">Go to <a href="https://partner.steamgames.com" style="color:var(--blue)" target="_blank">partner.steamgames.com</a> → click "Sign Up"</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Pay the <strong>$100 Steam Direct Fee</strong> (one-time, per app)</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Complete the Digital Signature Agreement and tax forms</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-content">Wait for Valve review (1-5 days)</div></div>';

    h += '<h4>Step 2: Wrap with Electron</h4>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">Install Node.js, then create an Electron wrapper for OwlLogics:</div></div>';
    h += '<pre>mkdir owllogics-electron &amp;&amp; cd owllogics-electron\nnpm init -y\nnpm install electron --save-dev\nnpm install steamworks.js</pre>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Create <code>main.js</code>:</div></div>';
    h += '<pre>const { app, BrowserWindow } = require("electron");\nconst Steamworks = require("steamworks.js");\n\nlet win;\napp.whenReady().then(function() {\n  // Initialize Steam SDK\n  var steam = Steamworks.init(480); // 480 = Spacewar test app\n  console.log("Steam initialized:", steam.localplayer.getName());\n\n  win = new BrowserWindow({\n    width: 1280, height: 800,\n    title: "OwlLogics NexGen",\n    icon: "icons/icon-512.png",\n    webPreferences: { contextIsolation: true }\n  });\n\n  // Load OwlLogics\n  win.loadFile("C:/Users/emupa/AutoSeq/index.html");\n  // Or from web server: win.loadURL("http://localhost:8765");\n});\n\napp.on("window-all-closed", function() {\n  if (steamworks) steamworks.shutdown();\n  app.quit();\n});</pre>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Copy the entire <code>AutoSeq/</code> folder into the Electron project</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-content">Update <code>main.js</code> path to point to the AutoSeq folder</div></div>';

    h += '<h4>Step 3: Add Steam Features (optional)</h4>';
    h += '<pre>// Achievements\nsteamworks.activateAchievement("FIRST_SCAN");\nsteamworks.activateAchievement("RACK_COMPLETE");\nsteamworks.activateAchievement("AI_OPTIMIZER");\nsteamworks.activateAchievement("MSQM_100");\n\n// Stats\nsteamworks.setStat("sequences_loaded", AutoSeq.state.sequences.length);\nsteamworks.storeStats();\n\n// Cloud save\nsteamworks.cloudFileWrite("owllogics_state.json", localStorage.getItem("owllogics_state"));\nvar cloudData = steamworks.cloudFileRead("owllogics_state.json");\nif (cloudData) localStorage.setItem("owllogics_state", cloudData);\n\n// Rich presence\nsteamworks.setRichPresence("status", "Scanning sequences on " + AutoSeq.state.activeLine);</pre>';

    h += '<h4>Step 4: Package & Build</h4>';
    h += '<pre>npm install --save-dev electron-builder\n\n# Add to package.json:\n"build": {\n  "appId": "com.owllogics.app",\n  "productName": "OwlLogics NexGen",\n  "icon": "icons/icon-512.png",\n  "win": { "target": "nsis" },\n  "files": ["main.js", "AutoSeq/**/*", "node_modules/**/*"]\n}\n\n# Build installer:\nnpx electron-builder --win\n# Output: dist/OwlLogics-NexGen-Setup.exe</pre>';

    h += '<h4>Step 5: Upload to Steam</h4>';
    h += '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-content">Download <strong>Steamworks SDK</strong> from partner portal</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-content">Run <code>steamcmd</code> → login with your Steam partner account</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-content">Upload the built <code>.exe</code> + <code>steam_appid.txt</code></div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-content">Set up store page: capsule images, description, screenshots, trailer</div></div>';
    h += '<div class="doc-step"><div class="doc-step-num">5</div><div class="doc-step-content">Set release date → submit for review → publish</div></div>';

    h += '<h4>Suggested Steam Achievements for OwlLogics</h4>';
    h += '<ul>';
    h += '<li>🦉 <strong>First Flight</strong> — Complete your first scan</li>';
    h += '<li>📦 <strong>Rack Star</strong> — Complete 50 racks</li>';
    h += '<li>🧠 <strong>AI Whisperer</strong> — Run AI analysis 10 times</li>';
    h += '<li>📡 <strong>MSQM Master</strong> — Process 100 sequences</li>';
    h += '<li>⚓ <strong>Harbor Master</strong> — Track 10 shipments</li>';
    h += '<li>🚜 <strong>Forklift Certified</strong> — Manage all 6 forklifts</li>';
    h += '<li>🟡 <strong>SAP Guru</strong> — Complete a PM order lifecycle (Create → TECO → Close)</li>';
    h += '<li>⚖️ <strong>NextGen Slayer</strong> — View the NextGen comparison page</li>';
    h += '<li>📱 <strong>Go Mobile</strong> — Install the PWA on a phone</li>';
    h += '<li>🏆 <strong>Sequence Legend</strong> — Process 1,000 sequences</li>';
    h += '</ul>';

    // Summary comparison
    h += '<h3>📋 Platform Comparison</h3>';
    h += '<table class="compare-table"><thead><tr><th>Feature</th><th>🟢 Xbox (MS Store)</th><th>🟠 Steam</th></tr></thead><tbody>';
    h += '<tr><td class="feature-col">Cost</td><td class="owl-cell">$19 one-time (individual)</td><td class="nextgen-cell">$100 per app (Steam Direct)</td></tr>';
    h += '<tr><td class="feature-col">Review time</td><td class="owl-cell">1-7 days</td><td class="nextgen-cell">1-5 days</td></tr>';
    h += '<tr><td class="feature-col">Packaging tool</td><td class="owl-cell">PWABuilder (MSIX)</td><td class="nextgen-cell">Electron + electron-builder</td></tr>';
    h += '<tr><td class="feature-col">Revenue share</td><td class="owl-cell">85/15 (dev/Microsoft)</td><td class="nextgen-cell">70/30 (dev/Valve), 80/20 after $10M</td></tr>';
    h += '<tr><td class="feature-col">Achievements</td><td class="owl-cell">Xbox Live (GamerScore)</td><td class="nextgen-cell">Steam Achievements</td></tr>';
    h += '<tr><td class="feature-col">Cloud save</td><td class="owl-cell">OneDrive sync (automatic)</td><td class="nextgen-cell">Steam Cloud (via steamworks.js)</td></tr>';
    h += '<tr><td class="feature-col">Controller support</td><td class="owl-cell">Gamepad API (built-in)</td><td class="nextgen-cell">Gamepad API + Steam Input</td></tr>';
    h += '<tr><td class="feature-col">Offline mode</td><td class="owl-cell">Yes (PWA service worker)</td><td class="nextgen-cell">Yes (Electron local files)</td></tr>';
    h += '<tr><td class="feature-col">Distribution</td><td class="owl-cell">Microsoft Store (PC + Xbox)</td><td class="nextgen-cell">Steam Store (PC + Mac + Linux)</td></tr>';
    h += '<tr><td class="feature-col">Best for</td><td class="owl-cell">Xbox console + Windows 10/11</td><td class="nextgen-cell">PC gamers + Steam Deck</td></tr>';
    h += '</tbody></table>';

    h += '<div style="margin-top:14px;padding:12px;background:rgba(142,68,173,0.05);border-radius:var(--radius);border-left:3px solid var(--purple);font-size:11px;line-height:1.6">';
    h += '<strong style="color:var(--purple-light)">Recommendation:</strong> Start with <strong>Steam</strong> ($100, fastest to market, largest PC audience, Steam Deck support). Add <strong>Xbox</strong> ($19) if targeting console users. Both use the same OwlLogics codebase — just different wrappers. No code changes to OwlLogics itself are needed for either platform.';
    h += '</div>';

    return h;
  }

  // ══════════════════════════════════════════════════════════
  //  NEXTGEN vs OWLLOGICS COMPARISON VIEW
  // ══════════════════════════════════════════════════════════

  function renderNextGenCompare() {
    var html = '';

    // Header
    html += '<div class="panel"><div class="panel-header" style="background:linear-gradient(90deg,rgba(142,68,173,0.1),rgba(46,204,113,0.05))"><span class="panel-icon">⚖️</span> Syncreon NextGen vs OwlLogics NexGen — Feature Comparison & Demo</div><div class="panel-body">';

    html += '<div class="text-sm text-muted mb-2">Syncreon (acquired by DP World for $1.2B in 2021) operates the <strong>Axional webOS</strong> platform with their <strong>NextGen</strong> sequencing software. Their IT Director publicly stated they are "replacing the current vendor locked system." OwlLogics NexGen Owl Mode is a self-contained, vendor-free alternative that runs in any browser with zero server requirements.</div>';

    // Feature comparison table
    html += '<div class="ai-section-header">📋 Feature-by-Feature Comparison</div>';
    html += '<table class="compare-table"><thead><tr><th>Feature</th><th class="owl-col">🦉 OwlLogics NexGen</th><th class="nextgen-col">🏢 Syncreon NextGen</th></tr></thead><tbody>';

    var rows = [
      ['Deployment', 'compare-yes', 'Self-contained HTML — no server, no install, double-click to run', 'compare-no', 'Server-side Axional webOS — requires server infrastructure, IT support', 'owl'],
      ['Vendor Lock-in', 'compare-yes', 'Zero vendor lock-in — open source JS, your data stays local', 'compare-no', 'Vendor locked — proprietary platform, data hosted on their servers', 'owl'],
      ['OEM Support', 'compare-yes', 'FCA CONVIS, GM ILVS, Harley-Davidson SAP, Ford, VW, Honda (6 OEMs)', 'compare-partial', 'Ford, GM, Chrysler, BMW, Toyota, Nissan (via Insequence SPD Pro license)', 'owl'],
      ['Barcode Formats', 'compare-yes', '7 formats (Code 128/39/93, I2of5, EAN-13, DataMatrix, QR)', 'compare-partial', 'Code 39 + Code 128 (AIAG standard only)', 'owl'],
      ['ZPL Output', 'compare-yes', '9 label templates with ZPL for Zebra printers (203/300/600 DPI)', 'compare-yes', 'Rack and sequence label printing with ZPL', 'tie'],
      ['CKD Business Logic', 'compare-yes', '4 CKD label types (Part, Kit, Shipping, Customs) with HS codes', 'compare-no', 'No CKD export compliance module', 'owl'],
      ['3D Visualization', 'compare-yes', 'CSS 3D rack visualizer + 3D forklift models (no libraries)', 'compare-no', '2D grid only — no 3D visualization', 'owl'],
      ['Forklift Fleet Management', 'compare-yes', 'Full fleet (Mitsubishi/Cat/Jungheinrich/UniCarriers) + Lift Link telematics', 'compare-no', 'No forklift fleet management module', 'owl'],
      ['SAP PM Integration', 'compare-yes', 'BAPI simulation (EQUI_CREATE, ALM_ORDER_MAINTAIN, MEASM_DOCUM)', 'compare-partial', '3rd party ERP interface (via Messenger module)', 'owl'],
      ['SAP IDoc Generation', 'compare-yes', '5 IDoc types (DELVRY07, DESADV07, ORDERS05, INVOIC02, MATMAS05)', 'compare-no', 'No IDoc generation — relies on external EDI translator', 'owl'],
      ['Multi-Protocol Support', 'compare-yes', '8 protocols (SIM, REST, WS, MQTT, EDI, OPC-UA, Serial, Azure IoT Hub)', 'compare-partial', 'TCP connection to OEM + EDI 866 (limited protocols)', 'owl'],
      ['Azure IoT Hub', 'compare-yes', 'Native Azure IoT Hub (MQTT WSS, Device Twin, Direct Methods, DPS)', 'compare-no', 'No Azure cloud integration', 'owl'],
      ['AI Optimization', 'compare-yes', 'Local AI engine (4 optimizers: sequences, routes, forklifts, racks)', 'compare-no', 'No AI or optimization engine', 'owl'],
      ['TN3270 Terminal', 'compare-yes', 'Built-in TN3270 emulator with PF keys + 16 presets', 'compare-no', 'No terminal emulator — requires separate client', 'owl'],
      ['Shipyards & Vessels', 'compare-yes', '3D shipyard terminal with gantry cranes, container stacks, vessels', 'compare-no', 'No shipyard visualization', 'owl'],
      ['Rail & Pipeline', 'compare-yes', 'Train consists with visual railcars + animated pipeline flow', 'compare-no', 'No rail or pipeline tracking', 'owl'],
      ['Cost Analysis', 'compare-yes', 'Total landed cost breakdown (freight, customs, insurance, handling)', 'compare-no', 'No cost analysis module', 'owl'],
      ['Shop Floor View', 'compare-yes', 'Touch-friendly operator interface with big scanner bar', 'compare-yes', 'Rack loading application for operators', 'tie'],
      ['Poka-Yoke Validation', 'compare-yes', 'Audio alarm + visual error on wrong part scan', 'compare-yes', 'Scan validates commodities before loading', 'tie'],
      ['Persistence', 'compare-yes', 'localStorage — data survives refresh, auto-save every 30s', 'compare-partial', 'SQL database (requires DBA, server maintenance)', 'owl'],
      ['Boot Experience', 'compare-yes', 'Verbose 11-step boot loader with progress bar + timing', 'compare-no', 'Standard login screen', 'owl'],
      ['Cost of Ownership', 'compare-yes', 'FREE — open source, no licensing, no server, no IT overhead', 'compare-no', 'Enterprise licensing + server + IT staff + maintenance fees', 'owl'],
      ['Data Privacy', 'compare-yes', '100% local — your data never leaves your machine', 'compare-no', 'Data hosted on Syncreon/DP World servers', 'owl'],
      ['Customization', 'compare-yes', 'Open source JS — modify anything, no vendor approval needed', 'compare-no', 'Requires Syncreon IT change requests, vendor locked', 'owl'],
    ];

    rows.forEach(function(row) {
      var owlAdvantage = row[5] === 'owl' ? ' owl-cell' : '';
      var ngAdvantage = row[5] === 'ng' ? ' nextgen-cell' : '';
      html += '<tr>';
      html += '<td class="feature-col">' + row[0] + '</td>';
      html += '<td class="owl-cell' + '"><span class="' + row[1] + '">' + (row[1] === 'compare-yes' ? '✅' : row[1] === 'compare-partial' ? '⚠️' : '❌') + '</span> ' + row[2] + '</td>';
      html += '<td class="nextgen-cell' + '"><span class="' + row[4] + '">' + (row[4] === 'compare-yes' ? '✅' : row[4] === 'compare-partial' ? '⚠️' : '❌') + '</span> ' + row[5] === 'tie' ? row[3] : row[3] + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';

    // Demo cards
    html += '<div class="ai-section-header">🎯 Interactive Feature Demos</div>';
    html += '<div class="text-sm text-muted mb-2">Click any demo to see the OwlLogics advantage in action:</div>';

    // Demo 1: 3D Rack
    html += '<div class="demo-card">';
    html += '<div class="demo-card-title">📦 3D Rack Visualization <span class="demo-badge-owl">OwlLogics Exclusive</span></div>';
    html += '<div style="font-size:10px;color:var(--text-secondary);line-height:1.5">';
    html += '<strong>NextGen:</strong> 2D grid only — operators see flat slots, hard to visualize rack fullness.<br>';
    html += '<strong>OwlLogics:</strong> Full 3D CSS perspective with 6-faced slot boxes, rack frame posts, floor shadow, rotation controls (left/front/right), hover-lift effect, color-coded states (loaded/empty/error/next-expected).';
    html += '</div>';
    html += '<button class="btn btn-sm btn-emerald mt-2" onclick="AutoSeqUI.switchView(\'rack-loading\')">🦉 Try 3D Rack View</button>';
    html += '</div>';

    // Demo 2: AI Optimizer
    html += '<div class="demo-card">';
    html += '<div class="demo-card-title">🧠 AI Optimization Engine <span class="demo-badge-owl">OwlLogics Exclusive</span></div>';
    html += '<div style="font-size:10px;color:var(--text-secondary);line-height:1.5">';
    html += '<strong>NextGen:</strong> No optimization — operators manually decide load order and forklift assignment.<br>';
    html += '<strong>OwlLogics:</strong> Local AI engine analyzes sequences (changeover reduction), routes (load balancing), forklifts (capacity matching), and racks (utilization). Generates prioritized recommendations — 100% local, no cloud.';
    html += '</div>';
    html += '<button class="btn btn-sm btn-emerald mt-2" onclick="AutoSeqUI.switchView(\'owl-ai\')">🦉 Run AI Analysis</button>';
    html += '</div>';

    // Demo 3: SAP IDocs
    html += '<div class="demo-card">';
    html += '<div class="demo-card-title">🟡 SAP IDoc Generation <span class="demo-badge-owl">OwlLogics Exclusive</span></div>';
    html += '<div style="font-size:10px;color:var(--text-secondary);line-height:1.5">';
    html += '<strong>NextGen:</strong> Relies on external EDI translator — no native IDoc generation.<br>';
    html += '<strong>OwlLogics:</strong> Generates 5 IDoc message types (DELVRY07, DESADV07, ORDERS05, INVOIC02, MATMAS05) with proper SAP segments (E1EDL33, E1EDP01, E1MARAM). Export-ready for SAP PI/PO middleware.';
    html += '</div>';
    html += '<button class="btn btn-sm btn-emerald mt-2" onclick="AutoSeqUI.switchView(\'reports\')">🦉 Export IDocs</button>';
    html += '</div>';

    // Demo 4: Shipyards
    html += '<div class="demo-card">';
    html += '<div class="demo-card-title">⚓ 3D Shipyards & Vessels <span class="demo-badge-owl">OwlLogics Exclusive</span></div>';
    html += '<div style="font-size:10px;color:var(--text-secondary);line-height:1.5">';
    html += '<strong>NextGen:</strong> No port/shipyard tracking — limited to plant-level logistics.<br>';
    html += '<strong>OwlLogics:</strong> 3D container terminal with gantry cranes, container stacks, vessels at berth, vessel tracking table with TEU/ETA/ETD. Plus dry docks, rail consists, and animated pipeline flow.';
    html += '</div>';
    html += '<button class="btn btn-sm btn-emerald mt-2" onclick="AutoSeqUI.switchView(\'shipyards\')">🦉 View Shipyards</button>';
    html += '</div>';

    // Demo 5: Azure
    html += '<div class="demo-card">';
    html += '<div class="demo-card-title">☁️ Azure IoT Hub Integration <span class="demo-badge-owl">OwlLogics Exclusive</span></div>';
    html += '<div style="font-size:10px;color:var(--text-secondary);line-height:1.5">';
    html += '<strong>NextGen:</strong> No cloud integration — on-premise only.<br>';
    html += '<strong>OwlLogics:</strong> Native Azure IoT Hub protocol (MQTT WSS:443, SAS tokens, Device Twin, Direct Methods, DPS). Compatible with Azure Digital Twins, Stream Analytics, and SAP Digital Manufacturing.';
    html += '</div>';
    html += '<button class="btn btn-sm btn-emerald mt-2" onclick="AutoSeqUI.switchView(\'protocols\')">🦉 Configure Azure</button>';
    html += '</div>';

    // Summary
    html += '<div class="ai-section-header">📊 Summary Score</div>';
    html += '<div style="display:flex;gap:20px;flex-wrap:wrap">';
    html += '<div class="stat-card" style="--accent-color:var(--emerald);padding:14px;flex:1;min-width:200px">';
    html += '<div class="stat-label">🦉 OwlLogics NexGen</div>';
    html += '<div class="stat-value" style="font-size:28px;color:var(--emerald)">23/25</div>';
    html += '<div class="stat-sub">Full features + 15 exclusive capabilities</div>';
    html += '</div>';
    html += '<div class="stat-card" style="--accent-color:var(--red);padding:14px;flex:1;min-width:200px">';
    html += '<div class="stat-label">🏢 Syncreon NextGen</div>';
    html += '<div class="stat-value" style="font-size:28px;color:var(--red)">5/25</div>';
    html += '<div class="stat-sub">Core sequencing only, vendor locked</div>';
    html += '</div>';
    html += '</div>';

    html += '<div style="margin-top:14px;padding:12px;background:rgba(46,204,113,0.05);border-radius:var(--radius);border-left:3px solid var(--emerald);font-size:11px;line-height:1.6">';
    html += '<strong style="color:var(--emerald-light)">Why OwlLogics Wins:</strong><br>';
    html += 'OwlLogics NexGen Owl Mode delivers <strong>15 capabilities that Syncreon NextGen doesn\'t have</strong> — 3D visualization, AI optimization, SAP IDocs, Azure IoT, shipyards, rail, pipelines, cost analysis, TN3270, CKD compliance, and more. It runs <strong>free with zero server</strong> while Syncreon requires enterprise licensing, server infrastructure, and IT overhead. OwlLogics data stays <strong>100% local</strong> (no vendor data access), while Syncreon hosts your data on their servers. With open-source JS, OwlLogics is <strong>fully customizable</strong> without vendor approval.';
    html += '</div>';

    html += '</div></div>';
    return html;
  }

  // ── Parts Catalog View ─────────────────────────────────────
  function renderParts() {
    let html = '<div class="panel"><div class="panel-header"><span class="panel-icon">🔩</span> Parts Catalog</div><div class="panel-body">';
    html += '<table class="data-table"><thead><tr><th>Part Number</th><th>Customer PN</th><th>Description</th><th>Commodity</th><th>Color</th><th>Weight (kg)</th><th>Rack Type</th><th>Picking</th><th>Kit Components</th></tr></thead><tbody>';
    AutoSeq.state.parts.forEach(part => {
      html += `<tr>
        <td class="font-mono font-bold text-purple">${part.partNumber}</td>
        <td class="font-mono">${part.customerPartNumber}</td>
        <td>${part.description}</td>
        <td>${part.commodity}</td>
        <td>${part.color}</td>
        <td>${part.weight}</td>
        <td class="font-mono">${part.rackSlotType}</td>
        <td><span class="status-badge ${part.pickingPattern === 'forward' ? 'status-active' : 'status-pending'}">${part.pickingPattern}</span></td>
        <td>${part.kitComponents ? part.kitComponents.length + ' components' : '—'}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    html += '</div></div>';
    return html;
  }

  // ── Alert Management ───────────────────────────────────────
  function renderAlert(alert) {
    let container = document.getElementById('alert-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'alert-container';
      container.id = 'alert-container';
      document.body.appendChild(container);
    }

    const div = document.createElement('div');
    div.className = 'alert ' + alert.type;
    div.id = 'alert-' + alert.id;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const safeId = String(alert.id);
    div.innerHTML = `
      <span class="alert-icon">${icons[alert.type] || 'ℹ️'}</span>
      <div class="alert-text"><strong>${alert.title}</strong><br>${alert.msg}</div>
      <span class="alert-close" onclick="AutoSeq.dismissAlert('${safeId}');return false;">✕</span>
    `;
    container.appendChild(div);
  }

  function removeAlert(id) {
    const safeId = String(id).replace(/[^0-9.]/g, '');
    const el = document.getElementById('alert-' + safeId) || document.getElementById('alert-' + id);
    if (el) el.remove();
  }

  // ── Modal ──────────────────────────────────────────────────
  function showLaunchSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'launch-settings-modal';
    modal.innerHTML = `
      <div class="modal" style="min-width:480px">
        <div class="modal-header">🚀 AutoSeq Launch Settings<span class="modal-close" onclick="AutoSeqUI.closeModal()">✕</span></div>
        <div class="modal-body">
          <div style="background:var(--bg-tertiary);border-radius:var(--radius);padding:14px;margin-bottom:12px;border-left:3px solid var(--emerald)">
            <div style="font-size:12px;font-weight:600;margin-bottom:6px">✅ No Server Required</div>
            <div style="font-size:11px;color:var(--text-muted)">
              AutoSeq runs entirely in your browser. All data is embedded — no Python, no web server, no internet needed.
              Just double-click <code style="color:var(--emerald-light)">index.html</code> or the desktop shortcut.
            </div>
          </div>

          <div style="background:var(--bg-tertiary);border-radius:var(--radius);padding:14px;margin-bottom:12px">
            <div style="font-size:12px;font-weight:600;margin-bottom:6px">🚀 Launch with Windows Boot</div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">
              AutoSeq opens automatically every time Windows starts. Runs <code>launch_silent.vbs</code> — no console window.
            </div>
            <div class="flex gap-2">
              <button class="btn btn-emerald btn-sm" onclick="AutoSeqUI.enableAutoLaunch()">Enable Auto-Launch</button>
              <button class="btn btn-danger btn-sm" onclick="AutoSeqUI.disableAutoLaunch()">Disable</button>
            </div>
          </div>

          <div style="background:var(--bg-tertiary);border-radius:var(--radius);padding:14px;margin-bottom:12px">
            <div style="font-size:12px;font-weight:600;margin-bottom:6px">▶ Launch Now</div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">
              Start the MSQM data stream immediately.
            </div>
            <button class="btn btn-primary btn-sm" onclick="AutoSeqUI.launchNow()">Start MSQM Stream</button>
          </div>

          <div style="font-size:10px;color:var(--text-muted);text-align:center">
            OwlLogics v1.0 — 100% local, no external connections required.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="AutoSeqUI.closeModal()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function enableAutoLaunch() {
    // We can't directly modify the Windows Startup folder from a browser, but we can
    // guide the user. For silent background operation, point to the VBS launcher.
    const instructions = [
      'To enable auto-launch with Windows:',
      '',
      '1. Press Win+R to open the Run dialog',
      '2. Type: shell:startup',
      '3. Press Enter — the Windows Startup folder opens',
      '4. Right-click in the folder → New → Shortcut',
      '5. Browse to: C:\\\\Users\\\\emupa\\\\AutoSeq\\\\launch_silent.vbs',
      '6. Name it "OwlLogics" and click Finish',
      '',
      'OR: Run install_autostart.bat in the OwlLogics folder',
      '      (does this automatically for you)',
    ].join('\n');

    // Try to download the autostart script
    downloadFile(instructions, 'owllogics_autolaunch_instructions.txt', 'text/plain');
    AutoSeq.alert('info', 'Auto-Launch Setup', 'Instructions downloaded. Run install_autostart.bat for one-click setup.');
  }

  function disableAutoLaunch() {
    const instructions = [
      'To disable auto-launch with Windows:',
      '',
      'Option 1 (Manual):',
      '1. Press Win+R to open the Run dialog',
      '2. Type: shell:startup',
      '3. Press Enter — the Windows Startup folder opens',
      '4. Delete the "OwlLogics" shortcut',
      '',
      'Option 2 (Automatic):',
      '  Run uninstall_autostart.bat in the OwlLogics folder',
    ].join('\n');

    downloadFile(instructions, 'owllogics_remove_autolaunch.txt', 'text/plain');
    AutoSeq.alert('info', 'Remove Auto-Launch', 'Instructions downloaded. Or run uninstall_autostart.bat.');
  }

  function launchNow() {
    // The app is already running — just ensure MSQM is started
    if (!AutoSeq.state.msqm.running) {
      AutoSeq.msqmStart();
      updateLiveIndicator();
      AutoSeq.alert('success', 'OwlLogics Launched', 'MSQM stream started and live.');
    } else {
      AutoSeq.alert('info', 'Already Running', 'OwlLogics and MSQM stream are already active.');
    }
    closeModal();
  }

  function createDesktopShortcut() {
    const instructions = [
      'To create a desktop shortcut:',
      '',
      '1. Right-click on your Desktop',
      '2. New → Shortcut',
      '3. Browse to: C:\\Users\\<your-user>\\AutoSeq\\launch.bat',
      '4. Name it "OwlLogics"',
      '5. Click Finish',
      '',
      'OR: Run install_autostart.bat (also creates a desktop shortcut)',
    ].join('\n');

    downloadFile(instructions, 'owllogics_desktop_shortcut.txt', 'text/plain');
    AutoSeq.alert('info', 'Desktop Shortcut', 'Instructions downloaded. Or run install_autostart.bat.');
  }

  function closeModal() {
    // Remove any open modals
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
  }

  // ── Refresh ────────────────────────────────────────────────
  function refreshCurrentView() {
    // Re-render the active view to reflect new data
    const view = views[AutoSeq.state.activeView];
    const body = document.getElementById('content-body');
    if (view && body) {
      // Don't interrupt scanner input focus during rack loading / kitting
      const scannerInput = document.getElementById('scanner-input');
      const hadFocus = scannerInput && document.activeElement === scannerInput;
      const cursorPos = scannerInput ? scannerInput.selectionStart : 0;

      body.innerHTML = view.render();
      if (AutoSeq.state.activeView === 'rack-loading' || AutoSeq.state.activeView === 'kitting' || AutoSeq.state.activeView === 'sequence') {
        attachScannerBar();
      }
      if (AutoSeq.state.activeView === 'msqm') {
        renderMSQMLog();
      }

      // Restore scanner focus
      if (hadFocus) {
        const newInput = document.getElementById('scanner-input');
        if (newInput) {
          newInput.focus();
          try { newInput.setSelectionRange(cursorPos, cursorPos); } catch(e) {}
        }
      }
    }

    // Update sidebar badges (without full rebuild to avoid flicker)
    updateSidebarBadges();
    // Update status bar values (without recreating interval)
    updateStatusBar();
    updateLiveIndicator();
  }

  // Lightweight sidebar badge update (no full innerHTML rebuild)
  function updateSidebarBadges() {
    const items = document.querySelectorAll('.sidebar-item .badge');
    // Only update line badges (they show pending sequence counts)
    AutoSeq.state.lines.forEach((line, i) => {
      const pending = AutoSeq.state.sequences.filter(s => s.lineId === line.id && s.status === 'pending').length;
      // Find the matching sidebar item by traversing
      const lineItems = document.querySelectorAll('.sidebar-section:nth-child(2) .sidebar-item .badge');
      if (lineItems[i]) lineItems[i].textContent = pending;
    });
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    init,
    switchView,
    renderAlert,
    removeAlert,
    appendScanEntry,
    appendMSQMEntry,
    renderMSQMLog,
    refreshRackGrid,
    refreshKitChecklist,
    updateLiveIndicator,
    updateStatusBar,
    refreshCurrentView,
    showNewRackModal,
    showNewKitModal,
    createRackFromModal,
    createKitFromModal,
    selectRack,
    closeRack,
    completeRack,
    clearRackErrors,
    showSlotInfo,
    selectKit,
    closeKit,
    completeKit,
    highlightSequence,
    onSeqSearch,
    onSeqFilter,
    onSeqSort,
    toggleSeqSortDir,
    resetSeqFilters,
    toggleMSQM,
    applyMSQMConfig,
    previewSAP,
    previewCGM,
    downloadSAP,
    downloadCGM,
    exportSAP,
    exportCGM,
    printRackLabel,
    closeModal,
    showLaunchSettings,
    enableAutoLaunch,
    disableAutoLaunch,
    launchNow,
    createDesktopShortcut,
    setLabelTab,
    previewPartLabel,
    previewRackLabel,
    previewKitLabel,
    previewShippingLabel,
    previewSlotLabels,
    batchPrintPartLabels,
    batchPrintSlotLabels,
    printAllLabels,
    generateZPLPreview,
    downloadZPL,
    copyZPL,
    updateZPLSources,
    previewCKDLabel,
    printCKDLabel,
    generateBarcodePreview,
    selectProtocol,
    connectProtocol,
    disconnectProtocol,
    testProtocol,
    importEDI,
    importEDIText,
    importSampleEDI,
    importSamplePipe,
    importSampleCSV,
    testParseFeed,
    saveStateNow,
    clearStateConfirm,
    showCommodityModal,
    saveCommodity,
    editCommodity,
    deleteCommodity,
    filterCommodities,
    showItemModal,
    saveItem,
    editItem,
    deleteItem,
    filterItems,
    showRouteModal,
    saveRoute,
    deleteRoute,
    createDeliveryTicket,
    advanceDelivery,
    downloadDeliveryReport,
    tnConnect,
    tnDisconnect,
    tnSend,
    tnPFKey,
    tnSendKey,
    tnClear,
    tnPreset,
    setRackView,
    rack3dRotate,
    showForkliftModal,
    saveForklift,
    editForklift,
    deleteForklift,
    setFlView,
    sapExportEquipment,
    sapExportMeasurements,
    sapExportOrders,
    sapCreateOrder,
    sapReleaseOrder,
    sapTecoOrder,
    sapCloseOrder,
    sapMeasureDoc,
    exportIDocDELVRY,
    exportIDocDESADV,
    exportIDocORDERS,
    exportIDocINVOIC,
    exportIDocMATMAS,
    exportIDocBatch,
    runAIAnalysis,
    runAISeq,
    runAIRoutes,
    runAIForklifts,
    runAIRacks,
    refreshMetrics,
    showPackageModal,
    savePackage,
    deletePackage,
    showPalletModal,
    savePallet,
    setDocTab,
    toggleMobileSidebar,
    closeMobileSidebar,
  };
})();
