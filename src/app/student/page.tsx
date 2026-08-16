'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPortal() {
  const router = useRouter();
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCurriculum = async () => {
    try {
      const res = await fetch('/api/student/curriculum');
      if (!res.ok) throw new Error('Failed to fetch curriculum map');
      const data = await res.json();
      setCurriculum(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const enrollInTopic = async (topicId: string) => {
    try {
      const res = await fetch('/api/student/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId })
      });
      if (!res.ok) throw new Error('Failed to enroll');
      fetchCurriculum(); // Refresh the map
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Group topics into columns: IN-PROGRESS/COMPLETED on top or left, AVAILABLE, and LOCKED
  const activeTopics = curriculum.filter(t => t.state === 'IN-PROGRESS');
  const availableTopics = curriculum.filter(t => t.state === 'AVAILABLE');
  const lockedTopics = curriculum.filter(t => t.state === 'LOCKED');
  const completedTopics = curriculum.filter(t => t.state === 'COMPLETED');

  return (
    <div className="container">
      <header className="flex justify-between items-center mb-8">
        <h1 style={{ color: 'hsl(var(--accent-green))' }}>Student Portal</h1>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </header>
      
      {loading && <p className="text-secondary">Loading Curriculum Map...</p>}
      {error && <p style={{ color: 'hsl(var(--accent-red))' }}>{error}</p>}

      {!loading && (
        <div className="flex flex-col gap-lg">
          
          {/* Active Journeys */}
          {activeTopics.length > 0 && (
            <section className="surface" style={{ borderColor: 'hsl(var(--accent-green))', borderWidth: '2px' }}>
              <h2 className="mb-4">My Active Journeys</h2>
              <div className="grid grid-cols-auto gap-sm">
                {activeTopics.map((topic: any) => (
                  <div key={topic.id} className="surface surface-interactive flex flex-col">
                    <div className="badge badge-outline mb-2" style={{ color: 'hsl(var(--accent-green))', borderColor: 'hsl(var(--accent-green))' }}>
                      IN PROGRESS
                    </div>
                    <h3 className="mb-4">{topic.title}</h3>
                    
                    <div style={{ marginTop: 'auto' }}>
                      <button 
                        onClick={() => router.push(`/student/journey/${topic.activeJourneyId}`)}
                        className="btn btn-primary w-100" style={{ width: '100%', backgroundColor: 'hsl(var(--accent-green))' }}>
                        Continue Journey &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Curriculum Map */}
          <section>
            <h2 className="mb-4">Curriculum Map</h2>
            <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              
              {/* Available */}
              <div className="flex flex-col gap-sm">
                <h3 className="text-muted" style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Available Topics</h3>
                {availableTopics.length === 0 && <p className="text-sm text-secondary italic">No available topics right now.</p>}
                {availableTopics.map(topic => (
                  <div key={topic.id} className="surface surface-interactive flex justify-between items-center">
                    <div>
                      <h4 className="mb-1">{topic.title}</h4>
                      <p className="text-xs text-secondary">Ready to start</p>
                    </div>
                    <button onClick={() => enrollInTopic(topic.id)} className="btn btn-secondary text-sm">Enroll</button>
                  </div>
                ))}
              </div>

              {/* Locked */}
              <div className="flex flex-col gap-sm">
                <h3 className="text-muted" style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Locked Topics</h3>
                {lockedTopics.length === 0 && <p className="text-sm text-secondary italic">Nothing is locked!</p>}
                {lockedTopics.map(topic => (
                  <div key={topic.id} className="surface flex flex-col" style={{ opacity: 0.5 }}>
                    <h4 className="mb-1" style={{ color: 'hsl(var(--text-muted))' }}>{topic.title}</h4>
                    <div className="text-xs text-secondary">
                      <p className="mb-1" style={{ color: 'hsl(var(--accent-red))' }}>&#128274; Locked</p>
                      <p>Requires:</p>
                      <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                        {topic.missingPrerequisites.map((req: any) => (
                          <li key={req.id}>{req.title}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completed */}
              <div className="flex flex-col gap-sm">
                <h3 className="text-muted" style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Completed</h3>
                {completedTopics.length === 0 && <p className="text-sm text-secondary italic">You haven't completed any topics yet.</p>}
                {completedTopics.map(topic => (
                  <div key={topic.id} className="surface flex justify-between items-center" style={{ borderColor: 'hsl(var(--text-muted))' }}>
                    <h4 className="mb-1 text-muted">{topic.title}</h4>
                    <span className="text-sm text-secondary">&#10004; Done</span>
                  </div>
                ))}
              </div>

            </div>
          </section>

        </div>
      )}
    </div>
  );
}
