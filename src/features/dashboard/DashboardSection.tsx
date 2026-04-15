export const DashboardSection = (props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
    <div className="max-w-3xl">
      <div className="font-lora text-lg font-bold text-n900">{props.title}</div>

      <div className="mb-4 mt-0.5 text-sm font-medium text-muted-foreground">
        {props.description}
      </div>

      {props.children}
    </div>
  </div>
);
