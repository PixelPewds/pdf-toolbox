import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* Phase 2-5 Tool Routes will go here, currently Dashboard shows "Coming Soon" */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
