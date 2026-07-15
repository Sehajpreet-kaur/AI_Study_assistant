// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import UploadBox from '../components/UploadBox'
// import api from '../api/axios'

// export default function Dashboard() {
//   const { user, logout } = useAuth()
//   const navigate = useNavigate()
//   const [docs, setDocs]     = useState([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetchDocs()
//   }, [])

//   const fetchDocs = async () => {
//     try {
//       const { data } = await api.get('/rag/documents')
//       setDocs(data)
//     } catch {
//       // handle silently
//     }
//     setLoading(false)
//   }

//   const handleUploaded = (newDoc) => {
//     setDocs(prev => [newDoc, ...prev])
//     navigate('/chat', { state: { docId: newDoc.docId, filename: newDoc.filename } })
//   }

//   const openChat = (doc) => {
//     navigate('/chat', { state: { docId: doc.docId, filename: doc.filename } })
//   }

//   const handleLogout = () => {
//     logout()
//     navigate('/login')
//   }

//   return (
//     <div style={styles.page}>
//       <div style={styles.header}>
//         <h1 style={styles.logo}>Study Assistant</h1>
//         <div style={styles.headerRight}>
//           <span style={styles.username}>Hi, {user?.name}</span>
//           <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
//         </div>
//       </div>

//       <div style={styles.content}>
//         <div style={styles.uploadSection}>
//           <h2 style={styles.sectionTitle}>Upload a document</h2>
//           <p style={styles.sectionSub}>Upload your lecture notes, textbook chapters, or PDFs to start asking questions</p>
//           <UploadBox onUploaded={handleUploaded} />
//         </div>

//         <div style={styles.docsSection}>
//           <h2 style={styles.sectionTitle}>Your documents</h2>
//           {loading && <p style={styles.muted}>Loading...</p>}
//           {!loading && docs.length === 0 && (
//             <p style={styles.muted}>No documents yet. Upload one above to get started.</p>
//           )}
//           <div style={styles.docGrid}>
//             {docs.map((doc) => (
//               <div key={doc._id} style={styles.docCard} onClick={() => openChat(doc)}>
//                 <div style={styles.docIcon}>📄</div>
//                 <div>
//                   <p style={styles.docName}>{doc.filename}</p>
//                   <p style={styles.docDate}>
//                     {new Date(doc.createdAt).toLocaleDateString()}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// const styles = {
//   page:          { minHeight: '100vh', background: '#f8f8f8' },
//   header:        { background: '#fff', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' },
//   logo:          { margin: 0, fontSize: '20px', fontWeight: 700, color: '#6C63FF' },
//   headerRight:   { display: 'flex', alignItems: 'center', gap: '16px' },
//   username:      { fontSize: '14px', color: '#555' },
//   logoutBtn:     { padding: '6px 14px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '13px' },
//   content:       { maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' },
//   uploadSection: { background: '#fff', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   sectionTitle:  { margin: '0 0 6px', fontSize: '18px', fontWeight: 600 },
//   sectionSub:    { margin: '0 0 20px', color: '#666', fontSize: '14px' },
//   docsSection:   { background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   muted:         { color: '#999', fontSize: '14px' },
//   docGrid:       { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' },
//   docCard:       { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '8px', border: '1px solid #eee', cursor: 'pointer', transition: 'background 0.15s' },
//   docIcon:       { fontSize: '24px' },
//   docName:       { margin: 0, fontWeight: 500, fontSize: '14px' },
//   docDate:       { margin: '2px 0 0', fontSize: '12px', color: '#999' },
// }

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UploadBox from '../components/UploadBox'
import api from '../api/axios'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchDocs()
  }, [])

  const fetchDocs = async () => {
    try {
      const { data } = await api.get('/rag/documents')
      setDocs(data)
    } catch {
      alert('No Data found.')
    }
    setLoading(false)
  }

  const handleUploaded = (newDoc) => {
    setDocs(prev => [newDoc, ...prev])
    console.log(newDoc,"newDoc")
    navigate('/chat', { state: { docId: newDoc.docId, filename: newDoc.filename } })
  }

  const openChat = (doc) => {
    navigate('/chat', { state: { docId: doc.docId, filename: doc.filename } })
  }

  const handleDelete = async (e, doc) => {
    e.stopPropagation() // prevent triggering openChat when clicking delete
    if (!window.confirm(`Delete "${doc.filename}"? This can't be undone.`)) return

    setDeletingId(doc._id)
    try {
      await api.delete(`/documents/${doc._id}`)
      setDocs(prev => prev.filter(d => d._id !== doc._id))
    } catch {
      alert('Failed to delete document. Please try again.')
    }
    setDeletingId(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.logo}>Study Assistant</h1>
        <div style={styles.headerRight}>
          <span style={styles.username}>Hi, {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.uploadSection}>
          <h2 style={styles.sectionTitle}>Upload a document</h2>
          <p style={styles.sectionSub}>Upload your lecture notes, textbook chapters, or PDFs to start asking questions</p>
          <UploadBox onUploaded={handleUploaded} />
        </div>

        <div style={styles.docsSection}>
          <h2 style={styles.sectionTitle}>Your documents</h2>
          {loading && <p style={styles.muted}>Loading...</p>}
          {!loading && docs.length === 0 && (
            <p style={styles.muted}>No documents yet. Upload one above to get started.</p>
          )}
          <div style={styles.docGrid}>
            {docs.map((doc) => (
              <div key={doc._id} style={styles.docCard} onClick={() => openChat(doc)}>
                <div style={styles.docIcon}>📄</div>
                <div style={styles.docInfo}>
                  <p style={styles.docName}>{doc.filename}</p>
                  <p style={styles.docDate}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  style={styles.deleteBtn}
                  onClick={(e) => handleDelete(e, doc)}
                  disabled={deletingId === doc._id}
                >
                  {deletingId === doc._id ? '...' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page:          { minHeight: '100vh', background: '#f8f8f8' },
  header:        { background: '#fff', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' },
  logo:          { margin: 0, fontSize: '20px', fontWeight: 700, color: '#6C63FF' },
  headerRight:   { display: 'flex', alignItems: 'center', gap: '16px' },
  username:      { fontSize: '14px', color: '#555' },
  logoutBtn:     { padding: '6px 14px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '13px' },
  content:       { maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' },
  uploadSection: { background: '#fff', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle:  { margin: '0 0 6px', fontSize: '18px', fontWeight: 600 },
  sectionSub:    { margin: '0 0 20px', color: '#666', fontSize: '14px' },
  docsSection:   { background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  muted:         { color: '#999', fontSize: '14px' },
  docGrid:       { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' },
  docCard:       { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '8px', border: '1px solid #eee', cursor: 'pointer', transition: 'background 0.15s' },
  docIcon:       { fontSize: '24px' },
  docInfo:       { flex: 1 },
  docName:       { margin: 0, fontWeight: 500, fontSize: '14px' },
  docDate:       { margin: '2px 0 0', fontSize: '12px', color: '#999' },
  deleteBtn:     { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '6px 10px', borderRadius: '6px', opacity: 0.6 },
}