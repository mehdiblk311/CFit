import { useState } from 'react';
import AdminLayout           from './AdminLayout';
import AdminDashboard        from './AdminDashboard';
import AdminUserManagement   from './AdminUserManagement';
import AdminExerciseLibrary  from './AdminExerciseLibrary';
import AdminUserPrograms     from './AdminUserPrograms';
import AdminNutritionCS      from './AdminNutritionCS';

export default function Admin({ onExit }) {
  const [tab, setTab] = useState('dashboard');

  function handleTabChange(id) {
    if (id === 'logout') { onExit?.(); return; }
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
      onLogout={onExit}
    >
      {content[tab] ?? <AdminDashboard />}
    </AdminLayout>
  );
}
