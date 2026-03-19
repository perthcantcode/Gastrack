import { useState, useEffect } from 'react'
import {
  collection, doc, setDoc, onSnapshot,
  addDoc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase.js'

export function useStore(user) {
  const [project, setProject]   = useState({ title: 'My Project', budget: 5000, deadline: '', members: [] })
  const [expenses, setExpenses] = useState([])
  const [tasks, setTasks]       = useState([])
  const [files, setFiles]       = useState([])
  const [loading, setLoading]   = useState(true)

  const uid = user?.uid
  const projectRef = uid ? doc(db, 'users', uid, 'project', 'main') : null
  const expCol     = uid ? collection(db, 'users', uid, 'expenses') : null
  const taskCol    = uid ? collection(db, 'users', uid, 'tasks') : null
  const fileCol    = uid ? collection(db, 'users', uid, 'files') : null

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    const unsubs = []
    unsubs.push(onSnapshot(projectRef, snap => {
      if (snap.exists()) setProject(snap.data())
      setLoading(false)
    }))
    unsubs.push(onSnapshot(expCol, snap => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }))
    unsubs.push(onSnapshot(taskCol, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }))
    unsubs.push(onSnapshot(fileCol, snap => {
      setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }))
    return () => unsubs.forEach(u => u())
  }, [uid])

  const saveProject = async (data) => {
    if (!projectRef) return
    await setDoc(projectRef, data, { merge: true })
  }

  const addExpense = async (exp) => {
    if (!expCol) return
    await addDoc(expCol, { ...exp, createdAt: serverTimestamp() })
  }
  const editExpense = async (id, exp) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'expenses', id), exp)
  }
  const deleteExpense = async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'expenses', id))
  }

  const addTask = async (task) => {
    if (!taskCol) return
    await addDoc(taskCol, { ...task, done: false, createdAt: serverTimestamp() })
  }
  const toggleTask = async (id, done) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'tasks', id), { done: !done })
  }
  const deleteTask = async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'tasks', id))
  }

  const addFile = async (file) => {
    if (!fileCol) return
    await addDoc(fileCol, { ...file, uploadedAt: serverTimestamp() })
  }
  const deleteFile = async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'files', id))
  }

  const totalSpent      = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const remaining       = (project.budget || 0) - totalSpent
  const pctSpent        = project.budget ? Math.round((totalSpent / project.budget) * 100) : 0
  const sharePerMember  = project.members?.length ? project.budget / project.members.length : 0
  const daysLeft        = project.deadline
    ? Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / 86_400_000)) : 0
  const tasksDone       = tasks.filter(t => t.done).length
  const taskPct         = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0
  const memberPaid      = Object.fromEntries((project.members || []).map(m => [
    m, expenses.filter(e => e.paid === m).reduce((s, e) => s + (e.amount || 0), 0)
  ]))
  const catBreakdown    = expenses.reduce((acc, e) => {
    acc[e.cat] = (acc[e.cat] || 0) + e.amount; return acc
  }, {})

  return {
    project, expenses, tasks, files, loading,
    saveProject, addExpense, editExpense, deleteExpense,
    addTask, toggleTask, deleteTask, addFile, deleteFile,
    derived: { totalSpent, remaining, pctSpent, sharePerMember, daysLeft, tasksDone, taskPct, memberPaid, catBreakdown }
  }
}
