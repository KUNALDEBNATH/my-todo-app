import { useState, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const STRIPE_COLORS = ['#ff6b6b','#4ecdc4','#ffe66d','#a29bfe','#fd79a8','#55efc4','#fdcb6e','#74b9ff'];
const PRIORITIES = {
  low:    { label: 'low',    color: '#4ecdc4', bg: '#e8fffe' },
  medium: { label: 'medium', color: '#fdcb6e', bg: '#fffbe8' },
  high:   { label: 'high',   color: '#ff6b6b', bg: '#fff0f0' },
};
const CATEGORIES = ['📋 general','💼 work','🏠 home','🛒 shopping','💪 health','📚 study','🎯 goals','✨ personal'];

// ─── UTILS ───────────────────────────────────────────────────────
function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) { h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0; }
  return h.toString(36) + pw.length;
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
  if (d < 86400000) return Math.floor(d / 3600000) + 'h ago';
  return Math.floor(d / 86400000) + 'd ago';
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── LOCAL STORAGE DB ────────────────────────────────────────────
async function dbGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
async function dbSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val)); return true;
}
async function dbDel(key) {
  localStorage.removeItem(key); return true;
}

// ─── CONFETTI ────────────────────────────────────────────────────
function spawnConfetti(x, y) {
  const colors = ['#ff6b6b','#4ecdc4','#ffe66d','#a29bfe','#fd79a8','#55efc4'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 80;
    Object.assign(el.style, {
      position: 'fixed',
      left: x + 'px',
      top: y + 'px',
      width: (6 + Math.random() * 7) + 'px',
      height: (6 + Math.random() * 7) + 'px',
      background: colors[i % colors.length],
      borderRadius: Math.random() > .5 ? '50%' : '3px',
      pointerEvents: 'none',
      zIndex: 9999,
      transform: 'translate(-50%,-50%)',
      transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `translate(${Math.cos(angle)*dist - 8}px, ${Math.sin(angle)*dist - 8}px) rotate(${Math.random()*360}deg) scale(0)`;
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 900);
  }
}

// ─── GLOBAL STYLES ───────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Nunito:ital,wght@0,400;0,600;0,800;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #f5f2ee;
    font-family: 'Nunito', sans-serif;
    min-height: 100vh;
    background-image: radial-gradient(circle, #d8d0ee 1px, transparent 1px);
    background-size: 28px 28px;
  }
  input, button, select, textarea { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #c0b0e0; border-radius: 3px; }
  @keyframes slideUp  { from { opacity:0; transform:translateY(20px) scale(.96); } to { opacity:1; transform:none; } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes bounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes spin     { to { transform:rotate(360deg) } }
`;

// ─── TOAST ───────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  const colors = { success: '#2ecc71', error: '#ff6b6b', info: '#74b9ff' };
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      background:'#1a1a2e', color:'#fff', borderRadius:14, padding:'13px 22px',
      fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.9rem',
      boxShadow:'4px 4px 0 rgba(0,0,0,0.2)',
      borderLeft:`5px solid ${colors[type] || colors.info}`,
      animation:'slideUp 0.3s ease',
      display:'flex', alignItems:'center', gap:10, maxWidth:320,
    }}>
      <span>{type==='success' ? '✅' : type==='error' ? '❌' : 'ℹ️'}</span>
      <span>{msg}</span>
    </div>
  );
}

// ─── FIELD ───────────────────────────────────────────────────────
function Field({ label, type='text', value, onChange, placeholder, error, icon }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display:'block', fontWeight:700, fontSize:'0.82rem', marginBottom:6, color:'#1a1a2e', letterSpacing:'0.03em' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:'1.1rem', pointerEvents:'none' }}>
            {icon}
          </span>
        )}
        <input
          type={type === 'password' ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width:'100%', background:'#fff',
            border:`2.5px solid ${error ? '#ff6b6b' : '#1a1a2e'}`,
            borderRadius:13,
            padding:`14px ${type==='password' ? '44px' : '16px'} 14px ${icon ? '44px' : '16px'}`,
            fontSize:'1rem', fontWeight:600, color:'#1a1a2e', outline:'none',
            boxShadow:`3px 3px 0 ${error ? '#ff6b6b' : '#1a1a2e'}`,
            transition:'box-shadow .2s, transform .2s',
          }}
          onFocus={e => { e.target.style.boxShadow='5px 5px 0 #a29bfe'; e.target.style.transform='translate(-1px,-1px)'; }}
          onBlur={e  => { e.target.style.boxShadow=`3px 3px 0 ${error?'#ff6b6b':'#1a1a2e'}`; e.target.style.transform='none'; }}
        />
        {type === 'password' && (
          <button onClick={() => setShow(!show)} type="button" style={{
            position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem', padding:4,
          }}>{show ? '🙈' : '👁️'}</button>
        )}
      </div>
      {error && <p style={{ color:'#ff6b6b', fontSize:'0.78rem', marginTop:5, fontWeight:700 }}>{error}</p>}
    </div>
  );
}

// ─── PILL ────────────────────────────────────────────────────────
function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? '#1a1a2e' : '#fff',
      border: `2px solid ${active ? '#1a1a2e' : '#e0d8f0'}`,
      borderRadius: 100, padding: '6px 16px',
      fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.8rem',
      color: active ? '#fff' : '#9090a8',
      cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap',
    }}>{children}</button>
  );
}

// ─── AUTH SCREEN ─────────────────────────────────────────────────
function AuthScreen({ onLogin, toast }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (mode==='signup' && !name.trim()) e.name = "what should we call you?";
    if (!email.trim() || !email.includes('@')) e.email = "need a valid email 👀";
    if (!pw || pw.length < 6) e.pw = "at least 6 characters please";
    if (mode==='signup' && pw !== pw2) e.pw2 = "passwords don't match!";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setLoading(true);

    const key = 'user:' + email.toLowerCase().trim();

    if (mode === 'signup') {
      const existing = await dbGet(key);
      if (existing) { setErrors({ email: 'account already exists! try logging in' }); setLoading(false); return; }
      const user = { email: email.toLowerCase().trim(), name: name.trim(), pwHash: hashPassword(pw), createdAt: Date.now() };
      await dbSet(key, user);
      toast('🎉 account created! welcome ' + user.name, 'success');
      onLogin(user);
    } else {
      const user = await dbGet(key);
      if (!user || user.pwHash !== hashPassword(pw)) {
        setErrors({ pw: 'wrong email or password 🤔' }); setLoading(false); return;
      }
      toast('👋 welcome back, ' + user.name + '!', 'success');
      onLogin(user);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fadeIn 0.4s ease' }}>
      <div style={{
        background:'#fff', border:'2.5px solid #1a1a2e', borderRadius:24,
        boxShadow:'6px 6px 0 #1a1a2e', padding:'40px 36px', width:'100%', maxWidth:440,
        animation:'slideUp 0.4s ease',
      }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            display:'inline-block', background:'#ffe66d', border:'2.5px solid #1a1a2e',
            borderRadius:16, padding:'10px 22px', marginBottom:16,
            transform:'rotate(-2deg)', fontFamily:"'Syne',sans-serif",
            fontWeight:800, fontSize:'0.8rem', letterSpacing:'0.1em', textTransform:'uppercase',
          }}>✌️ your list, no stress</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2.2rem', lineHeight:1, color:'#1a1a2e' }}>
            {mode === 'login' ? 'welcome back' : 'join the vibe'}
          </h1>
          <p style={{ color:'#9090a8', marginTop:8, fontSize:'0.95rem', fontStyle:'italic' }}>
            {mode === 'login' ? 'sign in to your tasks 🔐' : 'create your account ✨'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && <Field label="your name" icon="😎" value={name} onChange={setName} placeholder="what do people call you?" error={errors.name} />}
          <Field label="email" icon="📧" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} />
          <Field label="password" icon="🔑" type="password" value={pw} onChange={setPw} placeholder="at least 6 chars" error={errors.pw} />
          {mode === 'signup' && <Field label="confirm password" icon="🔒" type="password" value={pw2} onChange={setPw2} placeholder="same as above" error={errors.pw2} />}

          <button type="submit" disabled={loading} style={{
            width:'100%', background:'#1a1a2e', color:'#fff', border:'2.5px solid #1a1a2e',
            borderRadius:14, padding:'16px', marginTop:8,
            fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1rem',
            cursor: loading ? 'wait' : 'pointer', letterSpacing:'0.05em',
            boxShadow:'4px 4px 0 #ff6b6b', transition:'all .15s',
          }}
            onMouseEnter={e => { if (!loading) { e.target.style.transform='translate(-2px,-2px)'; e.target.style.boxShadow='6px 6px 0 #ff6b6b'; }}}
            onMouseLeave={e => { e.target.style.transform='none'; e.target.style.boxShadow='4px 4px 0 #ff6b6b'; }}
          >
            {loading ? '⏳ hold on...' : mode==='login' ? '🚀 sign in' : '✨ create account'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:24, color:'#9090a8', fontSize:'0.9rem' }}>
          {mode === 'login' ? "don't have an account?" : 'already have one?'}{' '}
          <button onClick={() => { setMode(mode==='login'?'signup':'login'); setErrors({}); }} style={{
            background:'none', border:'none', color:'#a29bfe', fontWeight:800,
            cursor:'pointer', fontSize:'0.9rem', textDecoration:'underline', textUnderlineOffset:3,
          }}>
            {mode === 'login' ? 'sign up →' : 'log in →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TASK MODAL ──────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose }) {
  const [text, setText] = useState(task?.text || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [category, setCategory] = useState(task?.category || CATEGORIES[0]);
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [notes, setNotes] = useState(task?.notes || '');

  function handleSave() {
    if (!text.trim()) return;
    onSave({ text: text.trim(), priority, category, dueDate, notes });
  }

  return (
    <div
      style={{
        position:'fixed', inset:0, background:'rgba(26,26,46,0.6)', zIndex:1000,
        display:'flex', alignItems:'center', justifyContent:'center', padding:20,
        animation:'fadeIn .2s ease', backdropFilter:'blur(3px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:'#fff', border:'2.5px solid #1a1a2e', borderRadius:22,
        boxShadow:'6px 6px 0 #1a1a2e', padding:32, width:'100%', maxWidth:480,
        animation:'slideUp .3s ease', maxHeight:'90vh', overflowY:'auto',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem' }}>
            {task ? '✏️ edit task' : '✨ new task'}
          </h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer', color:'#9090a8', padding:4 }}>✕</button>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontWeight:700, fontSize:'0.82rem', marginBottom:6 }}>what needs doing? *</label>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="describe your task..." rows={3}
            style={{
              width:'100%', border:'2.5px solid #1a1a2e', borderRadius:13, padding:'12px 16px',
              fontSize:'1rem', fontWeight:600, color:'#1a1a2e', outline:'none',
              boxShadow:'3px 3px 0 #1a1a2e', resize:'vertical', fontFamily:'inherit',
            }}
            onFocus={e => { e.target.style.boxShadow='5px 5px 0 #a29bfe'; }}
            onBlur={e =>  { e.target.style.boxShadow='3px 3px 0 #1a1a2e'; }}
          />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <label style={{ display:'block', fontWeight:700, fontSize:'0.82rem', marginBottom:6 }}>priority</label>
            <div style={{ display:'flex', gap:6 }}>
              {Object.entries(PRIORITIES).map(([k, v]) => (
                <button key={k} onClick={() => setPriority(k)} style={{
                  flex:1, padding:'8px 4px',
                  border:`2.5px solid ${priority===k ? v.color : '#e0d8f0'}`,
                  borderRadius:10,
                  background: priority===k ? v.bg : '#fff',
                  color: priority===k ? v.color : '#9090a8',
                  fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.72rem',
                  cursor:'pointer', transition:'all .15s',
                }}>{v.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontWeight:700, fontSize:'0.82rem', marginBottom:6 }}>due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{
              width:'100%', border:'2.5px solid #1a1a2e', borderRadius:10, padding:'9px 12px',
              fontSize:'0.88rem', fontWeight:600, color:'#1a1a2e', outline:'none',
              boxShadow:'2px 2px 0 #1a1a2e', fontFamily:'inherit',
            }} />
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontWeight:700, fontSize:'0.82rem', marginBottom:8 }}>category</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding:'5px 12px',
                border:`2px solid ${category===c ? '#1a1a2e' : '#e0d8f0'}`,
                borderRadius:100,
                background: category===c ? '#1a1a2e' : '#fff',
                color: category===c ? '#fff' : '#9090a8',
                fontSize:'0.78rem', fontWeight:700, cursor:'pointer', transition:'all .15s',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontWeight:700, fontSize:'0.82rem', marginBottom:6 }}>notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="any extra details..." rows={2}
            style={{
              width:'100%', border:'2.5px solid #e0d8f0', borderRadius:13, padding:'10px 14px',
              fontSize:'0.9rem', color:'#1a1a2e', outline:'none', resize:'vertical', fontFamily:'inherit',
            }}
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{
            flex:1, padding:'14px', border:'2.5px solid #e0d8f0', borderRadius:13,
            background:'#fff', fontFamily:"'Syne',sans-serif", fontWeight:700, cursor:'pointer', color:'#9090a8',
          }}>cancel</button>
          <button onClick={handleSave} disabled={!text.trim()} style={{
            flex:2, padding:'14px', border:'2.5px solid #1a1a2e', borderRadius:13,
            background: text.trim() ? '#ff6b6b' : '#e0d8f0',
            color: text.trim() ? '#fff' : '#9090a8',
            fontFamily:"'Syne',sans-serif", fontWeight:800,
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            boxShadow: text.trim() ? '3px 3px 0 #1a1a2e' : 'none', fontSize:'1rem',
          }}>{task ? '💾 save changes' : '✨ add task'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── TASK CARD ───────────────────────────────────────────────────
function TaskCard({ task, onToggle, onDelete, onEdit, style: extraStyle }) {
  const p = PRIORITIES[task.priority] || PRIORITIES.medium;
  const isOverdue = task.dueDate && !task.done && new Date(task.dueDate) < new Date();
  const [hovered, setHovered] = useState(false);

  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:'relative', display:'flex', alignItems:'flex-start', gap:14,
        background:'#fff',
        border:`2.5px solid ${task.done ? '#e0d8f0' : '#1a1a2e'}`,
        borderRadius:18, padding:'16px 18px',
        boxShadow: task.done ? '2px 2px 0 #e0d8f0' : hovered ? '6px 6px 0 #1a1a2e' : '4px 4px 0 #1a1a2e',
        transform: task.done ? 'none' : hovered ? 'translate(-2px,-2px)' : 'none',
        transition:'all .2s', opacity: task.done ? 0.7 : 1,
        listStyle:'none', ...extraStyle,
      }}
    >
      {/* Color stripe */}
      <div style={{
        position:'absolute', left:0, top:14, bottom:14, width:5,
        borderRadius:'0 4px 4px 0',
        background: task.done ? '#e0d8f0' : STRIPE_COLORS[task.colorIdx % STRIPE_COLORS.length],
      }} />

      {/* Checkbox */}
      <button
        onClick={e => { onToggle(); if (!task.done) spawnConfetti(e.clientX, e.clientY); }}
        style={{
          width:26, height:26, borderRadius:8, flexShrink:0, marginTop:2,
          border:`2.5px solid ${task.done ? '#2ecc71' : '#1a1a2e'}`,
          background: task.done ? '#2ecc71' : '#fff',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'0.85rem', transition:'all .2s',
        }}
      >{task.done ? '✓' : ''}</button>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
          <span style={{
            fontSize:'1rem', fontWeight:700,
            color: task.done ? '#9090a8' : '#1a1a2e',
            textDecoration: task.done ? 'line-through' : 'none',
            textDecorationColor: '#9090a8',
            flex:1, minWidth:0, wordBreak:'break-word',
          }}>{esc(task.text)}</span>
          <span style={{
            background:p.bg, color:p.color,
            border:`1.5px solid ${p.color}`, borderRadius:100,
            padding:'1px 10px', fontSize:'0.72rem', fontWeight:800,
            fontFamily:"'Syne',sans-serif", whiteSpace:'nowrap', letterSpacing:'0.05em',
          }}>{p.label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.76rem', color:'#9090a8' }}>{task.category}</span>
          {task.dueDate && (
            <span style={{
              fontSize:'0.76rem', fontWeight:700,
              color: isOverdue ? '#ff6b6b' : '#9090a8',
              background: isOverdue ? '#fff0f0' : 'transparent',
              padding: isOverdue ? '1px 7px' : '0',
              borderRadius:100, border: isOverdue ? '1.5px solid #ff6b6b' : 'none',
            }}>
              {isOverdue ? '⚠️ ' : '📅 '}{task.dueDate}
            </span>
          )}
          <span style={{ fontSize:'0.74rem', color:'#c0b0d8' }}>{timeAgo(task.createdAt)}</span>
          {task.notes && <span style={{ fontSize:'0.74rem', color:'#9090a8' }}>📝 has notes</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:4, opacity: hovered ? 1 : 0, transition:'opacity .2s', flexShrink:0 }}>
        <button onClick={onEdit} style={{
          background:'none', border:'1.5px solid #e0d8f0', borderRadius:8,
          padding:'5px 9px', cursor:'pointer', fontSize:'0.85rem', color:'#9090a8',
        }} title="edit">✏️</button>
        <button onClick={onDelete} style={{
          background:'none', border:'1.5px solid #e0d8f0', borderRadius:8,
          padding:'5px 9px', cursor:'pointer', fontSize:'0.85rem', color:'#9090a8',
        }} title="delete">🗑️</button>
      </div>
    </li>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
function AppMain({ user, onLogout, toast }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const TASKS_KEY = 'tasks:' + user.email;

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const data = await dbGet(TASKS_KEY);
    setTasks(data || []);
    setLoading(false);
  }, [TASKS_KEY]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function saveTasks(next) {
    setTasks(next);
    await dbSet(TASKS_KEY, next);
  }

  async function addTask(data) {
    const t = {
      id: Date.now().toString(),
      ...data,
      done: false,
      createdAt: Date.now(),
      colorIdx: Math.floor(Math.random() * STRIPE_COLORS.length),
    };
    const next = [t, ...tasks];
    await saveTasks(next);
    toast('✅ task added!', 'success');
    setShowModal(false);
  }

  async function updateTask(data) {
    const next = tasks.map(t => t.id === editTask.id ? { ...t, ...data } : t);
    await saveTasks(next);
    toast('💾 task updated!', 'success');
    setEditTask(null);
  }

  async function toggleTask(id) {
    const next = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    await saveTasks(next);
    const t = next.find(x => x.id === id);
    if (t.done) toast('🎉 task done!', 'success');
  }

  async function deleteTask(id) {
    const next = tasks.filter(t => t.id !== id);
    await saveTasks(next);
    toast('🗑️ task removed', 'info');
  }

  async function clearDone() {
    const next = tasks.filter(t => !t.done);
    await saveTasks(next);
    toast('🧹 cleared done tasks!', 'info');
  }

  let visible = tasks.filter(t => {
    if (filter === 'active' && t.done) return false;
    if (filter === 'done' && !t.done) return false;
    if (catFilter !== 'all' && t.category !== catFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (search && !t.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  visible = [...visible].sort((a, b) => {
    if (sortBy === 'priority') { const o = {high:0,medium:1,low:2}; return o[a.priority]-o[b.priority]; }
    if (sortBy === 'due') { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return a.dueDate.localeCompare(b.dueDate); }
    return b.createdAt - a.createdAt;
  });

  const total = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;
  const pct = total ? Math.round(doneCount / total * 100) : 0;
  const overdue = tasks.filter(t => !t.done && t.dueDate && new Date(t.dueDate) < new Date()).length;

  const mood =
    total === 0      ? '😴 add something!' :
    pct === 100      ? '🏆 you did it!!'   :
    pct >= 90        ? '🎉 almost done!'   :
    pct >= 60        ? '⚡ crushing it'    :
    pct >= 30        ? '🔥 on a roll'      : '🙂 let\'s go';

  return (
    <div style={{ maxWidth:700, margin:'0 auto', padding:'40px 16px 100px', animation:'fadeIn .4s ease' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
        <div>
          <div style={{
            display:'inline-block', background:'#ffe66d', border:'2.5px solid #1a1a2e',
            borderRadius:100, padding:'4px 14px', marginBottom:10,
            transform:'rotate(-1.5deg)', fontFamily:"'Syne',sans-serif",
            fontWeight:800, fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase',
          }}>✌️ your list, no stress</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(2rem,6vw,3rem)', lineHeight:1, color:'#1a1a2e' }}>
            hey, {user.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color:'#9090a8', marginTop:6, fontStyle:'italic', fontSize:'0.95rem' }}>{mood}</p>
        </div>
        <button onClick={onLogout} style={{
          background:'#fff', border:'2px solid #e0d8f0', borderRadius:12,
          padding:'8px 16px', fontFamily:"'Syne',sans-serif", fontWeight:700,
          fontSize:'0.78rem', color:'#9090a8', cursor:'pointer', transition:'all .2s',
        }}
          onMouseEnter={e => { e.target.style.borderColor='#ff6b6b'; e.target.style.color='#ff6b6b'; }}
          onMouseLeave={e => { e.target.style.borderColor='#e0d8f0'; e.target.style.color='#9090a8'; }}
        >sign out</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {[
          { label:'total',   val:total,           bg:'#f0eeff', accent:'#a29bfe' },
          { label:'active',  val:total-doneCount, bg:'#e8fffe', accent:'#4ecdc4' },
          { label:'done',    val:doneCount,        bg:'#f0fff8', accent:'#2ecc71' },
          { label:'overdue', val:overdue, bg:overdue>0?'#fff0f0':'#fafafa', accent:overdue>0?'#ff6b6b':'#e0d8f0' },
        ].map(s => (
          <div key={s.label} style={{
            background:s.bg, border:`2px solid ${s.accent}`, borderRadius:16,
            padding:'14px 10px', textAlign:'center',
          }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.6rem', color:s.accent, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9090a8', marginTop:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div style={{ background:'#e8e4f0', borderRadius:100, height:10, marginBottom:28, overflow:'hidden', border:'1.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{
          height:'100%', background:'linear-gradient(90deg, #4ecdc4, #2ecc71)',
          borderRadius:100, width:pct+'%', transition:'width .6s cubic-bezier(.4,2,.6,1)',
        }} />
      </div>

      {/* Search + Add */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <div style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:'1rem', pointerEvents:'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="search tasks..."
            style={{
              width:'100%', background:'#fff', border:'2.5px solid #1a1a2e', borderRadius:14,
              padding:'13px 16px 13px 42px', fontSize:'0.95rem', fontWeight:600, color:'#1a1a2e',
              outline:'none', boxShadow:'3px 3px 0 #1a1a2e', transition:'all .2s',
            }}
            onFocus={e => { e.target.style.boxShadow='5px 5px 0 #a29bfe'; e.target.style.transform='translate(-1px,-1px)'; }}
            onBlur={e  => { e.target.style.boxShadow='3px 3px 0 #1a1a2e'; e.target.style.transform='none'; }}
          />
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background:'#ff6b6b', color:'#fff', border:'2.5px solid #1a1a2e',
          borderRadius:14, padding:'13px 22px',
          fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'0.95rem',
          cursor:'pointer', boxShadow:'3px 3px 0 #1a1a2e', whiteSpace:'nowrap', transition:'all .15s',
        }}
          onMouseEnter={e => { e.target.style.transform='translate(-2px,-2px)'; e.target.style.boxShadow='5px 5px 0 #1a1a2e'; }}
          onMouseLeave={e => { e.target.style.transform='none'; e.target.style.boxShadow='3px 3px 0 #1a1a2e'; }}
        >+ new task</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        {['all','active','done'].map(f => (
          <Pill key={f} active={filter===f} onClick={() => setFilter(f)}>{f==='done' ? '✓ done' : f}</Pill>
        ))}
        <div style={{ width:1, background:'#e0d8f0', margin:'0 4px' }} />
        {['all','high','medium','low'].map(f => (
          <Pill key={f} active={priorityFilter===f} onClick={() => setPriorityFilter(f)}>
            {f==='all' ? 'any priority' : f}
          </Pill>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            border:'2px solid #e0d8f0', borderRadius:10, padding:'6px 12px',
            fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.78rem',
            color:'#9090a8', background:'#fff', cursor:'pointer', outline:'none',
          }}>
            <option value="created">newest first</option>
            <option value="priority">by priority</option>
            <option value="due">by due date</option>
          </select>
          {doneCount > 0 && (
            <button onClick={clearDone} style={{
              background:'none', border:'none', color:'#9090a8', fontWeight:700,
              fontSize:'0.8rem', cursor:'pointer', textDecoration:'underline',
              textUnderlineOffset:3, whiteSpace:'nowrap',
            }}>clear done</button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:24, paddingBottom:16, borderBottom:'1.5px solid #e8e4f0' }}>
        <Pill active={catFilter==='all'} onClick={() => setCatFilter('all')}>all categories</Pill>
        {CATEGORIES.map(c => (
          <Pill key={c} active={catFilter===c} onClick={() => setCatFilter(c)}>{c}</Pill>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#9090a8' }}>
          <div style={{ fontSize:'2rem', animation:'spin 1s linear infinite', display:'inline-block', marginBottom:12 }}>⏳</div>
          <p style={{ fontStyle:'italic' }}>loading your tasks...</p>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <span style={{ fontSize:'3rem', display:'block', marginBottom:12, animation:'bounce 2s ease-in-out infinite' }}>
            {search ? '🔍' : filter==='done' ? '👀' : filter==='active' ? '🎉' : '🍃'}
          </span>
          <p style={{ color:'#9090a8', fontStyle:'italic', fontSize:'1.05rem' }}>
            {search          ? 'no tasks match your search'      :
             filter==='done' ? "nothing done yet — go get 'em!"  :
             filter==='active'? "all clear! nice work 🙌"        : "nothing here yet. add something!"}
          </p>
        </div>
      ) : (
        <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
          {visible.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onDelete={() => deleteTask(task.id)}
              onEdit={() => setEditTask(task)}
              style={{ animation:`slideUp 0.3s ${i*0.04}s ease both` }}
            />
          ))}
        </ul>
      )}

      {showModal && <TaskModal onSave={addTask} onClose={() => setShowModal(false)} />}
      {editTask  && <TaskModal task={editTask} onSave={updateTask} onClose={() => setEditTask(null)} />}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [checking, setChecking] = useState(true);

  function toast(msg, type='info') {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
  }

  function removeToast(id) { setToasts(t => t.filter(x => x.id !== id)); }

  useEffect(() => {
    const saved = sessionStorage.getItem('todo_user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
    setChecking(false);
  }, []);

  function handleLogin(u) {
    setUser(u);
    sessionStorage.setItem('todo_user', JSON.stringify(u));
  }

  function handleLogout() {
    setUser(null);
    sessionStorage.removeItem('todo_user');
    toast('👋 logged out!', 'info');
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {checking ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
          <div style={{ fontSize:'2rem', animation:'spin 1s linear infinite' }}>⏳</div>
        </div>
      ) : user ? (
        <AppMain user={user} onLogout={handleLogout} toast={toast} />
      ) : (
        <AuthScreen onLogin={handleLogin} toast={toast} />
      )}
      {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onDone={() => removeToast(t.id)} />)}
    </>
  );
}
