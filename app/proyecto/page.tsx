'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ChevronDown, Layers, Rocket, Shield, AlertTriangle,
  CheckCircle2, Calendar, Server, Monitor, Database, Smartphone,
  Cloud, Lock, Zap, Clock, Target, Users, Truck, DollarSign,
  Wrench, Package, ClipboardList, BarChart3, FolderKanban, FileText
} from 'lucide-react'

/* ─── Data ─── */
const phases = [
  {
    id: 0, title: 'Fase 0', subtitle: 'Arquitectura e Ingeniería Operativa', weeks: '2 semanas', start: 'Semana 1', end: 'Semana 2',
    color: 'from-slate-500 to-zinc-600', border: 'border-slate-500/30', text: 'text-slate-300',
    hito: 'Infraestructura lista y modelo de datos aprobado',
    subs: [
      { name: '0.1 Setup de infraestructura', days: '3 días', items: ['Crear proyecto en Supabase (DB + auth + storage)', 'Repositorio Next.js App Router', 'Deploy automático en Vercel', 'Tailwind CSS + shadcn/ui', 'Ambientes dev/test/prod', 'Sistema de migraciones DB'] },
      { name: '0.2 Modelo de datos', days: '4 días', items: ['Esquema completo PostgreSQL (todas las entidades)', 'Tablas: orgs, sucursales, usuarios, empleados, órdenes, almacenes, inventario, herramientas, activos, vehículos, gastos, traspasos, OC, costos, proyectos, tareas, incidencias, expedientes RH', 'Seguridad a nivel de fila (RLS)', 'Funciones y triggers automáticos', 'Datos de prueba'] },
      { name: '0.3 Mapeo AS-IS del cliente', days: '3 días', items: ['Reunión de levantamiento con Redes Ópticas', 'Documentar flujos de órdenes de servicio', 'Documentar flujos de almacén y herramientas', 'Documentar estructura de sucursales y flotilla', 'Formato de exportación CONTPAQi', 'Validar prioridades del cliente'] },
    ],
    entregables: ['Repositorio funcional con CI/CD', 'Esquema de DB migrado y documentado', 'Documento AS-IS validado', 'Formato CONTPAQi definido'],
  },
  {
    id: 1, title: 'Fase 1', subtitle: 'Core Operativo (MVP)', weeks: '6 semanas', start: 'Semana 3', end: 'Semana 8',
    color: 'from-cyan-500 to-blue-600', border: 'border-cyan-500/30', text: 'text-cyan-300',
    hito: 'Sistema operativo mínimo funcional en producción',
    subs: [
      { name: '1.1 Auth, roles y layout', days: '5 días', items: ['Login, registro, recuperación de contraseña', 'Roles: Admin, Gerente, Supervisor, Instalador, Almacenista', 'Protección de rutas por rol', 'Layout: sidebar, header, navegación', 'Selector de sucursal global', 'Gestión de usuarios y asignación de roles'] },
      { name: '1.2 Órdenes de servicio', days: '8 días', items: ['CRUD completo de órdenes', 'Estados: creada → asignada → en progreso → completada → cerrada', 'Asignación de instaladores', 'Consumo de insumos por orden', 'Evidencias fotográficas', 'Correos al cliente', 'Vista kanban', 'Filtros por sucursal/instalador/fecha/estado', 'Timeline de actividad'] },
      { name: '1.3 Control de almacenes', days: '7 días', items: ['Catálogo de productos e insumos', 'Inventario multi-almacén', 'Entradas de mercancía', 'Salidas vinculadas a órdenes', 'Traspasos entre almacenes', 'OC con flujo de aprobación', 'Alertas de stock mínimo', 'Historial de movimientos', 'Auditoría de almacén'] },
      { name: '1.4 Control de herramientas', days: '5 días', items: ['Catálogo de herramientas', 'Resguardo con firma digital', 'Historial de resguardos', 'Mantenimiento preventivo', 'Registro de mantenimientos', 'Auditoría de herramientas', 'Alertas de mantenimiento próximo'] },
      { name: '1.5 Dashboard operativo', days: '5 días', items: ['KPIs: órdenes activas, completadas, inventario bajo, herramientas en mant.', 'Gráficas por estado, sucursal, instalador', 'Alertas operativas', 'Filtro global por sucursal y fechas', 'Actualizaciones en tiempo real'] },
    ],
    entregables: ['Sistema funcional con auth, órdenes, almacenes, herramientas y dashboard', 'Deploy en producción', 'Capacitación básica al equipo', 'Piloto de 1 semana en una sucursal'],
  },
  {
    id: 2, title: 'Fase 2', subtitle: 'Logística y Flotillas', weeks: '4 semanas', start: 'Semana 9', end: 'Semana 12',
    color: 'from-yellow-500 to-amber-600', border: 'border-yellow-500/30', text: 'text-yellow-300',
    hito: 'Flotilla y activos controlados',
    subs: [
      { name: '2.1 Control de flotillas', days: '8 días', items: ['Expediente vehicular completo', 'Seguros con vencimientos y alertas', 'Mantenimiento preventivo y correctivo', 'Llantas por vehículo con km', 'Control de gasolina (cargas, litros, costo, km/l)', 'Auditorías vehiculares', 'Refrendos con alertas', 'Dashboard de flotilla'] },
      { name: '2.2 Control de activos', days: '4 días', items: ['Catálogo de activos fijos', 'Asignación a sucursal o persona', 'Resguardo con firma digital', 'Mantenimientos', 'Depreciación básica (informativa)'] },
      { name: '2.3 Gestión de sucursales', days: '4 días', items: ['Ficha de sucursal', 'Seguros con vencimientos', 'Contratos asociados', 'Auditorías de sucursal', 'Ventas/ingresos (informativo)', 'Mantenimiento de instalaciones'] },
      { name: '2.4 Integración con Capa 1', days: '4 días', items: ['Vehículos a órdenes de servicio', 'Costo de traslado por orden', 'Activos a sucursal en almacén', 'Dashboards actualizados'] },
    ],
    entregables: ['Módulo de flotillas completo', 'Módulo de activos completo', 'Gestión de sucursales funcional', 'Integración probada con Fase 1'],
  },
  {
    id: 3, title: 'Fase 3', subtitle: 'Control de Costos y RH', weeks: '4 semanas', start: 'Semana 13', end: 'Semana 16',
    color: 'from-emerald-500 to-green-600', border: 'border-emerald-500/30', text: 'text-emerald-300',
    hito: 'Costeo por orden funcional y RH digitalizado',
    subs: [
      { name: '3.1 Costeo por orden', days: '6 días', items: ['Cálculo: insumos + mano de obra + traslado', 'Margen por orden: ingreso vs costo', 'Rentabilidad por orden, sucursal, período', 'Gastos operativos desglosados', 'Alertas de margen negativo'] },
      { name: '3.2 Gastos operativos', days: '4 días', items: ['Registro de gastos no vinculados (renta, servicios, nómina)', 'Categorización de gastos', 'Reporte mensual gastos vs ingresos', 'Exportación CONTPAQi', 'Dashboard financiero operativo'] },
      { name: '3.3 Desarrollo humano', days: '6 días', items: ['Expediente digital de empleados', 'Vacaciones (solicitud, aprobación, saldo)', 'Incidencias laborales', 'Reclutamiento básico', 'Capacitaciones (tema, fecha, asistentes)', 'Organigrama visual'] },
      { name: '3.4 Exportación CONTPAQi', days: '4 días', items: ['Layout validado con contador', 'Generador de conciliación periódica', 'Mapeo de cuentas contables', 'Pruebas con datos reales'] },
    ],
    entregables: ['Costeo por orden funcional', 'Reporte de rentabilidad', 'Módulo de RH completo', 'Exportación validada con CONTPAQi'],
  },
  {
    id: 4, title: 'Fase 4', subtitle: 'Dirección y Estrategia', weeks: '3 semanas', start: 'Semana 17', end: 'Semana 19',
    color: 'from-violet-500 to-purple-600', border: 'border-violet-500/30', text: 'text-violet-300',
    hito: 'Capa directiva funcional',
    subs: [
      { name: '4.1 Proyectos administrativos', days: '5 días', items: ['CRUD de proyectos internos', 'Tareas por proyecto', 'Juntas con minutas', 'Incidencias administrativas', 'Vista kanban de tareas', 'Calendario de juntas'] },
      { name: '4.2 Planeación estratégica', days: '4 días', items: ['Organigrama dinámico desde RH', 'Perfiles de puesto editables', 'Repositorio de procedimientos', 'Repositorio de políticas', 'Versionamiento de documentos'] },
      { name: '4.3 Dashboards directivos', days: '6 días', items: ['Dashboard ejecutivo con KPIs clave', 'Comparativos por período', 'Desglose por sucursal', 'Reportes PDF/Excel', 'Alertas críticas consolidada', 'Productividad por instalador'] },
    ],
    entregables: ['Módulo de proyectos administrativos', 'Sección de planeación estratégica', 'Dashboards directivos con todos los KPIs'],
  },
  {
    id: 5, title: 'Fase 5', subtitle: 'App Móvil / Campo (PWA)', weeks: '3 semanas', start: 'Semana 20', end: 'Semana 22',
    color: 'from-rose-500 to-pink-600', border: 'border-rose-500/30', text: 'text-rose-300',
    hito: 'Instaladores operando desde PWA',
    subs: [
      { name: '5.1 PWA base', days: '5 días', items: ['Manifest y service worker', 'Layout móvil optimizado', 'Login y sesión persistente', 'Navegación simplificada', 'Cache offline básico'] },
      { name: '5.2 Órdenes en campo', days: '6 días', items: ['Ver órdenes asignadas', 'Cambiar estado desde campo', 'Consumo de insumos', 'Evidencias desde cámara nativa', 'Firma digital del cliente', 'Notas de campo'] },
      { name: '5.3 Herramientas y sync', days: '4 días', items: ['Ver herramientas asignadas', 'Reportar incidencia', 'Sincronización automática', 'Notificaciones push'] },
    ],
    entregables: ['PWA instalable en Android e iOS', 'Instaladores operando desde celular', 'Evaluación post-implementación sobre app nativa'],
  },
]

