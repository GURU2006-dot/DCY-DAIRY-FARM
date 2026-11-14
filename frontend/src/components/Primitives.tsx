import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, LoaderCircle, PackageOpen } from 'lucide-react';

export function DemoBanner() {
  return <div className="demo-banner"><span className="demo-dot" /> Preview mode · unpriced placeholders & illustrative photography · orders and enquiries are not saved</div>;
}

export function Button({ children, variant = 'primary', className = '', ...props }: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'text' | 'danger'; className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? AlertTriangle : AlertTriangle;
  return <div className={`alert alert-${tone}`} role="status"><Icon size={18} aria-hidden="true" /><div>{children}</div></div>;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={22} aria-hidden="true" /> {label}</div>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><PackageOpen size={25} /></span><h3>{title}</h3>{children && <p>{children}</p>}</div>;
}

export function Field({ label, hint, error, children, className = '' }: {
  label: string; hint?: string; error?: string; children: ReactNode; className?: string;
}) {
  return <label className={`field ${className}`}><span className="field-label">{label}</span>{children}{hint && <small className="field-hint">{hint}</small>}{error && <small className="field-error">{error}</small>}</label>;
}

export function PageHeading({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode;
}) {
  return <div className="page-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}
