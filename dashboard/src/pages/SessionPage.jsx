import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Play, Clock, FileText, Briefcase, Mic, MicOff, Send, X, Check, Loader2, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://api-beta-three-38.vercel.app'

export default function SessionPage({ userData, setUserData }) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [activeSession, setActiveSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  // Session setup
  const [selectedResume, setSelectedResume] = useState('')
  const [interviewTime, setInterviewTime] = useState('')

  // Active session state
  const [status, setStatus] = useState('idle') // idle, waiting, active, answering
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [messages, setMessages] = useState([])
  const [isListening, setIsListening] = useState(false)
  const answerRef = useRef(null)

  // Fetch active session on load
  useEffect(() => {
    fetchActiveSession()
  }, [user])

  const fetchActiveSession = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions/active`, {
        headers: { 'x-clerk-user-id': user.id }
      })
      const data = await res.json()

      if (data.session) {
        setActiveSession(data.session)
        setStatus(data.session.status)
        setMessages(data.session.messages || [])
        setSelectedResume(data.session.resumeId)
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  const createSession = async () => {
    if (!selectedResume) {
      alert('Please select a resume')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify({
          resumeId: selectedResume,
          interviewDuration: interviewTime || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to create session')
        return
      }

      setActiveSession(data.session)
      setStatus('waiting')
      setMessages([])
    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  const startSession = async () => {
    if (!activeSession) return

    try {
      const res = await fetch(`${API_URL}/api/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify({ sessionId: activeSession.id })
      })

      const data = await res.json()
      setActiveSession(data.session)
      setStatus('active')

      // Start speech recognition
      startSpeechRecognition()
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported. Use Chrome.')
      return
    }

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('')

      setCurrentQuestion(transcript)

      // If final result, generate answer
      if (event.results[event.results.length - 1].isFinal) {
        generateAnswer(transcript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      if (status === 'active') {
        // Restart if still active
        recognition.start()
      }
    }

    recognition.start()
    setIsListening(true)
  }

  const generateAnswer = async (question) => {
    if (!question.trim()) return

    setStatus('answering')
    setCurrentQuestion(question)

    try {
      const res = await fetch(`${API_URL}/api/ai/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify({
          question,
          sessionId: activeSession.id
        })
      })

      const data = await res.json()

      if (data.answer) {
        setCurrentAnswer(data.answer)

        // Add to messages
        setMessages(prev => [...prev, {
          question,
          answer: data.answer,
          timestamp: new Date().toISOString()
        }])

        // Speak the answer
        speakAnswer(data.answer)
      }
    } catch (error) {
      console.error('Failed to generate answer:', error)
    } finally {
      setStatus('active')
    }
  }

  const speakAnswer = (text) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    // Try to find a natural voice
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices.find(v => v.lang.startsWith('en'))
    if (englishVoice) {
      utterance.voice = englishVoice
    }

    utterance.onend = () => {
      setStatus('active')
      setCurrentAnswer('')
      setCurrentQuestion('')
    }

    window.speechSynthesis.speak(utterance)
  }

  const endSession = async () => {
    if (!activeSession) return

    try {
      await fetch(`${API_URL}/api/sessions/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify({ sessionId: activeSession.id })
      })

      setStatus('idle')
      setActiveSession(null)
      setMessages([])
      setCurrentQuestion('')
      setCurrentAnswer('')
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  const stopListening = () => {
    setIsListening(false)
    // Speech recognition will stop on next cycle
  }

  // ===== RENDER: No session =====
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!activeSession) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Start Interview Session</h1>
          <p className="text-slate-400 mt-1">Set up your session to get AI assistance during interviews</p>
        </div>

        {/* Resume Selection */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Select Resume
          </h3>

          {(!userData?.resumes || userData.resumes.length === 0) ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-slate-400 mb-2">No resumes found</p>
              <p className="text-sm text-slate-500">Add a resume in the Resumes tab first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userData.resumes.map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => setSelectedResume(resume.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedResume === resume.id
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-border bg-dark text-slate-300 hover:border-primary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedResume === resume.id ? 'bg-primary' : 'bg-border'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{resume.name}</p>
                      <p className="text-xs text-slate-500">
                        Added {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {userData?.resumeLimit && userData.resumes?.length >= userData.resumeLimit && userData.plan === 'free' && (
            <p className="text-xs text-amber-500 mt-3">
              Free plan limited to {userData.resumeLimit} resumes. Upgrade to add more.
            </p>
          )}
        </div>

        {/* Job Details */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Job Details (Optional)
          </h3>

          {userData?.jobDetails?.position ? (
            <div className="p-4 bg-dark rounded-lg">
              <p className="text-white font-medium">{userData.jobDetails.position}</p>
              {userData.jobDetails.company && (
                <p className="text-slate-400 text-sm">{userData.jobDetails.company}</p>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Add job details in the Job Details tab for better answers</p>
          )}
        </div>

        {/* Interview Time */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Interview Duration (Optional)
          </h3>
          <select
            value={interviewTime}
            onChange={(e) => setInterviewTime(e.target.value)}
            className="w-full px-4 py-3 bg-dark border border-border rounded-lg text-white focus:border-primary focus:outline-none"
          >
            <option value="">Not specified</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>

        {/* Start Button */}
        <button
          onClick={createSession}
          disabled={loading || !selectedResume}
          className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Session
            </>
          )}
        </button>
      </div>
    )
  }

  // ===== RENDER: Session active =====
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Bar */}
      <div className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            status === 'active' ? 'bg-green-500 animate-pulse' :
            status === 'waiting' ? 'bg-yellow-500 animate-pulse' :
            status === 'answering' ? 'bg-blue-500 animate-pulse' :
            'bg-slate-500'
          }`} />
          <span className="text-white font-medium capitalize">{status === 'answering' ? 'AI answering...' : status}</span>
        </div>

        {status !== 'waiting' && (
          <button
            onClick={endSession}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            End Session
          </button>
        )}
      </div>

      {/* Waiting State */}
      {status === 'waiting' && (
        <div className="bg-card rounded-xl p-12 border border-border text-center">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Waiting for Interview</h2>
          <p className="text-slate-400 mb-6">Your session is ready. Click below when you're ready to start.</p>

          <button
            onClick={startSession}
            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            <Play className="w-5 h-5 inline mr-2" />
            Start Interview Now
          </button>

          <p className="text-slate-500 text-sm mt-4">
            The extension will detect questions and provide answers automatically
          </p>
        </div>
      )}

      {/* Active Session */}
      {status === 'active' && (
        <div className="space-y-6">
          {/* Current Question */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Current Question</h3>
              <div className="flex items-center gap-2">
                {isListening ? (
                  <button
                    onClick={stopListening}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-2"
                  >
                    <MicOff className="w-4 h-4" />
                    Stop
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Listening
                  </span>
                )}
              </div>
            </div>

            {currentQuestion ? (
              <p className="text-white text-lg">{currentQuestion}</p>
            ) : (
              <p className="text-slate-500">Waiting for question...</p>
            )}
          </div>

          {/* Current Answer */}
          {currentAnswer && (
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-6 border border-primary/30">
              <h3 className="text-lg font-semibold text-white mb-3">AI Answer</h3>
              <p className="text-white text-lg leading-relaxed">{currentAnswer}</p>
            </div>
          )}

          {/* Messages History */}
          {messages.length > 0 && (
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-white mb-4">Session History</h3>
              <div className="space-y-4">
                {messages.slice(-5).map((msg, i) => (
                  <div key={i} className="border-l-2 border-primary pl-4">
                    <p className="text-slate-400 text-sm mb-1">Q: {msg.question}</p>
                    <p className="text-white">A: {msg.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Question Input */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-white mb-4">Test Manually</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter a test question..."
                className="flex-1 px-4 py-3 bg-dark border border-border rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    generateAnswer(e.target.value)
                    e.target.value = ''
                  }
                }}
              />
              <button
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
                onClick={(e) => {
                  const input = e.target.previousSibling
                  if (input.value) {
                    generateAnswer(input.value)
                    input.value = ''
                  }
                }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answering State */}
      {status === 'answering' && (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Generating Answer...</h2>
          <p className="text-slate-400">The AI is thinking of a response</p>
        </div>
      )}
    </div>
  )
}