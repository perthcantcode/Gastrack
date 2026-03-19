import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase.js'
import { useStore } from './hooks/useStore.js'
import Login     from './components/Login.jsx'
import Setup     from './components/Setup.jsx'
import Dashboard from './components/Dashboard.jsx'
import Expenses  from './components/Expenses.jsx'
import Tasks     from './components/Tasks.jsx'
import Treasury  from './components/Treasury.jsx'
import Chatbot   from './components/Chatbot.jsx'
import styles    from './App.module.css'

const TABS = [
  { id: 'setup',     label: 'Setup',     icon: '⚙️' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'expenses',  label: 'Expenses',  icon: '💸' },
  { id: 'tasks',     label: 'Tasks',     icon: '✅' },
  { id: 'treasury',  label: 'Treasury',  icon: '📁' },
  { id: 'gasbot',    label: 'GasBot AI', icon: '🤖' },
]

export default function App() {
  const [user, setUser]           = useState(undefined)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme]         = useState(() => localStorage.getItem('gastrack-theme') || 'dark')
  const store = useStore(user)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u || null))
  }, [])

  useEffect(() => {
    // Apply to BOTH html and body so all CSS vars propagate correctly
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('gastrack-theme', theme)
  }, [theme])

  if (user === undefined) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#0A0A0F' }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#6366F1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'#64748B', fontSize:14, fontFamily:'Sora,sans-serif' }}>Starting Gastrack...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!user) return <Login />

  const firstName = user.displayName?.split(' ')[0] || 'User'
  const photoURL  = user.photoURL

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>G</div>
          <div>
            <h1 className={styles.title}>Gastrack</h1>
            <p className={styles.sub}>{store.project?.title || 'My Project'}</p>
          </div>
        </div>

        <nav className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className={styles.tabIcon}>{t.icon}</span>
              <span className={styles.tabLabel}>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.headerRight}>
          <button
            className={styles.themeBtn}
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title="Toggle light/dark mode"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className={styles.userCard}>
            {photoURL
              ? <img src={photoURL} alt={firstName} className={styles.avatar} referrerPolicy="no-referrer" />
              : <div className={styles.avatarFallback}>{firstName.charAt(0).toUpperCase()}</div>
            }
            <span className={styles.userName}>{firstName}</span>
          </div>
          <button className={styles.signOut} onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </header>

      <main className={styles.content}>
        {store.loading ? (
          <div className={styles.loader}>
            <div className={styles.spin} />
            <span>Loading your project...</span>
          </div>
        ) : (
          <>
            {activeTab === 'setup'     && <Setup     state={store.project} derived={store.derived} saveProject={store.saveProject} />}
            {activeTab === 'dashboard' && <Dashboard state={store.project} derived={store.derived} />}
            {activeTab === 'expenses'  && <Expenses  state={store.project} expenses={store.expenses} addExpense={store.addExpense} editExpense={store.editExpense} deleteExpense={store.deleteExpense} />}
            {activeTab === 'tasks'     && <Tasks     state={store.project} tasks={store.tasks} addTask={store.addTask} toggleTask={store.toggleTask} deleteTask={store.deleteTask} />}
            {activeTab === 'treasury'  && <Treasury  files={store.files} addFile={store.addFile} deleteFile={store.deleteFile} members={store.project?.members} />}
            {activeTab === 'gasbot'    && <Chatbot   project={store.project} derived={store.derived} />}
          </>
        )}
      </main>
    </div>
  )
}
