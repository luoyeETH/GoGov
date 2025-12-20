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

      <section className="module-section">
        <div className="module-header">
          <h2>后续模块占位</h2>
          <p>这些模块将逐步开放，先展示整体路线与能力边界。</p>
        </div>
        <div className="module-grid">
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">常识学习</div>
            <p>结构化知识卡片 + AI 解释，快速建立框架。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">错题整理</div>
            <p>自动归因 + 复盘路径，AI 给出纠错建议。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">AI 答疑</div>
            <p>随问随答，聚焦行测速算与资料分析。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">统计看板</div>
            <p>题型正确率、速度曲线、近 7 天趋势。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">专项训练计划</div>
            <p>按薄弱点自动生成训练目标与计划。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">AI 解析生成</div>
            <p>每题给出速算捷径与口算路径。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">智能组卷</div>
            <p>按薄弱点生成 10/20/50 题套卷。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">AI 学习建议</div>
            <p>根据记录生成下一阶段训练策略。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">个性化预测</div>
            <p>结合训练节奏与正确率进行趋势预测。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">题库质量分层</div>
            <p>题目与解析分级，聚焦高价值题目。</p>
            <span className="module-status">开发中</span>
          </div>
          <div className="module-card" data-tooltip="开发中">
            <div className="module-title">学习社区</div>
            <p>共享高赞解法与复盘路径。</p>
            <span className="module-status">开发中</span>
          </div>
        </div>
      </section>
    </main>
  );
}
