import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import Cashier from './pages/Cashier';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/kasir" element={<Cashier />} />
        <Route path="/laporan" element={<Reports />} />
        <Route path="/pengaturan" element={<Settings />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
