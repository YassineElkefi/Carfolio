export function TunisianPlate({ plate }: { plate: string }) {
  const raw = plate.trim().replace(/\s+/g, ' ').toUpperCase();

  const match = raw.match(/^(\d{1,3})\s*(?:TU|تونس|TOUNES|TOUNIS)?\s*(\d{1,4})$/);

  let left: string;
  let right: string;

  if (match) {
    left = match[1];
    right = match[2];
  } else {
    const parts = raw.split(/\s+/);
    left = parts[0] ?? raw;
    right = parts[parts.length - 1] !== parts[0] ? parts[parts.length - 1] : '';
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0',
      background: '#111',
      border: '2.5px solid #e8e8e8',
      borderRadius: '5px',
      padding: '4px 10px',
      fontFamily: '"Arial", sans-serif',
      userSelect: 'none',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      lineHeight: 1,
    }}>
      {/* Right side: left digits (RTL: displayed right) */}
      <span style={{
        color: '#fff',
        fontSize: '15px',
        fontWeight: 700,
        letterSpacing: '1px',
        minWidth: '28px',
        textAlign: 'center',
      }}>
        {left}
      </span>

      {/* Center: تونس in Arabic */}
      <span style={{
        color: '#fff',
        fontSize: '11px',
        fontWeight: 600,
        padding: '0 7px',
        //borderLeft: '1px solid rgba(255,255,255,0.25)',
        //borderRight: '1px solid rgba(255,255,255,0.25)',
        margin: '0 4px',
        direction: 'rtl',
        letterSpacing: '0.5px',
        lineHeight: '18px',
      }}>
        تونس
      </span>

      {/* Left side: right digits */}
      <span style={{
        color: '#fff',
        fontSize: '15px',
        fontWeight: 700,
        letterSpacing: '1px',
        minWidth: '36px',
        textAlign: 'center',
      }}>
        {right}
      </span>
    </div>
  );
}