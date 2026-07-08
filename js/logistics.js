/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 OwlLogics Contributors - All Rights Reserved - Patent Pending
   Contact: contact@owllogics.app
   ============================================================
   OwlLogics Logistics Engine
   ============================================================ */

var Logistics = (function () {

  var state = {
    packages: [],
    pallets: [],
    ckdKits: [],
    shipments: [],
    dryDocks: [],
    costRecords: [],
    initialized: false,
  };

  // ── Initialize seed data ──────────────────────────────────
  function init() {
    if (state.initialized) return;
    state.initialized = true;

    // Seed package master
    state.packages = [
      { id:'PKG-001', code:'STD-BOX-M', name:'Standard Box Medium', type:'corrugated', length:24, width:18, height:12, weight:2.5, maxLoad:25, cost:4.50, reusable:false, material:'corrugated', hazardous:false, oemSpec:'AIAG-4' },
      { id:'PKG-002', code:'STD-BOX-L', name:'Standard Box Large', type:'corrugated', length:36, width:24, height:18, weight:4.0, maxLoad:45, cost:7.20, reusable:false, material:'corrugated', hazardous:false, oemSpec:'AIAG-4' },
      { id:'PKG-003', code:'RACK-BUMPER', name:'Returnable Bumper Rack', type:'returnable', length:120, width:60, height:80, weight:35, maxLoad:200, cost:450.00, reusable:true, material:'steel', hazardous:false, oemSpec:'FCA-RACK-A' },
      { id:'PKG-004', code:'CRATE-CKD', name:'CKD Export Crate', type:'expendable', length:200, width:120, height:100, weight:50, maxLoad:500, cost:85.00, reusable:false, material:'wood-ispm15', hazardous:false, oemSpec:'ISPM-15' },
      { id:'PKG-005', code:'PALLET-STD', name:'Standard Wooden Pallet 48x40', type:'pallet', length:48, width:40, height:6, weight:35, maxLoad:2500, cost:22.00, reusable:true, material:'wood-ispm15', hazardous:false, oemSpec:'GMA-48x40' },
      { id:'PKG-006', code:'CONTAINER-20', name:'20ft Shipping Container', type:'container', length:600, width:235, height:239, weight:2200, maxLoad:28000, cost:1800.00, reusable:true, material:'steel', hazardous:false, oemSpec:'ISO-668' },
      { id:'PKG-007', code:'CONTAINER-40', name:'40ft Shipping Container', type:'container', length:1219, width:235, height:239, weight:3700, maxLoad:30000, cost:2500.00, reusable:true, material:'steel', hazardous:false, oemSpec:'ISO-668' },
      { id:'PKG-008', code:'PALLET-CHEP', name:'CHEP Blue Pallet 48x45', type:'pallet', length:48, width:45, height:6, weight:38, maxLoad:2800, cost:0, reusable:true, material:'wood-pooled', hazardous:false, oemSpec:'CHEP-48x45' },
    ];

    // Seed pallets
    state.pallets = [
      { id:'PAL-001', palletNumber:'PAL-0001', type:'STD-48x40', packageIds:['PKG-001','PKG-001','PKG-002'], totalWeight:34, totalPackages:3, status:'staged', destination:'Bldg B (Staging)', cost:22.00, buildDate:new Date().toISOString() },
      { id:'PAL-002', palletNumber:'PAL-0002', type:'STD-48x40', packageIds:['PKG-002','PKG-002'], totalWeight:8, totalPackages:2, status:'staged', destination:'Bldg C (Dock)', cost:22.00, buildDate:new Date().toISOString() },
    ];

    // Seed CKD kits
    state.ckdKits = [
      { id:'CKD-001', kitNumber:'CKD-HD-SPORT', description:'Harley-Davidson Sportster CKD Kit', destination:'Hamburg, DE', origin:'York, PA', parts:['58000-10','56000-09','40600-10','61400-10','59000-10'], totalWeight:450, totalValue:8200, ckdLevel:'SKD', containerId:'CONT-2024-001', sealNumber:'SEAL-78321', status:'at_drydock', createdAt:new Date().toISOString() },
      { id:'CKD-002', kitNumber:'CKD-HD-TOURING', description:'Harley-Davidson Touring CKD Kit', destination:'Yokohama, JP', origin:'Kansas City, MO', parts:['58000-10','17000-10','40700-10','61400-10','59100-10'], totalWeight:680, totalValue:12500, ckdLevel:'CKD', containerId:'CONT-2024-002', sealNumber:'SEAL-78322', status:'in_transit', createdAt:new Date().toISOString() },
    ];

    // Seed shipments (end-to-end)
    state.shipments = [
      {
        id:'SHP-001', shipmentNumber:'SHP-2024-001', mode:'ocean', origin:'York, PA', originPort:'Port of Baltimore', destination:'Hamburg, DE', destinationPort:'Port of Hamburg',
        carrier:'Maersk Line', vesselName:'MAERSK SEALAND', voyageNumber:'MS-7821', billOfLading:'BOL-2024-7821', containerNumber:'CONT-2024-001', sealNumber:'SEAL-78321',
        grossWeight:450, netWeight:420, volume:12.5, teu:1, incoterm:'CIF', cargoValue:8200, freightCost:2400, insuranceCost:82, customsDuty:410, handlingCost:180, portCharges:95, totalLanded:11367,
        status:'in_transit', etd:'2024-07-01', eta:'2024-07-22', actualDeparture:'2024-07-01', actualArrival:'', transitDays:21, route:[{port:'Port of Baltimore',type:'origin',date:'2024-07-01'},{port:'Suez Canal',type:'transit',date:'2024-07-12'},{port:'Port of Hamburg',type:'destination',date:'2024-07-22'}]
      },
      {
        id:'SHP-002', shipmentNumber:'SHP-2024-002', mode:'rail', origin:'Kansas City, MO', originPort:'KC Rail Terminal', destination:'Long Beach, CA', destinationPort:'Port of Long Beach',
        carrier:'BNSF Railway', vesselName:'BNSF-7821', voyageNumber:'RAIL-441', billOfLading:'BOL-2024-7822', containerNumber:'CONT-2024-002', sealNumber:'SEAL-78322',
        grossWeight:680, netWeight:640, volume:18.2, teu:1, incoterm:'FCA', cargoValue:12500, freightCost:1850, insuranceCost:125, customsDuty:0, handlingCost:120, portCharges:45, totalLanded:14640,
        status:'in_transit', etd:'2024-07-03', eta:'2024-07-06', actualDeparture:'2024-07-03', actualArrival:'', transitDays:3, route:[{port:'KC Rail Terminal',type:'origin',date:'2024-07-03'},{port:'Chicago Hub',type:'transit',date:'2024-07-04'},{port:'Port of Long Beach',type:'destination',date:'2024-07-06'}]
      },
    ];

    // Seed dry docks
    state.dryDocks = [
      { id:'DD-001', name:'Dry Dock 1 — Baltimore', location:'Port of Baltimore', capacity:2, assignedShipments:['SHP-001'], status:'occupied', notes:'CKD container staging for Hamburg export' },
      { id:'DD-002', name:'Dry Dock 2 — Long Beach', location:'Port of Long Beach', capacity:3, assignedShipments:['SHP-002'], status:'occupied', notes:'Rail-to-port transload for Japan export' },
      { id:'DD-003', name:'Dry Dock 3 — Houston', location:'Port of Houston', capacity:2, assignedShipments:[], status:'available', notes:'Available for CKD export staging' },
    ];

    // Seed cost records
    state.costRecords = [
      { id:'COST-001', shipmentId:'SHP-001', category:'freight', description:'Ocean freight Baltimore→Hamburg', amount:2400, currency:'USD', date:'2024-07-01' },
      { id:'COST-002', shipmentId:'SHP-001', category:'insurance', description:'Marine insurance 1%', amount:82, currency:'USD', date:'2024-07-01' },
      { id:'COST-003', shipmentId:'SHP-001', category:'customs', description:'EU import duty 5%', amount:410, currency:'USD', date:'2024-07-22' },
      { id:'COST-004', shipmentId:'SHP-001', category:'handling', description:'Port handling + documentation', amount:180, currency:'USD', date:'2024-07-01' },
      { id:'COST-005', shipmentId:'SHP-001', category:'port', description:'Port charges Baltimore', amount:95, currency:'USD', date:'2024-07-01' },
    ];

    // Seed shipyards
    state.shipyards = [
      { id:'SY-001', name:'Port of Baltimore Terminal', location:'Baltimore, MD', berths:6, craneCount:4, status:'active', vessels:[{id:'V-001',name:'MAERSK SEALAND',type:'container',teu:8000,berth:2,status:'loading',eta:'2024-07-01',etd:'2024-07-02'}], containerStacks:42, notes:'Primary CKD export terminal' },
      { id:'SY-002', name:'Port of Long Beach', location:'Long Beach, CA', berths:8, craneCount:6, status:'active', vessels:[{id:'V-002',name:'EVERGREEN MARINE',type:'container',teu:12000,berth:5,status:'docked',eta:'2024-07-03',etd:'2024-07-05'}], containerStacks:78, notes:'West coast transpacific gateway' },
      { id:'SY-003', name:'Port of Houston', location:'Houston, TX', berths:4, craneCount:2, status:'active', vessels:[], containerStacks:15, notes:'Gulf coast CKD export' },
    ];

    // Seed tractor trailers
    state.trucks = [
      { id:'TRK-001', unit:'TRK-1043', type:'Day Cab', carrier:'J.B. Hunt', capacity:45000, trailerId:'TRL-001', driver:'Mike R.', currentLocation:'Bldg C (Dock)', destination:'Port of Baltimore', status:'loading', eta:'2024-07-01 14:00', loadId:'SHP-001' },
      { id:'TRK-002', unit:'TRK-2207', type:'Sleeper', carrier:'Schneider', capacity:48000, trailerId:'TRL-002', driver:'Sarah K.', currentLocation:'En route: I-70 E', destination:'Kansas City Rail Terminal', status:'in_transit', eta:'2024-07-03 08:00', loadId:'SHP-002' },
      { id:'TRK-003', unit:'TRK-3301', type:'Day Cab', carrier:'Werner', capacity:45000, trailerId:'TRL-003', driver:'Tom B.', currentLocation:'Port of Long Beach', destination:'Bldg A (Sequencing)', status:'returning', eta:'2024-07-06 16:00', loadId:'' },
      { id:'TRK-004', unit:'TRK-4456', type:'Reefer', carrier:'Prime Inc', capacity:44000, trailerId:'TRL-004', driver:'Lisa M.', currentLocation:'Bldg E (Warehouse)', destination:'Bldg D (Kitting)', status:'loading', eta:'2024-07-05 10:00', loadId:'' },
    ];

    // Seed trailers
    state.trailers = [
      { id:'TRL-001', trailerNumber:'TRL-1043', type:'53ft Dry Van', capacity:45000, doorType:'swing', reefer:false, currentTruck:'TRK-001', status:'attached', loaded:true },
      { id:'TRL-002', trailerNumber:'TRL-2207', type:'53ft Dry Van', capacity:48000, doorType:'roll-up', reefer:false, currentTruck:'TRK-002', status:'attached', loaded:true },
      { id:'TRL-003', trailerNumber:'TRL-3301', type:'40ft Container Chassis', capacity:40000, doorType:'n/a', reefer:false, currentTruck:'TRK-003', status:'attached', loaded:false },
      { id:'TRL-005', trailerNumber:'TRL-5589', type:'53ft Reefer', capacity:44000, doorType:'roll-up', reefer:true, currentTruck:'', status:'detached', loaded:false },
    ];

    // Seed rail consists (trains)
    state.railTrains = [
      {
        id:'TRAIN-001', trainNumber:'BNSF-7821', carrier:'BNSF Railway', route:'Kansas City → Chicago → Long Beach',
        locomotives:2, railcars:45, totalTEU:90, status:'in_transit',
        departure:'KC Rail Terminal', arrival:'Port of Long Beach', etd:'2024-07-03', eta:'2024-07-06',
        railcars: [
          { id:'RC-001', type:'well-car', containerId:'CONT-2024-002', loaded:true, position:1 },
          { id:'RC-002', type:'well-car', containerId:'', loaded:false, position:2 },
          { id:'RC-003', type:'flatbed', containerId:'CONT-2024-003', loaded:true, position:3 },
        ],
        transitDays:3, notes:'CKD export to Japan via Long Beach'
      },
      {
        id:'TRAIN-002', trainNumber:'NS-441', carrier:'Norfolk Southern', route:'Baltimore → Pittsburgh → Detroit',
        locomotives:1, railcars:28, totalTEU:56, status:'loading',
        departure:'Port of Baltimore', arrival:'Detroit Industrial Yard', etd:'2024-07-08', eta:'2024-07-10',
        railcars: [
          { id:'RC-010', type:'boxcar', containerId:'', loaded:false, position:1 },
          { id:'RC-011', type:'tanker', containerId:'', loaded:true, position:2 },
        ],
        transitDays:2, notes:'Auto parts inbound from port'
      },
    ];

    // Seed pipelines
    state.pipelines = [
      {
        id:'PIPE-001', name:'Baltimore-Houston Fuel Pipeline', type:'fuel', product:'Diesel #2',
        origin:'Port of Baltimore Tank Farm', destination:'Houston Refinery',
        diameter:24, length:1450, pressure:850, flowRate:4200, unit:'bbl/day',
        status:'flowing', utilization:78, lastInspection:'2024-03-15', nextInspection:'2024-09-15',
        stations: [
          { name:'Baltimore Pump Station', location:'Baltimore, MD', pressure:850, status:'active' },
          { name:'Charlotte Booster', location:'Charlotte, NC', pressure:720, status:'active' },
          { name:'Atlanta Junction', location:'Atlanta, GA', pressure:680, status:'active' },
          { name:'Houston Terminal', location:'Houston, TX', pressure:520, status:'active' },
        ],
      },
      {
        id:'PIPE-002', name:'Midwest Auto Parts Slurry', type:'slurry', product:'Paint Slurry (FCA)',
        origin:'Toledo Coating Plant', destination:'SHAP Paint Shop',
        diameter:12, length:85, pressure:340, flowRate:850, unit:'gal/hr',
        status:'flowing', utilization:65, lastInspection:'2024-05-01', nextInspection:'2024-11-01',
        stations: [
          { name:'Toledo Source', location:'Toledo, OH', pressure:340, status:'active' },
          { name:'SHAP Terminal', location:'Sterling Heights, MI', pressure:280, status:'active' },
        ],
      },
    ];
  }

  // ── Package Master CRUD ───────────────────────────────────
  function addPackage(data) {
    var pkg = {
      id: 'PKG-' + String(state.packages.length + 1).padStart(3, '0'),
      code: data.code || 'PKG-NEW',
      name: data.name || 'New Package',
      type: data.type || 'corrugated',
      length: data.length || 12,
      width: data.width || 12,
      height: data.height || 12,
      weight: data.weight || 1,
      maxLoad: data.maxLoad || 25,
      cost: data.cost || 0,
      reusable: data.reusable || false,
      material: data.material || 'corrugated',
      hazardous: data.hazardous || false,
      oemSpec: data.oemSpec || '',
    };
    state.packages.push(pkg);
    return pkg;
  }

  function updatePackage(id, data) {
    var pkg = state.packages.find(function(p) { return p.id === id; });
    if (!pkg) return null;
    Object.assign(pkg, data);
    return pkg;
  }

  function deletePackage(id) {
    var idx = state.packages.findIndex(function(p) { return p.id === id; });
    if (idx === -1) return false;
    state.packages.splice(idx, 1);
    return true;
  }

  // ── Pallet Staging CRUD ───────────────────────────────────
  function addPallet(data) {
    var pal = {
      id: 'PAL-' + String(state.pallets.length + 1).padStart(3, '0'),
      palletNumber: data.palletNumber || 'PAL-' + Date.now().toString().slice(-6),
      type: data.type || 'STD-48x40',
      packageIds: data.packageIds || [],
      totalWeight: data.totalWeight || 0,
      totalPackages: (data.packageIds || []).length,
      status: data.status || 'building',
      destination: data.destination || '',
      cost: data.cost || 22.00,
      buildDate: new Date().toISOString(),
    };
    state.pallets.push(pal);
    return pal;
  }

  function addPackageToPallet(palletId, packageId) {
    var pal = state.pallets.find(function(p) { return p.id === palletId; });
    var pkg = state.packages.find(function(p) { return p.id === packageId; });
    if (!pal || !pkg) return false;
    pal.packageIds.push(packageId);
    pal.totalWeight += pkg.weight;
    pal.totalPackages++;
    return true;
  }

  function stagePallet(palletId, destination) {
    var pal = state.pallets.find(function(p) { return p.id === palletId; });
    if (!pal) return false;
    pal.status = 'staged';
    pal.destination = destination || pal.destination;
    return true;
  }

  // ── CKD Kit CRUD ──────────────────────────────────────────
  function addCKDKit(data) {
    var kit = {
      id: 'CKD-' + String(state.ckdKits.length + 1).padStart(3, '0'),
      kitNumber: data.kitNumber || 'CKD-' + Date.now().toString().slice(-6),
      description: data.description || 'New CKD Kit',
      destination: data.destination || '',
      origin: data.origin || '',
      parts: data.parts || [],
      totalWeight: data.totalWeight || 0,
      totalValue: data.totalValue || 0,
      ckdLevel: data.ckdLevel || 'CKD',
      containerId: data.containerId || '',
      sealNumber: data.sealNumber || '',
      status: data.status || 'building',
      createdAt: new Date().toISOString(),
    };
    state.ckdKits.push(kit);
    return kit;
  }

  function updateCKDKit(id, data) {
    var kit = state.ckdKits.find(function(k) { return k.id === id; });
    if (!kit) return null;
    Object.assign(kit, data);
    return kit;
  }

  // ── Shipment CRUD ─────────────────────────────────────────
  function addShipment(data) {
    var shp = {
      id: 'SHP-' + String(state.shipments.length + 1).padStart(3, '0'),
      shipmentNumber: data.shipmentNumber || 'SHP-' + Date.now().toString().slice(-6),
      mode: data.mode || 'truck',
      origin: data.origin || '',
      originPort: data.originPort || '',
      destination: data.destination || '',
      destinationPort: data.destinationPort || '',
      carrier: data.carrier || '',
      vesselName: data.vesselName || '',
      voyageNumber: data.voyageNumber || '',
      billOfLading: data.billOfLading || '',
      containerNumber: data.containerNumber || '',
      sealNumber: data.sealNumber || '',
      grossWeight: data.grossWeight || 0,
      netWeight: data.netWeight || 0,
      volume: data.volume || 0,
      teu: data.teu || 0,
      incoterm: data.incoterm || 'FCA',
      cargoValue: data.cargoValue || 0,
      freightCost: data.freightCost || 0,
      insuranceCost: data.insuranceCost || 0,
      customsDuty: data.customsDuty || 0,
      handlingCost: data.handlingCost || 0,
      portCharges: data.portCharges || 0,
      totalLanded: 0,
      status: data.status || 'draft',
      etd: data.etd || '',
      eta: data.eta || '',
      actualDeparture: data.actualDeparture || '',
      actualArrival: data.actualArrival || '',
      transitDays: data.transitDays || 0,
      route: data.route || [],
    };
    shp.totalLanded = shp.freightCost + shp.insuranceCost + shp.customsDuty + shp.handlingCost + shp.portCharges + shp.cargoValue;
    state.shipments.push(shp);
    return shp;
  }

  function updateShipment(id, data) {
    var shp = state.shipments.find(function(s) { return s.id === id; });
    if (!shp) return null;
    Object.assign(shp, data);
    shp.totalLanded = shp.freightCost + shp.insuranceCost + shp.customsDuty + shp.handlingCost + shp.portCharges + shp.cargoValue;
    return shp;
  }

  // ── Dry Dock CRUD ─────────────────────────────────────────
  function assignShipmentToDryDock(dockId, shipmentId) {
    var dock = state.dryDocks.find(function(d) { return d.id === dockId; });
    if (!dock) return false;
    if (dock.assignedShipments.length >= dock.capacity) return false;
    dock.assignedShipments.push(shipmentId);
    dock.status = 'occupied';
    return true;
  }

  // ── Cost Analysis ─────────────────────────────────────────
  function getCostSummary() {
    var totalFreight = 0, totalInsurance = 0, totalCustoms = 0, totalHandling = 0, totalPort = 0, totalCargo = 0;
    state.shipments.forEach(function(s) {
      totalFreight += s.freightCost || 0;
      totalInsurance += s.insuranceCost || 0;
      totalCustoms += s.customsDuty || 0;
      totalHandling += s.handlingCost || 0;
      totalPort += s.portCharges || 0;
      totalCargo += s.cargoValue || 0;
    });
    var totalLanded = totalFreight + totalInsurance + totalCustoms + totalHandling + totalPort + totalCargo;
    return {
      shipments: state.shipments.length,
      totalFreight: totalFreight,
      totalInsurance: totalInsurance,
      totalCustoms: totalCustoms,
      totalHandling: totalHandling,
      totalPort: totalPort,
      totalCargo: totalCargo,
      totalLanded: totalLanded,
      avgLandedPerShipment: state.shipments.length > 0 ? Math.round(totalLanded / state.shipments.length) : 0,
      costPerKg: 0,
    };
  }

  function getShipmentCostBreakdown(shipmentId) {
    var shp = state.shipments.find(function(s) { return s.id === shipmentId; });
    if (!shp) return null;
    return [
      { label: 'Cargo Value', amount: shp.cargoValue, percent: shp.totalLanded > 0 ? Math.round((shp.cargoValue / shp.totalLanded) * 100) : 0, color: 'var(--emerald)' },
      { label: 'Freight', amount: shp.freightCost, percent: shp.totalLanded > 0 ? Math.round((shp.freightCost / shp.totalLanded) * 100) : 0, color: 'var(--blue)' },
      { label: 'Insurance', amount: shp.insuranceCost, percent: shp.totalLanded > 0 ? Math.round((shp.insuranceCost / shp.totalLanded) * 100) : 0, color: 'var(--purple)' },
      { label: 'Customs Duty', amount: shp.customsDuty, percent: shp.totalLanded > 0 ? Math.round((shp.customsDuty / shp.totalLanded) * 100) : 0, color: 'var(--yellow)' },
      { label: 'Handling', amount: shp.handlingCost, percent: shp.totalLanded > 0 ? Math.round((shp.handlingCost / shp.totalLanded) * 100) : 0, color: 'var(--orange)' },
      { label: 'Port Charges', amount: shp.portCharges, percent: shp.totalLanded > 0 ? Math.round((shp.portCharges / shp.totalLanded) * 100) : 0, color: 'var(--cyan)' },
      { label: 'TOTAL LANDED', amount: shp.totalLanded, percent: 100, color: 'var(--red)' },
    ];
  }

  function getLogisticsStats() {
    return {
      packages: state.packages.length,
      pallets: state.pallets.length,
      palletsStaged: state.pallets.filter(function(p) { return p.status === 'staged'; }).length,
      ckdKits: state.ckdKits.length,
      shipments: state.shipments.length,
      inTransit: state.shipments.filter(function(s) { return s.status === 'in_transit'; }).length,
      dryDocks: state.dryDocks.length,
      dryDocksAvailable: state.dryDocks.filter(function(d) { return d.status === 'available'; }).length,
      shipyards: state.shipyards.length,
      activeVessels: state.shipyards.reduce(function(sum, sy) { return sum + (sy.vessels || []).length; }, 0),
      trucks: state.trucks.length,
      trucksInTransit: state.trucks.filter(function(t) { return t.status === 'in_transit'; }).length,
      trailers: state.trailers.length,
      railTrains: state.railTrains.length,
      railcars: state.railTrains.reduce(function(sum, t) { return sum + t.railcars.length; }, 0),
      pipelines: state.pipelines.length,
      pipelinesFlowing: state.pipelines.filter(function(p) { return p.status === 'flowing'; }).length,
    };
  }

  return {
    state: state,
    init: init,
    addPackage: addPackage,
    updatePackage: updatePackage,
    deletePackage: deletePackage,
    addPallet: addPallet,
    addPackageToPallet: addPackageToPallet,
    stagePallet: stagePallet,
    addCKDKit: addCKDKit,
    updateCKDKit: updateCKDKit,
    addShipment: addShipment,
    updateShipment: updateShipment,
    assignShipmentToDryDock: assignShipmentToDryDock,
    getCostSummary: getCostSummary,
    getShipmentCostBreakdown: getShipmentCostBreakdown,
    getLogisticsStats: getLogisticsStats,
  };
})();
