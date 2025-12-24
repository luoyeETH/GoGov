"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingButton from "../../components/loading-button";

const apiBase = (() => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window === "undefined") {
    return "http://localhost:3031";
  }
  const hostname = window.location.hostname.replace(/^www\./, "");
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3031";
  }
  return `https://api.${hostname}`;
})();

const sessionKey = "gogov_session_token";
const analysisKey = "gogov_kline_analysis";
const klineDraftKey = "gogov_kline_step1";

const provinces = [
  "北京",
  "天津",
  "河北",
  "山西",
  "内蒙古",
  "辽宁",
  "吉林",
  "黑龙江",
  "上海",
  "江苏",
  "浙江",
  "安徽",
  "福建",
  "江西",
  "山东",
  "河南",
  "湖北",
  "湖南",
  "广东",
  "广西",
  "海南",
  "重庆",
  "四川",
  "贵州",
  "云南",
  "西藏",
  "陕西",
  "甘肃",
  "青海",
  "宁夏",
  "新疆",
  "香港",
  "澳门",
  "台湾"
];

const DEFAULT_KLINE_SYSTEM_PROMPT = [
  "你是一位严厉、客观、不留情面的八字命理大师，同时精通中国公务员考试体系（国考、省考、选调、事业编）、长期备考心理、竞争淘汰机制与人生路径博弈。",
  "",
  "你的任务是：",
  "根据已经排好的八字四柱和大运信息，精准分析命主的“考公上岸窗口期”，并生成仅覆盖有效年龄段的「上岸概率 K 线数据」。",
  "",
  "核心规则（必须遵守）",
  "1. 真实客观",
  "",
  "严禁安慰式解读",
  "",
  "不适合考公，必须明确说“不宜死磕体制”",
  "",
  "多年失败的命，必须体现“反复、下滑、破防”",
  "",
  "2. 年龄与时间范围（关键修改点）",
  "",
  "只允许输出 23–40 （虚岁）的 chartPoints",
  "",
  "不得输出 23 岁之前或 40 岁之后的 K 线数据",
  "",
  "这是命主唯一具有现实考公意义的时间窗口",
  "",
  "若 40 岁前无成：",
  "",
  "必须在 summary 中明确判定：",
  "→ “此命在公务员体系中已错过窗口”",
  "",
  "3. K 线详批（极其重要）",
  "",
  "chartPoints 数组长度：固定为 18",
  "",
  "age：从 23 → 40，连续递增",
  "",
  "每一年必须：",
  "",
  "明确是否利于：",
  "",
  "报名",
  "",
  "笔试",
  "",
  "面试",
  "",
  "体检 / 政审",
  "",
  "是否出现：",
  "",
  "高分落榜",
  "",
  "面试翻车",
  "",
  "临门被刷",
  "",
  "突然上岸",
  "",
  "明确点出：",
  "",
  "官杀、印星、伤官、比劫的作用",
  "",
  "心态变化与战略建议",
  "",
  "八字分析重点（考公定制，不可删）",
  "1. 是否具备“体制命”",
  "",
  "官星是否为用",
  "",
  "官是否有印护",
  "",
  "是否被伤官、劫财长期破坏",
  "",
  "2. 必须重点分析",
  "",
  "地支 辰戌丑未墓库",
  "",
  "是否开库生官",
  "",
  "是否闭库埋官",
  "",
  "冲刑是否对应：",
  "",
  "面试翻车",
  "",
  "政审受阻",
  "",
  "年年差一点",
  "",
  "大运与流年上岸判断逻辑",
  "上岸成立的必要条件（缺一不可）",
  "",
  "流年官杀为喜或被印化",
  "",
  "官不被伤官冲",
  "",
  "大运不反噬原局用神",
  "",
  "若不成立",
  "",
  "必须如实写明：",
  "",
  "“该年努力无效”",
  "",
  "“属于陪跑年份”",
  "",
  "输出 JSON 结构（年龄限制版）",
  "{",
  '  "bazi": ["年柱", "月柱", "日柱", "时柱"],',
  '  "summary": "整体考公命运总评，明确是否值得死磕",',
  '  "summaryScore": 6,',
  '  "personality": "备考人格分析（焦虑、自律、摆烂临界点）",',
  '  "personalityScore": 7,',
  '  "study": "学习与应试能力分析",',
  '  "studyScore": 8,',
  '  "career": "体制适配度与岗位层级判断",',
  '  "careerScore": 6,',
  '  "familySupport": "家庭是否支撑长期备考",',
  '  "familySupportScore": 6,',
  '  "health": "长期备考带来的健康风险",',
  '  "healthScore": 5,',
  '  "examLuck": "考试运专项分析",',
  '  "examLuckScore": 7,',
  '  "landingYear": "最可能上岸的年份（若无则明确写“无”）",',
  '  "landingProbability": 0.68,',
  '  "backupPath": "40岁后最优现实转轨路径",',
  '  "chartPoints": [',
  "    {",
  '      "age": 21,',
  '      "year": 2018,',
  '      "daYun": "某某大运",',
  '      "ganZhi": "流年干支",',
  '      "open": 55,',
  '      "close": 62,',
  '      "high": 70,',
  '      "low": 48,',
  '      "score": 62,',
  '      "reason": "该年考公详批，约100字"',
  "    }",
  "  ]",
  "}",
  "",
  "强制校验清单（生成前自查）",
  "",
  "✓ chartPoints 长度 = 18",
  "",
  "✓ age = 23 → 40（虚岁）",
  "",
  "✓ 不输出任何 40 岁以后的“幻想上岸年”",
  "",
  "✓ 若无明确上岸年，landingYear 必须写 “无”",
  "",
  "✓ JSON 严格合法",
  "",
  "请严格返回 JSON，不要输出任何额外文本或 Markdown。"
].join("\n");

