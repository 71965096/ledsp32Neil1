import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

function App() {
  const [ledOn, setLedOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // 1. Cargar el estado inicial
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
      }
      setLoading(false)
    }

    loadLedState()

    // 2. MAGIA PRO: Suscripción en tiempo real a la base de datos
    // Si el ESP32 u otro usuario cambia el estado, la UI se actualiza sola al instante.
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
        }
      )
      .subscribe()

    // Limpiar suscripción al desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const updateLedState = async (status) => {
    // Evitar múltiples clics mientras se procesa
    if (isUpdating || status === ledOn) return 
    
    setIsUpdating(true)
    const { error } = await supabase
      .from('device_state')
      .update({
        led_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('device_name', 'esp32-led-1')

    if (error) {
      console.error('Error al actualizar estado:', error)
    } else {
      setLedOn(status)
    }
    setIsUpdating(false)
  }

  return (
    <div className="container">
      <div className="ui-wrapper fade-in-up">
        <header className="header">
          <h1>Control ESP32</h1>
          <p className="subtitle">IoT Dashboard en Tiempo Real</p>
        </header>

        <div className="card">
          {/* Indicador LED con animaciones */}
          <div className={`led-container ${loading ? 'pulse-loading' : ''}`}>
            <div className={`led ${ledOn ? 'on' : 'off'}`}>
              <div className="led-reflection"></div>
            </div>
          </div>

          <h2 className="status-text">
            {loading ? (
              <span className="loading-text">Sincronizando...</span>
            ) : (
              <>Estado: <span className={ledOn ? 'text-green' : 'text-red'}>{ledOn ? 'ENCENDIDO' : 'APAGADO'}</span></>
            )}
          </h2>

          <div className="buttons">
            <button 
              className={`btn onBtn ${ledOn ? 'active' : ''}`} 
              onClick={() => updateLedState(true)}
              disabled={loading || isUpdating || ledOn}
            >
              {isUpdating && !ledOn ? 'Procesando...' : 'Encender'}
            </button>
            <button 
              className={`btn offBtn ${!ledOn && !loading ? 'active' : ''}`} 
              onClick={() => updateLedState(false)}
              disabled={loading || isUpdating || !ledOn}
            >
              {isUpdating && ledOn ? 'Procesando...' : 'Apagar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App