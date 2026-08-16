'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacilitatorSessionView({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [learner, setLearner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const id = params.id;

  const fetchLearner = async () => {
    try {
      const res = await fetch(`/api/facilitator/learner/${id}`);
      if (!res.ok) throw new Error('Failed to fetch learner context');
      const data = await res.json();
      setLearner(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearner();
  }, [id]);

  if (loading) return <div className="container"><p className="text-secondary">Loading learner context...</p></div>;
  if (error) return <div className="container"><p style={{ color: 'hsl(var(--accent-red))' }}>{error}</p></div>;
  if (!learner) return null;

  const activeJourney = learner.journeys?.[0];
  const currentLesson = activeJourney?.topic?.lessons?.[0]; // Assuming first lesson for MVP
  const blocks = currentLesson?.blocks || [];

  // Filter out only the Facilitator Guide, Discussion, and Real Talk blocks
  const guideBlocks = blocks.filter((b: any) => 
    ['facilitator-guide', 'discussion', 'real-talk', 'arq-processing'].includes(b.blockType)
  );

  let learningSignals = [];
  try { learningSignals = JSON.parse(learner.profile?.learningSignals || '[]'); } catch(e) {}

  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiInsight, setAiInsight] = useState(learner.profile?.aiInsights || null);

  const generateInsight = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id })
      });
      if (!res.ok) throw new Error('Failed to generate insight');
      const data = await res.json();
      setAiInsight(data.insight);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <header className="mb-8">
        <button onClick={() => router.push('/facilitator')} className="btn btn-ghost mb-2">&larr; Back to Dashboard</button>
        <div className="badge badge-outline mb-2" style={{ color: 'hsl(var(--text-muted))' }}>Session Prep</div>
        <h1 style={{ color: 'hsl(var(--accent-blue))' }}>{learner.name || learner.email}</h1>
      </header>

      <div className="flex gap-lg" style={{ flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN: BEFORE (Context) */}
        <div className="flex flex-col gap-sm" style={{ flex: '1', minWidth: '300px' }}>
          
          <section className="surface" style={{ borderColor: 'hsl(var(--accent-blue))' }}>
            <div className="badge badge-outline mb-4" style={{ borderColor: 'hsl(var(--accent-blue))', color: 'hsl(var(--accent-blue))' }}>AI Co-Pilot</div>
            
            {aiInsight ? (
              <div style={{ whiteSpace: 'pre-wrap', color: 'hsl(var(--text-primary))', lineHeight: '1.6' }}>
                {aiInsight}
                <button onClick={generateInsight} className="btn btn-ghost text-xs mt-4" disabled={generatingAI}>
                  {generatingAI ? 'Regenerating...' : 'Regenerate Insight'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-secondary mb-4">No AI insight has been generated for this learner yet.</p>
                <button onClick={generateInsight} className="btn btn-primary" style={{ backgroundColor: 'hsl(var(--accent-blue))' }} disabled={generatingAI}>
                  {generatingAI ? 'Generating...' : 'Generate Insight'}
                </button>
              </div>
            )}
          </section>

          <section className="surface">
            <div className="badge badge-outline mb-4" style={{ borderColor: 'hsl(var(--text-muted))', color: 'hsl(var(--text-muted))' }}>BEFORE: Learner Context</div>
            <h2 className="mb-4">Profile Intelligence</h2>
            
            <div className="mb-4">
              <p className="text-sm text-secondary mb-1">Life Context</p>
              <p style={{ fontSize: '1.125rem' }}>{learner.profile?.context || 'No context recorded.'}</p>
            </div>

            {learner.profile?.primaryQuestion && (
              <div className="mb-4">
                <p className="text-sm text-secondary mb-1">Primary Question</p>
                <p style={{ fontSize: '1.125rem', color: 'hsl(var(--accent-gold))', fontStyle: 'italic' }}>"{learner.profile.primaryQuestion}"</p>
              </div>
            )}

            {learningSignals.length > 0 && (
              <div>
                <p className="text-sm text-secondary mb-2">Learning Signals</p>
                <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                  {learningSignals.map((sig: string, idx: number) => (
                    <span key={idx} className="badge" style={{ background: 'hsla(var(--accent-blue), 0.1)', color: 'hsl(var(--accent-blue))' }}>{sig}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="surface" style={{ background: 'hsla(var(--accent-green), 0.05)', borderColor: 'hsla(var(--accent-green), 0.2)' }}>
            <div className="badge badge-outline mb-4" style={{ borderColor: 'hsl(var(--accent-green))', color: 'hsl(var(--accent-green))' }}>AFTER: Capture Discovery</div>
            <p className="text-sm text-secondary mb-4">
              What did {learner.name || 'the learner'} discover today? (Coming in V2)
            </p>
            <textarea 
              className="input mb-2"
              placeholder="Record notes, prayer requests, or epiphanies here..."
              rows={4}
              style={{ resize: 'none' }}
              disabled
            />
            <button className="btn" style={{ background: 'hsl(var(--bg-surface-hover))', color: 'hsl(var(--text-muted))', cursor: 'not-allowed' }}>Save Notes (V2)</button>
          </section>

        </div>

        {/* RIGHT COLUMN: DURING (Lesson Guides) */}
        <div className="flex flex-col gap-sm" style={{ flex: '2', minWidth: '400px' }}>
          
          <section className="surface h-100" style={{ minHeight: '100%' }}>
            <div className="badge badge-outline mb-4" style={{ borderColor: 'hsl(var(--accent-gold))', color: 'hsl(var(--accent-gold))' }}>DURING: Session Guide</div>
            
            {activeJourney ? (
              <>
                <h2 className="mb-1">{activeJourney.topic?.title}</h2>
                <p className="text-secondary mb-8">Lesson: {currentLesson?.title}</p>
                
                {guideBlocks.length === 0 ? (
                  <p className="text-muted" style={{ fontStyle: 'italic' }}>No specific facilitator notes or discussion questions for this lesson.</p>
                ) : (
                  <div className="flex flex-col gap-sm">
                    {guideBlocks.map((block: any) => {
                      let content: any = {};
                      try { content = JSON.parse(block.content); } catch(e) {}

                      return (
                        <div key={block.id} className="surface" style={{ borderLeft: `4px solid ${getBlockColor(block.blockType)}`, background: 'hsl(var(--bg-base))' }}>
                          <div className="badge mb-2" style={{ background: 'hsla(var(--text-primary), 0.1)', color: 'hsl(var(--text-secondary))' }}>
                            {block.blockType.replace('-', ' ')}
                          </div>
                          
                          {block.blockType === 'facilitator-guide' && (
                            <>
                              {content.internalGoal && <p className="mb-2"><strong style={{ color: 'hsl(var(--text-primary))' }}>Goal:</strong> {content.internalGoal}</p>}
                              {content.guardrails && <p style={{ color: 'hsl(var(--accent-red))' }}><strong>Guardrail:</strong> {content.guardrails}</p>}
                              {content.text && <p className="mt-2 text-secondary">{content.text}</p>}
                            </>
                          )}

                          {block.blockType === 'discussion' && (
                            <>
                              <p className="mb-2" style={{ fontSize: '1.25rem', color: 'hsl(var(--text-primary))', fontWeight: 500 }}>"{content.question}"</p>
                              {content.discoveryTarget && <p className="text-sm mb-1" style={{ color: 'hsl(var(--accent-green))' }}><strong>Target Discovery:</strong> {content.discoveryTarget}</p>}
                              {content.followUp && <p className="text-sm text-secondary"><strong>Follow-up:</strong> {content.followUp}</p>}
                            </>
                          )}

                          {block.blockType === 'real-talk' && (
                            <p style={{ fontSize: '1.125rem', color: 'hsl(var(--accent-gold))', fontStyle: 'italic' }}>{content.text}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="text-secondary">This learner is not currently enrolled in an active journey.</p>
            )}
          </section>

        </div>

      </div>
    </div>
  );
}

function getBlockColor(type: string) {
  switch(type) {
    case 'facilitator-guide': return 'hsl(var(--accent-purple))';
    case 'discussion': return 'hsl(var(--accent-blue))';
    case 'real-talk': return 'hsl(var(--accent-red))';
    case 'arq-processing': return 'hsl(var(--accent-gold))';
    default: return 'hsl(var(--border-light))';
  }
}
