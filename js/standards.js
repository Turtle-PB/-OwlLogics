/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Automotive Standards Engine
   - JIS/JIT/Heijunka/Takt time calculations
   - OEM sequencing protocols (CONVIS, ILVS, SPAB, GBLN, GePICS)
   - AIAG B-3/B-10 label standards
   - Returnable container management
   - Milk run logistics
   - CKD/SKD/ISPM-15 compliance
   - Poka-yoke error proofing
   - Lean manufacturing metrics (OEE, FPY, WIP)
   ============================================================ */

var Standards = (function () {

  // ── OEM Sequencing Protocols ──────────────────────────────
  var OEM_PROTOCOLS = {
    CONVIS: {
      name: 'FCA/Stellantis CONVIS',
      oem: 'FCA/Stellantis',
      format: 'pipe-delimited',
      fields: 'PROTOCOL|VIN|SEQ|PART|LINE|OEM|COLOR|DESC|PLANT|MODEL|BODY|ENGINE|TRIM',
      transport: 'TCP socket',
      port: 8192,
      ackRequired: true,
      demandType: 'broadcast',
      description: 'CONVIS (Conveyor Vehicle Information System) — FCA real-time vehicle broadcast via TCP. Each vehicle is broadcast as it passes a sequencing point on the assembly line.'
    },
    ILVS: {
      name: 'GM ILVS',
      oem: 'General Motors',
      format: 'EDI 866',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'EDI over VAN',
      port: null,
      ackRequired: true,
      demandType: 'sequence',
      description: 'ILVS (In-Line Vehicle Sequence) — GM sequencing system. Receives EDI 866 production sequence from GM via VAN (Value-Added Network). Each sequence represents the build order at the GM plant.'
    },
    SPAB: {
      name: 'Ford SPAB',
      oem: 'Ford Motor Co',
      format: 'pipe-delimited',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT|COLOR|TRIM',
      transport: 'TCP socket',
      port: 8100,
      ackRequired: true,
      demandType: 'broadcast',
      description: 'SPAB (Sequence Along Broadcast) — Ford vehicle sequencing broadcast. Ford broadcasts the assembly sequence as vehicles enter the paint shop and final assembly.'
    },
    GBLN: {
      name: 'Toyota GBLN',
      oem: 'Toyota',
      format: 'EDI 866',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'EDI over AS2',
      port: null,
      ackRequired: true,
      demandType: 'sequence',
      description: 'GBLN (Global Broadcast Network) — Toyota global sequencing system. Toyota uses heijunka (leveling) so sequences are smoothed over a time window rather than real-time.'
    },
    GePICS: {
      name: 'BMW GePICS',
      oem: 'BMW',
      format: 'EDI 866',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT|COLOR',
      transport: 'EDI over AS2',
      port: null,
      ackRequired: true,
      demandType: 'sequence',
      description: 'GePICS (Generic Production Information and Control System) — BMW vehicle sequencing. BMW requires parts kitting at the supplier before sequencing to reduce line-side complexity.'
    },
    GALC: {
      name: 'Honda GALC',
      oem: 'Honda',
      format: 'pipe-delimited',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'TCP socket',
      port: 8200,
      ackRequired: true,
      demandType: 'broadcast',
      description: 'GALC (Global Assembly Line Control) — Honda assembly sequencing system.'
    },
    MPAB: {
      name: 'Nissan MPAB',
      oem: 'Nissan',
      format: 'EDI 866',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'EDI over VAN',
      port: null,
      ackRequired: true,
      demandType: 'sequence',
      description: 'MPAB (Master Production Assembly Broadcast) — Nissan sequencing system.'
    },
    SAP_HD: {
      name: 'Harley-Davidson SAP',
      oem: 'Harley-Davidson',
      format: 'SAP IDoc',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'SAP IDoc ORDERS05',
      port: null,
      ackRequired: true,
      demandType: 'sequence',
      description: 'Harley-Davidson uses SAP ERP for JIT manufacturing. Sequencing demand arrives via SAP IDoc ORDERS05 from their SAP system at York PA and Kansas City MO plants.'
    },
    FORD_SQL: {
      name: 'Ford SQL Server Broadcast',
      oem: 'Ford Motor Co',
      format: 'SQL Server file push',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT|COLOR|TRIM|ROTATION',
      transport: 'Windows Server SQL Server → file push',
      port: 1433,
      ackRequired: true,
      demandType: 'broadcast',
      description: 'Ford Kansas City Assembly Plant uses Windows Server with SQL Server to push sequencing files. The SQL Server database stores the build sequence and pushes formatted files to suppliers via file transfer. Each file contains VIN, sequence number, part number, line, model, plant, color, trim, and rotation number. The rotation number links the vehicle to a specific build day and position. Suppliers poll or receive pushed files and must acknowledge receipt.'
    },
    PACCAR: {
      name: 'PACCAR Lean Production Sequence',
      oem: 'PACCAR (Kenworth/Peterbilt/DAF)',
      format: 'EDI 866',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'EDI over VAN',
      port: null,
      ackRequired: true,
      demandType: 'sequence',
      description: 'PACCAR uses EDI 866 Lean Production Sequence for Kenworth, Peterbilt, and DAF truck assembly. Suppliers receive component requirements in actual production build sequence. PACCAR requires EDI for all purchase orders per their implementation guidelines on PACCAR.net. Plants: Kenworth (Renton WA, Chillicothe OH), Peterbilt (Denton TX, Nashville TN), DAF (Eindhoven NL, Westerlo BE).'
    },
    WAP_CONVIS: {
      name: 'Windsor Assembly CONVIS/PFCS',
      oem: 'Stellantis (Windsor)',
      format: 'pipe-delimited + PFCS',
      fields: 'VIN|SEQ|PART|LINE|OEM|MODEL|PLANT|BODY',
      transport: 'WebSphere MQ + TCP',
      port: 8192,
      ackRequired: true,
      demandType: 'broadcast',
      description: 'Windsor Assembly Plant (WAP) in Windsor, Ontario, Canada uses Stellantis CONVIS (Conveyor Vehicle Information System) for vehicle broadcast plus PFCS (Plant Floor Communication System) for delivery sequencing. WAP builds the Chrysler Pacifica and Dodge Grand Caravan. Record types: SP/SR/EP (Modular Build), E/G/F8/F3 (PFCS delivery sequence). SA = auto-acknowledgment. 33+ years of minivan production, 10M+ vehicles built.'
    },
    TESLA_JSON: {
      name: 'Tesla Web JSON',
      oem: 'Tesla',
      format: 'JSON over HTTPS',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'Web API (REST)',
      port: 443,
      ackRequired: false,
      demandType: 'broadcast',
      description: 'Tesla uses modern web-based JSON sequencing via URL API. Plant trigger broadcasts sent as JSON payloads. Plants: Fremont CA, Austin TX, Berlin, Shanghai.'
    },
    NISSAN_XML: {
      name: 'Nissan XML',
      oem: 'Nissan',
      format: 'XML file',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'XML file + email backup',
      port: null,
      ackRequired: true,
      demandType: 'sequence',
      description: 'Nissan uses XML file processing for production and delivery sequences. Email-based backup routing if primary fails. MPAB (Master Production Assembly Broadcast) standard.'
    },
    VW_WSDL: {
      name: 'Volkswagen/Audi WSDL',
      oem: 'Volkswagen/Audi',
      format: 'WSDL web service',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'RSA WSDL web service',
      port: 443,
      ackRequired: true,
      demandType: 'sequence',
      description: 'Volkswagen/Audi uses RSA WSDL library for web-service-based broadcast. Secure web service with RSA authentication.'
    },
    DAIMLER_CSV: {
      name: 'Mercedes/Daimler CSV',
      oem: 'Mercedes-Benz',
      format: 'CSV file',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT|COLOR',
      transport: 'File-based + MBOP',
      port: null,
      ackRequired: true,
      demandType: 'sequence',
      description: 'Mercedes/Daimler uses file-based broadcasts in CSV format. MBOP (Mercedes Benz Order Processor) manages the sequence data.'
    },
    HYUNDAI_TCP: {
      name: 'Hyundai HMMA TCP',
      oem: 'Hyundai',
      format: 'TCP stream',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT|ALC',
      transport: 'TCP with vendor auth',
      port: 8300,
      ackRequired: true,
      demandType: 'broadcast',
      description: 'Hyundai uses TCP with vendor code/password authentication. ALC and Module Code broadcast. HMMA (Hyundai Motor Manufacturing Alabama) plant in Montgomery.'
    },
    KIA_TCP: {
      name: 'Kia KMMG TCP',
      oem: 'Kia',
      format: 'TCP stream',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT|RPC',
      transport: 'TCP with digital bucket',
      port: 8301,
      ackRequired: true,
      demandType: 'broadcast',
      description: 'Kia uses TCP with KMMG Digital Bucket Sequencing protocol. RPC and ALC codes. KMMG (Kia Motors Manufacturing Georgia) plant in West Point GA.'
    },
    JLR_8DM: {
      name: 'Jaguar/Land Rover 8DM',
      oem: 'Jaguar/Land Rover',
      format: '8DM EDI file',
      fields: 'VIN|SEQ|PART|LINE|MODEL|PLANT',
      transport: 'EDI file (8-day message)',
      port: null,
      ackRequired: true,
      demandType: 'sequence',
      description: 'Jaguar/Land Rover uses 8DM eight-day message EDI file. Call-off files vary by site. Plants: Solihull, Castle Bromwich, Halewood.'
    }
  };

  // ── AIAG Label Standards ──────────────────────────────────
  var AIAG_LABELS = {
    'AIAG-B3': {
      name: 'AIAG B-3 Shipping/Parts Identification Label',
      size: '4" x 6" (101.6mm x 152.4mm)',
      format: 'Code 39 (AIAG standard) or Code 128',
      humanReadable: 'Top section — part number, qty, supplier code',
      barcodeFields: ['Part Number', 'Quantity', 'Container ID', 'Supplier Code'],
      maxBarcodes: 4,
      description: 'Standard AIAG B-3 label used for shipping parts to OEM plants. Required by FCA, GM, Ford, Toyota, Honda, BMW.'
    },
    'AIAG-B10': {
      name: 'AIAG B-10 Container Label',
      size: '4" x 4" (101.6mm x 101.6mm)',
      format: 'Code 128 (with FNC1 for GS1-128)',
      humanReadable: 'Part number, quantity, serial',
      barcodeFields: ['Part Number', 'Quantity', 'Serial Number', 'Container Type'],
      maxBarcodes: 4,
      description: 'AIAG B-10 for returnable containers. Includes serial number for container tracking and return management.'
    },
    'AIAG-B17': {
      name: 'AIAG B-17 Small Parts Label',
      size: '4" x 2" (101.6mm x 50.8mm)',
      format: 'Code 128',
      humanReadable: 'Part number, qty',
      barcodeFields: ['Part Number', 'Quantity'],
      maxBarcodes: 2,
      description: 'AIAG B-17 for small parts bins and totes. Compact label with minimal data.'
    },
    'AIAG-B18': {
      name: 'AIAG B-18 Sequence Label',
      size: '4" x 6" (101.6mm x 152.4mm)',
      format: 'Code 128 (2D DataMatrix optional)',
      humanReadable: 'VIN, sequence number, part number, color',
      barcodeFields: ['VIN', 'Sequence Number', 'Part Number', 'Color Code'],
      maxBarcodes: 4,
      description: 'AIAG B-18 sequence label ties a part to a specific vehicle VIN. Required for JIS (Just-In-Sequence) deliveries.'
    },
    'CKD-CUSTOMS': {
      name: 'CKD Export Customs Label',
      size: '4" x 6" (101.6mm x 152.4mm)',
      format: 'Code 128 + GS1-128',
      humanReadable: 'HS code, country of origin, part description, qty, weight',
      barcodeFields: ['Part Number', 'HS Code', 'Quantity', 'Country of Origin', 'Net Weight', 'Gross Weight'],
      maxBarcodes: 6,
      description: 'CKD export customs label for international shipping. Includes HS (Harmonized System) tariff codes and country of origin for customs clearance.'
    }
  };

  // ── Returnable Container Types ─────────────────────────────
  var CONTAINER_TYPES = {
    'RACK-BUMPER': { name: 'Bumper Rack', capacity: 20, returnable: true, deposit: 450, avgLifecycle: 7, oemSpec: 'AIAG-B10 tracked' },
    'RACK-EXHAUST': { name: 'Exhaust Rack', capacity: 15, returnable: true, deposit: 380, avgLifecycle: 7, oemSpec: 'AIAG-B10 tracked' },
    'RACK-SEAT': { name: 'Seat Rack', capacity: 8, returnable: true, deposit: 520, avgLifecycle: 5, oemSpec: 'AIAG-B10 tracked' },
    'RACK-WHEEL': { name: 'Wheel Rack', capacity: 20, returnable: true, deposit: 300, avgLifecycle: 10, oemSpec: 'AIAG-B10 tracked' },
    'RACK-FRAME': { name: 'Frame Rack', capacity: 6, returnable: true, deposit: 800, avgLifecycle: 10, oemSpec: 'Custom HD rack' },
    'RACK-HANDLEBAR': { name: 'Handlebar Rack', capacity: 24, returnable: true, deposit: 250, avgLifecycle: 8, oemSpec: 'AIAG-B10 tracked' },
    'TOTE-KIT': { name: 'Kit Tote', capacity: 1, returnable: true, deposit: 45, avgLifecycle: 3, oemSpec: 'AIAG-B17 small parts' },
    'GAYLORD': { name: 'Gaylord Box', capacity: 1, returnable: false, deposit: 0, avgLifecycle: 1, oemSpec: 'Expendable corrugated' },
    'CHEP-PALLEt': { name: 'CHEP Pallet', capacity: 1, returnable: true, deposit: 15, avgLifecycle: 10, oemSpec: 'Pooled — CHEP tracking' },
    'CONTAINER-20FT': { name: '20ft ISO Container', capacity: 1, returnable: true, deposit: 2500, avgLifecycle: 15, oemSpec: 'ISO-668 standard' },
    'CONTAINER-40FT': { name: '40ft ISO Container', capacity: 1, returnable: true, deposit: 3500, avgLifecycle: 15, oemSpec: 'ISO-668 standard' }
  };

  // ── Lean Manufacturing Metrics ────────────────────────────
  function calculateOEE(availability, performance, quality) {
    if (availability < 0 || availability > 100) return 0;
    if (performance < 0 || performance > 100) return 0;
    if (quality < 0 || quality > 100) return 0;
    return Math.round((availability / 100) * (performance / 100) * (quality / 100) * 1000) / 10;
  }

  function calculateTaktTime(demandUnits, availableTimeSeconds) {
    if (!demandUnits || demandUnits <= 0) return 0;
    if (!availableTimeSeconds || availableTimeSeconds <= 0) return 0;
    return Math.round((availableTimeSeconds / demandUnits) * 10) / 10;
  }

  function calculateCycleTime(processSteps) {
    if (!processSteps || !processSteps.length) return 0;
    var total = 0;
    processSteps.forEach(function(step) { total += step.cycleTime || 0; });
    return total;
  }

  function calculateFPY(goodParts, totalParts) {
    if (!totalParts || totalParts <= 0) return 0;
    return Math.round((goodParts / totalParts) * 1000) / 10;
  }

  function calculateWIP(inflow, outflow, timeWindowMinutes) {
    if (!inflow || !outflow) return 0;
    return Math.round((inflow - outflow) * 10) / 10;
  }

  function calculateHeijunkaVolume(sequences, timeBuckets) {
    if (!sequences || !sequences.length) return [];
    var buckets = new Array(timeBuckets || 8).fill(0);
    sequences.forEach(function(seq) {
      var bucket = Math.floor(Math.random() * buckets.length);
      buckets[bucket]++;
    });
    var avg = sequences.length / buckets.length;
    var variance = buckets.reduce(function(sum, v) { return sum + Math.pow(v - avg, 2); }, 0) / buckets.length;
    var smoothness = avg > 0 ? Math.round((1 - Math.sqrt(variance) / avg) * 1000) / 10 : 0;
    return { buckets: buckets, average: Math.round(avg * 10) / 10, smoothness: smoothness };
  }

  // ── Poka-Yoke Error Proofing ──────────────────────────────
  function pokaYokeCheck(scan, expected) {
    var errors = [];
    var warnings = [];

    if (!scan || !scan.partNumber) {
      errors.push({ type: 'MISSING_PART', message: 'No part number scanned' });
    }

    if (expected && expected.partNumber && scan.partNumber !== expected.partNumber) {
      errors.push({
        type: 'WRONG_PART',
        message: 'Scanned ' + scan.partNumber + ' but expected ' + expected.partNumber,
        scanned: scan.partNumber,
        expected: expected.partNumber
      });
    }

    if (expected && expected.slotPosition && scan.slotPosition && scan.slotPosition !== expected.slotPosition) {
      errors.push({
        type: 'WRONG_SLOT',
        message: 'Scanned for slot ' + scan.slotPosition + ' but expected slot ' + expected.slotPosition,
        scanned: scan.slotPosition,
        expected: expected.slotPosition
      });
    }

    if (expected && expected.sequenceNumber && scan.sequenceNumber && scan.sequenceNumber !== expected.sequenceNumber) {
      errors.push({
        type: 'OUT_OF_SEQUENCE',
        message: 'Scanned sequence ' + scan.sequenceNumber + ' but expected ' + expected.sequenceNumber,
        scanned: scan.sequenceNumber,
        expected: expected.sequenceNumber
      });
    }

    if (expected && expected.colorCode && scan.colorCode && scan.colorCode !== expected.colorCode) {
      warnings.push({
        type: 'COLOR_MISMATCH',
        message: 'Color ' + scan.colorCode + ' does not match expected ' + expected.colorCode
      });
    }

    if (expected && expected.rackId && scan.rackId && scan.rackId !== expected.rackId) {
      errors.push({
        type: 'WRONG_RACK',
        message: 'Scanned for rack ' + scan.rackId + ' but current rack is ' + expected.rackId
      });
    }

    return {
      passed: errors.length === 0,
      errors: errors,
      warnings: warnings,
      severity: errors.length > 0 ? 'ERROR' : (warnings.length > 0 ? 'WARNING' : 'OK')
    };
  }

  // ── Milk Run Logistics ────────────────────────────────────
  function calculateMilkRun(stops, cycleTimeMinutes, trolleyCapacity) {
    if (!stops || !stops.length) return null;

    var totalParts = 0;
    var totalDistance = 0;
    stops.forEach(function(stop) {
      totalParts += stop.partCount || 0;
      totalDistance += stop.distance || 0;
    });

    var tripsNeeded = Math.ceil(totalParts / (trolleyCapacity || 50));
    var totalCycleTime = tripsNeeded * cycleTimeMinutes;
    var utilization = Math.round((totalParts / (tripsNeeded * (trolleyCapacity || 50))) * 1000) / 10;

    return {
      stops: stops.length,
      totalParts: totalParts,
      totalDistance: Math.round(totalDistance * 10) / 10,
      tripsNeeded: tripsNeeded,
      cycleTimeMinutes: cycleTimeMinutes,
      totalCycleTime: totalCycleTime,
      trolleyCapacity: trolleyCapacity || 50,
      utilization: utilization,
      partsPerMinute: Math.round((totalParts / totalCycleTime) * 10) / 10
    };
  }

  // ── Kit Completeness Verification ─────────────────────────
  function verifyKitComplete(kit) {
    if (!kit || !kit.components) return { complete: false, missing: ['No components defined'] };

    var missing = [];
    var scanned = 0;
    var total = kit.components.length;

    kit.components.forEach(function(comp) {
      if (comp.scanned && comp.scanned === true) {
        scanned++;
      } else {
        missing.push(comp.partNumber || comp.name || 'Unknown component');
      }
    });

    return {
      complete: missing.length === 0,
      total: total,
      scanned: scanned,
      missing: missing,
      completeness: total > 0 ? Math.round((scanned / total) * 1000) / 10 : 0
    };
  }

  // ── CKD/SKD Compliance ────────────────────────────────────
  var CKD_HS_CODES = {
    '8708.10': 'Bumpers and parts thereof',
    '8708.21': 'Brake system parts',
    '8708.29': 'Other parts and accessories',
    '8708.31': 'Brake linings',
    '8708.39': 'Brake system parts',
    '8708.40': 'Gearbox parts',
    '8708.50': 'Drive axle parts',
    '8708.60': 'Drive axle parts',
    '8708.70': 'Road wheels',
    '8708.80': 'Suspension system parts',
    '8708.91': 'Radiator parts',
    '8708.92': 'Silencer/exhaust parts',
    '8708.93': 'Clutch parts',
    '8708.94': 'Steering system parts',
    '8708.95': 'Safety seat belts',
    '8714.10': 'Motorcycle parts (HD)'
  };

  var ISPM15_REQUIREMENTS = {
    stamp: 'IPPC mark — HT (heat treated) or MB (methyl bromide)',
    format: 'Stamp on 2 opposite sides of wood packaging',
    exempt: ['Plywood', 'OSB', 'Particle board', 'Veneer < 6mm'],
    countries: 'All ISPM-15 signatory countries (180+)',
    description: 'ISPM-15 (International Standards for Phytosanitary Measures No. 15) requires heat treatment or fumigation of solid wood packaging material used in international trade. Non-compliant shipments are rejected at customs.'
  };

  // ── JIS vs JIT comparison ─────────────────────────────────
  var JIS_JIT_COMPARISON = {
    JIT: {
      name: 'Just-In-Time',
      principle: 'Deliver parts at the right time, in the right quantity',
      inventory: 'Minimal buffer stock',
      sequence: 'Not sequence-dependent',
      risk: 'Line stoppage if delivery is late',
      bestFor: 'High-volume, stable-mix production'
    },
    JIS: {
      name: 'Just-In-Sequence',
      principle: 'Deliver parts in the exact order they are consumed on the line',
      inventory: 'Zero buffer — parts go directly to line-side',
      sequence: 'Sequence-critical — parts must match vehicle build order',
      risk: 'Line stoppage if sequence is wrong or delivery is late',
      bestFor: 'High-mix, custom-ordered vehicles (luxury, HD, color-dependent)'
    }
  };

  // ── Public API ────────────────────────────────────────────
  return {
    OEM_PROTOCOLS: OEM_PROTOCOLS,
    AIAG_LABELS: AIAG_LABELS,
    CONTAINER_TYPES: CONTAINER_TYPES,
    CKD_HS_CODES: CKD_HS_CODES,
    ISPM15_REQUIREMENTS: ISPM15_REQUIREMENTS,
    JIS_JIT_COMPARISON: JIS_JIT_COMPARISON,
    calculateOEE: calculateOEE,
    calculateTaktTime: calculateTaktTime,
    calculateCycleTime: calculateCycleTime,
    calculateFPY: calculateFPY,
    calculateWIP: calculateWIP,
    calculateHeijunkaVolume: calculateHeijunkaVolume,
    pokaYokeCheck: pokaYokeCheck,
    calculateMilkRun: calculateMilkRun,
    verifyKitComplete: verifyKitComplete,
  };
})();
