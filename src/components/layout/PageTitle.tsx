interface PageTitleProps {
  title: string;
  children?: React.ReactNode;
}

export function PageTitle({ title, children = null }: PageTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {children}
    </div>
  );
}
