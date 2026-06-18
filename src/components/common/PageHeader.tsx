import type { CSSProperties } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  subtitleMarginBottom?: number;
  titleStyle?: CSSProperties;
}

const defaultTitleStyle: CSSProperties = {
  fontFamily: "'Oswald', sans-serif",
  fontSize: 'clamp(2rem,6vw,4rem)',
  letterSpacing: 4,
  marginBottom: 8,
};

export default function PageHeader({
  title,
  subtitle,
  subtitleMarginBottom = 32,
  titleStyle,
}: PageHeaderProps) {
  return (
    <>
      <h1 className="glow-title" style={{ ...defaultTitleStyle, ...titleStyle }}>
        {title}
      </h1>
      <p style={{ color: '#888', marginBottom: subtitleMarginBottom, fontSize: '0.9rem' }}>
        {subtitle}
      </p>
    </>
  );
}
