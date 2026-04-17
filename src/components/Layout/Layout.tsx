import { Outlet, Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.container}>
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.logoContainer}>
          <Layers className={styles.logoIcon} size={28} />
          <h1 className={styles.logoText}>
            PDF <span className="text-gradient">Toolbox</span>
          </h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>Dashboard</Link>
          <a href="https://github.com/PixelPewds/pdf-toolbox" target="_blank" rel="noreferrer" className={styles.navLink}>GitHub</a>
        </nav>
      </header>
      
      <main className={styles.main}>
        <Outlet />
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} PDF Toolbox. All processing is done locally in your browser.</p>
      </footer>
    </div>
  );
}
