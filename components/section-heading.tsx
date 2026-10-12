export function SectionHeading({ command, title }: { command: string; title: string }) {
  return (
    <div className="mb-8 flex flex-col gap-1">
      <p className="font-mono text-xs text-muted-foreground">
        <span className="text-primary">{'$ '}</span>
        {command}
      </p>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
    </div>
  )
}
