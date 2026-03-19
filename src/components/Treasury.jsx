import { useState, useRef } from 'react'
import { Card, CardTitle, Badge, Btn } from './UI.jsx'
import styles from './Treasury.module.css'

const FILE_ICONS = {
  pdf: '📄', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊',
  xls: '📈', xlsx: '📈', jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
  zip: '📦', txt: '📃', default: '📎'
}

const fmt = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function Treasury({ files, addFile, deleteFile, members }) {
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter]       = useState('All')
  const [search, setSearch]       = useState('')
  const inputRef = useRef()

  const handleFiles = async (fileList) => {
    setUploading(true)
    for (const file of Array.from(fileList)) {
      if (file.size > 900_000) { alert(`${file.name} is too large (max 900KB)`); continue }
      const reader = new FileReader()
      await new Promise(res => {
        reader.onload = async (e) => {
          const ext = file.name.split('.').pop().toLowerCase()
          await addFile({
            name: file.name, size: file.size, ext,
            data: e.target.result, type: file.type,
            uploadedBy: 'You',
          })
          res()
        }
        reader.readAsDataURL(file)
      })
    }
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const categories = ['All', ...new Set(files.map(f => f.ext?.toUpperCase() || 'OTHER'))]
  const filtered = files.filter(f => {
    const matchCat = filter === 'All' || f.ext?.toUpperCase() === filter
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className={styles.wrap}>
      <Card className={styles.uploadCard}>
        <CardTitle>Treasury — File Storage</CardTitle>
        <div
          className={styles.dropzone}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" multiple style={{display:'none'}} onChange={e => handleFiles(e.target.files)} />
          <div className={styles.dropIcon}>📁</div>
          <div className={styles.dropText}>{uploading ? 'Uploading...' : 'Drop files here or click to upload'}</div>
          <div className={styles.dropHint}>PDF, DOCX, PPTX, images · Max 900KB each</div>
          {uploading && <div className={styles.spinner} />}
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}><span className={styles.statN}>{files.length}</span><span className={styles.statL}>Files</span></div>
          <div className={styles.statItem}><span className={styles.statN}>{fmt(files.reduce((s,f)=>s+(f.size||0),0))}</span><span className={styles.statL}>Total size</span></div>
        </div>
      </Card>

      <Card>
        <div className={styles.toolbar}>
          <input className={styles.search} placeholder="Search files..." value={search} onChange={e=>setSearch(e.target.value)} />
          <div className={styles.filters}>
            {categories.map(c => (
              <button key={c} className={`${styles.filterBtn} ${filter===c?styles.active:''}`} onClick={()=>setFilter(c)}>{c}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🗂️</div>
            <div>No files yet — upload documents above</div>
          </div>
        )}

        <div className={styles.fileGrid}>
          {filtered.map(f => {
            const icon = FILE_ICONS[f.ext] || FILE_ICONS.default
            return (
              <div key={f.id} className={styles.fileCard}>
                <div className={styles.fileIcon}>{icon}</div>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{f.name}</div>
                  <div className={styles.fileMeta}>
                    <Badge variant="neutral">{f.ext?.toUpperCase()}</Badge>
                    <span className={styles.fileSize}>{fmt(f.size || 0)}</span>
                  </div>
                </div>
                <div className={styles.fileActions}>
                  {f.data && (
                    <a href={f.data} download={f.name}>
                      <Btn variant="edit">↓</Btn>
                    </a>
                  )}
                  <Btn variant="danger" onClick={() => deleteFile(f.id)}>✕</Btn>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
