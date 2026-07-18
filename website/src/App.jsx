import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { 
  AuthMenu, 
  WaterButton, 
  rectFromElement, 
  panelTargetRect, 
  wait, 
  TIMING 
} from '../components/AuthMenu';

function TypewriterBrand() {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const phrases = ['CITADEL', 'BUILT BY KEYRIF'];

  useEffect(() => {
    const timer = setTimeout(() => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];

      if (isDeleting) {
        setText(fullText.substring(0, text.length - 1));
        setTypingSpeed(50);
      } else {
        setText(fullText.substring(0, text.length + 1));
        setTypingSpeed(150);
      }

      if (!isDeleting && text === fullText) {
        setTypingSpeed(2000);
        setIsDeleting(true);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(400);
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <p className="brand">
      <span>{text}</span>
      <span className="typewriter-cursor">|</span>
    </p>
  );
}

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
        <TypewriterBrand />
        
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

      <WaterButton className={`github-btn ${homeVisible ? '' : 'home--hidden'}`}
      onClick={() => window.open('https://github.com/keyrif/citadel', '_blank', 'noopener,noreferrer')}
      aria-label="GitHub Repository"
      title="GitHub Project Page"
      >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
      </WaterButton>

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