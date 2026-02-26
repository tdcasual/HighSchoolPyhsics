type NavigationRoute = {
  path: string
  label: string
}

type NavigationPageProps = {
  routes: NavigationRoute[]
  onOpenRoute: (path: string) => void
}

type RouteMeta = {
  tag: string
  summary: string
  highlights: [string, string]
  tone: 'scope' | 'cyclotron' | 'mhd' | 'oersted'
}

const ROUTE_META: Record<string, RouteMeta> = {
  '/oscilloscope': {
    tag: '波形合成',
    summary: '双通道电压驱动 + 李萨如图形',
    highlights: ['函数编辑与预设切换', '荧光屏轨迹实时更新'],
    tone: 'scope',
  },
  '/cyclotron': {
    tag: '粒子动力学',
    summary: '交变电场加速 + 磁场轨道约束',
    highlights: ['U-t / Ek-t 双曲线', '可切换加速时间模型'],
    tone: 'cyclotron',
  },
  '/mhd': {
    tag: '能量转换',
    summary: '等离子体通道中的感应电势演示',
    highlights: ['磁场/流速/导电率联动', '端电压实时读数'],
    tone: 'mhd',
  },
  '/oersted': {
    tag: '课堂观察',
    summary: '三磁针偏转与导线姿态联动',
    highlights: ['拖拽磁针自由摆位', '磁感线可显隐对比'],
    tone: 'oersted',
  },
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
          const meta = ROUTE_META[route.path]

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