const GENTLE_KLINE_SYSTEM_PROMPT = [
  "你是一位理性、客观、温和但专业的八字命理大师，同时精通中国公务员考试体系（国考、省考、选调、事业编）、长期备考心理、竞争淘汰机制与人生路径博弈。",
  "",
  "你的任务是：",
  "根据已经排好的八字四柱和大运信息，精准分析命主的“考公上岸窗口期”，并生成仅覆盖有效年龄段的「上岸概率 K 线数据」。",
  "",
  "核心规则（必须遵守）",
  "1. 真实客观但语气温和",
  "",
  "避免空泛安慰，但可以给出建设性鼓励与可执行的方向",
  "",
  "不适合考公时，必须明确说明“不宜死磕体制”，并补充可行的转轨路径",
  "",
  "多年失败的命，需体现“反复、下滑、心态受挫”，同时给出希望与调整策略",
  "",
  "即使运势不佳，也要给出可执行的出路与成长建议",
  "",
  "2. 年龄与时间范围（关键修改点）",
  "",
  "只允许输出 23–40 （虚岁）的 chartPoints",
  "",
  "不得输出 23 岁之前或 40 岁之后的 K 线数据",
  "",
  "这是命主唯一具有现实考公意义的时间窗口",
  "",
  "若 40 岁前无成：",
  "",
  "必须在 summary 中明确判定：",
  "→ “此命在公务员体系中已错过窗口”",
  "",
  "3. K 线详批（极其重要）",
  "",
  "chartPoints 数组长度：固定为 18",
  "",
  "age：从 23 → 40，连续递增",
  "",
  "每一年必须：",
  "",
  "明确是否利于：",
  "",
  "报名",
  "",
  "笔试",
  "",
  "面试",
  "",
  "体检 / 政审",
  "",
  "是否出现：",
  "",
  "高分落榜",
  "",
  "面试翻车",
  "",
  "临门被刷",
  "",
  "突然上岸",
  "",
  "明确点出：",
  "",
  "官杀、印星、伤官、比劫的作用",
  "",
  "心态变化与战略建议",
  "",
  "八字分析重点（考公定制，不可删）",
  "1. 是否具备“体制命”",
  "",
  "官星是否为用",
  "",
  "官是否有印护",
  "",
  "是否被伤官、劫财长期破坏",
  "",
  "2. 必须重点分析",
  "",
  "地支 辰戌丑未墓库",
  "",
  "是否开库生官",
  "",
  "是否闭库埋官",
  "",
  "冲刑是否对应：",
  "",
  "面试翻车",
  "",
  "政审受阻",
  "",
  "年年差一点",
  "",
  "大运与流年上岸判断逻辑",
  "上岸成立的必要条件（缺一不可）",
  "",
  "流年官杀为喜或被印化",
  "",
  "官不被伤官冲",
  "",
  "大运不反噬原局用神",
  "",
  "若不成立",
  "",
  "必须如实写明：",
  "",
  "“该年努力无效”",
  "",
  "“属于陪跑年份”",
  "",
  "输出 JSON 结构（年龄限制版）",
  "{",
  '  "bazi": ["年柱", "月柱", "日柱", "时柱"],',
  '  "summary": "整体考公命运总评，明确是否值得死磕，并给出希望与方向",',
  '  "summaryScore": 6,',
  '  "personality": "备考人格分析（焦虑、自律、摆烂临界点）",',
  '  "personalityScore": 7,',
  '  "study": "学习与应试能力分析",',
  '  "studyScore": 8,',
  '  "career": "体制适配度与岗位层级判断",',
  '  "careerScore": 6,',
  '  "familySupport": "家庭是否支撑长期备考",',
  '  "familySupportScore": 6,',
  '  "health": "长期备考带来的健康风险",',
  '  "healthScore": 5,',
  '  "examLuck": "考试运专项分析",',
  '  "examLuckScore": 7,',
  '  "landingYear": "最可能上岸的年份（若无则明确写“无”）",',
  '  "landingProbability": 0.68,',
  '  "backupPath": "40岁后最优现实转轨路径",',
  '  "chartPoints": [',
  "    {",
  '      "age": 21,',
  '      "year": 2018,',
  '      "daYun": "某某大运",',
  '      "ganZhi": "流年干支",',
  '      "open": 55,',
  '      "close": 62,',
  '      "high": 70,',
  '      "low": 48,',
  '      "score": 62,',
  '      "reason": "该年考公详批，约100字"',
  "    }",
  "  ]",
  "}",
  "",
  "强制校验清单（生成前自查）",
  "",
  "✓ chartPoints 长度 = 18",
  "",
  "✓ age = 23 → 40（虚岁）",
  "",
  "✓ 不输出任何 40 岁以后的“幻想上岸年”",
  "",
  "✓ 若无明确上岸年，landingYear 必须写 “无”",
  "",
  "✓ JSON 严格合法",
  "",
  "请严格返回 JSON，不要输出任何额外文本或 Markdown。"
].join("\n");

