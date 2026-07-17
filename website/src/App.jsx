import { useEffect, useRef, useState } from 'react'
import './App.css'

function WaterButton({ children, onClick }) {
  const buttonRef = useRef(null)
  const canvasRef = useRef(null)
  const ripplesRef = useRef([])
  const frameRef = useRef(null)
  const lastRippleRef = useRef(0)

  useEffect(() => {
    const button = buttonRef.current
    const canvas = canvasRef.current
    if (!button || !canvas) return

    const ctx = canvas.getContext('2d')

    function resize() {
      const { width, height } = button.getBoundingClientRect()
      canvas.width = width * devicePixelRatio
      canvas.height = height * devicePixelRatio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }

    function addRipple(x, y, strength = 1) {
      ripplesRef.current.push({
        x,
        y,
        radius: 4,
        maxRadius: 40 + strength * 30,
        opacity: 0.55 * strength,
        lineWidth: 2 + strength,
      })

      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 1.2 + Math.random() * 2.5
        ripplesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.5 + Math.random() * 2,
          opacity: 0.45,
          droplet: true,
          life: 1,
        })
      }

      if (ripplesRef.current.length > 80) {
        ripplesRef.current.splice(0, ripplesRef.current.length - 80)
      }
    }

    function draw() {
      const { width, height } = button.getBoundingClientRect()
      ctx.clearRect(0, 0, width, height)

      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        if (ripple.droplet) {
          ripple.x += ripple.vx
          ripple.y += ripple.vy
          ripple.vy += 0.04
          ripple.life -= 0.025
          ripple.opacity = ripple.life * 0.4

          if (ripple.life <= 0) return false

          ctx.beginPath()
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(100, 190, 255, ${ripple.opacity})`
          ctx.fill()
          return true
        }

        ripple.radius += 1.8
        ripple.opacity -= 0.018

        if (ripple.opacity <= 0 || ripple.radius > ripple.maxRadius) return false

        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(120, 200, 255, ${ripple.opacity})`
        ctx.lineWidth = ripple.lineWidth
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.65, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(80, 160, 230, ${ripple.opacity * 0.4})`
        ctx.lineWidth = 1
        ctx.stroke()

        return true
      })

      frameRef.current = requestAnimationFrame(draw)
    }

    function localPoint(event) {
      const rect = button.getBoundingClientRect()
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }

    function setGlow(x, y) {
      button.style.setProperty('--mx', `${x}px`)
      button.style.setProperty('--my', `${y}px`)
    }

    function clearGlow() {
      button.classList.remove('is-active')
      button.style.removeProperty('--mx')
      button.style.removeProperty('--my')
    }

    function handlePointerDown(event) {
      button.setPointerCapture(event.pointerId)
      button.classList.add('is-active')
      const { x, y } = localPoint(event)
      setGlow(x, y)
      addRipple(x, y, 1.2)
    }

    function handlePointerMove(event) {
      const { x, y } = localPoint(event)
      setGlow(x, y)
      button.classList.add('is-active')

      const now = performance.now()
      if (now - lastRippleRef.current > 45) {
        addRipple(x, y, 0.75)
        lastRippleRef.current = now
      }
    }

    function handlePointerEnter(event) {
      if (event.pointerType === 'mouse') {
        button.classList.add('is-active')
        const { x, y } = localPoint(event)
        setGlow(x, y)
        addRipple(x, y, 1)
      }
    }

    function handlePointerLeave(event) {
      if (event.pointerType === 'mouse') {
        clearGlow()
      }
    }

    function handlePointerUp(event) {
      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId)
      }
      clearGlow()
    }

    function handlePointerCancel(event) {
      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId)
      }
      clearGlow()
    }

    resize()
    draw()

    const observer = new ResizeObserver(resize)
    observer.observe(button)
    button.addEventListener('pointerdown', handlePointerDown)
    button.addEventListener('pointermove', handlePointerMove)
    button.addEventListener('pointerenter', handlePointerEnter)
    button.addEventListener('pointerleave', handlePointerLeave)
    button.addEventListener('pointerup', handlePointerUp)
    button.addEventListener('pointercancel', handlePointerCancel)

    return () => {
      observer.disconnect()
      button.removeEventListener('pointerdown', handlePointerDown)
      button.removeEventListener('pointermove', handlePointerMove)
      button.removeEventListener('pointerenter', handlePointerEnter)
      button.removeEventListener('pointerleave', handlePointerLeave)
      button.removeEventListener('pointerup', handlePointerUp)
      button.removeEventListener('pointercancel', handlePointerCancel)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <button
      ref={buttonRef}
      type="button"
      className="water-btn"
      onClick={onClick}
    >
      <canvas ref={canvasRef} className="water-btn__canvas" aria-hidden="true" />
      <span className="water-btn__label">{children}</span>
    </button>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      className="ios-back"
      onClick={onClick}
      aria-label="Back"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14.5 5.5L8 12l6.5 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function GlassPanel({ title, subtitle, children }) {
  return (
    <div className="glass-panel">
      <h1>{title}</h1>
      {subtitle && <p className="glass-subtitle">{subtitle}</p>}
      {children}
    </div>
  )
}

function App() {
  const [view, setView] = useState('home')

  return (
    <div className="app">
      <div className="ambient" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
      </div>

      {view === 'home' && (
        <main className="home">
          <p className="brand">Citadel</p>
          <div className="home-actions">
            <WaterButton onClick={() => setView('signup')}>
              Create Account
            </WaterButton>
            <WaterButton onClick={() => setView('login')}>Login</WaterButton>
          </div>
        </main>
      )}

      {view === 'login' && (
        <main className="form-screen">
          <BackButton onClick={() => setView('home')} />
          <GlassPanel title="Login" subtitle="Welcome back.">
            <form className="glass-form" onSubmit={(e) => e.preventDefault()}>
              <label>
                Username
                <input type="text" name="username" autoComplete="username" />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                />
              </label>
              <WaterButton>Sign in</WaterButton>
            </form>
          </GlassPanel>
        </main>
      )}

      {view === 'signup' && (
        <main className="form-screen">
          <BackButton onClick={() => setView('home')} />
          <GlassPanel
            title="Create Account"
            subtitle="Pick a username and password."
          >
            <form className="glass-form" onSubmit={(e) => e.preventDefault()}>
              <label>
                Username
                <input type="text" name="username" autoComplete="username" />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                />
              </label>
              <WaterButton>Create account</WaterButton>
            </form>
          </GlassPanel>
        </main>
      )}
    </div>
  )
}

export default App
