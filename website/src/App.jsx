import { useEffect, useRef, useState } from 'react'
import './App.css'

const PANEL_CONFIG = {
  login: {
    label: 'Login',
    title: 'Login',
    subtitle: 'Welcome back.',
    submit: 'Sign in',
  },
  signup: {
    label: 'Create Account',
    title: 'Create Account',
    subtitle: 'Pick a username and password.',
    submit: 'Create account',
  },
}

const TIMING = {
  press: 380,
  ripple: 240,
  expand: 720,
}

function useWaterSurface(ref) {
  const ripplesRef = useRef([])
  const frameRef = useRef(null)
  const lastRippleRef = useRef(0)
  const canvasRef = useRef(null)

  useEffect(() => {
    const surface = ref.current
    const canvas = canvasRef.current
    if (!surface || !canvas) return

    const ctx = canvas.getContext('2d')

    function resize() {
      const { width, height } = surface.getBoundingClientRect()
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
      const { width, height } = surface.getBoundingClientRect()
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
        return true
      })

      frameRef.current = requestAnimationFrame(draw)
    }

    function localPoint(event) {
      const rect = surface.getBoundingClientRect()
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }

    function setGlow(x, y) {
      surface.style.setProperty('--mx', `${x}px`)
      surface.style.setProperty('--my', `${y}px`)
    }

    function clearGlow() {
      surface.classList.remove('is-active')
      surface.style.removeProperty('--mx')
      surface.style.removeProperty('--my')
    }

    function handlePointerDown(event) {
      if (event.button !== 0 && event.pointerType === 'mouse') return
      surface.setPointerCapture(event.pointerId)
      surface.classList.add('is-active', 'is-pressing')
      window.setTimeout(() => surface.classList.remove('is-pressing'), 380)
      const { x, y } = localPoint(event)
      setGlow(x, y)
      addRipple(x, y, 1.2)
    }

    function handlePointerMove(event) {
      const { x, y } = localPoint(event)
      setGlow(x, y)
      surface.classList.add('is-active')
      const now = performance.now()
      if (now - lastRippleRef.current > 45) {
        addRipple(x, y, 0.75)
        lastRippleRef.current = now
      }
    }

    function handlePointerEnter(event) {
      if (event.pointerType === 'mouse') {
        surface.classList.add('is-active')
        const { x, y } = localPoint(event)
        setGlow(x, y)
        addRipple(x, y, 1)
      }
    }

    function handlePointerLeave(event) {
      if (event.pointerType === 'mouse') clearGlow()
    }

    function release(event) {
      if (surface.hasPointerCapture(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId)
      }
      clearGlow()
    }

    resize()
    draw()
    const observer = new ResizeObserver(resize)
    observer.observe(surface)
    surface.addEventListener('pointerdown', handlePointerDown)
    surface.addEventListener('pointermove', handlePointerMove)
    surface.addEventListener('pointerenter', handlePointerEnter)
    surface.addEventListener('pointerleave', handlePointerLeave)
    surface.addEventListener('pointerup', release)
    surface.addEventListener('pointercancel', release)

    return () => {
      observer.disconnect()
      surface.removeEventListener('pointerdown', handlePointerDown)
      surface.removeEventListener('pointermove', handlePointerMove)
      surface.removeEventListener('pointerenter', handlePointerEnter)
      surface.removeEventListener('pointerleave', handlePointerLeave)
      surface.removeEventListener('pointerup', release)
      surface.removeEventListener('pointercancel', release)
      cancelAnimationFrame(frameRef.current)
    }
  }, [ref])

  return canvasRef
}

function rectFromElement(el) {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height, r: 9999 }
}

function panelTargetRect(height) {
  const w = Math.min(420, window.innerWidth - 40)
  const h = height
  return {
    x: (window.innerWidth - w) / 2,
    y: (window.innerHeight - h) / 2,
    w,
    h,
    r: 28,
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
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

function AuthForm({ config, showFields }) {
  return (
    <form className={`glass-form ${showFields ? 'is-visible' : ''}`} onSubmit={(e) => e.preventDefault()}>
      <h1>{config.title}</h1>
      <p className="glass-subtitle">{config.subtitle}</p>
      <label>
        Username
        <input type="text" name="username" autoComplete="username" />
      </label>
      <label>
        Password
        <input type="password" name="password" autoComplete={config.title === 'Login' ? 'current-password' : 'new-password'} />
      </label>
      <WaterButton>{config.submit}</WaterButton>
    </form>
  )
}

function WaterButton({ children, onClick, className = '', ...props }) {
  const ref = useRef(null)
  const canvasRef = useWaterSurface(ref)

  return (
    <button
      ref={ref}
      type="button"
      className={`water-btn ${className}`}
      onClick={onClick}
      {...props}
    >
      <canvas ref={canvasRef} className="water-btn__canvas" aria-hidden="true" />
      <span className="water-btn__label">{children}</span>
    </button>
  )
}

function FluidSurface({ panel, bounds, onBack, showForm }) {
  const ref = useRef(null)
  const canvasRef = useWaterSurface(ref)
  const config = PANEL_CONFIG[panel.type]
  const splashes = panel.phase === 'ripple' || panel.phase === 'press'
  const isClosing = panel.phase === 'closing'

  return (
    <div
      ref={ref}
      className={`fluid-surface phase-${panel.phase} ${showForm ? 'is-form' : ''}`}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
        borderRadius: bounds.r,
      }}
    >
      <canvas ref={canvasRef} className="water-btn__canvas" aria-hidden="true" />

      {splashes && (
        <div className="liquid-splashes" aria-hidden="true">
          <span className="liquid-splash" />
          <span className="liquid-splash liquid-splash--delay" />
          <span className="liquid-splash liquid-splash--delay2" />
        </div>
      )}

      <div className="fluid-surface__body">
        <span className={`fluid-label ${showForm && !isClosing ? 'is-hidden' : ''}`}>
          {config.label}
        </span>

        {showForm && (
          <div className={`fluid-form ${panel.phase === 'open' ? 'is-visible' : ''} ${isClosing ? 'is-leaving' : ''}`}>
            {panel.phase === 'open' && <BackButton onClick={onBack} />}
            <AuthForm config={config} showFields={panel.phase === 'open'} />
          </div>
        )}
      </div>
    </div>
  )
}

function MeasurePanel({ type, measureRef }) {
  const config = PANEL_CONFIG[type]
  return (
    <div ref={measureRef} className="fluid-form is-visible panel-measure">
      <BackButton onClick={() => {}} />
      <AuthForm config={config} showFields />
    </div>
  )
}

function App() {
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
    await wait(240)
    setBounds(origin)
    await wait(TIMING.expand)

    setPanel(null)
    setBounds(null)
    setHomeVisible(true)
    setHiddenNav(null)
    busyRef.current = false
  }

  const showFluid = panel && bounds
  const showForm = panel && (panel.phase === 'expand' || panel.phase === 'open' || panel.phase === 'closing')

  return (
    <div className="app">
      <div className="ambient" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
      </div>

      {panel && (
        <div className="panel-measure-wrap" aria-hidden="true">
          <MeasurePanel measureRef={measureRef} type={panel.type} />
        </div>
      )}

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

      {showFluid && (
        <FluidSurface
          panel={panel}
          bounds={bounds}
          showForm={showForm}
          onBack={closePanel}
        />
      )}
    </div>
  )
}

export default App
