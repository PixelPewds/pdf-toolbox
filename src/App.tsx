import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/layout';
import Dashboard from './pages/dashboard';

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
