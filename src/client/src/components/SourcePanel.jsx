export default function SourcePanel({ sources }) {
  if (!sources || sources.length === 0) return null

  return (
    <div style={styles.panel}>
      <p style={styles.title}>Sources used to answer</p>
      <div style={styles.list}>
        {sources.map((s, i) => (
          <div key={i} style={styles.card}>
            <span style={styles.badge}>Page {s.page}</span>
            <p style={styles.preview}>{s.preview}...</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  panel:   { background: '#f9f9f9', borderTop: '1px solid #eee', padding: '14px 16px' },
  title:   { margin: '0 0 10px', fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  list:    { display: 'flex', flexDirection: 'column', gap: '8px' },
  card:    { background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '10px 12px' },
  badge:   { display: 'inline-block', background: '#eef', color: '#6C63FF', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', marginBottom: '6px' },
  preview: { margin: 0, fontSize: '13px', color: '#555', lineHeight: '1.5' },
}