/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved - Patent Pending
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics AI Optimization Agent
   ============================================================ */

var OwlAI = (function () {

  var engineVersion = '1.0.0-local';
  var analysisLog = [];

  // ── Sequence Optimization ─────────────────────────────────
  // Groups sequences by commodity/OEM to minimize changeovers
  function optimizeSequences(sequences) {
    var analysis = {
      engine: 'OwlAI-SeqOpt',
      version: engineVersion,
      timestamp: new Date().toISOString(),
      input: sequences.length + ' sequences',
      recommendations: [],
      optimizedOrder: [],
      metrics: {},
    };

    if (sequences.length === 0) {
      analysis.recommendations.push({ type: 'info', message: 'No sequences to optimize' });
      return analysis;
    }

    // Group by OEM → commodity → sequence number
    var groups = {};
    sequences.forEach(function(seq) {
      var key = (seq.oem || 'Unknown') + '|' + (seq.commodity || 'Unknown');
      if (!groups[key]) groups[key] = [];
      groups[key].push(seq);
    });

    // Sort each group by sequence number
    Object.keys(groups).forEach(function(key) {
      groups[key].sort(function(a, b) {
        return (a.sequenceNumber || 0) - (b.sequenceNumber || 0);
      });
    });

    // Interleave groups to minimize changeovers
    var optimized = [];
    var groupKeys = Object.keys(groups);
    var maxLen = Math.max.apply(null, groupKeys.map(function(k) { return groups[k].length; }));

    for (var i = 0; i < maxLen; i++) {
      groupKeys.forEach(function(key) {
        if (groups[key][i]) optimized.push(groups[key][i]);
      });
    }

    // Calculate changeover reduction
    var originalChangeovers = countChangeovers(sequences);
    var optimizedChangeovers = countChangeovers(optimized);
    var reduction = originalChangeovers - optimizedChangeovers;

    analysis.optimizedOrder = optimized.map(function(s) {
      return { id: s.id, seq: s.sequenceNumber, oem: s.oem, commodity: s.commodity, partNumber: s.partNumber };
    });

    analysis.metrics = {
      originalCount: sequences.length,
      optimizedCount: optimized.length,
      originalChangeovers: originalChangeovers,
      optimizedChangeovers: optimizedChangeovers,
      changeoverReduction: reduction,
      reductionPercent: originalChangeovers > 0 ? Math.round((reduction / originalChangeovers) * 100) : 0,
      groupsIdentified: groupKeys.length,
    };

    if (reduction > 0) {
      analysis.recommendations.push({
        type: 'optimization',
        priority: 'high',
        message: 'Reorder sequences to group by OEM+commodity — reduces ' + reduction + ' changeovers (' + analysis.metrics.reductionPercent + '% reduction)',
      });
    }

    if (groupKeys.length > 1) {
      analysis.recommendations.push({
        type: 'info',
        priority: 'medium',
        message: groupKeys.length + ' distinct OEM/commodity groups detected — consider dedicated lines per group',
      });
    }

    // Check for overdue sequences
    var pending = sequences.filter(function(s) { return s.status === 'pending'; });
    if (pending.length > 5) {
      analysis.recommendations.push({
        type: 'warning',
        priority: 'high',
        message: pending.length + ' pending sequences — backlog risk. Consider expediting high-priority items.',
      });
    }

    logAnalysis(analysis);
    return analysis;
  }

  function countChangeovers(seqs) {
    var count = 0;
    for (var i = 1; i < seqs.length; i++) {
      if ((seqs[i].oem || '') !== (seqs[i-1].oem || '') ||
          (seqs[i].commodity || '') !== (seqs[i-1].commodity || '')) {
        count++;
      }
    }
    return count;
  }

  // ── Route Optimization ────────────────────────────────────
  // Minimize total transit time, balance loads across routes
  function optimizeRoutes(routes, deliveries) {
    var analysis = {
      engine: 'OwlAI-RouteOpt',
      version: engineVersion,
      timestamp: new Date().toISOString(),
      recommendations: [],
      metrics: {},
    };

    if (routes.length === 0) {
      analysis.recommendations.push({ type: 'info', message: 'No routes configured' });
      return analysis;
    }

    // Calculate load per route
    var routeLoads = {};
    routes.forEach(function(r) {
      routeLoads[r.id] = {
        name: r.name,
        from: r.fromBuilding,
        to: r.toBuilding,
        transitTime: r.transitTime,
        deliveryCount: 0,
        totalTransit: 0,
      };
    });

    deliveries.forEach(function(d) {
      if (routeLoads[d.routeId]) {
        routeLoads[d.routeId].deliveryCount++;
        routeLoads[d.routeId].totalTransit += routeLoads[d.routeId].transitTime;
      }
    });

    // Find overloaded and underutilized routes
    var loads = Object.values(routeLoads);
    var avgLoad = loads.reduce(function(sum, l) { return sum + l.deliveryCount; }, 0) / loads.length;
    var maxLoad = Math.max.apply(null, loads.map(function(l) { return l.deliveryCount; }));
    var minLoad = Math.min.apply(null, loads.map(function(l) { return l.deliveryCount; }));

    analysis.metrics = {
      totalRoutes: routes.length,
      totalDeliveries: deliveries.length,
      avgDeliveriesPerRoute: Math.round(avgLoad * 10) / 10,
      maxLoad: maxLoad,
      minLoad: minLoad,
      loadImbalance: maxLoad - minLoad,
    };

    loads.forEach(function(load) {
      if (load.deliveryCount > avgLoad * 1.5) {
        analysis.recommendations.push({
          type: 'warning',
          priority: 'high',
          message: 'Route ' + load.name + ' is overloaded (' + load.deliveryCount + ' deliveries, ' + Math.round(load.deliveryCount / avgLoad * 100) + '% above average) — consider redistributing to underused routes',
        });
      } else if (load.deliveryCount < avgLoad * 0.3 && load.deliveryCount > 0) {
        analysis.recommendations.push({
          type: 'optimization',
          priority: 'low',
          message: 'Route ' + load.name + ' is underutilized (' + load.deliveryCount + ' deliveries) — consider consolidating with adjacent route',
        });
      }
    });

    if (analysis.metrics.loadImbalance > 3) {
      analysis.recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: 'Load imbalance of ' + analysis.metrics.loadImbalance + ' deliveries between routes — rebalance for even utilization',
      });
    }

    logAnalysis(analysis);
    return analysis;
  }

  // ── Forklift Assignment Optimization ──────────────────────
  // Match forklift capacity to delivery load, minimize idle time
  function optimizeForkliftAssignment(forklifts, deliveries) {
    var analysis = {
      engine: 'OwlAI-ForkOpt',
      version: engineVersion,
      timestamp: new Date().toISOString(),
      recommendations: [],
      assignments: [],
      metrics: {},
    };

    var available = forklifts.filter(function(f) {
      return f.status === 'active' && f.maintenanceStatus !== 'overdue';
    });

    var pendingDeliveries = deliveries.filter(function(d) {
      return d.status === 'pending';
    });

    analysis.metrics = {
      totalForklifts: forklifts.length,
      availableForklifts: available.length,
      inMaintenance: forklifts.filter(function(f) { return f.status === 'maintenance'; }).length,
      pendingDeliveries: pendingDeliveries.length,
      utilization: available.length > 0 ? Math.round((pendingDeliveries.length / available.length) * 100) : 0,
    };

    // Greedy assignment: match highest-capacity forklift to deliveries with most racks
    var sortedFLs = available.sort(function(a, b) { return b.capacity - a.capacity; });
    var sortedDlvs = pendingDeliveries.sort(function(a, b) {
      return (b.rackIds || []).length - (a.rackIds || []).length;
    });

    var assigned = 0;
    for (var i = 0; i < sortedFLs.length && i < sortedDlvs.length; i++) {
      var fl = sortedFLs[i];
      var dlv = sortedDlvs[i];
      var rackCount = (dlv.rackIds || []).length;
      var capacityOK = fl.capacity >= rackCount * 2000;

      analysis.assignments.push({
        forkliftId: fl.id,
        forkliftUnit: fl.unitNumber,
        forkliftCapacity: fl.capacity,
        deliveryId: dlv.id,
        deliveryTicket: dlv.ticketNumber,
        rackCount: rackCount,
        route: dlv.routeName,
        capacityOK: capacityOK,
        recommendation: capacityOK ? 'OK — capacity sufficient' : 'WARNING — load may exceed capacity',
      });
      assigned++;
    }

    if (pendingDeliveries.length > available.length) {
      analysis.recommendations.push({
        type: 'warning',
        priority: 'high',
        message: pendingDeliveries.length + ' pending deliveries but only ' + available.length + ' available forklifts — ' + (pendingDeliveries.length - available.length) + ' deliveries will be delayed',
      });
    }

    if (analysis.metrics.inMaintenance > 0) {
      analysis.recommendations.push({
        type: 'warning',
        priority: 'medium',
        message: analysis.metrics.inMaintenance + ' forklift(s) in maintenance — plan recovery to restore full fleet capacity',
      });
    }

    if (analysis.metrics.utilization > 80) {
      analysis.recommendations.push({
        type: 'warning',
        priority: 'high',
        message: 'Fleet utilization at ' + analysis.metrics.utilization + '% — consider renting additional equipment or rescheduling non-critical deliveries',
      });
    } else if (analysis.metrics.utilization < 30 && available.length > 0) {
      analysis.recommendations.push({
        type: 'info',
        priority: 'low',
        message: 'Fleet utilization at only ' + analysis.metrics.utilization + '% — fleet is underutilized, consider reassigning to other tasks',
      });
    }

    // Check for overdue maintenance
    var overdueFLs = forklifts.filter(function(f) { return f.maintenanceStatus === 'overdue'; });
    overdueFLs.forEach(function(fl) {
      analysis.recommendations.push({
        type: 'critical',
        priority: 'critical',
        message: 'Forklift ' + fl.unitNumber + ' has OVERDUE maintenance (' + fl.hourMeter.toFixed(0) + 'h / ' + fl.maintenanceDue + 'h) — schedule PM order immediately',
      });
    });

    logAnalysis(analysis);
    return analysis;
  }

  // ── Rack Loading Efficiency ───────────────────────────────
  function optimizeRackLoading(racks) {
    var analysis = {
      engine: 'OwlAI-RackOpt',
      version: engineVersion,
      timestamp: new Date().toISOString(),
      recommendations: [],
      metrics: {},
    };

    if (racks.length === 0) {
      analysis.recommendations.push({ type: 'info', message: 'No racks to analyze' });
      return analysis;
    }

    var totalSlots = 0;
    var totalLoaded = 0;
    var totalErrors = 0;
    var incompleteRacks = [];

    racks.forEach(function(rack) {
      totalSlots += rack.slotCount;
      totalLoaded += rack.loadedCount;
      totalErrors += rack.errors || 0;
      if (rack.loadedCount < rack.slotCount) {
        incompleteRacks.push({
          id: rack.id,
          line: rack.lineName,
          loaded: rack.loadedCount,
          total: rack.slotCount,
          pct: Math.round((rack.loadedCount / rack.slotCount) * 100),
        });
      }
    });

    analysis.metrics = {
      totalRacks: racks.length,
      totalSlots: totalSlots,
      totalLoaded: totalLoaded,
      utilization: totalSlots > 0 ? Math.round((totalLoaded / totalSlots) * 100) : 0,
      totalErrors: totalErrors,
      incompleteRacks: incompleteRacks.length,
    };

    if (analysis.metrics.utilization < 50) {
      analysis.recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: 'Overall rack utilization at ' + analysis.metrics.utilization + '% — consolidate partial racks to free up equipment',
      });
    } else if (analysis.metrics.utilization > 90) {
      analysis.recommendations.push({
        type: 'info',
        priority: 'low',
        message: 'Rack utilization at ' + analysis.metrics.utilization + '% — excellent density, ensure staging capacity for incoming loads',
      });
    }

    if (totalErrors > 0) {
      analysis.recommendations.push({
        type: 'critical',
        priority: 'critical',
        message: totalErrors + ' poka-yoke error(s) detected — review scan errors and retrain operators on correct part sequencing',
      });
    }

    incompleteRacks.forEach(function(r) {
      if (r.pct < 50) {
        analysis.recommendations.push({
          type: 'warning',
          priority: 'high',
          message: 'Rack ' + r.id + ' (' + r.line + ') only ' + r.pct + '% loaded (' + r.loaded + '/' + r.total + ') — prioritize completion',
        });
      }
    });

    logAnalysis(analysis);
    return analysis;
  }

  // ── Comprehensive Fleet Analysis ──────────────────────────
  function runFullAnalysis(state) {
    var report = {
      engine: 'OwlAI-FullAnalysis',
      version: engineVersion,
      timestamp: new Date().toISOString(),
      sections: {},
      summary: '',
      totalRecommendations: 0,
      criticalCount: 0,
    };

    report.sections.sequences = optimizeSequences(state.sequences || []);
    report.sections.routes = optimizeRoutes(state.routes || [], state.deliveries || []);
    report.sections.forklifts = optimizeForkliftAssignment(state.forklifts || [], state.deliveries || []);
    report.sections.racks = optimizeRackLoading(state.racks || []);

    // Count total recommendations
    Object.keys(report.sections).forEach(function(key) {
      var section = report.sections[key];
      if (section.recommendations) {
        report.totalRecommendations += section.recommendations.length;
        report.criticalCount += section.recommendations.filter(function(r) { return r.priority === 'critical'; }).length;
      }
    });

    report.summary = report.totalRecommendations + ' recommendations across ' + Object.keys(report.sections).length + ' optimization areas';
    if (report.criticalCount > 0) {
      report.summary += ' — ' + report.criticalCount + ' CRITICAL items need immediate attention';
    }

    logAnalysis(report);
    return report;
  }

  // ── Analysis Logging ──────────────────────────────────────
  function logAnalysis(analysis) {
    analysisLog.push({
      timestamp: analysis.timestamp || new Date().toISOString(),
      engine: analysis.engine || 'OwlAI',
      summary: analysis.summary || (analysis.recommendations ? analysis.recommendations.length + ' recommendations' : 'analysis complete'),
    });
    if (analysisLog.length > 50) analysisLog.shift();
  }

  function getAnalysisLog() {
    return analysisLog;
  }

  return {
    version: engineVersion,
    optimizeSequences: optimizeSequences,
    optimizeRoutes: optimizeRoutes,
    optimizeForkliftAssignment: optimizeForkliftAssignment,
    optimizeRackLoading: optimizeRackLoading,
    runFullAnalysis: runFullAnalysis,
    getAnalysisLog: getAnalysisLog,
  };
})();