const layers = [
  { name: 'Capa 1 — Operativa (Core)', modules: 'Órdenes, almacenes, herramientas, activos, auth/roles, dashboard, multi-sucursal', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', icon: ClipboardList },
  { name: 'Capa 2 — Logística', modules: 'Flotillas vehiculares, gestión de sucursales, auditorías, traspasos', color: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30', icon: Truck },
  { name: 'Capa 3 — Control de costos y personas', modules: 'Costeo por orden, gastos operativos, exportación CONTPAQi, RH', color: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', icon: DollarSign },
  { name: 'Capa 4 — Dirección y estrategia', modules: 'Proyectos, planeación estratégica, dashboards directivos, KPIs', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30', icon: BarChart3 },
  { name: 'Capa 5 — Campo', modules: 'PWA: órdenes, evidencias, consumo de insumos', color: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30', icon: Smartphone },
]

const risks = [
  { risk: 'Scope creep (11 módulos)', impact: 'Crítico', mitigation: 'Fases cerradas, actas de cambio formales', color: 'text-red-400' },
  { risk: 'Adopción por instaladores', impact: 'Alto', mitigation: 'UX simple, PWA, capacitación presencial', color: 'text-orange-400' },
  { risk: 'Regulaciones tiendas de apps', impact: 'Medio', mitigation: 'PWA primero, evaluar app nativa después', color: 'text-yellow-400' },
  { risk: 'Conciliación CONTPAQi', impact: 'Medio', mitigation: 'Definir formato en Fase 0 con el contador', color: 'text-yellow-400' },
  { risk: 'Dependencia de personas clave', impact: 'Medio', mitigation: 'Documentación y procesos estandarizados', color: 'text-yellow-400' },
  { risk: 'Cambios de requerimiento', impact: 'Alto', mitigation: 'Scope duro por fase, actas de cambio', color: 'text-orange-400' },
]

const principles = [
  { icon: Layers, title: 'Fases cerradas', desc: 'Cada fase tiene alcance propio y no obliga a ejecutar la siguiente.' },
  { icon: Rocket, title: 'MVP primero', desc: 'La Fase 1 entrega valor operativo real desde el día uno.' },
  { icon: Shield, title: 'Sin scope creep', desc: 'Toda solicitud nueva se gestiona mediante Acta de Cambio formal.' },
  { icon: Smartphone, title: 'PWA antes que nativa', desc: 'Se prioriza Progressive Web App por compatibilidad.' },
  { icon: DollarSign, title: 'Contabilidad fuera de scope', desc: 'El sistema mide costos operativos; la contabilidad formal se mantiene en CONTPAQi.' },
  { icon: Target, title: 'Validación en campo', desc: 'Cada módulo se prueba en operación real antes de escalar.' },
]

const frontend = [
  { comp: 'Framework', tech: 'Next.js (App Router)', fn: 'Interfaz web moderna, rápida y responsive', icon: Monitor },
  { comp: 'UI / Diseño', tech: 'Tailwind CSS + shadcn/ui', fn: 'Interfaz profesional, consistente y accesible', icon: FileText },
  { comp: 'App Móvil', tech: 'PWA', fn: 'Acceso desde celular sin descargar app', icon: Smartphone },
  { comp: 'Deploy', tech: 'Vercel', fn: 'Despliegue automático, HTTPS, CDN global', icon: Cloud },
]
const backend = [
  { comp: 'Servidor API', tech: 'Express.js (Node.js)', fn: 'API REST centralizada', icon: Server },
  { comp: 'Base de datos', tech: 'PostgreSQL (Supabase)', fn: 'Almacenamiento relacional con RLS', icon: Database },
  { comp: 'Autenticación', tech: 'Supabase Auth', fn: 'Login seguro, roles, recuperación', icon: Lock },
  { comp: 'Almacenamiento', tech: 'Supabase Storage', fn: 'Fotos, evidencias, documentos', icon: Package },
  { comp: 'Tiempo real', tech: 'Supabase Realtime', fn: 'Actualizaciones en vivo', icon: Zap },
]

/* ─── Components ─── */
function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <motion.section id={id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.4 }} className="scroll-mt-8">{children}</motion.section>
}

function PhaseCard({ phase }: { phase: typeof phases[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border ${phase.border} rounded-2xl overflow-hidden bg-zinc-900/40`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left p-5 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg`}>{phase.title.split(' ')[1]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white">{phase.title} — {phase.subtitle}</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-slate-400 border border-slate-700">{phase.weeks}</span>
          </div>
          <p className={`text-xs ${phase.text} mt-0.5`}>🎯 {phase.hito}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{phase.start} → {phase.end} · {phase.subs.length} subfases</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4 border-t border-slate-800/50 pt-4">
              {phase.subs.map((s, i) => (
                <div key={i} className="bg-zinc-800/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-200">{s.name}</h4>
                    <span className="text-[10px] text-slate-500 bg-zinc-800 px-2 py-0.5 rounded-full">{s.days}</span>
                  </div>
                  <ul className="space-y-1">
                    {s.items.map((item, j) => (
                      <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-slate-600 mt-0.5">•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Entregables</h4>
                <ul className="space-y-1">
                  {phase.entregables.map((e, i) => (
                    <li key={i} className="text-xs text-emerald-300/80 flex items-start gap-2"><CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Page ─── */
export default function ProyectoPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 py-8 px-4 sm:px-6">
      {/* ── Header ── */}
      <Section id="header">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-sky-500/20">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Scope Charter</h1>
            <p className="text-sm text-slate-500 mt-1">ERP a Medida · <span className="text-sky-400">Frabe</span></p>
          </div>
          <div className="flex justify-center gap-6 text-xs text-slate-500">
            <span>📄 Cliente: <span className="text-slate-300">Redes Ópticas</span></span>
            <span>📅 Fecha: <span className="text-slate-300">20 marzo 2026</span></span>
            <span>🔒 Estado: <span className="text-amber-400">Pendiente de arranque</span></span>
          </div>
          <p className="text-[10px] text-slate-600 italic">Documento confidencial — Preparado exclusivamente para Redes Ópticas</p>
        </div>
      </Section>

      {/* ── 1. Declaración ── */}
      <Section id="declaracion">
        <div className="bg-zinc-900/60 border border-slate-800/50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-sky-400" /> 1. Propósito del Sistema</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">El sistema ERP Frabe es un sistema de gestión empresarial diseñado y desarrollado a medida para Redes Ópticas. Su objetivo es digitalizar y estructurar la operación completa de la empresa.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {['Controlar órdenes de servicio de punta a punta', 'Trazabilidad de herramientas, activos y almacenes', 'Gestión integral de flotilla vehicular', 'Costos operativos reales por servicio', 'Conciliación con CONTPAQi', 'Operación multi-sucursal', 'Acceso móvil para instaladores'].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-sky-500/5 border border-sky-500/10 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-3 w-3 text-sky-400 mt-0.5 shrink-0" />{item}
              </div>
            ))}
          </div>
          <div className="mt-4 bg-sky-500/5 border border-sky-500/20 rounded-xl p-4">
            <p className="text-xs text-sky-300 italic font-medium">💡 Este no es un proyecto de instalación de software. Es la construcción de un sistema operativo digital para una empresa de instalaciones IT con operación en campo.</p>
          </div>
        </div>
      </Section>

      {/* ── 2. Stack ── */}
      <Section id="stack">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Server className="h-5 w-5 text-green-400" /> 2. Stack Tecnológico</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Frontend (Interfaz de usuario)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {frontend.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3 hover:border-cyan-500/30 transition-colors">
                  <t.icon className="h-4 w-4 text-cyan-400 mb-2" />
                  <p className="text-xs font-semibold text-white">{t.tech}</p>
                  <p className="text-[10px] text-slate-500">{t.comp}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{t.fn}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Backend (Lógica de negocio y API)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {backend.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3 hover:border-emerald-500/30 transition-colors">
                  <t.icon className="h-4 w-4 text-emerald-400 mb-2" />
                  <p className="text-xs font-semibold text-white">{t.tech}</p>
                  <p className="text-[10px] text-slate-500">{t.comp}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{t.fn}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-slate-800/50 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-1">¿Por qué un backend dedicado con Express?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Toda la lógica de negocio — validaciones, cálculos de costos, flujos de aprobación, generación de reportes y exportaciones — vive en un solo lugar controlado y seguro. Facilita mantenimiento, escalabilidad e integración con servicios externos como CONTPAQi.</p>
          </div>
        </div>
      </Section>

      {/* ── 3. Principios ── */}
      <Section id="principios">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-amber-400" /> 3. Principios Rectores</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {principles.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-amber-500/20 transition-colors">
              <p.icon className="h-5 w-5 text-amber-400 mb-2" />
              <p className="text-sm font-semibold text-white mb-1">{p.title}</p>
              <p className="text-xs text-slate-400">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 4. Arquitectura ── */}
      <Section id="arquitectura">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Layers className="h-5 w-5 text-purple-400" /> 4. Arquitectura del Sistema</h2>
        <p className="text-sm text-slate-400 mb-4">5 capas funcionales que se construyen de forma progresiva:</p>
        <div className="space-y-2">
          {layers.map((l, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`bg-gradient-to-r ${l.color} border ${l.border} rounded-xl p-4 flex items-center gap-4`}>
              <l.icon className="h-6 w-6 text-white/80 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">{l.name}</p>
                <p className="text-xs text-slate-300/80">{l.modules}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 5. Fases ── */}
      <Section id="fases">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FolderKanban className="h-5 w-5 text-cyan-400" /> 5. Fases del Proyecto</h2>
        <p className="text-sm text-slate-400 mb-4">Clickea cada fase para ver los detalles y entregables:</p>
        <div className="space-y-3">
          {phases.map(p => <PhaseCard key={p.id} phase={p} />)}
        </div>
      </Section>

      {/* ── 6. Timeline ── */}
      <Section id="timeline">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-indigo-400" /> 6. Timeline Consolidado</h2>
        <div className="bg-zinc-900/60 border border-slate-800/50 rounded-2xl p-5 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header */}
            <div className="flex items-center gap-1 mb-3 text-[9px] text-slate-600 uppercase tracking-widest">
              <div className="w-40 shrink-0">Fase</div>
              <div className="flex-1 flex">{Array.from({ length: 22 }, (_, i) => (<div key={i} className="flex-1 text-center">S{i + 1}</div>))}</div>
            </div>
            {/* Bars */}
            {phases.map((p, i) => {
              const start = parseInt(p.start.replace('Semana ', '')) - 1
              const end = parseInt(p.end.replace('Semana ', ''))
              const total = 22
              return (
                <div key={i} className="flex items-center gap-1 mb-2">
                  <div className="w-40 shrink-0 text-xs text-slate-400 truncate">{p.title} · {p.subtitle}</div>
                  <div className="flex-1 flex h-7 relative">
                    <div style={{ marginLeft: `${(start / total) * 100}%`, width: `${((end - start) / total) * 100}%` }}
                      className={`bg-gradient-to-r ${p.color} rounded-lg h-full flex items-center justify-center`}>
                      <span className="text-[10px] text-white font-bold">{p.weeks}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-800">
              <div className="w-40 shrink-0 text-xs font-bold text-white">Total</div>
              <div className="flex-1"><p className="text-xs text-slate-400"><span className="text-white font-bold">22 semanas</span> · ~5.5 meses · 1 programador senior full-stack</p></div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 7. Gobierno ── */}
      <Section id="gobierno">
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-amber-400" /> 7. Gobierno del Proyecto</h2>
          <p className="text-sm text-slate-400 mb-4">Toda nueva solicitud fuera de este documento requiere:</p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {['1. Registrar como Acta de Cambio', '2. Evaluar impacto técnico', '3. Evaluar impacto económico', '4. Ajustar Scope Charter', '5. Aprobación formal'].map((s, i) => (
              <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-300 font-medium">{s}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-400/60 mt-3 text-center italic">Sin estos pasos, la solicitud no se ejecuta.</p>
        </div>
      </Section>

      {/* ── 8. Riesgos ── */}
      <Section id="riesgos">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-400" /> 8. Riesgos y Mitigación</h2>
        <div className="bg-zinc-900/60 border border-slate-800/50 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase">
              <th className="px-5 py-3">Riesgo</th><th className="px-5 py-3">Impacto</th><th className="px-5 py-3">Mitigación</th>
            </tr></thead>
            <tbody>{risks.map((r, i) => (
              <tr key={i} className="border-b border-slate-800/30 hover:bg-zinc-800/30">
                <td className="px-5 py-3 text-slate-300 text-xs">{r.risk}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${r.color} bg-current/10`} style={{backgroundColor: 'transparent'}}>{r.impact}</span></td>
                <td className="px-5 py-3 text-slate-400 text-xs">{r.mitigation}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      {/* ── 9. Criterios de éxito ── */}
      <Section id="exito">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> 9. Criterios de Éxito por Fase</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { fase: 'Fase 0', criterio: 'Infraestructura desplegada, DB migrada, AS-IS aprobado' },
            { fase: 'Fase 1', criterio: 'Órdenes en uso real, almacén controlado, herramientas con resguardo' },
            { fase: 'Fase 2', criterio: 'Flotilla registrada, gastos vehiculares visibles, activos asignados' },
            { fase: 'Fase 3', criterio: 'Costo real por orden visible, CONTPAQi validada, expedientes RH' },
            { fase: 'Fase 4', criterio: 'Dashboard directivo funcional, proyectos administrativos en uso' },
            { fase: 'Fase 5', criterio: 'Instaladores usando PWA en campo, evidencias desde celular' },
          ].map((c, i) => (
            <div key={i} className={`border ${phases[i].border} rounded-xl p-4 bg-zinc-900/40`}>
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${phases[i].color} flex items-center justify-center text-white font-bold text-xs mb-2`}>{i}</div>
              <p className="text-xs font-semibold text-white mb-1">{c.fase}</p>
              <p className="text-xs text-slate-400">{c.criterio}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 10. Hosting ── */}
      <Section id="hosting">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Cloud className="h-5 w-5 text-blue-400" /> 10. Infraestructura y Hosting</h2>
        <p className="text-sm text-slate-400 mb-4">Los costos de hosting son independientes al desarrollo y son responsabilidad del cliente a partir del Go-Live.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-5">
            <Database className="h-6 w-6 text-emerald-400 mb-2" />
            <p className="text-sm font-bold text-white">Supabase Pro</p>
            <p className="text-xs text-slate-400 mt-1">Base de datos PostgreSQL, autenticación, almacenamiento de archivos, tiempo real</p>
          </div>
          <div className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-5">
            <Cloud className="h-6 w-6 text-blue-400 mb-2" />
            <p className="text-sm font-bold text-white">Vercel Pro</p>
            <p className="text-xs text-slate-400 mt-1">Hosting del frontend, despliegue automático, certificado HTTPS, CDN global</p>
          </div>
        </div>
      </Section>

      {/* ── 11. Próximos pasos ── */}
      <Section id="pasos">
        <div className="bg-gradient-to-br from-sky-500/10 to-blue-600/10 border border-sky-500/30 rounded-2xl p-6 text-center">
          <Rocket className="h-8 w-8 text-sky-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-3">11. Próximos Pasos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto mb-4">
            {['Aprobación comercial del proyecto', 'Definición de fecha de arranque Fase 0', 'Asignación del programador principal', 'Reunión de levantamiento AS-IS'].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-2.5">
                <Clock className="h-3 w-3 shrink-0" />{s}
              </div>
            ))}
          </div>
          <p className="text-xs text-sky-300/60 italic">Este Scope Charter habilita la ejecución del proyecto una vez aprobado comercialmente.</p>
        </div>
      </Section>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-slate-600">Frabe ERP v1.0 · Scope Charter · Redes Ópticas · Powered by <span className="text-cyan-400/50">Netlab</span></p>
      </div>
    </div>
  )
}
