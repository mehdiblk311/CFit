import './Nutrition.css';

export default function Nutrition() {
  return (
    <div className="cs-root cs-root--nutrition">
      <div className="cs-blob cs-blob--a" />
      <div className="cs-blob cs-blob--b" />

      <div className="cs-sticker cs-sticker--top">COMING SOON</div>

      <div className="cs-body">
        <div className="cs-icon-card cs-icon-card--lemon">
          <span className="material-symbols-outlined cs-big-icon"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            restaurant
          </span>
        </div>

        <div className="cs-copy">
          <span className="cs-label">Nutrition</span>
          <h1 className="cs-title">Eat<br/>Smart.</h1>
          <p className="cs-desc">
            Log meals, track macros, and build better eating habits. Launching soon.
          </p>
        </div>

        <div className="cs-tags">
          <span className="cs-tag">Meal Logging</span>
          <span className="cs-tag">Macro Tracking</span>
          <span className="cs-tag">Food Database</span>
        </div>
      </div>
    </div>
  );
}
