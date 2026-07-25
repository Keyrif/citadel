import React, { useEffect, useRef, useState } from 'react';

export const PANEL_CONFIG = {
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

export const TIMING = {
  press: 250,
  ripple: 100,
  expand: 180,
}

export function useWaterSurface(ref) {
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
      
      if (surface.classList.contains('fluid-surface') && event.target.closest('.fluid-form')) {
        return;
      }

      surface.setPointerCapture(event.pointerId)
      surface.classList.add('is-active', 'is-pressing')
      window.setTimeout(() => surface.classList.remove('is-pressing'), 250)
      const { x, y } = localPoint(event)
      setGlow(x, y)
      addRipple(x, y, 1.2)
    }

    function handlePointerMove(event) {
      const { x, y } = localPoint(event)
      setGlow(x, y)
      surface.classList.add('is-active')
    }

    function handlePointerEnter(event) {
      if (event.pointerType === 'mouse') {
        surface.classList.add('is-active')
        const { x, y } = localPoint(event)
        setGlow(x, y)
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

export function rectFromElement(el) {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height, r: 9999 }
}

export function panelTargetRect(height) {
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

export function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}


export function BackButton({ onClick }) {
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

export function WaterButton({ children, onClick, className = '', type = "button", ...props }) {
  const ref = useRef(null)
  const canvasRef = useWaterSurface(ref)

  return (
    <button
      ref={ref}
      type={type} 
      className={`water-btn ${className}`}
      onClick={onClick}
      {...props}
    >
      <canvas ref={canvasRef} className="water-btn__canvas" aria-hidden="true" />
      <span className="water-btn__label">{children}</span>
    </button>
  )
}

function ErrorPopup({ errorMessage, setErrorMessage }) {
  const [phase, setPhase] = useState('closed')
  const [bounds, setBounds] = useState(null)
  const ref = useRef(null)
  const canvasRef = useWaterSurface(ref)

  useEffect(() => {
    let isMounted = true;

    async function triggerPopup() {
      if (errorMessage && phase === 'closed') {
        // Start exactly in the center, with a small initial size (like a droplet)
        const startBounds = { x: window.innerWidth / 2 - 30, y: window.innerHeight / 2 - 30, w: 60, h: 60, r: 30 }
        setBounds(startBounds)
        setPhase('press')

        await wait(TIMING.press)
        if (!isMounted) return
        setPhase('ripple')

        await wait(TIMING.ripple)
        if (!isMounted) return

        const dest = panelTargetRect(320) // Target height for the error
        setPhase('expand')
        
        // Double rAF ensures the browser paints the 'expand' phase CSS 
        // before we apply the bounds, triggering the smooth grow effect
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (isMounted) setBounds(dest)
          })
        })

        await wait(TIMING.expand)
        if (!isMounted) return
        setPhase('open')
      }
    }

    triggerPopup()

    return () => { isMounted = false }
  }, [errorMessage])

  const handleClose = async () => {
    setPhase('closing')

    await wait(150)
    // Shrink back to the center droplet size
    setBounds({ x: window.innerWidth / 2 - 30, y: window.innerHeight / 2 - 30, w: 60, h: 60, r: 30 })

    await wait(TIMING.expand)
    setPhase('closed')
    setErrorMessage('') // Clears the error so it can trigger again next time
  }

  if (phase === 'closed' && !errorMessage) return null

  const splashes = phase === 'ripple' || phase === 'press'
  const isClosing = phase === 'closing'

  return (
    <>
      {phase !== 'closed' && (
        <div 
          className={`error-overlay ${isClosing ? 'is-closing' : ''}`}
          onClick={handleClose}
        />
      )}

      <div
        ref={ref}
        className={`fluid-surface error-popup-surface phase-${phase} is-form`}
        style={bounds ? {
          left: bounds.x,
          top: bounds.y,
          width: bounds.w,
          height: bounds.h,
          borderRadius: bounds.r
        } : { display: 'none' }}
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
          <div className={`fluid-form ${phase === 'open' ? 'is-visible' : ''} ${isClosing ? 'is-leaving' : ''}`}>
            <form className={`glass-form ${phase === 'open' ? 'is-visible' : ''}`} onSubmit={(e) => e.preventDefault()}>
              <h1 className="error-title">ERROR</h1>
              <p className="glass-subtitle error-subtitle">
                {errorMessage}
              </p>
              <WaterButton type="button" onClick={handleClose}>
                Close
              </WaterButton>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

function AuthForm({ config, showFields, errorMessage, setErrorMessage }) {

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const formData = new FormData(e.target);
    const payload = {
      username: formData.get("username"),
      password: formData.get("password")
    };

    if (config.label === 'Create Account') {
      try {
        const response = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          alert("Account created successfully!");
        } else {
          const errorMsg = Array.isArray(data.detail) 
            ? data.detail.map(err => err.msg).join(", ") 
            : data.detail;
          setErrorMessage(errorMsg);
        }
      } catch (error) {
        setErrorMessage("Could not connect to API.");
      }
    } else {
      console.log("Login endpoint not connected yet!");
    }
  };

  return (
    <form className={`glass-form ${showFields ? 'is-visible' : ''}`} onSubmit={handleAuthSubmit}>
      <h1>{config.title}</h1>
      <p className="glass-subtitle">{config.subtitle}</p>
      <label>
        Password
        <input 
          type="password" 
          name="password" 
          minLength="8" 
          autoComplete={config.title === 'Login' ? 'current-password' : 'new-password'} 
          required 
        />
      </label>
      <label>
        Password
        <input type="password" name="password" autoComplete={config.title === 'Login' ? 'current-password' : 'new-password'} required />
      </label>
      <WaterButton type="submit">{config.submit}</WaterButton>
    </form>
  )
}
function FluidSurface({ panel, bounds, onBack, showForm, errorMessage, setErrorMessage }) {
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
            <AuthForm 
              config={config} 
              showFields={panel.phase === 'open'} 
              errorMessage={errorMessage}      
              setErrorMessage={setErrorMessage}  
            />
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

export function AuthMenu({ panel, bounds, showForm, onBack, measureRef, errorMessage, setErrorMessage }) {
  if (!panel) return null;

  return (
    <>
      <div className="panel-measure-wrap" aria-hidden="true">
        <MeasurePanel measureRef={measureRef} type={panel.type} />
      </div>

      {bounds && (
        <FluidSurface
          panel={panel}
          bounds={bounds}
          showForm={showForm}
          onBack={onBack}
          errorMessage={errorMessage}      
          setErrorMessage={setErrorMessage}  
        />
      )}

      <ErrorPopup 
        errorMessage={errorMessage} 
        setErrorMessage={setErrorMessage} 
      />
    </>
  )
}