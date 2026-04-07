import { HardHat, RefreshCcw } from "lucide-react";

interface MaintenanceOverlayProps {
  message?: string;
}

export function MaintenanceOverlay({ message }: MaintenanceOverlayProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: '#0b0b0b',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto' }}>
        <img 
          src="/maintenance.png" 
          alt="MAINTENANCE" 
          style={{ 
            width: '100%', 
            borderRadius: '2rem', 
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            marginBottom: '2.5rem',
            display: 'block'
          }} 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: '900', margin: '0 0 1rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          Wait For <span style={{ color: '#f97316' }}>Us</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#a1a1aa', margin: '0 0 2.5rem 0', fontWeight: '500', lineHeight: '1.6' }}>
          {message || "We're currently perfecting our systems to provide you the best streaming experience. Check back in a few!"}
        </p>
        <button 
          onClick={handleRefresh}
          style={{
            padding: '1.25rem 3rem',
            backgroundColor: '#f97316',
            color: 'black',
            fontWeight: '900',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '1rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <RefreshCcw style={{ width: '1.25rem', height: '1.25rem' }} />
          Check Status
        </button>
      </div>
      
      {/* Admin Link using standard <a> to avoid router crashes */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <a href="/auth" style={{ 
          color: '#71717a', 
          textDecoration: 'none', 
          fontSize: '0.75rem', 
          fontWeight: '900', 
          textTransform: 'uppercase', 
          border: '1px solid rgba(255,255,255,0.1)', 
          padding: '0.5rem 1rem', 
          borderRadius: '9999px' 
        }}>
          Admin Access
        </a>
      </div>

      <div style={{ position: 'absolute', bottom: '2rem', opacity: 0.3, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
        TVStreamz Core Platform
      </div>
    </div>
  );
}
