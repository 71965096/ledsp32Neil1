import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

function App() {
  const [ledOn, setLedOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('--:--:--')

  const formatTime = (dateString) => {
    if (!dateString) return '--:--:--'
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  useEffect(() => {
    const loadLedState = async () => {
      const { data, error } = await supabase
        .from('device_state')
        .select('*')
        .eq('device_name', 'esp32-led-1')
        .single()

      if (error) {
        console.error('Error al cargar estado:', error)
      } else if (data) {
        setLedOn(data.led_status)
        setLastUpdate(formatTime(data.updated_at || new Date().toISOString()))
      }
      setLoading(false)
    }

    loadLedState()

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_state',
          filter: 'device_name=eq.esp32-led-1',
        },
        (payload) => {
          setLedOn(payload.new.led_status)
          setLastUpdate(formatTime(payload.new.updated_at || new Date().toISOString()))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const updateLedState = async (status) => {
    if (isUpdating || status === ledOn) return 
    
    setIsUpdating(true)
    const now = new Date().toISOString()
    
    setLedOn(status)
    setLastUpdate(formatTime(now))

    const { error } = await supabase
      .from('device_state')
      .update({
        led_status: status,
        updated_at: now,
      })
      .eq('device_name', 'esp32-led-1')

    if (error) console.error('Error al actualizar estado:', error)
    setIsUpdating(false)
  }

  return (
    <div className="blue-layout">
      <div className="glass-circle-panel">
        
        {/* Cabecera minimalista */}
        <div className="panel-header">
          <h2>NEXUS <span>ESP32</span></h2>
          <p className="status-badge">{loading ? 'CONECTANDO...' : 'SISTEMA ONLINE'}</p>
        </div>

        {/* NÚCLEO CIRCULAR (El LED) */}
        <div className="reactor-container">
          <div className={`reactor-ring outer ${ledOn ? 'spin-fast' : 'spin-slow'}`}></div>
          <div className={`reactor-ring inner ${ledOn ? 'spin-reverse' : ''}`}></div>
          
          <div className={`reactor-core ${ledOn ? 'active' : 'inactive'}`}>
            <span className="core-text">
              {loading ? '...' : (ledOn ? 'ON' : 'OFF')}
            </span>
          </div>
        </div>

        {/* Controles tipo Píldora */}
        <div className="pill-controls">
          <button 
            className={`pill-btn on-btn ${ledOn ? 'selected' : ''}`}
            onClick={() => updateLedState(true)}
            disabled={loading || isUpdating || ledOn}
          >
            ACTIVAR
          </button>
          <button 
            className={`pill-btn off-btn ${!ledOn && !loading ? 'selected' : ''}`}
            onClick={() => updateLedState(false)}
            disabled={loading || isUpdating || !ledOn}
          >
            DESACTIVAR
          </button>
        </div>

        {/* Metadatos inferiores */}
        <div className="panel-footer">
          <div className="info-pill">
            <span className="info-label">ID:</span> esp32-led-1
          </div>
          <div className="info-pill">
            <span className="info-label">SYNC:</span> {lastUpdate}
          </div>
        </div>

      </div>
    </div>
  )
}

export default App