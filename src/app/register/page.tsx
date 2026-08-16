'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Route based on role
      if (data.user.role === 'MAKER' || data.user.role === 'ADMIN') {
        router.push('/maker');
      } else if (data.user.role === 'FACILITATOR') {
        router.push('/facilitator');
      } else {
        router.push('/student');
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="surface" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <h1 className="mb-8" style={{ textAlign: 'center', color: 'hsl(var(--accent-gold))' }}>Join ARQ</h1>
        
        {error && (
          <div className="mb-4" style={{ padding: '0.75rem', background: 'hsla(var(--accent-red), 0.1)', color: 'hsl(var(--accent-red))', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister} className="flex flex-col gap-sm">
          <div>
            <label className="label">Full Name</label>
            <input 
              type="text" 
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Doe"
              required 
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input 
              type="email" 
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required 
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="label">Role (V1 Demo Testing)</label>
            <select 
              className="input"
              value={role} 
              onChange={e => setRole(e.target.value)}
              disabled={isLoading}
            >
              <option value="STUDENT">Student</option>
              <option value="FACILITATOR">Facilitator</option>
              <option value="MAKER">Maker</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="text-center text-sm text-secondary" style={{ marginTop: '2rem', textAlign: 'center' }}>
          Already have an account? <Link href="/login" style={{ color: 'hsl(var(--accent-gold))', fontWeight: 500 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
