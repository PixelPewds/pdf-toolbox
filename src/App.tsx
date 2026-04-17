import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import ImageToPdf from './pages/tools/image-to-pdf';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tools/image-to-pdf" element={<ImageToPdf />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
