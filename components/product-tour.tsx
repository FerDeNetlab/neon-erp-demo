'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

type TourStep = {
  target?: string        // CSS selector
  title: string
  description: string
  page?: string           // Navigate to this page before showing
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  spotlight?: boolean     // Default true
}

const tourSteps: TourStep[] = [
  // ── Welcome ──
  { title: '¡Bienvenido a Frabe ERP! 🚀', description: 'Este es el sistema ERP de Redes Ópticas. Te haremos un recorrido rápido por todos los módulos del sistema.', position: 'center', spotlight: false },

  // ── Dashboard ──
  { page: '/', target: '[data-tour="dashboard-kpis"]', title: '📊 Dashboard Operativo', description: 'Vista general con KPIs en tiempo real: órdenes activas, ingresos, costos, inventario y más. Aquí puedes ver el estado de toda la operación de un vistazo.', position: 'bottom' },

  // ── Órdenes ──
  { page: '/ordenes', target: '[data-tour="ordenes-list"]', title: '📋 Órdenes de Servicio', description: 'Gestión completa de órdenes: crea, filtra por estado/tipo/sucursal, busca por cliente. Cada orden tiene su flujo de estados: Creada → Asignada → En Progreso → Completada.', position: 'bottom' },

  // ── Almacenes ──
  { page: '/almacenes', target: '[data-tour="almacenes-stats"]', title: '🏢 Almacenes e Inventario', description: 'Control multi-almacén con stock en tiempo real, alertas de bajo inventario, movimientos (entradas, salidas, traspasos) y análisis de valor por categoría.', position: 'bottom' },

  // ── Herramientas ──
  { page: '/herramientas', target: '[data-tour="herramientas-grid"]', title: '🔧 Control de Herramientas', description: 'Registro de herramientas con resguardos activos. Cada herramienta tiene serie, costo, y estado. Puedes asignar, enviar a mantenimiento o dar de baja.', position: 'bottom' },

  // ── Flotillas ──
  { page: '/flotillas', target: '[data-tour="flotillas-grid"]', title: '🚛 Gestión de Flotilla', description: 'Expediente completo de cada vehículo: kilometraje, mantenimientos, cargas de combustible, multas, y alertas de seguro/verificación por vencer.', position: 'bottom' },

  // ── Costos ──
  { page: '/costos', target: '[data-tour="costos-summary"]', title: '💰 Control de Costos', description: 'Visibilidad de gastos operativos por categoría (renta, nómina, servicios) y costeo por orden de servicio (materiales, mano de obra, traslado).', position: 'bottom' },

  // ── RH ──
  { page: '/rh', target: '[data-tour="rh-tabs"]', title: '👥 Recursos Humanos', description: 'Gestión de personal: directorio de empleados, solicitudes de vacaciones, incidencias laborales, y registro de capacitaciones con asistencia.', position: 'bottom' },

  // ── Compras ──
  { page: '/compras', target: '[data-tour="compras-list"]', title: '🛒 Órdenes de Compra', description: 'Flujo de compras: crea OC con items detallados, envía para aprobación, y registra recepciones. Cada OC muestra desglose de partidas con IVA.', position: 'bottom' },

  // ── Activos ──
  { page: '/activos', target: '[data-tour="activos-grid"]', title: '📦 Activos Fijos', description: 'Registro de activos de la empresa: equipos de cómputo, networking, mobiliario. Con valor total, fecha de adquisición y asignación por usuario.', position: 'bottom' },

  // ── Proyectos ──
  { page: '/proyectos', target: '[data-tour="proyectos-tabs"]', title: '📁 Proyectos y Tareas', description: 'Gestión de proyectos administrativos con tareas asignables, progreso con barra, y registro de juntas con acta y ubicación.', position: 'bottom' },

  // ── Directivo ──
  { page: '/directivo', target: '[data-tour="directivo-financial"]', title: '📈 Dashboard Directivo', description: 'Vista ejecutiva: ingresos vs costos, margen bruto, rendimiento por sucursal, tendencia mensual, top técnicos, y alertas de acciones pendientes.', position: 'bottom' },

  // ── Portal Técnico ──
  { page: '/tecnico', target: '[data-tour="tecnico-orders"]', title: '👷 Portal del Técnico', description: 'Lo que ve un instalador al entrar: sus órdenes asignadas por prioridad, datos de cliente con teléfono para llamar, y herramientas en resguardo.', position: 'bottom' },

  // ── Finish ──
  { title: '✅ ¡Tour completado!', description: 'Ya conoces los módulos principales de Frabe ERP. El sistema está diseñado para gestionar la operación completa de Redes Ópticas: desde la orden de servicio hasta la conciliación de costos.\n\n¡Explora libremente!', position: 'center', spotlight: false },
]

