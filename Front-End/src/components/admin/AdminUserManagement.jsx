import { createPortal } from 'react-dom';
import { useState } from 'react';
import { FormSelect, PillSelect } from './AdminExerciseLibrary';
import {
  useAdminUser,
  useAdminUsers,
  useBanUser,
  useDeleteAdminUser,
  useUnbanUser,
  useUpdateAdminUser,
} from '../../hooks/queries/useAdmin';
import { authStore } from '../../stores/authStore';

const ROLE_CHIP = {
  admin: 'adm-chip--green',
  moderator: 'adm-chip--purple',
  user: 'adm-chip--oat',
};

const STATUS_CHIP = {
  active: { cls: 'adm-chip--green', label: 'ACTIVE' },
  banned: { cls: 'adm-chip--red', label: 'BANNED' },
};

const GOAL_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'lose_fat', label: 'Lose Fat' },
  { value: 'maintain', label: 'Maintain' },
];

const ACTIVITY_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
];

const PAGE_SIZE = 20;
const AVATAR_COLORS = ['#c3fb9c', '#b4a5ff', '#f8cc65', '#f95630', '#3bd3fd', '#c3fb9c'];
const AVATAR_TEXT = ['#214f01', '#180058', '#9d6a09', '#520c00', '#0089ad', '#214f01'];

function ModalPortal({ children }) {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
}

function isBanned(user) {
  return Boolean(user?.banned_at);
}

function normalizeRole(role) {
  return String(role || 'user').trim().toLowerCase();
}

function formatRole(role) {
  return String(role || 'user').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatGoal(goal) {
  if (!goal) return 'Not set';
  return String(goal).replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date).toUpperCase();
}

function formatRelativeTime(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return '?';
  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

function getUserStatus(user) {
  return isBanned(user) ? 'banned' : 'active';
}

function buildUserSummary(items) {
  const users = Array.isArray(items) ? items : [];
  return {
    total: users.length,
    active: users.filter((user) => !isBanned(user)).length,
    banned: users.filter((user) => isBanned(user)).length,
    admins: users.filter((user) => normalizeRole(user.role) === 'admin').length,
    moderators: users.filter((user) => normalizeRole(user.role) === 'moderator').length,
  };
}

function UserModal({ userId, onClose, onSave, isSaving }) {
  const userQuery = useAdminUser(userId);
  const detail = userQuery.data?.item || {};
  const user = detail.user || null;
  const stats = detail.stats || {};

  return (
    <ModalPortal>
      <div className="adm-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="adm-modal" style={{ maxWidth: 620 }}>
          <button className="adm-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
          <h2 className="adm-modal-title">Edit User</h2>

          {userQuery.isLoading && !user ? (
            <p style={{ color: '#5b5c5a', marginTop: 0 }}>Loading user details...</p>
          ) : null}
          {userQuery.error && !user ? (
            <p style={{ color: '#b02500', marginTop: 0 }}>We could not load this user’s details.</p>
          ) : null}

          {user ? <UserModalForm key={user.id} user={user} stats={stats} onClose={onClose} onSave={onSave} isSaving={isSaving} /> : null}
        </div>
      </div>
    </ModalPortal>
  );
}

function UserModalForm({ user, stats, onClose, onSave, isSaving }) {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    role: normalizeRole(user.role),
    goal: user.goal || '',
    activity_level: user.activity_level || '',
    avatar: user.avatar || '',
  });

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return;
    onSave(form);
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <span className={`adm-chip ${ROLE_CHIP[normalizeRole(user.role)] || 'adm-chip--oat'}`}>{formatRole(user.role)}</span>
        <span className={`adm-chip ${STATUS_CHIP[getUserStatus(user)]?.cls || 'adm-chip--oat'}`}>{STATUS_CHIP[getUserStatus(user)]?.label || 'UNKNOWN'}</span>
        <span className="adm-chip adm-chip--oat">Workouts: {stats.workouts_count ?? 0}</span>
        <span className="adm-chip adm-chip--oat">Meals: {stats.meals_count ?? 0}</span>
      </div>

      <div className="adm-grid-2">
        <div className="adm-form-field">
          <label className="adm-form-label">Full Name</label>
          <input className="adm-form-input" value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="John Doe" />
        </div>
        <div className="adm-form-field">
          <label className="adm-form-label">Email Address</label>
          <input className="adm-form-input" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="john@example.com" />
        </div>
      </div>

      <div className="adm-grid-2">
        <div className="adm-form-field">
          <label className="adm-form-label">Role</label>
          <FormSelect value={form.role} onChange={(value) => setField('role', value)} options={ROLE_OPTIONS} />
        </div>
        <div className="adm-form-field">
          <label className="adm-form-label">Goal</label>
          <FormSelect value={form.goal} onChange={(value) => setField('goal', value)} options={GOAL_OPTIONS} />
        </div>
      </div>

      <div className="adm-grid-2">
        <div className="adm-form-field">
          <label className="adm-form-label">Activity Level</label>
          <FormSelect value={form.activity_level} onChange={(value) => setField('activity_level', value)} options={ACTIVITY_OPTIONS} />
        </div>
        <div className="adm-form-field">
          <label className="adm-form-label">Avatar URL</label>
          <input className="adm-form-input" value={form.avatar} onChange={(event) => setField('avatar', event.target.value)} placeholder="https://..." />
        </div>
      </div>

      {isBanned(user) ? (
        <div className="adm-form-field">
          <label className="adm-form-label">Ban Reason</label>
          <div className="adm-card" style={{ padding: 14, boxShadow: 'none' }}>
            <p style={{ margin: 0, color: '#5b5c5a' }}>{user.ban_reason || 'No reason provided.'}</p>
          </div>
        </div>
      ) : null}

      <div className="adm-form-actions">
        <button className="adm-btn-ghost" onClick={onClose}>Cancel</button>
        <button className="adm-btn-primary" onClick={handleSave} disabled={isSaving || !user}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </>
  );
}

