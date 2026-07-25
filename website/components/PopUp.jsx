import React, { useEffect, useRef, useState } from 'react';
import { panelTargetRect, wait, TIMING } from './AuthMenu';
import { useWaterSurface, Button } from './Button';

export function PopUp({ popUpmessage, setPopUpMessage }) {
  const popUpMessageText = typeof popUpmessage === 'object' && popUpmessage !== null ? popUpmessage.text : message;
  const popUpMessageType = typeof popUpmessage === 'object' && popUpmessage !== null ? popUpmessage.type : 'error';

  const [phase, setPhase] = useState('closed')
  const [bounds, setBounds] = useState(null)
  const ref = useRef(null)
  const canvasRef = useWaterSurface(ref)

  useEffect(() => {
    let isMounted = true;

    async function triggerPopup() {
      if (popUpMessageText && phase === 'closed') {
        const startBounds = { x: window.innerWidth / 2 - 30, y: window.innerHeight / 2 - 30, w: 60, h: 60, r: 30 }
        setBounds(startBounds)
        setPhase('press')

        await wait(TIMING.press)
        if (!isMounted) return
        setPhase('ripple')

        await wait(TIMING.ripple)
        if (!isMounted) return

        const dest = panelTargetRect(320)
        setPhase('expand')
        
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
  }, [popUpMessageText])

  const handleClose = async () => {
    setPhase('closing')

    await wait(150)
    setBounds({ x: window.innerWidth / 2 - 30, y: window.innerHeight / 2 - 30, w: 60, h: 60, r: 30 })

    await wait(TIMING.expand)
    setPhase('closed')
    setpopUpMessage('') 
  }

  if (phase === 'closed' && !popUpMessageText) return null

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
        className={`fluid-surface popup-surface phase-${phase} is-form`}
        style={bounds ? {
          left: bounds.x,
          top: bounds.y,
          width: bounds.w,
          height: bounds.h,
          borderRadius: bounds.r
        } : { display: 'none' }}
      >
        <canvas ref={canvasRef} className="button__canvas" aria-hidden="true" />

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
              
              <h1 className={popUpMessageType === 'success' ? "success-title" : "error-title"}>
                {popUpMessageType === 'success' ? 'SUCCESS' : 'ERROR'}
              </h1>
              
              <p className={`glass-subtitle ${messageType === 'success' ? "success-subtitle" : "error-subtitle"}`}>
                {popUpMessageText}
              </p>
              
              <Button type="button" onClick={handleClose}>
                Close
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}