export default function ProductTour() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [ready, setReady] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    const flag = localStorage.getItem('frabe-tour')
    if (flag === 'pending') {
      localStorage.removeItem('frabe-tour')
      setActive(true)
      setStep(0)
    }
  }, [])

  const currentStep = tourSteps[step]

  const findTarget = useCallback(() => {
    if (!currentStep?.target) { setTargetRect(null); setReady(true); return }
    const el = document.querySelector(currentStep.target)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
        setReady(true)
      }, 400)
    } else {
      setTargetRect(null)
      setReady(true)
    }
  }, [currentStep])

  useEffect(() => {
    if (!active) return
    setReady(false)

    if (currentStep?.page && pathname !== currentStep.page) {
      router.push(currentStep.page)
      // Wait for navigation
      timeoutRef.current = setTimeout(() => findTarget(), 1200)
    } else {
      timeoutRef.current = setTimeout(() => findTarget(), 300)
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [active, step, pathname, currentStep, findTarget, router])

  const next = () => { if (step < tourSteps.length - 1) setStep(s => s + 1); else closeTour() }
  const prev = () => { if (step > 0) setStep(s => s - 1) }
  const closeTour = () => { setActive(false); setStep(0); setTargetRect(null) }
  const startTour = () => { setActive(true); setStep(0) }

  if (!active) {
    return (
      <button onClick={startTour} title="Iniciar Tour"
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center hover:scale-110 transition-transform group">
        <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
      </button>
    )
  }

  const isCenter = currentStep?.position === 'center' || !targetRect

  // Tooltip positioning
  let tooltipStyle: React.CSSProperties = {}
  if (!isCenter && targetRect) {
    const pad = 16
    if (currentStep?.position === 'bottom' || !currentStep?.position) {
      tooltipStyle = { top: targetRect.bottom + pad, left: Math.max(16, targetRect.left + targetRect.width / 2 - 180) }
    } else if (currentStep?.position === 'top') {
      tooltipStyle = { bottom: window.innerHeight - targetRect.top + pad, left: Math.max(16, targetRect.left + targetRect.width / 2 - 180) }
    } else if (currentStep?.position === 'right') {
      tooltipStyle = { top: targetRect.top, left: targetRect.right + pad }
    } else if (currentStep?.position === 'left') {
      tooltipStyle = { top: targetRect.top, right: window.innerWidth - targetRect.left + pad }
    }
  }

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[9999]">
          {/* Overlay */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
            {targetRect && currentStep?.spotlight !== false ? (
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <mask id="spotlight-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <rect x={targetRect.left - 8} y={targetRect.top - 8} width={targetRect.width + 16} height={targetRect.height + 16} rx="12" fill="black" />
                  </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
                {/* Glow ring */}
                <rect x={targetRect.left - 8} y={targetRect.top - 8} width={targetRect.width + 16} height={targetRect.height + 16} rx="12"
                  fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="2" className="animate-pulse" />
              </svg>
            ) : (
              <div className="w-full h-full bg-black/75" />
            )}
          </motion.div>

          {/* Tooltip */}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 10 }} exit={{ opacity: 0, y: -10 }}
              style={isCenter ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : { ...tooltipStyle, position: 'absolute' }}
              className={`${isCenter ? 'fixed' : 'absolute'} w-[360px] bg-[#1a1b26] border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-500/10 p-5 z-10`}>

              {/* Close X */}
              <button onClick={closeTour} className="absolute top-3 right-3 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>

              {/* Step indicator */}
              <div className="flex gap-1 mb-3">
                {tourSteps.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-violet-500' : 'bg-slate-700'}`} />
                ))}
              </div>

              <h3 className="text-base font-bold text-white mb-2">{currentStep?.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{currentStep?.description}</p>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-600">{step + 1} / {tourSteps.length}</span>
                <div className="flex gap-2">
                  {step > 0 && (
                    <button onClick={prev} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors">
                      <ChevronLeft className="h-3 w-3" /> Anterior
                    </button>
                  )}
                  <button onClick={next}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium">
                    {step < tourSteps.length - 1 ? (<>Siguiente <ChevronRight className="h-3 w-3" /></>) : '¡Empezar!'}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  )
}
