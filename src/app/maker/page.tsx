'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MakerPortal() {
  const router = useRouter();
  const [data, setData] = useState<any>({ phases: [], themes: [], topics: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newTopicTitle, setNewTopicTitle] = useState('');
  // Multi-select for prerequisites
  const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>([]);

  const fetchCurriculum = async () => {
    try {
      const res = await fetch('/api/maker/curriculum');
      if (!res.ok) throw new Error('Failed to fetch curriculum');
      const json = await res.json();
      setData(json);
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

  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle) return;

    let themeId = data.themes[0]?.id;
    if (!themeId) {
      alert('You need at least one Phase and Theme to create a Topic. Please seed the database or implement the Phase/Theme creator.');
      return;
    }

    try {
      const res = await fetch('/api/maker/topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          themeId, 
          title: newTopicTitle,
          prerequisiteIds: selectedPrerequisites
        })
      });
      if (!res.ok) throw new Error('Failed to create topic');
      
      setNewTopicTitle('');
      setSelectedPrerequisites([]);
      fetchCurriculum();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePrerequisiteToggle = (topicId: string) => {
    setSelectedPrerequisites(prev => {
      if (prev.includes(topicId)) return prev.filter(id => id !== topicId);
      return [...prev, topicId];
    });
  };

  return (
    <div className="container">
      <header className="flex justify-between items-center mb-8">
        <h1 style={{ color: 'hsl(var(--accent-gold))' }}>Maker Command Center</h1>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </header>

      {loading && <p className="text-secondary">Loading curriculum data...</p>}
      {error && <p style={{ color: 'hsl(var(--accent-red))' }}>{error}</p>}

      {!loading && (
        <div className="grid gap-md">
          
          <div className="surface">
            <h2 className="mb-4">Create New Topic</h2>
            <form onSubmit={createTopic} className="flex flex-col gap-sm">
              <input 
                type="text" 
                className="input"
                placeholder="Topic Title (e.g. Identity in Christ)"
                value={newTopicTitle}
                onChange={e => setNewTopicTitle(e.target.value)}
              />
              
              {data.topics.length > 0 && (
                <div>
                  <p className="text-sm text-secondary mb-2">Prerequisite Topics (Optional)</p>
                  <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                    {data.topics.map((t: any) => (
                      <label key={t.id} className="flex items-center gap-xs" style={{ background: 'hsl(var(--bg-base))', padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={selectedPrerequisites.includes(t.id)}
                          onChange={() => handlePrerequisiteToggle(t.id)}
                        />
                        <span className="text-sm">{t.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Create Topic</button>
            </form>
          </div>

          <div>
            <h2 className="mb-4 text-muted">Curriculum Tree</h2>
            {data.topics.length === 0 ? (
              <p className="text-secondary" style={{ fontStyle: 'italic' }}>No topics found. Create one above.</p>
            ) : (
              <div className="grid grid-cols-auto gap-sm">
                {data.topics.map((topic: any) => (
                  <div key={topic.id} className="surface surface-interactive flex flex-col justify-between">
                    <div>
                      <div className="badge badge-outline mb-2" style={{ color: 'hsl(var(--accent-gold))', borderColor: 'hsl(var(--accent-gold))' }}>Topic</div>
                      <h3 className="mb-1">{topic.title}</h3>
                      <p className="text-sm text-secondary mb-4">ID: {topic.id}</p>
                      
                      {topic.prerequisites?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-muted mb-1">Requires:</p>
                          <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                            {topic.prerequisites.map((req: any) => (
                              <span key={req.id} className="badge" style={{ background: 'hsla(var(--accent-gold), 0.1)', color: 'hsl(var(--accent-gold))' }}>{req.title}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => router.push(`/maker/lesson/${topic.id}`)}
                      className="btn btn-secondary w-100" style={{ width: '100%' }}>
                      Edit Lessons &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
