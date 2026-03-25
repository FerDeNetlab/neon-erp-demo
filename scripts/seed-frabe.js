const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(start, end) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }
function fmtDate(d) { return d.toISOString().split('T')[0]; }

async function seed() {
  console.log('🌱 Seeding Frabe ERP...\n');

  // ═══ ORGANIZATION ═══
  const [org] = await sql`INSERT INTO organizations (name, slug, settings)
    VALUES ('Redes Ópticas', 'redes-opticas', '{"currency":"MXN","timezone":"America/Mexico_City"}')
    RETURNING id`;
  const orgId = org.id;
  console.log('✓ Organization: Redes Ópticas');

  // ═══ BRANCHES ═══
  const branchData = [
    { name: 'Sucursal CDMX (Matriz)', city: 'Ciudad de México', state: 'CDMX', address: 'Av. Insurgentes Sur #1234, Col. Del Valle', phone: '+52 55 1234 5678', is_main: true },
    { name: 'Sucursal Guadalajara', city: 'Guadalajara', state: 'Jalisco', address: 'Av. López Mateos #567, Col. Chapalita', phone: '+52 33 9876 5432', is_main: false },
    { name: 'Sucursal Monterrey', city: 'Monterrey', state: 'Nuevo León', address: 'Av. Constitución #890, Col. Centro', phone: '+52 81 5555 1234', is_main: false },
  ];
  const branchIds = [];
  for (const b of branchData) {
    const [branch] = await sql`INSERT INTO branches (org_id, name, address, city, state, phone, is_main)
      VALUES (${orgId}, ${b.name}, ${b.address}, ${b.city}, ${b.state}, ${b.phone}, ${b.is_main}) RETURNING id`;
    branchIds.push(branch.id);
  }
  console.log('✓ 3 branches');

  // ═══ USERS ═══
  const userData = [
    { name: 'Fernando Administrador', email: 'fer@netlab.mx', role: 'admin', branch: 0 },
    { name: 'Engine Netlab', email: 'engine@netlab.mx', role: 'admin', branch: 0 },
    { name: 'Laura Méndez', email: 'laura.mendez@redesopticas.com', role: 'manager', branch: 0 },
    { name: 'Roberto Salazar', email: 'roberto.salazar@redesopticas.com', role: 'manager', branch: 1 },
    { name: 'Patricia Duarte', email: 'patricia.duarte@redesopticas.com', role: 'manager', branch: 2 },
    { name: 'Carlos Mendoza', email: 'carlos.mendoza@redesopticas.com', role: 'supervisor', branch: 0 },
    { name: 'Miguel Torres', email: 'miguel.torres@redesopticas.com', role: 'supervisor', branch: 1 },
    { name: 'Juan García', email: 'juan.garcia@redesopticas.com', role: 'installer', branch: 0 },
    { name: 'Pedro Sánchez', email: 'pedro.sanchez@redesopticas.com', role: 'installer', branch: 0 },
    { name: 'Luis Ramírez', email: 'luis.ramirez@redesopticas.com', role: 'installer', branch: 0 },
    { name: 'Andrés Hernández', email: 'andres.hernandez@redesopticas.com', role: 'installer', branch: 1 },
    { name: 'Diego Flores', email: 'diego.flores@redesopticas.com', role: 'installer', branch: 1 },
    { name: 'Javier Cruz', email: 'javier.cruz@redesopticas.com', role: 'installer', branch: 2 },
    { name: 'Eduardo Morales', email: 'eduardo.morales@redesopticas.com', role: 'installer', branch: 2 },
    { name: 'Ricardo Vega', email: 'ricardo.vega@redesopticas.com', role: 'warehouse', branch: 0 },
    { name: 'Sandra López', email: 'sandra.lopez@redesopticas.com', role: 'warehouse', branch: 1 },
  ];
  const userIds = [];
  for (const u of userData) {
    const [user] = await sql`INSERT INTO users (org_id, email, full_name, role, default_branch_id, active)
      VALUES (${orgId}, ${u.email}, ${u.name}, ${u.role}, ${branchIds[u.branch]}, true) RETURNING id`;
    userIds.push(user.id);
  }
  console.log('✓ 16 users');

  // Update branch managers
  await sql`UPDATE branches SET manager_id = ${userIds[2]} WHERE id = ${branchIds[0]}`;
  await sql`UPDATE branches SET manager_id = ${userIds[3]} WHERE id = ${branchIds[1]}`;
  await sql`UPDATE branches SET manager_id = ${userIds[4]} WHERE id = ${branchIds[2]}`;

  // ═══ EMPLOYEES ═══
  const positions = ['Director General', 'Director General Adj.', 'Gerente Sucursal CDMX', 'Gerente Sucursal GDL', 'Gerente Sucursal MTY', 'Supervisor de Campo', 'Supervisor de Campo', 'Técnico Instalador Sr.', 'Técnico Instalador', 'Técnico Fusionador', 'Técnico Instalador', 'Técnico Instalador', 'Técnico Instalador', 'Técnico Instalador', 'Jefe de Almacén', 'Almacenista'];
  const departments = ['Dirección', 'Dirección', 'Operaciones', 'Operaciones', 'Operaciones', 'Campo', 'Campo', 'Campo', 'Campo', 'Campo', 'Campo', 'Campo', 'Campo', 'Campo', 'Almacén', 'Almacén'];
  for (let i = 0; i < userIds.length; i++) {
    await sql`INSERT INTO employees (user_id, org_id, employee_number, position, department, hire_date)
      VALUES (${userIds[i]}, ${orgId}, ${'EMP-' + String(i + 1).padStart(4, '0')}, ${positions[i]}, ${departments[i]}, ${fmtDate(randomDate(new Date('2020-01-01'), new Date('2024-12-01')))})`;
  }
  console.log('✓ 16 employees');

  // ═══ WAREHOUSES ═══
  const warehouseIds = [];
  const whNames = ['Almacén Central CDMX', 'Almacén GDL', 'Almacén MTY'];
  for (let i = 0; i < 3; i++) {
    const [wh] = await sql`INSERT INTO warehouses (org_id, branch_id, name, type, manager_id)
      VALUES (${orgId}, ${branchIds[i]}, ${whNames[i]}, 'general', ${i === 0 ? userIds[14] : userIds[15]}) RETURNING id`;
    warehouseIds.push(wh.id);
  }
  console.log('✓ 3 warehouses');

  // ═══ INVENTORY ITEMS ═══
  const items = [
    ['Cable UTP Cat6 305m', 'cableado', 'rollo', 15, 3, 2800], ['Cable UTP Cat6A 305m', 'cableado', 'rollo', 6, 2, 4500],
    ['Fibra óptica 12 hilos 1km', 'fibra', 'rollo', 4, 1, 15000], ['Fibra óptica 24 hilos 1km', 'fibra', 'rollo', 3, 1, 22000],
    ['Conector RJ45 Cat6 (100)', 'conectores', 'bolsa', 30, 5, 450], ['Conector SC/APC (50)', 'conectores', 'bolsa', 18, 3, 1200],
    ['Conector LC/UPC (50)', 'conectores', 'bolsa', 12, 3, 1500], ['Patch cord fibra 3m SC-LC', 'fibra', 'pieza', 45, 10, 180],
    ['Patch cord UTP Cat6 1m', 'cableado', 'pieza', 90, 20, 45], ['Canaleta 60x40 2m', 'accesorios', 'pieza', 60, 15, 85],
    ['Tubo conduit 3/4 3m', 'accesorios', 'pieza', 35, 10, 65], ['Patch Panel 24p Cat6', 'cableado', 'pieza', 10, 2, 1800],
    ['Jack RJ45 Cat6 Panduit', 'conectores', 'pieza', 150, 30, 95], ['Face plate 2 puertos', 'accesorios', 'pieza', 70, 15, 35],
    ['Etiquetas cable (rollo)', 'accesorios', 'rollo', 12, 3, 250], ['Cinta Velcro', 'accesorios', 'rollo', 18, 5, 180],
    ['Split tubing 1/2 10m', 'accesorios', 'pieza', 28, 5, 90], ['Abrazadera U 3/4', 'accesorios', 'bolsa', 22, 5, 120],
  ];
  const itemIds = [];
  for (const [name, cat, unit, stock, min, cost] of items) {
    const whIdx = randomInt(0, 2);
    const [item] = await sql`INSERT INTO inventory_items (warehouse_id, org_id, name, category, unit, stock_qty, min_stock, unit_cost, sku)
      VALUES (${warehouseIds[whIdx]}, ${orgId}, ${name}, ${cat}, ${unit}, ${stock}, ${min}, ${cost}, ${'SKU-' + randomInt(10000, 99999)}) RETURNING id`;
    itemIds.push(item.id);
  }
  console.log('✓ 18 inventory items');

  // ═══ TOOLS ═══
  const toolData = [
    ['Fusionadora Fujikura 90S', 'Fujikura', '90S', 185000], ['OTDR EXFO MaxTester', 'EXFO', 'MaxTester 730C', 95000],
    ['Taladro Bosch GSB 13RE', 'Bosch', 'GSB 13RE', 2500], ['Rotomartillo Milwaukee M18', 'Milwaukee', 'M18', 8900],
    ['Power Meter Joinwit', 'Joinwit', 'JW3208', 3500], ['Multímetro Fluke 87V', 'Fluke', '87V', 12000],
    ['Ponchadora RJ45 Panduit', 'Panduit', 'MPT5-8AS', 1800], ['Escalera telescópica 6m', 'Truper', 'ESC-26T', 4500],
    ['Cortadora fibra CT-50', 'Fujikura', 'CT-50', 15000], ['Laptop Dell Latitude', 'Dell', 'Latitude 5540', 28000],
    ['Generador tonos Fluke', 'Fluke', 'IntelliTone Pro', 5500], ['Nivel láser Bosch GLL 3', 'Bosch', 'GLL 3-80', 6800],
    ['Cámara termográfica FLIR', 'FLIR', 'E6-XT', 45000], ['Detector cables Noyafa', 'Noyafa', 'NF-8601', 2200],
    ['Taladro DeWalt DCD996', 'DeWalt', 'DCD996', 7500], ['Pulidora fibra NTT-AT', 'NTT-AT', 'APC-7002', 6500],
  ];
  const toolIds = [];
  const toolStatuses = ['available', 'assigned', 'assigned', 'assigned', 'in_maintenance'];
  for (const [name, brand, model, cost] of toolData) {
    const [tool] = await sql`INSERT INTO tools (org_id, branch_id, name, brand, model, serial_number, category, status, acquisition_cost, acquisition_date)
      VALUES (${orgId}, ${branchIds[randomInt(0, 2)]}, ${name}, ${brand}, ${model}, ${'SN-' + randomInt(100000, 999999)}, ${name.includes('Fusionadora') || name.includes('OTDR') || name.includes('Power Meter') ? 'measurement' : name.includes('Laptop') ? 'computing' : 'hand_tool'}, ${randomChoice(toolStatuses)}, ${cost}, ${fmtDate(randomDate(new Date('2022-01-01'), new Date('2025-12-01')))}) RETURNING id`;
    toolIds.push(tool.id);
  }
  console.log('✓ 16 tools');

  // Tool custodies (assign some tools to installers)
  const installerIds = userIds.slice(7, 14);
  for (let i = 0; i < 10; i++) {
    await sql`INSERT INTO tool_custodies (tool_id, user_id, org_id, status, assigned_by)
      VALUES (${toolIds[i]}, ${randomChoice(installerIds)}, ${orgId}, ${Math.random() > 0.3 ? 'active' : 'returned'}, ${userIds[5]})`;
  }
  console.log('✓ 10 tool custodies');

  // ═══ VEHICLES ═══
  const vehData = [
    ['ABC-1234', 'Nissan', 'NP300', 2022, 'Blanco', 'pickup'], ['DEF-5678', 'Chevrolet', 'S10', 2023, 'Gris', 'pickup'],
    ['GHI-9012', 'Ford', 'Ranger', 2021, 'Blanco', 'pickup'], ['JKL-3456', 'Toyota', 'Hilux', 2024, 'Plata', 'pickup'],
    ['MNO-7890', 'Volkswagen', 'Amarok', 2023, 'Blanco', 'pickup'], ['PQR-2345', 'Nissan', 'NV350', 2022, 'Blanco', 'van'],
    ['STU-6789', 'Ford', 'Transit', 2021, 'Blanco', 'van'], ['VWX-0123', 'Chevrolet', 'Tornado', 2024, 'Rojo', 'pickup'],
  ];
  const vehicleIds = [];
  for (let i = 0; i < vehData.length; i++) {
    const [p, brand, model, year, color, type] = vehData[i];
    const bIdx = i < 4 ? 0 : i < 6 ? 1 : 2;
    const [v] = await sql`INSERT INTO vehicles (org_id, branch_id, plate_number, economic_number, brand, model, year, color, type, vin, status, assigned_to, current_km, insurance_expiry, verification_expiry)
      VALUES (${orgId}, ${branchIds[bIdx]}, ${p}, ${'VEH-' + String(i + 1).padStart(3, '0')}, ${brand}, ${model}, ${year}, ${color}, ${type}, ${'VIN-' + randomInt(100000000, 999999999)}, ${i < 7 ? 'active' : 'in_shop'}, ${installerIds[i % installerIds.length]}, ${randomInt(15000, 120000)}, ${fmtDate(randomDate(new Date('2026-06-01'), new Date('2026-12-31')))}, ${fmtDate(randomDate(new Date('2026-04-01'), new Date('2026-08-30')))}) RETURNING id`;
    vehicleIds.push(v.id);
  }
  console.log('✓ 8 vehicles');

  // Vehicle maintenance (20)
  const maintDescs = ['Cambio de aceite y filtro', 'Alineación y balanceo', 'Cambio de frenos', 'Servicio mayor', 'Cambio de llantas', 'Reparación suspensión', 'Cambio de batería', 'Afinación menor', 'Cambio banda distribución', 'Revisión eléctrica'];
  for (let i = 0; i < 20; i++) {
    await sql`INSERT INTO vehicle_maintenances (vehicle_id, type, description, km_at_maintenance, cost, vendor, date_performed)
      VALUES (${randomChoice(vehicleIds)}, ${Math.random() > 0.3 ? 'preventive' : 'corrective'}, ${randomChoice(maintDescs)}, ${randomInt(20000, 100000)}, ${randomInt(800, 15000)}, ${randomChoice(['Taller Express', 'AutoServiceMX', 'ServiFrenos', 'Llantera Nacional', 'Agencia Oficial'])}, ${fmtDate(randomDate(new Date('2025-06-01'), new Date('2026-03-20')))})`;
  }
  console.log('✓ 20 vehicle maintenances');

  // Fuel logs (50)
  for (let i = 0; i < 50; i++) {
    const liters = randomInt(25, 65);
    const ppl = randomInt(20, 25);
    await sql`INSERT INTO vehicle_fuel_logs (vehicle_id, driver_id, liters, total_cost, price_per_liter, km_at_fill, station, date)
      VALUES (${randomChoice(vehicleIds)}, ${randomChoice(installerIds)}, ${liters}, ${liters * ppl}, ${ppl}, ${randomInt(20000, 110000)}, ${randomChoice(['Pemex Insurgentes', 'BP Revolución', 'Shell Periférico', 'Mobil Reforma', 'G500 López Mateos'])}, ${fmtDate(randomDate(new Date('2025-09-01'), new Date('2026-03-20')))})`;
  }
  console.log('✓ 50 fuel logs');

  // Fines (6)
  const fineReasons = ['Exceso de velocidad', 'Estacionamiento prohibido', 'Vuelta prohibida', 'No respetar semáforo', 'Doble fila', 'Invasión carril confinado'];
  for (let i = 0; i < 6; i++) {
    await sql`INSERT INTO vehicle_fines (vehicle_id, driver_id, date, amount, reason, status)
      VALUES (${randomChoice(vehicleIds)}, ${randomChoice(installerIds)}, ${fmtDate(randomDate(new Date('2025-06-01'), new Date('2026-03-20')))}, ${randomInt(800, 5500)}, ${fineReasons[i]}, ${Math.random() > 0.4 ? 'pending' : 'paid'})`;
  }
  console.log('✓ 6 vehicle fines');

  // ═══ SERVICE ORDERS (55) ═══
  const serviceTypes = ['fibra', 'cctv', 'cableado', 'servidor', 'otro'];
  const titles = {
    fibra: ['Tirada de fibra óptica FTTH', 'Fusión de fibra 24 hilos', 'Tendido fibra 48 hilos', 'Reparación fibra rota', 'Empalme fibra GPON'],
    cctv: ['Instalación CCTV 8 cámaras IP', 'Mantenimiento sistema CCTV', 'Upgrade DVR a NVR', 'Cableado CCTV exterior', 'CCTV 16 cámaras warehouse'],
    cableado: ['Cableado estructurado Cat6 24 puntos', 'Instalación rack comunicaciones', 'Certificación puntos de red', 'Patch panel y organización', 'Cableado Cat6A blindado'],
    servidor: ['Instalación rack servidor', 'Migración de servidor', 'Configuración UPS 3kVA', 'Montaje servidor blade', 'Instalación NAS Synology'],
    otro: ['Levantamiento técnico', 'Revisión de sitio', 'Auditoría de red', 'Soporte general en sitio', 'Entrega de proyecto'],
  };
  const clients = ['Telmex', 'Totalplay', 'Izzi', 'Megacable', 'AT&T México', 'Axtel', 'KIO Networks', 'Alestra', 'Cablevisión', 'Sky México', 'Claro', 'WTC CDMX', 'Liverpool Corp', 'Bimbo IT'];
  const statuses = ['created', 'assigned', 'assigned', 'in_progress', 'in_progress', 'in_progress', 'completed', 'completed', 'completed', 'completed', 'closed'];
  const priorities = ['low', 'medium', 'medium', 'medium', 'high', 'high', 'urgent'];

  const orderIds = [];
  for (let i = 0; i < 55; i++) {
    const type = randomChoice(serviceTypes);
    const bIdx = randomInt(0, 2);
    const status = randomChoice(statuses);
    const [order] = await sql`INSERT INTO service_orders (org_id, branch_id, order_number, title, description, service_type, status, priority, client_name, client_phone, client_address, client_city, assigned_vehicle_id, scheduled_date, quoted_amount, created_by, created_at)
      VALUES (${orgId}, ${branchIds[bIdx]}, ${'OS-' + String(i + 1).padStart(4, '0')}, ${randomChoice(titles[type])}, ${'Trabajo de ' + type + ' para ' + randomChoice(clients) + '. ' + randomChoice(['Zona norte.', 'Zona sur.', 'Col. Industrial.', 'Parque empresarial.', 'Oficinas corporativas.'])}, ${type}, ${status}, ${randomChoice(priorities)}, ${randomChoice(clients)}, ${'+52 55' + randomInt(10000000, 99999999)}, ${randomChoice(['Av. Insurgentes Sur #', 'Blvd. López Mateos #', 'Av. Revolución #', 'Periférico Sur #', 'Av. Universidad #']) + randomInt(100, 9999)}, ${['CDMX', 'Guadalajara', 'Monterrey'][bIdx]}, ${vehicleIds[randomInt(0, vehicleIds.length - 1)]}, ${fmtDate(randomDate(new Date('2025-12-01'), new Date('2026-05-30')))}, ${randomInt(5000, 120000)}, ${userIds[randomInt(2, 4)]}, ${randomDate(new Date('2025-11-01'), new Date('2026-03-20')).toISOString()}) RETURNING id`;
    orderIds.push(order.id);

    // Assign 1-3 installers
    const numAssign = randomInt(1, 3);
    const shuffled = [...installerIds].sort(() => Math.random() - 0.5);
    for (let j = 0; j < numAssign; j++) {
      await sql`INSERT INTO service_order_assignments (order_id, user_id, role)
        VALUES (${order.id}, ${shuffled[j]}, ${j === 0 ? 'lead' : 'installer'})
        ON CONFLICT DO NOTHING`;
    }
  }
  console.log('✓ 55 service orders + assignments');

  // ═══ EVIDENCE (70) ═══
  const evidenceDescs = ['Antes de instalación', 'Durante instalación', 'Trabajo terminado', 'Fusión de fibra', 'Rack organizado', 'Cableado terminado', 'Cámaras instaladas', 'Prueba de señal', 'Certificación punto', 'Entrega al cliente', 'Etiquetado final', 'Patch panel completo'];
  const stages = ['before', 'during', 'during', 'after', 'after', 'delivery'];
  for (let i = 0; i < 70; i++) {
    await sql`INSERT INTO evidence (order_id, type, description, stage, uploaded_by, created_at)
      VALUES (${randomChoice(orderIds)}, ${'photo'}, ${randomChoice(evidenceDescs)}, ${randomChoice(stages)}, ${randomChoice(installerIds)}, ${randomDate(new Date('2025-12-01'), new Date('2026-03-20')).toISOString()})`;
  }
  console.log('✓ 70 evidence records');

  // ═══ INCIDENTS (15) ═══
  const incDescs = ['Retraso por lluvia', 'Material insuficiente', 'Herramienta dañada', 'Acceso denegado por seguridad', 'Vehículo ponchado', 'Cable dañado por terceros', 'Falta de energía en sitio', 'Escalera insuficiente', 'Cliente ausente', 'Permisos municipales pendientes', 'Equipo fusión con falla', 'Fibra rota por maquinaria', 'Falta conectores', 'DVR firmware antiguo', 'Poste dañado'];
  const incTypes = ['delay', 'missing_material', 'damaged_equipment', 'other', 'accident'];
  const incSevs = ['low', 'medium', 'medium', 'high', 'critical'];
  const incStatuses = ['open', 'open', 'in_review', 'resolved', 'closed'];
  for (let i = 0; i < 15; i++) {
    await sql`INSERT INTO incidents (order_id, org_id, reported_by, type, severity, title, description, status, created_at)
      VALUES (${randomChoice(orderIds)}, ${orgId}, ${randomChoice(installerIds)}, ${randomChoice(incTypes)}, ${randomChoice(incSevs)}, ${incDescs[i]}, ${incDescs[i] + '. Se requiere intervención para continuar el trabajo de campo.'}, ${randomChoice(incStatuses)}, ${randomDate(new Date('2025-12-15'), new Date('2026-03-20')).toISOString()})`;
  }
  console.log('✓ 15 incidents');

  // ═══ MATERIAL CONSUMPTIONS (40) ═══
  for (let i = 0; i < 40; i++) {
    const itemIdx = randomInt(0, itemIds.length - 1);
    await sql`INSERT INTO material_consumptions (order_id, item_id, quantity, unit_cost, consumed_by)
      VALUES (${randomChoice(orderIds)}, ${itemIds[itemIdx]}, ${randomInt(1, 10)}, ${items[itemIdx][5]}, ${randomChoice(installerIds)})`;
  }
  console.log('✓ 40 material consumptions');

  // ═══ PURCHASE ORDERS (5) ═══
  const poStatuses = ['draft', 'submitted', 'approved', 'received', 'approved'];
  for (let i = 0; i < 5; i++) {
    const sub = randomInt(5000, 80000);
    const tax = Math.round(sub * 0.16);
    await sql`INSERT INTO purchase_orders (org_id, branch_id, po_number, supplier_name, status, subtotal, tax, total, created_by)
      VALUES (${orgId}, ${branchIds[randomInt(0, 2)]}, ${'OC-' + String(i + 1).padStart(4, '0')}, ${randomChoice(['Panduit México', 'Hubbell', 'Furukawa', 'Commscope', 'Siemon', '3M Telecomunicaciones'])}, ${poStatuses[i]}, ${sub}, ${tax}, ${sub + tax}, ${userIds[randomInt(2, 4)]})`;
  }
  console.log('✓ 5 purchase orders');

  // ═══ ASSETS (10) ═══
  const assetData = [
    ['Switch Cisco Catalyst 2960', 'networking', 15000], ['UPS APC Smart 3000VA', 'power', 18000],
    ['Impresora HP LaserJet', 'office', 8500], ['Proyector Epson', 'office', 12000],
    ['Servidor Dell PowerEdge', 'computing', 85000], ['NAS Synology DS920+', 'computing', 22000],
    ['Aire acondicionado Mirage', 'hvac', 15000], ['Escritorio ejecutivo', 'furniture', 8000],
    ['Silla ergonómica', 'furniture', 4500], ['Rack de piso 42U', 'networking', 25000],
  ];
  for (const [name, cat, cost] of assetData) {
    await sql`INSERT INTO assets (org_id, branch_id, name, category, serial_number, status, acquisition_cost, acquisition_date, assigned_to)
      VALUES (${orgId}, ${branchIds[randomInt(0, 2)]}, ${name}, ${cat}, ${'AST-' + randomInt(100000, 999999)}, ${randomChoice(['available', 'assigned', 'assigned'])}, ${cost}, ${fmtDate(randomDate(new Date('2022-01-01'), new Date('2025-12-01')))}, ${Math.random() > 0.4 ? randomChoice(userIds) : null})`;
  }
  console.log('✓ 10 assets');

  // ═══ OPERATIONAL EXPENSES (12) ═══
  const expCats = ['rent', 'utilities', 'supplies', 'insurance', 'other'];
  const expDescs = ['Renta oficina', 'Luz CFE', 'Agua', 'Internet Telmex', 'Papelería', 'Seguro oficina', 'Limpieza', 'Mantenimiento A/C', 'Telefonía', 'Seguridad', 'Gasolina pool', 'Capacitación'];
  for (let i = 0; i < 12; i++) {
    await sql`INSERT INTO operational_expenses (org_id, branch_id, category, description, amount, date, vendor, recorded_by)
      VALUES (${orgId}, ${branchIds[randomInt(0, 2)]}, ${randomChoice(expCats)}, ${expDescs[i]}, ${randomInt(2000, 45000)}, ${fmtDate(randomDate(new Date('2026-01-01'), new Date('2026-03-20')))}, ${randomChoice(['CFE', 'Telmex', 'Office Depot', 'AXA Seguros', 'Cleanpro'])}, ${userIds[randomInt(2, 4)]})`;
  }
  console.log('✓ 12 operational expenses');

  // ═══ SERVICE ORDER COSTS (for completed orders) ═══
  const completedOrders = (await sql`SELECT id FROM service_orders WHERE status IN ('completed', 'closed') LIMIT 20`);
  for (const o of completedOrders) {
    // Materials cost
    await sql`INSERT INTO service_order_costs (order_id, cost_type, description, amount)
      VALUES (${o.id}, 'materials', 'Insumos consumidos', ${randomInt(500, 15000)})`;
    // Labor
    await sql`INSERT INTO service_order_costs (order_id, cost_type, description, amount, hours, rate_per_hour)
      VALUES (${o.id}, 'labor', 'Mano de obra', ${randomInt(1000, 8000)}, ${randomInt(2, 12)}, ${randomInt(150, 350)})`;
    // Transport
    await sql`INSERT INTO service_order_costs (order_id, cost_type, description, amount, km_traveled)
      VALUES (${o.id}, 'transport', 'Traslado vehículo', ${randomInt(200, 2000)}, ${randomInt(10, 80)})`;
  }
  console.log(`✓ ${completedOrders.length * 3} service order costs`);

  console.log('\n✅ Seed completado! Frabe ERP listo con datos demo.');
}

seed().catch(e => console.error('Error:', e));
