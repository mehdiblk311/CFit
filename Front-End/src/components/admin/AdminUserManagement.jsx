import { useState } from 'react';
import { FormSelect, PillSelect } from './AdminExerciseLibrary';

const INITIAL_USERS = [
  { id: 1, name: 'Mehdi Alami',    handle: '@mehdi_alami',   email: 'm.alami@um6p.ma',      role: 'admin', joined: 'OCT 12, 2023', lastActive: '2 mins ago',  status: 'active' },
  { id: 2, name: 'Sarah Bennani',  handle: '@sarah_fit',     email: 's.bennani@um6p.ma',    role: 'user',  joined: 'JAN 05, 2024', lastActive: '4 hours ago', status: 'active' },
  { id: 3, name: 'Yassine Amrani', handle: '@yassine_coach', email: 'y.amrani@um6p.ma',     role: 'coach', joined: 'NOV 22, 2023', lastActive: 'Yesterday',   status: 'active' },
  { id: 4, name: 'Inès Kadiri',    handle: '@ines_k',        email: 'i.kadiri@um6p.ma',     role: 'user',  joined: 'FEB 14, 2024', lastActive: '1 week ago',  status: 'inactive' },
  { id: 5, name: 'Omar Fassi',     handle: '@omar_lifts',    email: 'o.fassi@um6p.ma',      role: 'user',  joined: 'MAR 01, 2024', lastActive: '3 days ago',  status: 'active' },
  { id: 6, name: 'Lina El Ouafi',  handle: '@lina_runs',     email: 'l.elouafi@um6p.ma',    role: 'coach', joined: 'DEC 10, 2023', lastActive: '2 days ago',  status: 'active' },
];

