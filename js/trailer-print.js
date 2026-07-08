/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Trailer & Print Server Module
   - Trailer management (fleet, maintenance, assignments, dock doors)
   - Print server (Windows print server, HP/Zebra/Brother, DHCP/static)
   ============================================================ */

var TrailerPrint = (function () {

  var state = {
    trailers: [],
    printServers: [],
    printers: []
  };

  // ── Trailer Management ─────────────────────────────────────

  function init() {
    if (state.trailers.length > 0) return;
    state.trailers = [
      { id:'TLR-001', unit:'TRL-1043', type:'53ft Dry Van', plate:'IL-TRR1043', vin:'1XAD49DP3ED104320',
        carrier:'J.B. Hunt', assignedDriver:'Mike R.', status:'in_transit',
        dockDoor:'DOCK-12', maxWeight:45000, loadedWeight:38500,
        lastInspection:'2024-06-15', nextInspection:'2024-12-15',
        tireCondition:'Good', brakeCondition:'Good', lightsOK:true,
        registrationExp:'2025-03-31', insuranceExp:'2025-01-15',
        cargo:'Sequenced Bumpers (20 racks)', destination:'SHAP - Sterling Heights, MI',
        notes:'Left rear door seal needs replacement'
      },
      { id:'TLR-002', unit:'TRL-2207', type:'53ft Reefer', plate:'MI-TRR2207', vin:'1XAD49RP4ED122071',
        carrier:'Schneider', assignedDriver:'Sarah K.', status:'in_transit',
        dockDoor:'DOCK-08', maxWeight:45000, loadedWeight:31200,
        lastInspection:'2024-05-20', nextInspection:'2024-11-20',
        tireCondition:'Good', brakeCondition:'Fair', lightsOK:true,
        registrationExp:'2025-06-30', insuranceExp:'2024-12-01',
        cargo:'Painted Fascias (temp-controlled 68F)', destination:'JNAP - Detroit, MI',
        notes:'Reefer unit serviced 2024-06-01'
      },
      { id:'TLR-003', unit:'TRL-3301', type:'53ft Flatbed', plate:'OH-TRR3301', vin:'1XAD49FP5ED133012',
        carrier:'Werner', assignedDriver:'Tom B.', status:'loading',
        dockDoor:'DOCK-15', maxWeight:48000, loadedWeight:0,
        lastInspection:'2024-07-01', nextInspection:'2025-01-01',
        tireCondition:'New', brakeCondition:'Good', lightsOK:true,
        registrationExp:'2025-08-31', insuranceExp:'2025-02-28',
        cargo:'Empty — loading HD Engine Cradles', destination:'Windsor Assembly - Windsor, ON',
        notes:'New tires installed 2024-07-01'
      },
      { id:'TLR-004', unit:'TRL-4456', type:'40ft Container Chassis', plate:'CA-TRR4456', vin:'1XAD49CP6ED144563',
        carrier:'Prime Inc', assignedDriver:'Lisa M.', status:'at_dock',
        dockDoor:'DOCK-03', maxWeight:45000, loadedWeight:42100,
        lastInspection:'2024-04-10', nextInspection:'2024-10-10',
        tireCondition:'Fair', brakeCondition:'Fair', lightsOK:false,
        registrationExp:'2024-12-31', insuranceExp:'2024-11-30',
        cargo:'CKD Import - Hamburg', destination:'Torrance DC',
        notes:'RIGHT BRAKE LIGHT OUT — needs repair before dispatch. Reg expiring soon.'
      },
      { id:'TLR-005', unit:'TRL-5789', type:'53ft Dry Van', plate:'IN-TRR5789', vin:'1XAD49DP7ED157894',
        carrier:'J.B. Hunt', assignedDriver:'Unassigned', status:'available',
        dockDoor:'DOCK-09', maxWeight:45000, loadedWeight:0,
        lastInspection:'2024-06-01', nextInspection:'2024-12-01',
        tireCondition:'Good', brakeCondition:'Good', lightsOK:true,
        registrationExp:'2025-05-31', insuranceExp:'2025-03-15',
        cargo:'Empty', destination:'—',
        notes:'Available for assignment'
      },
      { id:'TLR-006', unit:'TRL-6012', type:'53ft Reefer', plate:'WI-TRR6012', vin:'1XAD49RP8ED160125',
        carrier:'Prime Inc', assignedDriver:'Unassigned', status:'maintenance',
        dockDoor:'SHOP-01', maxWeight:45000, loadedWeight:0,
        lastInspection:'2024-03-15', nextInspection:'2024-09-15',
        tireCondition:'Poor', brakeCondition:'Poor', lightsOK:false,
        registrationExp:'2024-10-31', insuranceExp:'2024-09-30',
        cargo:'Empty — in shop for brake overhaul', destination:'—',
        notes:'IN SHOP: Brake overhaul + tire replacement. EXP REG/INS expired or expiring!'
      }
    ];

    state.printServers = [
      { id:'PS-001', name:'Auburn Hills Print Server', host:'prnt-srv-01', os:'Windows Server 2019',
        ip:'10.1.1.50', port:9100, protocol:'TCP/IP (Raw)', dhcp:false, domain:'OWLLOGICS.LOCAL',
        printers: 8, status:'online', uptime:'342 days'
      },
      { id:'PS-002', name:'Kansas City Print Server', host:'prnt-srv-02', os:'Windows Server 2019',
        ip:'10.2.1.50', port:9100, protocol:'TCP/IP (Raw)', dhcp:false, domain:'OWLLOGICS.LOCAL',
        printers: 6, status:'online', uptime:'128 days'
      },
      { id:'PS-003', name:'Windsor Print Server', host:'prnt-srv-03', os:'Windows Server 2022',
        ip:'10.3.1.50', port:9100, protocol:'TCP/IP (Raw)', dhcp:true, domain:'OWLLOGICS.LOCAL',
        printers: 4, status:'online', uptime:'45 days'
      }
    ];

    state.printers = [
      { id:'PRT-001', name:'HP LaserJet Enterprise M611 (Shipping)', server:'PS-001', make:'HP', model:'LaserJet Enterprise M611',
        ip:'10.1.1.51', dhcp:false, mac:'00:1A:2B:3C:4D:51', port:'9100', driver:'HP Universal Print Driver PCL6',
        location:'Shipping Office — Dock 12', status:'online', paperSize:'Letter', duplex:true, tonerLevel:78,
        lastJob:'2024-07-08 14:23', jobsToday:47
      },
      { id:'PRT-002', name:'Zebra ZT411 (Sequence Labels)', server:'PS-001', make:'Zebra', model:'ZT411 (203 DPI)',
        ip:'10.1.1.52', dhcp:false, mac:'00:1A:2B:3C:4D:52', port:'9100', driver:'ZDesigner ZT411 (ZPL)',
        location:'Rack Loading Station A', status:'online', paperSize:'4x6 Thermal', duplex:false, tonerLevel:92,
        lastJob:'2024-07-08 14:45', jobsToday:156, zpl:true
      },
      { id:'PRT-003', name:'Zebra ZT411 (Kit Labels)', server:'PS-001', make:'Zebra', model:'ZT411 (300 DPI)',
        ip:'10.1.1.53', dhcp:false, mac:'00:1A:2B:3C:4D:53', port:'9100', driver:'ZDesigner ZT411 (ZPL)',
        location:'Kitting Station B', status:'online', paperSize:'4x4 Thermal', duplex:false, tonerLevel:85,
        lastJob:'2024-07-08 13:12', jobsToday:89, zpl:true
      },
      { id:'PRT-004', name:'HP LaserJet Pro M404 (Office)', server:'PS-001', make:'HP', model:'LaserJet Pro M404',
        ip:'10.1.1.54', dhcp:false, mac:'00:1A:2B:3C:4D:54', port:'9100', driver:'HP Universal Print Driver PCL6',
        location:'Front Office', status:'online', paperSize:'Letter', duplex:true, tonerLevel:45,
        lastJob:'2024-07-08 12:01', jobsToday:23
      },
      { id:'PRT-005', name:'Brother HL-L6450DW (Warehouse)', server:'PS-001', make:'Brother', model:'HL-L6450DW',
        ip:'10.1.1.55', dhcp:true, mac:'00:1A:2B:3C:4D:55', port:'9100', driver:'Brother HL-L6450DW series',
        location:'Warehouse Office', status:'online', paperSize:'Letter', duplex:true, tonerLevel:62,
        lastJob:'2024-07-08 11:30', jobsToday:15
      },
      { id:'PRT-006', name:'Zebra ZD420 (Mobile Cart)', server:'PS-002', make:'Zebra', model:'ZD420 (203 DPI)',
        ip:'10.2.1.51', dhcp:true, mac:'00:1A:2B:3C:4D:61', port:'9100', driver:'ZDesigner ZD420 (ZPL)',
        location:'Milk Run Cart 3', status:'offline', paperSize:'4x6 Thermal', duplex:false, tonerLevel:15,
        lastJob:'2024-07-07 16:45', jobsToday:0, zpl:true
      },
      { id:'PRT-007', name:'HP LaserJet Enterprise M507 (KC Office)', server:'PS-002', make:'HP', model:'LaserJet Enterprise M507',
        ip:'10.2.1.52', dhcp:false, mac:'00:1A:2B:3C:4D:62', port:'9100', driver:'HP Universal Print Driver PCL6',
        location:'Kansas City — Shipping Office', status:'online', paperSize:'Letter', duplex:true, tonerLevel:88,
        lastJob:'2024-07-08 14:50', jobsToday:34
      },
      { id:'PRT-008', name:'Brother QL-820NWB (Windsor Mobile)', server:'PS-003', make:'Brother', model:'QL-820NWB',
        ip:'10.3.1.51', dhcp:true, mac:'00:1A:2B:3C:4D:71', port:'9100', driver:'Brother QL-820NWB',
        location:'Windsor — Assembly Floor', status:'online', paperSize:'4x6 Label', duplex:false, tonerLevel:70,
        lastJob:'2024-07-08 14:15', jobsToday:67
      }
    ];
  }

  function getTrailerStats() {
    var s = { total: state.trailers.length, in_transit: 0, loading: 0, at_dock: 0, available: 0, maintenance: 0, expiring: 0 };
    var today = new Date();
    state.trailers.forEach(function(t) {
      if (s[t.status] !== undefined) s[t.status]++;
      if (t.registrationExp) {
        var exp = new Date(t.registrationExp);
        var days = (exp - today) / 86400000;
        if (days < 60) s.expiring++;
      }
    });
    return s;
  }

  function getPrinterStats() {
    var s = { total: state.printers.length, online: 0, offline: 0, zpl: 0, hp: 0, brother: 0, dhcp: 0, static: 0, lowToner: 0 };
    state.printers.forEach(function(p) {
      if (p.status === 'online') s.online++; else s.offline++;
      if (p.make === 'Zebra') s.zpl++;
      if (p.make === 'HP') s.hp++;
      if (p.make === 'Brother') s.brother++;
      if (p.dhcp) s.dhcp++; else s.static++;
      if (p.tonerLevel < 25) s.lowToner++;
    });
    return s;
  }

  function sendTestPage(printerId) {
    var p = state.printers.find(function(x) { return x.id === printerId; });
    if (!p) return { success: false, message: 'Printer not found' };
    if (p.status === 'offline') return { success: false, message: 'Printer is offline' };
    p.lastJob = new Date().toISOString().replace('T',' ').substring(0,16);
    p.jobsToday++;
    return { success: true, message: 'Test page sent to ' + p.name + ' at ' + p.ip + ':' + p.port };
  }

  function generateWindowsPrintServerConfig(printServerId) {
    var ps = state.printServers.find(function(x) { return x.id === printServerId; });
    if (!ps) return '';
    var printers = state.printers.filter(function(p) { return p.server === ps.id; });
    var config = 'REM ============================================================\n';
    config += 'REM  OwlLogics Print Server Configuration\n';
    config += 'REM  Server: ' + ps.name + ' (' + ps.host + ')\n';
    config += 'REM  IP: ' + ps.ip + ' | Port: ' + ps.port + ' | Protocol: ' + ps.protocol + '\n';
    config += 'REM  DHCP: ' + (ps.dhcp ? 'Yes' : 'No (Static)') + ' | Domain: ' + ps.domain + '\n';
    config += 'REM ============================================================\n\n';
    config += 'REM --- Install Print Server Role ---\n';
    config += 'Install-WindowsFeature Print-Services -IncludeManagementTools\n\n';
    config += 'REM --- Add Printers via PowerShell ---\n';
    printers.forEach(function(p) {
      config += '\nREM ' + p.name + '\n';
      config += 'Add-PrinterPort -Name "IP_' + p.ip + '" -PrinterHostAddress "' + p.ip + '" -PortNumber ' + p.port + '\n';
      config += 'Add-PrinterDriver -Name "' + p.driver + '"\n';
      config += 'Add-Printer -Name "' + p.name + '" -DriverName "' + p.driver + '" -PortName "IP_' + p.ip + '" -Shared -ShareName "' + p.name.replace(/[^a-zA-Z0-9]/g,'') + '" -Location "' + p.location + '"\n';
      if (p.dhcp) {
        config += 'REM NOTE: This printer uses DHCP — IP may change. Consider DHCP reservation.\n';
      } else {
        config += 'REM Static IP: ' + p.ip + ' (MAC: ' + p.mac + ')\n';
      }
    });
    config += '\nREM --- Set DHCP Reservations (for DHCP printers) ---\n';
    config += 'REM Configure on DHCP server (not print server):\n';
    printers.filter(function(p) { return p.dhcp; }).forEach(function(p) {
      config += 'REM Add-DhcpServerv4Reservation -ScopeId 10.1.1.0 -IPAddress ' + p.ip + ' -ClientId "' + p.mac.replace(/:/g,'-') + '" -Description "' + p.name + '"\n';
    });
    return config;
  }

  return {
    state: state,
    init: init,
    getTrailerStats: getTrailerStats,
    getPrinterStats: getPrinterStats,
    sendTestPage: sendTestPage,
    generateWindowsPrintServerConfig: generateWindowsPrintServerConfig
  };
})();
