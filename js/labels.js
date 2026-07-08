/* ============================================================
   OwlLogics NexGen Owl Mode
   © 2024 OwlLogics Contributors — All Rights Reserved — Patent Pending
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Label Engine
   - Multi-format barcode SVG generators:
     Code 128, Code 39, Code 93, Interleaved 2 of 5,
     EAN-13, DataMatrix, QR (matrix)
   - CKD (Completely Knocked Down) business logic labels:
     CKD Part, CKD Kit, CKD Shipping, CKD Customs
   - ZPL output for Zebra/industrial printers
   - Label templates: part, rack, kit, shipping, slot, CKD
   - Batch printing with print-optimized CSS
   ============================================================ */

const LabelEngine = (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  //  BARCODE FORMAT REGISTRY
  // ═══════════════════════════════════════════════════════════

  const BARCODE_FORMATS = {
    'code128':    { name: 'Code 128',      desc: 'Alphanumeric, compact, checksum. Standard for automotive part labels.', zpl: '^BC' },
    'code39':     { name: 'Code 39 (3 of 9)', desc: 'Alphanumeric with start/stop chars (*). Legacy automotive standard.', zpl: '^B3' },
    'code93':     { name: 'Code 93',       desc: 'Compact alphanumeric, 2 checksums. Used in logistics.', zpl: '^B9' },
    'i2of5':      { name: 'Interleaved 2 of 5', desc: 'Numeric only, paired digits. Used for carton labels.', zpl: '^B2' },
    'ean13':      { name: 'EAN-13',        desc: '13-digit numeric. Global trade item number (GTIN).', zpl: '^BE' },
    'datamatrix': { name: 'DataMatrix',    desc: '2D matrix code. Used for direct part marking (DPM).', zpl: '^BX' },
    'qrcode':     { name: 'QR Code',       desc: '2D matrix. High capacity, smartphone scannable.', zpl: '^BQ' },
  };

  function getBarcodeFormats() {
    return BARCODE_FORMATS;
  }

  // ═══════════════════════════════════════════════════════════
  //  UNIVERSAL BARCODE GENERATOR
  // ═══════════════════════════════════════════════════════════

  function generateBarcodeSVG(data, format, options) {
    options = options || {};
    format = format || 'code128';

    switch (format) {
      case 'code128':    return generateCode128SVG(data, options);
      case 'code39':     return generateCode39SVG(data, options);
      case 'code93':     return generateCode93SVG(data, options);
      case 'i2of5':      return generateI2of5SVG(data, options);
      case 'ean13':      return generateEAN13SVG(data, options);
      case 'datamatrix': return generateDataMatrixSVG(data, options);
      case 'qrcode':     return generateSimpleMatrixSVG(data, options.size || 80);
      default:           return generateCode128SVG(data, options);
    }
  }

  // ── Code 128 Barcode (Subset B) ────────────────────────────
  // Generates SVG barcode for alphanumeric data
  const CODE128_PATTERNS = {
    ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
    '$': '10010001100', '%': '10001001100', '&': '10011001000', "'": '10011000100',
    '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
    ',': '10110011000', '-': '10110001100', '.': '10100011000', '/': '10011011000',
    '0': '10011000110', '1': '11001001000', '2': '11001000100', '3': '11000100100',
    '4': '10110011000', '5': '10110001100', '6': '10011011000', '7': '10011000110',
    '8': '11001001000', '9': '11001000100', 'A': '10100011000', 'B': '10001001000',
    'C': '10110010000', 'D': '10110000100', 'E': '10001100100', 'F': '10011000010',
    'G': '11000101000', 'H': '11000100010', 'I': '10110011000', 'J': '10110001100',
    'K': '10011001000', 'L': '10011000100', 'M': '10001100100', 'N': '11001001000',
    'O': '11001000100', 'P': '11000100100', 'Q': '10110011000', 'R': '10110001100',
    'S': '10100011000', 'T': '10001001000', 'U': '10110010000', 'V': '10110000100',
    'W': '10001100100', 'X': '10011000010', 'Y': '11000101000', 'Z': '11000100010',
    '-': '10110011000', '.': '10110001100', ' ': '11011001000',
  };

  // Start code B = 104, Stop = 106
  const START_B = '11010010000'; // Code B start
  const STOP = '11000111010';
  const SPACE_PATTERN = '11011001100';

  function getCode128Pattern(char) {
    return CODE128_PATTERNS[char] || CODE128_PATTERNS[' '];
  }

  function generateCode128SVG(data, options) {
    options = options || {};
    const barWidth = options.barWidth || 2;
    const height = options.height || 50;
    const showText = options.showText !== false;

    // Build barcode bars
    let bars = START_B;
    let checksum = 104; // Start code B value

    for (let i = 0; i < data.length; i++) {
      const ch = data[i];
      const pattern = getCode128Pattern(ch);
      bars += pattern;
      // Checksum: char value is ASCII - 32 for Code B
      const charValue = ch.charCodeAt(0) - 32;
      checksum += charValue * (i + 1);
    }

    // Checksum digit
    const checksumMod = checksum % 103;
    // Convert checksum to pattern — use a lookup
    const checksumChar = String.fromCharCode(checksumMod + 32);
    // For checksum, we need the pattern at index checksumMod
    // Build a values-to-pattern map for Code B (values 0-102)
    const codeBValues = [
      '11011001100','11001101100','11001100110','10010011000','10010001100',
      '10001001100','10011001000','10011000100','10001100100','11001001000',
      '11001000100','11000100100','10110011000','10110001100','10011011000',
      '10011000110','11001001000','11001000100','11000100100','10110011000',
      '10110001100','10100011000','10001001000','10110010000','10110000100',
      '10001100100','10011000010','11000101000','11000100010','10110011000',
      '10110001100','10011001000','10011000100','10001100100','11001001000',
      '11001000100','11000100100','10110011000','10110001100','10100011000',
      '10001001000','10110010000','10110000100','10001100100','10011000010',
      '11000101000','11000100010','10110011000','10110001100','10011001000',
      '10011000100','10001100100','11001001000','11001000100','11000100100',
      '10110011000','10110001100','10100011000','10001001000','10110010000',
      '10110000100','10001100100','10011000010','11000101000','11000100010',
      '10110011000','10110001100','10011001000','10011000100','10001100100',
      '11001001000','11001000100','11000100100','10110011000','10110001100',
      '10100011000','10001001000','10110010000','10110000100','10001100100',
      '10011000010','11000101000','11000100010','10110011000','10110001100',
      '10011001000','10011000100','10001100100','11001001000','11001000100',
      '11000100100','10110011000','10110001100','10100011000','10001001000',
      '10110010000','10110000100','10001100100','10011000010','11000101000',
      '11000100010','11011001000'
    ];

    bars += codeBValues[checksumMod] || '';
    bars += STOP;

    // Calculate total width
    const totalWidth = bars.length * barWidth;
    const textHeight = showText ? 14 : 0;
    const svgHeight = height + textHeight;

    // Build SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${svgHeight}" viewBox="0 0 ${totalWidth} ${svgHeight}">`;
    svg += `<rect width="${totalWidth}" height="${svgHeight}" fill="white"/>`;

    let x = 0;
    for (let i = 0; i < bars.length; i++) {
      if (bars[i] === '1') {
        svg += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="black"/>`;
      }
      x += barWidth;
    }

    if (showText) {
      svg += `<text x="${totalWidth / 2}" y="${height + 11}" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="black">${escapeXML(data)}</text>`;
    }

    svg += '</svg>';
    return svg;
  }

  function escapeXML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Generic SVG barcode builder ────────────────────────────
  function buildBarcodeSVG(bars, options, data) {
    options = options || {};
    const barWidth = options.barWidth || 2;
    const height = options.height || 50;
    const showText = options.showText !== false;
    const textHeight = showText ? 14 : 0;
    const svgHeight = height + textHeight;
    const totalWidth = bars.length * barWidth;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${svgHeight}" viewBox="0 0 ${totalWidth} ${svgHeight}">`;
    svg += `<rect width="${totalWidth}" height="${svgHeight}" fill="white"/>`;

    let x = 0;
    for (let i = 0; i < bars.length; i++) {
      if (bars[i] === '1') {
        svg += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="black"/>`;
      }
      x += barWidth;
    }

    if (showText && data) {
      svg += `<text x="${totalWidth / 2}" y="${height + 11}" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="black">${escapeXML(data)}</text>`;
    }

    svg += '</svg>';
    return svg;
  }

  // ── Code 39 (3 of 9) ───────────────────────────────────────
  const CODE39_TABLE = {
    '0':'NNNWWNWNN','1':'WNNWNNNNW','2':'NNWWNNNNW','3':'WNWWNNNNN',
    '4':'NNNWWNNNW','5':'WNNWWNNNN','6':'NNWWWNNNN','7':'NNNWWNWNW',
    '8':'WNNWWNWNN','9':'NNWWWNWNN','A':'WNNNNWNNW','B':'NNWNNWNNW',
    'C':'WNWNNWNNN','D':'NNNNWWNNW','E':'WNNNWWNNN','F':'NNWNWWNNN',
    'G':'NNNNNWWNW','H':'WNNNNWWNN','I':'NNWNNWWNN','J':'NNNNWWWNN',
    'K':'WNNNNNNWW','L':'NNWNNNNWW','M':'WNWNNNNWN','N':'NNNNWNNWW',
    'O':'WNNNWNNWN','P':'NNWNWNNWN','Q':'NNNNNNWWW','R':'WNNNNNWWN',
    'S':'NNWNNNWWN','T':'NNNNWNWWN','U':'WWNNNNNNW','V':'NWWNNNNNW',
    'W':'WWWNNNNNN','X':'NWWNWNNNN','Y':'WWNNWNNNN','Z':'NWWWWNNNN',
    '-':'NWWNNNWNN','.':'WWNNNNWNN',' ':'NWWNWNWNN','*':'NWWNNWNNW',
    '$':'NWNWNWNNN','/':'NWNWNNNWN','+':'NWNNNWNWN','%':'NNNWNWNWN',
  };

  function generateCode39SVG(data, options) {
    options = options || {};
    data = data.toUpperCase();
    // Wrap with start/stop asterisks
    const chars = '*' + data + '*';
    let bars = '';
    for (let i = 0; i < chars.length; i++) {
      const pattern = CODE39_TABLE[chars[i]];
      if (!pattern) continue;
      // Convert N/W to narrow/wide bars (N=1 module, W=3 modules)
      for (let j = 0; j < pattern.length; j++) {
        const wide = pattern[j] === 'W';
        bars += wide ? '111' : '1';
        // Inter-character space (narrow gap)
        if (j < pattern.length - 1) bars += '0';
      }
      // Inter-character gap
      bars += '0';
    }
    return buildBarcodeSVG(bars, options, data);
  }

  // ── Code 93 ────────────────────────────────────────────────
  // Simplified — uses Code 39 patterns with different start/stop
  function generateCode93SVG(data, options) {
    options = options || {};
    data = data.toUpperCase();
    const startStop = CODE39_TABLE['*']; // Start/Stop
    let bars = '';
    // Start character
    for (let j = 0; j < startStop.length; j++) {
      bars += startStop[j] === 'W' ? '111' : '1';
      if (j < startStop.length - 1) bars += '0';
    }
    bars += '0';
    // Data
    for (let i = 0; i < data.length; i++) {
      const pattern = CODE39_TABLE[data[i]] || CODE39_TABLE[' '];
      for (let j = 0; j < pattern.length; j++) {
        bars += pattern[j] === 'W' ? '111' : '1';
        if (j < pattern.length - 1) bars += '0';
      }
      bars += '0';
    }
    // Stop character
    for (let j = 0; j < startStop.length; j++) {
      bars += startStop[j] === 'W' ? '111' : '1';
      if (j < startStop.length - 1) bars += '0';
    }
    return buildBarcodeSVG(bars, options, data);
  }

  // ── Interleaved 2 of 5 ─────────────────────────────────────
  const I25_PATTERNS = {
    '0':'NNWWN','1':'WNNNW','2':'NWNNW','3':'WWNNN','4':'NNWNW',
    '5':'WNWNN','6':'NWWNN','7':'NNNWW','8':'WNNWN','9':'NWNWN',
  };

  function generateI2of5SVG(data, options) {
    options = options || {};
    // Pad to even length
    if (data.length % 2 !== 0) data = '0' + data;
    // Only digits
    data = data.replace(/[^0-9]/g, '');
    let bars = '';
    // Start guard (NNNN)
    bars += '1010';
    // Interleaved pairs
    for (let i = 0; i < data.length; i += 2) {
      const p1 = I25_PATTERNS[data[i]] || I25_PATTERNS['0'];
      const p2 = I25_PATTERNS[data[i + 1]] || I25_PATTERNS['0'];
      // Interleave: bar from p1, space from p2
      for (let j = 0; j < 5; j++) {
        bars += p1[j] === 'W' ? '111' : '1';
        bars += p2[j] === 'W' ? '000' : '0';
      }
    }
    // End guard (WNN)
    bars += '1110';
    return buildBarcodeSVG(bars, options, data);
  }

  // ── EAN-13 ─────────────────────────────────────────────────
  const EAN13_L = { // Odd parity
    '0':'0001101','1':'0011001','2':'0010011','3':'0111101','4':'0100011',
    '5':'0110001','6':'0101111','7':'0111011','8':'0110111','9':'0001011',
  };
  const EAN13_R = { // Even parity (mirror of L)
    '0':'1110010','1':'1100110','2':'1101100','3':'1000010','4':'1011100',
    '5':'1001110','6':'1010000','7':'1000100','8':'1001000','9':'1110100',
  };
  const EAN13_G = { // Even parity
    '0':'0100111','1':'0110011','2':'0011011','3':'0100001','4':'0011101',
    '5':'0111001','6':'0000101','7':'0010001','8':'0001001','9':'0010111',
  };
  // Parity pattern for first 6 digits, indexed by first digit
  const EAN13_PARITY = [
    'LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL',
  ];

  function generateEAN13SVG(data, options) {
    options = options || {};
    // Pad/truncate to 13 digits
    data = data.replace(/[^0-9]/g, '');
    if (data.length < 13) data = data.padEnd(13, '0');
    data = data.substring(0, 13);

    const firstDigit = parseInt(data[0]);
    const parity = EAN13_PARITY[firstDigit] || 'LLLLLL';

    let bars = '';
    // Start guard
    bars += '101';
    // Left 6 digits
    for (let i = 0; i < 6; i++) {
      const d = data[i + 1];
      const set = parity[i] === 'L' ? EAN13_L : EAN13_G;
      bars += set[d] || EAN13_L[d];
    }
    // Center guard
    bars += '01010';
    // Right 6 digits (always R parity)
    for (let i = 0; i < 6; i++) {
      const d = data[i + 7];
      bars += EAN13_R[d] || EAN13_R['0'];
    }
    // End guard
    bars += '101';

    return buildBarcodeSVG(bars, options, data);
  }

  // ── DataMatrix (simplified visual representation) ──────────
  function generateDataMatrixSVG(data, options) {
    options = options || {};
    const size = options.size || 80;
    const cells = 16; // 16x16 grid
    const cellSize = size / cells;

    // Hash data to pseudo-random pattern
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
    }

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;

    // L-shaped finder pattern (left and bottom edges)
    // Left: solid vertical bar
    svg += `<rect x="0" y="0" width="${cellSize}" height="${size}" fill="black"/>`;
    // Bottom: solid horizontal bar
    svg += `<rect x="0" y="${size - cellSize}" width="${size}" height="${cellSize}" fill="black"/>`;
    // Top: alternating pattern
    for (let i = 0; i < cells; i++) {
      if (i % 2 === 0) {
        svg += `<rect x="${i * cellSize}" y="0" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
    // Right: alternating pattern
    for (let i = 0; i < cells; i++) {
      if (i % 2 === 1) {
        svg += `<rect x="${size - cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }

    // Data region (interior cells)
    let seed = Math.abs(hash) + 1;
    for (let r = 1; r < cells - 1; r++) {
      for (let c = 1; c < cells - 1; c++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        if (seed % 100 < 48) {
          svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
      }
    }

    svg += '</svg>';
    return svg;
  }

  // ── Simple QR-like matrix (for display purposes) ───────────
  function generateSimpleMatrixSVG(data, size) {
    size = size || 80;
    const cells = 21; // 21x21 grid (Version 1 QR)
    const cellSize = size / cells;

    // Simple hash-based pattern (not a real QR code, but visually representative)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
    }

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;

    // Finder patterns (3 corners)
    const drawFinder = (ox, oy) => {
      svg += `<rect x="${ox}" y="${oy}" width="${cellSize * 7}" height="${cellSize * 7}" fill="black"/>`;
      svg += `<rect x="${ox + cellSize}" y="${oy + cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="white"/>`;
      svg += `<rect x="${ox + cellSize * 2}" y="${oy + cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="black"/>`;
    };
    drawFinder(0, 0);
    drawFinder(cellSize * 14, 0);
    drawFinder(0, cellSize * 14);

    // Data cells (pseudo-random based on hash)
    let seed = Math.abs(hash);
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        // Skip finder pattern areas
        if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        if (seed % 100 < 45) {
          svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
      }
    }

    svg += '</svg>';
    return svg;
  }

  // ── ZPL Output (Zebra Programming Language) ────────────────
  function generateZPL(data, options) {
    options = options || {};
    const labelWidth = options.width || 4; // inches
    const labelHeight = options.height || 6; // inches
    const dpi = options.dpi || 203; // Zebra GK420 = 203dpi, ZT411 = 300/600
    const dpmm = Math.round(dpi / 25.4);

    const w = Math.round(labelWidth * dpmm * 25.4 / 25.4);
    const h = Math.round(labelHeight * dpmm * 25.4 / 25.4);

    let zpl = '';
    zpl += `^XA`; // Start format
    zpl += `^PW${Math.round(labelWidth * dpi)}`; // Print width
    zpl += `^LL${Math.round(labelHeight * dpi)}`; // Label length
    zpl += `^LH0,0`; // Label home (0,0)
    zpl += `^LS0`; // Left shift

    if (options.type === 'part') {
      zpl += generatePartZPL(data, dpi);
    } else if (options.type === 'rack') {
      zpl += generateRackZPL(data, dpi);
    } else if (options.type === 'kit') {
      zpl += generateKitZPL(data, dpi);
    } else if (options.type === 'shipping') {
      zpl += generateShippingZPL(data, dpi);
    } else if (options.type === 'slot') {
      zpl += generateSlotZPL(data, dpi);
    } else if (options.type === 'ckd-part') {
      zpl += generateCKDPartZPL(data, dpi);
    } else if (options.type === 'ckd-kit') {
      zpl += generateCKDKitZPL(data, dpi);
    } else if (options.type === 'ckd-shipping') {
      zpl += generateCKDShippingZPL(data, dpi);
    } else if (options.type === 'ckd-customs') {
      zpl += generateCKDCustomsZPL(data, dpi);
    }

    zpl += `^XZ`; // End format
    return zpl;
  }

  function generatePartZPL(seq, dpi) {
    const scale = dpi / 203; // scale factor
    let z = '';
    z += `^FO${10 * scale},${10 * scale}^A0N,${30 * scale},${15 * scale}^FD${seq.oem} - PART LABEL^FS`;
    z += `^FO${10 * scale},${50 * scale}^A0N,${20 * scale},${10 * scale}^FDSeq: ${seq.id}^FS`;
    z += `^FO${10 * scale},${75 * scale}^A0N,${20 * scale},${10 * scale}^FDVIN: ${seq.vin}^FS`;
    z += `^FO${10 * scale},${100 * scale}^A0N,${20 * scale},${10 * scale}^FDPN: ${seq.partNumber}^FS`;
    z += `^FO${10 * scale},${125 * scale}^A0N,${20 * scale},${10 * scale}^FDCust: ${seq.customerPartNumber}^FS`;
    z += `^FO${10 * scale},${150 * scale}^A0N,${18 * scale},${9 * scale}^FD${seq.description.substring(0, 40)}^FS`;
    z += `^FO${10 * scale},${175 * scale}^A0N,${18 * scale},${9 * scale}^FDLine: ${seq.lineId}^FS`;
    // Code 128 barcode
    z += `^FO${10 * scale},${210 * scale}^BY${2 * scale}^BCN,${60 * scale},Y,N,N^FD${seq.partNumber}^FS`;
    // Footer
    z += `^FO${10 * scale},${300 * scale}^A0N,${14 * scale},${7 * scale}^FDAIAG Standard - OwlLogics v1.0^FS`;
    return z;
  }

  function generateRackZPL(rack, dpi) {
    const scale = dpi / 203;
    let z = '';
    z += `^FO${10 * scale},${10 * scale}^A0N,${30 * scale},${15 * scale}^FD${rack.lineName} - RACK LABEL^FS`;
    z += `^FO${10 * scale},${50 * scale}^A0N,${20 * scale},${10 * scale}^FDRack: ${rack.id}^FS`;
    z += `^FO${10 * scale},${75 * scale}^A0N,${20 * scale},${10 * scale}^FDLine: ${rack.lineId}^FS`;
    z += `^FO${10 * scale},${100 * scale}^A0N,${20 * scale},${10 * scale}^FDPattern: ${rack.pattern.toUpperCase()}^FS`;
    z += `^FO${10 * scale},${125 * scale}^A0N,${20 * scale},${10 * scale}^FDLoaded: ${rack.loadedCount}/${rack.slotCount}^FS`;
    // Barcode
    z += `^FO${10 * scale},${160 * scale}^BY${2 * scale}^BCN,${60 * scale},Y,N,N^FD${rack.id}^FS`;
    // Grid (simplified — list slots)
    let y = 250 * scale;
    const slotsPerRow = 5;
    rack.slots.forEach((slot, i) => {
      const col = i % slotsPerRow;
      const x = (10 + col * 70) * scale;
      const status = slot.status === 'loaded' ? slot.scannedPart.substring(0, 10) : '---';
      z += `^FO${x},${y}^A0N,${14 * scale},${7 * scale}^FD${slot.slotNumber}:${status}^FS`;
      if (col === slotsPerRow - 1) y += 20 * scale;
    });
    y += 30 * scale;
    z += `^FO${10 * scale},${y}^A0N,${14 * scale},${7 * scale}^FDAIAG 4x6 - OwlLogics v1.0^FS`;
    return z;
  }

  function generateKitZPL(kit, dpi) {
    const scale = dpi / 203;
    let z = '';
    z += `^FO${10 * scale},${10 * scale}^A0N,${28 * scale},${14 * scale}^FDKIT ASSEMBLY LABEL^FS`;
    z += `^FO${10 * scale},${45 * scale}^A0N,${20 * scale},${10 * scale}^FDKit: ${kit.id}^FS`;
    z += `^FO${10 * scale},${70 * scale}^A0N,${20 * scale},${10 * scale}^FDPart: ${kit.partNumber}^FS`;
    z += `^FO${10 * scale},${95 * scale}^A0N,${18 * scale},${9 * scale}^FD${kit.description.substring(0, 40)}^FS`;
    // Components
    let y = 125 * scale;
    z += `^FO${10 * scale},${y}^A0N,${16 * scale},${8 * scale}^FDComponents:^FS`;
    y += 20 * scale;
    kit.components.forEach((comp) => {
      const mark = comp.scanned ? '[X]' : '[ ]';
      z += `^FO${10 * scale},${y}^A0N,${14 * scale},${7 * scale}^FD${mark} ${comp.component} (${comp.partNumber})^FS`;
      y += 18 * scale;
    });
    // Barcode
    z += `^FO${10 * scale},${y + 10 * scale}^BY${2 * scale}^BCN,${50 * scale},Y,N,N^FD${kit.id}^FS`;
    z += `^FO${10 * scale},${y + 70 * scale}^A0N,${14 * scale},${7 * scale}^FDKit Label - OwlLogics v1.0^FS`;
    return z;
  }

  function generateShippingZPL(data, dpi) {
    const scale = dpi / 203;
    let z = '';
    z += `^FO${10 * scale},${10 * scale}^A0N,${36 * scale},${18 * scale}^FDSHIPPING LABEL^FS`;
    z += `^FO${10 * scale},${60 * scale}^A0N,${20 * scale},${10 * scale}^FDTo: ${data.to || 'OEM Assembly Plant'}^FS`;
    z += `^FO${10 * scale},${85 * scale}^A0N,${20 * scale},${10 * scale}^FDFrom: ${data.from || 'Supplier'}^FS`;
    z += `^FO${10 * scale},${110 * scale}^A0N,${20 * scale},${10 * scale}^FDBOL: ${data.bol || 'N/A'}^FS`;
    z += `^FO${10 * scale},${135 * scale}^A0N,${20 * scale},${10 * scale}^FDRacks: ${data.rackCount || 0}^FS`;
    z += `^FO${10 * scale},${160 * scale}^A0N,${20 * scale},${10 * scale}^FDDate: ${new Date().toISOString().slice(0, 10)}^FS`;
    // SSCC barcode
    z += `^FO${10 * scale},${200 * scale}^BY${3 * scale}^BCN,${80 * scale},Y,N,N^FD${data.tracking || 'OWLLOGICS' + Date.now()}^FS`;
    z += `^FO${10 * scale},${310 * scale}^A0N,${14 * scale},${7 * scale}^FDASN 856 - OwlLogics v1.0^FS`;
    return z;
  }

  function generateSlotZPL(data, dpi) {
    const scale = dpi / 203;
    let z = '';
    z += `^FO${10 * scale},${10 * scale}^A0N,${40 * scale},${20 * scale}^FDSLOT ${data.slotNumber}^FS`;
    z += `^FO${10 * scale},${60 * scale}^A0N,${20 * scale},${10 * scale}^FDRack: ${data.rackId}^FS`;
    if (data.expectedPart) {
      z += `^FO${10 * scale},${85 * scale}^A0N,${18 * scale},${9 * scale}^FDExpect: ${data.expectedPart}^FS`;
    }
    // Barcode for slot number
    z += `^FO${10 * scale},${120 * scale}^BY${2 * scale}^BCN,${50 * scale},Y,N,N^FD${data.rackId}-S${data.slotNumber}^FS`;
    z += `^FO${10 * scale},${200 * scale}^A0N,${14 * scale},${7 * scale}^FDSlot Label - OwlLogics v1.0^FS`;
    return z;
  }

  // ── CKD ZPL Generators ────────────────────────────────────
  function generateCKDPartZPL(data, dpi) {
    const scale = dpi / 203;
    let z = '';
    z += `^FO${10 * scale},${10 * scale}^A0N,${28 * scale},${14 * scale}^FDCKD PART LABEL^FS`;
    z += `^FO${10 * scale},${45 * scale}^A0N,${20 * scale},${10 * scale}^FDPN: ${data.partNumber || 'N/A'}^FS`;
    z += `^FO${10 * scale},${70 * scale}^A0N,${20 * scale},${10 * scale}^FDHS: ${data.hsCode || '8708.99'}^FS`;
    z += `^FO${10 * scale},${95 * scale}^A0N,${18 * scale},${9 * scale}^FD${(data.description || '').substring(0, 40)}^FS`;
    z += `^FO${10 * scale},${120 * scale}^A0N,${18 * scale},${9 * scale}^FDLot: ${data.lotNumber || 'N/A'}  Qty: ${data.quantity || 1}^FS`;
    z += `^FO${10 * scale},${145 * scale}^A0N,${18 * scale},${9 * scale}^FDOrigin: ${data.countryOfOrigin || 'US'}  Dest: ${data.destinationCountry || 'MX'}^FS`;
    z += `^FO${10 * scale},${170 * scale}^A0N,${18 * scale},${9 * scale}^FDCKD Type: ${data.ckdType || 'SKD-2'}  Tariff: ${data.tariffCode || 'NAFTA'}^FS`;
    // Code 128 barcode
    z += `^FO${10 * scale},${200 * scale}^BY${2 * scale}^BCN,${50 * scale},Y,N,N^FD${data.partNumber || 'CKDPART'}^FS`;
    // DataMatrix
    z += `^FO${250 * scale},${200 * scale}^BXN,${4 * scale},200^FD${data.partNumber || 'CKDPART'}${data.lotNumber || ''}^FS`;
    z += `^FO${10 * scale},${280 * scale}^A0N,${14 * scale},${7 * scale}^FDCKD Part - OwlLogics v1.0^FS`;
    return z;
  }

  function generateCKDKitZPL(data, dpi) {
    const scale = dpi / 203;
    let z = '';
    z += `^FO${10 * scale},${10 * scale}^A0N,${30 * scale},${15 * scale}^FDCKD KIT LABEL^FS`;
    z += `^FO${10 * scale},${50 * scale}^A0N,${20 * scale},${10 * scale}^FDKit: ${data.kitId || 'N/A'}^FS`;
    z += `^FO${10 * scale},${75 * scale}^A0N,${20 * scale},${10 * scale}^FDModel: ${data.modelCode || 'N/A'}^FS`;
    z += `^FO${10 * scale},${100 * scale}^A0N,${20 * scale},${10 * scale}^FDLevel: ${data.ckdLevel || 'CKD-S'}^FS`;
    z += `^FO${10 * scale},${125 * scale}^A0N,${20 * scale},${10 * scale}^FDContainer: ${data.containerId || 'N/A'}^FS`;
    z += `^FO${10 * scale},${150 * scale}^A0N,${20 * scale},${10 * scale}^FDDest: ${data.destinationCountry || 'MX'}  HS: ${data.hsCode || '8708.99'}^FS`;
    // Components
    let y = 180 * scale;
    if (data.components) {
      z += `^FO${10 * scale},${y}^A0N,${16 * scale},${8 * scale}^FDComponents:^FS`;
      y += 20 * scale;
      data.components.forEach((c) => {
        z += `^FO${10 * scale},${y}^A0N,${14 * scale},${7 * scale}^FD- ${c.name || c.component || ''} (${c.partNumber}) x${c.qty}^FS`;
        y += 18 * scale;
      });
    }
    // Code 39 barcode
    z += `^FO${10 * scale},${y + 10 * scale}^BY${2 * scale}^B3N,Y,${50 * scale},N^FD${data.kitId || 'CKDKIT'}^FS`;
    z += `^FO${10 * scale},${y + 75 * scale}^A0N,${14 * scale},${7 * scale}^FDCKD Kit - OwlLogics v1.0^FS`;
    return z;
  }

  function generateCKDShippingZPL(data, dpi) {
    const scale = dpi / 203;
    let z = '';
    z += `^FO${10 * scale},${10 * scale}^A0N,${36 * scale},${18 * scale}^FDCKD SHIPPING LABEL^FS`;
    z += `^FO${10 * scale},${60 * scale}^A0N,${18 * scale},${9 * scale}^FDShipper: ${data.shipper || 'OEM Mfg'}^FS`;
    z += `^FO${10 * scale},${82 * scale}^A0N,${18 * scale},${9 * scale}^FDConsignee: ${data.consignee || 'Assembly Plant'}^FS`;
    z += `^FO${10 * scale},${104 * scale}^A0N,${18 * scale},${9 * scale}^FDContainer: ${data.containerId || 'CNT-0000'}^FS`;
    z += `^FO${10 * scale},${126 * scale}^A0N,${18 * scale},${9 * scale}^FDBOL: ${data.bol || 'BOL-0000'}  Invoice: ${data.invoice || 'INV-0000'}^FS`;
    z += `^FO${10 * scale},${148 * scale}^A0N,${18 * scale},${9 * scale}^FDGross: ${data.grossWeight || '0'}kg  Net: ${data.netWeight || '0'}kg^FS`;
    z += `^FO${10 * scale},${170 * scale}^A0N,${18 * scale},${9 * scale}^FDPieces: ${data.pieceCount || 0}  Dest: ${data.destinationCountry || 'MX'}^FS`;
    // Code 128 barcode
    const tracking = data.tracking || 'CKD' + Date.now();
    z += `^FO${10 * scale},${200 * scale}^BY${3 * scale}^BCN,${60 * scale},Y,N,N^FD${tracking}^FS`;
    // EAN-13 SSCC
    z += `^FO${10 * scale},${280 * scale}^BY${2 * scale}^BEN,${40 * scale},Y,N^FD${data.sscc || '0000000000000'}^FS`;
    z += `^FO${10 * scale},${340 * scale}^A0N,${14 * scale},${7 * scale}^FDCKD Export - USMCA - OwlLogics v1.0^FS`;
    return z;
  }

  function generateCKDCustomsZPL(data, dpi) {
    const scale = dpi / 203;
    let z = '';
    z += `^FO${10 * scale},${10 * scale}^A0N,${30 * scale},${15 * scale}^FDCUSTOMS DECLARATION^FS`;
    z += `^FO${10 * scale},${50 * scale}^A0N,${20 * scale},${10 * scale}^FDEntry: ${data.customsEntry || 'CUS-0000'}^FS`;
    z += `^FO${10 * scale},${75 * scale}^A0N,${20 * scale},${10 * scale}^FDHS: ${data.hsCode || '8708.99'}  Tariff: ${data.tariffRate || '0%'}^FS`;
    z += `^FO${10 * scale},${100 * scale}^A0N,${20 * scale},${10 * scale}^FDValue: $${data.declaredValue || '0.00'} ${data.currency || 'USD'}^FS`;
    z += `^FO${10 * scale},${125 * scale}^A0N,${20 * scale},${10 * scale}^FDOrigin: ${data.countryOfOrigin || 'US'}  Dest: ${data.destinationCountry || 'MX'}^FS`;
    z += `^FO${10 * scale},${150 * scale}^A0N,${18 * scale},${9 * scale}^FDBroker: ${data.broker || 'Customs Broker Inc.'}^FS`;
    // Code 39 barcode
    z += `^FO${10 * scale},${180 * scale}^BY${2 * scale}^B3N,Y,${50 * scale},N^FD${data.customsEntry || 'CUS-0000'}^FS`;
    z += `^FO${10 * scale},${250 * scale}^A0N,${14 * scale},${7 * scale}^FDUSMCA Compliant - OwlLogics v1.0^FS`;
    return z;
  }

  // ── HTML Label Templates ───────────────────────────────────
  function renderPartLabel(seq) {
    const barcodeSVG = generateCode128SVG(seq.partNumber, { barWidth: 2, height: 45 });
    return `<div class="label-template label-3x1" data-label-type="part">
      <div class="lt-header">${escapeXML(seq.oem)} — PART SEQUENCE LABEL</div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Seq:</span><span class="lt-value">${seq.id}</span></div><div class="lt-field"><span class="lt-label">Line:</span><span class="lt-value">${seq.lineId}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">VIN:</span><span class="lt-value">${seq.vin}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">PN:</span><span class="lt-value">${seq.partNumber}</span></div><div class="lt-field"><span class="lt-label">Cust:</span><span class="lt-value">${seq.customerPartNumber}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Desc:</span><span class="lt-value">${escapeXML(seq.description)}</span></div></div>
      <div class="lt-barcode-svg">${barcodeSVG}</div>
      <div class="lt-footer">AIAG Standard — OwlLogics v1.0</div>
    </div>`;
  }

  function renderRackLabel(rack, labelData) {
    labelData = labelData || {};
    const barcodeSVG = generateCode128SVG(rack.id, { barWidth: 2, height: 50 });
    const qrSVG = generateSimpleMatrixSVG(rack.id + rack.lineId, 70);

    let gridHtml = `<div class="lt-grid" style="grid-template-columns:repeat(${rack.gridCols},1fr)">`;
    rack.slots.forEach(slot => {
      const partText = slot.scannedPart ? slot.scannedPart.substring(0, 10) : '—';
      const bg = slot.status === 'loaded' ? '#d4edda' : slot.status === 'error' ? '#f8d7da' : '#fff';
      gridHtml += `<div class="lt-grid-cell" style="background:${bg}">${slot.slotNumber}:${partText}</div>`;
    });
    gridHtml += '</div>';

    return `<div class="label-template label-4x6" data-label-type="rack">
      <div class="lt-header">${escapeXML(rack.lineName)} — RACK SEQUENCE LABEL</div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Rack ID:</span><span class="lt-value">${rack.id}</span></div><div class="lt-field"><span class="lt-label">Line:</span><span class="lt-value">${rack.lineId}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Pattern:</span><span class="lt-value">${rack.pattern.toUpperCase()}</span></div><div class="lt-field"><span class="lt-label">Type:</span><span class="lt-value">${rack.rackTypeName}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Seq Range:</span><span class="lt-value">${labelData.lowSeq || 0} – ${labelData.highSeq || 0}</span></div><div class="lt-field"><span class="lt-label">Loaded:</span><span class="lt-value">${rack.loadedCount}/${rack.slotCount}</span></div></div>
      <div class="lt-barcode-svg">${barcodeSVG}</div>
      ${gridHtml}
      <div class="lt-qrcode">${qrSVG}</div>
      <div class="lt-footer">AIAG 4×6 Standard — OwlLogics v1.0</div>
    </div>`;
  }

  function renderKitLabel(kit) {
    const barcodeSVG = generateCode128SVG(kit.id, { barWidth: 2, height: 45 });
    let compHtml = '';
    kit.components.forEach(comp => {
      const mark = comp.scanned ? '✓' : '☐';
      compHtml += `<div class="lt-row"><div class="lt-field"><span class="lt-label">${mark}</span><span class="lt-value">${escapeXML(comp.component)}</span></div><div class="lt-field"><span class="lt-label">PN:</span><span class="lt-value">${comp.partNumber}</span></div><div class="lt-field"><span class="lt-label">Qty:</span><span class="lt-value">${comp.qty}</span></div></div>`;
    });

    return `<div class="label-template label-4x2" data-label-type="kit">
      <div class="lt-header">KIT ASSEMBLY LABEL</div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Kit ID:</span><span class="lt-value">${kit.id}</span></div><div class="lt-field"><span class="lt-label">PN:</span><span class="lt-value">${kit.partNumber}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Desc:</span><span class="lt-value">${escapeXML(kit.description)}</span></div></div>
      <div style="margin-top:4px;border-top:1px solid #888;padding-top:4px"><strong>Components:</strong></div>
      ${compHtml}
      <div class="lt-barcode-svg">${barcodeSVG}</div>
      <div class="lt-footer">Kit Label — OwlLogics v1.0</div>
    </div>`;
  }

  function renderShippingLabel(data) {
    const tracking = data.tracking || 'OWL' + Date.now();
    const barcodeSVG = generateCode128SVG(tracking, { barWidth: 3, height: 60 });
    const qrSVG = generateSimpleMatrixSVG(tracking, 80);
    return `<div class="label-template label-4x6" data-label-type="shipping">
      <div class="lt-header">SHIPPING LABEL — ASN 856</div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">To:</span><span class="lt-value">${escapeXML(data.to || 'OEM Assembly Plant')}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">From:</span><span class="lt-value">${escapeXML(data.from || 'Supplier Facility')}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">BOL:</span><span class="lt-value">${data.bol || 'N/A'}</span></div><div class="lt-field"><span class="lt-label">Racks:</span><span class="lt-value">${data.rackCount || 0}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Date:</span><span class="lt-value">${new Date().toISOString().slice(0, 10)}</span></div></div>
      <div class="lt-qrcode">${qrSVG}</div>
      <div class="lt-barcode-svg">${barcodeSVG}</div>
      <div class="lt-barcode-text">${tracking}</div>
      <div class="lt-footer">EDI 856 ASN — OwlLogics v1.0</div>
    </div>`;
  }

  function renderSlotLabel(data) {
    const slotCode = `${data.rackId}-S${data.slotNumber}`;
    const barcodeSVG = generateCode128SVG(slotCode, { barWidth: 2, height: 40 });
    return `<div class="label-template label-2x1" data-label-type="slot">
      <div class="lt-header">SLOT ${data.slotNumber}</div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Rack:</span><span class="lt-value">${data.rackId}</span></div></div>
      ${data.expectedPart ? `<div class="lt-row"><div class="lt-field"><span class="lt-label">Expect:</span><span class="lt-value">${data.expectedPart}</span></div></div>` : ''}
      <div class="lt-barcode-svg">${barcodeSVG}</div>
      <div class="lt-footer">Slot Label — OwlLogics</div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  //  CKD (Completely Knocked Down) BUSINESS LOGIC LABELS
  //  CKD = vehicles shipped as unassembled kits for assembly
  //  in destination country (customs, tariffs, local content)
  // ═══════════════════════════════════════════════════════════

  function renderCKDPartLabel(data) {
    const barcodeSVG = generateBarcodeSVG(data.partNumber, 'code128', { barWidth: 2, height: 45 });
    const dmSVG = generateDataMatrixSVG(data.partNumber + data.lotNumber, { size: 60 });
    return `<div class="label-template label-4x2" data-label-type="ckd-part">
      <div class="lt-header">CKD PART LABEL — ${escapeXML(data.destinationCountry || 'EXPORT')}</div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Part:</span><span class="lt-value">${data.partNumber}</span></div><div class="lt-field"><span class="lt-label">HS Code:</span><span class="lt-value">${data.hsCode || '8708.99'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Desc:</span><span class="lt-value">${escapeXML(data.description || '')}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Lot:</span><span class="lt-value">${data.lotNumber || 'N/A'}</span></div><div class="lt-field"><span class="lt-label">Qty:</span><span class="lt-value">${data.quantity || 1}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Origin:</span><span class="lt-value">${data.countryOfOrigin || 'US'}</span></div><div class="lt-field"><span class="lt-label">Dest:</span><span class="lt-value">${data.destinationCountry || 'MX'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">CKD Type:</span><span class="lt-value">${data.ckdType || 'SKD-2'}</span></div><div class="lt-field"><span class="lt-label">Tariff:</span><span class="lt-value">${data.tariffCode || 'NAFTA'}</span></div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="lt-barcode-svg" style="flex:1">${barcodeSVG}</div>
        <div class="lt-qrcode">${dmSVG}</div>
      </div>
      <div class="lt-footer">CKD Part Label — Customs Compliant — OwlLogics v1.0</div>
    </div>`;
  }

  function renderCKDKitLabel(data) {
    const barcodeSVG = generateBarcodeSVG(data.kitId, 'code39', { barWidth: 2, height: 45 });
    const dmSVG = generateDataMatrixSVG(data.kitId + data.modelCode, { size: 60 });
    let partsHtml = '';
    if (data.components) {
      data.components.forEach(c => {
        partsHtml += `<div class="lt-row"><div class="lt-field"><span class="lt-label">•</span><span class="lt-value">${escapeXML(c.name || c.component || '')}</span></div><div class="lt-field"><span class="lt-label">PN:</span><span class="lt-value">${c.partNumber}</span></div><div class="lt-field"><span class="lt-label">Qty:</span><span class="lt-value">${c.qty}</span></div></div>`;
      });
    }
    return `<div class="label-template label-4x6" data-label-type="ckd-kit">
      <div class="lt-header">CKD KIT LABEL — COMPLETELY KNOCKED DOWN</div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Kit ID:</span><span class="lt-value">${data.kitId}</span></div><div class="lt-field"><span class="lt-label">Model:</span><span class="lt-value">${data.modelCode || 'N/A'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">CKD Level:</span><span class="lt-value">${data.ckdLevel || 'CKD-S'}</span></div><div class="lt-field"><span class="lt-label">Assembly:</span><span class="lt-value">${data.assemblyPlant || 'TBD'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Container:</span><span class="lt-value">${data.containerId || 'CNT-0000'}</span></div><div class="lt-field"><span class="lt-label">Pallet:</span><span class="lt-value">${data.palletId || 'PLT-0000'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Dest:</span><span class="lt-value">${data.destinationCountry || 'MX'}</span></div><div class="lt-field"><span class="lt-label">HS Code:</span><span class="lt-value">${data.hsCode || '8708.99'}</span></div></div>
      <div style="margin-top:4px;border-top:1px solid #888;padding-top:4px"><strong>Kit Components:</strong></div>
      ${partsHtml}
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
        <div class="lt-barcode-svg" style="flex:1">${barcodeSVG}</div>
        <div class="lt-qrcode">${dmSVG}</div>
      </div>
      <div class="lt-footer">CKD Kit — Customs Declaration Attached — OwlLogics v1.0</div>
    </div>`;
  }

  function renderCKDShippingLabel(data) {
    const tracking = data.tracking || 'CKD' + Date.now();
    const barcodeSVG = generateBarcodeSVG(tracking, 'code128', { barWidth: 3, height: 55 });
    const eanSVG = generateEAN13SVG(data.sscc || '0000000000000', { barWidth: 2, height: 40, showText: true });
    const dmSVG = generateDataMatrixSVG(tracking + data.containerId, { size: 70 });
    return `<div class="label-template label-4x6" data-label-type="ckd-shipping">
      <div class="lt-header">CKD SHIPPING LABEL — EXPORT DOCUMENT</div>
      <div style="display:flex;justify-content:space-between;margin:4px 0">
        <div><strong>Shipper:</strong><br>${escapeXML(data.shipper || 'OEM Manufacturing')}<br>${escapeXML(data.shipperAddr || 'Detroit, MI, USA')}</div>
        <div><strong>Consignee:</strong><br>${escapeXML(data.consignee || 'Assembly Plant')}<br>${escapeXML(data.consigneeAddr || 'Silao, GTO, MX')}</div>
      </div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Container:</span><span class="lt-value">${data.containerId || 'CNT-0000'}</span></div><div class="lt-field"><span class="lt-label">Seal:</span><span class="lt-value">${data.sealNumber || 'SEAL-0000'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">BOL:</span><span class="lt-value">${data.bol || 'BOL-0000'}</span></div><div class="lt-field"><span class="lt-label">Invoice:</span><span class="lt-value">${data.invoice || 'INV-0000'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Gross Wt:</span><span class="lt-value">${data.grossWeight || '0'} kg</span></div><div class="lt-field"><span class="lt-label">Net Wt:</span><span class="lt-value">${data.netWeight || '0'} kg</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Pieces:</span><span class="lt-value">${data.pieceCount || 0}</span></div><div class="lt-field"><span class="lt-label">Country:</span><span class="lt-value">${data.destinationCountry || 'MX'}</span></div></div>
      <div class="lt-qrcode">${dmSVG}</div>
      <div class="lt-barcode-svg">${barcodeSVG}</div>
      <div class="lt-barcode-text">${tracking}</div>
      <div style="margin-top:6px"><strong>SSCC:</strong></div>
      <div class="lt-barcode-svg">${eanSVG}</div>
      <div class="lt-footer">CKD Export — USMCA/NAFTA Compliant — OwlLogics v1.0</div>
    </div>`;
  }

  function renderCKDCustomsLabel(data) {
    const barcodeSVG = generateBarcodeSVG(data.customsEntry || 'CUS-0000', 'code39', { barWidth: 2, height: 45 });
    const dmSVG = generateDataMatrixSVG(data.customsEntry + data.hsCode, { size: 60 });
    return `<div class="label-template label-4x2" data-label-type="ckd-customs">
      <div class="lt-header">CUSTOMS DECLARATION — CKD SHIPMENT</div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Entry:</span><span class="lt-value">${data.customsEntry || 'CUS-0000'}</span></div><div class="lt-field"><span class="lt-label">Date:</span><span class="lt-value">${data.entryDate || new Date().toISOString().slice(0,10)}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">HS Code:</span><span class="lt-value">${data.hsCode || '8708.99'}</span></div><div class="lt-field"><span class="lt-label">Tariff:</span><span class="lt-value">${data.tariffRate || '0%'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Value:</span><span class="lt-value">$${data.declaredValue || '0.00'}</span></div><div class="lt-field"><span class="lt-label">Currency:</span><span class="lt-value">${data.currency || 'USD'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Origin:</span><span class="lt-value">${data.countryOfOrigin || 'US'}</span></div><div class="lt-field"><span class="lt-label">Dest:</span><span class="lt-value">${data.destinationCountry || 'MX'}</span></div></div>
      <div class="lt-row"><div class="lt-field"><span class="lt-label">Broker:</span><span class="lt-value">${escapeXML(data.broker || 'Customs Broker Inc.')}</span></div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="lt-barcode-svg" style="flex:1">${barcodeSVG}</div>
        <div class="lt-qrcode">${dmSVG}</div>
      </div>
      <div class="lt-footer">Customs Declaration — USMCA Compliant — OwlLogics v1.0</div>
    </div>`;
  }

  // ── Batch Label Generation ─────────────────────────────────
  function renderBatchPartLabels(sequences) {
    let html = '<div class="label-batch-grid">';
    sequences.forEach(seq => {
      html += `<div class="label-batch-item">${renderPartLabel(seq)}</div>`;
    });
    html += '</div>';
    return html;
  }

  function renderBatchSlotLabels(rack) {
    let html = '<div class="label-batch-grid">';
    rack.slots.forEach(slot => {
      html += `<div class="label-batch-item">${renderSlotLabel({
        rackId: rack.id,
        slotNumber: slot.slotNumber,
        expectedPart: slot.expectedPart,
      })}</div>`;
    });
    html += '</div>';
    return html;
  }

  // ── Print System ───────────────────────────────────────────
  function printLabels(htmlContent) {
    let printArea = document.getElementById('print-area');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'print-area';
      document.body.appendChild(printArea);
    }
    printArea.innerHTML = htmlContent;
    printArea.classList.add('active');

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      window.print();
      // Clean up after print dialog
      setTimeout(() => {
        printArea.classList.remove('active');
        printArea.innerHTML = '';
      }, 500);
    }, 100);
  }

  function downloadZPL(zpl, filename) {
    const blob = new Blob([zpl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'owllogics_label.zpl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    // Barcode formats
    getBarcodeFormats,
    generateBarcodeSVG,
    generateCode128SVG,
    generateCode39SVG,
    generateCode93SVG,
    generateI2of5SVG,
    generateEAN13SVG,
    generateDataMatrixSVG,
    generateSimpleMatrixSVG,
    // ZPL
    generateZPL,
    // Standard label templates
    renderPartLabel,
    renderRackLabel,
    renderKitLabel,
    renderShippingLabel,
    renderSlotLabel,
    // CKD label templates
    renderCKDPartLabel,
    renderCKDKitLabel,
    renderCKDShippingLabel,
    renderCKDCustomsLabel,
    // Batch
    renderBatchPartLabels,
    renderBatchSlotLabels,
    // Print / download
    printLabels,
    downloadZPL,
    escapeXML,
  };
})();
