interface PageHeaderProps {
  title: string;
  subtitle: string;
  subtitleMarginBottom?: number;
}

export default function PageHeader({
  title,
  subtitle,
  subtitleMarginBottom = 32,
}: PageHeaderProps) {
  return (
    <header className="text-center" style={{ marginBottom: subtitleMarginBottom }}>
      <h1 className="page-heading font-display font-bold" style={{ backgroundImage: 'linear-gradient(180deg, #fff 0%, #ffcbd1 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(255,26,74,0.4))' }}>
        {title}
      </h1>
      <p className="page-subtitle" style={{ letterSpacing: '0.3rem' }}>{subtitle}</p>
    </header>
  );
}
