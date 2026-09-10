import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState('user'); // 'user' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    
    if (role === 'admin' && !email.includes('apple')) {
      setError('Admin access requires an official @apple.com domain email.');
      return;
    }

    setError('');
    onLogin({
      email,
      role,
      name: role === 'admin' ? 'Apple Support Specialist' : email.split('@')[0],
      handle: role === 'admin' ? '@AppleSupport_Admin' : `@${email.split('@')[0]}`
    });
  };

  const quickLoginUser = () => {
    onLogin({
      email: 'customer@icloud.com',
      role: 'user',
      name: 'Customer (Alex)',
      handle: '@alex_apple_user'
    });
  };

  const quickLoginAdmin = () => {
    onLogin({
      email: 'specialist@apple.com',
      role: 'admin',
      name: 'Apple Senior Specialist',
      handle: '@AppleSupport_Admin'
    });
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, rgba(99,102,241,0.15), transparent 70%), var(--bg-primary)',
      padding: 20
    }}>
      <div className="card fade-in" style={{
        maxWidth: 440,
        width: '100%',
        padding: '36px 32px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        borderRadius: 16
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8, filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.2))' }}>🍎</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span className="glow-text">Apple AI Support Portal</span>
          </h2>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Sign in to access your designated support dashboard
          </div>
        </div>

        {/* Role Toggle Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-primary)',
          padding: 4,
          borderRadius: 10,
          marginBottom: 24,
          border: '1px solid var(--border)'
        }}>
          <button
            type="button"
            onClick={() => { setRole('user'); setError(''); }}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderRadius: 8,
              background: role === 'user' ? 'var(--accent)' : 'transparent',
              color: role === 'user' ? 'white' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
            <span>👤 Customer View</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('admin'); setError(''); }}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderRadius: 8,
              background: role === 'admin' ? 'linear-gradient(135deg, var(--yellow), #f59e0b)' : 'transparent',
              color: role === 'admin' ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
            <span>🛡️ Admin Console</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--red)',
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {role === 'admin' ? 'Official Apple Email Address' : 'Apple ID / Email Address'}
            </label>
            <input
              type="email"
              placeholder={role === 'admin' ? 'specialist@apple.com' : 'customer@icloud.com'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          <button type="submit" style={{
            marginTop: 8,
            padding: '12px 20px',
            background: role === 'admin' ? 'linear-gradient(135deg, var(--yellow), #f59e0b)' : 'linear-gradient(135deg, var(--accent), #4f46e5)',
            border: 'none',
            borderRadius: 8,
            color: role === 'admin' ? '#000' : 'white',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            boxShadow: role === 'admin' ? '0 4px 14px rgba(245,158,11,0.3)' : '0 4px 14px rgba(99,102,241,0.3)'
          }}>
            Sign In as {role === 'admin' ? 'Apple Admin Specialist' : 'Customer'}
          </button>
        </form>

        {/* Quick Demo Login Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '24px 0',
          fontSize: 11,
          color: 'var(--text-muted)'
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span>OR QUICK ONE-CLICK DEMO ACCESS</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* One Click Demo Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={quickLoginUser}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center'
            }}>
            👤 Quick Login: Customer
          </button>

          <button
            type="button"
            onClick={quickLoginAdmin}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 8,
              color: 'var(--yellow)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center'
            }}>
            🛡️ Quick Login: Admin
          </button>
        </div>
      </div>
    </div>
  );
}
