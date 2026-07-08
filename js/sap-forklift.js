/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved - Patent Pending
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics SAP PM Integration for Forklift Fleet
   ============================================================ */

var SapForklift = (function () {

  // ── SAP PM Order Types ────────────────────────────────────
  var PM_ORDER_TYPES = {
    PM01: 'Preventive Maintenance',
    PM02: 'Corrective Maintenance',
    PM03: 'Repair',
    PM04: 'Inspection',
    PM05: 'Calibration',
  };

  // ── SAP System Status Codes ───────────────────────────────
  var SAP_STATUS = {
    CRTD: 'Created',
    REL:  'Released',
    PCNF: 'Partially Confirmed',
    CNF:  'Confirmed',
    TECO: 'Technically Completed',
    CLSD: 'Closed',
  };

  // ── Simulated BAPI: Create Equipment ──────────────────────
  // Simulates BAPI_EQUI_CREATE (BAPI_EQUI_INSTALL)
  function createEquipment(forklift) {
    var equipNum = '10000' + String(Math.floor(Math.random() * 90000) + 10000);
    var funcLoc = generateFunctionalLocation(forklift);

    var equipData = {
      bapi: 'BAPI_EQUI_CREATE',
      equipment: equipNum,
      equipmentCategory: forklift.sapEquipmentCategory || 'F',
      description: forklift.brand + ' ' + forklift.model + ' ' + forklift.unitNumber,
      objectStatus: forklift.sapObjectStatus || 'INST',
      manufacturer: (forklift.sapManufacturer || forklift.brand).toUpperCase(),
      modelNumber: forklift.sapModelNumber || forklift.model,
      serialNumber: forklift.serialNumber,
      constructionYear: forklift.sapConstructionYear || new Date().getFullYear().toString(),
      constructionMonth: forklift.sapConstructionMonth || '01',
      startupDate: forklift.sapStartupDate || new Date().toISOString().slice(0, 10),
      functionalLocation: funcLoc,
      maintenancePlant: forklift.sapMaintenancePlant || forklift.sapPlant || '1000',
      planningPlant: forklift.sapPlanningPlant || forklift.sapPlant || '1000',
      costCenter: forklift.sapCostCenter || '',
      workCenter: forklift.sapWorkCenter || '',
      companyCode: forklift.sapCompanyCode || '1000',
      abcIndicator: forklift.sapAbcIndicator || 'B',
      sortField: forklift.sapSortField || forklift.unitNumber,
      warrantyEnd: forklift.sapWarrantyEnd || '',
      capacity: forklift.capacity,
      powerSource: forklift.powerSource,
      success: true,
      message: 'Equipment ' + equipNum + ' created successfully',
      timestamp: new Date().toISOString(),
    };

    return equipData;
  }

  // ── Generate Functional Location ──────────────────────────
  // SAP func loc format: PLANT-BLDG-AREA-EQUIP-TYPE
  function generateFunctionalLocation(forklift) {
    var loc = forklift.currentLocation || '';
    var bldg = 'X';
    if (loc.indexOf('Bldg A') >= 0) bldg = 'A';
    else if (loc.indexOf('Bldg B') >= 0) bldg = 'B';
    else if (loc.indexOf('Bldg C') >= 0) bldg = 'C';
    else if (loc.indexOf('Bldg D') >= 0) bldg = 'D';
    else if (loc.indexOf('Bldg E') >= 0) bldg = 'E';
    else if (loc.indexOf('Maint') >= 0) bldg = 'M';

    var area = 'WHS';
    if (loc.indexOf('Sequencing') >= 0) area = 'SEQ';
    else if (loc.indexOf('Staging') >= 0) area = 'STG';
    else if (loc.indexOf('Dock') >= 0) area = 'DCK';
    else if (loc.indexOf('Kitting') >= 0) area = 'KIT';
    else if (loc.indexOf('Maint') >= 0) area = 'MNT';

    var plant = forklift.sapPlant || '1000';
    var seq = String(forklift.id.split('-')[1] || '001').padStart(3, '0');

    return plant + '-' + bldg + '-' + area + '-' + seq;
  }

  // ── Simulated BAPI: Create PM Order ───────────────────────
  // Simulates BAPI_ALM_ORDER_MAINTAIN
  function createPmOrder(forklift, orderType, description, priority) {
    var orderNum = '4000' + String(Math.floor(Math.random() * 9000) + 1000);

    var orderData = {
      bapi: 'BAPI_ALM_ORDER_MAINTAIN',
      orderNumber: orderNum,
      orderType: orderType || 'PM01',
      orderTypeName: PM_ORDER_TYPES[orderType] || 'Preventive Maintenance',
      description: description || (orderType === 'PM01' ? 'Scheduled A-service' : 'Maintenance order'),
      equipment: forklift.sapEquipmentNumber || '',
      functionalLocation: forklift.sapFunctionalLocation || '',
      workCenter: forklift.sapWorkCenter || 'WC-MAINT-01',
      plant: forklift.sapMaintenancePlant || forklift.sapPlant || '1000',
      costCenter: forklift.sapCostCenter || '',
      priority: priority || 'MEDIUM',
      status: 'CRTD',
      statusName: SAP_STATUS.CRTD,
      plannedStartDate: new Date().toISOString().slice(0, 10),
      plannedFinishDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      actualStartDate: '',
      actualFinishDate: '',
      estimatedHours: orderType === 'PM01' ? 4 : orderType === 'PM02' ? 8 : 16,
      estimatedCost: orderType === 'PM01' ? 450 : orderType === 'PM02' ? 1200 : 3500,
      operations: generateOperations(orderType),
      components: generateComponents(forklift, orderType),
      success: true,
      message: 'PM Order ' + orderNum + ' created (' + (PM_ORDER_TYPES[orderType] || 'PM01') + ')',
      timestamp: new Date().toISOString(),
    };

    return orderData;
  }

  // ── Generate PM Order Operations ──────────────────────────
  function generateOperations(orderType) {
    if (orderType === 'PM01') {
      return [
        { opNum: '0010', controlKey: 'PM01', description: 'Inspect mast and chains', duration: 1, workCenter: 'WC-MAINT-01' },
        { opNum: '0020', controlKey: 'PM01', description: 'Check hydraulic fluid level', duration: 0.5, workCenter: 'WC-MAINT-01' },
        { opNum: '0030', controlKey: 'PM01', description: 'Inspect forks and heel', duration: 0.5, workCenter: 'WC-MAINT-01' },
        { opNum: '0040', controlKey: 'PM01', description: 'Test brakes and horn', duration: 0.5, workCenter: 'WC-MAINT-01' },
        { opNum: '0050', controlKey: 'PM01', description: 'Lubricate all grease points', duration: 0.5, workCenter: 'WC-MAINT-01' },
        { opNum: '0060', controlKey: 'PM01', description: 'Battery load test (electric only)', duration: 1, workCenter: 'WC-ELEC-01' },
      ];
    } else if (orderType === 'PM02') {
      return [
        { opNum: '0010', controlKey: 'PM02', description: 'Diagnose reported issue', duration: 2, workCenter: 'WC-MAINT-01' },
        { opNum: '0020', controlKey: 'PM02', description: 'Replace defective components', duration: 4, workCenter: 'WC-MAINT-01' },
        { opNum: '0030', controlKey: 'PM02', description: 'Functional test after repair', duration: 2, workCenter: 'WC-MAINT-01' },
      ];
    } else {
      return [
        { opNum: '0010', controlKey: 'PM03', description: 'Teardown and inspection', duration: 4, workCenter: 'WC-MAINT-02' },
        { opNum: '0020', controlKey: 'PM03', description: 'Major component replacement', duration: 8, workCenter: 'WC-MAINT-02' },
        { opNum: '0030', controlKey: 'PM03', description: 'Reassembly', duration: 4, workCenter: 'WC-MAINT-02' },
        { opNum: '0040', controlKey: 'PM03', description: 'Load test and certification', duration: 2, workCenter: 'WC-MAINT-02' },
      ];
    }
  }

  // ── Generate PM Order Components (spare parts) ────────────
  function generateComponents(forklift, orderType) {
    var comps = [];
    if (orderType === 'PM01') {
      comps.push({ matNum: 'OIL-HYD-5GAL', description: 'Hydraulic Oil ISO VG 46 (5gal)', qty: 1, unit: 'EA' });
      comps.push({ matNum: 'GRSE-TUBE-400G', description: 'Multi-purpose Grease (400g)', qty: 2, unit: 'EA' });
      if (forklift.powerSource === 'electric') {
        comps.push({ matNum: 'BAT-DIST-WATER', description: 'Distilled Water (battery)', qty: 5, unit: 'L' });
      }
    } else if (orderType === 'PM02') {
      comps.push({ matNum: 'BRK-PAD-SET', description: 'Brake Pad Set', qty: 1, unit: 'SET' });
      comps.push({ matNum: 'HYD-SEAL-KIT', description: 'Hydraulic Seal Kit', qty: 1, unit: 'EA' });
    } else {
      comps.push({ matNum: 'TRANS-REBUILD-KIT', description: 'Transmission Rebuild Kit', qty: 1, unit: 'EA' });
      comps.push({ matNum: 'MAST-CHAIN-SET', description: 'Mast Chain Set', qty: 1, unit: 'SET' });
      comps.push({ matNum: 'OIL-HYD-5GAL', description: 'Hydraulic Oil ISO VG 46 (5gal)', qty: 3, unit: 'EA' });
    }
    return comps;
  }

  // ── Simulated BAPI: Release PM Order ──────────────────────
  // Simulates BAPI_ALM_ORDER_MAINTAIN (status change CRTD → REL)
  function releasePmOrder(forklift) {
    if (!forklift.sapActivePmOrder) return { success: false, message: 'No active PM order' };
    return {
      bapi: 'BAPI_ALM_ORDER_MAINTAIN',
      orderNumber: forklift.sapActivePmOrder,
      action: 'RELEASE',
      oldStatus: 'CRTD',
      newStatus: 'REL',
      newStatusName: SAP_STATUS.REL,
      timestamp: new Date().toISOString(),
      success: true,
      message: 'Order ' + forklift.sapActivePmOrder + ' released',
    };
  }

  // ── Simulated BAPI: Technically Complete ──────────────────
  // Simulates BAPI_ALM_ORDER_MAINTAIN (status → TECO)
  function tecoPmOrder(forklift) {
    if (!forklift.sapActivePmOrder) return { success: false, message: 'No active PM order' };
    return {
      bapi: 'BAPI_ALM_ORDER_MAINTAIN',
      orderNumber: forklift.sapActivePmOrder,
      action: 'TECO',
      oldStatus: forklift.sapPmOrderStatus === 'in_progress' ? 'CNF' : 'REL',
      newStatus: 'TECO',
      newStatusName: SAP_STATUS.TECO,
      actualFinishDate: new Date().toISOString().slice(0, 10),
      actualHours: Math.random() * 8 + 2,
      actualCost: Math.random() * 2000 + 300,
      timestamp: new Date().toISOString(),
      success: true,
      message: 'Order ' + forklift.sapActivePmOrder + ' technically completed',
    };
  }

  // ── Simulated BAPI: Close PM Order ────────────────────────
  function closePmOrder(forklift) {
    if (!forklift.sapActivePmOrder) return { success: false, message: 'No active PM order' };
    return {
      bapi: 'BAPI_ALM_ORDER_MAINTAIN',
      orderNumber: forklift.sapActivePmOrder,
      action: 'CLOSE',
      oldStatus: 'TECO',
      newStatus: 'CLSD',
      newStatusName: SAP_STATUS.CLSD,
      timestamp: new Date().toISOString(),
      success: true,
      message: 'Order ' + forklift.sapActivePmOrder + ' closed',
    };
  }

  // ── Simulated BAPI: Create Measurement Document ───────────
  // Simulates BAPI_MEASM_DOCUM_MULTI_RECORD
  function createMeasurementDoc(forklift, reading) {
    return {
      bapi: 'BAPI_MEASM_DOCUM_MULTI_RECORD',
      measurementPoint: forklift.sapMeasurementPoint || 'MP-001-' + forklift.id,
      equipment: forklift.sapEquipmentNumber || '',
      reading: reading || forklift.hourMeter,
      unit: 'H',
      readingDate: new Date().toISOString().slice(0, 10),
      readingTime: new Date().toTimeString().slice(0, 8),
      documentedBy: 'OWLLOGICS',
      shortText: 'Hour meter reading from Lift Link telematics',
      success: true,
      message: 'Measurement document created for MP ' + (forklift.sapMeasurementPoint || ''),
      timestamp: new Date().toISOString(),
    };
  }

  // ── SAP IDoc: Equipment Master Export ─────────────────────
  // Generates IDoc-style flat file for EQUI + IFLOT
  function generateEquipmentIDoc(forklift) {
    var lines = [];
    lines.push('# OwlLogics SAP PM Equipment Master IDoc Export');
    lines.push('# Format: IDoc EQUIPMENT_MASTER (message type EQUI_CREATE)');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('EDI_DC40|EQUIPMENT_MASTER|OWLLOGICS|SAP|1000|EQUI_CREATE');
    lines.push('');
    // E1EQUZ segment - Equipment master
    var e = forklift;
    lines.push('E1EQUZ|' +
      (e.sapEquipmentNumber || 'NEW') + '|' +
      (e.sapEquipmentCategory || 'F') + '|' +
      AutoSeq.sanitize(e.brand + ' ' + e.model + ' ' + e.unitNumber) + '|' +
      (e.sapObjectStatus || 'INST') + '|' +
      (e.sapManufacturer || e.brand || '').toUpperCase() + '|' +
      (e.sapModelNumber || e.model || '') + '|' +
      (e.serialNumber || '') + '|' +
      (e.sapConstructionYear || '') + '|' +
      (e.sapConstructionMonth || '') + '|' +
      (e.sapStartupDate || '') + '|' +
      (e.sapWarrantyEnd || '') + '|' +
      (e.sapMaintenancePlant || e.sapPlant || '1000') + '|' +
      (e.sapPlanningPlant || e.sapPlant || '1000') + '|' +
      (e.sapAbcIndicator || 'B') + '|' +
      (e.sapSortField || e.unitNumber)
    );
    // E1IFLO segment - Functional location
    lines.push('E1IFLO|' +
      (e.sapFunctionalLocation || '') + '|' +
      (e.sapPlant || '1000') + '|' +
      (e.sapCostCenter || '') + '|' +
      (e.sapWorkCenter || '') + '|' +
      (e.sapCompanyCode || '1000') + '|' +
      (e.currentLocation || '')
    );
    // E1MEASM segment - Measurement point
    lines.push('E1MEASM|' +
      (e.sapMeasurementPoint || '') + '|' +
      (e.sapEquipmentNumber || '') + '|' +
      'H|' +
      'HOUR METER|' +
      e.hourMeter.toFixed(1) + '|' +
      (e.sapNextServiceDate || '')
    );
    // E1PMORD segment - Active PM order (if any)
    if (e.sapActivePmOrder) {
      var hist = e.sapOrderHistory && e.sapOrderHistory.length > 0 ? e.sapOrderHistory[e.sapOrderHistory.length - 1] : null;
      lines.push('E1PMORD|' +
        e.sapActivePmOrder + '|' +
        (hist ? hist.type : 'PM01') + '|' +
        (e.sapPmOrderStatus || 'CRTD') + '|' +
        (hist ? hist.desc : '') + '|' +
        (e.sapLastServiceDate || '') + '|' +
        (e.sapNextServiceDate || '')
      );
    }
    lines.push('');
    return lines.join('\n');
  }

  // ── SAP IDoc: Full Fleet Equipment Export ─────────────────
  function generateFleetIDoc(forklifts) {
    var lines = [];
    lines.push('# OwlLogics SAP PM Fleet Equipment Master Export');
    lines.push('# Format: IDoc EQUIPMENT_MASTER batch');
    lines.push('# Forklifts: ' + forklifts.length);
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('EDI_DC40|EQUIPMENT_MASTER_BATCH|OWLLOGICS|SAP|1000|EQUI_CREATE');
    lines.push('');
    forklifts.forEach(function(fl) {
      lines.push(generateEquipmentIDoc(fl));
    });
    return lines.join('\n');
  }

  // ── SAP IDoc: Measurement Documents Batch ─────────────────
  function generateMeasurementIDoc(forklifts) {
    var lines = [];
    lines.push('# OwlLogics SAP PM Measurement Documents Batch');
    lines.push('# Format: IDoc MEASUREMENT_DOC (message type MEASM_CREATE)');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('EDI_DC40|MEASUREMENT_DOC|OWLLOGICS|SAP|1000|MEASM_CREATE');
    lines.push('');
    forklifts.forEach(function(fl) {
      if (!fl.liftLinkConnected) return;
      lines.push('E1IMRG|' +
        (fl.sapMeasurementPoint || '') + '|' +
        (fl.sapEquipmentNumber || '') + '|' +
        fl.hourMeter.toFixed(1) + '|' +
        'H|' +
        new Date().toISOString().slice(0, 10) + '|' +
        new Date().toTimeString().slice(0, 8) + '|' +
        'OWLLOGICS|' +
        'Lift Link telematics auto-reading'
      );
    });
    return lines.join('\n');
  }

  // ── SAP IDoc: PM Orders Batch Export ──────────────────────
  function generatePmOrdersIDoc(forklifts) {
    var lines = [];
    lines.push('# OwlLogics SAP PM Orders Export');
    lines.push('# Format: IDoc PM_ORDER (message type ALM_ORDER)');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('EDI_DC40|PM_ORDER|OWLLOGICS|SAP|1000|ALM_ORDER');
    lines.push('');
    forklifts.forEach(function(fl) {
      if (!fl.sapActivePmOrder) return;
      var hist = fl.sapOrderHistory && fl.sapOrderHistory.length > 0 ? fl.sapOrderHistory[fl.sapOrderHistory.length - 1] : null;
      lines.push('E1AUFK|' + fl.sapActivePmOrder + '|' + (hist ? hist.type : 'PM01') + '|' + fl.sapEquipmentNumber + '|' + fl.sapFunctionalLocation);
      lines.push('E1AFKO|' + (hist ? hist.desc : 'Maintenance') + '|' + (fl.sapWorkCenter || '') + '|' + (fl.sapCostCenter || ''));
      lines.push('E1Operation|0010|' + (hist ? hist.type : 'PM01') + '|Inspect and service|' + (fl.sapWorkCenter || ''));
      lines.push('');
    });
    return lines.join('\n');
  }

  // ── Get SAP status summary for fleet ──────────────────────
  function getFleetSapSummary(forklifts) {
    var total = forklifts.length;
    var withEquip = forklifts.filter(function(f) { return f.sapEquipmentNumber; }).length;
    var openOrders = forklifts.filter(function(f) { return f.sapActivePmOrder && f.sapPmOrderStatus !== 'closed' && f.sapPmOrderStatus !== 'none'; }).length;
    var connected = forklifts.filter(function(f) { return f.liftLinkConnected; }).length;
    var overdueSvc = forklifts.filter(function(f) { return f.maintenanceStatus === 'overdue'; }).length;
    var dueSvc = forklifts.filter(function(f) { return f.maintenanceStatus === 'due'; }).length;

    return {
      total: total,
      withEquipmentMaster: withEquip,
      withoutEquipment: total - withEquip,
      openPmOrders: openOrders,
      telematicsConnected: connected,
      overdueService: overdueSvc,
      dueService: dueSvc,
      sapCoverage: total > 0 ? Math.round((withEquip / total) * 100) : 0,
    };
  }

  return {
    PM_ORDER_TYPES: PM_ORDER_TYPES,
    SAP_STATUS: SAP_STATUS,
    createEquipment: createEquipment,
    generateFunctionalLocation: generateFunctionalLocation,
    createPmOrder: createPmOrder,
    releasePmOrder: releasePmOrder,
    tecoPmOrder: tecoPmOrder,
    closePmOrder: closePmOrder,
    createMeasurementDoc: createMeasurementDoc,
    generateEquipmentIDoc: generateEquipmentIDoc,
    generateFleetIDoc: generateFleetIDoc,
    generateMeasurementIDoc: generateMeasurementIDoc,
    generatePmOrdersIDoc: generatePmOrdersIDoc,
    getFleetSapSummary: getFleetSapSummary,
  };
})();
