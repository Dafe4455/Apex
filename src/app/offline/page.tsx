export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a1a26', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui', color: '#4d7a96', textAlign: 'center', padding: 24
    }}>
      <p style={{ fontSize: '2rem', marginBottom: 16 }}>📡</p>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: '#c8dfed', marginBottom: 8 }}>You're offline</p>
      <p style={{ fontSize: '0.75rem', fontWeight: 300 }}>Check your connection and try again.</p>
    </div>
  );
}
