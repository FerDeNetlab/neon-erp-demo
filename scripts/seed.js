// Seed script — Llena el ERP con datos demo extensos
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const nombres = ['Carlos Mendoza', 'Luis Ramírez', 'Miguel Torres', 'Juan García', 'Pedro Sánchez', 'Roberto López', 'Andrés Hernández', 'Diego Flores', 'Javier Cruz', 'Eduardo Morales', 'Ricardo Vega', 'Fernando Díaz'];
const apellidos = ['Instalador Sr.', 'Técnico Jr.', 'Jefe de Obra', 'Supervisor', 'Técnico Fibra', 'Instalador Jr.', 'Técnico CCTV', 'Técnico Redes', 'Coord. Proyectos', 'Técnico General', 'Jefe Almacén', 'Coord. Flota'];
const ciudades = ['CDMX', 'Guadalajara', 'Monterrey', 'Puebla', 'Querétaro', 'León', 'Toluca', 'Mérida'];
const clientes = ['Telmex', 'Totalplay', 'Izzi', 'Megacable', 'AT&T México', 'Axtel', 'KIO Networks', 'Alestra', 'Cablevisión', 'Sky México'];
const tiposTicket = ['fibra', 'cctv', 'cableado', 'servidor', 'otro'];
const marcasAuto = ['Nissan', 'Chevrolet', 'Ford', 'Toyota', 'Volkswagen'];
const modelosAuto = ['NP300', 'S10', 'Ranger', 'Hilux', 'Amarok', 'Frontier', 'Colorado', 'Transit', 'Saveiro', 'Partner'];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function seed() {
  console.log('🌱 Seeding...\n');

  // 1. Usuarios (12)
  const usuarioIds = [];
  for (let i = 0; i < 12; i++) {
    const res = await sql`INSERT INTO usuarios (nombre, apellidos, email, telefono, rol, activo)
      VALUES (${nombres[i]}, ${apellidos[i]}, ${nombres[i].toLowerCase().replace(' ','.')+'@empresa.com'}, ${'+52 ' + randomInt(5510000000, 5599999999)}, ${i < 2 ? 'admin' : i < 5 ? 'supervisor' : 'instalador'}, ${true}) RETURNING id`;
    usuarioIds.push(res[0].id);
    console.log(`  ✓ Usuario: ${nombres[i]}`);
  }

  // 2. Tickets (40)
  const ticketIds = [];
  const estados = ['pendiente', 'pendiente', 'en_progreso', 'en_progreso', 'en_progreso', 'completado', 'completado', 'completado', 'completado', 'cancelado'];
  const prioridades = ['baja', 'media', 'media', 'media', 'alta', 'alta', 'urgente'];
  for (let i = 0; i < 40; i++) {
    const tipo = randomChoice(tiposTicket);
    const estado = randomChoice(estados);
    const titulos = {
      fibra: ['Tirada de fibra óptica', 'Fusión de fibra 24 hilos', 'Tendido de fibra 48 hilos', 'Reparación de fibra rota', 'Empalme de fibra FTTH'],
      cctv:  ['Instalación CCTV 8 cámaras', 'Mantenimiento CCTV', 'Upgrade de DVR a NVR', 'Cableado CCTV exterior', 'Reinstalación cámaras IP'],
      cableado: ['Cableado estructurado Cat6', 'Instalación de rack', 'Certificación de puntos de red', 'Patch panel y organización', 'Cableado Cat6A blindado'],
      servidor: ['Instalación de rack servidor', 'Migración de servidor', 'Configuración UPS', 'Montaje de servidor blade', 'Instalación de NAS'],
      otro: ['Levantamiento técnico', 'Revisión de sitio', 'Cotización técnica', 'Auditoría de red', 'Soporte general en sitio']
    };
    const titulo = randomChoice(titulos[tipo]);
    const fechaProg = randomDate(new Date('2025-12-01'), new Date('2026-04-30'));
    const res = await sql`INSERT INTO tickets (numero_ticket, titulo, descripcion, tipo, estado, prioridad, cliente_nombre, cliente_telefono, direccion, ciudad, asignado_a, fecha_programada, created_by, created_at)
      VALUES (${'TK-' + String(i+1).padStart(4,'0')}, ${titulo}, ${'Trabajo de ' + tipo + ' para ' + randomChoice(clientes) + '. ' + randomChoice(['Zona norte.','Zona sur.','Zona centro.','Zona poniente.','Col. Industrial.','Parque empresarial.'])}, ${tipo}, ${estado}, ${randomChoice(prioridades)}, ${randomChoice(clientes)}, ${'+52 55' + randomInt(10000000, 99999999)}, ${randomChoice(['Av. Insurgentes','Blvd. López Mateos','Av. Revolución','Calle 5 de Mayo','Periférico Sur','Av. Universidad']) + ' #' + randomInt(100,9999)}, ${randomChoice(ciudades)}, ${randomChoice(usuarioIds)}, ${fechaProg.toISOString().split('T')[0]}, ${'fer@netlab.mx'}, ${randomDate(new Date('2025-11-01'), new Date('2026-03-10')).toISOString()}) RETURNING id`;
    ticketIds.push(res[0].id);
  }
  console.log(`  ✓ 40 tickets creados`);

  // 3. Evidencias (60)
  const fotoUrls = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400',
    'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=400', 'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=400',
    'https://images.unsplash.com/photo-1563770660941-10a1a1f3f4ef?w=400', 'https://images.unsplash.com/photo-1619452220792-f2c36e51081f?w=400',
  ];
  for (let i = 0; i < 60; i++) {
    const desc = randomChoice(['Antes de instalación','Durante instalación','Trabajo terminado','Evidencia de fusión','Rack terminado','Cableado organizado','Cámaras instaladas','Prueba de señal','Certificación de punto','Entrega al cliente']);
    await sql`INSERT INTO evidencias (ticket_id, tipo, url, descripcion, subido_por, created_at)
      VALUES (${randomChoice(ticketIds)}, ${'foto'}, ${randomChoice(fotoUrls)}, ${desc}, ${randomChoice(nombres).toLowerCase().replace(' ','.')+'@empresa.com'}, ${randomDate(new Date('2025-12-01'), new Date('2026-03-10')).toISOString()})`;
  }
  console.log(`  ✓ 60 evidencias creadas`);

  // 4. Incidencias (20)
  const tiposInc = ['accidente', 'retraso', 'material_faltante', 'equipo_dañado', 'otro'];
  const descInc = ['Retraso por lluvia en zona de trabajo','Material insuficiente para completar instalación','Herramienta dañada durante trabajo','Acceso al sitio denegado por seguridad','Vehículo ponchado en camino al sitio','Cable dañado por terceros','Falta de energía eléctrica en sitio','Escalera insuficiente para altura','Cliente no presente en domicilio','Permisos municipales pendientes','Equipo de fusión con falla','Fibra rota por maquinaria','Conflicto con vecinos por ruido','Falta de señalización vial','Tubería conduit obstruida','Falta de conectores RJ45','DVR con firmware desactualizado','Poste con daño estructural','Andamio inestable','Error en medición de distancia'];
  const sevsInc = ['baja', 'media', 'media', 'alta', 'critica'];
  const estInc = ['abierta', 'abierta', 'en_revision', 'resuelta', 'cerrada'];
  for (let i = 0; i < 20; i++) {
    await sql`INSERT INTO incidencias (ticket_id, reportado_por, tipo, severidad, descripcion, estado, created_at)
      VALUES (${randomChoice(ticketIds)}, ${randomChoice(nombres).toLowerCase().replace(' ','.')+'@empresa.com'}, ${randomChoice(tiposInc)}, ${randomChoice(sevsInc)}, ${descInc[i]}, ${randomChoice(estInc)}, ${randomDate(new Date('2025-12-15'), new Date('2026-03-10')).toISOString()})`;
  }
  console.log(`  ✓ 20 incidencias creadas`);

  // 5. Activos Fijos (25)
  const activos = [
    ['Taladro Bosch GSB 13RE','herramienta',2500],['Rotomartillo Milwaukee M18','herramienta',8900],['Fusionadora Fujikura 90S','equipo_medicion',185000],
    ['OTDR EXFO MaxTester','equipo_medicion',95000],['Laptop Dell Latitude 5540','equipo_computo',28000],['Power Meter Joinwit','equipo_medicion',3500],
    ['Multímetro Fluke 87V','equipo_medicion',12000],['Ponchadora RJ45 Panduit','herramienta',1800],['Escalera telescópica 6m','herramienta',4500],
    ['Cortadora de fibra CT-50','herramienta',15000],['Laptop Lenovo ThinkPad','equipo_computo',22000],['Generador de tonos Fluke','equipo_medicion',5500],
    ['Nivel láser Bosch GLL 3','herramienta',6800],['Cámara termográfica FLIR','equipo_medicion',45000],['Tablet Samsung Galaxy Tab','equipo_computo',8500],
    ['Pinza amperimétrica Fluke','equipo_medicion',4200],['Taladro DeWalt DCD996','herramienta',7500],['Detector de cables Noyafa','herramienta',2200],
    ['Sierra caladora Makita','herramienta',3800],['Pulidora de fibra NTT-AT','herramienta',6500],['Switch Cisco Catalyst 2960','equipo_computo',15000],
    ['UPS APC Smart 3000VA','equipo_computo',18000],['Medidor de potencia óptica','equipo_medicion',2800],['Cizalla para cable 3M','herramienta',1500],
    ['Kit de fusión rápida 3M','herramienta',8500]
  ];
  const estadosActivo = ['disponible','disponible','disponible','asignado','asignado','asignado','en_reparacion'];
  for (const [nombre, cat, valor] of activos) {
    await sql`INSERT INTO activos_fijos (nombre, categoria, numero_serie, estado, asignado_a, valor_adquisicion, fecha_adquisicion)
      VALUES (${nombre}, ${cat}, ${'SN-' + randomInt(100000,999999)}, ${randomChoice(estadosActivo)}, ${Math.random()>0.4 ? randomChoice(usuarioIds) : null}, ${valor}, ${randomDate(new Date('2023-01-01'), new Date('2025-12-01')).toISOString().split('T')[0]})`;
  }
  console.log(`  ✓ 25 activos fijos creados`);

  // 6. Materiales (18)
  const mats = [
    ['Cable UTP Cat6 305m','cableado','rollo',12,3,2800],['Cable UTP Cat6A 305m','cableado','rollo',5,2,4500],
    ['Fibra óptica 12 hilos 1km','cableado','rollo',4,1,15000],['Fibra óptica 24 hilos 1km','cableado','rollo',3,1,22000],
    ['Conector RJ45 Cat6 (bolsa 100)','conectores','bolsa',25,5,450],['Conector SC/APC (bolsa 50)','conectores','bolsa',15,3,1200],
    ['Conector LC/UPC (bolsa 50)','conectores','bolsa',10,3,1500],['Patch cord fibra 3m SC-LC','cableado','pieza',40,10,180],
    ['Patch cord UTP Cat6 1m','cableado','pieza',80,20,45],['Canaleta 60x40 2m','otro','pieza',50,15,85],
    ['Tubo conduit 3/4 3m','otro','pieza',30,10,65],['Abrazadera tipo U 3/4','otro','bolsa',20,5,120],
    ['Patch Panel 24 puertos Cat6','otro','pieza',8,2,1800],['Jack RJ45 Cat6 Panduit','conectores','pieza',120,30,95],
    ['Face plate 2 puertos','otro','pieza',60,15,35],['Etiquetas para cable (rollo)','otro','rollo',10,3,250],
    ['Cinta Velcro organiza cables','otro','rollo',15,5,180],['Split tubing 1/2 (10m)','otro','pieza',25,5,90]
  ];
  for (const [nombre,cat,unidad,stock,min,costo] of mats) {
    await sql`INSERT INTO materiales (nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario, ubicacion)
      VALUES (${nombre}, ${cat}, ${unidad}, ${stock}, ${min}, ${costo}, ${randomChoice(['Almacén principal','Almacén norte','Bodega GDL','Bodega MTY'])})`;
  }
  console.log(`  ✓ 18 materiales creados`);

  // 7. Vehículos (8)
  const placas = ['ABC-1234','DEF-5678','GHI-9012','JKL-3456','MNO-7890','PQR-2345','STU-6789','VWX-0123'];
  const colores = ['Blanco','Gris','Negro','Rojo','Plata','Blanco','Blanco','Azul'];
  const vehiculoIds = [];
  for (let i = 0; i < 8; i++) {
    const res = await sql`INSERT INTO vehiculos (placa, marca, modelo, anio, color, tipo, numero_serie_vehicular, estado, asignado_a, km_actual, vigencia_seguro, verificacion_vigencia)
      VALUES (${placas[i]}, ${randomChoice(marcasAuto)}, ${randomChoice(modelosAuto)}, ${randomInt(2018,2025)}, ${colores[i]}, ${i < 6 ? 'camioneta' : 'van'}, ${'VIN-' + randomInt(100000000,999999999)}, ${i < 7 ? 'activo' : 'en_taller'}, ${usuarioIds[i] || null}, ${randomInt(15000,120000)}, ${randomDate(new Date('2026-01-01'), new Date('2026-12-31')).toISOString().split('T')[0]}, ${randomDate(new Date('2026-01-01'), new Date('2026-06-30')).toISOString().split('T')[0]}) RETURNING id`;
    vehiculoIds.push(res[0].id);
  }
  console.log(`  ✓ 8 vehículos creados`);

  // 8. Mantenimientos (20)
  const descMant = ['Cambio de aceite y filtro','Alineación y balanceo','Cambio de frenos delanteros','Servicio mayor 40,000 km','Cambio de llantas (4)','Reparación de suspensión','Cambio de batería','Afinación menor','Cambio de banda de distribución','Revisión de sistema eléctrico'];
  for (let i = 0; i < 20; i++) {
    await sql`INSERT INTO vehiculo_mantenimientos (vehiculo_id, tipo, descripcion, km_mantenimiento, costo, taller, fecha, proximo_mantenimiento_fecha)
      VALUES (${randomChoice(vehiculoIds)}, ${Math.random()>0.3?'preventivo':'correctivo'}, ${randomChoice(descMant)}, ${randomInt(20000,100000)}, ${randomInt(800,15000)}, ${randomChoice(['Taller Mecánico Express','AutoServiceMX','ServiFrenos CDMX','Llantera Nacional','Taller Toyota Oficial'])}, ${randomDate(new Date('2025-06-01'), new Date('2026-03-10')).toISOString().split('T')[0]}, ${randomDate(new Date('2026-04-01'), new Date('2026-09-30')).toISOString().split('T')[0]})`;
  }
  console.log(`  ✓ 20 mantenimientos creados`);

  // 9. Combustible (50)
  for (let i = 0; i < 50; i++) {
    await sql`INSERT INTO vehiculo_combustible (vehiculo_id, conductor_id, litros, costo_total, km_carga, gasolinera, fecha)
      VALUES (${randomChoice(vehiculoIds)}, ${randomChoice(usuarioIds)}, ${randomInt(25,65)}, ${randomInt(500,1400)}, ${randomInt(20000,110000)}, ${randomChoice(['Pemex Insurgentes','BP Revolución','Shell Periférico','Mobil Reforma','G500 López Mateos','Pemex Av. Central','Orsan Constituyentes'])}, ${randomDate(new Date('2025-09-01'), new Date('2026-03-10')).toISOString().split('T')[0]})`;
  }
  console.log(`  ✓ 50 cargas de combustible creadas`);

  // 10. Multas (8)
  const motivosMulta = ['Exceso de velocidad','Estacionamiento prohibido','Vuelta prohibida','No respetar semáforo','Falta de verificación','Circular en día de hoy no circula','Doble fila','Invasión de carril confinado'];
  for (let i = 0; i < 8; i++) {
    await sql`INSERT INTO vehiculo_multas (vehiculo_id, conductor_id, fecha, monto, motivo, estado)
      VALUES (${randomChoice(vehiculoIds)}, ${randomChoice(usuarioIds)}, ${randomDate(new Date('2025-06-01'), new Date('2026-03-10')).toISOString().split('T')[0]}, ${randomInt(800,5500)}, ${motivosMulta[i]}, ${Math.random()>0.4?'pendiente':'pagada'})`;
  }
  console.log(`  ✓ 8 multas creadas`);

  // 11. Cotizaciones (12)
  const cotIds = [];
  const estadosCot = ['borrador','enviada','enviada','aceptada','aceptada','aceptada','rechazada'];
  for (let i = 0; i < 12; i++) {
    const cliente = randomChoice(clientes);
    const partidasData = [];
    const numPartidas = randomInt(2,5);
    let sub = 0;
    const servicios = ['Instalación de fibra óptica','Cableado estructurado Cat6','Sistema CCTV 8 cámaras','Configuración de servidor','Rack de comunicaciones','Mano de obra instalación','Materiales varios','Certificación de puntos','Diseño de red','Mantenimiento preventivo'];
    for (let j = 0; j < numPartidas; j++) {
      const cant = randomInt(1,10);
      const precio = randomInt(2000,35000);
      sub += cant * precio;
      partidasData.push({ desc: randomChoice(servicios), cant, precio });
    }
    const ivaVal = sub * 0.16;
    const totalVal = sub + ivaVal;
    const res = await sql`INSERT INTO cotizaciones (numero_cotizacion, cliente_nombre, cliente_email, cliente_telefono, cliente_empresa, estado, subtotal, iva, total, vigencia, created_by, created_at)
      VALUES (${'COT-' + String(i+1).padStart(4,'0')}, ${cliente + ' Contacto'}, ${cliente.toLowerCase().replace(/\s/g,'')+'@contacto.com'}, ${'+52 55' + randomInt(10000000,99999999)}, ${cliente}, ${randomChoice(estadosCot)}, ${sub}, ${ivaVal}, ${totalVal}, ${randomDate(new Date('2026-03-15'), new Date('2026-06-30')).toISOString().split('T')[0]}, ${'fer@netlab.mx'}, ${randomDate(new Date('2025-12-01'), new Date('2026-03-10')).toISOString()}) RETURNING id`;
    cotIds.push(res[0].id);
    for (const p of partidasData) {
      await sql`INSERT INTO cotizacion_partidas (cotizacion_id, descripcion, cantidad, unidad, precio_unitario, total)
        VALUES (${res[0].id}, ${p.desc}, ${p.cant}, ${'servicio'}, ${p.precio}, ${p.cant * p.precio})`;
    }
  }
  console.log(`  ✓ 12 cotizaciones con partidas creadas`);

  // 12. Facturas (15)
  const estadosFac = ['pendiente','pendiente','pendiente','pagada','pagada','pagada','pagada','pagada','vencida'];
  for (let i = 0; i < 15; i++) {
    const sub = randomInt(8000,120000);
    const ivaVal = sub * 0.16;
    const estado = randomChoice(estadosFac);
    await sql`INSERT INTO facturas (numero_factura, ticket_id, cotizacion_id, cliente_nombre, cliente_rfc, concepto, subtotal, iva, total, estado, metodo_pago, fecha_emision, fecha_vencimiento, fecha_pago, created_by, created_at)
      VALUES (${'FAC-' + String(i+1).padStart(4,'0')}, ${randomChoice(ticketIds)}, ${i < cotIds.length ? cotIds[i] : null}, ${randomChoice(clientes)}, ${'RFC' + randomInt(100000,999999) + 'ABC'}, ${randomChoice(['Instalación de fibra óptica','Servicio de cableado estructurado','Sistema de videovigilancia','Mantenimiento de red','Configuración de equipos'])}, ${sub}, ${ivaVal}, ${sub + ivaVal}, ${estado}, ${randomChoice(['transferencia','efectivo','cheque','tarjeta'])}, ${randomDate(new Date('2025-10-01'), new Date('2026-03-10')).toISOString().split('T')[0]}, ${randomDate(new Date('2026-03-01'), new Date('2026-05-30')).toISOString().split('T')[0]}, ${estado === 'pagada' ? randomDate(new Date('2025-10-15'), new Date('2026-03-10')).toISOString().split('T')[0] : null}, ${'fer@netlab.mx'}, ${randomDate(new Date('2025-10-01'), new Date('2026-03-10')).toISOString()})`;
  }
  console.log(`  ✓ 15 facturas creadas`);

  console.log('\n✅ Seed completado! Datos demo insertados.');
}

seed().catch(e => console.error('Error:', e));
