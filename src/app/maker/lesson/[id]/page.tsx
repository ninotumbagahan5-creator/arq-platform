'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LessonEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Block Builder State
  const [blockType, setBlockType] = useState('scripture');
  const [blockContent, setBlockContent] = useState('');
  
  // Specific fields for specialized blocks
  const [scriptureRef, setScriptureRef] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  
  const [question, setQuestion] = useState('');
  const [targetDiscovery, setTargetDiscovery] = useState('');
  
  const [internalGoal, setInternalGoal] = useState('');
  
  const topicId = params.id;

  const fetchTopic = async () => {
    try {
      // In a real app we'd have a specific GET /api/maker/topic/[id]
      // For V1 we can refetch curriculum and filter, or just build the specific endpoint.
      // Wait, we built /api/maker/lesson which expects a POST to create a block.
      // Actually we need a way to fetch the lesson. Let's just fetch all curriculum and filter.
      const res = await fetch('/api/maker/curriculum');
      const data = await res.json();
      const currentTopic = data.topics.find((t: any) => t.id === topicId);
      if (!currentTopic) throw new Error('Topic not found');
      
      // We need lessons inside this topic. The curriculum API includes them!
      setTopic(currentTopic);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const addBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // We assume the topic has at least 1 lesson. If not, the API creates one.
    // Let's construct the JSON payload based on blockType
    let payload: any = {};
    
    if (blockType === 'scripture') {
      payload = { reference: scriptureRef, text: scriptureText };
    } else if (blockType === 'discussion') {
      payload = { question, discoveryTarget: targetDiscovery };
    } else if (blockType === 'facilitator-guide') {
      payload = { internalGoal, text: blockContent };
    } else {
      payload = { text: blockContent };
    }

    try {
      const res = await fetch('/api/maker/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          title: 'Lesson 1', // Hardcoded for MVP
          blockType,
          content: JSON.stringify(payload)
        })
      });
      
      if (!res.ok) throw new Error('Failed to add block');
      
      // Reset form
      setBlockContent('');
      setScriptureRef(''); setScriptureText('');
      setQuestion(''); setTargetDiscovery('');
      setInternalGoal('');
      
      fetchTopic();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="container"><p className="text-secondary">Loading lesson editor...</p></div>;
  if (error) return <div className="container"><p style={{ color: 'hsl(var(--accent-red))' }}>{error}</p></div>;
  if (!topic) return null;

  const firstLesson = topic.lessons[0] || { blocks: [] };

  return (
    <div className="container flex gap-lg">
      
      {/* LEFT COLUMN: Lesson Flow (Preview) */}
      <div style={{ flex: '1' }}>
        <button onClick={() => router.push('/maker')} className="btn btn-ghost mb-4">&larr; Back to Curriculum</button>
        <h2 className="mb-2" style={{ color: 'hsl(var(--accent-gold))' }}>{topic.title}</h2>
        <p className="text-secondary mb-8">Lesson 1 Flow</p>

        <div className="flex flex-col gap-sm">
          {firstLesson.blocks.length === 0 && <p className="text-muted" style={{ fontStyle: 'italic' }}>No blocks in this lesson yet.</p>}
          
          {firstLesson.blocks.map((block: any, idx: number) => {
            let content: any = {};
            try { content = JSON.parse(block.content); } catch(e) {}
            
            return (
              <div key={block.id} className="surface" style={{ borderLeft: `4px solid ${getBlockColor(block.blockType)}` }}>
                <div className="badge mb-2" style={{ background: 'hsla(var(--text-primary), 0.1)' }}>{idx + 1}. {block.blockType}</div>
                
                {block.blockType === 'scripture' && (
                  <div>
                    <strong style={{ display: 'block', color: 'hsl(var(--accent-blue))' }}>{content.reference}</strong>
                    <p className="text-secondary">"{content.text}"</p>
                  </div>
                )}
                
                {block.blockType === 'discussion' && (
                  <div>
                    <strong style={{ display: 'block', color: 'hsl(var(--accent-green))' }}>Q: {content.question}</strong>
                    {content.discoveryTarget && <p className="text-sm text-muted mt-2">Target: {content.discoveryTarget}</p>}
                  </div>
                )}

                {block.blockType === 'facilitator-guide' && (
                  <div>
                    <strong style={{ display: 'block', color: 'hsl(var(--accent-purple))' }}>Facilitator Note</strong>
                    <p className="text-secondary">{content.text}</p>
                  </div>
                )}

                {['story', 'real-talk', 'text'].includes(block.blockType) && (
                  <p className="text-secondary">{content.text}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Block Builder */}
      <div style={{ flex: '1' }}>
        <div className="surface" style={{ position: 'sticky', top: '2rem' }}>
          <h2 className="mb-4">Add Content Block</h2>
          
          <form onSubmit={addBlock} className="flex flex-col gap-sm">
            <div>
              <label className="label">Block Type</label>
              <select className="input" value={blockType} onChange={e => setBlockType(e.target.value)}>
                <option value="scripture">Scripture</option>
                <option value="story">Story</option>
                <option value="discussion">Discussion Question</option>
                <option value="real-talk">Real Talk</option>
                <option value="facilitator-guide">Facilitator Guide (Hidden from student)</option>
              </select>
            </div>

            {blockType === 'scripture' && (
              <>
                <div>
                  <label className="label">Reference (e.g. John 3:16)</label>
                  <input type="text" className="input" value={scriptureRef} onChange={e => setScriptureRef(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Scripture Text</label>
                  <textarea className="input" rows={4} value={scriptureText} onChange={e => setScriptureText(e.target.value)} required />
                </div>
              </>
            )}

            {blockType === 'discussion' && (
              <>
                <div>
                  <label className="label">Question for Student</label>
                  <input type="text" className="input" value={question} onChange={e => setQuestion(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Target Discovery (For Facilitator)</label>
                  <input type="text" className="input" value={targetDiscovery} onChange={e => setTargetDiscovery(e.target.value)} />
                </div>
              </>
            )}

            {blockType === 'facilitator-guide' && (
              <>
                <div>
                  <label className="label">Internal Goal</label>
                  <input type="text" className="input" value={internalGoal} onChange={e => setInternalGoal(e.target.value)} />
                </div>
                <div>
                  <label className="label">Notes / Instructions</label>
                  <textarea className="input" rows={4} value={blockContent} onChange={e => setBlockContent(e.target.value)} required />
                </div>
              </>
            )}

            {['story', 'real-talk', 'text'].includes(blockType) && (
              <div>
                <label className="label">Content Text</label>
                <textarea className="input" rows={6} value={blockContent} onChange={e => setBlockContent(e.target.value)} required />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Append Block to Lesson</button>
          </form>
        </div>
      </div>
      
    </div>
  );
}

function getBlockColor(type: string) {
  switch(type) {
    case 'scripture': return 'hsl(var(--accent-blue))';
    case 'discussion': return 'hsl(var(--accent-green))';
    case 'story': return 'hsl(var(--accent-gold))';
    case 'real-talk': return 'hsl(var(--accent-red))';
    case 'facilitator-guide': return 'hsl(var(--accent-purple))';
    default: return 'hsl(var(--border-light))';
  }
}
