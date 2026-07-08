/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved - Patent Pending
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics SAP IDoc Engine
   ============================================================ */

var SapIDoc = (function () {

  // ── IDoc Control Record (EDI_DC40) ────────────────────────
  function buildControlRecord(msgType, idocType, recipient, sender) {
    return [
      'EDI_DC40',
      msgType,
      sender || 'OWLLOGICS',
      recipient || 'SAP',
      '1000',
      msgType
    ].join('|');
  }

  // ── DELVRY07: Delivery / ASN (EDI 856) ────────────────────
  // Used when shipping sequenced parts to Harley-Davidson
  function generateDELVRY(sequences, rack, routeInfo) {
    var lines = [];
    lines.push('# OwlLogics SAP IDoc — DELVRY07 (ASN / Delivery Note)');
    lines.push('# Harley-Davidson JIT Sequenced Delivery');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');

    var shipTo = routeInfo ? routeInfo.toBuilding : 'Harley-Davidson York PA';
    var shipFrom = routeInfo ? routeInfo.fromBuilding : 'OwlLogics Sequencing';

    // Control record
    lines.push(buildControlRecord('DELVRY07', 'DELVRY07', 'HD-YORK', 'OWLLOGICS'));
    lines.push('');

    // E1EDL20 — Delivery header
    var deliveryNum = 'DLV' + Date.now().toString().slice(-8);
    lines.push('E1EDL20|' + deliveryNum + '|' + new Date().toISOString().slice(0, 10) + '|' + (rack ? rack.id : 'N/A') + '|');
    lines.push('E1EDL21|' + shipFrom + '|' + shipTo + '|');

    // E1EDL37 — General shipment data
    if (routeInfo) {
      lines.push('E1EDL37|' + routeInfo.routeName + '|' + (routeInfo.driver || '') + '|' + (routeInfo.vehicle || '') + '|');
    }

    // E1EDL33 — Item-level delivery (one per sequence/part)
    sequences.forEach(function(seq, idx) {
      var itemNum = String(idx + 1).padStart(6, '0');
      lines.push('E1EDL33|' +
        itemNum + '|' +
        (seq.partNumber || '') + '|' +
        '1|' +  // quantity
        'EA|' + // unit
        (seq.sequenceNumber || '') + '|' +
        (seq.vin || '') + '|' +
        (seq.description || '') + '|' +
        (seq.commodity || '') + '|' +
        (seq.oem || '')
      );

      // E1EDL34 — Serial number / VIN tracking
      if (seq.vin) {
        lines.push('E1EDL34|' + seq.vin + '|' + (seq.sequenceNumber || '') + '|');
      }

      // E1EDL36 — Packaging info
      if (rack) {
        lines.push('E1EDL36|' + rack.id + '|' + rack.rackTypeName + '|' + rack.slotCount + '|');
      }
    });

    // E1EDL44 — Text segment (delivery notes)
    lines.push('E1EDL44|0001|OwlLogics NexGen — JIT Sequenced Delivery for Harley-Davidson|');
    lines.push('E1EDL44|0002|Schedule Issuer: SAP JIT Broadcast — Plant: ' + (routeInfo ? routeInfo.toBuilding : 'YORK-PA') + '|');

    lines.push('');
    return lines.join('\n');
  }

  // ── DESADV07: Despatch Advice (EDI 856 variant) ───────────
  function generateDESADV(sequences, rack) {
    var lines = [];
    lines.push('# OwlLogics SAP IDoc — DESADV07 (Despatch Advice)');
    lines.push('# Harley-Davidson Advance Shipping Notice');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');

    lines.push(buildControlRecord('DESADV07', 'DESADV07', 'HD-SAP', 'OWLLOGICS'));
    lines.push('');

    var asnNum = 'ASN' + Date.now().toString().slice(-8);
    lines.push('E1EDL20|' + asnNum + '|' + new Date().toISOString().slice(0, 10) + '|' + (rack ? rack.id : '') + '|');

    sequences.forEach(function(seq, idx) {
      lines.push('E1AD37|' + String(idx + 1).padStart(6, '0') + '|' +
        (seq.partNumber || '') + '|1|EA|' +
        (seq.sequenceNumber || '') + '|' + (seq.vin || '') + '|');
    });

    lines.push('');
    return lines.join('\n');
  }

  // ── ORDERS05: Purchase Order (EDI 850) ────────────────────
  // Harley-Davidson sends POs to suppliers for parts
  function generateORDERS(sequences, supplierInfo) {
    var lines = [];
    lines.push('# OwlLogics SAP IDoc — ORDERS05 (Purchase Order)');
    lines.push('# Harley-Davidson Parts Order');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');

    var poNum = 'HDPO' + Date.now().toString().slice(-6);
    lines.push(buildControlRecord('ORDERS05', 'ORDERS05', 'HD-SAP', 'OWLLOGICS'));
    lines.push('');

    // E1EDK01 — PO header
    lines.push('E1EDK01|' + poNum + '|' + new Date().toISOString().slice(0, 10) + '|');

    // E1EDK14 — Organizational data
    lines.push('E1EDK14|011|' + (supplierInfo ? supplierInfo.salesOrg : 'HD01') + '|');
    lines.push('E1EDK14|012|' + (supplierInfo ? supplierInfo.distrChan : '01') + '|');
    lines.push('E1EDK14|008|' + (supplierInfo ? supplierInfo.companyCode : '1000') + '|');

    // E1EDK02 — Reference (Schedule Agreement)
    lines.push('E1EDK02|001|' + poNum + '|' + new Date().toISOString().slice(0, 10) + '|');
    lines.push('E1EDK02|012|HD-JIT-AGREEMENT|');

    // E1EDP01 — Line items (one per part)
    sequences.forEach(function(seq, idx) {
      var lineNum = String(idx + 1).padStart(5, '0');
      lines.push('E1EDP01|' +
        lineNum + '|' +
        (seq.partNumber || '') + '|' +
        '1|' +  // qty
        'EA|' + // unit
        (seq.description || '') + '|' +
        (seq.customerPartNumber || '') + '|' +
        (seq.oem || '') + '|' +
        (seq.commodity || '')
      );

      // E1EDP19 — Object (material/VIN)
      if (seq.vin) {
        lines.push('E1EDP19|002|' + seq.vin + '|');
      }

      // E1EDP20 — Schedule line (delivery date)
      lines.push('E1EDP20|' + new Date().toISOString().slice(0, 10) + '|1|EA|');
    });

    // E1EDK17 — Terms
    lines.push('E1EDK17|0001|JIT Delivery|Net 30 from receipt|');

    lines.push('');
    return lines.join('\n');
  }

  // ── INVOIC02: Invoice (EDI 810) ───────────────────────────
  function generateINVOIC(sequences, rack, pricing) {
    var lines = [];
    lines.push('# OwlLogics SAP IDoc — INVOIC02 (Invoice)');
    lines.push('# Harley-Davidson Parts Invoice');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');

    var invNum = 'INV' + Date.now().toString().slice(-8);
    lines.push(buildControlRecord('INVOIC02', 'INVOIC02', 'HD-AP', 'OWLLOGICS'));
    lines.push('');

    // E1EDK01 — Invoice header
    var totalQty = sequences.length;
    var totalAmt = sequences.reduce(function(sum, s) { return sum + ((pricing && pricing.unitPrice) || 100); }, 0);
    lines.push('E1EDK01|' + invNum + '|' + new Date().toISOString().slice(0, 10) + '|' + totalQty + '|' + totalAmt.toFixed(2) + '|USD|');

    // E1EDK02 — Reference (PO)
    lines.push('E1EDK02|001|HDPO' + Date.now().toString().slice(-6) + '|');

    // E1EDK14 — Org data
    lines.push('E1EDK14|008|1000|');

    // E1EDP01 — Line items
    sequences.forEach(function(seq, idx) {
      var lineNum = String(idx + 1).padStart(5, '0');
      var unitPrice = (pricing && pricing.unitPrice) || 100;
      lines.push('E1EDP01|' +
        lineNum + '|' +
        (seq.partNumber || '') + '|' +
        '1|EA|' +
        unitPrice.toFixed(2) + '|USD|' +
        (seq.description || '') + '|' +
        (seq.vin || '') + '|' +
        (seq.sequenceNumber || '')
      );
    });

    // E1EDS01 — Summary
    lines.push('E1EDS01|010|' + totalQty + '|');
    lines.push('E1EDS01|011|' + totalAmt.toFixed(2) + '|USD|');

    lines.push('');
    return lines.join('\n');
  }

  // ── MATMAS05: Material Master ──────────────────────────────
  // Push part/material definitions to SAP
  function generateMATMAS(parts) {
    var lines = [];
    lines.push('# OwlLogics SAP IDoc — MATMAS05 (Material Master)');
    lines.push('# Harley-Davidson + OEM Parts Catalog');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');

    lines.push(buildControlRecord('MATMAS05', 'MATMAS05', 'SAP', 'OWLLOGICS'));
    lines.push('');

    parts.forEach(function(part) {
      // E1MARAM — Material master
      lines.push('E1MARAM|' +
        (part.partNumber || '') + '|' +
        (part.description || '') + '|' +
        (part.commodity || '') + '|' +
        (part.oem || '') + '|' +
        (part.weight || 0) + '|' +
        'KG|' +
        (part.color || '') + '|'
      );

      // E1MARAV — MARC plant data
      lines.push('E1MARAV|1000|' + (part.rackType || '') + '|' + (part.pickingPattern || 'forward') + '|');

      // E1MAKT — Description
      lines.push('E1MAKT|EN|' + (part.description || '') + '|');

      // E1MLEM — EAN/UPC
      if (part.customerPartNumber) {
        lines.push('E1MLEM|' + part.customerPartNumber + '|EA|');
      }
    });

    lines.push('');
    return lines.join('\n');
  }

  // ── Batch IDoc: All message types in one file ─────────────
  function generateBatchIDoc(sequences, racks, parts, routeInfo) {
    var lines = [];
    lines.push('# ============================================================');
    lines.push('# OwlLogics SAP IDoc Batch Export — Harley-Davidson + OEM');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('# Sequences: ' + sequences.length + ' | Racks: ' + racks.length + ' | Parts: ' + parts.length);
    lines.push('# Plants: YORK-PA, KC-MO, SHAP, JNAP, BAP, WTAP, TNP');
    lines.push('# OEMs: Harley-Davidson, FCA/Stellantis, GM, Ford, VW');
    lines.push('# ============================================================');
    lines.push('');
    lines.push('');

    // 1. Material Master
    lines.push('=== MATMAS05 ===');
    lines.push(generateMATMAS(parts));
    lines.push('');

    // 2. ASN/Delivery
    lines.push('=== DELVRY07 ===');
    lines.push(generateDELVRY(sequences, racks[0], routeInfo));
    lines.push('');

    // 3. Purchase Orders
    lines.push('=== ORDERS05 ===');
    lines.push(generateORDERS(sequences));
    lines.push('');

    // 4. Invoice
    lines.push('=== INVOIC02 ===');
    lines.push(generateINVOIC(sequences, racks[0]));
    lines.push('');

    return lines.join('\n');
  }

  // ── IDoc Message Types Reference ──────────────────────────
  var IDOC_TYPES = {
    DELVRY07:  { edi: '856', name: 'Delivery Note / ASN', segments: ['E1EDL20','E1EDL21','E1EDL33','E1EDL34','E1EDL36','E1EDL44'] },
    DESADV07:  { edi: '856', name: 'Despatch Advice', segments: ['E1EDL20','E1AD37'] },
    ORDERS05:  { edi: '850', name: 'Purchase Order', segments: ['E1EDK01','E1EDK14','E1EDK02','E1EDP01','E1EDP19','E1EDP20'] },
    INVOIC02:  { edi: '810', name: 'Invoice', segments: ['E1EDK01','E1EDK02','E1EDP01','E1EDS01'] },
    MATMAS05:  { edi: 'N/A', name: 'Material Master', segments: ['E1MARAM','E1MARAV','E1MAKT','E1MLEM'] },
  };

  // ── Harley-Davidson Plant Reference ───────────────────────
  var HD_PLANTS = {
    'YORK-PA': { name: 'York Vehicle Operations', address: '1425 Eden Road, York PA 17402', scheduleIssuer: '1001S101', building: 'Bldg 3 Assembly' },
    'KC-MO':   { name: 'Kansas City Plant', address: '9400 Universal Ave, Kansas City MO 64129', scheduleIssuer: '1001S102', building: 'Bldg A Assembly' },
    'MENOMONEE': { name: 'Tomahawk Operations', address: 'Tomahawk, WI 54487', scheduleIssuer: '1001S103', building: 'Paint & Plastics' },
  };

  return {
    buildControlRecord: buildControlRecord,
    generateDELVRY: generateDELVRY,
    generateDESADV: generateDESADV,
    generateORDERS: generateORDERS,
    generateINVOIC: generateINVOIC,
    generateMATMAS: generateMATMAS,
    generateBatchIDoc: generateBatchIDoc,
    IDOC_TYPES: IDOC_TYPES,
    HD_PLANTS: HD_PLANTS,
  };
})();
