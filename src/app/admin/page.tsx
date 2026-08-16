'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPortal() {
  const router = useRouter();
  const [reports, setReports] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('STUDENT');

  const fetchData = async () => {
    try {
      const [reportsRes, usersRes] = await Promise.all([
        fetch('/api/admin/reports'),
        fetch('/api/admin/users')
      ]);

      if (!reportsRes.ok || !usersRes.ok) throw new Error('Failed to fetch data');

      const reportsData = await reportsRes.json();
      const usersData = await usersRes.json();

      setReports(reportsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(`User ${inviteEmail} invited/created successfully with default password "arq123"`);
      setInviteEmail('');
      setInviteName('');
      fetchData(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <header className="flex justify-between items-center mb-8">
        <h1 style={{ color: 'hsl(var(--accent-purple))' }}>Organization Admin</h1>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </header>

      {loading && <p className="text-secondary">Loading dashboard...</p>}
      {error && <p style={{ color: 'hsl(var(--accent-red))' }}>{error}</p>}

      {!loading && reports && (
        <div className="flex gap-lg" style={{ flexWrap: 'wrap' }}>
          
          {/* LEFT: Overview & Invites */}
          <div className="flex flex-col gap-md" style={{ flex: '1', minWidth: '350px' }}>
            
            {/* Reports Section */}
            <section className="surface">
              <h2 className="mb-4">Overview</h2>
              <div className="grid grid-cols-auto gap-sm" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="surface" style={{ background: 'hsl(var(--bg-base))', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--accent-purple))' }}>{reports.totalStudents}</div>
                  <div className="text-xs text-secondary uppercase" style={{ letterSpacing: '1px' }}>Total Students</div>
                </div>
                <div className="surface" style={{ background: 'hsl(var(--bg-base))', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--accent-purple))' }}>{reports.totalFacilitators}</div>
                  <div className="text-xs text-secondary uppercase" style={{ letterSpacing: '1px' }}>Facilitators</div>
                </div>
                <div className="surface" style={{ background: 'hsl(var(--bg-base))', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--accent-purple))' }}>{reports.activeJourneys}</div>
                  <div className="text-xs text-secondary uppercase" style={{ letterSpacing: '1px' }}>Active Journeys</div>
                </div>
                <div className="surface" style={{ background: 'hsl(var(--bg-base))', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--accent-purple))' }}>{reports.completedJourneys}</div>
                  <div className="text-xs text-secondary uppercase" style={{ letterSpacing: '1px' }}>Completed</div>
                </div>
              </div>
            </section>

            {/* Invite Section */}
            <section className="surface">
              <h2 className="mb-2">Invite User</h2>
              <p className="text-sm text-secondary mb-4">For V1 testing, this immediately creates an account with password <code>arq123</code>.</p>
              
              <form onSubmit={handleInvite} className="flex flex-col gap-sm">
                <input 
                  type="text" 
                  className="input"
                  placeholder="Name" 
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                />
                <input 
                  type="email" 
                  className="input"
                  placeholder="Email" 
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required 
                />
                <select 
                  className="input"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACILITATOR">Facilitator</option>
                  <option value="MAKER">Maker</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary mt-2" style={{ backgroundColor: 'hsl(var(--accent-purple))' }}>
                  Send Invite / Create
                </button>
              </form>
            </section>

          </div>

          {/* RIGHT: User Directory */}
          <div style={{ flex: '2', minWidth: '400px' }}>
            <section className="surface h-100" style={{ minHeight: '100%' }}>
              <h2 className="mb-4">User Directory</h2>
              
              <div className="flex flex-col gap-sm">
                {users.map(user => (
                  <div key={user.id} className="surface flex justify-between items-center" style={{ background: 'hsl(var(--bg-base))', padding: '1rem' }}>
                    <div>
                      <div className="font-semibold">{user.name || 'Unnamed'}</div>
                      <div className="text-sm text-secondary">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-sm">
                      <span className="badge badge-outline" style={{ borderColor: getRoleColor(user.role), color: getRoleColor(user.role) }}>
                        {user.role}
                      </span>
                      <button className="btn btn-ghost text-sm">Manage</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      )}
    </div>
  );
}

function getRoleColor(role: string) {
  switch(role) {
    case 'ADMIN': return 'hsl(var(--accent-purple))';
    case 'MAKER': return 'hsl(var(--accent-gold))';
    case 'FACILITATOR': return 'hsl(var(--accent-blue))';
    case 'STUDENT': return 'hsl(var(--accent-green))';
    default: return 'hsl(var(--text-secondary))';
  }
}
