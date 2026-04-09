export default function AdminNutritionCS() {
  return (
    <div className="adm-cs-root">
      <div className="adm-cs-icon">🥗</div>
      <div className="adm-cs-tag">Coming Soon</div>
      <h1 className="adm-cs-title">Nutrition<br/>Management</h1>
      <p className="adm-cs-subtitle">
        Food database management, macro tracking admin tools, and meal plan templates will be available here.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        {['Food Database', 'Meal Templates', 'Macro Analytics', 'Recipe Builder'].map(f => (
          <span
            key={f}
            style={{
              background: '#e8e2d6',
              color: '#5b5c5a',
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              padding: '6px 14px',
              borderRadius: 9999,
              border: '2px dashed #dad4c8',
            }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
