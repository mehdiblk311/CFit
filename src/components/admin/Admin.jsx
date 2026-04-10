import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout           from './AdminLayout';
import AdminDashboard        from './AdminDashboard';
import AdminUserManagement   from './AdminUserManagement';
import AdminExerciseLibrary  from './AdminExerciseLibrary';
import AdminUserPrograms     from './AdminUserPrograms';
import AdminNutritionCS      from './AdminNutritionCS';

export default function Admin() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tab, setTab] = useState('dashboard');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleTabChange(id) {
    if (id === 'logout') { handleLogout(); return; }
    setTab(id);
  }

  const content = {
    dashboard: <AdminDashboard />,
    users:     <AdminUserManagement />,
    exercises: <AdminExerciseLibrary />,
    programs:  <AdminUserPrograms />,
    nutrition: <AdminNutritionCS />,
  };

  return (
    <AdminLayout
      activeTab={tab}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
    >
      {content[tab] ?? <AdminDashboard />}
    </AdminLayout>
  );
}
