import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

function App() {
  const [ledOn, setLedOn] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadLedState = async () => {
    const { data, error } = await supabase
      .from('device_state')
      .select('*')
      .eq('device_name', 'esp32-led-1')
      .single()

    if (error) {
      console.error('Error al cargar estado:', error)
    } else {
      setLedOn(data.led_status)
    }

    setLoading(false)
  }

  const updateLedState = async (status) => {
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
  }

  useEffect(() => {
    loadLedState()
  }, [])

  return (
    <div className="container">
      <h1>control de led esp32</h1>
      <p className="subtitle">simulación web del estado del led</p>

      <div className="card">
        <div className={`led ${ledOn ? 'on' : 'off'}`}></div>

        <h2>
          estado: {loading ? 'cargando...' : ledOn ? 'encendido' : 'apagado'}
        </h2>

        <div className="buttons">
          <button onClick={() => updateLedState(true)}>encender</button>
          <button onClick={() => updateLedState(false)}>apagar</button>
        </div>
      </div>
    </div>
  )
}

export default App