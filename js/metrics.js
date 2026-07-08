/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved - Patent Pending
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Real-Time Metrics Dashboard
   ============================================================ */

var MetricsDashboard = (function () {

  var startTime = Date.now();
  var counters = {
    sequencesReceived: 0,
    scansTotal: 0,
    scansOK: 0,
    scansError: 0,
    racksCreated: 0,
    racksCompleted: 0,
    deliveriesCreated: 0,
    deliveriesDelivered: 0,
    forkliftHoursTotal: 0,
    idocsExported: 0,
    aiAnalysesRun: 0,
  };

  var gauges = {
    pendingSequences: 0,
    activeRacks: 0,
    inTransitDeliveries: 0,
    fleetUtilization: 0,
    rackUtilization: 0,
    msqmConnected: false,
    liftLinkDevices: 0,
    azureConnected: false,
    sapCoverage: 0,
  };

  var throughputHistory = {
    sequencesPerMin: [],
    scansPerMin: [],
    deliveriesPerHr: [],
  };

  var tickCounters = {
    sequencesThisMin: 0,
    scansThisMin: 0,
    deliveriesThisHr: 0,
  };

  // ── Update from AutoSeq state ─────────────────────────────
  function updateFromState() {
    if (typeof AutoSeq === 'undefined') return;

    var stats = AutoSeq.getStats();
    var flStats = {};
    var dlvStats = {};

    try { flStats = AutoSeq.getForkliftStats(); } catch (e) {}
    try { dlvStats = AutoSeq.getDeliveryStats(); } catch (e) {}

    gauges.pendingSequences = stats.pending || 0;
    gauges.activeRacks = AutoSeq.state.racks ? AutoSeq.state.racks.filter(function(r) { return r.status === 'active'; }).length : 0;
    gauges.inTransitDeliveries = dlvStats.inTransit || 0;
    gauges.fleetUtilization = flStats.total > 0 ? Math.round((flStats.active / flStats.total) * 100) : 0;
    gauges.rackUtilization = stats.totalSlots > 0 ? Math.round((stats.loadedSlots / stats.totalSlots) * 100) : 0;
    gauges.msqmConnected = AutoSeq.state.msqm ? AutoSeq.state.msqm.connected : false;
    gauges.liftLinkDevices = flStats.telematicsConnected || 0;
    gauges.sapCoverage = flStats.total > 0 ? Math.round((flStats.total / flStats.total) * 100) : 0;

    counters.sequencesReceived = stats.totalSequences || 0;
    counters.scansTotal = stats.totalScans || 0;
    counters.scansOK = stats.okScans || 0;
    counters.scansError = stats.errScans || 0;
    counters.racksCreated = stats.totalRacks || 0;
    counters.racksCompleted = stats.completeRacks || 0;
    counters.deliveriesCreated = dlvStats.total || 0;
    counters.deliveriesDelivered = dlvStats.delivered || 0;
  }

  // ── Throughput tracking (called every minute) ─────────────
  function recordThroughput() {
    throughputHistory.sequencesPerMin.push(tickCounters.sequencesThisMin);
    throughputHistory.scansPerMin.push(tickCounters.scansThisMin);
    throughputHistory.deliveriesPerHr.push(tickCounters.deliveriesThisHr);

    if (throughputHistory.sequencesPerMin.length > 60) throughputHistory.sequencesPerMin.shift();
    if (throughputHistory.scansPerMin.length > 60) throughputHistory.scansPerMin.shift();
    if (throughputHistory.deliveriesPerHr.length > 24) throughputHistory.deliveriesPerHr.shift();

    tickCounters.sequencesThisMin = 0;
    tickCounters.scansThisMin = 0;
  }

  function incrementSeq() { tickCounters.sequencesThisMin++; }
  function incrementScan() { tickCounters.scansThisMin++; }
  function incrementDelivery() { tickCounters.deliveriesThisHr++; }
  function incrementIDoc() { counters.idocsExported++; }
  function incrementAI() { counters.aiAnalysesRun++; }

  // ── Get all metrics ────────────────────────────────────────
  function getAllMetrics() {
    var uptime = Math.floor((Date.now() - startTime) / 1000);

    return {
      uptime: uptime,
      uptimeFormatted: formatUptime(uptime),
      counters: counters,
      gauges: gauges,
      throughput: {
        sequencesPerMin: throughputHistory.sequencesPerMin.slice(-10),
        scansPerMin: throughputHistory.scansPerMin.slice(-10),
        avgSeqPerMin: avg(throughputHistory.sequencesPerMin),
        avgScansPerMin: avg(throughputHistory.scansPerMin),
      },
    };
  }

  function formatUptime(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    if (h > 0) return h + 'h ' + m + 'm ' + s + 's';
    if (m > 0) return m + 'm ' + s + 's';
    return s + 's';
  }

  function avg(arr) {
    if (!arr || arr.length === 0) return 0;
    return Math.round(arr.reduce(function(a, b) { return a + b; }, 0) / arr.length * 10) / 10;
  }

  // ── Render gauge HTML ─────────────────────────────────────
  function renderGauge(label, value, max, unit, color) {
    var pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    var barColor = color || 'var(--emerald)';
    if (pct > 90) barColor = 'var(--red)';
    else if (pct > 75) barColor = 'var(--yellow)';

    return '<div class="metric-gauge">' +
      '<div class="metric-label">' + label + '</div>' +
      '<div class="metric-value">' + value + (unit || '') + '</div>' +
      '<div class="metric-bar"><div class="metric-fill" style="width:' + pct + '%;background:' + barColor + '"></div></div>' +
      '<div class="metric-pct">' + pct + '%</div>' +
    '</div>';
  }

  function renderCounter(label, value, icon) {
    return '<div class="metric-counter">' +
      '<div class="metric-counter-icon">' + (icon || '○') + '</div>' +
      '<div class="metric-counter-value">' + value + '</div>' +
      '<div class="metric-counter-label">' + label + '</div>' +
    '</div>';
  }

  function renderSparkline(data, label, color) {
    if (!data || data.length === 0) return '<div class="metric-sparkline-empty">' + label + ': no data</div>';
    var max = Math.max.apply(null, data);
    if (max === 0) max = 1;
    var w = 120;
    var h = 30;
    var step = w / Math.max(data.length - 1, 1);
    var points = data.map(function(v, i) {
      var x = i * step;
      var y = h - (v / max) * h;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');

    return '<div class="metric-sparkline">' +
      '<div class="metric-sparkline-label">' + label + ' (avg: ' + avg(data) + ')</div>' +
      '<svg width="' + w + '" height="' + h + '" style="display:block">' +
      '<polyline points="' + points + '" fill="none" stroke="' + (color || '#2ECC71') + '" stroke-width="1.5"/>' +
      '<polyline points="0,' + h + ' ' + points + ' ' + w + ',' + h + '" fill="rgba(46,204,113,0.1)" stroke="none"/>' +
      '</svg>' +
    '</div>';
  }

  return {
    updateFromState: updateFromState,
    recordThroughput: recordThroughput,
    incrementSeq: incrementSeq,
    incrementScan: incrementScan,
    incrementDelivery: incrementDelivery,
    incrementIDoc: incrementIDoc,
    incrementAI: incrementAI,
    getAllMetrics: getAllMetrics,
    renderGauge: renderGauge,
    renderCounter: renderCounter,
    renderSparkline: renderSparkline,
  };
})();
