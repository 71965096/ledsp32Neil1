import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

function App() {
  const [ledOn, setLedOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('--/--/----, --:--:--')

  // Formateador de fecha para que se vea como en tu diseño
  const formatDate = (dateString) => {
    if (!dateString) return '--/--/----, --:--:--'
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).replace(/, /, ', ').toLowerCase() // Para que el "p. m." quede en minúscula
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
        setLastUpdate(formatDate(data.updated_at || new Date().toISOString()))
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
          setLastUpdate(formatDate(payload.new.updated_at || new Date().toISOString()))
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
    
    // Actualización optimista para que la UI se sienta instantánea
    setLedOn(status)
    setLastUpdate(formatDate(now))

    const { error } = await supabase
      .from('device_state')
      .update({
        led_status: status,
        updated_at: now,
      })
      .eq('device_name', 'esp32-led-1')

    if (error) {
      console.error('Error al actualizar estado:', error)
      // Si falla, podrías revertir el estado aquí
    }
    setIsUpdating(false)
  }

  return (
    <div className="app-container">
      <div className="dashboard-card">
        
        {/* SECCIÓN SUPERIOR: LED y Textos */}
        <div className="top-section">
          {/* Anillos y Esfera LED */}
          <div className="led-wrapper">
            <div className={`led-ring outer ${ledOn ? 'glow' : ''}`}></div>
            <div className={`led-ring inner ${ledOn ? 'glow' : ''}`}></div>
            <div className={`led-orb ${ledOn ? 'on' : 'off'}`}>
              <div className="orb-highlight"></div>
            </div>
          </div>

          {/* Textos de Estado */}
          <div className="status-info">
            <span className="label-text tracking-widest">ESTADO ACTUAL</span>
            <h1 className={`status-title ${ledOn ? 'text-green' : 'text-dark'}`}>
              {loading ? 'cargando' : (ledOn ? 'encendido' : 'apagado')}
            </h1>
            <p className="hint-text">el estado se conserva aunque recargues la página</p>
          </div>
        </div>

        {/* SECCIÓN MEDIA: Botones */}
        <div className="actions-section">
          <button 
            className={`btn btn-on ${ledOn ? 'active' : ''}`}
            onClick={() => updateLedState(true)}
            disabled={loading || isUpdating}
          >
            encender
          </button>
          <button 
            className={`btn btn-off ${!ledOn ? 'active' : ''}`}
            onClick={() => updateLedState(false)}
            disabled={loading || isUpdating}
          >
            apagar
          </button>
        </div>

        {/* SECCIÓN INFERIOR: Metadatos */}
        <div className="footer-section">
          <div className="meta-block">
            <span className="label-text tracking-widest">DISPOSITIVO</span>
            <span className="value-text monospace">esp32-led-1</span>
          </div>
          <div className="divider"></div>
          <div className="meta-block">
            <span className="label-text tracking-widest">ÚLTIMA ACTUALIZACIÓN</span>
            <span className="value-text monospace">{lastUpdate}</span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App