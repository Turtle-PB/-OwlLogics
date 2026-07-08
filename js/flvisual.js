/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved - Patent Pending
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Forklift Visual Builder
   ============================================================ */

var ForkliftVisual = (function () {

  // ── 2D Side-View SVG Generator ────────────────────────────
  function generate2DSVG(fl) {
    var isElectric = fl.powerSource === 'electric';
    var bodyColor = isElectric ? '#2ECC71' : '#E67E22';
    var mastColor = '#555';
    var wheelColor = '#333';
    var loadColor = fl.status === 'assigned' ? '#3498DB' : '#666';

    var svg = '<svg class="fl2d-svg" viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">';
    // Ground line
    svg += '<line x1="10" y1="105" x2="230" y2="105" stroke="#444" stroke-width="1" stroke-dasharray="4,3"/>';

    // Counterweight (rear)
    svg += '<rect x="20" y="65" width="15" height="35" fill="#222" rx="2"/>';

    // Body
    svg += '<rect x="35" y="60" width="80" height="40" fill="' + bodyColor + '" rx="4" opacity="0.7"/>';
    svg += '<rect x="35" y="60" width="80" height="40" fill="none" stroke="#555" stroke-width="1" rx="4"/>';

    // Cab (operator area)
    svg += '<rect x="45" y="45" width="40" height="20" fill="' + bodyColor + '" rx="3" opacity="0.5"/>';
    svg += '<rect x="45" y="45" width="40" height="20" fill="none" stroke="#555" stroke-width="1" rx="3"/>';
    // Steering wheel
    svg += '<circle cx="75" cy="55" r="4" fill="none" stroke="#888" stroke-width="1.5"/>';
    // Operator silhouette
    svg += '<circle cx="60" cy="52" r="3" fill="#888"/>';

    // Mast (vertical)
    svg += '<rect x="120" y="25" width="6" height="80" fill="' + mastColor + '" rx="1"/>';
    svg += '<rect x="140" y="25" width="6" height="80" fill="' + mastColor + '" rx="1"/>';
    // Mast cross-braces
    svg += '<line x1="126" y1="40" x2="140" y2="40" stroke="#444" stroke-width="2"/>';
    svg += '<line x1="126" y1="60" x2="140" y2="60" stroke="#444" stroke-width="2"/>';
    svg += '<line x1="126" y1="80" x2="140" y2="80" stroke="#444" stroke-width="2"/>';

    // Forks (horizontal)
    svg += '<rect x="146" y="95" width="60" height="4" fill="' + mastColor + '" rx="1"/>';
    svg += '<rect x="146" y="100" width="55" height="3" fill="' + mastColor + '" rx="1"/>';

    // Load on forks (if assigned)
    if (fl.status === 'assigned') {
      svg += '<rect x="150" y="75" width="50" height="20" fill="' + loadColor + '" rx="2" opacity="0.5"/>';
      svg += '<rect x="150" y="75" width="50" height="20" fill="none" stroke="#3498DB" stroke-width="1" rx="2"/>';
    }

    // Wheels
    svg += '<circle cx="55" cy="100" r="10" fill="' + wheelColor + '"/>';
    svg += '<circle cx="55" cy="100" r="5" fill="#555"/>';
    svg += '<circle cx="100" cy="100" r="10" fill="' + wheelColor + '"/>';
    svg += '<circle cx="100" cy="100" r="5" fill="#555"/>';

    // Battery (if electric)
    if (isElectric) {
      svg += '<rect x="40" y="68" width="20" height="12" fill="none" stroke="#2ECC71" stroke-width="1" rx="1"/>';
      svg += '<text x="50" y="77" text-anchor="middle" font-size="6" fill="#2ECC71">BAT</text>';
    }

    // Labels
    svg += '<text x="120" y="18" text-anchor="middle" font-size="7" fill="#9090a8" font-family="monospace">' + fl.unitNumber + '</text>';

    svg += '</svg>';
    return svg;
  }

  // ── 2D Top-View SVG ────────────────────────────────────────
  function generate2DTopSVG(fl) {
    var svg = '<svg class="fl2d-svg" viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">';
    // Body top view
    svg += '<rect x="60" y="30" width="100" height="60" fill="rgba(142,68,173,0.2)" stroke="#555" stroke-width="1" rx="4"/>';
    // Counterweight (rear)
    svg += '<rect x="60" y="30" width="15" height="60" fill="#222" rx="2"/>';
    // Cab
    svg += '<rect x="80" y="40" width="35" height="40" fill="rgba(46,204,113,0.15)" stroke="#555" rx="3"/>';
    // Mast
    svg += '<rect x="160" y="50" width="20" height="20" fill="#555" rx="1"/>';
    // Forks
    svg += '<rect x="180" y="48" width="40" height="4" fill="#444" rx="1"/>';
    svg += '<rect x="180" y="68" width="40" height="4" fill="#444" rx="1"/>';
    // Wheels (4 corners)
    svg += '<circle cx="70" cy="28" r="6" fill="#333"/>';
    svg += '<circle cx="150" cy="28" r="6" fill="#333"/>';
    svg += '<circle cx="70" cy="92" r="6" fill="#333"/>';
    svg += '<circle cx="150" cy="92" r="6" fill="#333"/>';
    // Label
    svg += '<text x="120" y="65" text-anchor="middle" font-size="8" fill="#9090a8" font-family="monospace">' + fl.unitNumber + '</text>';
    svg += '<text x="120" y="110" text-anchor="middle" font-size="6" fill="#606078">TOP VIEW</text>';
    svg += '</svg>';
    return svg;
  }

  // ── 3D CSS Forklift HTML ───────────────────────────────────
  function generate3DHTML(fl) {
    var hasLoad = fl.status === 'assigned';
    var html = '<div class="fl3d-scene">';
    html += '<div class="fl3d-floor"></div>';
    html += '<div class="fl3d-stage" id="fl3d-stage-' + fl.id + '">';

    // Body (6 faces)
    html += '<div class="fl3d-body">';
    html += '<div class="fl3d-body-face fl3d-body-front"></div>';
    html += '<div class="fl3d-body-face fl3d-body-back"></div>';
    html += '<div class="fl3d-body-face fl3d-body-top"></div>';
    html += '<div class="fl3d-body-face fl3d-body-left"></div>';
    html += '<div class="fl3d-body-face fl3d-body-right"></div>';
    html += '</div>';

    // Cab
    html += '<div class="fl3d-cab">';
    html += '<div class="fl3d-cab-front"></div>';
    html += '<div class="fl3d-cab-top"></div>';
    html += '</div>';

    // Mast
    html += '<div class="fl3d-mast">';
    html += '<div class="fl3d-mast-bar fl3d-mast-l"></div>';
    html += '<div class="fl3d-mast-bar fl3d-mast-r"></div>';
    html += '</div>';

    // Forks
    html += '<div class="fl3d-forks">';
    html += '<div class="fl3d-fork fl3d-fork-l"></div>';
    html += '<div class="fl3d-fork fl3d-fork-r"></div>';
    html += '</div>';

    // Load (if assigned)
    if (hasLoad) html += '<div class="fl3d-load"></div>';

    // Counterweight
    html += '<div class="fl3d-counterweight"></div>';

    // Wheels
    html += '<div class="fl3d-wheel fl3d-wheel-fl"></div>';
    html += '<div class="fl3d-wheel fl3d-wheel-fr"></div>';
    html += '<div class="fl3d-wheel fl3d-wheel-rl"></div>';
    html += '<div class="fl3d-wheel fl3d-wheel-rr"></div>';

    html += '</div>'; // stage

    // Rotation controls
    html += '<div class="fl3d-controls">';
    html += '<button class="btn btn-sm" onclick="ForkliftVisual.rotate3D(\'' + fl.id + '\',\'side\')">⟲ Side</button>';
    html += '<button class="btn btn-sm" onclick="ForkliftVisual.rotate3D(\'' + fl.id + '\',\'front\')">⬛ Front</button>';
    html += '<button class="btn btn-sm" onclick="ForkliftVisual.rotate3D(\'' + fl.id + '\',\'top\')">⬆ Top</button>';
    html += '</div>';

    html += '<div class="fl3d-label">' + fl.unitNumber + ' — ' + fl.brand + ' ' + fl.model + '</div>';

    html += '</div>';
    return html;
  }

  function rotate3D(flId, view) {
    var stage = document.getElementById('fl3d-stage-' + flId);
    if (!stage) return;
    stage.className = 'fl3d-stage fl3d-' + view;
  }

  // ── Build Config Diagram ───────────────────────────────────
  function generateBuildDiagram(fl) {
    // Dimensions diagram (side view with measurements)
    var forkLen = parseInt(fl.forkLength) || 42;
    var mastHeight = parseInt(fl.mastHeight) || 83;
    var bodyLen = 90;
    var overallLen = bodyLen + forkLen + 10;

    var svg = '<svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:280px">';
    // Ground
    svg += '<line x1="10" y1="130" x2="290" y2="130" stroke="#444" stroke-width="1"/>';
    // Body
    svg += '<rect x="30" y="85" width="' + bodyLen + '" height="40" fill="rgba(142,68,173,0.15)" stroke="#8E44AD" rx="4"/>';
    // Counterweight
    svg += '<rect x="15" y="90" width="15" height="30" fill="#222" rx="2"/>';
    // Cab
    svg += '<rect x="40" y="70" width="35" height="18" fill="rgba(46,204,113,0.1)" stroke="#555" rx="3"/>';
    // Mast
    var mastX = 30 + bodyLen;
    var mastY = 130 - mastHeight - 10;
    svg += '<rect x="' + mastX + '" y="' + (mastY + 10) + '" width="6" height="' + mastHeight + '" fill="#555" rx="1"/>';
    svg += '<rect x="' + (mastX + 14) + '" y="' + (mastY + 10) + '" width="6" height="' + mastHeight + '" fill="#555" rx="1"/>';
    // Forks
    var forkX = mastX + 20;
    svg += '<rect x="' + forkX + '" y="125" width="' + forkLen + '" height="4" fill="#444" rx="1"/>';
    svg += '<rect x="' + forkX + '" y="129" width="' + (forkLen - 5) + '" height="3" fill="#444" rx="1"/>';
    // Wheels
    svg += '<circle cx="55" cy="125" r="8" fill="#333"/>';
    svg += '<circle cx="95" cy="125" r="8" fill="#333"/>';

    // Dimension lines
    // Overall length
    svg += '<line x1="15" y1="50" x2="' + (forkX + forkLen) + '" y2="50" stroke="#2ECC71" stroke-width="1"/>';
    svg += '<line x1="15" y1="45" x2="15" y2="55" stroke="#2ECC71" stroke-width="1"/>';
    svg += '<line x1="' + (forkX + forkLen) + '" y1="45" x2="' + (forkX + forkLen) + '" y2="55" stroke="#2ECC71" stroke-width="1"/>';
    svg += '<text x="' + ((15 + forkX + forkLen) / 2) + '" y="45" text-anchor="middle" font-size="7" fill="#2ECC71" font-family="monospace">OAL: ' + overallLen + '"</text>';

    // Mast height
    svg += '<line x1="270" y1="' + (mastY + 10) + '" x2="270" y2="130" stroke="#3498DB" stroke-width="1"/>';
    svg += '<line x1="265" y1="' + (mastY + 10) + '" x2="275" y2="' + (mastY + 10) + '" stroke="#3498DB" stroke-width="1"/>';
    svg += '<line x1="265" y1="130" x2="275" y2="130" stroke="#3498DB" stroke-width="1"/>';
    svg += '<text x="278" y="' + ((mastY + 70)) + '" font-size="7" fill="#3498DB" font-family="monospace">MH: ' + mastHeight + '"</text>';

    // Fork length
    svg += '<line x1="' + forkX + '" y1="145" x2="' + (forkX + forkLen) + '" y2="145" stroke="#E67E22" stroke-width="1"/>';
    svg += '<text x="' + (forkX + forkLen / 2) + '" y="155" text-anchor="middle" font-size="7" fill="#E67E22" font-family="monospace">FL: ' + forkLen + '"</text>';

    // Title
    svg += '<text x="150" y="15" text-anchor="middle" font-size="9" fill="#9090a8" font-family="monospace">' + fl.unitNumber + ' Build Diagram</text>';

    svg += '</svg>';
    return svg;
  }

  // ── Fork build specs ──────────────────────────────────────
  function getForkSpecs(fl) {
    return {
      forkLength: fl.forkLength || '42"',
      forkThickness: fl.forkThickness || '1.5"',
      mastHeight: fl.mastHeight || '83"',
      mastType: fl.mastType || '2-stage',
      mastLiftHeight: fl.mastLiftHeight || '189"',
      tireType: fl.tireType || 'cushion',
      tireSize: fl.tireSize || '21x7-15',
      forkSpacing: fl.forkSpacing || '36"',
      loadCenter: fl.loadCenter || '24"',
      overallLength: fl.overallLength || '142"',
      overallWidth: fl.overallWidth || '36"',
      overallHeight: fl.overallHeight || '83"',
      groundClearance: fl.groundClearance || '3.5"',
      turningRadius: fl.turningRadius || '78"',
    };
  }

  return {
    generate2DSVG: generate2DSVG,
    generate2DTopSVG: generate2DTopSVG,
    generate3DHTML: generate3DHTML,
    rotate3D: rotate3D,
    generateBuildDiagram: generateBuildDiagram,
    getForkSpecs: getForkSpecs,
  };
})();
