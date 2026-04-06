type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
};

export const MetricCard = ({ title, value, subtitle, highlight }: MetricCardProps) => (
  <div className={`rounded-lg border bg-card p-5 shadow-sm ${highlight ? 'border-primary' : ''}`}>
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <p className={`mt-1 text-3xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
    {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
  </div>
);
