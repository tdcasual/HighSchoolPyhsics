import { Component, Fragment, type ReactNode } from 'react'

type SceneRuntimeBoundaryProps = {
  scenePath: string
  onBackToOverview: () => void
  onRetryScene?: () => void | Promise<void>
  children: ReactNode
}

type SceneRuntimeBoundaryState = {
  hasError: boolean
  retryVersion: number
}

export class SceneRuntimeBoundary extends Component<
  SceneRuntimeBoundaryProps,
  SceneRuntimeBoundaryState
> {
  state: SceneRuntimeBoundaryState = {
    hasError: false,
    retryVersion: 0,
  }

  static getDerivedStateFromError(): Pick<SceneRuntimeBoundaryState, 'hasError'> {
    return { hasError: true }
  }

  componentDidUpdate(prevProps: SceneRuntimeBoundaryProps): void {
    if (prevProps.scenePath !== this.props.scenePath && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  private handleRetry = (): void => {
    const retryPromise = this.props.onRetryScene?.()
    if (retryPromise) {
      void Promise.resolve(retryPromise).catch(() => undefined)
    }

    this.setState((state) => ({
      hasError: false,
      retryVersion: state.retryVersion + 1,
    }))
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="scene-missing scene-runtime-fallback" role="alert">
          <h2>场景暂时不可用</h2>
          <p>该演示发生异常，可重试当前场景或返回导航继续课堂演示。</p>
          <div className="scene-missing-links">
            <button className="touch-target" onClick={this.handleRetry}>
              重试场景
            </button>
            <button className="touch-target" onClick={this.props.onBackToOverview}>
              返回导航
            </button>
          </div>
        </div>
      )
    }

    return <Fragment key={this.state.retryVersion}>{this.props.children}</Fragment>
  }
}
