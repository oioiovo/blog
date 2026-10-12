import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 py-16">
      <p className="font-mono text-sm text-muted-foreground">
        <span className="text-primary">{'$ '}</span>
        {'git checkout 404'}
      </p>
      <p className="font-mono text-sm text-destructive">{"error: pathspec '404' did not match any file(s)"}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{'页面不存在'}</h1>
      <Link href="/" className="w-fit text-sm font-medium text-primary hover:underline">
        {'回到首页'}
      </Link>
    </div>
  )
}
