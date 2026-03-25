'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

type TourStep = {
  target?: string
  title: string
  description: string
  page?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const tourSteps: TourStep[] = [
  { title: '¡Bienvenido a Frabe ERP! 🚀', description: 'Este es el sistema ERP de Redes Ópticas. Te haremos un recorrido rápido por todos los módulos del sistema.', position: 'center' },
  { page: '/', target: '[data-tour="dashboard-kpis"]', title: '📊 Dashboard Operativo', description: 'Vista general con KPIs en tiempo real: órdenes activas, ingresos, costos, inventario y más.', position: 'bottom' },
  { page: '/ordenes', target: '[data-tour="ordenes-list"]', title: '📋 Órdenes de Servicio', description: 'Gestión completa de órdenes: crea, filtra por estado/tipo/sucursal. Flujo: Creada → Asignada → En Progreso → Completada.', position: 'bottom' },
  { page: '/almacenes', target: '[data-tour="almacenes-stats"]', title: '🏢 Almacenes e Inventario', description: 'Control multi-almacén con stock en tiempo real, alertas de bajo inventario, movimientos y análisis de valor.', position: 'bottom' },
  { page: '/herramientas', target: '[data-tour="herramientas-grid"]', title: '🔧 Control de Herramientas', description: 'Registro con resguardos activos. Cada herramienta tiene serie, costo, estado. Asigna, manda a mantenimiento o da de baja.', position: 'bottom' },
  { page: '/flotillas', target: '[data-tour="flotillas-grid"]', title: '🚛 Gestión de Flotilla', description: 'Expediente de vehículos: km, mantenimientos, combustible, multas, alertas de seguro/verificación.', position: 'bottom' },
  { page: '/costos', target: '[data-tour="costos-summary"]', title: '💰 Control de Costos', description: 'Gastos operativos por categoría y costeo por orden de servicio (materiales, mano de obra, traslado).', position: 'bottom' },
  { page: '/rh', target: '[data-tour="rh-tabs"]', title: '👥 Recursos Humanos', description: 'Empleados, vacaciones, incidencias laborales, y registro de capacitaciones con asistencia.', position: 'bottom' },
  { page: '/compras', target: '[data-tour="compras-list"]', title: '🛒 Órdenes de Compra', description: 'Crea OC con items, envía para aprobación, y registra recepciones. Desglose con IVA.', position: 'bottom' },
  { page: '/activos', target: '[data-tour="activos-grid"]', title: '📦 Activos Fijos', description: 'Equipos de cómputo, networking, mobiliario. Valor total, fecha adquisición y asignación.', position: 'bottom' },
  { page: '/proyectos', target: '[data-tour="proyectos-tabs"]', title: '📁 Proyectos y Tareas', description: 'Proyectos administrativos con tareas, progreso con barra, y registro de juntas.', position: 'bottom' },
  { page: '/directivo', target: '[data-tour="directivo-financial"]', title: '📈 Dashboard Directivo', description: 'Ingresos vs costos, margen bruto, rendimiento por sucursal, tendencia mensual, top técnicos.', position: 'bottom' },
  { page: '/tecnico', target: '[data-tour="tecnico-orders"]', title: '👷 Portal del Técnico', description: 'Órdenes asignadas por prioridad, datos de cliente con teléfono, herramientas en resguardo.', position: 'bottom' },
  { title: '✅ ¡Tour completado!', description: 'Ya conoces los módulos principales de Frabe ERP.\n\n¡Explora libremente!', position: 'center' },
]

export default function ProductTour() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [ready, setReady] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    if (localStorage.getItem('frabe-tour') === 'pending') {
      localStorage.removeItem('frabe-tour')
      // Small delay to let the dashboard load
      setTimeout(() => { setActive(true); setStep(0) }, 800)
    }
  }, [])

  const currentStep = tourSteps[step]

  const cleanup = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }, [])

  // Poll for target element (handles async page loads)
  const pollForTarget = useCallback(() => {
    cleanup()
    if (!currentStep?.target) {
      setTargetRect(null)
      setReady(true)
      return
    }

    let attempts = 0
    const maxAttempts = 30 // 30 * 200ms = 6 seconds max wait

    pollRef.current = setInterval(() => {
      attempts++
      const el = document.querySelector(currentStep.target!)
      if (el) {
        cleanup()
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        timeoutRef.current = setTimeout(() => {
          const rect = el.getBoundingClientRect()
          setTargetRect(rect)
          setReady(true)
          setNavigating(false)
        }, 500)
      } else if (attempts >= maxAttempts) {
        cleanup()
        // Target not found — show centered tooltip
        setTargetRect(null)
        setReady(true)
        setNavigating(false)
      }
    }, 200)
  }, [currentStep, cleanup])

  // Handle step changes
  useEffect(() => {
    if (!active) return
    setReady(false)
    setTargetRect(null)

    const needsNav = currentStep?.page && pathname !== currentStep.page
    if (needsNav) {
      setNavigating(true)
      router.push(currentStep.page!)
    } else {
      // Already on correct page, poll for element
      timeoutRef.current = setTimeout(() => pollForTarget(), 200)
    }

    return cleanup
  }, [active, step]) // eslint-disable-line react-hooks/exhaustive-deps

  // When pathname changes (navigation completed), start polling
  useEffect(() => {
    if (!active || !navigating) return
    if (currentStep?.page === pathname) {
      // Navigation is done, now wait for page to render
      timeoutRef.current = setTimeout(() => pollForTarget(), 300)
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update rect on scroll/resize
  useEffect(() => {
    if (!active || !targetRect) return
    const update = () => {
      if (!currentStep?.target) return
      const el = document.querySelector(currentStep.target)
      if (el) setTargetRect(el.getBoundingClientRect())
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
  }, [active, targetRect, currentStep])

  const next = () => { if (step < tourSteps.length - 1) setStep(s => s + 1); else closeTour() }
  const prev = () => { if (step > 0) setStep(s => s - 1) }
  const closeTour = () => { cleanup(); setActive(false); setStep(0); setTargetRect(null); setNavigating(false) }
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
  const pad = 12

  // Tooltip position
  let tooltipStyle: React.CSSProperties = {}
  if (!isCenter && targetRect) {
    const left = Math.min(Math.max(16, targetRect.left + targetRect.width / 2 - 180), window.innerWidth - 376)
    if (currentStep?.position === 'bottom' || !currentStep?.position) {
      tooltipStyle = { position: 'fixed', top: Math.min(targetRect.bottom + pad, window.innerHeight - 250), left }
    } else if (currentStep?.position === 'top') {
      tooltipStyle = { position: 'fixed', bottom: window.innerHeight - targetRect.top + pad, left }
    }
  } else {
    tooltipStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  // Cutout dimensions
  const cx = targetRect ? targetRect.left - 8 : 0
  const cy = targetRect ? targetRect.top - 8 : 0
  const cw = targetRect ? targetRect.width + 16 : 0
  const ch = targetRect ? targetRect.height + 16 : 0

  return (
    <>
      {/* Overlay — pointer-events:none so page underneath still works */}
      <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: 'none' }}>
        <AnimatePresence>
          {ready && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              {targetRect ? (
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <mask id={`tour-mask-${step}`}>
                      <rect x="0" y="0" width="100%" height="100%" fill="white" />
                      <rect x={cx} y={cy} width={cw} height={ch} rx="12" fill="black" />
                    </mask>
                  </defs>
                  <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask={`url(#tour-mask-${step})`} />
                  <rect x={cx} y={cy} width={cw} height={ch} rx="12"
                    fill="none" stroke="rgba(139,92,246,0.6)" strokeWidth="2">
                    <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                  </rect>
                </svg>
              ) : (
                <div className="w-full h-full bg-black/70" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tooltip — has pointer-events so buttons work */}
      <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'none' }}>
        <AnimatePresence mode="wait">
          {ready && (
            <motion.div key={step}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              style={{ ...tooltipStyle, pointerEvents: 'auto' }}
              className="w-[360px] bg-[#1a1b26] border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-500/10 p-5">

              <button onClick={closeTour} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>

              {/* Progress bar */}
              <div className="flex gap-0.5 mb-3">
                {tourSteps.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-violet-500' : 'bg-slate-700/50'}`} />
                ))}
              </div>

              <h3 className="text-base font-bold text-white mb-2 pr-6">{currentStep?.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{currentStep?.description}</p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-600 tabular-nums">{step + 1} / {tourSteps.length}</span>
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
          )}
        </AnimatePresence>
      </div>

      {/* Loading indicator during navigation */}
      {navigating && !ready && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
          <div className="h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </>
  )
}
