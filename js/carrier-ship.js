/* ============================================================
   OwlLogics NexGen Owl Mode
   (c) 2024 Paul Adcock - All Rights Reserved
   Contact: paul.dev.co@outlook.com
   ============================================================
   OwlLogics Carrier Shipping & Label Module
   - FedEx, UPS, USPS, DHL shipping label generation
   - Apple/Dell electronics OEM support
   - Rate calculation (simulated)
   - Tracking number generation
   - ZPL shipping label output
   - Multi-carrier rate shopping
   ============================================================ */

var CarrierShip = (function () {

  var state = {
    shipments: [],
    rateQuotes: []
  };

  // ── Carrier Definitions ────────────────────────────────────
  var CARRIERS = {
    FEDEX: {
      name: 'FedEx',
      services: [
        { code: 'GROUND', name: 'FedEx Ground', transitDays: '1-5', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: 'EXPRESS_SAVER', name: 'FedEx Express Saver', transitDays: '3', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: '2DAY', name: 'FedEx 2Day', transitDays: '2', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: 'PRIORITY Overnight', name: 'FedEx Priority Overnight', transitDays: '1', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: 'STANDARD Overnight', name: 'FedEx Standard Overnight', transitDays: '1', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: 'FEDEX_HOME', name: 'FedEx Home Delivery', transitDays: '1-5', maxWeight: 70, maxLen: 108, dimDivisor: 139 }
      ],
      labelFormat: 'ZPL',
      apiEndpoint: 'https://apis.fedex.com/ship/v1/shipments',
      authType: 'OAuth2 Bearer Token',
      trackingPrefix: '7489',
      labelSize: '4x6'
    },
    UPS: {
      name: 'UPS',
      services: [
        { code: 'GROUND', name: 'UPS Ground', transitDays: '1-5', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: '3_DAY_SELECT', name: 'UPS 3 Day Select', transitDays: '3', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: '2ND_DAY_AIR', name: 'UPS 2nd Day Air', transitDays: '2', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: 'NEXT_DAY_AIR', name: 'UPS Next Day Air', transitDays: '1', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: 'NEXT_DAY_AIR_SAVER', name: 'UPS Next Day Air Saver', transitDays: '1', maxWeight: 150, maxLen: 108, dimDivisor: 139 },
        { code: 'SUREPOST', name: 'UPS SurePost (USPS final)', transitDays: '2-7', maxWeight: 70, maxLen: 108, dimDivisor: 139 }
      ],
      labelFormat: 'ZPL',
      apiEndpoint: 'https://onlinetools.ups.com/ship/v1/shipments',
      authType: 'OAuth2 Bearer Token',
      trackingPrefix: '1Z',
      labelSize: '4x6'
    },
    USPS: {
      name: 'USPS',
      services: [
        { code: 'PRIORITY_MAIL', name: 'USPS Priority Mail', transitDays: '1-3', maxWeight: 70, maxLen: 108, dimDivisor: 166 },
        { code: 'PRIORITY_EXPRESS', name: 'USPS Priority Mail Express', transitDays: '1', maxWeight: 70, maxLen: 108, dimDivisor: 166 },
        { code: 'GROUND_ADVANTAGE', name: 'USPS Ground Advantage', transitDays: '2-5', maxWeight: 70, maxLen: 108, dimDivisor: 166 },
        { code: 'MEDIA_MAIL', name: 'USPS Media Mail', transitDays: '2-8', maxWeight: 70, maxLen: 108, dimDivisor: 166 },
        { code: 'FIRST_CLASS_PACKAGE', name: 'USPS First-Class Package', transitDays: '1-3', maxWeight: 15.9, maxLen: 22, dimDivisor: 166 }
      ],
      labelFormat: 'ZPL',
      apiEndpoint: 'https://apis.usps.com/ship/v1/shipments',
      authType: 'Bearer Token (USPS API)',
      trackingPrefix: '9400',
      labelSize: '4x6'
    },
    DHL: {
      name: 'DHL',
      services: [
        { code: 'EXPRESS_WORLDWIDE', name: 'DHL Express Worldwide', transitDays: '1-3', maxWeight: 154, maxLen: 108, dimDivisor: 139 },
        { code: 'EXPRESS_12', name: 'DHL Express 12:00', transitDays: '1', maxWeight: 154, maxLen: 108, dimDivisor: 139 },
        { code: 'EXPRESS_ENVELOPE', name: 'DHL Express Envelope', transitDays: '1-3', maxWeight: 2, maxLen: 15, dimDivisor: 139 },
        { code: 'ECONOMY_SELECT', name: 'DHL Economy Select', transitDays: '3-5', maxWeight: 154, maxLen: 108, dimDivisor: 139 }
      ],
      labelFormat: 'ZPL',
      apiEndpoint: 'https://api.dhl.com/ship/v1/shipments',
      authType: 'OAuth2 Bearer Token',
      trackingPrefix: 'DHL',
      labelSize: '4x6'
    }
  };

  // ── Electronics OEM Profiles (Dell + Apple) ────────────────
  var ELECTRONICS_OEMS = {
    APPLE: {
      name: 'Apple Inc.',
      hq: 'Cupertino, CA',
      system: 'SAP ERP + SAP Digital Manufacturing',
      ediTransactions: ['ORDERS (850)', '856 ASN', '940 Ship Order', '810 Invoice', '846 Inventory', 'DELFOR', 'DELJIT'],
      supplierPortal: 'apple.com/supply-chain',
      requirements: [
        'SAP ERP integration mandatory for Tier 1 suppliers',
        'EDI 856 ASN required for every shipment',
        'Apple Supplier Responsibility compliance (annual audit)',
        'Regulated substances management (Full Material Disclosure)',
        'Zero waste to landfill target',
        'Worker rights audits (FLA)',
        'SAP Warehouse Operator app for mobile scanning'
      ],
      shipping: ['FedEx', 'UPS', 'USPS', 'DHL'],
      plants: ['Cupertino CA (HQ)', 'Austin TX (Mac)', 'Elk Grove IL', 'Cork Ireland', 'Singapore', 'Chengdu China'],
      notes: 'Apple uses UPS for most domestic, FedEx for overnight, USPS for small packages (SurePost equivalent), DHL for international'
    },
    DELL: {
      name: 'Dell Technologies',
      hq: 'Round Rock, TX',
      system: 'SAP ERP + i2/Blue Yonder planning',
      ediTransactions: ['850 Purchase Order', '855 PO Ack', '856 ASN', '810 Invoice', '846 Inventory', '940 Ship Order', '943 Warehouse Stock Receipt', '945 Warehouse Shipping Advice'],
      supplierPortal: 'dell.com/suppliers',
      requirements: [
        'VMI (Vendor Managed Inventory) — suppliers manage Dell inventory',
        'EDI required for all transactions',
        'Dell Supplier Principles compliance (2025)',
        'Build-to-order manufacturing — near zero inventory',
        'i2/Blue Yonder demand planning integration',
        '4PL logistics via TMS, LP (Round Rock)',
        'Just-in-time delivery windows'
      ],
      shipping: ['FedEx', 'UPS', 'DHL'],
      plants: ['Round Rock TX (HQ)', 'Nashville TN', 'Austin TX', 'Limerick Ireland', 'Penang Malaysia', 'Xiamen China'],
      notes: 'Dell uses FedEx Ground for most consumer shipments, UPS for enterprise, DHL for international'
    }
  };

  // ── Rate Calculator (simulated) ────────────────────────────
  function calculateRates(fromZip, toZip, weight, length, width, height, residential) {
    var rates = [];
    var dimWeight = 0;
    var billableWeight = weight;

    Object.keys(CARRIERS).forEach(function(carrierKey) {
      var carrier = CARRIERS[carrierKey];
      carrier.services.forEach(function(svc) {
        if (weight > svc.maxWeight) return;

        var dimDiv = svc.dimDivisor || 139;
        dimWeight = Math.ceil((length * width * height) / dimDiv);
        billableWeight = Math.max(weight, dimWeight);

        // Base rate calculation (simplified)
        var zone = Math.abs(parseInt(toZip) - parseInt(fromZip)) / 1000;
        var baseRate = 5.00 + (billableWeight * 0.15) + (zone * 2.50);

        // Service multipliers
        var mult = 1.0;
        if (svc.code === 'PRIORITY Overnight' || svc.code === 'NEXT_DAY_AIR' || svc.code === 'PRIORITY_EXPRESS' || svc.code === 'EXPRESS_12') mult = 3.5;
        else if (svc.code === '2DAY' || svc.code === '2ND_DAY_AIR' || svc.code === 'EXPRESS_WORLDWIDE') mult = 2.0;
        else if (svc.code === 'EXPRESS_SAVER' || svc.code === '3_DAY_SELECT') mult = 1.5;
        else if (svc.code === 'GROUND' || svc.code === 'GROUND_ADVANTAGE') mult = 1.0;
        else if (svc.code === 'MEDIA_MAIL') mult = 0.5;
        else if (svc.code === 'FEDEX_HOME' || svc.code === 'SUREPOST') mult = 0.9;
        else if (svc.code === 'FIRST_CLASS_PACKAGE') mult = 0.7;

        // Residential surcharge
        if (residential) baseRate += 3.50;

        // Fuel surcharge (18%)
        var fuelSurcharge = baseRate * 0.18;

        var totalRate = (baseRate * mult) + fuelSurcharge;

        rates.push({
          carrier: carrierKey,
          carrierName: carrier.name,
          service: svc.code,
          serviceName: svc.name,
          transitDays: svc.transitDays,
          billableWeight: billableWeight,
          dimWeight: dimWeight,
          baseRate: Math.round(baseRate * mult * 100) / 100,
          fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
          totalRate: Math.round(totalRate * 100) / 100,
          residential: residential
        });
      });
    });

    rates.sort(function(a, b) { return a.totalRate - b.totalRate; });
    return rates;
  }

  // ── Tracking Number Generator ──────────────────────────────
  function generateTrackingNumber(carrierKey) {
    var carrier = CARRIERS[carrierKey];
    if (!carrier) return 'UNKNOWN';
    var prefix = carrier.trackingPrefix;
    var num = '';
    for (var i = 0; i < 14; i++) {
      num += Math.floor(Math.random() * 10);
    }
    if (carrierKey === 'UPS') {
      return prefix + '999' + num.substring(0, 13);
    }
    return prefix + num.substring(0, 14);
  }

  // ── ZPL Shipping Label Generator ───────────────────────────
  function generateShippingLabel(shipment) {
    var carrier = CARRIERS[shipment.carrier];
    if (!carrier) return 'Unknown carrier';

    var tracking = shipment.trackingNumber || generateTrackingNumber(shipment.carrier);
    var svc = carrier.services.find(function(s) { return s.code === shipment.service; });
    var svcName = svc ? svc.name : shipment.service;

    var zpl = '';
    zpl += '^XA^CI28\n';
    zpl += '^PW609^LL812\n';
    zpl += '^FO0,0^GB609,812,4^FS\n';

    // Carrier name + service
    zpl += '^FO20,20^A0N,40,30^FD' + carrier.name + '^FS\n';
    zpl += '^FO20,70^A0N,20,20^FD' + svcName + '^FS\n';

    // Ship from
    zpl += '^FO20,110^A0N,20,20^FDSHIP FROM:^FS\n';
    zpl += '^FO20,135^A0N,18,18^FD' + (shipment.fromName || 'OwlLogics') + '^FS\n';
    zpl += '^FO20,155^A0N,18,18^FD' + (shipment.fromAddr || '1425 Industrial Blvd') + '^FS\n';
    zpl += '^FO20,175^A0N,18,18^FD' + (shipment.fromCity || 'Auburn Hills') + ', ' + (shipment.fromState || 'MI') + ' ' + (shipment.fromZip || '48326') + '^FS\n';

    // Divider
    zpl += '^FO20,205^GB570,2,2^FS\n';

    // Ship to
    zpl += '^FO20,215^A0N,20,20^FDSHIP TO:^FS\n';
    zpl += '^FO20,240^A0N,18,18^FD' + (shipment.toName || 'Customer') + '^FS\n';
    zpl += '^FO20,260^A0N,18,18^FD' + (shipment.toAddr || '123 Main St') + '^FS\n';
    zpl += '^FO20,280^A0N,18,18^FD' + (shipment.toCity || 'Detroit') + ', ' + (shipment.toState || 'MI') + ' ' + (shipment.toZip || '48201') + '^FS\n';

    // Divider
    zpl += '^FO20,310^GB570,2,2^FS\n';

    // Tracking number (text)
    zpl += '^FO20,320^A0N,30,25^FDTRACKING: ' + tracking + '^FS\n';

    // Barcode (Code 128)
    zpl += '^FO100,360^BY3^BCN,120,Y,N,N^FD' + tracking + '^FS\n';

    // Service info
    zpl += '^FO20,500^A0N,20,20^FDWeight: ' + (shipment.weight || 1) + ' lbs^FS\n';
    zpl += '^FO20,525^A0N,18,18^FDDim: ' + (shipment.length||10) + 'x' + (shipment.width||8) + 'x' + (shipment.height||6) + '^FS\n';

    // Divider
    zpl += '^FO20,555^GB570,2,2^FS\n';

    // Reference
    zpl += '^FO20,565^A0N,18,18^FDRef: ' + (shipment.reference || 'PO-' + Date.now().toString().slice(-6)) + '^FS\n';
    if (shipment.poNumber) {
      zpl += '^FO20,590^A0N,18,18^FDPO: ' + shipment.poNumber + '^FS\n';
    }
    if (shipment.orderNumber) {
      zpl += '^FO20,615^A0N,18,18^FDOrder: ' + shipment.orderNumber + '^FS\n';
    }

    // 2D barcode (Datamatrix with tracking)
    zpl += '^FO400,565^BXN,4,200,0,0,0~^FD' + tracking + '^FS\n';

    // Carrier logo area
    zpl += '^FO450,20^A0N,15,15^FD' + carrier.name + '^FS\n';
    zpl += '^FO450,40^A0N,12,12^FD' + (shipment.carrier === 'USPS' ? 'USPS' : shipment.carrier) + '^FS\n';

    zpl += '^XZ\n';
    return zpl;
  }

  // ── Create Shipment ────────────────────────────────────────
  function createShipment(data) {
    var shipment = {
      id: 'SHP-' + Date.now().toString().slice(-8),
      carrier: data.carrier || 'FEDEX',
      service: data.service || 'GROUND',
      trackingNumber: generateTrackingNumber(data.carrier || 'FEDEX'),
      fromName: data.fromName || 'OwlLogics',
      fromAddr: data.fromAddr || '1425 Industrial Blvd',
      fromCity: data.fromCity || 'Auburn Hills',
      fromState: data.fromState || 'MI',
      fromZip: data.fromZip || '48326',
      toName: data.toName || '',
      toAddr: data.toAddr || '',
      toCity: data.toCity || '',
      toState: data.toState || '',
      toZip: data.toZip || '',
      weight: data.weight || 1,
      length: data.length || 10,
      width: data.width || 8,
      height: data.height || 6,
      reference: data.reference || '',
      poNumber: data.poNumber || '',
      orderNumber: data.orderNumber || '',
      residential: data.residential || false,
      insured: data.insured || false,
      insuredValue: data.insuredValue || 0,
      status: 'label_created',
      labelZPL: '',
      rate: data.rate || 0,
      createdAt: new Date().toISOString()
    };
    shipment.labelZPL = generateShippingLabel(shipment);
    state.shipments.push(shipment);
    return shipment;
  }

  function getShipmentStats() {
    var s = { total: state.shipments.length, labels_created: 0, shipped: 0, in_transit: 0, delivered: 0 };
    state.shipments.forEach(function(sh) {
      if (s[sh.status]) s[sh.status]++;
    });
    var byCarrier = {};
    state.shipments.forEach(function(sh) {
      byCarrier[sh.carrier] = (byCarrier[sh.carrier] || 0) + 1;
    });
    s.byCarrier = byCarrier;
    return s;
  }

  function init() {
    if (state.shipments.length > 0) return;
    // Seed demo shipments
    var sh1 = createShipment({
      carrier: 'FEDEX', service: '2DAY',
      toName: 'Apple Inc.', toAddr: 'One Apple Park Way', toCity: 'Cupertino', toState: 'CA', toZip: '95014',
      weight: 12, length: 14, width: 10, height: 8, reference: 'AAPL-REF-001', orderNumber: 'SO-AAPL-2024-001',
      residential: false, rate: 28.45
    });
    sh1.status = 'shipped';

    var sh2 = createShipment({
      carrier: 'UPS', service: 'GROUND',
      toName: 'Dell Technologies', toAddr: 'One Dell Way', toCity: 'Round Rock', toState: 'TX', toZip: '78682',
      weight: 35, length: 20, width: 16, height: 12, reference: 'DELL-REF-002', orderNumber: 'SO-DELL-2024-002',
      residential: false, rate: 18.92
    });
    sh2.status = 'in_transit';

    var sh3 = createShipment({
      carrier: 'USPS', service: 'PRIORITY_MAIL',
      toName: 'Customer', toAddr: '456 Oak St', toCity: 'San Jose', toState: 'CA', toZip: '95112',
      weight: 3, length: 10, width: 8, height: 4, reference: 'USPS-REF-003', residential: true, rate: 12.80
    });
    sh3.status = 'label_created';

    var sh4 = createShipment({
      carrier: 'DHL', service: 'EXPRESS_WORLDWIDE',
      toName: 'Apple Cork', toAddr: 'Hollyhill Industrial Estate', toCity: 'Cork', toState: 'IE', toZip: 'T23',
      weight: 8, length: 12, width: 10, height: 6, reference: 'DHL-INTL-004', orderNumber: 'SO-INTL-2024-004',
      residential: false, rate: 65.30
    });
    sh4.status = 'label_created';
  }

  return {
    state: state,
    CARRIERS: CARRIERS,
    ELECTRONICS_OEMS: ELECTRONICS_OEMS,
    calculateRates: calculateRates,
    generateTrackingNumber: generateTrackingNumber,
    generateShippingLabel: generateShippingLabel,
    createShipment: createShipment,
    getShipmentStats: getShipmentStats,
    init: init
  };
})();
