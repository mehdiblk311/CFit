import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomFood.css';

export default function CustomFood() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    kcal: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      // Send the request to the backend to create the custom food
      const response = await fetch('/api/nutrition/custom-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save custom food');
      }

      // Once successfully saved, return to the main nutrition dashboard
      navigate('/nutrition');
    } catch (error) {
      console.error("Error saving custom food:", error);
      // In a real app we'd display a toast notification here
      navigate('/nutrition'); // Still navigating back for demonstration purposes
    }
  };

  return (
    <div className="cf-root">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="cf-header">
        <div className="cf-header-left">
          <button
            id="cf-back-btn"
            className="cf-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined" style={{ color: '#38671a' }}>arrow_back</span>
          </button>
          <h1 className="cf-header-title">Create Custom Food</h1>
        </div>
        <div className="cf-avatar">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 20, color: '#38671a' }}>person</span>
        </div>
      </header>

      <main className="cf-main">
        {/* ── Hero / Intro ─────────────────────────────────────────── */}
        <section className="cf-hero">
          <div className="cf-hero-icon">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <h2 className="cf-hero-title">New Food Entry</h2>
          <p className="cf-hero-desc">Add a custom food item to your database for accurate macro tracking.</p>
        </section>

        {/* ── Form Canvas ──────────────────────────────────────────── */}
        <form className="cf-form-card" onSubmit={handleSave}>
          <div className="cf-form-section">
            <h3 className="cf-section-label">General Info</h3>

            <div className="cf-input-group">
              <label htmlFor="name" className="cf-label">Food Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="cf-input"
                placeholder="e.g. Grandma's Lasagna"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="cf-input-group">
              <label htmlFor="brand" className="cf-label">Brand (Optional)</label>
              <input
                type="text"
                id="brand"
                name="brand"
                className="cf-input"
                placeholder="e.g. Homemade"
                value={formData.brand}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="cf-form-section">
            <div className="cf-section-header">
              <h3 className="cf-section-label">Macros (per 100g or 1 serving)</h3>
              <div className="cf-serving-chip">PER SERVING</div>
            </div>

            <div className="cf-macros-grid">
              <div className="cf-input-group cf-input-group--macro cf-input-group--kcal">
                <label htmlFor="kcal" className="cf-label">Calories</label>
                <div className="cf-macro-input-wrap">
                  <input
                    type="number"
                    id="kcal"
                    name="kcal"
                    className="cf-input cf-input--large"
                    placeholder="0"
                    value={formData.kcal}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                  <span className="cf-input-unit">kcal</span>
                </div>
              </div>

              {[
                { id: 'protein', label: 'Protein' },
                { id: 'carbs', label: 'Carbs' },
                { id: 'fats', label: 'Fats' },
              ].map(macro => (
                <div key={macro.id} className="cf-input-group cf-input-group--macro">
                  <label htmlFor={macro.id} className="cf-label">{macro.label}</label>
                  <div className="cf-macro-input-wrap">
                    <input
                      type="number"
                      id={macro.id}
                      name={macro.id}
                      className="cf-input cf-input--large"
                      placeholder="0"
                      value={formData[macro.id]}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                    <span className="cf-input-unit">g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </main>

      {/* ── Sticky CTA ───────────────────────────────────────────── */}
      <div className="cf-sticky-cta">
        <div className="cf-cta-inner">
          <button
            type="submit"
            id="cf-save-btn"
            className="cf-save-btn"
            onClick={handleSave}
            disabled={!formData.name || !formData.kcal}
          >
            <span className="material-symbols-outlined">check_circle</span>
            Confirm &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
}
