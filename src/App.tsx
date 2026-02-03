import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './components/layout/NavBar';
import { SettingsModal } from './components/settings/SettingsModal';
import { useUIStore } from './store/uiStore';

export function App() {
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <NavBar />
      <main>
        <Outlet />
      </main>
      <SettingsModal />
    </div>
  );
}
