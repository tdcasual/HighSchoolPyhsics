import type { PropsWithChildren } from 'react'

type DemoPageProps = PropsWithChildren<{
  pageId: string
}>

export function DemoPage({ pageId, children }: DemoPageProps) {
  return (
    <section className="demo-page" data-testid="demo-page" data-page-id={pageId}>
      {children}
    </section>
  )
}
