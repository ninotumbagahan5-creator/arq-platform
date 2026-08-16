'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JourneyExperience({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Track which block we are currently viewing
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  const id = params.id;

  const fetchJourney = async () => {
    try {
      const res = await fetch(`/api/student/journey/${id}`);
      if (!res.ok) throw new Error('Failed to fetch journey');
      const data = await res.json();
      setJourney(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [id]);

  if (loading) return <div className="container"><p className="text-secondary">Loading your journey...</p></div>;
  if (error) return <div className="container"><p style={{ color: 'hsl(var(--accent-red))' }}>{error}</p></div>;
  if (!journey) return null;

  // Flatten all blocks from the lessons into a single sequence for the MVP experience
  const allBlocks = journey.topic.lessons.flatMap((l: any) => l.blocks);
  const currentBlock = allBlocks[currentBlockIndex];
  
  // Parse content
  let parsedContent: any = {};
  if (currentBlock) {
    try { parsedContent = JSON.parse(currentBlock.content); } catch (e) {}
  }

  const handleNext = async () => {
    if (currentBlockIndex < allBlocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
    } else {
      try {
        const res = await fetch(`/api/student/journey/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
        if (!res.ok) throw new Error('Failed to complete journey');
        alert("You have completed this topic! New topics may now be unlocked in your Curriculum Map.");
        router.push('/student');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <header className="mb-8">
        <button onClick={() => router.push('/student')} className="btn btn-ghost mb-2">&larr; Back to Dashboard</button>
        <div className="badge badge-outline mb-2" style={{ color: 'hsl(var(--text-muted))' }}>Current Topic</div>
        <h1 style={{ color: 'hsl(var(--accent-green))' }}>{journey.topic.title}</h1>
      </header>

      {/* Progress Bar */}
      <div style={{ background: 'hsl(var(--bg-surface))', height: '4px', borderRadius: '2px', marginBottom: '2.5rem', overflow: 'hidden' }}>
        <div style={{ background: 'hsl(var(--accent-green))', height: '100%', width: `${((currentBlockIndex + 1) / allBlocks.length) * 100}%`, transition: 'width var(--transition-normal)' }}></div>
      </div>

      {/* Current Block Content */}
      {currentBlock ? (
        <div className="surface" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <div className="badge mb-4" style={{ background: 'hsla(var(--accent-green), 0.1)', color: 'hsl(var(--accent-green))', alignSelf: 'flex-start' }}>
            {currentBlock.blockType.replace('-', ' ')}
          </div>
          
          <div style={{ fontSize: '1.25rem', lineHeight: '1.8', color: 'hsl(var(--text-primary))', flex: '1' }}>
            {parsedContent.text && <p className="mb-4">{parsedContent.text}</p>}
            {parsedContent.question && <p style={{ fontStyle: 'italic', color: 'hsl(var(--accent-gold))', fontSize: '1.5rem', fontWeight: 500 }}>"{parsedContent.question}"</p>}
            {parsedContent.reference && <strong style={{ display: 'block', color: 'hsl(var(--accent-blue))', marginBottom: '1rem' }}>{parsedContent.reference}</strong>}
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleNext} 
              className="btn btn-primary"
              style={{ backgroundColor: 'hsl(var(--accent-green))', fontSize: '1.125rem', padding: '1rem 2rem' }}
            >
              {currentBlockIndex < allBlocks.length - 1 ? 'Continue' : 'Complete Topic'}
            </button>
          </div>
        </div>
      ) : (
        <div className="surface" style={{ textAlign: 'center' }}>
          <p className="text-muted">This topic doesn't have any content yet.</p>
        </div>
      )}
    </div>
  );
}
