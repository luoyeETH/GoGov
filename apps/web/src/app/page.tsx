export default function Home() {
  return (
    <main className="main">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">AI 优先 · 公考全流程辅助</p>
          <h1>让学习、练习与答疑进入同一条智能流水线</h1>
          <p className="lead">
            从常识积累到速算训练，从错题复盘到试卷排版，全部由可插拔 AI
            能力贯穿。
          </p>
          <div className="hero-actions">
            <button className="primary">创建学习计划</button>
            <button className="ghost">探索 AI 答疑</button>
          </div>
        </div>
        <div className="hero-card">
          <div className="card-title">今日 AI 学习建议</div>
          <ul>
            <li>速算 15 题，限时 8 分钟</li>
            <li>常识主题：行政法基础</li>
            <li>错题复盘：近 7 天高频错误</li>
            <li>试卷排版：模拟卷 A 版</li>
          </ul>
        </div>
      </section>

      <section className="grid">
        <div className="grid-item">
          <h3>知识学习</h3>
          <p>结构化知识卡片 + AI 解释，快速建立框架。</p>
        </div>
        <div className="grid-item">
          <h3>速算训练</h3>
          <p>可定制题目难度与时长，实时记录进步。</p>
        </div>
        <div className="grid-item">
          <h3>错题整理</h3>
          <p>自动归类错因，AI 给出纠错路径。</p>
        </div>
        <div className="grid-item">
          <h3>试卷排版</h3>
          <p>智能组卷与排版模板，适配打印与移动端。</p>
        </div>
      </section>

      <section className="ai-panel">
        <div>
          <h2>AI 适配层</h2>
          <p>
            支持多家模型供应商与自定义 API，统一接口、统一成本与质量
            监控。
          </p>
        </div>
        <div className="ai-tags">
          <span>问答</span>
          <span>解析</span>
          <span>组卷</span>
          <span>排版</span>
          <span>学习建议</span>
        </div>
      </section>
    </main>
  );
}
