import { useState } from 'react'
import './App.css'

function App() {
  const [ledOn, setLedOn] = useState(false)

  return (
    <div className="container">
      <h1>control de led esp32</h1>
      <p className="subtitle">simulación web del estado del led</p>

      <div className="card">
        <div className={`led ${ledOn ? 'on' : 'off'}`}></div>

        <h2>
          estado: {ledOn ? 'encendido' : 'apagado'}
        </h2>

        <div className="buttons">
          <button onClick={() => setLedOn(true)}>encender</button>
          <button onClick={() => setLedOn(false)}>apagar</button>
        </div>
      </div>
    </div>
  )
}

export default App