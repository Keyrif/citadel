import React, { useState, useRef } from 'react';
import './App.css';
import { 
  AuthMenu, 
  WaterButton, 
  rectFromElement, 
  panelTargetRect, 
  wait, 
  TIMING 
} from '../components/AuthMenu';

export default function App() {
  const [panel, setPanel] = useState(null)
  const [bounds, setBounds] = useState(null)
  const [homeVisible, setHomeVisible] = useState(true)
  const [hiddenNav, setHiddenNav] = useState(null)
  const measureRef = useRef(null)
  const busyRef = useRef(false)

  async function openPanel(type, event) {
    if (busyRef.current || panel) return
    busyRef.current = true

    const origin = rectFromElement(event.currentTarget)

    setHiddenNav(type)
    setPanel({ type, phase: 'press', origin })
    setBounds(origin)
    setHomeVisible(false)

    await wait(TIMING.press)
    setPanel((p) => ({ ...p, phase: 'ripple' }))
    await wait(TIMING.ripple)

    const height = measureRef.current?.offsetHeight ?? 360
    const dest = panelTargetRect(height)

    setPanel((p) => ({ ...p, phase: 'expand', dest }))
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBounds(dest))
    })

    await wait(TIMING.expand)
    setPanel((p) => ({ ...p, phase: 'open' }))
    busyRef.current = false
  }

  async function closePanel() {
    if (busyRef.current || !panel) return
    busyRef.current = true

    const { origin } = panel
    setPanel((p) => ({ ...p, phase: 'closing' }))
    
    await wait(150)
    setBounds(origin)
    await wait(TIMING.expand)

    setPanel(null)
    setBounds(null)
    setHomeVisible(true)
    setHiddenNav(null)
    busyRef.current = false
  }

  const showForm = panel && (panel.phase === 'expand' || panel.phase === 'open' || panel.phase === 'closing')

  return (
    <div className="app">
      <div className="ambient" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
      </div>

      <main className={`home ${homeVisible ? '' : 'home--hidden'}`}>
        <p className="brand">Citadel</p>
        <div className="home-actions">
          <WaterButton
            className="nav-btn"
            data-nav="signup"
            style={hiddenNav === 'signup' ? { visibility: 'hidden' } : undefined}
            onClick={(e) => openPanel('signup', e)}
          >
            Create Account
          </WaterButton>
          <WaterButton
            className="nav-btn"
            data-nav="login"
            style={hiddenNav === 'login' ? { visibility: 'hidden' } : undefined}
            onClick={(e) => openPanel('login', e)}
          >
            Login
          </WaterButton>
        </div>
      </main>

      <AuthMenu 
        panel={panel} 
        bounds={bounds} 
        showForm={showForm} 
        onBack={closePanel} 
        measureRef={measureRef}
      />
    </div>
  )
}
