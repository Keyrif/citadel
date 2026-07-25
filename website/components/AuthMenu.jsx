import React, { useEffect, useRef, useState } from 'react';
import { PopUp } from './PopUp'; 
import { BackButton } from './BackButton';
import { useWaterSurface, Button } from './Button';

export const PANEL_CONFIG = {
  login: {
    label: 'Login',
    title: 'Login',
    subtitle: 'Welcome back.',
    submit: 'Sign in',
    endpoint: '/login',
  },
  signup: {
    label: 'Create Account',
    title: 'Create Account',
    subtitle: 'Pick a username and password.',
    submit: 'Create account',
    endpoint: '/register',
  },
}

export const TIMING = {
  press: 250,
  ripple: 100,
  expand: 180,
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

function AuthForm({ config, showFields, popUpMessage, setPopUpMessage }) {

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setPopUpMessage("");

    const formData = new FormData(e.target);
    const payload = {
      username: formData.get("username"),
      password: formData.get("password")
    };


    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setPopUpMessage({ 
          text: data.message || `${config.label} successful!`, 
          type: "success" 
        });
      } else {
        const errorMsg = Array.isArray(data.detail) 
          ? data.detail.map(err => err.msg).join(", ") 
          : data.detail;
        setPopUpMessage({
          text: errorMsg, 
          type: "error"
        });
      }
    } catch (error) {
      setPopUpMessage("Could not connect to API.");
    }
  };

  return (
    <form className={`glass-form ${showFields ? 'is-visible' : ''}`} onSubmit={handleAuthSubmit}>
      <h1>{config.title}</h1>
      <p className="glass-subtitle">{config.subtitle}</p>
      <label>
        Username
        <input type="text" name="username" autoComplete="username" required />
      </label>
      <label>
        Password
        <input 
          type="password" 
          name="password" 
          minLength="6" 
          autoComplete={config.title === 'Login' ? 'current-password' : 'new-password'} 
          required 
        />
      </label>
      <Button type="submit">{config.submit}</Button>
    </form>
  )
}
function FluidSurface({ panel, bounds, onBack, showForm, popUpMessage, setPopUpMessage }) {
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
      <canvas ref={canvasRef} className="button__canvas" aria-hidden="true" />

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
              popUpMessage={popUpMessage}      
              setPopUpMessage={setPopUpMessage}  
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

export function AuthMenu({ panel, bounds, showForm, onBack, measureRef, popUpMessage, setPopUpMessage }) {
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
          popUpMessage={popUpMessage}      
          setPopUpMessage={setPopUpMessage}  
        />
      )}

      <PopUp 
        popUpMessage={popUpMessage} 
        setPopUpMessage={setPopUpMessage} 
      />
    </>
  )
}