function BanUserModal({ user, onClose, onConfirm, isSubmitting }) {
  const [reason, setReason] = useState(user?.ban_reason || '');
  const isUserBanned = isBanned(user);

  return (
    <ModalPortal>
      <div className="adm-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="adm-modal" style={{ maxWidth: 460 }}>
          <button className="adm-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
          <h2 className="adm-modal-title">{isUserBanned ? 'Unban User' : 'Ban User'}</h2>
          <p style={{ color: '#5b5c5a', lineHeight: 1.6 }}>
            {isUserBanned
              ? `Restore ${user?.name || 'this user'} so they can log in and use the platform again.`
              : `Ban ${user?.name || 'this user'} to force logout and block access immediately.`}
          </p>

          {!isUserBanned ? (
            <div className="adm-form-field">
              <label className="adm-form-label">Reason</label>
              <textarea
                className="adm-form-input"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why this account is being banned..."
                rows={4}
                style={{ borderRadius: 18, resize: 'vertical', minHeight: 108, paddingTop: 14 }}
              />
            </div>
          ) : null}

          <div className="adm-form-actions">
            <button className="adm-btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="adm-btn-primary"
              style={isUserBanned ? undefined : { background: '#b02500', boxShadow: '-4px 4px 0 #2e2f2e' }}
              onClick={() => onConfirm(reason)}
              disabled={isSubmitting}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {isUserBanned ? 'verified_user' : 'block'}
              </span>
              {isSubmitting ? 'Saving...' : isUserBanned ? 'Unban User' : 'Ban User'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function DeleteConfirm({ user, onClose, onConfirm, isDeleting }) {
  return (
    <ModalPortal>
      <div className="adm-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="adm-modal" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
          <h2 className="adm-modal-title">Delete User?</h2>
          <p style={{ color: '#5b5c5a', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            This sends the real destructive delete request for <strong>{user?.name}</strong> with backend confirmation enabled.
          </p>
          <div className="adm-form-actions" style={{ justifyContent: 'center' }}>
            <button className="adm-btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="adm-btn-primary"
              style={{ background: '#b02500', boxShadow: '-4px 4px 0 #2e2f2e' }}
              onClick={onConfirm}
              disabled={isDeleting}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default function AdminUserManagement() {
  const currentUserId = authStore((state) => state.user?.id);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [banTarget, setBanTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const searchValue = search.trim();
  const queryParams = {
    page,
    limit: PAGE_SIZE,
    ...(searchValue ? (searchValue.includes('@') ? { email: searchValue } : { name: searchValue }) : {}),
    ...(roleFilter !== 'ALL' ? { role: roleFilter.toLowerCase() } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  };

  const usersQuery = useAdminUsers(queryParams);
  const usersVm = usersQuery.data || {};
  const users = usersVm.items || usersVm.users || [];
  const metadata = usersVm.metadata || usersVm.raw?.metadata || null;
  const summary = buildUserSummary(users);

  const updateUser = useUpdateAdminUser();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const deleteUser = useDeleteAdminUser();

  function handleSaveUser(form) {
    if (!selectedUserId) return;
    updateUser.mutate(
      {
        user_id: selectedUserId,
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          goal: form.goal || '',
          activity_level: form.activity_level || '',
          avatar: form.avatar?.trim() || '',
        },
      },
      {
        onSuccess: () => {
          setSelectedUserId(null);
        },
      },
    );
  }

  function handleBanToggle(reason) {
    if (!banTarget) return;
    const targetId = banTarget.id;
    const mutation = isBanned(banTarget) ? unbanUser : banUser;
    const payload = isBanned(banTarget) ? targetId : { user_id: targetId, reason: reason?.trim() || '' };

    mutation.mutate(payload, {
      onSuccess: () => {
        setBanTarget(null);
      },
    });
  }

  function handleDeleteUser() {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <div className="adm-sticker adm-sticker--purple adm-sticker--rotate-l" style={{ marginBottom: 12 }}>
            DIRECTORY_V.3.0
          </div>
          <h1 className="adm-page-title">User<br />Management</h1>
        </div>
        <div className="adm-page-actions">
          <div className="adm-search-wrap">
            <span className="material-symbols-outlined adm-search-icon">search</span>
            <input
              className="adm-search"
              type="text"
              placeholder="Search name or email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <PillSelect
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Role: All' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MODERATOR', label: 'Moderator' },
              { value: 'USER', label: 'User' },
            ]}
          />
          <PillSelect
            value={statusFilter.toUpperCase()}
            onChange={(value) => {
              setStatusFilter(value.toLowerCase());
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Status: All' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'BANNED', label: 'Banned' },
            ]}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <span className="adm-chip adm-chip--oat">Loaded: {summary.total}</span>
        <span className="adm-chip adm-chip--green">Active: {summary.active}</span>
        <span className="adm-chip adm-chip--red">Banned: {summary.banned}</span>
        <span className="adm-chip adm-chip--purple">Moderators: {summary.moderators}</span>
        <span className="adm-chip adm-chip--green">Admins: {summary.admins}</span>
      </div>

      <div className="adm-table-wrap">
        {usersQuery.isLoading && !users.length ? (
          <div className="adm-empty">
            <span className="adm-empty-icon material-symbols-outlined">hourglass_top</span>
            <p className="adm-empty-text">Loading users...</p>
          </div>
        ) : usersQuery.error && !users.length ? (
          <div className="adm-empty">
            <span className="adm-empty-icon material-symbols-outlined">cloud_off</span>
            <p className="adm-empty-text">We could not load users from the backend.</p>
          </div>
        ) : !users.length ? (
          <div className="adm-empty">
            <span className="adm-empty-icon material-symbols-outlined">search_off</span>
            <p className="adm-empty-text">No users match these filters.</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Goal</th>
                <th>Joined</th>
                <th>Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const role = normalizeRole(user.role);
                const status = getUserStatus(user);
                const isCurrentUser = String(user.id) === String(currentUserId);

                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: AVATAR_COLORS[index % AVATAR_COLORS.length],
                            color: AVATAR_TEXT[index % AVATAR_TEXT.length],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 13,
                            border: '2px solid #dad4c8',
                            flexShrink: 0,
                            overflow: 'hidden',
                            backgroundImage: user.avatar ? `url(${user.avatar})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          {user.avatar ? '' : getInitials(user.name)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 13, color: '#2e2f2e', margin: 0 }}>{user.name || 'Unnamed user'}</p>
                          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#767775', letterSpacing: '0.5px', margin: '2px 0 0' }}>
                            {String(user.id).slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="adm-td-mono">{user.email || 'N/A'}</td>
                    <td><span className={`adm-chip ${ROLE_CHIP[role] || 'adm-chip--oat'}`}>{formatRole(role)}</span></td>
                    <td><span className={`adm-chip ${STATUS_CHIP[status]?.cls || 'adm-chip--oat'}`}>{STATUS_CHIP[status]?.label || 'UNKNOWN'}</span></td>
                    <td><span className="adm-chip adm-chip--oat">{formatGoal(user.goal)}</span></td>
                    <td className="adm-td-mono">{formatDate(user.created_at)}</td>
                    <td className="adm-td-mono">{formatRelativeTime(user.updated_at)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button
                          className="adm-icon-btn adm-icon-btn--edit"
                          title="Edit user"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit_note</span>
                        </button>
                        <button
                          className="adm-icon-btn"
                          title={status === 'banned' ? 'Unban user' : 'Ban user'}
                          onClick={() => setBanTarget(user)}
                          disabled={isCurrentUser}
                          style={status === 'banned' ? { color: '#38671a' } : { color: '#b02500' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            {status === 'banned' ? 'verified_user' : 'block'}
                          </span>
                        </button>
                        <button
                          className="adm-icon-btn adm-icon-btn--danger"
                          title="Delete user"
                          onClick={() => setDeleteTarget(user)}
                          disabled={isCurrentUser}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', color: '#767775', margin: 0 }}>
          SHOWING {users.length} USERS
          {metadata?.total_count ? ` OF ${metadata.total_count}` : ''}
          {metadata?.page ? ` • PAGE ${metadata.page}` : ''}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn-ghost" style={{ padding: '8px 14px', fontSize: 11 }} onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!metadata?.page || metadata.page <= 1}>
            Previous
          </button>
          <button className="adm-btn-primary" style={{ padding: '8px 14px', fontSize: 11 }}>
            {metadata?.page || page}
          </button>
          <button className="adm-btn-ghost" style={{ padding: '8px 14px', fontSize: 11 }} onClick={() => setPage((current) => current + 1)} disabled={!metadata?.has_next}>
            Next
          </button>
        </div>
      </div>

      {selectedUserId ? (
        <UserModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onSave={handleSaveUser}
          isSaving={updateUser.isPending}
        />
      ) : null}

      {banTarget ? (
        <BanUserModal
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onConfirm={handleBanToggle}
          isSubmitting={banUser.isPending || unbanUser.isPending}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteConfirm
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteUser}
          isDeleting={deleteUser.isPending}
        />
      ) : null}
    </div>
  );
}
