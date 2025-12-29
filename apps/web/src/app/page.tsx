import Link from "next/link";
import DailyTasksModule from "../components/daily-tasks";
import HomeHeroCopy from "../components/home-hero-copy";
import MobileMoreNav from "../components/mobile-more-nav";

export default function Home() {
  return (
    <main className="main">
      <section className="hero">
        <div className="hero-text">
          <HomeHeroCopy />
          <div className="hero-actions">
            <Link href="/study-plan" className="primary button-link">
              创建学习计划
            </Link>
            <Link href="/ai/assist" className="ghost button-link">
              探索 AI 答疑
            </Link>
            <Link href="/kline" className="ghost button-link">
              上岸 K 线
            </Link>
            <MobileMoreNav />
          </div>
        </div>
        <div className="hero-card">
          <DailyTasksModule variant="summary" />
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
          <h2>计划开发模块</h2>
          <p>这些模块将逐步开放，展示整体路线与能力边界。</p>
        </div>
        <div className="module-grid">
          <Link href="/knowledge" className="module-card module-card-active">
            <div className="module-title">常识学习</div>
            <p>OCR 导入思维导图，AI 生成常识学习卡片。</p>
            <span className="module-status active">已上线</span>
          </Link>
          <Link href="/computer" className="module-card module-card-active">
            <div className="module-title">计算机专项</div>
            <p>计算机专业科目学习板块 + AI 提问 + 轻量判题。</p>
            <span className="module-status active">已上线</span>
          </Link>
          <Link href="/mistakes" className="module-card module-card-active">
            <div className="module-title">错题整理</div>
            <p>自动归因 + 复盘路径，AI 给出纠错建议。</p>
            <span className="module-status active">已上线</span>
          </Link>
          <Link href="/mock-report" className="module-card module-card-active">
            <div className="module-title">模考成绩解读</div>
            <p>上传成绩截图，AI 生成点评与训练计划。</p>
            <span className="module-status active">已上线</span>
          </Link>
          <Link href="/study-plan" className="module-card module-card-active">
            <div className="module-title">备考规划</div>
            <p>整合背景信息与模考数据，生成长期/周/日计划。</p>
            <span className="module-status active">已上线</span>
          </Link>
          <Link href="/stats" className="module-card module-card-active">
            <div className="module-title">统计看板</div>
            <p>题型正确率、速度曲线、近 7 天趋势。</p>
            <span className="module-status active">已上线</span>
          </Link>
          <Link href="/pomodoro" className="module-card module-card-active">
            <div className="module-title">番茄钟</div>
            <p>沉浸式专注计时 + 学习地图统计。</p>
            <span className="module-status active">已上线</span>
          </Link>
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
          <Link href="/daily-tasks" className="module-card module-card-active">
            <div className="module-title">今日任务</div>
            <p>每日自动生成学习清单，支持调整与打卡。</p>
            <span className="module-status active">已上线</span>
          </Link>
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
