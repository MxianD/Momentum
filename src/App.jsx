import React, { useMemo, useState } from 'react'
import { StoreProvider, useStore } from './state.jsx'

function AppShell() {
  const { state, dispatch } = useStore()
  const { user } = state
  const tabs = ['Home','Challenges','Community','Resources','Profile']

  return (
    <div className="container">
      <header className="appbar">
        <div className="brand">
          <div className="brand-badge">M</div>
          <div>
            <div style={{fontWeight:800}}>Momentum</div>
            <small>Learn life skills together</small>
          </div>
        </div>
        <div className="statbar">
          <div className="pill"><strong>XP</strong><span>{user.xp}</span></div>
          <div className="pill"><strong>Streak</strong><span>{user.streak}🔥</span></div>
          <div className="pill"><strong>Coins</strong><span>{user.coins}🪙</span></div>
          <div className="pill"><strong>User</strong><span>{user.name}</span></div>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {tabs.map(t => (
          <button key={t}
            className={'tab ' + (state.activeTab===t ? 'active':'')}
            onClick={() => dispatch({ type: 'tab', tab: t })}
            role="tab" aria-selected={state.activeTab===t}>
            {t}
          </button>
        ))}
      </nav>

      <main style={{marginTop: 16}}>
        {state.activeTab === 'Home' && <Home />}
        {state.activeTab === 'Challenges' && <Challenges />}
        {state.activeTab === 'Community' && <Community />}
        {state.activeTab === 'Resources' && <Resources />}
        {state.activeTab === 'Profile' && <Profile />}
      </main>
    </div>
  )
}

function Home() {
  const { state } = useStore()
  const next = useMemo(() => state.challenges.find(c => !state.completed[c.id]), [state])
  return (
    <section className="grid">
      <div className="card">
        <h3>Welcome 👋</h3>
        <p>Pick one tiny action today. Momentum rewards consistent, community-backed effort.</p>
        <p><span className="kbd">Tip</span> Press <strong>Challenges</strong> to start.</p>
      </div>
      <div className="card">
        <h3>Next up</h3>
        {next ? (
          <>
            <p><strong>{next.title}</strong></p>
            <small>{next.description}</small>
          </>
        ) : <p>You're all caught up — add or reset to keep going.</p>}
      </div>
      <ProgressCard />
    </section>
  )
}

function ProgressCard() {
  const { state } = useStore()
  const done = Object.keys(state.completed).length
  const total = state.challenges.length
  const pct = total ? Math.round((done/total)*100) : 0
  return (
    <div className="card">
      <h3>Progress</h3>
      <p>{done} of {total} challenges complete ({pct}%).</p>
      <div style={{height:10, background:'rgba(255,255,255,0.08)', borderRadius:999}}>
        <div style={{height:'100%', width: pct+'%', background:'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius:999}} />
      </div>
    </div>
  )
}

function Challenges() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState('All')
  const cats = ['All', ...Array.from(new Set(state.challenges.map(c=>c.category)))]
  const list = state.challenges.filter(c => filter==='All' || c.category===filter)

  return (
    <section>
      <div className="card" style={{marginBottom:16}}>
        <h3>Challenges</h3>
        <p>Pick small, clear actions. Earn XP and coins.</p>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
          {cats.map(c => (
            <button key={c} className={'tab '+(filter===c?'active':'')} onClick={()=>setFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid">
        {list.map(ch => (
          <article className="card" key={ch.id}>
            <h3>{ch.title}</h3>
            <small>{ch.category} • {ch.points} XP</small>
            <ul>
              {ch.steps.map((s,i)=>(<li key={i}><small>{s}</small></li>))}
            </ul>
            <p>{ch.description}</p>
            <div style={{display:'flex', gap:8}}>
              <button className="btn"
                disabled={Boolean(state.completed[ch.id])}
                onClick={()=>dispatch({ type:'complete', id: ch.id, points: ch.points })}>
                {state.completed[ch.id] ? 'Completed ✓' : 'Complete'}
              </button>
              <button className="btn ghost" onClick={()=>navigator.clipboard.writeText(`#Momentum ${ch.title}`)}>Share</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Community() {
  const { state, dispatch } = useStore()
  const [text, setText] = useState('')
  const post = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    dispatch({ type:'comment', comment: { id: crypto.randomUUID(), user: state.user.name, text: trimmed, createdAt: Date.now() }})
    setText('')
  }
  return (
    <section className="grid">
      <div className="card">
        <h3>Peer Feed</h3>
        <p>Share wins, ask for support, or start a mini-challenge.</p>
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <input className="input" placeholder="Say something helpful..." value={text} onChange={e=>setText(e.target.value)} />
          <button className="btn" onClick={post}>Post</button>
        </div>
        <hr/>
        {state.comments.slice().reverse().map(c => (
          <div key={c.id} style={{marginBottom:12}}>
            <strong>{c.user}</strong> <small>• {timeAgo(c.createdAt)}</small>
            <p style={{margin:'6px 0'}}>{c.text}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Weekly Mini-Quest</h3>
        <p>Pick one friend and swap your go-to cheap dinner recipe.</p>
        <button className="btn ghost" onClick={()=>alert('Invite link copied!')}>Copy invite</button>
      </div>
    </section>
  )
}

function Resources() {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const list = state.resources.filter(r => r.title.toLowerCase().includes(q.toLowerCase()) || r.tag.toLowerCase().includes(q.toLowerCase()))
  return (
    <section>
      <div className="card" style={{marginBottom:16}}>
        <h3>Knowledge Library</h3>
        <input className="input" placeholder="Search resources..." value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      <div className="grid">
        {list.map(r => (
          <a key={r.id} className="card" href={r.url} target="_blank" rel="noreferrer">
            <h3>{r.title}</h3>
            <small>Tag: {r.tag}</small>
          </a>
        ))}
      </div>
    </section>
  )
}

function Profile() {
  const { state, dispatch } = useStore()
  const [name, setName] = useState(state.user.name)
  return (
    <section className="grid">
      <div className="card">
        <h3>Profile</h3>
        <label><small>Display name</small></label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} />
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button className="btn" onClick={()=>dispatch({ type:'hydrate', payload: { ...state, user: { ...state.user, name }}})}>Save</button>
          <button className="btn ghost" onClick={()=>dispatch({ type:'reset' })}>Reset all</button>
        </div>
      </div>
      <div className="card">
        <h3>Badges</h3>
        <p><span className="kbd">Starter</span> <span className="kbd">Budget-Buddy</span> <span className="kbd">Meal Prepper</span></p>
        <small>Badges unlock as your XP grows.</small>
      </div>
    </section>
  )
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return s + 's ago'
  const m = Math.floor(s/60)
  if (m < 60) return m + 'm ago'
  const h = Math.floor(m/60)
  if (h < 24) return h + 'h ago'
  const d = Math.floor(h/24)
  return d + 'd ago'
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  )
}
