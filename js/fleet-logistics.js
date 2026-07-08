/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Fleet Logistics & Packaging Engine
   - GPS trailer tracking (iPad/Geolocation API)
   - BOL (Bill of Lading) generator for milk runs
   - 3D trailer load optimization (cube, weight, dunnage)
   - Packaging cost calculator (bubble wrap, stretch wrap, pallets)
   - DOT weight compliance (53ft trailer, axle limits)
   - CKD warehouse retrieval (scan → pick → POD → package)
   ============================================================ */

var FleetLogistics = (function () {

  var state = {
    trailers: [],
    bolForms: [],
    loadPlans: [],
    packagingCosts: [],
    ckdRetrievals: [],
    gpsTracking: false,
    gpsWatchId: null,
    geofences: []
  };

  // ── GPS Trailer Tracking ───────────────────────────────────

  function initGPS() {
    // Seed demo trailers with GPS positions
    if (state.trailers.length > 0) return;
    state.trailers = [
      {
        id: 'TLR-001', unitNumber: 'TRL-1043', type: '53ft Dry Van',
        carrier: 'J.B. Hunt', driver: 'Mike R.', currentLocation: 'I-70 Mile 142, KS',
        lat: 38.9517, lng: -94.7244, heading: 'East', speed: 62,
        destination: 'SHAP - Sterling Heights, MI', eta: '6h 30m',
        status: 'in_transit', cargo: 'Sequenced Bumpers (20 racks)',
        weight: 38500, maxWeight: 45000, trailerTemp: null,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'TLR-002', unitNumber: 'TRL-2207', type: '53ft Reefer',
        carrier: 'Schneider', driver: 'Sarah K.', currentLocation: 'I-75 Mile 89, OH',
        lat: 40.4173, lng: -84.0114, heading: 'North', speed: 58,
        destination: 'JNAP - Detroit, MI', eta: '2h 15m',
        status: 'in_transit', cargo: 'Painted Fascias (temp-controlled)',
        weight: 31200, maxWeight: 45000, trailerTemp: 68,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'TLR-003', unitNumber: 'TRL-3301', type: '53ft Flatbed',
        carrier: 'Werner', driver: 'Tom B.', currentLocation: 'Dock 12 - Kansas City',
        lat: 39.0997, lng: -94.5786, heading: 'Parked', speed: 0,
        destination: 'Windsor Assembly - Windsor, ON', eta: 'Loading',
        status: 'loading', cargo: 'Engine Cradles (HD)',
        weight: 0, maxWeight: 45000, trailerTemp: null,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'TLR-004', unitNumber: 'TRL-4456', type: '40ft Container Chassis',
        carrier: 'Prime Inc', driver: 'Lisa M.', currentLocation: 'Port of Long Beach',
        lat: 33.7542, lng: -118.2167, heading: 'Parked', speed: 0,
        destination: 'Torrance DC', eta: 'At Port',
        status: 'at_dock', cargo: 'CKD Import - Hamburg',
        weight: 42100, maxWeight: 45000, trailerTemp: null,
        lastUpdate: new Date().toISOString()
      }
    ];

    // Geofences
    state.geofences = [
      { id: 'GF-001', name: 'SHAP - Sterling Heights', lat: 42.5772, lng: -83.0750, radius: 500, type: 'oem_plant' },
      { id: 'GF-002', name: 'JNAP - Detroit', lat: 42.3759, lng: -83.0971, radius: 500, type: 'oem_plant' },
      { id: 'GF-003', name: 'Windsor Assembly', lat: 42.3007, lng: -83.0388, radius: 500, type: 'oem_plant' },
      { id: 'GF-004', name: 'Port of Long Beach', lat: 33.7542, lng: -118.2167, radius: 1000, type: 'port' },
      { id: 'GF-005', name: 'Kansas City DC', lat: 39.0997, lng: -94.5786, radius: 300, type: 'warehouse' }
    ];
  }

  function startGPSTracking() {
    if (state.gpsTracking) return;
    state.gpsTracking = true;

    // Use Geolocation API if available (iPad/mobile)
    if (navigator.geolocation) {
      state.gpsWatchId = navigator.geolocation.watchPosition(
        function(pos) {
          // Update local device position
          state.deviceLat = pos.coords.latitude;
          state.deviceLng = pos.coords.longitude;
          state.deviceAccuracy = pos.coords.accuracy;
        },
        function(err) {
          console.log('GPS error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    // Simulate trailer movement
    state.simInterval = setInterval(function() {
      state.trailers.forEach(function(t) {
        if (t.status === 'in_transit' && t.speed > 0) {
          // Move trailer toward destination
          var speedDeg = t.speed * 0.00001;
          var destLat = t.destLat || 42.5772;
          var destLng = t.destLng || -83.0750;
          var dLat = (destLat - t.lat) * 0.05;
          var dLng = (destLng - t.lng) * 0.05;
          t.lat += dLat * speedDeg * 100;
          t.lng += dLng * speedDeg * 100;
          t.lastUpdate = new Date().toISOString();
        }
      });
      // Check geofences
      checkGeofences();
    }, 3000);
  }

  function stopGPSTracking() {
    state.gpsTracking = false;
    if (state.gpsWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(state.gpsWatchId);
      state.gpsWatchId = null;
    }
    if (state.simInterval) clearInterval(state.simInterval);
  }

  function checkGeofences() {
    state.trailers.forEach(function(t) {
      state.geofences.forEach(function(gf) {
        var dist = calculateDistance(t.lat, t.lng, gf.lat, gf.lng);
        if (dist < gf.radius && t.geofence !== gf.id) {
          t.geofence = gf.id;
          t.geofenceName = gf.name;
          // Auto-update status when entering geofence
          if (gf.type === 'oem_plant') {
            t.status = 'arrived';
            t.speed = 0;
            t.heading = 'Arrived at ' + gf.name;
          } else if (gf.type === 'port') {
            t.status = 'at_port';
          } else if (gf.type === 'warehouse') {
            t.status = 'at_dock';
          }
        }
      });
    });
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    var R = 6371000; // Earth radius in meters
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // ── BOL (Bill of Lading) Generator ─────────────────────────

  function generateBOL(milkRunStops, trailerId, driver, carrier) {
    var bolNumber = 'BOL-' + Date.now().toString().slice(-8);
    var today = new Date();
    var dateStr = today.toISOString().split('T')[0];

    var totalPieces = 0;
    var totalWeight = 0;
    var lineItems = [];

    milkRunStops.forEach(function(stop, idx) {
      var pieces = stop.partCount || 0;
      var weight = stop.weight || (pieces * 45);
      totalPieces += pieces;
      totalWeight += weight;

      lineItems.push({
        stopNumber: idx + 1,
        stopName: stop.name || 'Stop ' + (idx + 1),
        partDescription: stop.description || 'Automotive Parts',
        pieces: pieces,
        weight: weight,
        weightUnit: 'lbs',
        classCode: stop.classCode || '70',
        nmfc: stop.nmfc || 'auto-parts-sequenced',
        handlingUnits: stop.handlingUnits || 1,
        packagingType: stop.packagingType || 'Rack'
      });
    });

    return {
      bolNumber: bolNumber,
      date: dateStr,
      carrier: carrier || 'Common Carrier',
      trailerId: trailerId || 'TLR-001',
      driver: driver || 'TBD',
      shipper: {
        name: 'OwlLogics Sequencing Center',
        address: '1425 Industrial Blvd',
        city: 'Auburn Hills', state: 'MI', zip: '48326'
      },
      consignee: {
        name: 'OEM Assembly Plant',
        address: 'Plant Dock Door',
        city: 'Sterling Heights', state: 'MI', zip: '48310'
      },
      lineItems: lineItems,
      totalPieces: totalPieces,
      totalWeight: totalWeight,
      weightUnit: 'lbs',
      freightClass: '70',
      specialInstructions: 'SEQUENCED LOAD - DO NOT RESEQUENCE. Rack order must be maintained. Driver must call 30 min before arrival.',
      hazmat: false,
      temperatureControlled: false,
      signatures: {
        shipper: '',
        driver: '',
        consignee: ''
      },
      stops: milkRunStops.length,
      status: 'draft'
    };
  }

  // ── Trailer Load Optimization ──────────────────────────────

  var TRAILER_DIMENSIONS = {
    '53FT_DRY_VAN': { length: 624, width: 102, height: 110, maxWeight: 45000, maxCube: 3816, doorHeight: 105, doorWidth: 96 },
    '53FT_REEFER': { length: 624, width: 102, height: 102, maxWeight: 44000, maxCube: 3530, doorHeight: 98, doorWidth: 96 },
    '53FT_FLATBED': { length: 624, width: 102, height: 102, maxWeight: 48000, maxCube: 3360, doorHeight: 0, doorWidth: 0 },
    '40FT_CONTAINER': { length: 480, width: 96, height: 96, maxWeight: 44000, maxCube: 2746, doorHeight: 90, doorWidth: 92 },
    '20FT_CONTAINER': { length: 240, width: 96, height: 96, maxWeight: 44000, maxCube: 1373, doorHeight: 90, doorWidth: 92 }
  };

  function optimizeTrailerLoad(items, trailerType) {
    var dims = TRAILER_DIMENSIONS[trailerType] || TRAILER_DIMENSIONS['53FT_DRY_VAN'];

    var totalWeight = 0;
    var totalCube = 0;
    var totalFloorSpace = 0;

    var placed = [];
    var unplaced = [];

    // Sort by weight (heaviest at bottom/front for axle compliance)
    var sorted = items.slice().sort(function(a, b) {
      return (b.weight || 0) - (a.weight || 0);
    });

    var currentX = 0;
    var currentY = 0;
    var currentZ = 0;
    var rowHeight = 0;

    sorted.forEach(function(item) {
      var itemLen = item.length || 48;
      var itemWid = item.width || 48;
      var itemHgt = item.height || 48;
      var itemWeight = item.weight || 100;
      var itemCube = itemLen * itemWid * itemHgt / 1728;

      // Check if item fits
      if (currentX + itemWid > dims.width) {
        currentX = 0;
        currentY += rowHeight + 2;
        rowHeight = 0;
      }

      if (currentY + itemLen > dims.length) {
        // Doesn't fit in this row — try stacking
        if (currentZ + itemHgt > dims.height) {
          unplaced.push(item);
          return;
        }
        currentZ += rowHeight + 2;
        currentY = 0;
        currentX = 0;
      }

      totalWeight += itemWeight;
      totalCube += itemCube;
      totalFloorSpace += (itemWid * itemLen) / 1728;

      // Check weight limit
      if (totalWeight > dims.maxWeight) {
        unplaced.push(item);
        totalWeight -= itemWeight;
        return;
      }

      placed.push({
        name: item.name || 'Item',
        x: currentX, y: currentY, z: currentZ,
        width: itemWid, length: itemLen, height: itemHgt,
        weight: itemWeight,
        cube: itemCube,
        position: 'Row ' + Math.floor(currentY / 50 + 1) + ', Stack ' + Math.floor(currentZ / 50 + 1)
      });

      currentX += itemWid + 1;
      rowHeight = Math.max(rowHeight, itemHgt);
    });

    var cubeUtilization = Math.round((totalCube / dims.maxCube) * 1000) / 10;
    var weightUtilization = Math.round((totalWeight / dims.maxWeight) * 1000) / 10;
    var floorUtilization = Math.round((totalFloorSpace / (dims.length * dims.width / 1728)) * 1000) / 10;

    // Dunnage recommendations
    var dunnage = generateDunnagePlan(placed, trailerType);

    return {
      trailerType: trailerType,
      dimensions: dims,
      placed: placed,
      unplaced: unplaced,
      totalWeight: totalWeight,
      totalCube: totalCube,
      cubeUtilization: cubeUtilization,
      weightUtilization: weightUtilization,
      floorUtilization: floorUtilization,
      axleCompliance: checkAxleCompliance(totalWeight, trailerType),
      dunnage: dunnage
    };
  }

  function generateDunnagePlan(placed, trailerType) {
    var items = [];
    var totalCost = 0;

    // Air bags for void fill
    var voids = Math.ceil(placed.length / 4);
    items.push({ type: 'Air Bag', quantity: voids, unitCost: 8.50, purpose: 'Void fill between racks', totalCost: voids * 8.50 });
    totalCost += voids * 8.50;

    // Load locks (metal bars)
    var locks = Math.ceil(placed.length / 6);
    items.push({ type: 'Load Lock Bar', quantity: locks, unitCost: 45.00, purpose: 'Horizontal securing', totalCost: locks * 45.00 });
    totalCost += locks * 45.00;

    // E-track straps
    items.push({ type: 'E-Track Strap', quantity: 4, unitCost: 22.00, purpose: 'Vertical tie-down', totalCost: 88.00 });
    totalCost += 88.00;

    // Edge protectors
    items.push({ type: 'Edge Protector', quantity: Math.ceil(placed.length / 3), unitCost: 1.50, purpose: 'Strap edge protection', totalCost: Math.ceil(placed.length / 3) * 1.50 });
    totalCost += Math.ceil(placed.length / 3) * 1.50;

    return { items: items, totalCost: Math.round(totalCost * 100) / 100 };
  }

  function checkAxleCompliance(totalWeight, trailerType) {
    // DOT weight limits (US federal)
    var STEER_AXLE = 12000;      // 12,000 lbs
    var DRIVE_AXLE = 34000;      // 34,000 lbs (tandem)
    var TRAILER_AXLE = 34000;    // 34,000 lbs (tandem)
    var GROSS_MAX = 80000;       // 80,000 lbs total

    var steerPct = 0.12;
    var drivePct = 0.44;
    var trailerPct = 0.44;

    var steerWeight = Math.round(totalWeight * steerPct);
    var driveWeight = Math.round(totalWeight * drivePct);
    var trailerW = Math.round(totalWeight * trailerPct);

    return {
      steerAxle: { weight: steerWeight, limit: STEER_AXLE, compliant: steerWeight <= STEER_AXLE },
      driveAxle: { weight: driveWeight, limit: DRIVE_AXLE, compliant: driveWeight <= DRIVE_AXLE },
      trailerAxle: { weight: trailerW, limit: TRAILER_AXLE, compliant: trailerW <= TRAILER_AXLE },
      grossWeight: { weight: totalWeight, limit: GROSS_MAX, compliant: totalWeight <= GROSS_MAX },
      overall: (steerWeight <= STEER_AXLE && driveWeight <= DRIVE_AXLE && trailerW <= TRAILER_AXLE && totalWeight <= GROSS_MAX),
      violations: generateViolations(steerWeight, driveWeight, trailerW, totalWeight, STEER_AXLE, DRIVE_AXLE, TRAILER_AXLE, GROSS_MAX)
    };
  }

  function generateViolations(sw, dw, tw, gw, sl, dl, tl, gl) {
    var v = [];
    if (sw > sl) v.push('Steer axle overweight: ' + sw + ' lbs (limit ' + sl + ')');
    if (dw > dl) v.push('Drive axle overweight: ' + dw + ' lbs (limit ' + dl + ')');
    if (tw > tl) v.push('Trailer axle overweight: ' + tw + ' lbs (limit ' + tl + ')');
    if (gw > gl) v.push('Gross vehicle overweight: ' + gw + ' lbs (limit ' + gl + ')');
    return v;
  }

  // ── Packaging Cost Calculator ──────────────────────────────

  var PACKAGING_MATERIALS = {
    'BUBBLE_WRAP': { name: 'Bubble Wrap (12" x 100ft roll)', unitCost: 28.00, unit: 'roll', coverageSqFt: 100 },
    'STRETCH_WRAP': { name: 'Stretch Wrap (18" x 1500ft roll)', unitCost: 15.00, unit: 'roll', coverageSqFt: 500 },
    'FOAM_SHEET': { name: 'Foam Sheet (1/8" x 48" x 50ft)', unitCost: 42.00, unit: 'roll', coverageSqFt: 200 },
    'CORRUGATED_BOX': { name: 'Corrugated Box (24x18x18)', unitCost: 3.50, unit: 'each', coverageSqFt: 0 },
    'EDGE_BOARD': { name: 'Edge Board (4" x 96")', unitCost: 1.20, unit: 'each', coverageSqFt: 0 },
    'WOOD_PALLET': { name: 'Wood Pallet (48x40 GMA)', unitCost: 15.00, unit: 'each', coverageSqFt: 0 },
    'CHEP_PALLET': { name: 'CHEP Pallet (48x40 Pooled)', unitCost: 0.05, unit: 'day (lease)', coverageSqFt: 0 },
    'DUNNAGE_BAG': { name: 'Dunnage Air Bag (36x36)', unitCost: 8.50, unit: 'each', coverageSqFt: 0 },
    'SHRINK_BAG': { name: 'Shrink Bag (40x40x48)', unitCost: 2.25, unit: 'each', coverageSqFt: 0 },
    'PACKING_TAPE': { name: 'Packing Tape (2" x 110yd)', unitCost: 4.50, unit: 'roll', coverageSqFt: 0 },
    'LABEL_STOCK': { name: 'Thermal Label (4x6)', unitCost: 0.08, unit: 'each', coverageSqFt: 0 },
    'ZIP_TIES': { name: 'Zip Ties (100 pack)', unitCost: 5.00, unit: 'pack', coverageSqFt: 0 }
  };

  function calculatePackagingCost(packagePlan) {
    var lineItems = [];
    var totalCost = 0;

    packagePlan.forEach(function(item) {
      var material = PACKAGING_MATERIALS[item.materialType];
      if (!material) return;

      var qty = item.quantity || 1;
      var cost = qty * material.unitCost;
      totalCost += cost;

      lineItems.push({
        material: item.materialType,
        name: material.name,
        quantity: qty,
        unit: material.unit,
        unitCost: material.unitCost,
        totalCost: Math.round(cost * 100) / 100,
        purpose: item.purpose || ''
      });
    });

    return {
      lineItems: lineItems,
      totalCost: Math.round(totalCost * 100) / 100,
      totalItems: lineItems.length
    };
  }

  // ── CKD Warehouse Retrieval Module ─────────────────────────
  // Scan → Pick → Deliver to POD → Package (different from sequencing)

  function initCKDRetrieval() {
    if (state.ckdRetrievals.length > 0) return;
    state.ckdRetrievals = [
      {
        id: 'CKD-R-001', kitId: 'CKD-001', status: 'retrieved',
        warehouseLocation: 'A-12-03-B', partNumber: '58000-10',
        description: 'Touring Frame Assembly', quantity: 1,
        scannedBy: 'Operator 1', scanTime: new Date(Date.now() - 3600000).toISOString(),
        podLocation: 'POD-03', podTime: new Date(Date.now() - 2400000).toISOString(),
        packagedBy: 'Packager 1', packageTime: new Date(Date.now() - 1200000).toISOString(),
        packageType: 'CKD Export Crate', weight: 185, destination: 'Hamburg'
      },
      {
        id: 'CKD-R-002', kitId: 'CKD-002', status: 'at_pod',
        warehouseLocation: 'B-05-01-A', partNumber: '17000-10',
        description: 'Milwaukee-Eight 114 Engine', quantity: 1,
        scannedBy: 'Operator 2', scanTime: new Date(Date.now() - 1800000).toISOString(),
        podLocation: 'POD-02', podTime: new Date().toISOString(),
        packagedBy: null, packageTime: null,
        packageType: null, weight: 0, destination: 'Yokohama'
      },
      {
        id: 'CKD-R-003', kitId: 'CKD-003', status: 'scanned',
        warehouseLocation: 'C-08-02-D', partNumber: '61400-10',
        description: 'Fuel Tank - Vivid Black', quantity: 2,
        scannedBy: 'Operator 3', scanTime: new Date().toISOString(),
        podLocation: null, podTime: null,
        packagedBy: null, packageTime: null,
        packageType: null, weight: 0, destination: 'Hamburg'
      }
    ];
  }

  // CKD Retrieval Workflow: scan → pick → deliver_to_pod → package → ship
  // Different from sequencing because it's warehouse-to-POD, not line-side delivery

  function createCKDRetrieval(data) {
    var r = {
      id: 'CKD-R-' + String(state.ckdRetrievals.length + 1).padStart(3, '0'),
      kitId: data.kitId || '',
      status: 'scanned',
      warehouseLocation: data.warehouseLocation || '',
      partNumber: data.partNumber || '',
      description: data.description || '',
      quantity: data.quantity || 1,
      scannedBy: data.scannedBy || 'Unknown',
      scanTime: new Date().toISOString(),
      podLocation: null, podTime: null,
      packagedBy: null, packageTime: null,
      packageType: null, weight: 0,
      destination: data.destination || ''
    };
    state.ckdRetrievals.push(r);
    return r;
  }

  function advanceCKDRetrieval(id, step, data) {
    var r = state.ckdRetrievals.find(function(x) { return x.id === id; });
    if (!r) return null;

    if (step === 'deliver_to_pod') {
      r.podLocation = (data && data.podLocation) || 'POD-01';
      r.podTime = new Date().toISOString();
      r.status = 'at_pod';
    } else if (step === 'package') {
      r.packagedBy = (data && data.packagedBy) || 'Packager';
      r.packageTime = new Date().toISOString();
      r.packageType = (data && data.packageType) || 'CKD Export Crate';
      r.weight = (data && data.weight) || 0;
      r.status = 'packaged';
    } else if (step === 'ship') {
      r.status = 'shipped';
      r.shipTime = new Date().toISOString();
    }
    return r;
  }

  function getCKDRetrievalStats() {
    var s = { total: state.ckdRetrievals.length, scanned: 0, at_pod: 0, packaged: 0, shipped: 0 };
    state.ckdRetrievals.forEach(function(r) {
      if (s[r.status] !== undefined) s[r.status]++;
    });
    return s;
  }

  // ── Public API ────────────────────────────────────────────
  return {
    state: state,
    TRAILER_DIMENSIONS: TRAILER_DIMENSIONS,
    PACKAGING_MATERIALS: PACKAGING_MATERIALS,
    initGPS: initGPS,
    startGPSTracking: startGPSTracking,
    stopGPSTracking: stopGPSTracking,
    calculateDistance: calculateDistance,
    generateBOL: generateBOL,
    optimizeTrailerLoad: optimizeTrailerLoad,
    generateDunnagePlan: generateDunnagePlan,
    checkAxleCompliance: checkAxleCompliance,
    calculatePackagingCost: calculatePackagingCost,
    initCKDRetrieval: initCKDRetrieval,
    createCKDRetrieval: createCKDRetrieval,
    advanceCKDRetrieval: advanceCKDRetrieval,
    getCKDRetrievalStats: getCKDRetrievalStats,
  };
})();
