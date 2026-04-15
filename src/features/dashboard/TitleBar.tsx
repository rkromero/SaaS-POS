export const TitleBar = (props: {
  title: React.ReactNode;
  description?: React.ReactNode;
}) => (
  <div className="mb-8">
    <div className="font-lora text-2xl font-bold text-n900">{props.title}</div>

    {props.description && (
      <div className="mt-1 text-sm text-muted-foreground">
        {props.description}
      </div>
    )}
  </div>
);
