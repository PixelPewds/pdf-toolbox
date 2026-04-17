import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/layout';
import Dashboard from './pages/dashboard';
import ImageToPdf from './pages/tools/image-to-pdf';

function App() {
  return (
    <BrowserRouter>
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
