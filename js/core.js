/* ============================================================
   OwlLogics NexGen Owl Mode
   © 2024 OwlLogics Contributors — All Rights Reserved — Patent Pending
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Core Engine — State, Data, MSQM Simulator
   ============================================================ */

const AutoSeq = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  const state = {
    parts: [],
    opCodes: [],
    rackTypes: [],
    lines: [],

    sequences: [],
    racks: [],
    kits: [],
    scanLog: [],
    alerts: [],
    msqmLog: [],

    // Master data (user-configurable)
    commodities: [],
    items: [],

    // Routes & inter-building deliveries
    routes: [],
    deliveries: [],

    // Forklift fleet (Mitsubishi Logisnext integration)
    forklifts: [],

    activeView: 'dashboard',
    activeTab: 'dashboard',

    scanner: {
      connected: true,
      lastScan: null,
      buffer: '',
      collecting: false,
      startTime: 0,
    },

    msqm: {
      running: false,
      intervalId: null,
      pulseRate: 5000, // ms between pulses
      sequenceCounter: 1,
      vinCounter: 1000,
      connected: false,
      mode: 'simulation', // simulation | rest | websocket | mqtt | edi | opcua | serial
    },

    persistence: {
      enabled: true,
      key: 'owllogics_state',
      autoSave: true,
      lastSaved: null,
    },

    currentLine: null,
    currentRack: null,
    currentKit: null,
    currentSequence: null,
  };

  // ── Audio Beep (scanner feedback) ──────────────────────────
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { /* no audio available */ }
    }
    return audioCtx;
  }

  function beep(type) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'ok') {
      osc.frequency.value = 880; gain.gain.value = 0.15;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'err') {
      osc.type = 'square'; osc.frequency.value = 200; gain.gain.value = 0.2;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'scan') {
      osc.frequency.value = 1200; gain.gain.value = 0.08;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.stop(ctx.currentTime + 0.08);
    }
  }

  // ── Embedded Data (works with file:// — no server needed) ──
  const EMBEDDED_PARTS = [{"partNumber":"5WK-8A350-AB","customerPartNumber":"GM-19260412","description":"Front Bumper Assembly - Crimson Red","commodity":"Bumper","color":"Crimson Red","weight":8.2,"rackSlotType":"bumper_d50","pickingPattern":"forward"},{"partNumber":"5WK-8A351-CD","customerPartNumber":"GM-19260413","description":"Front Bumper Assembly - Metallic Silver","commodity":"Bumper","color":"Metallic Silver","weight":8.1,"rackSlotType":"bumper_d50","pickingPattern":"forward"},{"partNumber":"8K93-04200-A","customerPartNumber":"FORD-CX7-88210","description":"Headliner Assembly - Charcoal","commodity":"Headliner","color":"Charcoal","weight":4.5,"rackSlotType":"headliner_d30","pickingPattern":"reverse"},{"partNumber":"8K93-04201-A","customerPartNumber":"FORD-CX7-88211","description":"Headliner Assembly - Pebble Beige","commodity":"Headliner","color":"Pebble Beige","weight":4.5,"rackSlotType":"headliner_d30","pickingPattern":"reverse"},{"partNumber":"SEAT-CUSH-FR-01","customerPartNumber":"VW-5K0-881-051","description":"Front Seat Cushion Kit - Black Leather","commodity":"Seat","color":"Black Leather","weight":12.3,"rackSlotType":"seat_kit","pickingPattern":"forward","kitComponents":[{"component":"Foam Cushion","partNumber":"FOAM-5K0-880-045","qty":1},{"component":"Trim Cover","partNumber":"TRIM-5K0-880-051","qty":1},{"component":"Wire Harness","partNumber":"WHR-5K0-971-022","qty":1},{"component":"Heating Element","partNumber":"HEAT-5K0-963-014","qty":1}]},{"partNumber":"SEAT-BCK-FR-01","customerPartNumber":"VW-5K0-880-051","description":"Front Seat Back Assembly - Black Leather","commodity":"Seat","color":"Black Leather","weight":9.8,"rackSlotType":"seat_kit","pickingPattern":"forward","kitComponents":[{"component":"Backrest Foam","partNumber":"FOAM-5K0-880-052","qty":1},{"component":"Backrest Trim","partNumber":"TRIM-5K0-880-060","qty":1},{"component":"Wire Harness","partNumber":"WHR-5K0-971-022","qty":1},{"component":"Lumbar Support","partNumber":"LUMBAR-5K0-881-001","qty":1}]},{"partNumber":"WIND-MX2-FR","customerPartNumber":"HON-RV5-88210","description":"Windshield Glass - Tinted","commodity":"Windshield","color":"Tinted","weight":15.0,"rackSlotType":"glass_rack","pickingPattern":"reverse"},{"partNumber":"WIPR-FR-SET","customerPartNumber":"HON-RV5-38510","description":"Front Wiper Blade Set","commodity":"Wiper","color":"Standard","weight":0.5,"rackSlotType":"small_parts_bin","pickingPattern":"forward"},{"partNumber":"TAIL-LH-RED","customerPartNumber":"GM-TX5-840-002","description":"Tail Lamp Assembly LH - Red","commodity":"TailLamp","color":"Red","weight":1.8,"rackSlotType":"tail_lamp_rack","pickingPattern":"forward"},{"partNumber":"TAIL-RH-RED","customerPartNumber":"GM-TX5-840-003","description":"Tail Lamp Assembly RH - Red","commodity":"TailLamp","color":"Red","weight":1.8,"rackSlotType":"tail_lamp_rack","pickingPattern":"forward"},{"partNumber":"DASH-CLSTR-FK","customerPartNumber":"FORD-CX7-10C8","description":"Instrument Cluster Assembly","commodity":"Dashboard","color":"Dark Grey","weight":3.2,"rackSlotType":"dash_rack","pickingPattern":"forward","kitComponents":[{"component":"Cluster Display","partNumber":"DSP-10C8-001","qty":1},{"component":"Speedometer Module","partNumber":"SPD-10C8-002","qty":1},{"component":"Wire Harness","partNumber":"WHR-10C8-003","qty":1},{"component":"Tachometer Module","partNumber":"TACH-10C8-004","qty":1}]},{"partNumber":"HOOD-EMBM-AB","customerPartNumber":"GM-19260500","description":"Hood Emblem - Chrome","commodity":"Emblem","color":"Chrome","weight":0.15,"rackSlotType":"small_parts_bin","pickingPattern":"forward"},{"partNumber":"68298041AB","customerPartNumber":"68298041AB","description":"Front Fascia - Granite Crystal","commodity":"Fascia","color":"Granite Crystal","weight":7.5,"rackSlotType":"fascia_rack","pickingPattern":"forward"},{"partNumber":"68298042AC","customerPartNumber":"68298042AC","description":"Front Fascia - Brilliant Black","commodity":"Fascia","color":"Brilliant Black","weight":7.4,"rackSlotType":"fascia_rack","pickingPattern":"forward"},{"partNumber":"68303553AG","customerPartNumber":"68303553AG","description":"Ram Box Tailgate Panel - Stainless","commodity":"Tailgate","color":"Stainless Steel","weight":11.2,"rackSlotType":"tailgate_rack","pickingPattern":"reverse"},{"partNumber":"56046959AH","customerPartNumber":"56046959AH","description":"Door Trim Panel LH - Black","commodity":"DoorTrim","color":"Black","weight":5.8,"rackSlotType":"door_trim_rack","pickingPattern":"forward"},{"partNumber":"56046960AH","customerPartNumber":"56046960AH","description":"Door Trim Panel RH - Black","commodity":"DoorTrim","color":"Black","weight":5.8,"rackSlotType":"door_trim_rack","pickingPattern":"forward"},{"partNumber":"68251648AC","customerPartNumber":"68251648AC","description":"Grille Assembly - Chrome","commodity":"Grille","color":"Chrome","weight":3.5,"rackSlotType":"grille_rack","pickingPattern":"forward"},{"partNumber":"55156828AB","customerPartNumber":"55156828AB","description":"Instrument Panel Bezel - Satin Silver","commodity":"IPBezel","color":"Satin Silver","weight":1.2,"rackSlotType":"ip_bezel_rack","pickingPattern":"forward","kitComponents":[{"component":"Bezel Frame","partNumber":"55156829AB","qty":1},{"component":"Trim Ring","partNumber":"55156830AB","qty":1},{"component":"Mounting Clips","partNumber":"6502296AA","qty":4}]},{"partNumber":"68029879AC","customerPartNumber":"68029879AC","description":"Headlamp Assembly LH - Projector","commodity":"Headlamp","color":"Clear/Black","weight":4.2,"rackSlotType":"headlamp_rack","pickingPattern":"forward"},{"partNumber":"68029880AC","customerPartNumber":"68029880AC","description":"Headlamp Assembly RH - Projector","commodity":"Headlamp","color":"Clear/Black","weight":4.2,"rackSlotType":"headlamp_rack","pickingPattern":"forward"},{"partNumber":"58000-10","customerPartNumber":"HD-58000-10","description":"Touring Frame Assembly - Black","commodity":"Frame","color":"Black","weight":85.0,"rackType":"frame_rack","oem":"Harley-Davidson","pickingPattern":"forward","kitComponents":null},{"partNumber":"17000-10","customerPartNumber":"HD-17000-10","description":"Milwaukee-Eight 114 Engine - Cradle Mount","commodity":"Engine","color":"Black","weight":120.0,"rackType":"engine_cradle","oem":"Harley-Davidson","pickingPattern":"forward","kitComponents":null},{"partNumber":"56000-09","customerPartNumber":"HD-56000-09","description":"Apes Handlebar Assembly - Chrome 12in","commodity":"Handlebar","color":"Chrome","weight":4.5,"rackType":"handlebar_rack","oem":"Harley-Davidson","pickingPattern":"forward","kitComponents":[{"part":"56061-09","desc":"Handlebar Clamp Kit"},{"part":"56062-09","desc":"Switch Housing Set"}]},{"partNumber":"40600-10","customerPartNumber":"HD-40600-10","description":"Front Wheel 19in Laced - Black Rim","commodity":"Wheel","color":"Black","weight":12.0,"rackType":"wheel_rack","oem":"Harley-Davidson","pickingPattern":"reverse","kitComponents":null},{"partNumber":"40700-10","customerPartNumber":"HD-40700-10","description":"Rear Wheel 16in Laced - Chrome Rim","commodity":"Wheel","color":"Chrome","weight":14.0,"rackType":"wheel_rack","oem":"Harley-Davidson","pickingPattern":"reverse","kitComponents":null},{"partNumber":"61400-10","customerPartNumber":"HD-61400-10","description":"Fuel Tank - Vivid Black Street Bob","commodity":"FuelTank","color":"Vivid Black","weight":8.5,"rackType":"tank_rack","oem":"Harley-Davidson","pickingPattern":"forward","kitComponents":[{"part":"61410-10","desc":"Fuel Cap Assembly"},{"part":"61420-10","desc":"Fuel Pump Module"}]},{"partNumber":"59000-10","customerPartNumber":"HD-59000-10","description":"Front Fender - Vivid Black","commodity":"Fender","color":"Vivid Black","weight":3.2,"rackType":"fender_rack","oem":"Harley-Davidson","pickingPattern":"forward","kitComponents":null},{"partNumber":"59100-10","customerPartNumber":"HD-59100-10","description":"Rear Fender - Cherry Red Sinister","commodity":"Fender","color":"Cherry Red","weight":4.1,"rackType":"fender_rack","oem":"Harley-Davidson","pickingPattern":"forward","kitComponents":null}];

  const EMBEDDED_OPS = {"opCodes":[{"code":"OP-100","name":"Receive OEM Demand","description":"Process incoming OEM sequence broadcast (EDI 866, CONVIS, or MSQM pulse)","category":"Inbound","sapTransaction":"MIGO","cgmCode":"INBOUND_DEMAND"},{"code":"OP-200","name":"Print Part Labels","description":"Generate barcoded part labels with sequence number (AIAG B-3.0 / Code 39)","category":"Labeling","sapTransaction":"ZPL_PART_LBL","cgmCode":"PART_LABEL"},{"code":"OP-300","name":"Rack Loading - Forward","description":"Load rack in forward sequence (position 1 loaded first)","category":"Rack Loading","sapTransaction":"Zrack_Load_F","cgmCode":"RACK_LOAD_FWD"},{"code":"OP-310","name":"Rack Loading - Reverse","description":"Load rack in reverse sequence (last position loaded first)","category":"Rack Loading","sapTransaction":"Zrack_Load_R","cgmCode":"RACK_LOAD_REV"},{"code":"OP-400","name":"Kit Assembly","description":"Pick and assemble components into a kit for a sub-assembly","category":"Kitting","sapTransaction":"ZKIT_ASM","cgmCode":"KIT_ASSEMBLY"},{"code":"OP-500","name":"Scan Validation (Poka-Yoke)","description":"Validate each part in rack against its assigned slot position","category":"Validation","sapTransaction":"ZSCAN_VAL","cgmCode":"SCAN_VALIDATE"},{"code":"OP-600","name":"Print Rack Label","description":"Generate AIAG B-3.0 / 4x6 rack label with grid schematic","category":"Labeling","sapTransaction":"ZPL_RACK_LBL","cgmCode":"RACK_LABEL"},{"code":"OP-700","name":"Staging","description":"Arrange completed racks for outbound truck loading","category":"Outbound","sapTransaction":"ZSTAGE","cgmCode":"STAGING"},{"code":"OP-800","name":"Trailer Load","description":"Load racks onto trailer in sequence per OEM requirement","category":"Outbound","sapTransaction":"ZTRAILER_LOAD","cgmCode":"TRAILER_LOAD"},{"code":"OP-900","name":"Generate ASN (856)","description":"Create outbound 856 ASN transaction for ERP/EDI upload","category":"Outbound","sapTransaction":"VL10C","cgmCode":"ASN_856"},{"code":"OP-1000","name":"CONVIS Broadcast Receive","description":"FCA/Stellantis CONVIS sequencing broadcast \u2014 receive and process vehicle order sequence","category":"Inbound","sapTransaction":"ZCONVIS_RECV","cgmCode":"CONVIS_BROADCAST"},{"code":"OP-1100","name":"CPOC Sequence Validation","description":"FCA CPOC (Container Parts Order Confirmation) \u2014 validate container contents against sequence","category":"Validation","sapTransaction":"ZCPOC_VAL","cgmCode":"CPOC_VALIDATE"}],"rackTypes":[{"id":"bumper_d50","name":"Bumper Rack D50","slotCount":20,"pattern":"forward","gridRows":4,"gridCols":5,"description":"Standard 20-slot bumper delivery rack"},{"id":"headliner_d30","name":"Headliner Rack D30","slotCount":15,"pattern":"reverse","gridRows":3,"gridCols":5,"description":"15-slot vertical headliner rack, loaded bottom-to-top"},{"id":"seat_kit","name":"Seat Kit Rack","slotCount":12,"pattern":"forward","gridRows":3,"gridCols":4,"description":"12-slot rack for sequenced seat kits"},{"id":"glass_rack","name":"Glass Rack","slotCount":10,"pattern":"reverse","gridRows":2,"gridCols":5,"description":"10-slot glass rack, reverse-loaded"},{"id":"tail_lamp_rack","name":"Tail Lamp Rack","slotCount":24,"pattern":"forward","gridRows":4,"gridCols":6,"description":"24-slot tail lamp delivery rack"},{"id":"dash_rack","name":"Dashboard Rack","slotCount":8,"pattern":"forward","gridRows":2,"gridCols":4,"description":"8-slot dashboard assembly rack"},{"id":"small_parts_bin","name":"Small Parts Bin","slotCount":40,"pattern":"forward","gridRows":5,"gridCols":8,"description":"40-slot bin for small components (emblems, wipers)"},{"id":"fascia_rack","name":"Fascia Rack (FCA)","slotCount":16,"pattern":"forward","gridRows":4,"gridCols":4,"description":"16-slot fascia/front-end rack for FCA/Stellantis vehicles"},{"id":"tailgate_rack","name":"Tailgate Rack (FCA Ram)","slotCount":10,"pattern":"reverse","gridRows":2,"gridCols":5,"description":"10-slot tailgate rack for Ram trucks, reverse-loaded"},{"id":"door_trim_rack","name":"Door Trim Rack (FCA)","slotCount":20,"pattern":"forward","gridRows":4,"gridCols":5,"description":"20-slot door trim panel rack for FCA vehicles"},{"id":"grille_rack","name":"Grille Rack (FCA)","slotCount":14,"pattern":"forward","gridRows":2,"gridCols":7,"description":"14-slot grille assembly rack for FCA/Jeep/Ram"},{"id":"ip_bezel_rack","name":"IP Bezel Rack (FCA)","slotCount":30,"pattern":"forward","gridRows":5,"gridCols":6,"description":"30-slot instrument panel bezel rack for FCA"},{"id":"headlamp_rack","name":"Headlamp Rack (FCA)","slotCount":24,"pattern":"forward","gridRows":4,"gridCols":6,"description":"24-slot headlamp assembly rack for FCA/Jeep/Ram"},{"id":"frame_rack","name":"Frame Rack (HD)","slotCount":6,"pattern":"forward","gridRows":2,"gridCols":3},{"id":"engine_cradle","name":"Engine Cradle (HD)","slotCount":4,"pattern":"forward","gridRows":1,"gridCols":4},{"id":"handlebar_rack","name":"Handlebar Rack (HD)","slotCount":24,"pattern":"forward","gridRows":4,"gridCols":6},{"id":"wheel_rack","name":"Wheel Rack (HD)","slotCount":20,"pattern":"reverse","gridRows":4,"gridCols":5},{"id":"tank_rack","name":"Fuel Tank Rack (HD)","slotCount":10,"pattern":"forward","gridRows":2,"gridCols":5},{"id":"fender_rack","name":"Fender Rack (HD)","slotCount":16,"pattern":"forward","gridRows":4,"gridCols":4}],"lines":[{"id":"LINE-01","name":"Bumper Line A","commodity":"Bumper","rackType":"bumper_d50","oem":"General Motors"},{"id":"LINE-02","name":"Headliner Line B","commodity":"Headliner","rackType":"headliner_d30","oem":"Ford Motor Co"},{"id":"LINE-03","name":"Seat Assembly Line C","commodity":"Seat","rackType":"seat_kit","oem":"Volkswagen"},{"id":"LINE-04","name":"Glass Line D","commodity":"Windshield","rackType":"glass_rack","oem":"Honda"},{"id":"LINE-05","name":"Lamp Line E","commodity":"TailLamp","rackType":"tail_lamp_rack","oem":"General Motors"},{"id":"LINE-06","name":"Dashboard Line F","commodity":"Dashboard","rackType":"dash_rack","oem":"Ford Motor Co"},{"id":"LINE-07","name":"Fascia Line G (FCA SHAP)","commodity":"Fascia","rackType":"fascia_rack","oem":"FCA/Stellantis"},{"id":"LINE-08","name":"Tailgate Line H (FCA BAP)","commodity":"Tailgate","rackType":"tailgate_rack","oem":"FCA/Stellantis"},{"id":"LINE-09","name":"Door Trim Line I (FCA JNAP)","commodity":"DoorTrim","rackType":"door_trim_rack","oem":"FCA/Stellantis"},{"id":"LINE-10","name":"Grille Line J (FCA WTAP)","commodity":"Grille","rackType":"grille_rack","oem":"FCA/Stellantis"},{"id":"LINE-11","name":"IP Bezel Line K (FCA TNP)","commodity":"IPBezel","rackType":"ip_bezel_rack","oem":"FCA/Stellantis"},{"id":"LINE-12","name":"Headlamp Line L (FCA SHAP)","commodity":"Headlamp","rackType":"headlamp_rack","oem":"FCA/Stellantis"},{"id":"LINE-13","name":"Frame Welding (York)","oem":"Harley-Davidson","commodity":"Frame","rackType":"frame_rack","plant":"YORK-PA","pattern":"forward"},{"id":"LINE-14","name":"Engine Mount (York B3)","oem":"Harley-Davidson","commodity":"Engine","rackType":"engine_cradle","plant":"YORK-PA","pattern":"forward"},{"id":"LINE-15","name":"Handlebar Assembly (KC)","oem":"Harley-Davidson","commodity":"Handlebar","rackType":"handlebar_rack","plant":"KC-MO","pattern":"forward"},{"id":"LINE-16","name":"Wheel Lacing (York)","oem":"Harley-Davidson","commodity":"Wheel","rackType":"wheel_rack","plant":"YORK-PA","pattern":"reverse"},{"id":"LINE-17","name":"Fuel Tank Paint (KC)","oem":"Harley-Davidson","commodity":"FuelTank","rackType":"tank_rack","plant":"KC-MO","pattern":"forward"},{"id":"LINE-18","name":"Fender Forming (York)","oem":"Harley-Davidson","commodity":"Fender","rackType":"fender_rack","plant":"YORK-PA","pattern":"forward"}]};

  // ── Data Loading (tries fetch, falls back to embedded) ─────
  async function loadData() {
    try {
      const [partsRes, opsRes] = await Promise.all([
        fetch('data/sample-parts.json'),
        fetch('data/opcodes.json'),
      ]);
      if (!partsRes.ok || !opsRes.ok) throw new Error('fetch failed');
      state.parts = await partsRes.json();
      const ops = await opsRes.json();
      state.opCodes = ops.opCodes;
      state.rackTypes = ops.rackTypes;
      state.lines = ops.lines;
    } catch (e) {
      // Fallback: use embedded data (works with file:// — no server needed)
      // Using embedded data — no server required
      state.parts = EMBEDDED_PARTS;
      state.opCodes = EMBEDDED_OPS.opCodes;
      state.rackTypes = EMBEDDED_OPS.rackTypes;
      state.lines = EMBEDDED_OPS.lines;
    }
    // Initialize master data from parts catalog
    initMasterData();
    // Initialize routes
    initRoutes();
    // Initialize forklift fleet
    initForklifts();
  }

  // ── Alert System ───────────────────────────────────────────
  function alert(type, title, msg) {
    const a = { id: Date.now() + Math.random(), type, title, msg, time: new Date() };
    state.alerts.unshift(a);
    if (state.alerts.length > 20) state.alerts.pop();
    if (window.AutoSeqUI) window.AutoSeqUI.renderAlert(a);
    setTimeout(() => dismissAlert(a.id), 6000);
    return a.id;
  }

  function dismissAlert(id) {
    const numId = typeof id === 'string' ? parseFloat(id) : id;
    state.alerts = state.alerts.filter(a => a.id !== numId);
    if (window.AutoSeqUI) window.AutoSeqUI.removeAlert(id);
  }

  // ── MSQM Data Stream — Multi-Protocol Support ─────────────
  // Uses ProtocolAdapter for: simulation, REST, WebSocket, MQTT, EDI, OPC-UA, Serial
  let protocolHandler = null;

  function msqmStart() {
    if (state.msqm.running) return;
    state.msqm.running = true;
    state.msqm.connected = true;

    const mode = state.msqm.mode || 'simulation';
    msqmLog('info', 'MSQM', `Connection established — ${mode} mode active`);

    // Use ProtocolAdapter if available
    if (window.ProtocolAdapter) {
      const cfg = {};
      if (mode === 'simulation') cfg.pulseRate = state.msqm.pulseRate;

      // Set config
      ProtocolAdapter.setConfig(mode, cfg);

      // Register message handler
      protocolHandler = ProtocolAdapter.onMessage((msg) => {
        handleProtocolMessage(msg);
      });

      // Connect
      const result = ProtocolAdapter.connect(mode, cfg);
      if (!result.success) {
        msqmLog('error', 'MSQM', `Connection failed: ${result.message}`);
        state.msqm.running = false;
        state.msqm.connected = false;
        return;
      }
      msqmLog('info', 'MSQM', result.message);

      if (mode === 'simulation') {
        msqmLog('info', 'MSQM', `Pulse rate: ${state.msqm.pulseRate / 1000}s — Listening for OEM broadcasts...`);
      }
    } else {
      // Fallback: built-in simulation (if ProtocolAdapter not loaded)
      msqmLog('info', 'MSQM', `Pulse rate: ${state.msqm.pulseRate / 1000}s — Listening for OEM broadcasts...`);
      state.msqm.intervalId = setInterval(() => {
        msqmPulse();
      }, state.msqm.pulseRate);
      setTimeout(() => msqmPulse(), 800);
    }

    if (window.AutoSeqUI) window.AutoSeqUI.updateLiveIndicator();
  }

  function msqmStop() {
    if (!state.msqm.running) return;

    if (state.msqm.intervalId) {
      clearInterval(state.msqm.intervalId);
      state.msqm.intervalId = null;
    }

    if (protocolHandler) {
      protocolHandler();
      protocolHandler = null;
    }

    if (window.ProtocolAdapter) {
      ProtocolAdapter.disconnect();
    }

    state.msqm.running = false;
    state.msqm.connected = false;
    msqmLog('info', 'MSQM', 'Disconnected — stream stopped');
    if (window.AutoSeqUI) window.AutoSeqUI.updateLiveIndicator();
  }

  // ── Handle incoming protocol messages ──────────────────────
  function handleProtocolMessage(msg) {
    if (msg.type === 'demand' || msg.type === 'broadcast') {
      // Create sequence entry from the broadcast
      const seqNum = msg.sequenceNumber || state.msqm.sequenceCounter++;
      const seqEntry = {
        id: `SEQ-${String(seqNum).padStart(5, '0')}`,
        sequenceNumber: seqNum,
        vin: msg.vin || generateVIN(),
        lineId: msg.lineId || 'LINE-01',
        lineName: msg.lineName || msg.lineId || 'Unknown Line',
        oem: msg.oem || 'Unknown OEM',
        partNumber: msg.partNumber || 'UNKNOWN',
        customerPartNumber: msg.customerPartNumber || msg.partNumber || 'UNKNOWN',
        description: msg.description || 'Unknown Part',
        commodity: msg.commodity || 'Unknown',
        color: msg.color || '',
        status: 'pending',
        receivedAt: new Date(),
        rackId: null,
        rackSlot: null,
        kitComponents: null,
        protocol: msg.protocol || state.msqm.mode,
      };

      // Find matching part to get kit components
      const matchingPart = state.parts.find(p => p.partNumber === seqEntry.partNumber);
      if (matchingPart && matchingPart.kitComponents) {
        seqEntry.kitComponents = matchingPart.kitComponents;
      }

      // Deduplicate — don't add if sequence number already exists
      const exists = state.sequences.find(s => s.sequenceNumber === seqNum);
      if (!exists) {
        state.sequences.push(seqEntry);
        state.msqm.sequenceCounter = Math.max(state.msqm.sequenceCounter, seqNum + 1);

        msqmLog('broadcast', 'BROADCAST', `Seq #${seqNum} | VIN ${seqEntry.vin} | ${seqEntry.lineName} | ${seqEntry.partNumber} [${msg.protocol}]`);
        msqmLog('demand', 'DEMAND', `${seqEntry.description} → Line ${seqEntry.lineId} (OEM: ${seqEntry.oem})`);
        msqmLog('ack', 'ACK', `Processed — Seq #${seqNum} accepted via ${msg.protocol}`);
      }
    } else if (msg.type === 'scan') {
      // Serial scan input
      if (msg.code) {
        processScan(msg.code);
      }
    } else if (msg.type === 'error') {
      msqmLog('error', 'ERROR', msg.message || 'Protocol error');
    } else if (msg.type === 'info') {
      msqmLog('info', 'INFO', msg.message || '');
    }

    if (window.AutoSeqUI) {
      window.AutoSeqUI.updateLiveIndicator();
      window.AutoSeqUI.refreshCurrentView();
    }

    // Auto-save state
    if (state.persistence.autoSave) saveState();
  }

  function msqmPulse() {
    // Simulate OEM broadcast: a vehicle passes a trigger point
    const vin = generateVIN();
    const seqNum = state.msqm.sequenceCounter++;
    const line = state.lines[Math.floor(Math.random() * state.lines.length)];
    const compatibleParts = state.parts.filter(p =>
      p.rackSlotType === line.rackType || p.commodity === line.commodity
    );
    const part = compatibleParts.length > 0
      ? compatibleParts[Math.floor(Math.random() * compatibleParts.length)]
      : state.parts[0];

    const broadcast = {
      sequenceNumber: seqNum,
      vin: vin,
      lineId: line.id,
      oem: line.oem,
      partNumber: part.partNumber,
      customerPartNumber: part.customerPartNumber,
      description: part.description,
      timestamp: new Date().toISOString(),
      opCode: 'OP-100',
    };

    // Create a sequence entry from the broadcast
    const seqEntry = {
      id: `SEQ-${String(seqNum).padStart(5, '0')}`,
      sequenceNumber: seqNum,
      vin: vin,
      lineId: line.id,
      lineName: line.name,
      oem: line.oem,
      partNumber: part.partNumber,
      customerPartNumber: part.customerPartNumber,
      description: part.description,
      commodity: part.commodity,
      color: part.color,
      status: 'pending',
      receivedAt: new Date(),
      rackId: null,
      rackSlot: null,
      kitComponents: part.kitComponents || null,
    };

    state.sequences.push(seqEntry);

    msqmLog('broadcast', 'BROADCAST', `Seq #${seqNum} | VIN ${vin} | ${line.name} | ${part.partNumber}`);
    msqmLog('demand', 'DEMAND', `${part.description} → Line ${line.id} (OEM: ${line.oem})`);
    msqmLog('ack', 'ACK', `EDI 866 processed — Seq #${seqNum} accepted`);

    if (window.AutoSeqUI) {
      window.AutoSeqUI.updateLiveIndicator();
      window.AutoSeqUI.refreshCurrentView();
    }
  }

  function msqmLog(type, tag, msg) {
    const entry = {
      time: new Date(),
      type: type,
      tag: tag,
      msg: msg,
    };
    state.msqmLog.unshift(entry);
    if (state.msqmLog.length > 200) state.msqmLog.pop();
    if (window.AutoSeqUI && state.activeView === 'msqm') window.AutoSeqUI.appendMSQMEntry(entry);
  }

  function generateVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    // Harley-Davidson VINs start with 1HD or 5HD
    if (Math.random() < 0.25) {
      vin = (Math.random() < 0.5 ? '1HD' : '5HD');
      for (let i = 0; i < 14; i++) {
        vin += chars[Math.floor(Math.random() * chars.length)];
      }
    } else {
      for (let i = 0; i < 17; i++) {
        vin += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return vin;
  }

  // ── Barcode Scanner Engine ────────────────────────────────
  // Supports keyboard-wedge scanners (rapid key entry ending with Enter)
  function initScanner() {
    document.addEventListener('keydown', (e) => {
      // Only capture if scanner input is the active element or always-capture mode
      const scannerInput = document.getElementById('scanner-input');
      const isScannerFocused = scannerInput && document.activeElement === scannerInput;

      if (e.key === 'Enter') {
        if (state.scanner.collecting && state.scanner.buffer.length > 0) {
          const code = state.scanner.buffer.trim();
          state.scanner.lastScan = code;
          state.scanner.buffer = '';
          state.scanner.collecting = false;
          processScan(code);
        } else if (isScannerFocused && scannerInput.value.trim().length > 0) {
          const code = scannerInput.value.trim();
          scannerInput.value = '';
          processScan(code);
        }
        return;
      }

      // Collect rapid key presses (scanner pattern: fast typing)
      if (e.key.length === 1) {
        const now = Date.now();
        if (!state.scanner.collecting || (now - state.scanner.startTime) > 100) {
          state.scanner.collecting = true;
          state.scanner.startTime = now;
          state.scanner.buffer = '';
        }
        state.scanner.buffer += e.key;
      }
    });
  }

  function processScan(code) {
    beep('scan');
    const scanEntry = {
      id: Date.now(),
      code: code,
      time: new Date(),
      result: 'pending',
      detail: '',
    };
    state.scanLog.unshift(scanEntry);
    if (state.scanLog.length > 100) state.scanLog.pop();

    // Determine scan context based on active view
    if (state.activeView === 'rack-loading' && state.currentRack) {
      handleRackScan(code, scanEntry);
    } else if (state.activeView === 'kitting' && state.currentKit) {
      handleKitScan(code, scanEntry);
    } else if (state.activeView === 'sequence') {
      handleSequenceScan(code, scanEntry);
    } else {
      // Generic lookup
      const part = lookupPart(code);
      if (part) {
        scanEntry.result = 'ok';
        scanEntry.detail = `Part found: ${part.description}`;
        beep('ok');
      } else {
        scanEntry.result = 'err';
        scanEntry.detail = 'No matching part found';
        beep('err');
      }
    }

    if (window.AutoSeqUI) window.AutoSeqUI.appendScanEntry(scanEntry);
  }

  function lookupPart(code) {
    return state.parts.find(p =>
      p.partNumber === code ||
      p.customerPartNumber === code
    );
  }

  function lookupSequence(code) {
    // Match by sequence number, VIN, or part number
    const seqNum = parseInt(code.replace(/[^0-9]/g, ''));
    return state.sequences.find(s =>
      s.sequenceNumber === seqNum ||
      s.vin === code ||
      s.partNumber === code ||
      s.id === code
    );
  }

  // ── Rack Scan Handler (Poka-Yoke Validation) ───────────────
  function handleRackScan(code, scanEntry) {
    const rack = state.currentRack;
    if (!rack) return;

    // Check if it's a part barcode
    const part = lookupPart(code);
    if (part) {
      // Find the expected part for the next slot
      const nextSlotIdx = rack.slots.findIndex(s => s.status === 'empty');
      if (nextSlotIdx === -1) {
        scanEntry.result = 'err';
        scanEntry.detail = 'Rack is full — no empty slots';
        beep('err');
        alert('warning', 'Rack Full', 'All slots have been loaded. Print rack label and stage.');
        return;
      }

      const expectedSlot = rack.slots[nextSlotIdx];
      // Find the sequence that expects this part for this slot
      const expectedSeq = state.sequences.find(s =>
        s.lineId === rack.lineId &&
        s.status === 'pending' &&
        s.rackId === null
      );

      if (expectedSlot.expectedPart && expectedSlot.expectedPart !== part.partNumber) {
        // Poka-yoke: wrong part!
        scanEntry.result = 'err';
        scanEntry.detail = `WRONG PART! Slot ${nextSlotIdx + 1} expects ${expectedSlot.expectedPart}, got ${part.partNumber}`;
        beep('err');
        rack.slots[nextSlotIdx].status = 'error';
        rack.slots[nextSlotIdx].scannedPart = part.partNumber;
        rack.errors = (rack.errors || 0) + 1;
        alert('error', 'Poka-Yoke Alert', `Wrong part for slot ${nextSlotIdx + 1}. Expected: ${expectedSlot.expectedPart}`);
      } else {
        // Correct part — load it
        rack.slots[nextSlotIdx].status = 'loaded';
        rack.slots[nextSlotIdx].scannedPart = part.partNumber;
        rack.slots[nextSlotIdx].scannedAt = new Date();
        rack.loadedCount++;

        if (expectedSeq) {
          expectedSeq.status = 'loaded';
          expectedSeq.rackId = rack.id;
          expectedSeq.rackSlot = nextSlotIdx + 1;
        }

        // Set expected part for next slot
        if (nextSlotIdx + 1 < rack.slots.length) {
          const nextSeq = state.sequences.find(s =>
            s.lineId === rack.lineId && s.status === 'pending' && s.rackId === null
          );
          if (nextSeq) {
            rack.slots[nextSlotIdx + 1].expectedPart = nextSeq.partNumber;
          }
        }

        scanEntry.result = 'ok';
        scanEntry.detail = `Slot ${nextSlotIdx + 1} loaded — ${part.description}`;
        beep('ok');

        // Check if rack is full
        if (rack.loadedCount === rack.slots.length) {
          rack.status = 'complete';
          alert('success', 'Rack Complete', `Rack ${rack.id} fully loaded. Ready for label and staging.`);
        }
      }

      if (window.AutoSeqUI) window.AutoSeqUI.refreshRackGrid();
    } else {
      // Try sequence number
      const seq = lookupSequence(code);
      if (seq) {
        scanEntry.result = 'ok';
        scanEntry.detail = `Sequence #${seq.sequenceNumber} — ${seq.description}`;
        beep('ok');
      } else {
        scanEntry.result = 'err';
        scanEntry.detail = `Unrecognized barcode: ${code}`;
        beep('err');
      }
    }
  }

  // ── Kit Scan Handler ───────────────────────────────────────
  function handleKitScan(code, scanEntry) {
    const kit = state.currentKit;
    if (!kit || !kit.components) return;

    const comp = kit.components.find(c => c.partNumber === code && !c.scanned);
    if (comp) {
      comp.scanned = true;
      comp.scannedAt = new Date();
      scanEntry.result = 'ok';
      scanEntry.detail = `${comp.component} verified`;
      beep('ok');

      const allScanned = kit.components.every(c => c.scanned);
      if (allScanned) {
        kit.status = 'complete';
        alert('success', 'Kit Complete', `All components verified for kit ${kit.id}`);
      }
      if (window.AutoSeqUI) window.AutoSeqUI.refreshKitChecklist();
    } else {
      // Check if already scanned
      const alreadyScanned = kit.components.find(c => c.partNumber === code && c.scanned);
      if (alreadyScanned) {
        scanEntry.result = 'err';
        scanEntry.detail = `${alreadyScanned.component} already scanned`;
        beep('err');
      } else {
        scanEntry.result = 'err';
        scanEntry.detail = `Component ${code} not in kit`;
        beep('err');
        alert('error', 'Wrong Component', `${code} does not belong to this kit`);
      }
    }
  }

  function handleSequenceScan(code, scanEntry) {
    const seq = lookupSequence(code);
    if (seq) {
      scanEntry.result = 'ok';
      scanEntry.detail = `Seq #${seq.sequenceNumber} | VIN ${seq.vin} | ${seq.description}`;
      beep('ok');
      if (window.AutoSeqUI) window.AutoSeqUI.highlightSequence(seq.id);
    } else {
      const part = lookupPart(code);
      if (part) {
        scanEntry.result = 'ok';
        scanEntry.detail = `Part: ${part.description}`;
        beep('ok');
      } else {
        scanEntry.result = 'err';
        scanEntry.detail = `No match for ${code}`;
        beep('err');
      }
    }
  }

  // ── Rack Creation ──────────────────────────────────────────
  function createRack(lineId, rackTypeId) {
    const line = state.lines.find(l => l.id === lineId);
    const rackType = state.rackTypes.find(r => r.id === rackTypeId);
    if (!line || !rackType) return null;

    // Find commodity config for this line's commodity
    const commodity = state.commodities.find(c =>
      c.name === line.commodity || c.code === (line.commodity || '').toUpperCase().replace(/[^A-Z0-9]/g, '_')
    );

    // Determine loading pattern from commodity config or rack type default
    const loadPattern = (commodity && commodity.loadPattern) || rackType.pattern;
    const stagingLane = (commodity && commodity.stagingLane) || '';
    const dockDoor = (commodity && commodity.dockDoor) || '';
    const deliveryRoute = (commodity && commodity.deliveryRoute) || '';
    const taktTime = (commodity && commodity.taktTime) || 60;
    const lineSidePresentation = (commodity && commodity.lineSidePresentation) || 'sequential';

    const rack = {
      id: `RACK-${Date.now().toString().slice(-6)}`,
      lineId: lineId,
      lineName: line.name,
      rackType: rackType.id,
      rackTypeName: rackType.name,
      pattern: loadPattern,
      slotCount: rackType.slotCount,
      gridRows: rackType.gridRows,
      gridCols: rackType.gridCols,
      slots: [],
      loadedCount: 0,
      errors: 0,
      status: 'active',
      createdAt: new Date(),
      // Sequencing & Delivery Config (from commodity master)
      commodityName: line.commodity || '',
      dockDoor: dockDoor,
      deliveryRoute: deliveryRoute,
      stagingLane: stagingLane,
      taktTime: taktTime,
      lineSidePresentation: lineSidePresentation,
      oemPlant: (commodity && commodity.oemPlant) || '',
      deliveryWindow: (commodity && commodity.deliveryWindow) || '',
      loadPattern: loadPattern,
      unloadPattern: (commodity && commodity.unloadPattern) || loadPattern,
    };

    // Initialize slots based on pattern
    for (let i = 0; i < rackType.slotCount; i++) {
      const displayPosition = rackType.pattern === 'reverse'
        ? rackType.slotCount - i
        : i + 1;
      rack.slots.push({
        slotNumber: displayPosition,
        slotIndex: i,
        status: 'empty',
        expectedPart: null,
        scannedPart: null,
        scannedAt: null,
      });
    }

    // Set expected part for first slot from pending sequences
    const firstSeq = state.sequences.find(s =>
      s.lineId === lineId && s.status === 'pending' && s.rackId === null
    );
    if (firstSeq && rack.slots.length > 0) {
      rack.slots[0].expectedPart = firstSeq.partNumber;
    }

    state.racks.push(rack);
    state.currentRack = rack;
    return rack;
  }

  // ── Kit Creation ───────────────────────────────────────────
  function createKit(partNumber) {
    const part = state.parts.find(p => p.partNumber === partNumber);
    if (!part || !part.kitComponents) return null;

    const kit = {
      id: `KIT-${Date.now().toString().slice(-6)}`,
      partNumber: part.partNumber,
      description: part.description,
      components: part.kitComponents.map(c => ({
        component: c.component,
        partNumber: c.partNumber,
        qty: c.qty,
        scanned: false,
        scannedAt: null,
      })),
      status: 'active',
      createdAt: new Date(),
    };

    state.kits.push(kit);
    state.currentKit = kit;
    return kit;
  }

  // ── SAP/CGM Export ─────────────────────────────────────────
  function generateSAPExport() {
    const lines = [];
    lines.push('# OwlLogics SAP/CGM Export');
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('# Format: IDoc-style flat file for SAP ERP integration');
    lines.push('');

    // Header
    lines.push('HDR|OWLLOGICS_EXPORT|' + new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    lines.push('');

    // Sequence entries
    state.sequences.forEach(seq => {
      lines.push([
        'SEQ',
        seq.id,
        seq.sequenceNumber,
        seq.vin,
        seq.lineId,
        seq.partNumber,
        seq.customerPartNumber,
        seq.status.toUpperCase(),
        seq.rackId || '',
        seq.rackSlot || '',
        seq.receivedAt ? seq.receivedAt.toISOString() : '',
      ].join('|'));
    });

    lines.push('');

    // Rack entries
    state.racks.forEach(rack => {
      lines.push([
        'RACK',
        rack.id,
        rack.lineId,
        rack.rackType,
        rack.status.toUpperCase(),
        rack.loadedCount,
        rack.slotCount,
        rack.errors,
        rack.createdAt ? rack.createdAt.toISOString() : '',
      ].join('|'));
    });

    lines.push('');

    // Op Code log
    state.scanLog.forEach(scan => {
      lines.push([
        'SCAN',
        scan.time ? scan.time.toISOString() : '',
        scan.code,
        scan.result.toUpperCase(),
        scan.detail.replace(/[|]/g, ';'),
      ].join('|'));
    });

    lines.push('');
    lines.push('EOF|' + state.sequences.length + '|' + state.racks.length + '|' + state.scanLog.length);
    return lines.join('\n');
  }

  function generateCGMXML() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<CGM_Export xmlns="urn:owllogics:cgm:v1" generated="' + new Date().toISOString() + '">\n';
    xml += '  <Sequences count="' + state.sequences.length + '">\n';
    state.sequences.forEach(seq => {
      xml += '    <Sequence id="' + seq.id + '">\n';
      xml += '      <SeqNumber>' + seq.sequenceNumber + '</SeqNumber>\n';
      xml += '      <VIN>' + seq.vin + '</VIN>\n';
      xml += '      <Line>' + seq.lineId + '</Line>\n';
      xml += '      <OEM>' + seq.oem + '</OEM>\n';
      xml += '      <PartNumber>' + seq.partNumber + '</PartNumber>\n';
      xml += '      <CustomerPartNumber>' + seq.customerPartNumber + '</CustomerPartNumber>\n';
      xml += '      <Description>' + seq.description + '</Description>\n';
      xml += '      <Status>' + seq.status + '</Status>\n';
      xml += '      <RackId>' + (seq.rackId || '') + '</RackId>\n';
      xml += '      <RackSlot>' + (seq.rackSlot || '') + '</RackSlot>\n';
      xml += '    </Sequence>\n';
    });
    xml += '  </Sequences>\n';
    xml += '  <Racks count="' + state.racks.length + '">\n';
    state.racks.forEach(rack => {
      xml += '    <Rack id="' + rack.id + '">\n';
      xml += '      <Line>' + rack.lineId + '</Line>\n';
      xml += '      <Type>' + rack.rackType + '</Type>\n';
      xml += '      <Status>' + rack.status + '</Status>\n';
      xml += '      <Loaded>' + rack.loadedCount + '</Loaded>\n';
      xml += '      <Capacity>' + rack.slotCount + '</Capacity>\n';
      xml += '    </Rack>\n';
    });
    xml += '  </Racks>\n';
    xml += '</CGM_Export>';
    return xml;
  }

  // ── Label Generation ───────────────────────────────────────
  function generatePartLabel(seq) {
    return {
      type: 'part',
      sequenceNumber: seq.sequenceNumber,
      vin: seq.vin,
      partNumber: seq.partNumber,
      customerPartNumber: seq.customerPartNumber,
      description: seq.description,
      lineId: seq.lineId,
      oem: seq.oem,
      barcode: `*${seq.partNumber}*`,
    };
  }

  function generateRackLabel(rack) {
    const loadedSlots = rack.slots.filter(s => s.status === 'loaded');
    const seqNumbers = loadedSlots.map((s, i) => {
      const seq = state.sequences.find(sq => sq.rackId === rack.id && sq.rackSlot === s.slotNumber);
      return seq ? seq.sequenceNumber : null;
    }).filter(n => n !== null);

    const highSeq = seqNumbers.length ? Math.max(...seqNumbers) : 0;
    const lowSeq = seqNumbers.length ? Math.min(...seqNumbers) : 0;

    return {
      type: 'rack',
      rackId: rack.id,
      lineId: rack.lineId,
      lineName: rack.lineName,
      rackType: rack.rackTypeName,
      pattern: rack.pattern,
      highSeq: highSeq,
      lowSeq: lowSeq,
      loadedCount: rack.loadedCount,
      slotCount: rack.slotCount,
      gridRows: rack.gridRows,
      gridCols: rack.gridCols,
      slots: rack.slots,
      barcode: `*${rack.id}*`,
    };
  }

  // ── Stats ──────────────────────────────────────────────────
  function getStats() {
    return {
      totalSequences: state.sequences.length,
      pending: state.sequences.filter(s => s.status === 'pending').length,
      loaded: state.sequences.filter(s => s.status === 'loaded').length,
      complete: state.sequences.filter(s => s.status === 'complete').length,
      totalRacks: state.racks.length,
      activeRacks: state.racks.filter(r => r.status === 'active').length,
      completeRacks: state.racks.filter(r => r.status === 'complete').length,
      rackErrors: state.racks.reduce((sum, r) => sum + (r.errors || 0), 0),
      totalKits: state.kits.length,
      completeKits: state.kits.filter(k => k.status === 'complete').length,
      totalScans: state.scanLog.length,
      okScans: state.scanLog.filter(s => s.result === 'ok').length,
      errScans: state.scanLog.filter(s => s.result === 'err').length,
      msqmConnected: state.msqm.connected,
      msqmRunning: state.msqm.running,
      lines: state.lines.length,
      opCodes: state.opCodes.length,
    };
  }

  // ── Commodity & Item Master Data ──────────────────────────

  function initMasterData() {
    // Seed commodities from existing parts if empty
    if (state.commodities.length === 0) {
      const commodityMap = {};
      state.parts.forEach(p => {
        if (!commodityMap[p.commodity]) {
          commodityMap[p.commodity] = {
            id: 'COM-' + String(Object.keys(commodityMap).length + 1).padStart(3, '0'),
            code: p.commodity.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
            name: p.commodity,
            description: p.commodity + ' commodity group',
            rackType: p.rackSlotType,
            pickingPattern: p.pickingPattern,
            active: true,
          };
        }
      });
      state.commodities = Object.values(commodityMap);
    }

    // Seed items from existing parts if empty
    if (state.items.length === 0) {
      state.items = state.parts.map((p, i) => ({
        id: 'ITM-' + String(i + 1).padStart(4, '0'),
        itemNumber: p.partNumber,
        customerPartNumber: p.customerPartNumber,
        description: p.description,
        commodityCode: p.commodity.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        commodityName: p.commodity,
        color: p.color,
        weight: p.weight,
        uom: 'EA',
        rackType: p.rackSlotType,
        pickingPattern: p.pickingPattern,
        kitComponents: p.kitComponents || null,
        active: true,
        createdAt: new Date().toISOString(),
      }));
    }
  }

  // Commodity CRUD
  function addCommodity(data) {
    const com = {
      id: 'COM-' + String(state.commodities.length + 1).padStart(3, '0'),
      code: data.code || data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      name: data.name || 'New Commodity',
      description: data.description || '',
      rackType: data.rackType || 'small_parts_bin',
      pickingPattern: data.pickingPattern || 'forward',
      active: data.active !== false,
      // Sequencing & Delivery Configuration
      dockDoor: data.dockDoor || '',
      deliveryRoute: data.deliveryRoute || '',
      stagingLane: data.stagingLane || '',
      lineSidePresentation: data.lineSidePresentation || 'sequential',
      taktTime: data.taktTime || 60,
      rackCapacity: data.rackCapacity || 0,
      loadPattern: data.loadPattern || 'forward',
      unloadPattern: data.unloadPattern || 'forward',
      deliveryWindow: data.deliveryWindow || '',
      oemPlant: data.oemPlant || '',
      packagingType: data.packagingType || 'returnable',
      hazmatFlag: data.hazmatFlag || false,
    };
    state.commodities.push(com);
    if (state.persistence.autoSave) saveState();
    return com;
  }

  function updateCommodity(id, data) {
    const com = state.commodities.find(c => c.id === id);
    if (!com) return null;
    Object.assign(com, data);
    if (state.persistence.autoSave) saveState();
    return com;
  }

  function deleteCommodity(id) {
    const idx = state.commodities.findIndex(c => c.id === id);
    if (idx === -1) return false;
    state.commodities.splice(idx, 1);
    if (state.persistence.autoSave) saveState();
    return true;
  }

  // Item CRUD
  function addItem(data) {
    const item = {
      id: 'ITM-' + String(state.items.length + 1).padStart(4, '0'),
      itemNumber: data.itemNumber || 'NEW-ITEM-' + Date.now().toString().slice(-4),
      customerPartNumber: data.customerPartNumber || '',
      description: data.description || 'New Item',
      commodityCode: data.commodityCode || '',
      commodityName: data.commodityName || data.commodityCode || '',
      color: data.color || '',
      weight: data.weight || 0,
      uom: data.uom || 'EA',
      rackType: data.rackType || 'small_parts_bin',
      pickingPattern: data.pickingPattern || 'forward',
      kitComponents: data.kitComponents || null,
      active: data.active !== false,
      createdAt: new Date().toISOString(),
      // Sequencing & Presentation Configuration
      slotPosition: data.slotPosition || 0,
      orientation: data.orientation || 'face-up',
      presentationOrder: data.presentationOrder || 0,
      kittingRequired: data.kittingRequired || false,
      sequencePriority: data.sequencePriority || 'normal',
      lineSideLocation: data.lineSideLocation || '',
      packagingStandard: data.packagingStandard || '',
      labelType: data.labelType || 'AIAG-B3',
      barcodeFormat: data.barcodeFormat || 'code128',
    };
    state.items.push(item);
    if (state.persistence.autoSave) saveState();
    return item;
  }

  function updateItem(id, data) {
    const item = state.items.find(i => i.id === id);
    if (!item) return null;
    Object.assign(item, data);
    if (state.persistence.autoSave) saveState();
    return item;
  }

  function deleteItem(id) {
    const idx = state.items.findIndex(i => i.id === id);
    if (idx === -1) return false;
    state.items.splice(idx, 1);
    if (state.persistence.autoSave) saveState();
    return true;
  }

  function lookupItem(itemNumber) {
    return state.items.find(i =>
      i.itemNumber === itemNumber ||
      i.customerPartNumber === itemNumber ||
      i.id === itemNumber
    );
  }

  // ── Forklift Fleet (Mitsubishi Logisnext) ─────────────────

  function initForklifts() {
    if (state.forklifts.length > 0) return;
    state.forklifts = [
      { id: 'FL-001', unitNumber: 'MIT-1043', brand: 'Mitsubishi', model: 'FBC20Q', type: 'Electric Cushion', capacity: 4000, powerSource: 'electric', batterySN: 'BAT-2024-001', serialNumber: '1FBC20Q2024001', status: 'active', assignedDriver: '', currentLocation: 'Bldg A (Sequencing)', telematicsId: 'LL-TM-001', hourMeter: 1245, liftLinkConnected: true, maintenanceDue: 1500, maintenanceStatus: 'ok', notes: '', sapEquipmentNumber: '10000043', sapFunctionalLocation: 'FL-A-WHS-001', sapCostCenter: 'CC-5210-WHS', sapWorkCenter: 'WC-MAINT-01', sapPlant: '1000', sapCompanyCode: '1000', sapAssetNumber: 'ASSET-2024-1043', sapMeasurementPoint: 'MP-001-FL001', sapPmOrderStatus: 'none', sapActivePmOrder: '', sapLastServiceDate: '2024-06-15', sapNextServiceDate: '2024-12-15', sapEquipmentCategory: 'F', sapObjectStatus: 'INST', sapManufacturer: 'MITSUBISHI', sapModelNumber: 'FBC20Q', sapConstructionYear: '2024', sapConstructionMonth: '01', sapStartupDate: '2024-01-15', sapWarrantyEnd: '2027-01-15', sapMaintenancePlant: '1000', sapPlanningPlant: '1000', sapAbcIndicator: 'A', sapSortField: 'FL-001-MIT-1043', sapOrderHistory: [] },
      { id: 'FL-002', unitNumber: 'CAT-2207', brand: 'Cat', model: 'GP25N', type: 'IC Pneumatic', capacity: 5000, powerSource: 'lpg', batterySN: '', serialNumber: '1GP25N2024002', status: 'active', assignedDriver: '', currentLocation: 'Bldg B (Staging)', telematicsId: 'LL-TM-002', hourMeter: 890, liftLinkConnected: true, maintenanceDue: 1000, maintenanceStatus: 'ok', notes: '', sapEquipmentNumber: '10000044', sapFunctionalLocation: 'FL-B-STG-002', sapCostCenter: 'CC-5210-STG', sapWorkCenter: 'WC-MAINT-01', sapPlant: '1000', sapCompanyCode: '1000', sapAssetNumber: 'ASSET-2024-2207', sapMeasurementPoint: 'MP-001-FL002', sapPmOrderStatus: 'none', sapActivePmOrder: '', sapLastServiceDate: '2024-07-01', sapNextServiceDate: '2025-01-01', sapEquipmentCategory: 'F', sapObjectStatus: 'INST', sapManufacturer: 'CAT', sapModelNumber: 'GP25N', sapConstructionYear: '2024', sapConstructionMonth: '02', sapStartupDate: '2024-02-01', sapWarrantyEnd: '2027-02-01', sapMaintenancePlant: '1000', sapPlanningPlant: '1000', sapAbcIndicator: 'B', sapSortField: 'FL-002-CAT-2207', sapOrderHistory: [] },
      { id: 'FL-003', unitNumber: 'JH-4456', brand: 'Jungheinrich', model: 'ETV 216', type: 'Reach Truck', capacity: 3500, powerSource: 'electric', batterySN: 'BAT-2024-003', serialNumber: '1ETV2162024003', status: 'active', assignedDriver: '', currentLocation: 'Bldg E (Warehouse)', telematicsId: 'LL-TM-003', hourMeter: 2100, liftLinkConnected: true, maintenanceDue: 2000, maintenanceStatus: 'overdue', notes: 'Needs hydraulic fluid check', sapEquipmentNumber: '10000045', sapFunctionalLocation: 'FL-E-WHS-003', sapCostCenter: 'CC-5210-WHS', sapWorkCenter: 'WC-MAINT-02', sapPlant: '1000', sapCompanyCode: '1000', sapAssetNumber: 'ASSET-2024-4456', sapMeasurementPoint: 'MP-001-FL003', sapPmOrderStatus: 'open', sapActivePmOrder: '4000456', sapLastServiceDate: '2024-03-10', sapNextServiceDate: '2024-09-10', sapEquipmentCategory: 'F', sapObjectStatus: 'INST', sapManufacturer: 'JUNGHEINRICH', sapModelNumber: 'ETV216', sapConstructionYear: '2023', sapConstructionMonth: '11', sapStartupDate: '2023-12-01', sapWarrantyEnd: '2026-12-01', sapMaintenancePlant: '1000', sapPlanningPlant: '1000', sapAbcIndicator: 'A', sapSortField: 'FL-003-JH-4456', sapOrderHistory: [{ order: '4000456', type: 'PM01', date: '2024-09-10', desc: 'Overdue A-service + hydraulic check', status: 'open' }] },
      { id: 'FL-004', unitNumber: 'UC-1109', brand: 'UniCarriers', model: 'SX2', type: 'Electric Pallet', capacity: 4500, powerSource: 'electric', batterySN: 'BAT-2024-004', serialNumber: '1SX22024004', status: 'active', assignedDriver: '', currentLocation: 'Bldg D (Kitting)', telematicsId: 'LL-TM-004', hourMeter: 560, liftLinkConnected: true, maintenanceDue: 750, maintenanceStatus: 'ok', notes: '', sapEquipmentNumber: '10000046', sapFunctionalLocation: 'FL-D-KIT-004', sapCostCenter: 'CC-5210-KIT', sapWorkCenter: 'WC-MAINT-01', sapPlant: '1000', sapCompanyCode: '1000', sapAssetNumber: 'ASSET-2024-1109', sapMeasurementPoint: 'MP-001-FL004', sapPmOrderStatus: 'none', sapActivePmOrder: '', sapLastServiceDate: '2024-08-01', sapNextServiceDate: '2025-02-01', sapEquipmentCategory: 'F', sapObjectStatus: 'INST', sapManufacturer: 'UNICARRIERS', sapModelNumber: 'SX2', sapConstructionYear: '2024', sapConstructionMonth: '03', sapStartupDate: '2024-03-15', sapWarrantyEnd: '2027-03-15', sapMaintenancePlant: '1000', sapPlanningPlant: '1000', sapAbcIndicator: 'C', sapSortField: 'FL-004-UC-1109', sapOrderHistory: [] },
      { id: 'FL-005', unitNumber: 'MIT-1044', brand: 'Mitsubishi', model: 'FBC30Q', type: 'Electric Cushion', capacity: 6000, powerSource: 'electric', batterySN: 'BAT-2024-005', serialNumber: '1FBC30Q2024005', status: 'active', assignedDriver: '', currentLocation: 'Bldg C (Dock)', telematicsId: 'LL-TM-005', hourMeter: 1890, liftLinkConnected: true, maintenanceDue: 2000, maintenanceStatus: 'due', notes: 'A-service scheduled', sapEquipmentNumber: '10000047', sapFunctionalLocation: 'FL-C-DCK-005', sapCostCenter: 'CC-5210-DCK', sapWorkCenter: 'WC-MAINT-02', sapPlant: '1000', sapCompanyCode: '1000', sapAssetNumber: 'ASSET-2024-1044', sapMeasurementPoint: 'MP-001-FL005', sapPmOrderStatus: 'created', sapActivePmOrder: '4000471', sapLastServiceDate: '2024-05-20', sapNextServiceDate: '2024-11-20', sapEquipmentCategory: 'F', sapObjectStatus: 'INST', sapManufacturer: 'MITSUBISHI', sapModelNumber: 'FBC30Q', sapConstructionYear: '2024', sapConstructionMonth: '01', sapStartupDate: '2024-01-20', sapWarrantyEnd: '2027-01-20', sapMaintenancePlant: '1000', sapPlanningPlant: '1000', sapAbcIndicator: 'A', sapSortField: 'FL-005-MIT-1044', sapOrderHistory: [{ order: '4000471', type: 'PM02', date: '2024-11-20', desc: 'A-service due', status: 'created' }] },
      { id: 'FL-006', unitNumber: 'CAT-2208', brand: 'Cat', model: 'DP30N', type: 'IC Cushion', capacity: 6000, powerSource: 'diesel', batterySN: '', serialNumber: '1DP30N2024006', status: 'maintenance', assignedDriver: '', currentLocation: 'Maintenance Bay', telematicsId: 'LL-TM-006', hourMeter: 3200, liftLinkConnected: false, maintenanceDue: 3000, maintenanceStatus: 'overdue', notes: 'Transmission service in progress', sapEquipmentNumber: '10000048', sapFunctionalLocation: 'FL-MAINT-006', sapCostCenter: 'CC-5210-MAINT', sapWorkCenter: 'WC-MAINT-02', sapPlant: '1000', sapCompanyCode: '1000', sapAssetNumber: 'ASSET-2024-2208', sapMeasurementPoint: 'MP-001-FL006', sapPmOrderStatus: 'in_progress', sapActivePmOrder: '4000482', sapLastServiceDate: '2024-02-01', sapNextServiceDate: '2024-08-01', sapEquipmentCategory: 'F', sapObjectStatus: 'INST', sapManufacturer: 'CAT', sapModelNumber: 'DP30N', sapConstructionYear: '2023', sapConstructionMonth: '09', sapStartupDate: '2023-10-01', sapWarrantyEnd: '2026-10-01', sapMaintenancePlant: '1000', sapPlanningPlant: '1000', sapAbcIndicator: 'A', sapSortField: 'FL-006-CAT-2208', sapOrderHistory: [{ order: '4000482', type: 'PM03', date: '2024-10-01', desc: 'Transmission service — overdue', status: 'in_progress' }] },
    ];
  }

  function addForklift(data) {
    var fl = {
      id: 'FL-' + String(state.forklifts.length + 1).padStart(3, '0'),
      unitNumber: data.unitNumber || 'NEW-' + Date.now().toString().slice(-4),
      brand: data.brand || 'Mitsubishi',
      model: data.model || '',
      type: data.type || 'Electric Cushion',
      capacity: data.capacity || 4000,
      powerSource: data.powerSource || 'electric',
      batterySN: data.batterySN || '',
      serialNumber: data.serialNumber || '',
      status: data.status || 'active',
      assignedDriver: data.assignedDriver || '',
      currentLocation: data.currentLocation || '',
      telematicsId: data.telematicsId || '',
      hourMeter: data.hourMeter || 0,
      liftLinkConnected: data.liftLinkConnected !== false,
      maintenanceDue: data.maintenanceDue || 500,
      maintenanceStatus: data.maintenanceStatus || 'ok',
      notes: data.notes || '',
      // SAP PM Integration Fields
      sapEquipmentNumber: data.sapEquipmentNumber || '',
      sapFunctionalLocation: data.sapFunctionalLocation || '',
      sapCostCenter: data.sapCostCenter || '',
      sapWorkCenter: data.sapWorkCenter || '',
      sapPlant: data.sapPlant || '',
      sapCompanyCode: data.sapCompanyCode || '',
      sapAssetNumber: data.sapAssetNumber || '',
      sapMeasurementPoint: data.sapMeasurementPoint || '',
      sapPmOrderStatus: data.sapPmOrderStatus || 'none',
      sapActivePmOrder: data.sapActivePmOrder || '',
      sapLastServiceDate: data.sapLastServiceDate || '',
      sapNextServiceDate: data.sapNextServiceDate || '',
      sapEquipmentCategory: data.sapEquipmentCategory || 'F',
      sapObjectStatus: data.sapObjectStatus || 'INST',
      sapManufacturer: data.sapManufacturer || '',
      sapModelNumber: data.sapModelNumber || '',
      sapConstructionYear: data.sapConstructionYear || '',
      sapConstructionMonth: data.sapConstructionMonth || '',
      sapStartupDate: data.sapStartupDate || '',
      sapWarrantyEnd: data.sapWarrantyEnd || '',
      sapMaintenancePlant: data.sapMaintenancePlant || '',
      sapPlanningPlant: data.sapPlanningPlant || '',
      sapAbcIndicator: data.sapAbcIndicator || 'B',
      sapSortField: data.sapSortField || '',
      // SAP PM Order History
      sapOrderHistory: [],
    };
    state.forklifts.push(fl);
    if (state.persistence.autoSave) saveState();
    return fl;
  }

  function updateForklift(id, data) {
    var fl = state.forklifts.find(function(f) { return f.id === id; });
    if (!fl) return null;
    Object.assign(fl, data);
    if (state.persistence.autoSave) saveState();
    return fl;
  }

  function deleteForklift(id) {
    var idx = state.forklifts.findIndex(function(f) { return f.id === id; });
    if (idx === -1) return false;
    state.forklifts.splice(idx, 1);
    if (state.persistence.autoSave) saveState();
    return true;
  }

  function assignForkliftToDelivery(forkliftId, deliveryId) {
    var fl = state.forklifts.find(function(f) { return f.id === forkliftId; });
    var dlv = state.deliveries.find(function(d) { return d.id === deliveryId; });
    if (!fl || !dlv) return false;
    fl.assignedDriver = dlv.driver || fl.assignedDriver;
    fl.currentLocation = 'En route: ' + (dlv.fromBuilding || '') + ' → ' + (dlv.toBuilding || '');
    fl.status = 'assigned';
    dlv.vehicle = fl.unitNumber;
    if (state.persistence.autoSave) saveState();
    return true;
  }

  function getForkliftStats() {
    var f = state.forklifts;
    return {
      total: f.length,
      active: f.filter(function(x) { return x.status === 'active'; }).length,
      assigned: f.filter(function(x) { return x.status === 'assigned'; }).length,
      maintenance: f.filter(function(x) { return x.status === 'maintenance'; }).length,
      telematicsConnected: f.filter(function(x) { return x.liftLinkConnected; }).length,
      maintenanceOverdue: f.filter(function(x) { return x.maintenanceStatus === 'overdue'; }).length,
      maintenanceDue: f.filter(function(x) { return x.maintenanceStatus === 'due'; }).length,
      byBrand: {
        Mitsubishi: f.filter(function(x) { return x.brand === 'Mitsubishi'; }).length,
        Cat: f.filter(function(x) { return x.brand === 'Cat'; }).length,
        Jungheinrich: f.filter(function(x) { return x.brand === 'Jungheinrich'; }).length,
        UniCarriers: f.filter(function(x) { return x.brand === 'UniCarriers'; }).length,
      },
    };
  }

  // Simulate Lift Link telematics data update
  function updateTelematics() {
    state.forklifts.forEach(function(fl) {
      if (!fl.liftLinkConnected || fl.status === 'maintenance') return;
      fl.hourMeter += Math.random() * 0.5;
      fl.hourMeter = Math.round(fl.hourMeter * 10) / 10;
      if (fl.hourMeter >= fl.maintenanceDue) {
        if (fl.maintenanceStatus !== 'overdue') {
          fl.maintenanceStatus = fl.hourMeter >= fl.maintenanceDue + 100 ? 'overdue' : 'due';
        }
      }
    });
    if (state.persistence.autoSave) saveState();
  }

  // ── Routes & Inter-Building Deliveries ────────────────────

  function initRoutes() {
    if (state.routes.length > 0) return;
    state.routes = [
      { id: 'ROUTE-01', name: 'Sequencing → Staging', fromBuilding: 'Bldg A (Sequencing)', toBuilding: 'Bldg B (Staging)', distance: 120, transitTime: 5, active: true },
      { id: 'ROUTE-02', name: 'Staging → Dock 12', fromBuilding: 'Bldg B (Staging)', toBuilding: 'Bldg C (Dock)', distance: 80, transitTime: 3, active: true },
      { id: 'ROUTE-03', name: 'Dock → OEM Plant', fromBuilding: 'Bldg C (Dock)', toBuilding: 'OEM Plant (SHAP)', distance: 1500, transitTime: 45, active: true },
      { id: 'ROUTE-04', name: 'Kitting → Sequencing', fromBuilding: 'Bldg D (Kitting)', toBuilding: 'Bldg A (Sequencing)', distance: 60, transitTime: 2, active: true },
      { id: 'ROUTE-05', name: 'Warehouse → Kitting', fromBuilding: 'Bldg E (Warehouse)', toBuilding: 'Bldg D (Kitting)', distance: 200, transitTime: 8, active: true },
    ];
  }

  function addRoute(data) {
    var route = {
      id: 'ROUTE-' + String(state.routes.length + 1).padStart(2, '0'),
      name: data.name || 'New Route',
      fromBuilding: data.fromBuilding || '',
      toBuilding: data.toBuilding || '',
      distance: data.distance || 0,
      transitTime: data.transitTime || 5,
      active: data.active !== false,
    };
    state.routes.push(route);
    if (state.persistence.autoSave) saveState();
    return route;
  }

  function updateRoute(id, data) {
    var route = state.routes.find(function(r) { return r.id === id; });
    if (!route) return null;
    Object.assign(route, data);
    if (state.persistence.autoSave) saveState();
    return route;
  }

  function deleteRoute(id) {
    var idx = state.routes.findIndex(function(r) { return r.id === id; });
    if (idx === -1) return false;
    state.routes.splice(idx, 1);
    if (state.persistence.autoSave) saveState();
    return true;
  }

  // Create a delivery ticket for moving material between buildings
  function createDelivery(data) {
    var delivery = {
      id: 'DLV-' + Date.now().toString().slice(-6),
      ticketNumber: 'TKT-' + Date.now().toString().slice(-6),
      routeId: data.routeId || '',
      routeName: data.routeName || '',
      fromBuilding: data.fromBuilding || '',
      toBuilding: data.toBuilding || '',
      rackIds: data.rackIds || [],
      driver: data.driver || '',
      vehicle: data.vehicle || '',
      status: 'pending', // pending → in_transit → delivered → confirmed
      createdAt: new Date(),
      dispatchedAt: null,
      deliveredAt: null,
      confirmedAt: null,
      notes: data.notes || '',
    };
    state.deliveries.push(delivery);
    if (state.persistence.autoSave) saveState();
    return delivery;
  }

  function updateDeliveryStatus(id, status) {
    var dlv = state.deliveries.find(function(d) { return d.id === id; });
    if (!dlv) return null;
    dlv.status = status;
    if (status === 'in_transit' && !dlv.dispatchedAt) dlv.dispatchedAt = new Date();
    if (status === 'delivered' && !dlv.deliveredAt) dlv.deliveredAt = new Date();
    if (status === 'confirmed' && !dlv.confirmedAt) dlv.confirmedAt = new Date();
    if (state.persistence.autoSave) saveState();
    return dlv;
  }

  function getDeliveryStats() {
    var d = state.deliveries;
    return {
      total: d.length,
      pending: d.filter(function(x) { return x.status === 'pending'; }).length,
      inTransit: d.filter(function(x) { return x.status === 'in_transit'; }).length,
      delivered: d.filter(function(x) { return x.status === 'delivered'; }).length,
      confirmed: d.filter(function(x) { return x.status === 'confirmed'; }).length,
    };
  }

  function getRouteStats() {
    return state.routes.map(function(r) {
      var deliveries = state.deliveries.filter(function(d) { return d.routeId === r.id; });
      return {
        routeId: r.id,
        routeName: r.name,
        from: r.fromBuilding,
        to: r.toBuilding,
        totalDeliveries: deliveries.length,
        pending: deliveries.filter(function(d) { return d.status === 'pending'; }).length,
        inTransit: deliveries.filter(function(d) { return d.status === 'in_transit'; }).length,
        delivered: deliveries.filter(function(d) { return d.status === 'delivered'; }).length,
        avgTransitTime: r.transitTime,
      };
    });
  }

  // ── Sequence Sorting & Filtering ──────────────────────────

  function sortSequences(sequences, sortBy, descending) {
    const arr = sequences.slice();
    const dir = descending ? -1 : 1;
    switch (sortBy) {
      case 'seqNum':
        arr.sort((a, b) => (a.sequenceNumber - b.sequenceNumber) * dir);
        break;
      case 'vin':
        arr.sort((a, b) => (a.vin || '').localeCompare(b.vin || '') * dir);
        break;
      case 'oem':
        arr.sort((a, b) => (a.oem || '').localeCompare(b.oem || '') * dir);
        break;
      case 'line':
        arr.sort((a, b) => (a.lineName || a.lineId || '').localeCompare(b.lineName || b.lineId || '') * dir);
        break;
      case 'part':
        arr.sort((a, b) => (a.partNumber || '').localeCompare(b.partNumber || '') * dir);
        break;
      case 'commodity':
        arr.sort((a, b) => (a.commodity || '').localeCompare(b.commodity || '') * dir);
        break;
      case 'description':
        arr.sort((a, b) => (a.description || '').localeCompare(b.description || '') * dir);
        break;
      case 'date':
        arr.sort((a, b) => {
          const da = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
          const db = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
          return (da - db) * dir;
        });
        break;
      case 'status':
        arr.sort((a, b) => (a.status || '').localeCompare(b.status || '') * dir);
        break;
      default:
        arr.sort((a, b) => (a.sequenceNumber - b.sequenceNumber) * dir);
    }
    return arr;
  }

  function filterSequences(sequences, filters) {
    filters = filters || {};
    return sequences.filter(seq => {
      // Status filter
      if (filters.status && filters.status !== 'all' && seq.status !== filters.status) return false;
      // OEM filter
      if (filters.oem && filters.oem !== 'all' && seq.oem !== filters.oem) return false;
      // Line filter
      if (filters.lineId && filters.lineId !== 'all' && seq.lineId !== filters.lineId) return false;
      // Commodity filter
      if (filters.commodity && filters.commodity !== 'all' && seq.commodity !== filters.commodity) return false;
      // Text search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const haystack = [seq.id, seq.vin, seq.partNumber, seq.customerPartNumber, seq.description, seq.oem, seq.lineName, seq.commodity, seq.color].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  function getUniqueOEMs() {
    return [...new Set(state.sequences.map(s => s.oem).filter(Boolean))];
  }

  function getUniqueLines() {
    return [...new Set(state.sequences.map(s => s.lineId).filter(Boolean))];
  }

  function getUniqueCommodities() {
    return [...new Set(state.sequences.map(s => s.commodity).filter(Boolean))];
  }

  function getSequenceSummary() {
    const summary = {};
    state.sequences.forEach(seq => {
      const key = seq.oem || 'Unknown';
      if (!summary[key]) summary[key] = { oem: key, total: 0, pending: 0, loaded: 0, complete: 0 };
      summary[key].total++;
      if (seq.status === 'pending') summary[key].pending++;
      else if (seq.status === 'loaded') summary[key].loaded++;
      else if (seq.status === 'complete') summary[key].complete++;
    });
    return Object.values(summary);
  }

  // ── State Persistence (localStorage) ───────────────────────
  function saveState() {
    if (!state.persistence.enabled) return;
    if (typeof localStorage === 'undefined') return;

    try {
      const persistData = {
        sequences: state.sequences.map(s => ({
          ...s,
          receivedAt: s.receivedAt ? s.receivedAt.toISOString() : null,
        })),
        racks: state.racks.map(r => ({
          ...r,
          createdAt: r.createdAt ? r.createdAt.toISOString() : null,
        })),
        kits: state.kits.map(k => ({
          ...k,
          createdAt: k.createdAt ? k.createdAt.toISOString() : null,
          components: k.components.map(c => ({
            ...c,
            scannedAt: c.scannedAt ? c.scannedAt.toISOString() : null,
          })),
        })),
        scanLog: state.scanLog.slice(0, 50).map(s => ({
          ...s,
          time: s.time ? s.time.toISOString() : null,
        })),
        msqmLog: state.msqmLog.slice(0, 100).map(m => ({
          ...m,
          time: m.time ? m.time.toISOString() : null,
        })),
        msqm: {
          sequenceCounter: state.msqm.sequenceCounter,
          mode: state.msqm.mode,
          pulseRate: state.msqm.pulseRate,
        },
        commodities: state.commodities,
        items: state.items,
        routes: state.routes,
        forklifts: state.forklifts,
        deliveries: state.deliveries.slice(0, 100).map(function(d) {
          return {
            id: d.id, ticketNumber: d.ticketNumber, routeId: d.routeId, routeName: d.routeName,
            fromBuilding: d.fromBuilding, toBuilding: d.toBuilding, rackIds: d.rackIds,
            driver: d.driver, vehicle: d.vehicle, status: d.status, notes: d.notes,
            createdAt: d.createdAt ? d.createdAt.toISOString() : null,
            dispatchedAt: d.dispatchedAt ? d.dispatchedAt.toISOString() : null,
            deliveredAt: d.deliveredAt ? d.deliveredAt.toISOString() : null,
            confirmedAt: d.confirmedAt ? d.confirmedAt.toISOString() : null,
          };
        }),
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(state.persistence.key, JSON.stringify(persistData));
      state.persistence.lastSaved = new Date();
    } catch (e) {
      // localStorage might be full or unavailable
    }
  }

  function loadState() {
    if (!state.persistence.enabled) return false;
    if (typeof localStorage === 'undefined') return false;

    try {
      const raw = localStorage.getItem(state.persistence.key);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || !data.savedAt) return false;

      // Restore sequences
      state.sequences = (data.sequences || []).map(s => ({
        ...s,
        receivedAt: s.receivedAt ? new Date(s.receivedAt) : null,
      }));

      // Restore racks
      state.racks = (data.racks || []).map(r => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : null,
      }));

      // Restore kits
      state.kits = (data.kits || []).map(k => ({
        ...k,
        createdAt: k.createdAt ? new Date(k.createdAt) : null,
        components: (k.components || []).map(c => ({
          ...c,
          scannedAt: c.scannedAt ? new Date(c.scannedAt) : null,
        })),
      }));

      // Restore scan log
      state.scanLog = (data.scanLog || []).map(s => ({
        ...s,
        time: s.time ? new Date(s.time) : null,
      }));

      // Restore MSQM log
      state.msqmLog = (data.msqmLog || []).map(m => ({
        ...m,
        time: m.time ? new Date(m.time) : null,
      }));

      // Restore MSQM state
      if (data.msqm) {
        state.msqm.sequenceCounter = data.msqm.sequenceCounter || 1;
        state.msqm.mode = data.msqm.mode || 'simulation';
        state.msqm.pulseRate = data.msqm.pulseRate || 5000;
      }

      // Restore master data
      state.commodities = data.commodities || [];
      state.items = data.items || [];
      state.routes = data.routes || [];
      state.forklifts = data.forklifts || [];
      state.deliveries = (data.deliveries || []).map(function(d) {
        return {
          id: d.id, ticketNumber: d.ticketNumber, routeId: d.routeId, routeName: d.routeName,
          fromBuilding: d.fromBuilding, toBuilding: d.toBuilding, rackIds: d.rackIds || [],
          driver: d.driver, vehicle: d.vehicle, status: d.status, notes: d.notes || '',
          createdAt: d.createdAt ? new Date(d.createdAt) : null,
          dispatchedAt: d.dispatchedAt ? new Date(d.dispatchedAt) : null,
          deliveredAt: d.deliveredAt ? new Date(d.deliveredAt) : null,
          confirmedAt: d.confirmedAt ? new Date(d.confirmedAt) : null,
        };
      });

      return true;
    } catch (e) {
      return false;
    }
  }

  function clearState() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(state.persistence.key);
    }
    state.sequences = [];
    state.racks = [];
    state.kits = [];
    state.scanLog = [];
    state.msqmLog = [];
    state.msqm.sequenceCounter = 1;
  }

  // ── Input Sanitization (XSS prevention) ────────────────────
  function sanitize(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    state,
    loadData,
    initScanner,
    alert,
    dismissAlert,
    beep,
    msqmStart,
    msqmStop,
    msqmLog,
    createRack,
    createKit,
    generateSAPExport,
    generateCGMXML,
    generatePartLabel,
    generateRackLabel,
    getStats,
    lookupPart,
    lookupSequence,
    processScan,
    saveState,
    loadState,
    clearState,
    sanitize,
    handleProtocolMessage,
    initMasterData,
    addCommodity,
    updateCommodity,
    deleteCommodity,
    addItem,
    updateItem,
    deleteItem,
    lookupItem,
    sortSequences,
    filterSequences,
    getUniqueOEMs,
    getUniqueLines,
    getUniqueCommodities,
    getSequenceSummary,
    initRoutes,
    addRoute,
    updateRoute,
    deleteRoute,
    createDelivery,
    updateDeliveryStatus,
    getDeliveryStats,
    getRouteStats,
    initForklifts,
    addForklift,
    updateForklift,
    deleteForklift,
    assignForkliftToDelivery,
    getForkliftStats,
    updateTelematics,
  };
})();
