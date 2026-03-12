'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, ArrowLeft, Loader2, Fuel, Settings, AlertTriangle, Plus, X,
  Gauge, Calendar, DollarSign, Wrench
} from 'lucide-react'
import Link from 'next/link'

type VehiculoDetail = {
  id: string; placa: string; marca: string; modelo: string; anio: number; color: string
  tipo: string; estado: string; conductor_nombre: string; km_actual: number; notas: string
  mantenimientos: Array<{ id: string; tipo: string; descripcion: string; km_mantenimiento: number; costo: number; taller: string; fecha: string; proximo_mantenimiento_fecha: string }>
  combustible: Array<{ id: string; litros: number; costo_total: number; km_carga: number; gasolinera: string; fecha: string }>
  multas: Array<{ id: string; fecha: string; monto: number; motivo: string; estado: string }>
}

type TabType = 'resumen' | 'mantenimiento' | 'combustible' | 'multas'

export default function VehiculoDetailPage() {
  const { id } = useParams()
  const [vehiculo, setVehiculo] = useState<VehiculoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>('resumen')
  const [showAddModal, setShowAddModal] = useState<string | null>(null) // 'mantenimiento' | 'combustible' | 'multa'
  const [creating, setCreating] = useState(false)

  const [mantForm, setMantForm] = useState({ tipo: 'preventivo', descripcion: '', km_mantenimiento: '', costo: '', taller: '', fecha: '', proximo_mantenimiento_fecha: '' })
  const [combForm, setCombForm] = useState({ litros: '', costo_total: '', km_carga: '', gasolinera: '', fecha: '' })
  const [multaForm, setMultaForm] = useState({ fecha: '', monto: '', motivo: '' })

  const fetchVehiculo = useCallback(async () => {
    try { const res = await fetch(`/api/flota/${id}`); const data = await res.json(); setVehiculo(data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [id])
  useEffect(() => { fetchVehiculo() }, [fetchVehiculo])

  const addRecord = async (type: string, body: Record<string, unknown>) => {
    setCreating(true)
    try {
      const res = await fetch(`/api/flota/${id}/records?type=${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setShowAddModal(null); fetchVehiculo() }
    } finally { setCreating(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-yellow-400" /></div>
  if (!vehiculo) return <div className="text-center py-20 text-slate-400">Vehículo no encontrado</div>

  const tabs: { key: TabType; label: string; icon: typeof Truck; count?: number }[] = [
    { key: 'resumen', label: 'Resumen', icon: Truck },
    { key: 'mantenimiento', label: 'Mantenimientos', icon: Wrench, count: vehiculo.mantenimientos?.length },
    { key: 'combustible', label: 'Combustible', icon: Fuel, count: vehiculo.combustible?.length },
    { key: 'multas', label: 'Multas', icon: AlertTriangle, count: vehiculo.multas?.length },
  ]

  const totalCombustible = vehiculo.combustible?.reduce((sum, c) => sum + Number(c.costo_total || 0), 0) || 0
  const totalMantenimiento = vehiculo.mantenimientos?.reduce((sum, m) => sum + Number(m.costo || 0), 0) || 0
  const totalMultas = vehiculo.multas?.reduce((sum, m) => sum + Number(m.monto || 0), 0) || 0

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/flota" className="text-sm text-slate-500 hover:text-yellow-400 transition-colors flex items-center gap-1 mb-3"><ArrowLeft className="h-4 w-4" /> Volver a Flota</Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-yellow-400/10 border border-yellow-500/20"><Truck className="h-6 w-6 text-yellow-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-yellow-400 font-mono">{vehiculo.placa}</h1>
            <p className="text-sm text-slate-400">{[vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(' ')} • {vehiculo.tipo}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-0.5 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
            {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-xs">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Resumen */}
      {tab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Gauge className="h-4 w-4" /> Kilometraje</div>
            <p className="text-2xl font-bold text-slate-200">{vehiculo.km_actual ? Number(vehiculo.km_actual).toLocaleString('es-MX') : '0'} <span className="text-sm text-slate-500">km</span></p>
          </div>
          <div className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Fuel className="h-4 w-4" /> Gasto Combustible</div>
            <p className="text-2xl font-bold text-green-400">${totalCombustible.toLocaleString('es-MX')}</p>
          </div>
          <div className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Settings className="h-4 w-4" /> Gasto Mantenimiento</div>
            <p className="text-2xl font-bold text-blue-400">${totalMantenimiento.toLocaleString('es-MX')}</p>
          </div>
          <div className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><AlertTriangle className="h-4 w-4" /> Total Multas</div>
            <p className="text-2xl font-bold text-red-400">${totalMultas.toLocaleString('es-MX')}</p>
          </div>
          {vehiculo.conductor_nombre && (
            <div className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
              <div className="text-sm text-slate-400 mb-2">Conductor Asignado</div>
              <p className="text-lg font-medium text-blue-400">{vehiculo.conductor_nombre}</p>
            </div>
          )}
          {vehiculo.notas && (
            <div className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
              <div className="text-sm text-slate-400 mb-2">Notas</div>
              <p className="text-sm text-slate-300">{vehiculo.notas}</p>
            </div>
          )}
        </div>
      )}

      {/* Mantenimientos */}
      {tab === 'mantenimiento' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddModal('mantenimiento')} className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-medium transition-all"><Plus className="h-3 w-3" /> Agregar Mantenimiento</button>
          {vehiculo.mantenimientos?.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">No hay mantenimientos registrados</p> : (
            <div className="space-y-3">
              {vehiculo.mantenimientos?.map(m => (
                <div key={m.id} className="bg-zinc-900/50 border border-slate-800 rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${m.tipo === 'preventivo' ? 'bg-blue-400/10 text-blue-400' : 'bg-orange-400/10 text-orange-400'}`}>{m.tipo}</span>
                      {m.taller && <span className="text-xs text-slate-500">{m.taller}</span>}
                    </div>
                    <p className="text-sm text-slate-200">{m.descripcion}</p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span><Calendar className="h-3 w-3 inline mr-1" />{new Date(m.fecha).toLocaleDateString('es-MX')}</span>
                      {m.km_mantenimiento && <span><Gauge className="h-3 w-3 inline mr-1" />{Number(m.km_mantenimiento).toLocaleString()} km</span>}
                    </div>
                  </div>
                  {m.costo && <span className="text-sm font-medium text-blue-400">${Number(m.costo).toLocaleString('es-MX')}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Combustible */}
      {tab === 'combustible' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddModal('combustible')} className="flex items-center gap-2 px-3 py-2 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 rounded-lg text-xs font-medium transition-all"><Plus className="h-3 w-3" /> Registrar Carga</button>
          {vehiculo.combustible?.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">No hay cargas registradas</p> : (
            <div className="bg-zinc-900/50 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <th className="text-left px-4 py-3">Fecha</th><th className="text-right px-4 py-3">Litros</th><th className="text-right px-4 py-3">Costo</th><th className="text-right px-4 py-3">Km</th><th className="text-left px-4 py-3">Gasolinera</th>
                </tr></thead>
                <tbody>{vehiculo.combustible?.map(c => (
                  <tr key={c.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-3 text-slate-300">{new Date(c.fecha).toLocaleDateString('es-MX')}</td>
                    <td className="px-4 py-3 text-right text-slate-200">{c.litros ? `${Number(c.litros)} L` : '—'}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">${Number(c.costo_total).toLocaleString('es-MX')}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{c.km_carga ? Number(c.km_carga).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{c.gasolinera || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Multas */}
      {tab === 'multas' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddModal('multa')} className="flex items-center gap-2 px-3 py-2 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg text-xs font-medium transition-all"><Plus className="h-3 w-3" /> Registrar Multa</button>
          {vehiculo.multas?.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">No hay multas registradas</p> : (
            <div className="space-y-3">{vehiculo.multas?.map(m => (
              <div key={m.id} className="bg-zinc-900/50 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-200">{m.motivo || 'Sin motivo especificado'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{new Date(m.fecha).toLocaleDateString('es-MX')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${m.estado === 'pagada' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>{m.estado}</span>
                  </div>
                </div>
                {m.monto && <span className="text-lg font-bold text-red-400">${Number(m.monto).toLocaleString('es-MX')}</span>}
              </div>
            ))}</div>
          )}
        </div>
      )}

      {/* Add Record Modals */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(null)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-yellow-400 capitalize">Agregar {showAddModal === 'multa' ? 'Multa' : showAddModal === 'combustible' ? 'Carga de Combustible' : 'Mantenimiento'}</h2>
                  <button onClick={() => setShowAddModal(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  {showAddModal === 'mantenimiento' && (
                    <form onSubmit={(e) => { e.preventDefault(); addRecord('mantenimiento', { ...mantForm, km_mantenimiento: mantForm.km_mantenimiento ? parseInt(mantForm.km_mantenimiento) : null, costo: mantForm.costo ? parseFloat(mantForm.costo) : null }) }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-slate-400 uppercase">Tipo</label><select value={mantForm.tipo} onChange={e => setMantForm({ ...mantForm, tipo: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200"><option value="preventivo">Preventivo</option><option value="correctivo">Correctivo</option></select></div>
                        <div><label className="text-xs text-slate-400 uppercase">Fecha *</label><input required type="date" value={mantForm.fecha} onChange={e => setMantForm({ ...mantForm, fecha: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                      </div>
                      <div><label className="text-xs text-slate-400 uppercase">Descripción *</label><textarea required value={mantForm.descripcion} onChange={e => setMantForm({ ...mantForm, descripcion: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 resize-none" /></div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><label className="text-xs text-slate-400 uppercase">Km</label><input type="number" value={mantForm.km_mantenimiento} onChange={e => setMantForm({ ...mantForm, km_mantenimiento: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                        <div><label className="text-xs text-slate-400 uppercase">Costo $</label><input type="number" step="0.01" value={mantForm.costo} onChange={e => setMantForm({ ...mantForm, costo: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                        <div><label className="text-xs text-slate-400 uppercase">Taller</label><input value={mantForm.taller} onChange={e => setMantForm({ ...mantForm, taller: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                      </div>
                      <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/20 border border-blue-500/50 text-blue-400 disabled:opacity-50 rounded-lg text-sm font-medium">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Agregar</button>
                    </form>
                  )}
                  {showAddModal === 'combustible' && (
                    <form onSubmit={(e) => { e.preventDefault(); addRecord('combustible', { ...combForm, litros: combForm.litros ? parseFloat(combForm.litros) : null, costo_total: parseFloat(combForm.costo_total), km_carga: combForm.km_carga ? parseInt(combForm.km_carga) : null }) }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-slate-400 uppercase">Litros</label><input type="number" step="0.01" value={combForm.litros} onChange={e => setCombForm({ ...combForm, litros: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                        <div><label className="text-xs text-slate-400 uppercase">Costo Total *</label><input required type="number" step="0.01" value={combForm.costo_total} onChange={e => setCombForm({ ...combForm, costo_total: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><label className="text-xs text-slate-400 uppercase">Km Carga</label><input type="number" value={combForm.km_carga} onChange={e => setCombForm({ ...combForm, km_carga: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                        <div><label className="text-xs text-slate-400 uppercase">Gasolinera</label><input value={combForm.gasolinera} onChange={e => setCombForm({ ...combForm, gasolinera: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                        <div><label className="text-xs text-slate-400 uppercase">Fecha *</label><input required type="date" value={combForm.fecha} onChange={e => setCombForm({ ...combForm, fecha: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                      </div>
                      <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600/20 border border-green-500/50 text-green-400 disabled:opacity-50 rounded-lg text-sm font-medium">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fuel className="h-4 w-4" />}Registrar</button>
                    </form>
                  )}
                  {showAddModal === 'multa' && (
                    <form onSubmit={(e) => { e.preventDefault(); addRecord('multa', { ...multaForm, monto: multaForm.monto ? parseFloat(multaForm.monto) : null }) }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-slate-400 uppercase">Fecha *</label><input required type="date" value={multaForm.fecha} onChange={e => setMultaForm({ ...multaForm, fecha: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                        <div><label className="text-xs text-slate-400 uppercase">Monto $</label><input type="number" step="0.01" value={multaForm.monto} onChange={e => setMultaForm({ ...multaForm, monto: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200" /></div>
                      </div>
                      <div><label className="text-xs text-slate-400 uppercase">Motivo</label><textarea value={multaForm.motivo} onChange={e => setMultaForm({ ...multaForm, motivo: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 resize-none" /></div>
                      <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 border border-red-500/50 text-red-400 disabled:opacity-50 rounded-lg text-sm font-medium">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}Registrar Multa</button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
