"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

const INTERVIEW_TYPES = [
  { value: "behavioral", label: "行为面试 (综合分析)" },
  { value: "technical", label: "专业能力 (岗位匹配)" },
  { value: "situational", label: "情景模拟 (应急应变)" },
  { value: "competency", label: "通用能力 (人际沟通)" },
  { value: "mixed", label: "全真模拟 (随机混合)" },
];

const DIFFICULTY_LEVELS = [
  { value: 1, label: "入门" },
  { value: 2, label: "初级" },
  { value: 3, label: "中级" },
  { value: 4, label: "高级" },
  { value: "5", label: "专家" }, // value 5 should be number
];

export default function InterviewPage() {
  const [phase, setPhase] = useState<"setup" | "interview" | "feedback" | "end">("setup");
  const [type, setType] = useState("behavioral");
  const [difficulty, setDifficulty] = useState(3);
  const [session, setSession] = useState<any>(null);
  const [currentTurn, setCurrentTurn] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "zh-CN";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setAnswerText((prev) => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const getApiUrl = (path: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    return `${baseUrl.replace(/\/$/, "")}${path}`;
  };

  const getToken = () => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  const startSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("请先登录");

      const res = await fetch(getApiUrl("/interview/start"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type, difficulty }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "启动面试失败，请检查网络");
      
      setSession(data.session);
      setCurrentTurn(data.turn);
      setPhase("interview");
      // Auto-speak question on start
      setTimeout(() => speak(data.turn.questionText), 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(getApiUrl("/interview/answer"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          turnId: currentTurn.id,
          answerText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "提交回答失败，请稍后重试");

      setAnalysis(data.analysis);
      if (data.sessionComplete) {
        setPhase("end");
      } else {
        // Save next turn for "Next" button
        setCurrentTurn(data.nextQuestion);
        setPhase("feedback");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    setAnswerText("");
    setAnalysis(null);
    setPhase("interview");
    speak(currentTurn.questionText);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("您的浏览器不支持语音识别，请使用 Chrome 或 Edge。");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // UI Components
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">🤖 AI 面试教练</h1>
          <p className="text-blue-100 text-sm mt-1">全真模拟 · 实时评分 · 语音交互</p>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 text-sm text-center border-b border-red-100">
            {error}
          </div>
        )}

        <div className="p-6 md:p-8">
          {/* Setup Phase */}
          {phase === "setup" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择面试类型</label>
                <div className="grid grid-cols-1 gap-2">
                  {INTERVIEW_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        type === t.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="font-medium">{t.label.split(" ")[0]}</div>
                      <div className="text-xs text-gray-500">{t.label.split(" ")[1]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">难度等级</label>
                <div className="flex justify-between items-center bg-gray-100 p-1 rounded-lg">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setDifficulty(val)}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        difficulty === val
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {DIFFICULTY_LEVELS.find(d => d.value === val)?.label || val}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startSession}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {loading ? "正在生成题目..." : "开始模拟面试"}
              </button>
            </div>
          )}

          {/* Interview Phase */}
          {phase === "interview" && currentTurn && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>面试进行中</span>
                <span>第 {currentTurn.turnNumber} / {session.totalQuestions} 题</span>
              </div>
              
              {/* Question Card */}
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 relative">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => speak(currentTurn.questionText)}
                    className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                    title="朗读题目"
                  >
                    🔊
                  </button>
                </div>
                <h3 className="text-sm font-bold text-blue-800 mb-2">面试官提问：</h3>
                <p className="text-lg text-gray-800 leading-relaxed font-medium">
                  {currentTurn.questionText}
                </p>
              </div>

              {/* Answer Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">你的回答</label>
                <div className="relative">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-xl h-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-base"
                    placeholder="请在此输入回答，或点击下方麦克风进行语音输入..."
                  />
                  {isRecording && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 text-red-500 animate-pulse bg-white px-2 py-1 rounded-md shadow-sm border border-red-100">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs font-bold">正在录音...</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={toggleRecording}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                      isRecording 
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{isRecording ? "停止录音" : "🎤 语音输入"}</span>
                  </button>
                  
                  <button
                    onClick={submitAnswer}
                    disabled={loading || !answerText.trim()}
                    className="flex-[2] bg-green-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>AI 分析中...</span>
                      </>
                    ) : (
                      "提交回答"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Phase */}
          {(phase === "feedback" || phase === "end") && analysis && (
            <div className="space-y-8">
              {/* Score Header */}
              <div className="text-center pb-6 border-b border-gray-100">
                <div className="text-sm text-gray-500 mb-1">本题得分</div>
                <div className={`text-5xl font-black ${
                  analysis.score >= 80 ? "text-green-600" :
                  analysis.score >= 60 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {analysis.score}
                </div>
              </div>

              {/* Feedback Content */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📝</span> 面试官点评
                  </h3>
                  <div className="prose prose-sm prose-blue bg-gray-50 p-5 rounded-xl text-gray-700 leading-relaxed">
                    <ReactMarkdown>{analysis.feedback}</ReactMarkdown>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>💡</span> 参考回答
                  </h3>
                  <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 text-gray-800 text-sm leading-relaxed">
                    {analysis.suggestedAnswer}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4">
                {phase === "feedback" ? (
                  <button
                    onClick={nextQuestion}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-transform"
                  >
                    进入下一题 →
                  </button>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-green-600 font-bold text-xl">
                      🎉 面试已完成！
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      再次挑战
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
