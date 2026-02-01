'use client';

import { useState, useRef, useEffect } from 'react';

// Types
interface Question {
  id: string;
  question: string;
  questionNumber: number;
  totalQuestions: number;
}

interface Feedback {
  score: number;
  feedback: string;
  suggestedAnswer: string;
  isComplete: boolean;
}

type Phase = 'setup' | 'interview' | 'feedback';

const INTERVIEW_TYPES = [
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'technical', label: 'Technical' },
  { value: 'situational', label: 'Situational' },
  { value: 'competency', label: 'Competency-Based' },
  { value: 'case', label: 'Case Interview' },
];

const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Entry Level' },
  { value: 2, label: 'Junior' },
  { value: 3, label: 'Mid-Level' },
  { value: 4, label: 'Senior' },
  { value: 5, label: 'Expert' },
];

export default function InterviewPage() {
  // Phase management
  const [phase, setPhase] = useState<Phase>('setup');
  
  // Setup state
  const [interviewType, setInterviewType] = useState('behavioral');
  const [difficulty, setDifficulty] = useState(3);
  
  // Interview state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  
  // Feedback state
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  
  // Loading states
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Speech recognition ref
  const recognitionRef = useRef<any>(null);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Start interview session
  const handleStartInterview = async () => {
    setIsStarting(true);
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: interviewType, difficulty }),
      });
      
      if (!response.ok) throw new Error('Failed to start interview');
      
      const data = await response.json();
      setSessionId(data.sessionId);
      setCurrentQuestion({
        id: data.questionId,
        question: data.question,
        questionNumber: data.questionNumber,
        totalQuestions: data.totalQuestions,
      });
      setPhase('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !sessionId || !currentQuestion) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          answer: answer.trim(),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit answer');
      
      const data = await response.json();
      setFeedback({
        score: data.score,
        feedback: data.feedback,
        suggestedAnswer: data.suggestedAnswer,
        isComplete: data.isComplete,
      });
      setPhase('feedback');
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Next question
  const handleNextQuestion = async () => {
    setIsStarting(true);
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) throw new Error('Failed to get next question');
      
      const data = await response.json();
      setCurrentQuestion({
        id: data.questionId,
        question: data.question,
        questionNumber: data.questionNumber,
        totalQuestions: data.totalQuestions,
      });
      setAnswer('');
      setFeedback(null);
      setPhase('interview');
    } catch (error) {
      console.error('Error getting next question:', error);
      alert('Failed to get next question. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  // Finish interview
  const handleFinish = () => {
    setPhase('setup');
    setSessionId(null);
    setCurrentQuestion(null);
    setAnswer('');
    setFeedback(null);
  };

  // Read question aloud
  const handleReadQuestion = () => {
    if (!currentQuestion || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Voice recording / speech-to-text
  const handleToggleRecording = () => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome.');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        setAnswer((prev) => prev + finalTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // Render score badge
  const renderScoreBadge = (score: number) => {
    let bgColor = 'bg-red-100 text-red-800';
    if (score >= 80) bgColor = 'bg-green-100 text-green-800';
    else if (score >= 60) bgColor = 'bg-yellow-100 text-yellow-800';
    else if (score >= 40) bgColor = 'bg-orange-100 text-orange-800';
    
    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-2xl font-bold ${bgColor}`}>
        {score}/100
      </span>
    );
  };

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4">{line.slice(2)}</li>;
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      // Handle bold text
      const boldRendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: boldRendered }} />;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎯 Interview Coach</h1>
          <p className="text-gray-600">Practice and perfect your interview skills with AI feedback</p>
        </div>

        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Configure Your Interview</h2>
            
            {/* Interview Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interview Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INTERVIEW_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setInterviewType(type.value)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      interviewType === type.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Difficulty Level
              </label>
              <div className="flex flex-wrap gap-3">
                {DIFFICULTY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setDifficulty(level.value)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      difficulty === level.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{level.value}</span>
                    <span className="text-sm text-gray-500 ml-1">- {level.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartInterview}
              disabled={isStarting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isStarting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Starting Interview...
                </>
              ) : (
                <>
                  🚀 Start Interview
                </>
              )}
            </button>
          </div>
        )}

        {/* Interview Phase */}
        {phase === 'interview' && currentQuestion && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-gray-500">
                Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
              </span>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${(currentQuestion.questionNumber / currentQuestion.totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-800 flex-1">
                  {currentQuestion.question}
                </h2>
                <button
                  onClick={handleReadQuestion}
                  className={`shrink-0 p-3 rounded-full transition-colors ${
                    isSpeaking
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
                >
                  {isSpeaking ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Answer Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here, or use voice recording..."
                className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleToggleRecording}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {isRecording ? (
                  <>
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Start Recording
                  </>
                )}
              </button>
              
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || isSubmitting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    ✓ Submit Answer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Phase */}
        {phase === 'feedback' && feedback && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Score Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Score</h2>
              {renderScoreBadge(feedback.score)}
            </div>

            {/* Feedback */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                📝 Feedback
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 text-gray-700">
                {renderMarkdown(feedback.feedback)}
              </div>
            </div>

            {/* Suggested Answer */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                💡 Suggested Answer
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-gray-700">
                {renderMarkdown(feedback.suggestedAnswer)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {!feedback.isComplete ? (
                <>
                  <button
                    onClick={handleFinish}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                  >
                    End Session
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={isStarting}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isStarting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        Next Question →
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFinish}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  🎉 Finish Interview
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          Practice makes perfect. Keep going! 💪
        </div>
      </div>
    </div>
  );
}
