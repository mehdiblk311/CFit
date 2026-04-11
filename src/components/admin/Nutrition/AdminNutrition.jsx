import { useState } from 'react';

const INITIAL_FOODS = [
  { id: '1', name: 'Greek Yogurt (Full Fat)', category: 'Dairy', kcal: 59, p: 10, c: 4, f: 5, status: 'verified' },
  { id: '2', name: 'Oatmeal (Raw)', category: 'Grains', kcal: 68, p: 6, c: 28, f: 3, status: 'verified' },
  { id: '3', name: 'Amlou', category: 'Spreads', kcal: 598, p: 15, c: 30, f: 45, status: 'verified' },
  { id: '4', name: 'Homemade Lasagna', category: 'Custom', kcal: 180, p: 12, c: 18, f: 8, status: 'pending' },
  { id: '5', name: 'Harcha', category: 'Baked', kcal: 420, p: 8, c: 60, f: 14, status: 'verified' },
];

export default function AdminNutrition() {
  const [foods, setFoods] = useState(INITIAL_FOODS);
  
  // Search and Filter State
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = Creating new food
  const [formData, setFormData] = useState({
    name: '', category: 'Dairy', kcal: '', p: '', c: '', f: '', status: 'verified'
  });

  const filteredFoods = foods.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || f.category === filterCat;
    return matchSearch && matchCat;
  });

  const getChipClass = (status, category) => {
    if (status === 'pending') return 'adm-chip--purple';
    if (category === 'Dairy' || category === 'Grains') return 'adm-chip--oat';
    return 'adm-chip--green';
  };

  /* Modal Helpers */
  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', category: 'Dairy', kcal: '', p: '', c: '', f: '', status: 'verified' });
    setIsModalOpen(true);
  };

  const openEditModal = (food) => {
    setEditingId(food.id);
    setFormData({ ...food });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  /* Form Actions */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveFood = (e) => {
    e.preventDefault();
    
    // Convert macros to numbers
    const payload = {
      ...formData,
      kcal: Number(formData.kcal),
      p: Number(formData.p),
      c: Number(formData.c),
      f: Number(formData.f),
    };

    if (editingId) {
      // Update
      setFoods(prev => prev.map(f => f.id === editingId ? { ...payload, id: editingId } : f));
    } else {
      // Create
      const newId = String(Math.max(...foods.map(f => Number(f.id)), 0) + 1);
      setFoods(prev => [{ ...payload, id: newId }, ...prev]);
    }
    
    closeModal();
  };

  const handleDeleteFood = (id) => {
    if (window.confirm("Are you sure you want to delete this food item?")) {
      setFoods(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleExportCSV = () => {
    // 1. Create CSV Headers
    const headers = ['ID', 'Food Name', 'Category', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fats (g)', 'Status'];
    
    // 2. Map data rows
    const rows = filteredFoods.map(f => [
      f.id,
      `"${f.name.replace(/"/g, '""')}"`, // Escape commas/quotes in the name
      f.category,
      f.kcal,
      f.p,
      f.c,
      f.f,
      f.status
    ]);

    // 3. Combine into a single string
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    // 4. Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cfit_nutrition_db_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-eyebrow">Database Administration</div>
          <h1 className="adm-page-title">Nutrition DB</h1>
        </div>
        <div className="adm-page-actions">
          <button className="adm-btn-ghost" onClick={handleExportCSV}>
            <span className="material-symbols-outlined">download</span> Export CSV
          </button>
          <button className="adm-btn-primary" onClick={openAddModal}>
            <span className="material-symbols-outlined">add</span> Add Food
          </button>
        </div>
      </div>

      {/* ── Metrics Grid ────────────────────────────────────────────── */}
      <div className="adm-grid-3" style={{ marginBottom: 32 }}>
        <div className="adm-metric-card">
          <div className="adm-metric-badge">LIVE</div>
          <div className="adm-metric-label">Total Verified Foods</div>
          <div className="adm-metric-value">{foods.filter(f => f.status === 'verified').length}</div>
          <div className="adm-metric-bar-wrap">
            <div className="adm-metric-bar" style={{ width: '80%' }}></div>
          </div>
        </div>
        <div className="adm-metric-card">
          <div className="adm-metric-badge" style={{ background: '#b4a5ff', color: '#180058' }}>REVIEW</div>
          <div className="adm-metric-label">Pending Custom Foods</div>
          <div className="adm-metric-value">{foods.filter(f => f.status === 'pending').length}</div>
          <div className="adm-metric-bar-wrap">
            <div className="adm-metric-bar" style={{ width: '20%', background: '#b4a5ff' }}></div>
          </div>
        </div>
        <div className="adm-metric-card">
          <div className="adm-metric-badge">OK</div>
          <div className="adm-metric-label">API Integrations (USDA)</div>
          <div className="adm-metric-value">SYNCED</div>
          <div className="adm-metric-bar-wrap">
            <div className="adm-metric-bar" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* ── Constraints & Table ─────────────────────────────────────── */}
      <div className="adm-table-wrap">
        <div style={{ display: 'flex', gap: 16, padding: '20px 24px', borderBottom: '2px dashed #dad4c8', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="adm-search-wrap" style={{ flex: 1, minWidth: 240 }}>
            <span className="material-symbols-outlined adm-search-icon">search</span>
            <input
              type="text"
              className="adm-search"
              placeholder="SEARCH FOOD OR ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <select className="adm-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Dairy">Dairy</option>
            <option value="Grains">Grains</option>
            <option value="Spreads">Spreads</option>
            <option value="Custom">Custom</option>
            <option value="Baked">Baked</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Food Item</th>
                <th>Category</th>
                <th>Macros (P/C/F)</th>
                <th>KCAL / 100g</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFoods.map(f => (
                <tr key={f.id}>
                  <td className="adm-td-mono">#{f.id.padStart(4, '0')}</td>
                  <td style={{ fontWeight: 600 }}>{f.name}</td>
                  <td>
                    <span className={`adm-chip ${getChipClass(f.status, f.category)}`}>
                      {f.category}
                    </span>
                  </td>
                  <td className="adm-td-mono">
                    {f.p}g / {f.c}g / {f.f}g
                  </td>
                  <td style={{ fontWeight: 800 }}>{f.kcal}</td>
                  <td>
                    {f.status === 'verified' ? (
                      <span className="adm-td-mono" style={{ color: '#38671a', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                        Verified
                      </span>
                    ) : (
                      <span className="adm-td-mono" style={{ color: '#b02500', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>pending</span>
                        Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button 
                        className="adm-icon-btn adm-icon-btn--edit" 
                        title="Edit Food"
                        onClick={() => openEditModal(f)}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button 
                        className="adm-icon-btn adm-icon-btn--danger" 
                        title="Delete Food"
                        onClick={() => handleDeleteFood(f.id)}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFoods.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="adm-empty">
                      <span className="material-symbols-outlined adm-empty-icon">search_off</span>
                      <div className="adm-empty-text">No foods found</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Form ──────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <button className="adm-modal-close" onClick={closeModal} aria-label="Close">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="adm-modal-title">
              {editingId ? 'Edit Food Entry' : 'Create New Food'}
            </h2>
            
            <form onSubmit={handleSaveFood}>
              <div className="adm-form-field">
                <label className="adm-form-label">Food Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="adm-form-input" 
                  value={formData.name} 
                  onChange={handleFormChange}
                  placeholder="e.g. Grandma's Lasagna"
                  required 
                />
              </div>

              <div className="adm-grid-2" style={{ marginBottom: 18 }}>
                <div className="adm-form-field" style={{ marginBottom: 0 }}>
                  <label className="adm-form-label">Category</label>
                  <select name="category" className="adm-form-select" value={formData.category} onChange={handleFormChange}>
                    <option value="Dairy">Dairy</option>
                    <option value="Grains">Grains</option>
                    <option value="Spreads">Spreads</option>
                    <option value="Custom">Custom</option>
                    <option value="Baked">Baked</option>
                  </select>
                </div>
                
                <div className="adm-form-field" style={{ marginBottom: 0 }}>
                  <label className="adm-form-label">Status</label>
                  <select name="status" className="adm-form-select" value={formData.status} onChange={handleFormChange}>
                    <option value="verified">Verified (Live)</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="adm-form-field">
                <label className="adm-form-label">Macros (per 100g)</label>
                <div className="adm-grid-4">
                  <div style={{ position: 'relative' }}>
                    <input type="number" name="kcal" placeholder="KCAL" className="adm-form-input" value={formData.kcal} onChange={handleFormChange} required min="0" />
                  </div>
                  <div>
                    <input type="number" name="p" placeholder="P (g)" className="adm-form-input" value={formData.p} onChange={handleFormChange} required min="0" />
                  </div>
                  <div>
                    <input type="number" name="c" placeholder="C (g)" className="adm-form-input" value={formData.c} onChange={handleFormChange} required min="0" />
                  </div>
                  <div>
                    <input type="number" name="f" placeholder="F (g)" className="adm-form-input" value={formData.f} onChange={handleFormChange} required min="0" />
                  </div>
                </div>
              </div>

              <div className="adm-form-actions">
                <button type="button" className="adm-btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn-primary">
                  {editingId ? 'Save Changes' : 'Create Food'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
