import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';

function App() {
  return (
    <div className="flex h-screen w-full bg-bg-dark overflow-hidden font-sans">
      <Sidebar />
      <Dashboard />
    </div>
  );
}

export default App;
