'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacilitatorPortal() {
  const router = useRouter();
  const [data, setData] = useState<{ learners: any[], unassignedLearners: any[] }>({ learners: [], unassignedLearners: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLearners = async () => {
    try {
      const res = await fetch('/api/facilitator/learners');
      if (!res.ok) throw new Error('Failed to fetch learners');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearners();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const claimLearner = async (studentId: string) => {
    try {
      const res = await fetch('/api/facilitator/learners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      if (!res.ok) throw new Error('Failed to claim learner');
      fetchLearners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <header className="flex justify-between items-center mb-8">
        <h1 style={{ color: 'hsl(var(--accent-blue))' }}>Facilitator Portal</h1>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </header>
      
      {loading && <p className="text-secondary">Loading learners...</p>}
      {error && <p style={{ color: 'hsl(var(--accent-red))' }}>{error}</p>}

      {!loading && (
        <div className="flex flex-col gap-lg">
          <section className="surface">
            <h2 className="mb-4">My Learners</h2>
            
            {data.learners.length === 0 && (
              <div className="surface" style={{ textAlign: 'center', borderStyle: 'dashed' }}>
                <p className="text-secondary">You have no assigned learners yet. Claim an unassigned learner below to begin!</p>
              </div>
            )}

            <div className="grid grid-cols-auto gap-sm">
              {data.learners.map((learner: any) => {
                const activeJourney = learner.journeys?.[0];

                return (
                  <div key={learner.id} className="surface surface-interactive flex flex-col">
                    <h3 className="mb-2" style={{ color: 'hsl(var(--text-primary))' }}>{learner.name || learner.email}</h3>
                    
                    <div className="text-sm text-secondary mb-4 flex flex-col gap-xs">
                      <p><strong>Context:</strong> {learner.profile?.context || 'None provided'}</p>
                      {activeJourney ? (
                        <p style={{ color: 'hsl(var(--accent-blue))' }}><strong>Current Topic:</strong> {activeJourney.topic?.title}</p>
                      ) : (
                        <p>Not currently enrolled in a topic.</p>
                      )}
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <button 
                        onClick={() => router.push(`/facilitator/learner/${learner.id}`)}
                        className="btn btn-primary w-100" style={{ width: '100%', backgroundColor: 'hsl(var(--accent-blue))' }}>
                        Prepare for Session
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {data.unassignedLearners.length > 0 && (
            <section>
              <h3 className="mb-4 text-muted">Unassigned Learners (For V1 Testing)</h3>
              <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                {data.unassignedLearners.map((learner: any) => (
                  <div key={learner.id} className="surface flex items-center justify-between" style={{ width: '300px' }}>
                    <span className="font-semibold">{learner.name || learner.email}</span>
                    <button onClick={() => claimLearner(learner.id)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', borderColor: 'hsl(var(--accent-blue))', color: 'hsl(var(--accent-blue))' }}>Claim</button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