type BaziResult = {
  year_pillar: string;
  month_pillar: string;
  day_pillar: string;
  hour_pillar: string;
  bazi: [string, string, string, string];
  dayun_start_age: number;
  dayun_direction: "顺行" | "逆行";
  dayun_sequence: string[];
  first_dayun: string;
  true_solar_time: string;
  hour_branch_name: string;
  lunar_date: string;
};

type RequestState = "idle" | "loading" | "queued" | "error";
type KlineAnalysis = {
  summary?: string;
  landingYear?: string;
  landingProbability?: number;
};

type KlineHistoryRecord = {
  id: string;
  analysis: KlineAnalysis;
  raw?: string | null;
  model?: string | null;
  warning?: string | null;
  createdAt?: string | null;
  summary?: string | null;
  landingYear?: string | null;
  landingProbability?: number | null;
  input?: {
    birthDate?: string;
    birthTime?: string;
    gender?: string;
    province?: string;
    ziHourMode?: string;
      education?: string;
      schoolTier?: string;
      prepTime?: string;
      interviewCount?: string;
      fenbiForecastXingce?: string;
      fenbiForecastShenlun?: string;
      historyScoreXingce?: string;
      historyScoreShenlun?: string;
      promptStyle?: "default" | "gentle";
    };
};

type KlineHistoryInput = NonNullable<KlineHistoryRecord["input"]>;

