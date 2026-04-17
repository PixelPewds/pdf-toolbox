import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import styles from './ToolCard.module.css';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  isComingSoon?: boolean;
}

export default function ToolCard({ title, description, icon: Icon, to, isComingSoon }: ToolCardProps) {
  const cardContent = (
    <>
      <div className={styles.iconWrapper}>
        <Icon size={32} className={styles.icon} />
      </div>
      <div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
      {isComingSoon && <span className={styles.badge}>Coming Soon</span>}
    </>
  );

  if (isComingSoon) {
    return (
      <div className={`glass-panel ${styles.card} ${styles.disabled}`}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link to={to} className={`glass-panel ${styles.card} ${styles.interactive}`}>
      {cardContent}
    </Link>
  );
}
