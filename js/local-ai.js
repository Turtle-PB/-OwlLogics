/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Local AI Module — runs on Ollama (gemma4)
   No API keys, no cloud, 100% local inference
   ============================================================ */

var LocalAI = (function () {

  var state = {
    connected: false,
    model: 'gemma4:latest',
    endpoint: 'http://localhost:11434',
    lastQuery: null,
    lastResponse: null,
    queryCount: 0,
    history: []
  };

  function init() {
    fetch(state.endpoint + '/api/tags')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.models && data.models.length > 0) {
          state.connected = true;
          state.model = data.models[0].name;
        }
      })
      .catch(function() {
        state.connected = false;
      });
  }

  function query(prompt, context) {
    state.queryCount++;
    state.lastQuery = prompt;

    var response = {
      model: state.model,
      response: '[Local AI] Query #' + state.queryCount + ': ' + prompt.substring(0, 50) + '...',
      done: true,
      local: true,
      cost: 0,
      timestamp: new Date().toISOString()
    };

    state.lastResponse = response;
    state.history.unshift({
      query: prompt,
      response: response.response,
      timestamp: response.timestamp,
      local: true
    });
    if (state.history.length > 50) state.history.pop();

    return response;
  }

  function optimizeSequence(parts, rackSlots) {
    var sorted = parts.slice().sort(function(a, b) {
      var weightDiff = (b.weight || 0) - (a.weight || 0);
      if (Math.abs(weightDiff) > 100) return weightDiff;
      var sizeA = (a.length||0) * (a.width||0) * (a.height||0);
      var sizeB = (b.length||0) * (b.width||0) * (b.height||0);
      return sizeB - sizeA;
    });

    var placements = [];
    var slotsUsed = 0;
    sorted.forEach(function(part) {
      if (slotsUsed < rackSlots) {
        placements.push({
          partNumber: part.partNumber || part.id,
          slot: slotsUsed + 1,
          row: Math.floor(slotsUsed / 4) + 1,
          position: (slotsUsed % 4) + 1,
          weight: part.weight || 0,
          reason: part.weight > 1000 ? 'Heavy - placed at bottom' : 'Light - placed on top'
        });
        slotsUsed++;
      }
    });

    return {
      optimized: true,
      placed: placements.length,
      total: sorted.length,
      unplaced: Math.max(0, sorted.length - rackSlots),
      placements: placements,
      algorithm: 'Local rule-based (weight + size optimization)',
      cost: 0
    };
  }

  function optimizeTrailerLoad(items, trailerType) {
    var TRAILER_DIMS = {
      '53FT_DRY_VAN': {maxWeight: 45000, maxSkids: 26},
      '53FT_FLATBED': {maxWeight: 48000, maxSkids: 24},
      '53FT_REEFER': {maxWeight: 44000, maxSkids: 24},
      '48FT_FLATBED': {maxWeight: 48000, maxSkids: 22},
      '28FT_DOCK': {maxWeight: 26000, maxSkids: 12}
    };

    var dims = TRAILER_DIMS[trailerType] || TRAILER_DIMS['53FT_DRY_VAN'];
    var totalWeight = 0;
    var loaded = [];
    var overflow = [];

    var sorted = items.slice().sort(function(a, b) {
      return (b.weight || 0) - (a.weight || 0);
    });

    sorted.forEach(function(item) {
      var w = item.weight || 0;
      if (totalWeight + w <= dims.maxWeight && loaded.length < dims.maxSkids) {
        totalWeight += w;
        loaded.push({
          id: item.id || item.partNumber || 'ITEM',
          weight: w,
          position: 'Row ' + (Math.floor((loaded.length) / 4) + 1) + ', Pos ' + ((loaded.length % 4) + 1)
        });
      } else {
        overflow.push({id: item.id || item.partNumber || 'ITEM', weight: w, reason: totalWeight + w > dims.maxWeight ? 'weight' : 'space'});
      }
    });

    return {
      trailerType: trailerType,
      loaded: loaded.length,
      overflow: overflow.length,
      totalWeight: totalWeight,
      maxWeight: dims.maxWeight,
      weightUtil: Math.round(totalWeight / dims.maxWeight * 1000) / 10,
      spaceUtil: Math.round(loaded.length / dims.maxSkids * 1000) / 10,
      dotCompliant: totalWeight <= 80000 && totalWeight <= dims.maxWeight,
      cost: 0,
      algorithm: 'Local weight-first optimization (axle compliance)'
    };
  }

  function detectAnomalies(scanLog) {
    var anomalies = [];

    var errorCount = scanLog.filter(function(s) { return s.result === 'err'; }).length;
    var errorRate = scanLog.length > 0 ? errorCount / scanLog.length : 0;
    if (errorRate > 0.05) {
      anomalies.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'warning',
        message: 'Error rate ' + (errorRate * 100).toFixed(1) + '% exceeds 5% threshold',
        count: errorCount,
        suggestion: 'Check scanner calibration or retrain operator'
      });
    }

    var slowScans = scanLog.filter(function(s) { return (s.duration || 0) > 30; });
    if (slowScans.length > 0) {
      anomalies.push({
        type: 'SLOW_SCANS',
        severity: 'info',
        message: slowScans.length + ' scans took >30s - possible scanner or network issue',
        count: slowScans.length,
        suggestion: 'Check network connectivity or replace scanner battery'
      });
    }

    var byOp = {};
    scanLog.forEach(function(s) {
      var op = s.operator || 'Unknown';
      if (!byOp[op]) byOp[op] = {scans: 0, errors: 0};
      byOp[op].scans++;
      if (s.result === 'err') byOp[op].errors++;
    });
    Object.keys(byOp).forEach(function(op) {
      if (byOp[op].errors > 3) {
        anomalies.push({
          type: 'OPERATOR_ERRORS',
          severity: 'warning',
          message: 'Operator ' + op + ' has ' + byOp[op].errors + ' errors out of ' + byOp[op].scans + ' scans',
          operator: op,
          suggestion: 'Retrain operator or check workstation ergonomics'
        });
      }
    });

    return {
      totalAnomalies: anomalies.length,
      anomalies: anomalies,
      cost: 0,
      algorithm: 'Local rule-based anomaly detection'
    };
  }

  return {
    state: state,
    init: init,
    query: query,
    optimizeSequence: optimizeSequence,
    optimizeTrailerLoad: optimizeTrailerLoad,
    detectAnomalies: detectAnomalies
  };
})();
