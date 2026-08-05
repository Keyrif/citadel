import React from 'react';
import { Button } from './Button'; 

export function Dashboard({ user, onLogout }) {
  if (!user) return null;

  return (
    // We removed the padding, added a fixed height, and centered it using margin
    <div className="fluid-surface is-form phase-open" style={{ width: '420px', height: '420px', position: 'relative', margin: '0 auto' }}>
        <div className="fluid-surface__body">
            <div className="fluid-form is-visible">
                {/* We moved the padding here so the text doesn't hit the top edge */}
                <div className="glass-form is-visible" style={{ textAlign: 'center', paddingTop: '60px' }}>
                
                <h1>Welcome, {user.username}!</h1>
                
                <p className="glass-subtitle">
                    Account Status: <strong style={{ color: user.status === 'ACTIVE' ? '#4ade80' : 'inherit' }}>{user.status}</strong>
                </p>
                
                <br />
                
                <Button type="button" onClick={onLogout}>
                    Sign Out
                </Button>
                
                </div>
            </div>
        </div>
    </div>
  );
}