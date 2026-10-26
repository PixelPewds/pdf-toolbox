import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import ImageToPdf from './pages/tools/image-to-pdf';

const PdfEditor = lazy(() => import('./pages/tools/pdf-editor'));

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tools/image-to-pdf" element={<ImageToPdf />} />
          <Route path="tools/editor" element={<Suspense fallback={<div>Loading PDF Editor...</div>}><PdfEditor /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
