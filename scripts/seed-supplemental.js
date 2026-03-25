const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fmtDate(d) { return d.toISOString().split('T')[0]; }
function randomDate(start, end) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }

async function seedExtra() {
  console.log('🌱 Seeding supplemental data...\n');

  // Get existing IDs
  const [org] = await sql`SELECT id FROM organizations LIMIT 1`;
  const orgId = org.id;
  const branches = await sql`SELECT id, name FROM branches WHERE org_id = ${orgId} ORDER BY is_main DESC`;
  const branchIds = branches.map(b => b.id);
  const users = await sql`SELECT id, role, full_name FROM users WHERE org_id = ${orgId}`;
  const admins = users.filter(u => ['admin','manager'].includes(u.role));
  const installers = users.filter(u => u.role === 'installer');
  const allUserIds = users.map(u => u.id);
  const employees = await sql`SELECT id, user_id FROM employees WHERE org_id = ${orgId}`;
  const empIds = employees.map(e => e.id);
  const purchaseOrders = await sql`SELECT id FROM purchase_orders WHERE org_id = ${orgId}`;
  const warehouses = await sql`SELECT id FROM warehouses WHERE org_id = ${orgId}`;
  const whIds = warehouses.map(w => w.id);
  const items = await sql`SELECT id, name, unit_cost FROM inventory_items WHERE org_id = ${orgId}`;

  // ═══ PURCHASE ORDER ITEMS ═══
  console.log('📦 Purchase order items...');
  const poItems = [
    ['Cable UTP Cat6 305m Panduit', 'rollo', 12, 2850],
    ['Fibra óptica monomodo 12h 1km', 'rollo', 3, 15200],
    ['Conector SC/APC paquete 100', 'bolsa', 8, 1250],
    ['Patch cord fibra SC-LC 3m', 'pieza', 50, 185],
    ['Rack de piso 42U Hubbell', 'pieza', 2, 28000],
    ['Patch Panel 24p Cat6 Panduit', 'pieza', 6, 1850],
    ['Canaleta 60x40 Thorsman (2m)', 'pieza', 80, 92],
    ['Jack RJ45 Cat6 Panduit paq 50', 'caja', 4, 4200],
    ['Cámara IP Hikvision 4MP', 'pieza', 16, 3500],
    ['NVR Hikvision 16ch', 'pieza', 2, 12000],
    ['UPS APC 1500VA', 'pieza', 3, 6800],
    ['Switch TP-Link 24p PoE', 'pieza', 4, 5200],
    ['Etiquetas para cable (rollo)', 'rollo', 10, 265],
    ['Anillo guía fibra', 'pieza', 20, 45],
    ['Herraje tipo L para rack', 'pieza', 15, 120],
  ];
  for (const po of purchaseOrders) {
    const numItems = randomInt(2, 5);
    const shuffled = [...poItems].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numItems; i++) {
      const [desc, unit, maxQty, price] = shuffled[i];
      const qty = randomInt(1, maxQty);
      await sql`INSERT INTO purchase_order_items (purchase_order_id, description, quantity, unit, unit_price, total, received_qty)
        VALUES (${po.id}, ${desc}, ${qty}, ${unit}, ${price}, ${qty * price}, ${randomInt(0, qty)})`;
    }
  }
  console.log(`✓ ~${purchaseOrders.length * 3} PO items`);

  // ═══ INVENTORY MOVEMENTS ═══
  console.log('📊 Inventory movements...');
  const moveTypes = ['entry', 'entry', 'exit', 'exit', 'transfer', 'adjustment', 'return'];
  const moveRefs = ['OC-0001', 'OC-0002', 'OC-0003', 'OS-0005', 'OS-0012', 'Ajuste inventario', 'Devolución técnico', 'Transferencia MTY', 'Reconteo', 'Pedido especial'];
  for (let i = 0; i < 45; i++) {
    const item = randomChoice(items);
    const type = randomChoice(moveTypes);
    await sql`INSERT INTO inventory_movements (org_id, item_id, type, quantity, from_warehouse_id, to_warehouse_id, reference, performed_by, created_at)
      VALUES (${orgId}, ${item.id}, ${type},
        ${randomInt(1, 25)},
        ${type === 'transfer' ? randomChoice(whIds) : (type === 'exit' ? randomChoice(whIds) : null)},
        ${type === 'transfer' ? randomChoice(whIds) : (type === 'entry' ? randomChoice(whIds) : null)},
        ${randomChoice(moveRefs)},
        ${randomChoice(allUserIds)},
        ${randomDate(new Date('2025-11-01'), new Date('2026-03-24')).toISOString()})`;
  }
  console.log('✓ 45 inventory movements');

  // ═══ BRANCH CONTRACTS ═══
  console.log('📄 Branch contracts...');
  const contractData = [
    ['rent', 'Inmobiliaria del Valle', 'Renta oficina y almacén CDMX', 45000, 0],
    ['rent', 'Grupo Inmobiliario GDL', 'Renta oficina Guadalajara', 28000, 1],
    ['rent', 'Bienes Raíces MTY', 'Renta bodega Monterrey', 32000, 2],
    ['utilities', 'Telmex Empresarial', 'Internet fibra 500Mbps simétrico', 8500, 0],
    ['utilities', 'CFE Comercial', 'Suministro eléctrico oficina principal', 6200, 0],
    ['insurance', 'AXA Seguros', 'Póliza integral equipo y herramientas', 18000, 0],
    ['insurance', 'GNP Seguros', 'Póliza responsabilidad civil', 12000, 0],
    ['service', 'CleanPro Services', 'Limpieza oficinas CDMX', 4500, 0],
    ['service', 'Kaspersky Endpoint', 'Licencia antivirus 20 puestos', 8900, 0],
    ['service', 'Microsoft 365 Business', 'Licencias M365 20 usuarios', 15600, 0],
    ['utilities', 'Izzi Telecom', 'Internet respaldo GDL 200Mbps', 3800, 1],
    ['service', 'GPS Tracker Pro', 'Rastreo GPS 8 vehículos', 5600, 0],
  ];
  for (const [type, provider, desc, amount, bIdx] of contractData) {
    const startDate = randomDate(new Date('2025-01-01'), new Date('2025-06-01'));
    const endDate = new Date(startDate); endDate.setFullYear(endDate.getFullYear() + 1);
    await sql`INSERT INTO branch_contracts (org_id, branch_id, type, provider, description, amount, start_date, end_date, status)
      VALUES (${orgId}, ${branchIds[bIdx]}, ${type}, ${provider}, ${desc}, ${amount}, ${fmtDate(startDate)}, ${fmtDate(endDate)}, 'active')`;
  }
  console.log('✓ 12 branch contracts');

  // ═══ DOCUMENTS ═══
  console.log('📋 Documents...');
  const docData = [
    ['Procedimiento de Instalación de Fibra Óptica', 'procedure', 'Guía paso a paso para tiradas de fibra FTTH y GPON incluyendo fusiones', '2.1', ['fibra','instalación','FTTH']],
    ['Manual de Cableado Estructurado Cat6/6A', 'manual', 'Normas TIA-568 y buenas prácticas para instalaciones Cat6', '1.3', ['cableado','Cat6','estándares']],
    ['Política de Resguardo de Herramientas', 'policy', 'Procedimiento de asignación, uso y devolución de herramientas de trabajo', '1.0', ['herramientas','resguardo','inventario']],
    ['Procedimiento de Almacén — Entradas y Salidas', 'procedure', 'Control de movimientos de inventario, formatos y autorizaciones', '1.2', ['almacén','inventario','logística']],
    ['Manual de Seguridad en Campo', 'manual', 'Protocolos de seguridad para trabajos en alturas, manejo eléctrico y espacios confinados', '2.0', ['seguridad','campo','EPP']],
    ['Plantilla — Orden de Servicio', 'template', 'Template para generar órdenes de servicio con datos de cliente y especificaciones', '1.1', ['OS','plantilla','formato']],
    ['Procedimiento de Mantenimiento Vehicular', 'procedure', 'Programa de mantenimiento preventivo para flotilla vehicular', '1.0', ['flotilla','mantenimiento','vehículos']],
    ['Política de Vacaciones y Permisos', 'policy', 'Lineamientos para solicitud de vacaciones, permisos y faltas justificadas', '1.1', ['RH','vacaciones','permisos']],
    ['Manual de Certificación de Puntos de Red', 'manual', 'Procedimiento de certificación con equipo Fluke DTX, parámetros aceptables', '1.4', ['certificación','cableado','Fluke']],
    ['Procedimiento de Compras', 'procedure', 'Flujo de autorización de órdenes de compra, proveedores aprobados', '1.0', ['compras','OC','proveedores']],
    ['Manual de CCTV — Instalación y Configuración', 'manual', 'Guía para instalación de NVR, cámaras IP Hikvision y configuración remota', '1.2', ['CCTV','Hikvision','NVR']],
    ['Plantilla — Reporte de Incidencia', 'template', 'Formato para reporte de incidencias en campo con evidencia fotográfica', '1.0', ['incidencia','reporte','campo']],
    ['Política de Uso de Vehículos', 'policy', 'Reglas de uso de vehículos de empresa, combustible y reporte de multas', '1.0', ['flotilla','política','vehículos']],
    ['Manual de Fusionadora Fujikura 90S', 'manual', 'Guía operativa de la fusionadora, mantenimiento y limpieza de electrodos', '1.0', ['fusionadora','Fujikura','fibra']],
    ['Procedimiento de Auditoría de Inventario', 'procedure', 'Metodología para conteo físico y conciliación de inventario', '1.0', ['inventario','auditoría','almacén']],
  ];
  for (const [title, category, description, version, tags] of docData) {
    await sql`INSERT INTO documents (org_id, title, description, category, version, tags, uploaded_by)
      VALUES (${orgId}, ${title}, ${description}, ${category}, ${version}, ${JSON.stringify(tags)}, ${randomChoice(admins).id})`;
  }
  console.log('✓ 15 documents');

  // ═══ ADMIN PROJECTS ═══
  console.log('📁 Projects...');
  const projectData = [
    ['Migración ERP Neon → Frabe', 'Desarrollo e implementación del nuevo ERP a medida', 'active', 'high'],
    ['Expansión Sucursal Querétaro', 'Apertura de nueva sucursal en Querétaro, renta, equipamiento', 'active', 'high'],
    ['Certificación ISO 9001:2015', 'Proceso de certificación de calidad para operaciones', 'active', 'medium'],
    ['Renovación de Flotilla 2026', 'Evaluación y adquisición de vehículos nuevos para 2026', 'paused', 'medium'],
    ['Programa de Capacitación Técnica Q2', 'Capacitaciones de fibra, CCTV y cableado para técnicos', 'active', 'medium'],
    ['Digitalización de Procesos Almacén', 'Implementar lectura de código de barras y trazabilidad', 'active', 'low'],
    ['Contrato Telmex — Proyecto Nacional', 'Respuesta a licitación para proyecto nacional de fibra', 'completed', 'urgent'],
  ];
  const projectIds = [];
  for (const [name, desc, status, priority] of projectData) {
    const sd = randomDate(new Date('2025-10-01'), new Date('2026-02-01'));
    const dd = new Date(sd); dd.setMonth(dd.getMonth() + randomInt(3, 8));
    const [p] = await sql`INSERT INTO admin_projects (org_id, name, description, status, priority, owner_id, start_date, due_date)
      VALUES (${orgId}, ${name}, ${desc}, ${status}, ${priority}, ${randomChoice(admins).id}, ${fmtDate(sd)}, ${fmtDate(dd)}) RETURNING id`;
    projectIds.push(p.id);
  }
  console.log(`✓ ${projectData.length} projects`);

  // ═══ ADMIN TASKS ═══
  console.log('✅ Tasks...');
  const taskData = [
    [0, 'Definir esquema de base de datos 36 tablas', 'done', 'high'],
    [0, 'Migrar datos históricos de Neon', 'in_progress', 'high'],
    [0, 'Implementar módulo de órdenes de servicio', 'done', 'high'],
    [0, 'Pruebas de integración con Neon DB', 'in_progress', 'medium'],
    [0, 'Capacitar usuarios admin y gerentes', 'todo', 'medium'],
    [0, 'Deploy en Vercel producción', 'todo', 'high'],
    [1, 'Buscar local comercial en Querétaro', 'in_progress', 'high'],
    [1, 'Cotizar mobiliario y equipamiento', 'todo', 'medium'],
    [1, 'Contratar gerente de sucursal', 'todo', 'high'],
    [1, 'Instalar infraestructura de red', 'todo', 'medium'],
    [2, 'Documentar procesos actuales', 'in_progress', 'high'],
    [2, 'Auditoría interna de calidad', 'todo', 'high'],
    [2, 'Implementar acciones correctivas', 'todo', 'medium'],
    [3, 'Evaluar opciones pickup 2026', 'done', 'medium'],
    [3, 'Cotizar con 3 agencias', 'in_progress', 'medium'],
    [3, 'Vender vehículos dados de baja', 'todo', 'low'],
    [4, 'Curso fusión de fibra 40h', 'done', 'high'],
    [4, 'Taller CCTV IP avanzado 16h', 'in_progress', 'medium'],
    [4, 'Certificación Panduit Cat6/6A', 'todo', 'high'],
    [4, 'Examen práctico técnicos', 'todo', 'medium'],
    [5, 'Comprar lectores código de barras', 'done', 'medium'],
    [5, 'Integrar app de escaneo con ERP', 'in_progress', 'high'],
    [5, 'Capacitar almacenistas', 'todo', 'medium'],
    [6, 'Elaborar propuesta técnica', 'done', 'urgent'],
    [6, 'Presentar a comité de Telmex', 'done', 'urgent'],
    [6, 'Recibir adjudicación', 'done', 'high'],
  ];
  for (const [projIdx, title, status, priority] of taskData) {
    const dd = randomDate(new Date('2026-03-01'), new Date('2026-08-15'));
    await sql`INSERT INTO admin_tasks (project_id, title, status, priority, assigned_to, due_date)
      VALUES (${projectIds[projIdx]}, ${title}, ${status}, ${priority}, ${randomChoice(allUserIds)}, ${fmtDate(dd)})`;
  }
  console.log(`✓ ${taskData.length} tasks`);

  // ═══ MEETINGS ═══
  console.log('📅 Meetings...');
  const meetingData = [
    [0, 'Kickoff ERP Frabe', 'Sala Principal CDMX', '2025-11-15 10:00', 90],
    [0, 'Review Sprint 1 — Órdenes', 'Zoom', '2026-01-20 14:00', 60],
    [0, 'Demo módulo almacenes y herramientas', 'Sala Principal CDMX', '2026-02-10 10:00', 45],
    [0, 'Planeación Sprint 3 — Flotillas y RH', 'Teams', '2026-03-01 09:00', 60],
    [1, 'Reunión de planeación expansión QRO', 'Sala Ejecutiva', '2026-02-15 11:00', 90],
    [1, 'Visita local candidato Querétaro', 'Querétaro', '2026-03-05 10:00', 120],
    [2, 'Inicio auditoría ISO 9001', 'Sala ISO', '2026-01-10 09:00', 120],
    [4, 'Planeación capacitaciones Q2', 'Sala Principal CDMX', '2026-03-10 10:00', 60],
    [null, 'Junta directiva mensual — Marzo', 'Sala Ejecutiva', '2026-03-20 09:00', 120],
    [null, 'Junta directiva mensual — Febrero', 'Sala Ejecutiva', '2026-02-20 09:00', 120],
    [null, 'Revisión KPIs operativos Q1', 'Zoom', '2026-03-28 15:00', 60],
    [null, 'Comité de compras', 'Sala Principal CDMX', '2026-03-12 11:00', 45],
  ];
  for (const [projIdx, title, location, date, duration] of meetingData) {
    await sql`INSERT INTO meetings (org_id, project_id, title, location, date, duration_minutes, created_by)
      VALUES (${orgId}, ${projIdx !== null ? projectIds[projIdx] : null}, ${title}, ${location}, ${date}, ${duration}, ${randomChoice(admins).id})`;
  }
  console.log(`✓ ${meetingData.length} meetings`);

  // ═══ HR VACATIONS ═══
  console.log('🏖️ Vacations...');
  const vacTypes = ['vacation', 'personal', 'medical'];
  const vacStatuses = ['requested', 'requested', 'approved', 'approved', 'approved', 'taken', 'taken', 'rejected'];
  for (let i = 0; i < 18; i++) {
    const empId = randomChoice(empIds);
    const startDate = randomDate(new Date('2026-01-15'), new Date('2026-06-30'));
    const days = randomInt(1, 10);
    const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + days);
    const status = randomChoice(vacStatuses);
    await sql`INSERT INTO hr_vacations (employee_id, org_id, start_date, end_date, days, type, status, approved_by)
      VALUES (${empId}, ${orgId}, ${fmtDate(startDate)}, ${fmtDate(endDate)}, ${days}, ${randomChoice(vacTypes)}, ${status}, ${status === 'approved' || status === 'taken' ? randomChoice(admins).id : null})`;
  }
  console.log('✓ 18 vacations');

  // ═══ HR INCIDENTS ═══
  console.log('⚠️ HR Incidents...');
  const hrIncData = [
    ['absence', 'minor', 'Falta injustificada — no se presentó a trabajar lunes'],
    ['tardiness', 'minor', 'Llegada tarde reiterada (3era vez en el mes)'],
    ['absence', 'major', 'Falta durante orden urgente, afectó entrega al cliente'],
    ['misconduct', 'major', 'Uso inadecuado de vehículo de empresa para asuntos personales'],
    ['safety', 'major', 'No uso de EPP en trabajo de altura — riesgo de accidente'],
    ['tardiness', 'minor', 'Llegada 45 min tarde sin aviso previo'],
    ['absence', 'minor', 'Falta justificada sin comprobante médico'],
    ['misconduct', 'minor', 'Uso de celular durante trabajo en sitio del cliente'],
    ['safety', 'major', 'Herramienta eléctrica sin mantenimiento — riesgo eléctrico'],
    ['tardiness', 'minor', 'Llegada tarde por tráfico — sin notificación previa'],
  ];
  for (const [type, severity, description] of hrIncData) {
    await sql`INSERT INTO hr_incidents (employee_id, org_id, type, severity, description, date, reported_by)
      VALUES (${randomChoice(empIds)}, ${orgId}, ${type}, ${severity}, ${description}, ${fmtDate(randomDate(new Date('2025-12-01'), new Date('2026-03-24')))}, ${randomChoice(admins).id})`;
  }
  console.log(`✓ ${hrIncData.length} HR incidents`);

  // ═══ HR TRAININGS ═══
  console.log('🎓 Trainings...');
  const trainingData = [
    ['Fusión de Fibra Óptica — Nivel Avanzado', 'Ing. Marco López (Fujikura México)', 40, '2025-11-20'],
    ['Cableado Estructurado Cat6/6A — Certificación', 'Panduit Academy', 24, '2026-01-15'],
    ['Instalación y Configuración CCTV IP', 'Hikvision Training Center', 16, '2026-02-05'],
    ['Seguridad en Trabajos de Altura', 'Protección Civil CDMX', 8, '2026-01-25'],
    ['Primeros Auxilios y RCP', 'Cruz Roja Mexicana', 8, '2025-12-10'],
    ['Manejo Defensivo y Seguridad Vial', 'CESVI México', 4, '2026-02-28'],
    ['NOM-001-SEDE — Instalaciones Eléctricas', 'ANCE', 16, '2026-03-08'],
    ['Uso de OTDR y Power Meter', 'EXFO Training', 8, '2026-03-15'],
  ];
  const trainingIds = [];
  for (const [title, trainer, hours, date] of trainingData) {
    const [t] = await sql`INSERT INTO hr_trainings (org_id, title, trainer, duration_hours, date, location)
      VALUES (${orgId}, ${title}, ${trainer}, ${hours}, ${date}, ${randomChoice(['Sala de capacitación CDMX', 'En línea — Zoom', 'Centro de entrenamiento GDL', 'Oficina MTY', 'Instalaciones del proveedor'])}) RETURNING id`;
    trainingIds.push(t.id);
  }
  console.log(`✓ ${trainingData.length} trainings`);

  // Training attendees
  for (const tId of trainingIds) {
    const numAttendees = randomInt(3, 8);
    const shuffled = [...installers.map(i => i.id), ...allUserIds.slice(0, 3)].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numAttendees, shuffled.length); i++) {
      await sql`INSERT INTO hr_training_attendees (training_id, user_id, passed)
        VALUES (${tId}, ${shuffled[i]}, ${Math.random() > 0.15}) ON CONFLICT DO NOTHING`;
    }
  }
  console.log('✓ Training attendees');

  // ═══ MORE OPERATIONAL EXPENSES ═══
  console.log('💰 Extra operational expenses...');
  const extraExpenses = [
    ['rent', 'Renta oficina CDMX Marzo', 45000, 0], ['rent', 'Renta bodega GDL Marzo', 28000, 1],
    ['rent', 'Renta bodega MTY Marzo', 32000, 2], ['utilities', 'Luz CFE CDMX Feb', 8200, 0],
    ['utilities', 'Internet Telmex Feb', 8500, 0], ['utilities', 'Luz CFE CDMX Ene', 7800, 0],
    ['utilities', 'Agua CDMX Bimestre', 3200, 0], ['supplies', 'Papelería y toner Feb', 4500, 0],
    ['supplies', 'Material de limpieza Marzo', 2800, 0], ['insurance', 'Póliza equipo mensual', 18000, 0],
    ['insurance', 'Póliza RC mensual', 12000, 0], ['payroll', 'Nómina quincenal 1 Marzo', 185000, 0],
    ['payroll', 'Nómina quincenal 2 Marzo', 185000, 0], ['payroll', 'IMSS e INFONAVIT Marzo', 42000, 0],
    ['other', 'Capacitación fusión fibra', 35000, 0], ['other', 'Certificación Panduit', 22000, 0],
    ['supplies', 'Uniformes técnicos (8)', 12000, 0], ['other', 'Licencia GPS Tracker', 5600, 0],
    ['rent', 'Renta oficina CDMX Feb', 45000, 0], ['rent', 'Renta bodega GDL Feb', 28000, 1],
    ['utilities', 'Internet Izzi GDL Feb', 3800, 1], ['utilities', 'Luz CFE MTY Feb', 5400, 2],
    ['payroll', 'Nómina quincenal 1 Feb', 185000, 0], ['payroll', 'Nómina quincenal 2 Feb', 185000, 0],
  ];
  for (const [cat, desc, amount, bIdx] of extraExpenses) {
    await sql`INSERT INTO operational_expenses (org_id, branch_id, category, description, amount, date, vendor, recorded_by)
      VALUES (${orgId}, ${branchIds[bIdx]}, ${cat}, ${desc}, ${amount},
        ${fmtDate(randomDate(new Date('2026-01-01'), new Date('2026-03-24')))},
        ${randomChoice(['CFE', 'Telmex', 'Izzi', 'Office Depot', 'AXA Seguros', 'GNP', 'IMSS', 'Nóminas MX', 'Panduit', 'Fujikura'])},
        ${randomChoice(admins).id})`;
  }
  console.log(`✓ ${extraExpenses.length} extra expenses`);

  // ═══ MORE PURCHASE ORDERS ═══
  console.log('🛒 Extra purchase orders...');
  const extraPOs = [
    ['Panduit México', 'approved', 0], ['Hikvision México', 'submitted', 0],
    ['Commscope', 'received', 1], ['3M Telecomunicaciones', 'draft', 0],
    ['Hubbell', 'approved', 2], ['Thorsman', 'submitted', 1],
    ['Furukawa', 'approved', 0], ['APC by Schneider', 'received', 0],
  ];
  const poCount = (await sql`SELECT COUNT(*) as c FROM purchase_orders`)[0].c;
  for (let i = 0; i < extraPOs.length; i++) {
    const [supplier, status, bIdx] = extraPOs[i];
    const sub = randomInt(8000, 150000);
    const tax = Math.round(sub * 0.16);
    const [po] = await sql`INSERT INTO purchase_orders (org_id, branch_id, po_number, supplier_name, status, subtotal, tax, total, created_by, approved_by)
      VALUES (${orgId}, ${branchIds[bIdx]}, ${'OC-' + String(Number(poCount) + i + 1).padStart(4, '0')}, ${supplier}, ${status}, ${sub}, ${tax}, ${sub + tax}, ${randomChoice(admins).id}, ${status === 'approved' || status === 'received' ? randomChoice(admins).id : null}) RETURNING id`;
    // Add items
    const numItems = randomInt(2, 4);
    const shuffled = [...poItems].sort(() => Math.random() - 0.5);
    for (let j = 0; j < numItems; j++) {
      const [desc, unit, maxQty, price] = shuffled[j];
      const qty = randomInt(1, maxQty);
      await sql`INSERT INTO purchase_order_items (purchase_order_id, description, quantity, unit, unit_price, total, received_qty)
        VALUES (${po.id}, ${desc}, ${qty}, ${unit}, ${price}, ${qty * price}, ${status === 'received' ? qty : 0})`;
    }
  }
  console.log('✓ 8 extra POs with items');

  // ═══ EXTRA ASSETS ═══
  console.log('📦 Extra assets...');
  const extraAssets = [
    ['MacBook Pro 14" M3', 'computing', 42000], ['Monitor Dell 27" 4K', 'computing', 12000],
    ['Switch Cisco SG300 28p', 'networking', 18000], ['Firewall Fortinet 40F', 'networking', 35000],
    ['Laptop Lenovo ThinkPad', 'computing', 25000], ['Tablet iPad Air', 'computing', 15000],
    ['Mesa sala juntas 10p', 'furniture', 18000], ['Archivero 4 gavetas', 'furniture', 6500],
    ['Minisplit 2 ton Samsung', 'hvac', 22000], ['Cámara Hikvision 4MP ext.', 'networking', 3500],
  ];
  for (const [name, cat, cost] of extraAssets) {
    await sql`INSERT INTO assets (org_id, branch_id, name, category, serial_number, asset_tag, status, acquisition_cost, acquisition_date, assigned_to)
      VALUES (${orgId}, ${randomChoice(branchIds)}, ${name}, ${cat}, ${'AST-' + randomInt(200000, 999999)}, ${'TAG-' + randomInt(1000, 9999)}, ${randomChoice(['available', 'assigned', 'assigned', 'assigned'])}, ${cost}, ${fmtDate(randomDate(new Date('2022-06-01'), new Date('2026-01-01')))}, ${Math.random() > 0.3 ? randomChoice(allUserIds) : null})`;
  }
  console.log('✓ 10 extra assets');

  console.log('\n✅ Supplemental seed completado!');
}

seedExtra().catch(e => console.error('Error:', e));
