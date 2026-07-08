/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Generic YMS & Multi-Industry Logistics
   - Yard Management System (trailer tracking, dock doors, gate)
   - Blue Yonder WMS/TMS integration (REST API stub)
   - Conveyor pick-list system (scan totes → skids → ship)
   - Skid/Pallet load builder (replaces Excel spreadsheets)
   - Multi-industry: Automotive, Retail (Walmart/Lowe's),
     Truck Mfg (PACCAR), Lumber, Mexico Maquiladora
   - Cross-border: US/Mexico/Canada USMCA compliance
   - Carrier directory with SCAC codes
   ============================================================ */

var YMS = (function () {

  var state = {
    industry: 'automotive',
    yardSpots: [],
    gateLog: [],
    appointments: [],
    carriers: [],
    pickLists: [],
    skids: [],
    conveyorStations: [],
    blueYonderConfig: null,
    blueYonderConnected: false
  };

  var INDUSTRIES = {
    automotive: { name: 'Automotive (OEM/Tier 1)', icon: '🚗', oems: ['FCA','GM','Ford','HD','BMW','Toyota'], units: 'Racks/Totes' },
    retail: { name: 'Retail (Walmart/Lowe\'s)', icon: '🛒', oems: ['Walmart','Lowe\'s','Target','Home Depot'], units: 'Pallets/Cases' },
    truckmfg: { name: 'Truck Mfg (PACCAR)', icon: '🚛', oems: ['Kenworth','Peterbilt','DAF','Navistar','Volvo'], units: 'Skids/Crates' },
    lumber: { name: 'Lumber/Timber', icon: '🪵', oems: ['Interfor','West Fraser','Canfor','Weyerhaeuser'], units: 'Bundles/Bunks' },
    mexico: { name: 'Mexico Maquiladora', icon: '🇲🇽', oems: ['Tier 1 MX','Tier 2 MX','Manufactura MX'], units: 'Skids/Pallets' }
  };

  function init() {
    if (state.yardSpots.length > 0) return;

    // Yard spots — visual grid layout
    var rows = ['A','B','C','D'];
    var cols = [1,2,3,4,5,6,7,8];
    rows.forEach(function(r) {
      cols.forEach(function(c) {
        state.yardSpots.push({
          id: 'YARD-' + r + c,
          row: r, col: c,
          trailerId: null,
          status: 'empty',
          occupiedSince: null
        });
      });
    });

    // Pre-populate some spots
    state.yardSpots[0] = { id:'YARD-A1', row:'A', col:1, trailerId:'TRL-1043', status:'loaded', occupiedSince:'2024-07-08 06:00', cargo:'Bumpers → SHAP' };
    state.yardSpots[1] = { id:'YARD-A2', row:'A', col:2, trailerId:'TRL-2207', status:'loaded', occupiedSince:'2024-07-08 05:30', cargo:'Fascias → JNAP' };
    state.yardSpots[5] = { id:'YARD-A6', row:'A', col:6, trailerId:'TRL-5789', status:'empty_trailer', occupiedSince:'2024-07-08 04:00', cargo:'Empty — awaiting load' };
    state.yardSpots[16] = { id:'YARD-C1', row:'C', col:1, trailerId:'TRL-3301', status:'loading', occupiedSince:'2024-07-08 07:00', cargo:'HD Cradles → Windsor' };
    state.yardSpots[17] = { id:'YARD-C2', row:'C', col:2, trailerId:'TRL-4456', status:'loaded', occupiedSince:'2024-07-07 22:00', cargo:'CKD Hamburg → Torrance' };

    // Gate log
    state.gateLog = [
      { id:'GATE-001', time:'2024-07-08 06:15', direction:'in', driver:'Mike R.', carrier:'J.B. Hunt', trailerId:'TRL-1043', scac:'JBHT', bol:'BOL-20240708-001', purpose:'Pickup sequenced load', spot:'YARD-A1', status:'checked_in' },
      { id:'GATE-002', time:'2024-07-08 05:45', direction:'in', driver:'Sarah K.', carrier:'Schneider', trailerId:'TRL-2207', scac:'SCNL', bol:'BOL-20240708-002', purpose:'Pickup reefer load', spot:'YARD-A2', status:'checked_in' },
      { id:'GATE-003', time:'2024-07-08 07:00', direction:'in', driver:'Tom B.', carrier:'Werner', trailerId:'TRL-3301', scac:'WERN', bol:'BOL-20240708-003', purpose:'Live load HD cradles', spot:'YARD-C1', status:'loading' },
      { id:'GATE-004', time:'2024-07-07 22:30', direction:'in', driver:'Lisa M.', carrier:'Prime Inc', trailerId:'TRL-4456', scac:'PRIM', bol:'BOL-20240707-004', purpose:'Drop CKD container', spot:'YARD-C2', status:'checked_in' },
      { id:'GATE-005', time:'2024-07-08 06:30', direction:'out', driver:'Mike R.', carrier:'J.B. Hunt', trailerId:'TRL-1043', scac:'JBHT', bol:'BOL-20240708-001', purpose:'Departed to SHAP', spot:'—', status:'departed' }
    ];

    // Appointments
    state.appointments = [
      { id:'APT-001', time:'2024-07-08 08:00', carrier:'J.B. Hunt', driver:'Mike R.', trailerId:'TRL-1043', dockDoor:'DOCK-12', type:'pickup', status:'completed', bol:'BOL-20240708-001' },
      { id:'APT-002', time:'2024-07-08 09:30', carrier:'Schneider', driver:'Sarah K.', trailerId:'TRL-2207', dockDoor:'DOCK-08', type:'pickup', status:'in_progress', bol:'BOL-20240708-002' },
      { id:'APT-003', time:'2024-07-08 11:00', carrier:'Werner', driver:'Tom B.', trailerId:'TRL-3301', dockDoor:'DOCK-15', type:'live_load', status:'scheduled', bol:'BOL-20240708-003' },
      { id:'APT-004', time:'2024-07-08 14:00', carrier:'Prime Inc', driver:'Lisa M.', trailerId:'TRL-4456', dockDoor:'DOCK-03', type:'drop', status:'scheduled', bol:'BOL-20240707-004' },
      { id:'APT-005', time:'2024-07-08 15:30', carrier:'J.B. Hunt', driver:'TBD', trailerId:'TRL-5789', dockDoor:'DOCK-09', type:'live_load', status:'scheduled', bol:'TBD' }
    ];

    // Carriers with SCAC codes
    state.carriers = [
      { id:'C-001', name:'J.B. Hunt Transport', scac:'JBHT', type:'Dry Van/Reefer', dot:'00424338', mc:'MC-170393', insurance:'$1M cargo', status:'approved' },
      { id:'C-002', name:'Schneider National', scac:'SCNL', type:'Dry Van/Reefer/Bulk', dot:'00264853', mc:'MC-158094', insurance:'$2M cargo', status:'approved' },
      { id:'C-003', name:'Werner Enterprises', scac:'WERN', type:'Dry Van/Flatbed', dot:'00523933', mc:'MC-196537', insurance:'$1M cargo', status:'approved' },
      { id:'C-004', name:'Prime Inc', scac:'PRIM', type:'Reefer/Flatbed', dot:'00600643', mc:'MC-272090', insurance:'$1M cargo', status:'approved' },
      { id:'C-005', name:'PACCAR Leasing (PacLease)', scac:'PCLS', type:'Day Cab/Trailer', dot:'00712345', mc:'MC-350221', insurance:'$1M cargo', status:'approved' },
      { id:'C-006', name:'Estes Express Lines', scac:'ESTE', type:'LTL', dot:'00876543', mc:'MC-201122', insurance:'$500K cargo', status:'approved' },
      { id:'C-007', name:'Old Dominion Freight', scac:'ODFL', type:'LTL', dot:'00912345', mc:'MC-205432', insurance:'$500K cargo', status:'approved' },
      { id:'C-008', name:'C.R. England', scac:'CREN', type:'Reefer', dot:'01023456', mc:'MC-210543', insurance:'$1M cargo', status:'approved' }
    ];

    // Conveyor pick-list system (Terrabon-style: scan totes → build skids → conveyor → ship)
    state.pickLists = [
      { id:'PL-001', status:'in_progress', assignedTo:'Operator 1', station:'CONV-01',
        items: [
          { partNumber:'5WK-8A350-AB', description:'Front Bumper', qty:4, scanned:4, toteId:'TOTE-001', status:'complete' },
          { partNumber:'8K93-04200-A', description:'Headliner', qty:2, scanned:2, toteId:'TOTE-002', status:'complete' },
          { partNumber:'SEAT-CUSH-FR-01', description:'Seat Cushion', qty:4, scanned:2, toteId:'TOTE-003', status:'in_progress' },
          { partNumber:'WIND-MX2-FR', description:'Windshield', qty:2, scanned:0, toteId:'TOTE-004', status:'pending' }
        ],
        targetSkid:'SKID-001', conveyorLane:'LANE-A', destination:'SHAP', createdAt:'2024-07-08 06:00'
      },
      { id:'PL-002', status:'complete', assignedTo:'Operator 2', station:'CONV-02',
        items: [
          { partNumber:'58000-10', description:'HD Touring Frame', qty:1, scanned:1, toteId:'TOTE-010', status:'complete' },
          { partNumber:'17000-10', description:'Milwaukee-Eight 114', qty:1, scanned:1, toteId:'TOTE-011', status:'complete' }
        ],
        targetSkid:'SKID-002', conveyorLane:'LANE-B', destination:'Windsor Assembly', createdAt:'2024-07-08 05:00', completedAt:'2024-07-08 06:45'
      },
      { id:'PL-003', status:'pending', assignedTo:'Unassigned', station:'CONV-01',
        items: [
          { partNumber:'61400-10', description:'Fuel Tank', qty:2, scanned:0, toteId:'TOTE-020', status:'pending' },
          { partNumber:'56000-09', description:'Handlebar Assembly', qty:3, scanned:0, toteId:'TOTE-021', status:'pending' }
        ],
        targetSkid:'SKID-003', conveyorLane:'LANE-A', destination:'Hamburg CKD', createdAt:'2024-07-08 07:00'
      }
    ];

    // Skids (completed pallets ready for shipping)
    state.skids = [
      { id:'SKID-001', status:'on_conveyor', pickList:'PL-001', lane:'LANE-A',
        partsCount:12, weight:850, destination:'SHAP', trailerId:null,
        location:'Conveyor → Dock 12', createdAt:'2024-07-08 06:00'
      },
      { id:'SKID-002', status:'loaded', pickList:'PL-002', lane:'LANE-B',
        partsCount:2, weight:420, destination:'Windsor Assembly', trailerId:'TRL-3301',
        location:'In trailer TRL-3301', createdAt:'2024-07-08 05:00', loadedAt:'2024-07-08 07:15'
      },
      { id:'SKID-003', status:'staged', pickList:'PL-003', lane:'LANE-A',
        partsCount:5, weight:320, destination:'Hamburg CKD', trailerId:null,
        location:'Staging Area 3', createdAt:'2024-07-08 07:30'
      }
    ];

    // Conveyor stations
    state.conveyorStations = [
      { id:'CONV-01', name:'Conveyor Station 1', lane:'LANE-A', status:'running', currentPickList:'PL-001', operator:'Operator 1', speed:'30 ft/min', itemsPerHour:45 },
      { id:'CONV-02', name:'Conveyor Station 2', lane:'LANE-B', status:'idle', currentPickList:null, operator:'Operator 2', speed:'30 ft/min', itemsPerHour:38 },
      { id:'CONV-03', name:'Conveyor Station 3', lane:'LANE-C', status:'maintenance', currentPickList:null, operator:'—', speed:'30 ft/min', itemsPerHour:0 }
    ];

    // Blue Yonder config (stub — real integration needs OAuth2 + tenant URL)
    state.blueYonderConfig = {
      tenantUrl: 'https://your-tenant.blueyonder.com',
      apiVersion: 'v3',
      clientId: '',
      clientSecret: '',
      scope: 'wms.inventory wms.tasks wms.labor',
      tokenUrl: 'https://auth.blueyonder.com/oauth2/token',
      connected: false,
      lastSync: null
    };
  }

  // ── Blue Yonder Integration (REST API stub) ────────────────

  function connectBlueYonder(config) {
    // In production: fetch OAuth2 token from config.tokenUrl
    // Then use token to call WMS REST API endpoints
    // For now: simulate connection
    state.blueYonderConfig.connected = true;
    state.blueYonderConfig.lastSync = new Date().toISOString();
    state.blueYonderConnected = true;
    return {
      success: true,
      message: 'Blue Yonder WMS connected (simulated). In production: OAuth2 token exchange + REST API calls to ' + config.tenantUrl
    };
  }

  function syncBlueYonderInventory() {
    // Production: GET /wms/v3/inventory/positions
    // Returns: inventory positions by SKU, location, quantity, status
    state.blueYonderConfig.lastSync = new Date().toISOString();
    return {
      synced: true,
      message: 'Inventory synced from Blue Yonder WMS (simulated)',
      items: [
        { sku:'5WK-8A350-AB', location:'A-12-03-B', qty:120, status:'available' },
        { sku:'8K93-04200-A', location:'B-05-01-A', qty:45, status:'available' },
        { sku:'58000-10', location:'C-08-02-D', qty:8, status:'reserved' }
      ]
    };
  }

  // ── Conveyor Pick-List System ──────────────────────────────
  // Terrabon-style: scan totes → build skids → conveyor → ship per skid

  function scanTote(pickListId, itemIndex, toteBarcode) {
    var pl = state.pickLists.find(function(p) { return p.id === pickListId; });
    if (!pl) return { success: false, message: 'Pick list not found' };
    var item = pl.items[itemIndex];
    if (!item) return { success: false, message: 'Item not found' };

    item.scanned++;
    item.status = item.scanned >= item.qty ? 'complete' : 'in_progress';

    if (item.status === 'complete') {
      item.toteId = toteBarcode || item.toteId;
    }

    // Check if all items complete
    var allComplete = pl.items.every(function(i) { return i.status === 'complete'; });
    if (allComplete) {
      pl.status = 'complete';
      pl.completedAt = new Date().toISOString();
      // Move skid to conveyor
      var skid = state.skids.find(function(s) { return s.pickList === pl.id; });
      if (skid) {
        skid.status = 'on_conveyor';
        skid.location = 'Conveyor ' + pl.conveyorLane + ' → Staging';
      }
    }

    return {
      success: true,
      message: 'Scanned tote ' + (toteBarcode || item.toteId) + ' for ' + item.partNumber,
      itemStatus: item.status,
      pickListStatus: pl.status,
      allComplete: allComplete
    };
  }

  function loadSkidOnTrailer(skidId, trailerId) {
    var skid = state.skids.find(function(s) { return s.id === skidId; });
    if (!skid) return { success: false, message: 'Skid not found' };
    skid.trailerId = trailerId;
    skid.status = 'loaded';
    skid.location = 'In trailer ' + trailerId;
    skid.loadedAt = new Date().toISOString();
    return { success: true, message: 'Skid ' + skidId + ' loaded on trailer ' + trailerId };
  }

  // ── Skid Load Builder (replaces Excel spreadsheets) ────────
  // For Mexico maquiladora suppliers who still use Excel

  var TRAILER_TYPES = {
    '53FT_DRY_VAN': { name: '53ft Dry Van', length: 624, width: 102, height: 110, maxWeight: 45000, maxSkids: 26 },
    '53FT_REEFER': { name: '53ft Reefer', length: 624, width: 102, height: 102, maxWeight: 44000, maxSkids: 24 },
    '48FT_FLATBED': { name: '48ft Flatbed', length: 576, width: 102, height: 102, maxWeight: 48000, maxSkids: 24 },
    '28FT_DOCK_TRUCK': { name: '28ft Dock Truck', length: 336, width: 96, height: 96, maxWeight: 26000, maxSkids: 12 }
  };

  var SKID_TYPES = {
    'STD_48x40': { name: 'Standard 48x40 Pallet', length: 48, width: 40, height: 6, weight: 45, maxLoad: 4000 },
    'STD_48x48': { name: 'Square 48x48 Skid', length: 48, width: 48, height: 6, weight: 50, maxLoad: 4500 },
    'STD_42x42': { name: 'Chemical 42x42 Pallet', length: 42, width: 42, height: 6, weight: 40, maxLoad: 3500 },
    'CHEP_48x40': { name: 'CHEP Blue 48x40', length: 48, width: 40, height: 6, weight: 60, maxLoad: 4000 },
    'CUSTOM_SKID': { name: 'Custom Skid (60x48)', length: 60, width: 48, height: 8, weight: 75, maxLoad: 5000 }
  };

  function buildSkidLoadPlan(skids, trailerType) {
    var dims = TRAILER_TYPES[trailerType] || TRAILER_TYPES['53FT_DRY_VAN'];
    var totalWeight = 0;
    var totalSkids = 0;
    var loaded = [];
    var overflow = [];

    // Calculate how many skids fit (turn-pattern: 48" side-by-side, then 40" rotated)
    var skidType = SKID_TYPES[skids[0].type] || SKID_TYPES['STD_48x40'];
    var skidsPerRow = Math.floor(dims.width / skidType.width);
    var rowsNeeded = Math.ceil(skids.length / skidsPerRow);

    skids.forEach(function(skid, idx) {
      var skidInfo = SKID_TYPES[skid.type] || SKID_TYPES['STD_48x40'];
      var skidWeight = (skid.weight || 0) + skidInfo.weight;
      var row = Math.floor(idx / skidsPerRow);
      var col = idx % skidsPerRow;

      if (totalWeight + skidWeight > dims.maxWeight || idx >= dims.maxSkids) {
        overflow.push({ ...skid, reason: totalWeight + skidWeight > dims.maxWeight ? 'weight_limit' : 'space_limit' });
      } else {
        totalWeight += skidWeight;
        totalSkids++;
        loaded.push({
          skidId: skid.id,
          position: 'Row ' + (row + 1) + ', Position ' + (col + 1),
          x: col * skidInfo.width,
          y: row * skidInfo.length,
          weight: skidWeight,
          type: skid.type,
          contents: skid.contents || 'Mixed parts'
        });
      }
    });

    return {
      trailerType: trailerType,
      trailerDims: dims,
      loaded: loaded,
      overflow: overflow,
      totalSkids: totalSkids,
      totalWeight: totalWeight,
      weightUtilization: Math.round((totalWeight / dims.maxWeight) * 1000) / 10,
      spaceUtilization: Math.round((totalSkids / dims.maxSkids) * 1000) / 10,
      rowsUsed: rowsNeeded,
      skidsPerRow: skidsPerRow
    };
  }

  // ── Cross-Border (USMCA) ───────────────────────────────────

  function generateUSMCA(shipment) {
    return {
      certificationNumber: 'USMCA-' + Date.now().toString().slice(-8),
      exporter: shipment.exporter || 'OwlLogics MX',
      producer: shipment.producer || 'Maquiladora Operations',
      importer: shipment.importer || 'OwlLogics US',
      originCriteria: shipment.originCriteria || 'B (Wholly produced in USMCA territory)',
      shipmentValue: shipment.value || 0,
      currency: 'USD',
      certifier: 'Exporter',
      validityPeriod: '12 months',
      goods: shipment.goods || []
    };
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    state: state,
    INDUSTRIES: INDUSTRIES,
    TRAILER_TYPES: TRAILER_TYPES,
    SKID_TYPES: SKID_TYPES,
    init: init,
    connectBlueYonder: connectBlueYonder,
    syncBlueYonderInventory: syncBlueYonderInventory,
    scanTote: scanTote,
    loadSkidOnTrailer: loadSkidOnTrailer,
    buildSkidLoadPlan: buildSkidLoadPlan,
    generateUSMCA: generateUSMCA
  };
})();