export default function KlinePage() {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [birthTime, setBirthTime] = useState("08:00");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [province, setProvince] = useState("北京");
  const [ziHourMode, setZiHourMode] = useState<"late" | "early">("late");
  const [result, setResult] = useState<BaziResult | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<RequestState>("idle");
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [countdownPhase, setCountdownPhase] = useState<"initial" | "extend" | null>(
    null
  );
  const [queueInfo, setQueueInfo] = useState<{
    id: string;
    position: number;
    etaMinutes: number;
    status?: "queued" | "processing";
  } | null>(null);
  const [analysisInputSnapshot, setAnalysisInputSnapshot] =
    useState<KlineHistoryInput | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const [education, setEducation] = useState("");
  const [schoolTier, setSchoolTier] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [interviewCount, setInterviewCount] = useState("");
  const [fenbiForecastXingce, setFenbiForecastXingce] = useState("");
  const [fenbiForecastShenlun, setFenbiForecastShenlun] = useState("");
  const [historyScoreXingce, setHistoryScoreXingce] = useState("");
  const [historyScoreShenlun, setHistoryScoreShenlun] = useState("");
  const [promptStyle, setPromptStyle] = useState<"default" | "gentle">("default");
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptCopyMessage, setPromptCopyMessage] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<KlineHistoryRecord[]>([]);
  const [isEditingBazi, setIsEditingBazi] = useState(false);
  const [draftPillars, setDraftPillars] = useState({
    year: "",
    month: "",
    day: "",
    hour: ""
  });
  const [draftDayunSequence, setDraftDayunSequence] = useState<string[]>([]);
  const [draftDayunStartAge, setDraftDayunStartAge] = useState("");
  const [draftDayunDirection, setDraftDayunDirection] = useState<"顺行" | "逆行">(
    "顺行"
  );

  const isLocked = Boolean(result);
  const isGlobalFreeAiExhausted = Boolean(
    analysisMessage && analysisMessage.includes("上游免费额度已耗尽")
  );
  const isFreeAiExhausted = Boolean(
    analysisMessage &&
      (analysisMessage.includes("上游免费额度已耗尽") ||
        analysisMessage.includes("免费 AI 今日额度已用完") ||
        analysisMessage.includes("额度受限"))
  );
  const queuePositionText = queueInfo?.position
    ? `第 ${queueInfo.position} 位`
    : "等待中";
  const queueEtaText = queueInfo?.etaMinutes
    ? `${queueInfo.etaMinutes} 分钟`
    : "2 分钟";
  const queueLabel =
    queueInfo?.status === "processing" ? "已进入处理" : "排队中";

  const promptText = useMemo(() => {
    if (!result) {
      return "";
    }
    const payload = {
      birthDate: birthDate ?? "",
      birthTime: birthTime ?? "",
      gender: gender ?? "",
      province: province ?? "",
      ziHourMode: ziHourMode ?? "",
      bazi: result.bazi ?? [],
      dayunSequence: result.dayun_sequence ?? [],
      dayunStartAge: result.dayun_start_age ?? null,
      dayunDirection: result.dayun_direction ?? "",
      trueSolarTime: result.true_solar_time ?? "",
      lunarDate: result.lunar_date ?? "",
      education: education.trim() || "",
      schoolTier: schoolTier.trim() || "",
      prepTime: prepTime.trim() || "",
      interviewCount: interviewCount.trim() || "",
      fenbiForecastXingce: fenbiForecastXingce.trim() || "",
      fenbiForecastShenlun: fenbiForecastShenlun.trim() || "",
      historyScoreXingce: historyScoreXingce.trim() || "",
      historyScoreShenlun: historyScoreShenlun.trim() || "",
      promptStyle
    };
    const system =
      promptStyle === "gentle" ? GENTLE_KLINE_SYSTEM_PROMPT : DEFAULT_KLINE_SYSTEM_PROMPT;
    const user = [
      "已排盘与补充信息如下（JSON）：",
      JSON.stringify(payload, null, 2),
      "请按照 system 要求生成结果。"
    ].join("\n");
    return ["【System】", system, "", "【User】", user].join("\n");
  }, [
    result,
    birthDate,
    birthTime,
    gender,
    province,
    ziHourMode,
    education,
    schoolTier,
    prepTime,
    interviewCount,
    fenbiForecastXingce,
    fenbiForecastShenlun,
    historyScoreXingce,
    historyScoreShenlun,
    promptStyle
  ]);

  const stepLabel = useMemo(() => (result ? "结果就绪" : "填写资料"), [result]);
  const countdownText = useMemo(() => {
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    return `${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(2, "0")}`;
  }, [countdownSeconds]);

  useEffect(() => {
    if (analysisState !== "loading") {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setCountdownSeconds(0);
      setCountdownPhase(null);
      return;
    }
    setCountdownSeconds(120);
    setCountdownPhase("initial");
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
    }
    countdownTimerRef.current = window.setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [analysisState]);

  useEffect(() => {
    if (analysisState !== "loading") {
      return;
    }
    if (countdownSeconds > 0) {
      return;
    }
    if (countdownPhase === "initial") {
      setCountdownSeconds(30);
      setCountdownPhase("extend");
      return;
    }
    if (countdownPhase === "extend") {
      setCountdownSeconds(30);
    }
  }, [analysisState, countdownSeconds, countdownPhase]);

  useEffect(() => {
    if (analysisState !== "queued" || !queueInfo?.id) {
      return;
    }
    let isActive = true;
    let pollTimer: number | null = null;
    const pollQueue = async () => {
      const token = window.localStorage.getItem(sessionKey);
      if (!token) {
        if (isActive) {
          setAnalysisState("error");
          setAnalysisMessage("请先登录后再使用 AI 测算。");
          setQueueInfo(null);
        }
        return;
      }
      try {
        const response = await fetch(`${apiBase}/ai/kline/queue/${queueInfo.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = (await response.json()) as {
          status?: string;
          queueId?: string;
          position?: number;
          etaMinutes?: number;
          id?: string;
          createdAt?: string;
          analysis?: unknown;
          raw?: string;
          model?: string;
          warning?: string | null;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "排队状态获取失败");
        }
        if (data.status === "queued") {
          setQueueInfo((prev) =>
            prev
              ? {
                  ...prev,
                  position: data.position ?? prev.position,
                  etaMinutes: data.etaMinutes ?? prev.etaMinutes,
                  status: "queued"
                }
              : prev
          );
          return;
        }
        if (data.status === "processing") {
          setQueueInfo((prev) =>
            prev
              ? {
                  ...prev,
                  status: "processing"
                }
              : prev
          );
          return;
        }
        if (data.status === "done") {
          setQueueInfo(null);
          setAnalysisState("idle");
          applyAnalysisResult(data, analysisInputSnapshot);
          return;
        }
        if (data.status === "failed") {
          setQueueInfo(null);
          setAnalysisState("error");
          setAnalysisMessage(data.error || "测算失败，请稍后再试。");
          return;
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        setQueueInfo(null);
        setAnalysisState("error");
        setAnalysisMessage(
          error instanceof Error ? error.message : "排队状态获取失败"
        );
      }
    };
    pollQueue();
    pollTimer = window.setInterval(pollQueue, 5000);
    return () => {
      isActive = false;
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
    };
  }, [analysisState, queueInfo?.id, analysisInputSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const saved = window.localStorage.getItem(klineDraftKey);
      if (saved) {
        const data = JSON.parse(saved) as {
          birthDate?: string;
          birthTime?: string;
          gender?: "male" | "female";
          province?: string;
          ziHourMode?: "late" | "early";
        };
        if (typeof data.birthDate === "string") {
          setBirthDate(data.birthDate);
        }
        if (typeof data.birthTime === "string") {
          setBirthTime(data.birthTime);
        }
        if (data.gender === "male" || data.gender === "female") {
          setGender(data.gender);
        }
        if (typeof data.province === "string" && provinces.includes(data.province)) {
          setProvince(data.province);
        }
        if (data.ziHourMode === "late" || data.ziHourMode === "early") {
          setZiHourMode(data.ziHourMode);
        }
      }
    } catch {
      // Ignore storage errors.
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      return;
    }
    const loadHistory = async () => {
      try {
        const response = await fetch(`${apiBase}/kline/history?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = (await response.json()) as {
          reports?: KlineHistoryRecord[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "历史记录获取失败");
        }
        const items = Array.isArray(data.reports) ? data.reports : [];
        const normalized = items
          .filter((item) => item && typeof item.id === "string")
          .map((item) => {
            const analysis =
              item.analysis && typeof item.analysis === "object" ? item.analysis : {};
            if (item.summary && !analysis.summary) {
              analysis.summary = item.summary;
            }
            if (item.landingYear && !analysis.landingYear) {
              analysis.landingYear = item.landingYear;
            }
            if (
              typeof item.landingProbability === "number" &&
              typeof analysis.landingProbability !== "number"
            ) {
              analysis.landingProbability = item.landingProbability;
            }
            return { ...item, analysis };
          });
        setHistoryItems(normalized);
      } catch {
        setHistoryItems([]);
      }
    };
    loadHistory();
  }, []);

  const applyAnalysisResult = (
    data: {
      id?: string;
      createdAt?: string;
      analysis?: unknown;
      raw?: string;
      model?: string;
      warning?: string | null;
    },
    inputOverride?: KlineHistoryInput | null
  ) => {
    const inputSnapshot =
      inputOverride ??
      analysisInputSnapshot ?? {
        birthDate,
        birthTime,
        gender,
        province,
        ziHourMode,
        education,
        schoolTier,
        prepTime,
        interviewCount,
        fenbiForecastXingce,
        fenbiForecastShenlun,
        historyScoreXingce,
        historyScoreShenlun,
        promptStyle
      };
    if (!data.analysis || typeof data.analysis !== "object") {
      setAnalysisState("error");
      setAnalysisMessage("AI 返回格式异常，请稍后重试。");
      return;
    }
    const analysis = data.analysis as KlineAnalysis;
    const payload: KlineHistoryRecord = {
      id: data.id || `kline-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      analysis,
      raw: data.raw ?? null,
      model: data.model ?? null,
      warning: data.warning ?? null,
      createdAt: data.createdAt ?? new Date().toISOString(),
      input: inputSnapshot
    };
    window.sessionStorage.setItem(analysisKey, JSON.stringify(payload));
    setHistoryItems((prev) => [
      payload,
      ...prev.filter((item) => item.id !== payload.id)
    ].slice(0, 20));
    setAnalysisInputSnapshot(null);
    setAnalysisState("idle");
    router.push("/kline/result");
  };

  const buildInputSnapshot = (): KlineHistoryInput => ({
    birthDate,
    birthTime,
    gender,
    province,
    ziHourMode,
    education,
    schoolTier,
    prepTime,
    interviewCount,
    fenbiForecastXingce,
    fenbiForecastShenlun,
    historyScoreXingce,
    historyScoreShenlun,
    promptStyle
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setAnalysisMessage(null);
    setAnalysisState("idle");
    setQueueInfo(null);
    setAnalysisInputSnapshot(null);
    if (!birthDate) {
      setMessage("请填写出生日期。");
      return;
    }
    if (!birthTime) {
      setMessage("请填写出生时间。");
      return;
    }
    try {
      window.localStorage.setItem(
        klineDraftKey,
        JSON.stringify({
          birthDate,
          birthTime,
          gender,
          province,
          ziHourMode
        })
      );
    } catch {
      // Ignore storage errors.
    }
    setState("loading");
    try {
      const response = await fetch(`${apiBase}/kline/bazi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          birthTime: birthTime.trim() ? birthTime : null,
          gender,
          province,
          ziHourMode
        })
      });
      const data = (await response.json()) as BaziResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "计算失败，请稍后再试。");
      }
      setResult(data);
      setState("idle");
      setAnalysisState("idle");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "计算失败，请稍后再试。");
    }
  };

  const handleAnalyze = async () => {
    if (!result) {
      return;
    }
    if (analysisState === "loading" || analysisState === "queued") {
      return;
    }
    setAnalysisMessage(null);
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setAnalysisMessage("请先登录后再使用 AI 测算。");
      return;
    }
    const inputSnapshot = buildInputSnapshot();
    setAnalysisInputSnapshot(inputSnapshot);
    setAnalysisState("loading");
    try {
      const response = await fetch(`${apiBase}/ai/kline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bazi: result.bazi,
          dayunSequence: result.dayun_sequence,
          dayunStartAge: result.dayun_start_age,
          dayunDirection: result.dayun_direction,
          trueSolarTime: result.true_solar_time,
          lunarDate: result.lunar_date,
          birthDate,
          birthTime,
          gender,
          province,
          ziHourMode,
          education: education.trim() || null,
          schoolTier: schoolTier.trim() || null,
          prepTime: prepTime.trim() || null,
          interviewCount: interviewCount.trim() || null,
          fenbiForecastXingce: fenbiForecastXingce.trim() || null,
          fenbiForecastShenlun: fenbiForecastShenlun.trim() || null,
          historyScoreXingce: historyScoreXingce.trim() || null,
          historyScoreShenlun: historyScoreShenlun.trim() || null,
          promptStyle
        })
      });
      const data = (await response.json()) as {
        status?: string;
        queueId?: string;
        position?: number;
        etaMinutes?: number;
        id?: string;
        createdAt?: string;
        analysis?: unknown;
        raw?: string;
        model?: string;
        warning?: string | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "测算失败，请稍后再试。");
      }
      if (response.status === 202 || data.status === "queued") {
        if (!data.queueId) {
          throw new Error("排队编号缺失，请稍后重试。");
        }
        setQueueInfo({
          id: data.queueId,
          position: data.position ?? 1,
          etaMinutes: data.etaMinutes ?? 2,
          status: "queued"
        });
        setAnalysisState("queued");
        return;
      }
      applyAnalysisResult(data, inputSnapshot);
    } catch (error) {
      setAnalysisState("error");
      setAnalysisMessage(error instanceof Error ? error.message : "测算失败，请稍后再试。");
    }
  };

  const handleCopyPrompt = async () => {
    if (!promptText) {
      setPromptCopyMessage("请先生成八字结果后再复制提示词。");
      return;
    }
    try {
      await navigator.clipboard.writeText(promptText);
      setPromptCopyMessage("提示词已复制，可粘贴到第三方平台。");
    } catch {
      setPromptCopyMessage("复制失败，请展开提示词后手动复制。");
    }
    window.setTimeout(() => setPromptCopyMessage(null), 2400);
  };

  const handleReset = () => {
    setResult(null);
    setMessage(null);
    setAnalysisMessage(null);
    setAnalysisState("idle");
    setQueueInfo(null);
    setAnalysisInputSnapshot(null);
    setIsEditingBazi(false);
    setShowPrompt(false);
    setPromptCopyMessage(null);
  };

  const openHistory = (item: KlineHistoryRecord) => {
    window.sessionStorage.setItem(analysisKey, JSON.stringify(item));
    router.push("/kline/result");
  };

  const handleEditBazi = () => {
    if (!result) {
      return;
    }
    setDraftPillars({
      year: result.year_pillar,
      month: result.month_pillar,
      day: result.day_pillar,
      hour: result.hour_pillar
    });
    setDraftDayunSequence(result.dayun_sequence ?? []);
    setDraftDayunStartAge(`${result.dayun_start_age ?? ""}`);
    setDraftDayunDirection(result.dayun_direction);
    setIsEditingBazi(true);
  };

  const handleCancelBaziEdit = () => {
    setIsEditingBazi(false);
  };

  const handleSaveBaziEdit = () => {
    if (!result) {
      return;
    }
    const cleanedSequence = draftDayunSequence
      .map((item) => item.trim())
      .filter(Boolean);
    const parsedStartAge = Number.parseFloat(draftDayunStartAge);
    const nextStartAge = Number.isFinite(parsedStartAge)
      ? parsedStartAge
      : result.dayun_start_age;
    const nextSequence = cleanedSequence.length ? cleanedSequence : result.dayun_sequence;
    const nextPillars = {
      year: draftPillars.year.trim() || result.year_pillar,
      month: draftPillars.month.trim() || result.month_pillar,
      day: draftPillars.day.trim() || result.day_pillar,
      hour: draftPillars.hour.trim() || result.hour_pillar
    };
    setResult({
      ...result,
      year_pillar: nextPillars.year,
      month_pillar: nextPillars.month,
      day_pillar: nextPillars.day,
      hour_pillar: nextPillars.hour,
      bazi: [nextPillars.year, nextPillars.month, nextPillars.day, nextPillars.hour],
      dayun_sequence: nextSequence,
      first_dayun: nextSequence[0] ?? result.first_dayun,
      dayun_start_age: nextStartAge,
      dayun_direction: draftDayunDirection
    });
    setIsEditingBazi(false);
  };

  const updateDayunItem = (index: number, value: string) => {
    setDraftDayunSequence((prev) =>
      prev.map((item, idx) => (idx === index ? value : item))
    );
  };

  const addDayunItem = () => {
    setDraftDayunSequence((prev) => [...prev, ""]);
  };

  const removeDayunItem = () => {
    setDraftDayunSequence((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  return (
    <main className="main kline-page">
      {analysisState === "loading" || analysisState === "queued" ? (
        <div className="kline-countdown">
          {analysisState === "queued" ? (
            <>
              <div className="kline-countdown-label">{queueLabel}</div>
              <div className="kline-countdown-time">{queuePositionText}</div>
              <div className="kline-countdown-note">预计等待 {queueEtaText}</div>
            </>
          ) : (
            <>
              <div className="kline-countdown-label">
                {countdownPhase === "extend"
                  ? "仍在生成，继续等待"
                  : "AI 正在生成报告"}
              </div>
              <div className="kline-countdown-time">{countdownText}</div>
              <div className="kline-countdown-note">预计等待 {countdownText}</div>
            </>
          )}
        </div>
      ) : null}
      <section className="kline-hero">
        <div className="kline-intro">
          <p className="eyebrow">UPSHORE KLINE</p>
          <h1>上岸 K 线</h1>
          <p className="lead">
            输入出生信息，先生成四柱八字与大运节奏，再补充学历与备考经历，
            为 AI 测算做准备。
          </p>
          <div className="kline-steps">
            <div className={`kline-step ${!result ? "active" : ""}`}>
              <span>1</span>
              <div>
                <strong>基础信息</strong>
                <p>生日、时间、性别、省份</p>
              </div>
            </div>
            <div className={`kline-step ${result ? "active" : ""}`}>
              <span>2</span>
              <div>
                <strong>八字结果</strong>
                <p>四柱与大运</p>
              </div>
            </div>
            <div className="kline-step muted">
              <span>3</span>
              <div>
                <strong>AI 测算</strong>
                <p>生成上岸 K 线报告</p>
              </div>
            </div>
          </div>
        </div>
        <div className={`kline-card kline-form-card ${result ? "is-compact" : ""}`}>
          <div className="kline-card-header">
            <h3>{stepLabel}</h3>
            {result ? <span>已生成</span> : <span>填写后进入下一步</span>}
          </div>
          <form className="kline-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="birth-date">出生日期</label>
              <input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                disabled={isLocked}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="birth-time">出生时间</label>
              <input
                id="birth-time"
                type="time"
                value={birthTime}
                onChange={(event) => setBirthTime(event.target.value)}
                disabled={isLocked}
                required
              />
            </div>
            <div className="form-row">
              <label>性别</label>
              <div className="kline-toggle">
                <button
                  type="button"
                  className={gender === "male" ? "active" : ""}
                  onClick={() => setGender("male")}
                  disabled={isLocked}
                >
                  男
                </button>
                <button
                  type="button"
                  className={gender === "female" ? "active" : ""}
                  onClick={() => setGender("female")}
                  disabled={isLocked}
                >
                  女
                </button>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="province">出生省份</label>
              <select
                id="province"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                disabled={isLocked}
              >
                {provinces.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="zi-hour">子时换日</label>
              <select
                id="zi-hour"
                value={ziHourMode}
                onChange={(event) =>
                  setZiHourMode(event.target.value === "early" ? "early" : "late")
                }
                disabled={isLocked}
              >
                <option value="late">23:00 换日（晚子时）</option>
                <option value="early">00:00 换日（早子时）</option>
              </select>
            </div>
            {message ? <p className="form-message">{message}</p> : null}
            <div className="kline-actions">
              {result ? (
                <button type="button" className="ghost" onClick={handleReset}>
                  重新编辑
                </button>
              ) : (
                <LoadingButton
                  type="submit"
                  className="primary"
                  loading={state === "loading"}
                  loadingText="计算中..."
                >
                  下一步
                </LoadingButton>
              )}
            </div>
          </form>
        </div>
      </section>

      {result ? (
        <section className="kline-grid kline-grid-split">
          <div className="kline-left-stack">
            <div className="kline-card">
              <div className="kline-card-header">
                <div className="kline-header-info">
                  <h3>四柱八字</h3>
                  <span>
                    农历 {result.lunar_date} · 真太阳时 {result.true_solar_time}
                    （经度校正）
                  </span>
                </div>
                <div className="kline-header-actions">
                  {isEditingBazi ? (
                    <>
                      <button
                        type="button"
                        className="primary"
                        onClick={handleSaveBaziEdit}
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={handleCancelBaziEdit}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button type="button" className="ghost" onClick={handleEditBazi}>
                      编辑
                    </button>
                  )}
                </div>
              </div>
              <div className="kline-pillars">
                <div className="kline-pillar">
                  <span>年柱</span>
                  {isEditingBazi ? (
                    <input
                      value={draftPillars.year}
                      onChange={(event) =>
                        setDraftPillars((prev) => ({
                          ...prev,
                          year: event.target.value
                        }))
                      }
                    />
                  ) : (
                    <strong>{result.year_pillar}</strong>
                  )}
                </div>
                <div className="kline-pillar">
                  <span>月柱</span>
                  {isEditingBazi ? (
                    <input
                      value={draftPillars.month}
                      onChange={(event) =>
                        setDraftPillars((prev) => ({
                          ...prev,
                          month: event.target.value
                        }))
                      }
                    />
                  ) : (
                    <strong>{result.month_pillar}</strong>
                  )}
                </div>
                <div className="kline-pillar">
                  <span>日柱</span>
                  {isEditingBazi ? (
                    <input
                      value={draftPillars.day}
                      onChange={(event) =>
                        setDraftPillars((prev) => ({
                          ...prev,
                          day: event.target.value
                        }))
                      }
                    />
                  ) : (
                    <strong>{result.day_pillar}</strong>
                  )}
                </div>
                <div className="kline-pillar">
                  <span>时柱</span>
                  {isEditingBazi ? (
                    <input
                      value={draftPillars.hour}
                      onChange={(event) =>
                        setDraftPillars((prev) => ({
                          ...prev,
                          hour: event.target.value
                        }))
                      }
                    />
                  ) : (
                    <strong>{result.hour_pillar}</strong>
                  )}
                </div>
              </div>
              <div className="kline-meta">
                <div>
                  <span>出生省份</span>
                  <strong>{province}</strong>
                </div>
                <div>
                  <span>时辰地支</span>
                  <strong>{result.hour_branch_name}</strong>
                </div>
                <div>
                  <span>大运方向</span>
                  <strong>{result.dayun_direction}</strong>
                </div>
                <div>
                  <span>起运年龄</span>
                  <strong>{result.dayun_start_age}</strong>
                </div>
                <div>
                  <span>子时换日</span>
                  <strong>{ziHourMode === "late" ? "23:00" : "00:00"}</strong>
                </div>
              </div>
            </div>

          <div className="kline-card">
            <div className="kline-card-header">
              <h3>大运序列</h3>
              <span>首运 {result.first_dayun}</span>
            </div>
            {isEditingBazi ? (
              <div className="kline-dayun-edit">
                <div className="kline-extra-grid">
                  <div className="form-row">
                    <label htmlFor="dayun-direction">大运方向</label>
                    <select
                      id="dayun-direction"
                      value={draftDayunDirection}
                      onChange={(event) =>
                        setDraftDayunDirection(
                          event.target.value === "逆行" ? "逆行" : "顺行"
                        )
                      }
                    >
                      <option value="顺行">顺行</option>
                      <option value="逆行">逆行</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label htmlFor="dayun-start-age">起运年龄</label>
                    <input
                      id="dayun-start-age"
                      type="number"
                      step="0.1"
                      value={draftDayunStartAge}
                      onChange={(event) => setDraftDayunStartAge(event.target.value)}
                    />
                  </div>
                </div>
                <div className="kline-dayun-list">
                  {draftDayunSequence.map((item, index) => (
                    <input
                      key={`draft-dayun-${index}`}
                      className="kline-dayun-input"
                      value={item}
                      onChange={(event) => updateDayunItem(index, event.target.value)}
                    />
                  ))}
                </div>
                <div className="kline-dayun-actions">
                  <button type="button" className="ghost" onClick={addDayunItem}>
                    添加一项
                  </button>
                  <button type="button" className="ghost" onClick={removeDayunItem}>
                    删除末项
                  </button>
                </div>
              </div>
            ) : (
              <div className="kline-dayun-list">
                {result.dayun_sequence.map((item, index) => {
                  const startAge = result.dayun_start_age + index * 10;
                  return (
                    <div key={`${item}-${index}`} className="kline-dayun-item">
                      <span className="age">{startAge} 岁起</span>
                      <strong className="pillar">{item}</strong>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="form-message">注：年龄均为虚岁。</p>
          </div>
          </div>

          <div className="kline-card">
            <div className="kline-card-header">
              <h3>补充信息（可选）</h3>
              <span>用于 AI 提示词</span>
            </div>
            <div className="kline-extra-grid">
              <div className="form-row">
                <label htmlFor="education">最高学历</label>
                <input
                  id="education"
                  placeholder="如 本科 / 硕士 / 博士"
                  value={education}
                  onChange={(event) => setEducation(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="school-tier">学校层级</label>
                <input
                  id="school-tier"
                  placeholder="如 清北 / 985 / 211 "
                  value={schoolTier}
                  onChange={(event) => setSchoolTier(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="prep-time">备考时间</label>
                <input
                  id="prep-time"
                  placeholder="如 6 个月 / 2 年"
                  value={prepTime}
                  onChange={(event) => setPrepTime(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="interview-count">进面次数</label>
                <input
                  id="interview-count"
                  placeholder="如 0 / 1 / 2"
                  value={interviewCount}
                  onChange={(event) => setInterviewCount(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="fenbi-xingce">粉笔预测分（行测）</label>
                <input
                  id="fenbi-xingce"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="如 65"
                  value={fenbiForecastXingce}
                  onChange={(event) => setFenbiForecastXingce(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="fenbi-shenlun">粉笔预测分（申论）</label>
                <input
                  id="fenbi-shenlun"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="如 68"
                  value={fenbiForecastShenlun}
                  onChange={(event) => setFenbiForecastShenlun(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="history-xingce">历史实战成绩（行测）</label>
                <input
                  id="history-xingce"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="百分制，如 70"
                  value={historyScoreXingce}
                  onChange={(event) => setHistoryScoreXingce(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="history-shenlun">历史实战成绩（申论）</label>
                <input
                  id="history-shenlun"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="百分制，如 72"
                  value={historyScoreShenlun}
                  onChange={(event) => setHistoryScoreShenlun(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label>AI 风格</label>
                <div className="kline-prompt-controls">
                  <div className="kline-toggle">
                    <button
                      type="button"
                      className={promptStyle === "default" ? "active" : ""}
                      onClick={() => setPromptStyle("default")}
                    >
                      默认提示词
                    </button>
                    <button
                      type="button"
                      className={promptStyle === "gentle" ? "active" : ""}
                      onClick={() => setPromptStyle("gentle")}
                    >
                      优化提示词
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ghost"
                    onClick={handleCopyPrompt}
                    disabled={!promptText}
                  >
                    复制提示词
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setShowPrompt((prev) => !prev)}
                    disabled={!promptText}
                  >
                    {showPrompt ? "收起提示词" : "查看提示词"}
                  </button>
                </div>
                {promptCopyMessage ? (
                  <p className="form-message">{promptCopyMessage}</p>
                ) : null}
              </div>
            </div>
            <div className="kline-prompt-note">
              <p className="form-message">
                可将拼接后的提示词复制到第三方平台自行推演，建议保留 system 与 user
                两段以获得更稳定的输出。
              </p>
              {isFreeAiExhausted ? (
                <p
                  className={`form-message kline-prompt-alert ${
                    isGlobalFreeAiExhausted ? "is-urgent" : ""
                  }`}
                >
                  {isGlobalFreeAiExhausted
                    ? "今日网站公共免费 AI 已耗尽，建议使用下方提示词自行测算或改用个人 AI 配置。"
                    : "免费 AI 今日额度已用完，可先用提示词在第三方平台继续测算。"}
                </p>
              ) : null}
            </div>
            {showPrompt ? (
              <div className="kline-prompt-panel">
                <div className="kline-prompt-panel-header">
                  <span>拼接提示词预览</span>
                  <button type="button" className="ghost" onClick={handleCopyPrompt}>
                    复制
                  </button>
                </div>
                <textarea
                  className="kline-prompt-textarea"
                  value={promptText}
                  readOnly
                />
              </div>
            ) : null}
            <div className="kline-actions">
              <LoadingButton
                type="button"
                className="primary"
                loading={analysisState === "loading" || analysisState === "queued"}
                loadingText={analysisState === "queued" ? "排队中..." : "测算中..."}
                onClick={handleAnalyze}
              >
                开始测算
              </LoadingButton>
            </div>
            {analysisMessage ? (
              <p className="form-message">{analysisMessage}</p>
            ) : (
              <p className="form-message">
                点击开始测算后会跳转到 K 线结果页。
              </p>
            )}
          </div>
        </section>
      ) : null}

      {historyItems.length ? (
        <section className="kline-card kline-history">
          <div className="kline-card-header">
            <h3>历史记录</h3>
            <span>最近 {historyItems.length} 次测算</span>
          </div>
          <div className="kline-history-list">
            {historyItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="kline-history-item"
                onClick={() => openHistory(item)}
              >
                <div>
                  <strong>{item.analysis?.landingYear || "未标记"}</strong>
                  <span>
                    {typeof item.analysis?.landingProbability === "number"
                      ? `${Math.round(item.analysis.landingProbability * 100)}%`
                      : "无概率"}
                  </span>
                </div>
                <p>{item.analysis?.summary || "暂无摘要"}</p>
                <em>{item.createdAt ? item.createdAt.slice(0, 16) : ""}</em>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
