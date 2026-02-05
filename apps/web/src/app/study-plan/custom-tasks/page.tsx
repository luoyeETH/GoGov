import CustomTasksModule from "../../../components/custom-tasks";

export default function CustomTasksPage() {
  return (
    <main className="main daily-page">
      <section className="daily-hero">
        <div>
          <p className="eyebrow">规划 · 待办清单</p>
          <h1>待办清单</h1>
        </div>
      </section>

      <section className="daily-section">
        <CustomTasksModule variant="standalone" />
      </section>
    </main>
  );
}
