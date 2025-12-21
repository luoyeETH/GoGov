import DailyTasksModule from "../../components/daily-tasks";

export default function DailyTasksPage() {
  return (
    <main className="main daily-page">
      <section className="daily-hero">
        <div>
          <p className="eyebrow">每日任务</p>
          <h1>今日学习清单</h1>
          <p className="lead">
            根据备考规划自动生成，可随时调整任务与勾选完成进度。
          </p>
        </div>
        <div className="status-card">
          <div className="status-title">操作提示</div>
          <div className="status-lines">
            <span>可提交调整需求让 AI 重新安排。</span>
            <span>支持任务拆解与完成打卡。</span>
            <span>任务每日自动更新。</span>
          </div>
        </div>
      </section>

      <section className="daily-section">
        <DailyTasksModule variant="standalone" />
      </section>
    </main>
  );
}
