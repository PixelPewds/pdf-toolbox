import { ImagePlus, PenTool, Combine, SplitSquareHorizontal, FileArchive } from 'lucide-react';
import ToolCard from '../components/ui/tool-card';
import styles from './dashboard.module.css';

const tools = [
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert PNGs and JPGs to high-quality PDF documents quickly and securely.',
    icon: ImagePlus,
    to: '/tools/image-to-pdf'
  },
  {
    id: 'pdf-editor',
    title: 'PDF Editor',
    description: 'View and annotate PDFs natively in your browser with privacy intact.',
    icon: PenTool,
    to: '/tools/editor'
  },
  {
    id: 'pdf-merge',
    title: 'Merge PDFs',
    description: 'Combine multiple PDF files into a single document in any order.',
    icon: Combine,
    to: '/tools/merge'
  },
  {
    id: 'pdf-split',
    title: 'Split PDF',
    description: 'Extract specific pages or separate a large PDF into smaller files.',
    icon: SplitSquareHorizontal,
    to: '/tools/split'
  },
  {
    id: 'pdf-compress',
    title: 'Compress PDF',
    description: 'Reduce file size while attempting to preserve optimal visual quality.',
    icon: FileArchive,
    to: '/tools/compress'
  }
];

export default function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <h2 className={styles.title}>
          All your PDF tools, <span className="text-gradient">reimagined.</span>
        </h2>
        <p className={styles.subtitle}>
          Blazing fast. Completely private. No servers involved.
        </p>
      </header>

      <section className={styles.grid}>
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            to={tool.to}
            isComingSoon={tool.id !== 'image-to-pdf'}
          />
        ))}
      </section>
    </div>
  );
}
