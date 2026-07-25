import React, { useEffect, useRef } from 'react';

export function useWaterSurface(ref) {
  const ripplesRef = useRef([])
  const frameRef = useRef(null)
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

export function Button({ children, onClick, className = '', type = "button", ...props }) {
  const ref = useRef(null)
  const canvasRef = useWaterSurface(ref)

  return (
    <button
      ref={ref}
      type={type} 
      className={`button ${className}`}
      onClick={onClick}
      {...props}
    >
      <canvas ref={canvasRef} className="button__canvas" aria-hidden="true" />
      <span className="button__label">{children}</span>
    </button>
  )
}