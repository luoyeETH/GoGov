import CustomTasksModule from "../../../components/custom-tasks";

export default function CustomTasksPage() {
  return (
    <main className="main daily-page custom-tasks-page">
      <section className="daily-hero app-page-header">
        <div className="app-page-header-main">
          <p className="eyebrow">规划 · 待办清单</p>
          <h1 className="app-page-title">待办清单</h1>
          <p className="lead app-page-subtitle">
            管理单次、每日、每周与间隔任务，把自定义安排同步到今日执行面板。
          </p>
        </div>
        <div className="app-page-metrics custom-tasks-summary" aria-label="待办清单功能概览">
          <div className="app-page-metric">
            <span className="app-page-metric-label">任务面板</span>
            <strong className="app-page-metric-value">4</strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">重复规则</span>
            <strong className="app-page-metric-value">4</strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">移动端</span>
            <strong className="app-page-metric-value">折叠视图</strong>
          </div>
        </div>
      </section>

      <section className="daily-section">
        <CustomTasksModule variant="standalone" />
      </section>
    </main>
  );
}
