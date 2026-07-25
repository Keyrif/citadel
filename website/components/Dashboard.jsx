import React from 'react';
import { Button } from './Button'; 

export function Dashboard({ user, onLogout }) {
  if (!user) return null;

  return (
    <div className="fluid-surface is-form phase-open" style={{ width: '420px', padding: '40px' }}>
        <div className="fluid-surface__body">
            <div className="fluid-form is-visible">
                <div className="glass-form is-visible" style={{ textAlign: 'center' }}>
                
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