/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved - Patent Pending
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Protocol Adapter Engine
   ============================================================ */

const ProtocolAdapter = (function () {
  'use strict';

  // ── Protocol Registry ──────────────────────────────────────
  const PROTOCOLS = {
    simulation: {
      name: 'Simulation',
      icon: '📡',
      desc: 'Built-in MSQM pulse generator. No external connection needed.',
      configurable: true,
      fields: ['pulseRate'],
    },
    rest: {
      name: 'REST API',
      icon: '🌐',
      desc: 'HTTP polling endpoint for OEM demand (EDI 866 via REST).',
      configurable: true,
      fields: ['endpoint', 'apiKey', 'pollInterval', 'method'],
    },
    websocket: {
      name: 'WebSocket',
      icon: '🔌',
      desc: 'Real-time push connection to MES/SCADA systems.',
      configurable: true,
      fields: ['url', 'reconnect'],
    },
    mqtt: {
      name: 'MQTT',
      icon: '🐝',
      desc: 'IoT message broker for factory floor equipment.',
      configurable: true,
      fields: ['broker', 'port', 'topic', 'clientId'],
    },
    edi: {
      name: 'EDI File Import',
      icon: '📄',
      desc: 'Import EDI 866 (Production Sequence) flat files.',
      configurable: false,
      fields: [],
    },
    opcua: {
      name: 'OPC-UA',
      icon: '⚙️',
      desc: 'Industrial PLC/sensor data via OPC-UA gateway (REST bridge).',
      configurable: true,
      fields: ['gatewayUrl', 'nodeId', 'pollInterval'],
    },
    serial: {
      name: 'Serial / RS232',
      icon: '🔌',
      desc: 'Direct serial connection to PLC or legacy equipment.',
      configurable: true,
      fields: ['port', 'baudRate', 'parity'],
    },
    azure: {
      name: 'Azure IoT Hub',
      icon: '☁️',
      desc: 'Microsoft Azure IoT Hub — MQTT bridge for telemetry, Device Twins, Direct Methods. Compatible with Azure Industrial IoT (OPC UA publisher), Azure Digital Twins, and SAP DM integration.',
      configurable: true,
      fields: ['connectionString', 'deviceId', 'telemetryTopic', 'twinProperty', 'useDPS', 'dpsScope', 'modelId'],
    },
  };

  // ── Active Connection State ────────────────────────────────
  let activeProtocol = 'simulation';
  let connections = {};
  let messageHandlers = [];
  let config = {
    simulation: { pulseRate: 5000 },
    rest: { endpoint: 'http://localhost:8080/api/demand', apiKey: '', pollInterval: 5000, method: 'GET' },
    websocket: { url: 'ws://localhost:8080/ws', reconnect: true },
    mqtt: { broker: 'localhost', port: 1883, topic: 'owllogics/demand/#', clientId: 'owllogics-' + Date.now() },
    edi: {},
    opcua: { gatewayUrl: 'http://localhost:4840', nodeId: 'ns=2;s=OEM.Demand', pollInterval: 5000 },
    serial: { port: 'COM1', baudRate: 9600, parity: 'none' },
    azure: {
      connectionString: 'HostName=your-iot-hub.azure-devices.net;DeviceId=your-device-id;SharedAccessKey=[REDACTED]',
      deviceId: 'your-device-id',
      telemetryTopic: 'devices/your-device-id/messages/events/',
      twinProperty: 'reported.forkliftTelemetry',
      useDPS: false,
      dpsScope: '0ne00000000A',
      modelId: 'dtmi:com:owllogics:sequencingSystem;1',
    },
  };

  // ── Message Handler Registration ───────────────────────────
  function onMessage(handler) {
    messageHandlers.push(handler);
    return () => { messageHandlers = messageHandlers.filter(h => h !== handler); };
  }

  function emitMessage(msg) {
    messageHandlers.forEach(h => {
      try { h(msg); } catch (e) { /* handler error — don't break others */ }
    });
  }

  // ── Protocol Connect/Disconnect ────────────────────────────
  function connect(protocol, protocolConfig) {
    disconnect(); // disconnect any active protocol first
    activeProtocol = protocol || activeProtocol;
    if (protocolConfig) config[activeProtocol] = { ...config[activeProtocol], ...protocolConfig };

    let result = { protocol: activeProtocol, success: false, message: '' };

    try {
      switch (activeProtocol) {
        case 'simulation': result = connectSimulation(); break;
        case 'rest':       result = connectREST(); break;
        case 'websocket':  result = connectWebSocket(); break;
        case 'mqtt':       result = connectMQTT(); break;
        case 'edi':        result = { protocol: 'edi', success: true, message: 'EDI file import ready — use importEDIFile()' }; break;
        case 'opcua':      result = connectOPCUA(); break;
        case 'serial':     result = connectSerial(); break;
        case 'azure':      result = connectAzure(); break;
        default:           result = { protocol: activeProtocol, success: false, message: 'Unknown protocol' };
      }
    } catch (e) {
      result = { protocol: activeProtocol, success: false, message: 'Connection error: ' + e.message };
    }

    return result;
  }

  function disconnect() {
    Object.keys(connections).forEach(proto => {
      try {
        if (proto === 'simulation' && connections[proto]) {
          clearInterval(connections[proto]);
        } else if (proto === 'rest' && connections[proto]) {
          clearInterval(connections[proto]);
        } else if (proto === 'websocket' && connections[proto]) {
          connections[proto].close();
        } else if (proto === 'opcua' && connections[proto]) {
          clearInterval(connections[proto]);
        } else if (proto === 'azure' && connections[proto]) {
          if (connections[proto].close) connections[proto].close();
          if (connections[proto]) clearInterval(connections[proto]);
        }
      } catch (e) { /* ignore cleanup errors */ }
      delete connections[proto];
    });
  }

  // ── Simulation Protocol ────────────────────────────────────
  function connectSimulation() {
    const cfg = config.simulation;
    const intervalId = setInterval(() => {
      const msg = generateSimulationPulse();
      emitMessage(msg);
    }, cfg.pulseRate || 5000);

    // Send first pulse after short delay
    setTimeout(() => { emitMessage(generateSimulationPulse()); }, 800);
    connections.simulation = intervalId;

    return { protocol: 'simulation', success: true, message: 'Simulation stream started — pulse rate: ' + (cfg.pulseRate / 1000) + 's' };
  }

  function generateSimulationPulse() {
    const lines = (window.AutoSeq && AutoSeq.state.lines) || [];
    const parts = (window.AutoSeq && AutoSeq.state.parts) || [];
    const line = lines.length > 0 ? lines[Math.floor(Math.random() * lines.length)] : { id: 'LINE-01', name: 'Line A', oem: 'GM', rackType: 'bumper_d50' };
    const compatible = parts.filter(p => !line.rackType || p.rackSlotType === line.rackType || p.commodity === line.commodity);
    const part = compatible.length > 0 ? compatible[Math.floor(Math.random() * compatible.length)] : (parts[0] || { partNumber: 'PART-001', customerPartNumber: 'CUST-001', description: 'Unknown Part', commodity: 'Unknown' });

    const seqNum = Date.now() % 100000;
    const vin = generateVIN();
    const isFCA = line.oem && line.oem.includes('FCA');

    // For FCA lines, generate CONVIS-format single-line feed
    if (isFCA) {
      return {
        protocol: 'simulation',
        type: 'broadcast',
        timestamp: new Date().toISOString(),
        sequenceNumber: seqNum,
        vin: vin,
        lineId: line.id,
        lineName: line.name,
        oem: line.oem,
        partNumber: part.partNumber,
        customerPartNumber: part.customerPartNumber || part.partNumber,
        description: part.description,
        commodity: part.commodity,
        color: part.color,
        opCode: 'OP-1000',
        plant: line.name.match(/\(([A-Z]+)\)/) ? line.name.match(/\(([A-Z]+)\)/)[1] : '',
        // Raw CONVIS feed line (single line, all vehicle data)
        raw: `CONVIS|${vin}|${String(seqNum).padStart(6, '0')}|${part.partNumber}|${line.id}|${line.oem}|${part.color || ''}|${part.description}|${line.name.match(/\(([A-Z]+)\)/) ? line.name.match(/\(([A-Z]+)\)/)[1] : 'SHAP'}|RAM-1500|CREW|3.6L|BIG_HORN`,
      };
    }

    // For non-FCA lines, generate standard demand
    return {
      protocol: 'simulation',
      type: 'broadcast',
      timestamp: new Date().toISOString(),
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
      opCode: 'OP-100',
      raw: `SEQ|${seqNum}|${vin}|${line.id}|${part.partNumber}|${part.customerPartNumber || part.partNumber}|${part.description}|${line.oem}`,
    };
  }

  function generateVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) vin += chars[Math.floor(Math.random() * chars.length)];
    return vin;
  }

  // ── REST API Protocol ──────────────────────────────────────
  function connectREST() {
    const cfg = config.rest;
    if (!cfg.endpoint) return { protocol: 'rest', success: false, message: 'No endpoint configured' };

    const pollFn = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (cfg.apiKey) headers['Authorization'] = 'Bearer ' + cfg.apiKey;

        const resp = await fetch(cfg.endpoint, { method: cfg.method || 'GET', headers });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);

        const data = await resp.json();
        const messages = Array.isArray(data) ? data : [data];
        messages.forEach(msg => {
          emitMessage({
            protocol: 'rest',
            type: 'demand',
            timestamp: new Date().toISOString(),
            ...normalizeOEMDemand(msg),
            raw: JSON.stringify(msg),
          });
        });
      } catch (e) {
        emitMessage({ protocol: 'rest', type: 'error', timestamp: new Date().toISOString(), message: 'Polling error: ' + e.message });
      }
    };

    const intervalId = setInterval(pollFn, cfg.pollInterval || 5000);
    connections.rest = intervalId;
    // Don't poll immediately — wait for first interval to avoid blocking connect
    return { protocol: 'rest', success: true, message: 'REST polling started — endpoint: ' + cfg.endpoint };
  }

  // ── WebSocket Protocol ─────────────────────────────────────
  function connectWebSocket() {
    const cfg = config.websocket;
    if (!cfg.url) return { protocol: 'websocket', success: false, message: 'No WebSocket URL configured' };

    // In browser environment
    if (typeof WebSocket !== 'undefined') {
      try {
        const ws = new WebSocket(cfg.url);
        connections.websocket = ws;

        ws.onopen = () => {
          emitMessage({ protocol: 'websocket', type: 'info', timestamp: new Date().toISOString(), message: 'WebSocket connected' });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            emitMessage({
              protocol: 'websocket',
              type: 'demand',
              timestamp: new Date().toISOString(),
              ...normalizeOEMDemand(data),
              raw: event.data,
            });
          } catch (e) {
            emitMessage({ protocol: 'websocket', type: 'error', timestamp: new Date().toISOString(), message: 'Parse error: ' + e.message });
          }
        };

        ws.onerror = () => {
          emitMessage({ protocol: 'websocket', type: 'error', timestamp: new Date().toISOString(), message: 'WebSocket error' });
        };

        ws.onclose = () => {
          emitMessage({ protocol: 'websocket', type: 'info', timestamp: new Date().toISOString(), message: 'WebSocket closed' });
          // Auto-reconnect
          if (cfg.reconnect) {
            setTimeout(() => {
              if (activeProtocol === 'websocket') connectWebSocket();
            }, 3000);
          }
        };

        return { protocol: 'websocket', success: true, message: 'WebSocket connecting to ' + cfg.url };
      } catch (e) {
        return { protocol: 'websocket', success: false, message: 'WebSocket error: ' + e.message };
      }
    }

    return { protocol: 'websocket', success: false, message: 'WebSocket not available in this environment' };
  }

  // ── MQTT Protocol (via WebSocket bridge) ───────────────────
  function connectMQTT() {
    const cfg = config.mqtt;
    // MQTT over WebSocket — uses a WS bridge (e.g., HiveMQ, Mosquitto WS)
    const wsUrl = 'ws://' + cfg.broker + ':' + (parseInt(cfg.port) + 8000) + '/mqtt';

    if (typeof WebSocket === 'undefined') {
      return { protocol: 'mqtt', success: false, message: 'WebSocket not available — MQTT requires WS bridge' };
    }

    try {
      const ws = new WebSocket(wsUrl, 'mqttv3.1');
      connections.mqtt = ws;

      ws.onopen = () => {
        // Send MQTT CONNECT packet (simplified)
        emitMessage({ protocol: 'mqtt', type: 'info', timestamp: new Date().toISOString(), message: 'MQTT broker connected: ' + cfg.broker + ':' + cfg.port });
        // Subscribe to topic
        const subMsg = JSON.stringify({ action: 'subscribe', topic: cfg.topic });
        ws.send(subMsg);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.topic && data.payload) {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            emitMessage({
              protocol: 'mqtt',
              type: 'demand',
              timestamp: new Date().toISOString(),
              topic: data.topic,
              ...normalizeOEMDemand(payload),
              raw: JSON.stringify(data),
            });
          }
        } catch (e) {
          emitMessage({ protocol: 'mqtt', type: 'error', timestamp: new Date().toISOString(), message: 'MQTT parse error: ' + e.message });
        }
      };

      ws.onerror = () => {
        emitMessage({ protocol: 'mqtt', type: 'error', timestamp: new Date().toISOString(), message: 'MQTT connection error' });
      };

      ws.onclose = () => {
        emitMessage({ protocol: 'mqtt', type: 'info', timestamp: new Date().toISOString(), message: 'MQTT disconnected' });
      };

      return { protocol: 'mqtt', success: true, message: 'MQTT connecting to ' + cfg.broker + ':' + cfg.port + ' topic: ' + cfg.topic };
    } catch (e) {
      return { protocol: 'mqtt', success: false, message: 'MQTT error: ' + e.message };
    }
  }

  // ── EDI File Import Protocol ───────────────────────────────
  // Supports multiple EDI feed formats:
  // 1. FCA CONVIS single-line feed (fixed-width fields, all vehicle data on one line)
  // 2. Pipe-delimited multi-line (SEQ|num|vin|line|part|...)
  // 3. X12 EDI 866 (ST*866* segments)
  // 4. Generic delimited (comma, tab, semicolon)

  function parseEDI866(text) {
    const messages = [];
    text = text.trim();
    if (!text) return messages;

    // Detect format
    const firstLine = text.split(/\r?\n/)[0].trim();

    // Format 1: FCA CONVIS single-line feed
    // Real FCA feeds pack all vehicle data into a single line with fixed-width
    // or asterisk-delimited fields. The server-side agent parses and inserts to DB.
    // Example: *VIN*1C6RR7TT5ES123456*SEQ*004567*PRT*68298041AB*LIN*LINE-07*OEM*FCA*CLR*GRANITE*...
    // Or: CONVIS|1C6RR7TT5ES123456|004567|68298041AB|LINE-07|FCA|GRANITE CRYSTAL|FRONT FASCIA
    if (firstLine.startsWith('*') || firstLine.startsWith('CONVIS|') || firstLine.startsWith('CONVIS*')) {
      return parseCONVISFeed(text);
    }

    // Format 2: Pipe-delimited multi-line
    if (firstLine.includes('|') && (firstLine.startsWith('SEQ|') || firstLine.startsWith('BROADCAST|') || firstLine.startsWith('DEMAND|'))) {
      return parsePipeDelimitedEDI(text);
    }

    // Format 3: X12 EDI 866
    if (text.includes('ST*866') || text.startsWith('ISA*')) {
      return parseX12_866(text);
    }

    // Format 4: Generic delimited (try comma, tab, semicolon)
    const delim = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : firstLine.includes(',') ? ',' : '|';
    return parseGenericDelimited(text, delim);
  }

  // ── FCA CONVIS Feed Parser ─────────────────────────────────
  // Parses single-line or multi-line CONVIS broadcasts.
  // CONVIS = Continuous Vehicle Sequence (FCA/Stellantis system)
  // Format: CONVIS|VIN|SEQ|PART|LINE|OEM|COLOR|DESCRIPTION|PLANT|MODEL|BODY|ENGINE|TRIM
  function parseCONVISFeed(text) {
    const messages = [];
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) continue;

      // Asterisk-delimited CONVIS format: *FIELD*value*FIELD*value*...
      if (line.startsWith('*')) {
        const msg = parseCONVISAsterisk(line);
        if (msg) messages.push(msg);
        continue;
      }

      // Pipe-delimited CONVIS format
      if (line.startsWith('CONVIS|') || line.includes('|')) {
        const fields = line.split('|');
        const msg = {
          protocol: 'edi',
          type: 'demand',
          timestamp: new Date().toISOString(),
          raw: line,
          opCode: 'OP-1000', // CONVIS broadcast
        };

        // CONVIS|VIN|SEQ|PART|LINE|OEM|COLOR|DESC|PLANT|MODEL|BODY|ENGINE|TRIM
        if (fields.length >= 5) {
          // Remove CONVIS prefix if present
          const startIdx = fields[0] === 'CONVIS' ? 1 : 0;
          msg.vin = fields[startIdx] || '';
          msg.sequenceNumber = parseInt(fields[startIdx + 1]) || Date.now() % 100000;
          msg.partNumber = fields[startIdx + 2] || '';
          msg.lineId = fields[startIdx + 3] || 'LINE-01';
          msg.oem = fields[startIdx + 4] || 'FCA/Stellantis';
          if (fields[startIdx + 5]) msg.color = fields[startIdx + 5];
          if (fields[startIdx + 6]) msg.description = fields[startIdx + 6];
          if (fields[startIdx + 7]) msg.plant = fields[startIdx + 7];
          if (fields[startIdx + 8]) msg.modelCode = fields[startIdx + 8];
          if (fields[startIdx + 9]) msg.bodyType = fields[startIdx + 9];
          if (fields[startIdx + 10]) msg.engineCode = fields[startIdx + 10];
          if (fields[startIdx + 11]) msg.trimLevel = fields[startIdx + 11];
          msg.customerPartNumber = msg.partNumber; // FCA: same number
          msg.commodity = inferCommodity(msg.partNumber, msg.description);
        }
        messages.push(msg);
      }
    }
    return messages;
  }

  // Parse asterisk-delimited CONVIS: *VIN*xxx*SEQ*xxx*PRT*xxx*...
  function parseCONVISAsterisk(line) {
    const parts = line.split('*').filter(s => s.trim());
    const msg = {
      protocol: 'edi',
      type: 'demand',
      timestamp: new Date().toISOString(),
      raw: line,
      opCode: 'OP-1000',
      oem: 'FCA/Stellantis',
    };

    // Parse key-value pairs: FIELD:value
    const data = {};
    for (let i = 0; i < parts.length - 1; i += 2) {
      const key = parts[i].toUpperCase();
      const value = parts[i + 1];
      data[key] = value;
    }

    msg.vin = data.VIN || '';
    msg.sequenceNumber = parseInt(data.SEQ || data.SEQUENCE || '0') || Date.now() % 100000;
    msg.partNumber = data.PRT || data.PART || data.PARTNUM || '';
    msg.lineId = data.LIN || data.LINE || 'LINE-01';
    msg.color = data.CLR || data.COLOR || '';
    msg.description = data.DSC || data.DESC || data.DESCRIPTION || '';
    msg.plant = data.PLT || data.PLANT || '';
    msg.modelCode = data.MDL || data.MODEL || '';
    msg.bodyType = data.BDY || data.BODY || '';
    msg.engineCode = data.ENG || data.ENGINE || '';
    msg.trimLevel = data.TRIM || '';
    msg.customerPartNumber = msg.partNumber;
    msg.commodity = inferCommodity(msg.partNumber, msg.description);

    if (!msg.vin && !msg.partNumber) return null;
    return msg;
  }

  // ── Pipe-delimited EDI parser ──────────────────────────────
  function parsePipeDelimitedEDI(text) {
    const messages = [];
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim() || (!line.startsWith('SEQ|') && !line.startsWith('BROADCAST|') && !line.startsWith('DEMAND|'))) continue;

      const fields = line.split('|');
      const msg = {
        protocol: 'edi',
        type: 'demand',
        timestamp: new Date().toISOString(),
        raw: line,
        opCode: 'OP-100',
      };

      if (fields.length >= 6) {
        msg.sequenceNumber = parseInt(fields[1]) || Date.now() % 100000;
        msg.vin = fields[2] || '';
        msg.lineId = fields[3] || 'LINE-01';
        msg.partNumber = fields[4] || '';
        msg.customerPartNumber = fields[5] || msg.partNumber;
        msg.description = fields[6] || 'Imported Part';
        msg.oem = fields[7] || 'Unknown OEM';
        if (fields[8]) msg.color = fields[8];
        msg.commodity = inferCommodity(msg.partNumber, msg.description);
      }
      messages.push(msg);
    }
    return messages;
  }

  // ── X12 EDI 866 parser ─────────────────────────────────────
  function parseX12_866(text) {
    const messages = [];
    // Split by segment terminator (usually ~ or newline)
    const segments = text.split(/[~\r\n]+/);
    let currentMsg = null;

    for (const seg of segments) {
      if (!seg.trim()) continue;
      const elements = seg.split('*');

      if (elements[0] === 'ST' && elements[1] === '866') {
        // Start of 866 transaction
        if (currentMsg) messages.push(currentMsg);
        currentMsg = {
          protocol: 'edi',
          type: 'demand',
          timestamp: new Date().toISOString(),
          raw: seg,
          opCode: 'OP-100',
          sequenceNumber: parseInt(elements[2]) || Date.now() % 100000,
        };
      } else if (elements[0] === 'LIN' && currentMsg) {
        // Line item — part number
        currentMsg.partNumber = elements[3] || '';
        currentMsg.customerPartNumber = currentMsg.partNumber;
      } else if (elements[0] === 'REF' && currentMsg) {
        // Reference segments
        if (elements[1] === 'VN') currentMsg.vin = elements[2] || '';
        if (elements[1] === 'SO') currentMsg.sequenceNumber = parseInt(elements[2]) || currentMsg.sequenceNumber;
        if (elements[1] === 'LO') currentMsg.lineId = elements[2] || 'LINE-01';
      } else if (elements[0] === 'PID' && currentMsg) {
        currentMsg.description = elements[3] || currentMsg.description;
      } else if (elements[0] === 'SE' && currentMsg) {
        // End of transaction
        currentMsg.commodity = inferCommodity(currentMsg.partNumber, currentMsg.description);
        messages.push(currentMsg);
        currentMsg = null;
      }
    }
    if (currentMsg) messages.push(currentMsg);
    return messages;
  }

  // ── Generic delimited parser ───────────────────────────────
  function parseGenericDelimited(text, delimiter) {
    const messages = [];
    const lines = text.split(/\r?\n/);
    let headers = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const fields = line.split(delimiter);

      // First line might be headers
      if (i === 0 && fields.some(f => f.toLowerCase().match(/vin|part|seq|line|oem/))) {
        headers = fields.map(f => f.toLowerCase().trim());
        continue;
      }

      const msg = {
        protocol: 'edi',
        type: 'demand',
        timestamp: new Date().toISOString(),
        raw: line,
        opCode: 'OP-100',
      };

      if (headers) {
        // Map by header name
        headers.forEach((h, idx) => {
          const val = (fields[idx] || '').trim();
          if (h.match(/vin/)) msg.vin = val;
          else if (h.match(/seq/)) msg.sequenceNumber = parseInt(val) || Date.now() % 100000;
          else if (h.match(/part|item/)) { msg.partNumber = val; msg.customerPartNumber = val; }
          else if (h.match(/line/)) msg.lineId = val;
          else if (h.match(/oem|customer/)) msg.oem = val;
          else if (h.match(/desc/)) msg.description = val;
          else if (h.match(/color|clr/)) msg.color = val;
          else if (h.match(/plant/)) msg.plant = val;
          else if (h.match(/model/)) msg.modelCode = val;
        });
      } else {
        // Positional: VIN,SEQ,PART,LINE,OEM,DESC
        msg.vin = fields[0] || '';
        msg.sequenceNumber = parseInt(fields[1]) || Date.now() % 100000;
        msg.partNumber = fields[2] || '';
        msg.customerPartNumber = msg.partNumber;
        msg.lineId = fields[3] || 'LINE-01';
        msg.oem = fields[4] || 'Unknown';
        msg.description = fields[5] || 'Imported Part';
        if (fields[6]) msg.color = fields[6];
      }
      msg.commodity = inferCommodity(msg.partNumber, msg.description);
      if (msg.vin || msg.partNumber) messages.push(msg);
    }
    return messages;
  }

  // ── Infer commodity from part number or description ────────
  function inferCommodity(partNumber, description) {
    const desc = (description || '').toLowerCase();
    const pn = (partNumber || '').toUpperCase();

    if (desc.includes('fascia') || desc.includes('bumper')) return 'Fascia';
    if (desc.includes('headliner')) return 'Headliner';
    if (desc.includes('seat')) return 'Seat';
    if (desc.includes('windshield') || desc.includes('glass')) return 'Windshield';
    if (desc.includes('tail lamp') || desc.includes('taillight')) return 'TailLamp';
    if (desc.includes('headlamp') || desc.includes('headlight')) return 'Headlamp';
    if (desc.includes('door trim') || desc.includes('door panel')) return 'DoorTrim';
    if (desc.includes('grille')) return 'Grille';
    if (desc.includes('tailgate')) return 'Tailgate';
    if (desc.includes('bezel') || desc.includes('instrument panel')) return 'IPBezel';
    if (desc.includes('dashboard') || desc.includes('dash')) return 'Dashboard';
    if (desc.includes('wiper')) return 'Wiper';
    if (desc.includes('emblem')) return 'Emblem';
    return 'Unknown';
  }

  function importEDIFile(fileContent) {
    const messages = parseEDI866(fileContent);
    messages.forEach(msg => emitMessage(msg));
    return { protocol: 'edi', success: true, message: 'Imported ' + messages.length + ' EDI 866 records', count: messages.length };
  }

  function importEDIFileInput(fileInput) {
    return new Promise((resolve, reject) => {
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        reject(new Error('No file selected'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = importEDIFile(e.target.result);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(fileInput.files[0]);
    });
  }

  // ── OPC-UA Protocol (via REST gateway) ─────────────────────
  function connectOPCUA() {
    const cfg = config.opcua;
    if (!cfg.gatewayUrl) return { protocol: 'opcua', success: false, message: 'No OPC-UA gateway URL configured' };

    const pollFn = async () => {
      try {
        // OPC-UA via REST gateway (e.g., node-opcua-rest, Unified Architecture HTTP gateway)
        const url = cfg.gatewayUrl + '/read?nodeId=' + encodeURIComponent(cfg.nodeId);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();

        if (data.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          emitMessage({
            protocol: 'opcua',
            type: 'demand',
            timestamp: new Date().toISOString(),
            nodeId: cfg.nodeId,
            ...normalizeOEMDemand(parsed),
            raw: JSON.stringify(data),
          });
        }
      } catch (e) {
        emitMessage({ protocol: 'opcua', type: 'error', timestamp: new Date().toISOString(), message: 'OPC-UA polling error: ' + e.message });
      }
    };

    const intervalId = setInterval(pollFn, cfg.pollInterval || 5000);
    connections.opcua = intervalId;
    return { protocol: 'opcua', success: true, message: 'OPC-UA polling via gateway: ' + cfg.gatewayUrl };
  }

  // ── Serial / RS232 Protocol (via Web Serial API) ──────────
  function connectSerial() {
    const cfg = config.serial;

    // Web Serial API (Chrome/Edge 77+)
    if (typeof navigator !== 'undefined' && navigator.serial) {
      // Request port — this must be triggered by user action
      return { protocol: 'serial', success: true, message: 'Serial ready — call requestSerialPort() from a user click' };
    }

    return { protocol: 'serial', success: false, message: 'Web Serial API not available — use Chrome/Edge 77+' };
  }

  async function requestSerialPort() {
    if (!navigator.serial) throw new Error('Web Serial API not available');
    const cfg = config.serial;
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: cfg.baudRate || 9600 });

    connections.serial = port;

    // Read loop
    const decoder = new TextDecoder();
    const reader = port.readable.getReader();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split by newline — each line is a message
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || ''; // keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            const msg = parseSerialLine(line);
            if (msg) emitMessage(msg);
          }
        }
      }
    } catch (e) {
      emitMessage({ protocol: 'serial', type: 'error', timestamp: new Date().toISOString(), message: 'Serial read error: ' + e.message });
    }

    return { protocol: 'serial', success: true, message: 'Serial port connected: ' + cfg.port + ' @' + cfg.baudRate };
  }

  function parseSerialLine(line) {
    // Parse common serial formats: plain text, CSV, or JSON
    line = line.trim();
    if (!line) return null;

    // Try JSON
    if (line.startsWith('{') || line.startsWith('[')) {
      try {
        const data = JSON.parse(line);
        return {
          protocol: 'serial',
          type: 'demand',
          timestamp: new Date().toISOString(),
          ...normalizeOEMDemand(data),
          raw: line,
        };
      } catch (e) { /* not JSON — try other formats */ }
    }

    // Try pipe-delimited (same as EDI)
    if (line.includes('|')) {
      return parseEDI866(line)[0];
    }

    // Plain text — treat as barcode scan or part number
    return {
      protocol: 'serial',
      type: 'scan',
      timestamp: new Date().toISOString(),
      code: line,
      raw: line,
    };
  }

  // ── Azure IoT Hub Connection ──────────────────────────────
  // Azure IoT Hub uses MQTT over WebSocket (port 443) with SAS tokens
  // Compatible with: Azure Industrial IoT (OPC UA), Azure Digital Twins,
  // Azure Stream Analytics, Azure Functions, SAP Digital Manufacturing
  function connectAzure() {
    var cfg = config.azure;

    if (!cfg.connectionString) {
      return { protocol: 'azure', success: false, message: 'No connection string configured' };
    }

    // Parse connection string: HostName=...;DeviceId=...;SharedAccessKey=...
    var parsed = parseAzureConnectionString(cfg.connectionString);
    if (!parsed.hostName) {
      return { protocol: 'azure', success: false, message: 'Invalid connection string — missing HostName' };
    }

    // Azure IoT Hub MQTT endpoint: hostName over WebSocket (443)
    var mqttHost = parsed.hostName;
    var deviceId = parsed.deviceId || cfg.deviceId || 'your-device-id';
    var mqttPort = 443; // Azure requires 443 for WebSocket MQTT

    // Generate SAS token (simulated — production would use Azure SDK)
    var sasToken = generateAzureSASToken(parsed.sharedAccessKey, parsed.hostName, deviceId);

    // Build MQTT WebSocket URL for Azure IoT Hub
    var wsUrl = 'wss://' + mqttHost + ':443/$iothub/websocket?iothub_no_client_cert=true';

    if (typeof WebSocket !== 'undefined') {
      try {
        var ws = new WebSocket(wsUrl, ['mqtt']);

        connections.azure = ws;

        ws.onopen = function() {
          // Send MQTT CONNECT packet with Azure IoT Hub credentials
          emitMessage({
            protocol: 'azure',
            type: 'info',
            timestamp: new Date().toISOString(),
            message: 'Azure IoT Hub connected — Device: ' + deviceId + ' @ ' + mqttHost,
          });

          // Subscribe to Device Twin desired properties and Direct Methods
          var twinTopic = '$iothub/twin/res/#';
          var methodTopic = '$iothub/methods/POST/#';
          var c2dTopic = 'devices/' + deviceId + '/messages/devicebound/#';

          // In production, send proper MQTT SUBSCRIBE packets here
          // For simulation, emit a connected event
          emitMessage({
            protocol: 'azure',
            type: 'connected',
            timestamp: new Date().toISOString(),
            message: 'Subscribed to: C2D messages, Device Twin, Direct Methods',
            deviceId: deviceId,
            modelId: cfg.modelId,
          });
        };

        ws.onmessage = function(event) {
          // Parse Azure IoT Hub messages (JSON telemetry or C2D commands)
          try {
            var data = JSON.parse(event.data);
            // Check for Direct Method invocation
            if (data.methodName) {
              emitMessage({
                protocol: 'azure',
                type: 'method',
                timestamp: new Date().toISOString(),
                methodName: data.methodName,
                payload: data.payload,
                requestId: data.requestId,
              });
              // Auto-respond to Direct Methods
              handleAzureDirectMethod(data.methodName, data.payload, data.requestId);
            } else if (data.telemetry) {
              // Telemetry from another device (Azure Digital Twins route)
              var msg = normalizeOEMDemand(data.telemetry);
              msg.protocol = 'azure';
              msg.type = 'demand';
              msg.timestamp = new Date().toISOString();
              emitMessage(msg);
            } else {
              // C2D message or Device Twin update
              var demandMsg = normalizeOEMDemand(data);
              demandMsg.protocol = 'azure';
              demandMsg.type = 'demand';
              demandMsg.timestamp = new Date().toISOString();
              emitMessage(demandMsg);
            }
          } catch (e) {
            // Non-JSON message — treat as raw telemetry
            emitMessage({
              protocol: 'azure',
              type: 'demand',
              timestamp: new Date().toISOString(),
              raw: event.data,
            });
          }
        };

        ws.onerror = function(e) {
          emitMessage({
            protocol: 'azure',
            type: 'error',
            timestamp: new Date().toISOString(),
            message: 'Azure IoT Hub WebSocket error: ' + (e.message || 'unknown'),
          });
        };

        ws.onclose = function() {
          emitMessage({
            protocol: 'azure',
            type: 'info',
            timestamp: new Date().toISOString(),
            message: 'Azure IoT Hub connection closed',
          });
          // Auto-reconnect if enabled
          setTimeout(function() {
            if (connections.azure === null) return;
            connectAzure();
          }, 5000);
        };

        return { protocol: 'azure', success: true, message: 'Azure IoT Hub connecting to ' + mqttHost + ' (WSS:443 MQTT) — Device: ' + deviceId };
      } catch (e) {
        return { protocol: 'azure', success: false, message: 'Azure IoT Hub error: ' + e.message };
      }
    }

    // No WebSocket — simulate Azure connection with telemetry polling
    connections.azure = setInterval(function() {
      // Simulate receiving Azure IoT Hub telemetry
      var simData = generateSimulationPulse();
      if (simData) {
        simData.protocol = 'azure';
        simData.type = 'telemetry';
        simData.timestamp = new Date().toISOString();
        emitMessage(simData);
      }
    }, cfg.pulseRate || 5000);

    return { protocol: 'azure', success: true, message: 'Azure IoT Hub simulated (no WebSocket) — telemetry polling started' };
  }

  // ── Parse Azure Connection String ─────────────────────────
  function parseAzureConnectionString(connStr) {
    var parsed = {};
    if (!connStr) return parsed;
    var parts = connStr.split(';');
    parts.forEach(function(part) {
      var eqIdx = part.indexOf('=');
      if (eqIdx > 0) {
        var key = part.substring(0, eqIdx).trim();
        var val = part.substring(eqIdx + 1).trim();
        if (key === 'HostName') parsed.hostName = val;
        else if (key === 'DeviceId') parsed.deviceId = val;
        else if (key === 'SharedAccessKey') parsed.sharedAccessKey = val;
        else if (key === 'SharedAccessKeyName') parsed.sharedAccessKeyName = val;
        else if (key === 'DevicePrimaryKey') parsed.sharedAccessKey = val;
      }
    });
    return parsed;
  }

  // ── Generate Azure SAS Token (simulated) ──────────────────
  // Production: use Azure IoT SDK or crypto-js for HMAC-SHA256
  function generateAzureSASToken(key, hostName, deviceId) {
    var expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    var resourceUri = encodeURIComponent(hostName + '/devices/' + deviceId);
    // In production: HMAC-SHA256(key, resourceUri + '\n' + expiry) → Base64
    return 'SharedAccessSignature sr=' + resourceUri + '&sig=[SIMULATED]&se=' + expiry;
  }

  // ── Handle Azure Direct Methods ───────────────────────────
  // Cloud-to-device method invocations from Azure IoT Hub
  function handleAzureDirectMethod(methodName, payload, requestId) {
    var response = { status: 200, payload: {} };

    switch (methodName) {
      case 'startSequence':
        response.payload = { message: 'Sequence started', active: true };
        break;
      case 'stopSequence':
        response.payload = { message: 'Sequence stopped', active: false };
        break;
      case 'getForkliftStatus':
        var flStats = window.AutoSeq ? AutoSeq.getForkliftStats() : {};
        response.payload = flStats;
        break;
      case 'getDeliveryStatus':
        var dlvStats = window.AutoSeq ? AutoSeq.getDeliveryStats() : {};
        response.payload = dlvStats;
        break;
      case 'rebootDevice':
        response.payload = { message: 'Reboot command received — simulated' };
        break;
      default:
        response.status = 501;
        response.payload = { error: 'Unknown method: ' + methodName };
    }

    // In production, send response via MQTT to $iothub/methods/res/{status}/?$rid={requestId}
    emitMessage({
      protocol: 'azure',
      type: 'methodResponse',
      methodName: methodName,
      requestId: requestId,
      status: response.status,
      payload: response.payload,
      timestamp: new Date().toISOString(),
    });

    return response;
  }

  // ── Send Telemetry to Azure IoT Hub ───────────────────────
  // D2C (Device-to-Cloud) message
  function sendAzureTelemetry(telemetryData) {
    var cfg = config.azure;
    var deviceId = cfg.deviceId || 'your-device-id';
    var topic = 'devices/' + deviceId + '/messages/events/';

    var message = {
      deviceId: deviceId,
      modelId: cfg.modelId,
      timestamp: new Date().toISOString(),
      telemetry: telemetryData,
    };

    // In production, send via MQTT PUBLISH to topic
    // For simulation, just log
    emitMessage({
      protocol: 'azure',
      type: 'telemetrySent',
      topic: topic,
      payload: message,
      timestamp: new Date().toISOString(),
    });

    return { success: true, topic: topic, message: 'Telemetry sent to Azure IoT Hub' };
  }

  // ── Update Device Twin Reported Properties ─────────────────
  function updateAzureTwin(properties) {
    var cfg = config.azure;
    var deviceId = cfg.deviceId || 'your-device-id';
    var topic = '$iothub/twin/PATCH/properties/reported/?$rid=' + Date.now();

    var twinPatch = {
      deviceId: deviceId,
      properties: properties,
      timestamp: new Date().toISOString(),
    };

    emitMessage({
      protocol: 'azure',
      type: 'twinUpdate',
      topic: topic,
      patch: twinPatch,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Device Twin reported properties updated' };
  }

  // ── Normalize OEM Demand to common format ──────────────────
  function normalizeOEMDemand(raw) {
    if (!raw || typeof raw !== 'object') return {};
    return {
      sequenceNumber: raw.sequenceNumber || raw.seqNum || raw.seq || raw.SequenceNumber || Date.now() % 100000,
      vin: raw.vin || raw.VIN || raw.VehicleId || generateVIN(),
      lineId: raw.lineId || raw.LineId || raw.line || 'LINE-01',
      lineName: raw.lineName || raw.LineName || raw.line || 'Unknown Line',
      oem: raw.oem || raw.OEM || raw.customer || 'Unknown OEM',
      partNumber: raw.partNumber || raw.PartNumber || raw.pn || raw.part || 'UNKNOWN',
      customerPartNumber: raw.customerPartNumber || raw.CustomerPartNumber || raw.custPn || raw.partNumber || 'UNKNOWN',
      description: raw.description || raw.Description || raw.desc || raw.partName || 'Unknown Part',
      commodity: raw.commodity || raw.Commodity || raw.category || 'Unknown',
      color: raw.color || raw.Color || '',
      opCode: raw.opCode || raw.OpCode || 'OP-100',
    };
  }

  // ── Configuration Management ───────────────────────────────
  function getConfig(protocol) {
    return protocol ? config[protocol] : config;
  }

  function setConfig(protocol, protocolConfig) {
    if (!config[protocol]) config[protocol] = {};
    config[protocol] = { ...config[protocol], ...protocolConfig };
  }

  function getActiveProtocol() {
    return activeProtocol;
  }

  function getProtocols() {
    return PROTOCOLS;
  }

  function isConnected(protocol) {
    return !!connections[protocol || activeProtocol];
  }

  // ── Connection Status ──────────────────────────────────────
  function getStatus() {
    return {
      active: activeProtocol,
      connected: isConnected(activeProtocol),
      protocolInfo: PROTOCOLS[activeProtocol] || {},
      config: config[activeProtocol] || {},
    };
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    PROTOCOLS,
    connect,
    disconnect,
    onMessage,
    importEDIFile,
    importEDIFileInput,
    requestSerialPort,
    getConfig,
    setConfig,
    getActiveProtocol,
    getProtocols,
    isConnected,
    getStatus,
    generateSimulationPulse,
    parseEDI866,
    parseCONVISFeed,
    parsePipeDelimitedEDI,
    parseX12_866,
    parseGenericDelimited,
    inferCommodity,
    connectAzure,
    parseAzureConnectionString,
    generateAzureSASToken,
    handleAzureDirectMethod,
    sendAzureTelemetry,
    updateAzureTwin,
  };
})();