const ROLE_CHIP = {
  admin: 'adm-chip--green',
  coach: 'adm-chip--purple',
  user:  'adm-chip--oat',
};
const STATUS_CHIP = {
  active:   { cls: 'adm-chip--green',  label: 'ACTIVE' },
  inactive: { cls: 'adm-chip--red',    label: 'INACTIVE' },
};
const AVATAR_COLORS = ['#c3fb9c', '#b4a5ff', '#f8cc65', '#f95630', '#3bd3fd', '#c3fb9c'];
const AVATAR_TEXT   = ['#214f01', '#180058', '#9d6a09', '#520c00', '#0089ad', '#214f01'];

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(
    user
      ? { name: user.name, email: user.email, role: user.role, status: user.status }
      : { name: '', email: '', role: 'user', status: 'active' }
  );

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return;
    onSave(form);
  }

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <button className="adm-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
        <h2 className="adm-modal-title">{user ? 'Edit User' : 'Add New User'}</h2>

        <div className="adm-form-field">
          <label className="adm-form-label">Full Name</label>
          <input className="adm-form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
        </div>
        <div className="adm-form-field">
          <label className="adm-form-label">Email Address</label>
          <input className="adm-form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@um6p.ma" />
        </div>
        <div className="adm-grid-2">
          <div className="adm-form-field">
            <label className="adm-form-label">Role</label>
            <FormSelect
              value={form.role}
              onChange={v => set('role', v)}
              options={[
                { value: 'user',  label: 'User'  },
                { value: 'coach', label: 'Coach' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Status</label>
            <FormSelect
              value={form.status}
              onChange={v => set('status', v)}
              options={[
                { value: 'active',   label: 'Active'   },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>

        <div className="adm-form-actions">
          <button className="adm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn-primary" onClick={handleSave}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
            {user ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ user, onClose, onConfirm }) {
  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
        <h2 className="adm-modal-title">Delete User?</h2>
        <p style={{ color: '#5b5c5a', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          This will permanently remove <strong>{user.name}</strong> and all their data. This action cannot be undone.
        </p>
        <div className="adm-form-actions" style={{ justifyContent: 'center' }}>
          <button className="adm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn-primary" style={{ background: '#b02500', boxShadow: '-4px 4px 0 #2e2f2e' }} onClick={onConfirm}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserManagement() {
  const [users, setUsers]           = useState(INITIAL_USERS);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editUser, setEditUser]     = useState(null);   // null = closed, {} = new, user obj = edit
  const [deleteUser, setDeleteUser] = useState(null);
  const [showModal, setShowModal]   = useState(false);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (roleFilter !== 'ALL' && u.role.toUpperCase() !== roleFilter) return false;
    if (statusFilter !== 'ALL' && u.status.toUpperCase() !== statusFilter) return false;
    return true;
  });

  function handleSave(form) {
    if (editUser?.id) {
      setUsers(us => us.map(u => u.id === editUser.id ? { ...u, ...form } : u));
    } else {
      setUsers(us => [...us, { id: Date.now(), ...form, handle: `@${form.name.split(' ')[0].toLowerCase()}`, joined: 'TODAY', lastActive: 'Just now' }]);
    }
    setShowModal(false);
    setEditUser(null);
  }

  function handleDelete() {
    setUsers(us => us.filter(u => u.id !== deleteUser.id));
    setDeleteUser(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <div className="adm-sticker adm-sticker--purple adm-sticker--rotate-l" style={{ marginBottom: 12 }}>
            DIRECTORY_V.2.0
          </div>
          <h1 className="adm-page-title">User<br/>Management</h1>
        </div>
        <div className="adm-page-actions">
          <div className="adm-search-wrap">
            <span className="material-symbols-outlined adm-search-icon">search</span>
            <input
              className="adm-search"
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <PillSelect
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: 'ALL',   label: 'Role: All' },
              { value: 'ADMIN', label: 'Admin'     },
              { value: 'COACH', label: 'Coach'     },
              { value: 'USER',  label: 'User'      },
            ]}
          />
          <PillSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL',      label: 'Status: All' },
              { value: 'ACTIVE',   label: 'Active'      },
              { value: 'INACTIVE', label: 'Inactive'    },
            ]}
          />
          <button
            className="adm-btn-primary"
            onClick={() => { setEditUser({}); setShowModal(true); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
            Add User
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <span className="adm-chip adm-chip--oat">Total: {users.length}</span>
        <span className="adm-chip adm-chip--green">Active: {users.filter(u => u.status === 'active').length}</span>
        <span className="adm-chip adm-chip--purple">Coaches: {users.filter(u => u.role === 'coach').length}</span>
        <span className="adm-chip adm-chip--red">Inactive: {users.filter(u => u.status === 'inactive').length}</span>
      </div>

      {/* Table */}
      <div className="adm-table-wrap">
        {filtered.length === 0 ? (
          <div className="adm-empty">
            <span className="adm-empty-icon material-symbols-outlined">search_off</span>
            <p className="adm-empty-text">No users match your filters</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        color: AVATAR_TEXT[i % AVATAR_TEXT.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 14,
                        border: '2px solid #dad4c8',
                        flexShrink: 0,
                      }}>
                        {u.name[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#2e2f2e' }}>{u.name}</p>
                        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#767775', letterSpacing: '0.5px' }}>{u.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="adm-td-mono">{u.email}</td>
                  <td><span className={`adm-chip ${ROLE_CHIP[u.role]}`}>{u.role}</span></td>
                  <td><span className={`adm-chip ${STATUS_CHIP[u.status].cls}`}>{STATUS_CHIP[u.status].label}</span></td>
                  <td className="adm-td-mono">{u.joined}</td>
                  <td className="adm-td-mono">{u.lastActive}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      <button
                        className="adm-icon-btn adm-icon-btn--edit"
                        title="Edit user"
                        onClick={() => { setEditUser(u); setShowModal(true); }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit_note</span>
                      </button>
                      <button
                        className="adm-icon-btn adm-icon-btn--danger"
                        title="Delete user"
                        onClick={() => setDeleteUser(u)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination hint */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', color: '#767775' }}>
          SHOWING {filtered.length} OF {users.length} USERS
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3].map(p => (
            <button
              key={p}
              className={p === 1 ? 'adm-btn-primary' : 'adm-btn-ghost'}
              style={p === 1 ? { padding: '6px 14px', fontSize: 11 } : { padding: '6px 14px', fontSize: 11 }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <UserModal
          user={editUser?.id ? editUser : null}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSave={handleSave}
        />
      )}
      {deleteUser && (
        <DeleteConfirm
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
