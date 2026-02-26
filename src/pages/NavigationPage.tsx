import type { DemoRoute } from '../app/demoRoutes'

type NavigationPageProps = {
  routes: DemoRoute[]
  onOpenRoute: (path: string) => void
}

export function NavigationPage({ routes, onOpenRoute }: NavigationPageProps) {
  return (
    <section className="overview-page" data-testid="overview-page">
      <div className="overview-hero">
        <p className="overview-kicker">课堂演示入口</p>
        <h2>演示导航</h2>
        <p className="overview-lead">从单入口进入各个演示页面，避免课堂演示中跨页干扰。</p>
      </div>

      <div className="overview-grid">
        {routes.map((route, index) => {
          const meta = route.meta

          return (
            <article key={route.path} className={`overview-card tone-${meta.tone}`}>
              <div className="overview-card-head">
                <p className="overview-card-index">{String(index + 1).padStart(2, '0')}</p>
                <p className="overview-card-tag">{meta.tag}</p>
              </div>
              <h3>{route.label}</h3>
              <p className="overview-card-summary">{meta.summary}</p>
              <ul className="overview-points">
                {meta.highlights.map((item) => (
                  <li key={`${route.path}-${item}`}>{item}</li>
                ))}
              </ul>
              <button onClick={() => onOpenRoute(route.path)}>进入{route.label}</button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
