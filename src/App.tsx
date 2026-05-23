import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

type Confidence = 'know' | 'unsure' | 'unknown'
type Category =
  | 'Solfejo'
  | 'Fundamentos'
  | 'Instrumento & Técnica'
  | 'Música Antiga / HIP'
  | 'Frases no Workshop'
type View = 'home' | 'study' | 'results' | 'test' | 'testResults' | 'stats'
type StudyMode = 'pt-first' | 'reverse' | 'random'
type StudyDirection = 'pt-first' | 'reverse'
type CycleSpeed = 'normal' | 'fast'

interface SessionCard {
  id: string
  direction: StudyDirection
}

interface SessionReview {
  id: string
  confidence: Confidence
}

interface TestQuestion {
  id: string
  choices: string[]
}

interface TestAnswer {
  id: string
  correct: boolean
  timedOut: boolean
}

interface Card {
  id: string
  pt: string
  en: string
  ja: string
  category: Category
  example?: string
}

interface CardState {
  id: string
  interval: number
  nextReview: number
  easeFactor: number
  repetitions: number
  lastConfidence: Confidence | null
}

interface StreakState {
  lastDate: string
  count: number
}

const CARDS_KEY = 'musicpt:cards'
const STREAK_KEY = 'musicpt:streak'
const STUDY_MODE_KEY = 'musicpt:studyMode'
const CYCLE_SPEED_KEY = 'musicpt:cycleSpeed'
const SESSION_SIZE = 10
const DAY_MS = 24 * 60 * 60 * 1000
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
const TEST_SECONDS = 5

const cards: Card[] = [
  { id: 'do', pt: 'Dó', en: 'C', ja: 'ド', category: 'Solfejo' },
  { id: 're', pt: 'Ré', en: 'D', ja: 'レ', category: 'Solfejo' },
  { id: 'mi', pt: 'Mi', en: 'E', ja: 'ミ', category: 'Solfejo' },
  { id: 'fa', pt: 'Fá', en: 'F', ja: 'ファ', category: 'Solfejo' },
  { id: 'sol', pt: 'Sol', en: 'G', ja: 'ソ', category: 'Solfejo' },
  { id: 'la', pt: 'Lá', en: 'A', ja: 'ラ', category: 'Solfejo' },
  { id: 'si', pt: 'Si', en: 'B', ja: 'シ', category: 'Solfejo' },
  { id: 'sustenido', pt: 'sustenido', en: 'sharp', ja: 'シャープ', category: 'Solfejo' },
  { id: 'bemol', pt: 'bemol', en: 'flat', ja: 'フラット', category: 'Solfejo' },
  { id: 'bequadro', pt: 'bequadro', en: 'natural', ja: 'ナチュラル', category: 'Solfejo' },
  { id: 'melodia', pt: 'melodia', en: 'melody', ja: 'メロディー', category: 'Fundamentos' },
  { id: 'harmonia', pt: 'harmonia', en: 'harmony', ja: 'ハーモニー', category: 'Fundamentos' },
  { id: 'ritmo', pt: 'ritmo', en: 'rhythm', ja: 'リズム', category: 'Fundamentos' },
  { id: 'compasso', pt: 'compasso', en: 'bar / measure', ja: '小節', category: 'Fundamentos' },
  { id: 'tempo', pt: 'tempo', en: 'tempo / time', ja: 'テンポ', category: 'Fundamentos' },
  { id: 'acorde', pt: 'acorde', en: 'chord', ja: '和音', category: 'Fundamentos' },
  { id: 'escala', pt: 'escala', en: 'scale', ja: '音階', category: 'Fundamentos' },
  { id: 'tonalidade', pt: 'tonalidade', en: 'key / tonality', ja: '調性', category: 'Fundamentos' },
  { id: 'dinamica', pt: 'dinâmica', en: 'dynamics', ja: '強弱', category: 'Fundamentos' },
  { id: 'notacao', pt: 'notação', en: 'notation', ja: '記譜法', category: 'Fundamentos' },
  { id: 'som', pt: 'som', en: 'sound', ja: '音', category: 'Fundamentos' },
  { id: 'nota', pt: 'nota', en: 'note', ja: '音符', category: 'Fundamentos' },
  { id: 'tom', pt: 'tom', en: 'tone', ja: '音程', category: 'Fundamentos' },
  { id: 'violino', pt: 'violino', en: 'violin', ja: 'ヴァイオリン', category: 'Instrumento & Técnica' },
  { id: 'arco', pt: 'arco', en: 'bow', ja: '弓', category: 'Instrumento & Técnica' },
  { id: 'cordas', pt: 'corda(s)', en: 'string(s)', ja: '弦', category: 'Instrumento & Técnica' },
  { id: 'arcada', pt: 'arcada', en: 'bowing stroke', ja: 'ボウイング', category: 'Instrumento & Técnica' },
  { id: 'arco-acima', pt: 'arco acima', en: 'up-bow', ja: 'アップボウ', category: 'Instrumento & Técnica' },
  { id: 'arco-abaixo', pt: 'arco abaixo', en: 'down-bow', ja: 'ダウンボウ', category: 'Instrumento & Técnica' },
  { id: 'dedilhacao', pt: 'dedilhação', en: 'fingering', ja: '運指', category: 'Instrumento & Técnica' },
  { id: 'postura', pt: 'postura', en: 'posture', ja: '姿勢', category: 'Instrumento & Técnica' },
  { id: 'articulacao', pt: 'articulação', en: 'articulation', ja: 'アーティキュレーション', category: 'Instrumento & Técnica' },
  { id: 'afinacao', pt: 'afinação', en: 'tuning', ja: 'チューニング', category: 'Instrumento & Técnica' },
  { id: 'afinado', pt: 'afinado', en: 'in tune', ja: '音程が合っている', category: 'Instrumento & Técnica' },
  { id: 'desafinado', pt: 'desafinado', en: 'out of tune', ja: '音程が外れている', category: 'Instrumento & Técnica' },
  { id: 'tempo-forte', pt: 'tempo forte', en: 'strong beat', ja: '強拍', category: 'Instrumento & Técnica' },
  { id: 'tempo-fraco', pt: 'tempo fraco', en: 'weak beat', ja: '弱拍', category: 'Instrumento & Técnica' },
  { id: 'musica-antiga', pt: 'música antiga', en: 'early music', ja: '古楽', category: 'Música Antiga / HIP' },
  { id: 'musica-barroca', pt: 'música barroca', en: 'baroque music', ja: 'バロック音楽', category: 'Música Antiga / HIP' },
  { id: 'instrumento-historico', pt: 'instrumento histórico', en: 'historical instrument', ja: '古楽器', category: 'Música Antiga / HIP' },
  { id: 'diapasao', pt: 'diapasão', en: 'pitch standard (A=415)', ja: 'ピッチ基準', category: 'Música Antiga / HIP' },
  { id: 'temperamento', pt: 'temperamento', en: 'temperament', ja: '音律', category: 'Música Antiga / HIP' },
  { id: 'ornamentacao', pt: 'ornamentação', en: 'ornamentation', ja: '装飾音', category: 'Música Antiga / HIP' },
  { id: 'trilo', pt: 'trilo', en: 'trill', ja: 'トリル', category: 'Música Antiga / HIP' },
  { id: 'improvisacao', pt: 'improvisação', en: 'improvisation', ja: '即興', category: 'Música Antiga / HIP' },
  { id: 'baixo-continuo', pt: 'baixo contínuo', en: 'basso continuo', ja: 'バッソ・コンティヌオ', category: 'Música Antiga / HIP' },
  { id: 'baixo-cifrado', pt: 'baixo cifrado', en: 'figured bass', ja: '数字付き低音', category: 'Música Antiga / HIP' },
  { id: 'afeto', pt: 'afeto / doutrina dos afetos', en: 'Affektenlehre', ja: '感情論', category: 'Música Antiga / HIP' },
  { id: 'vibrato-como-ornamento', pt: 'vibrato como ornamento', en: 'vibrato as ornament', ja: '装飾としてのビブラート', category: 'Música Antiga / HIP' },
  { id: 'sem-vibrato', pt: 'sem vibrato', en: 'without vibrato', ja: 'ノン・ビブラート', category: 'Música Antiga / HIP' },
  { id: 'hemiola', pt: 'hémiola', en: 'hemiola', ja: 'ヘミオラ', category: 'Música Antiga / HIP' },
  { id: 'messa-di-voce', pt: 'messa di voce', en: 'swell on a held note', ja: 'メッサ・ディ・ヴォーチェ', category: 'Música Antiga / HIP' },
  { id: 'cravo', pt: 'cravo', en: 'harpsichord', ja: 'チェンバロ', category: 'Música Antiga / HIP' },
  { id: 'tiorba', pt: 'tiorba', en: 'theorbo', ja: 'テオルボ', category: 'Música Antiga / HIP' },
  { id: 'viola-da-gamba', pt: 'viola da gamba', en: 'viol', ja: 'ヴィオラ・ダ・ガンバ', category: 'Música Antiga / HIP' },
  { id: 'pode-repetir', pt: 'Pode repetir, por favor?', en: 'Can you repeat, please?', ja: 'もう一度言ってください。', category: 'Frases no Workshop' },
  { id: 'nao-percebi-bem', pt: 'Não percebi bem.', en: "I didn't quite understand.", ja: 'よく分かりませんでした。', category: 'Frases no Workshop' },
  { id: 'mais-devagar', pt: 'Mais devagar, por favor.', en: 'Slower, please.', ja: 'もっとゆっくりお願いします。', category: 'Frases no Workshop' },
  { id: 'o-que-significa', pt: 'O que significa...?', en: 'What does ... mean?', ja: '〜はどういう意味ですか？', category: 'Frases no Workshop' },
  { id: 'vamos-experimentar', pt: 'Vamos experimentar.', en: "Let's try it.", ja: '試してみましょう。', category: 'Frases no Workshop' },
  { id: 'outra-vez', pt: 'Outra vez, desde o início.', en: 'Again, from the beginning.', ja: 'もう一度、最初から。', category: 'Frases no Workshop' },
  { id: 'consigo-tocar', pt: 'Consigo tocar mais devagar.', en: 'I can play more slowly.', ja: 'もっとゆっくり弾けます。', category: 'Frases no Workshop' },
]

const categories = [...new Set(cards.map((card) => card.category))]

const dateKey = (time: number) => new Date(time).toISOString().slice(0, 10)
const startOfDay = (time: number) => new Date(dateKey(time)).getTime()
const isMastered = (state: CardState, cycleSpeed: CycleSpeed, time: number) => {
  if (state.lastConfidence !== 'know') return false
  if (cycleSpeed === 'fast') return state.nextReview - time >= FOUR_HOURS_MS
  return state.interval >= 7
}
const defaultState = (id: string): CardState => ({
  id,
  interval: 0,
  nextReview: 0,
  easeFactor: 2.5,
  repetitions: 0,
  lastConfidence: null,
})

function loadCardStates(): Record<string, CardState> {
  const saved = localStorage.getItem(CARDS_KEY)
  const parsed = saved ? (JSON.parse(saved) as Record<string, CardState>) : {}
  return Object.fromEntries(cards.map((card) => [card.id, { ...defaultState(card.id), ...parsed[card.id] }]))
}

function loadStreak(): StreakState {
  const saved = localStorage.getItem(STREAK_KEY)
  return saved ? (JSON.parse(saved) as StreakState) : { lastDate: '', count: 0 }
}

function loadStudyMode(): StudyMode {
  const saved = localStorage.getItem(STUDY_MODE_KEY)
  return saved === 'pt-first' || saved === 'reverse' || saved === 'random' ? saved : 'pt-first'
}

function loadCycleSpeed(): CycleSpeed {
  const saved = localStorage.getItem(CYCLE_SPEED_KEY)
  return saved === 'fast' ? saved : 'normal'
}

function directionForMode(mode: StudyMode): StudyDirection {
  if (mode === 'random') return Math.random() < 0.5 ? 'pt-first' : 'reverse'
  return mode
}

function shuffleCards<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const item = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = item
  }
  return shuffled
}

function studyPriority(card: Card, state: CardState, time: number, cycleSpeed: CycleSpeed): number {
  const overdueDays = Math.max(0, time - state.nextReview) / DAY_MS
  const daysUntilReview = Math.max(0, state.nextReview - time) / DAY_MS
  const mastered = isMastered(state, cycleSpeed, time)
  const confidenceScore =
    state.lastConfidence === 'unknown'
      ? 900
      : state.lastConfidence === 'unsure'
        ? 700
        : state.lastConfidence === null
          ? 600
          : 0
  const dueScore = state.nextReview <= time ? 1000 + overdueDays * 50 : 0
  const weakScore = mastered ? 0 : Math.max(0, 7 - state.interval) * 40
  const soonScore = Math.max(0, 10 - daysUntilReview)
  const phraseBoost = card.category === 'Frases no Workshop' && !mastered ? 20 : 0
  return dueScore + confidenceScore + weakScore + soonScore + phraseBoost
}

function selectSessionCards(
  cardPool: Card[],
  states: Record<string, CardState>,
  time: number,
  cycleSpeed: CycleSpeed,
): Card[] {
  return shuffleCards(cardPool)
    .sort(
      (first, second) =>
        studyPriority(second, states[second.id], time, cycleSpeed) -
        studyPriority(first, states[first.id], time, cycleSpeed),
    )
    .slice(0, SESSION_SIZE)
}

function normalizeForChoice(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sharedCharacterScore(first: string, second: string): number {
  const firstChars = new Set(first.replace(/\s/g, ''))
  const secondChars = new Set(second.replace(/\s/g, ''))
  if (!firstChars.size || !secondChars.size) return 0
  const shared = [...firstChars].filter((char) => secondChars.has(char)).length
  return shared / Math.max(firstChars.size, secondChars.size)
}

function testDistractorScore(answer: Card, candidate: Card): number {
  const answerText = normalizeForChoice(answer.pt)
  const candidateText = normalizeForChoice(candidate.pt)
  const answerWords = answerText.split(' ').filter(Boolean)
  const candidateWords = candidateText.split(' ').filter(Boolean)
  const answerWordSet = new Set(answerWords)
  const sharedWords = candidateWords.filter((word) => answerWordSet.has(word)).length
  const maxWordCount = Math.max(answerWords.length, candidateWords.length, 1)
  const lengthSimilarity =
    1 - Math.min(Math.abs(answerText.length - candidateText.length) / Math.max(answerText.length, candidateText.length, 1), 1)
  const wordCountSimilarity = 1 - Math.min(Math.abs(answerWords.length - candidateWords.length) / maxWordCount, 1)
  const sameShape = answer.pt.includes('?') === candidate.pt.includes('?') && answer.pt.includes('.') === candidate.pt.includes('.')
  return (
    (answer.category === candidate.category ? 100 : 0) +
    lengthSimilarity * 22 +
    wordCountSimilarity * 18 +
    sharedCharacterScore(answerText, candidateText) * 18 +
    (sharedWords / maxWordCount) * 30 +
    (sameShape ? 8 : 0)
  )
}

function selectTestDistractors(answer: Card, cardPool: Card[]): string[] {
  return shuffleCards(cardPool.filter((item) => item.id !== answer.id))
    .sort((first, second) => testDistractorScore(answer, second) - testDistractorScore(answer, first))
    .slice(0, 3)
    .map((item) => item.pt)
}

function buildTestQuestions(cardPool: Card[], states: Record<string, CardState>, time: number, cycleSpeed: CycleSpeed): TestQuestion[] {
  return selectSessionCards(cardPool, states, time, cycleSpeed).map((card) => {
    const distractors = selectTestDistractors(card, cardPool)
    return {
      id: card.id,
      choices: shuffleCards([card.pt, ...distractors]),
    }
  })
}

function speakPortuguese(text: string) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-PT'
  utterance.rate = 0.82
  utterance.pitch = 1
  const voice = window.speechSynthesis
    .getVoices()
    .find((item) => item.lang.toLowerCase().startsWith('pt'))
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

function masterCard(state: CardState, cycleSpeed: CycleSpeed): CardState {
  const now = Date.now()
  return {
    ...state,
    interval: cycleSpeed === 'fast' ? Math.max(state.interval, 4) : Math.max(state.interval, 7),
    nextReview: now + (cycleSpeed === 'fast' ? FOUR_HOURS_MS : 7 * DAY_MS),
    easeFactor: Math.max(2.5, state.easeFactor),
    repetitions: Math.max(2, state.repetitions + 1),
    lastConfidence: 'know',
  }
}

function reviewCard(state: CardState, confidence: Confidence, cycleSpeed: CycleSpeed): CardState {
  const now = Date.now()
  const speedMultiplier = cycleSpeed === 'fast' ? 0.1 : 1
  if (confidence === 'unknown') {
    return {
      ...state,
      interval: 0,
      nextReview: now,
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      repetitions: 0,
      lastConfidence: confidence,
    }
  }

  if (confidence === 'unsure') {
    const interval = state.repetitions === 0 ? 1 : Math.max(1, Math.round(state.interval * 1.2))
    return {
      ...state,
      interval,
      nextReview: now + interval * DAY_MS * speedMultiplier,
      repetitions: state.repetitions + 1,
      lastConfidence: confidence,
    }
  }

  const interval = state.repetitions === 0 ? 4 : Math.max(1, Math.round(state.interval * (state.easeFactor + 0.15)))
  return {
    ...state,
    interval,
    nextReview: now + interval * DAY_MS * speedMultiplier,
    easeFactor: Math.min(3.2, state.easeFactor + 0.08),
    repetitions: state.repetitions + 1,
    lastConfidence: confidence,
  }
}

function App() {
  const [view, setView] = useState<View>('home')
  const [states, setStates] = useState<Record<string, CardState>>(loadCardStates)
  const [streak, setStreak] = useState<StreakState>(loadStreak)
  const [studyMode, setStudyMode] = useState<StudyMode>(loadStudyMode)
  const [cycleSpeed, setCycleSpeed] = useState<CycleSpeed>(loadCycleSpeed)
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([])
  const [sessionReviews, setSessionReviews] = useState<SessionReview[]>([])
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([])
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([])
  const [testIndex, setTestIndex] = useState(0)
  const [testDeadline, setTestDeadline] = useState(0)
  const [testNow, setTestNow] = useState(() => Date.now())
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => localStorage.setItem(CARDS_KEY, JSON.stringify(states)), [states])
  useEffect(() => localStorage.setItem(STREAK_KEY, JSON.stringify(streak)), [streak])
  useEffect(() => localStorage.setItem(STUDY_MODE_KEY, studyMode), [studyMode])
  useEffect(() => localStorage.setItem(CYCLE_SPEED_KEY, cycleSpeed), [cycleSpeed])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && view === 'study') {
        event.preventDefault()
        setFlipped((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [view])
  useEffect(() => {
    if (view !== 'test' || !testDeadline) return
    const timer = window.setInterval(() => setTestNow(Date.now()), 200)
    return () => window.clearInterval(timer)
  }, [testDeadline, view])

  const activeCards = cards
  const todayTarget = useMemo(
    () => activeCards.filter((card) => states[card.id].nextReview <= startOfDay(now) + DAY_MS - 1),
    [activeCards, now, states],
  )
  const todayReviewed = todayTarget.filter((card) => states[card.id].nextReview > now).length
  const mastered = activeCards.filter((card) => isMastered(states[card.id], cycleSpeed, now)).length
  const needsReview = activeCards.filter((card) => states[card.id].lastConfidence !== 'know').length
  const currentSessionCard = sessionCards[cardIndex]
  const currentCard = cards.find((card) => card.id === currentSessionCard?.id)
  const currentTestQuestion = testQuestions[testIndex]
  const currentTestCard = cards.find((card) => card.id === currentTestQuestion?.id)
  const currentDirection = currentSessionCard?.direction ?? 'pt-first'
  const progress = sessionCards.length ? Math.round((sessionReviews.length / sessionCards.length) * 100) : 0
  const testTimeLeft = view === 'test' ? Math.max(0, Math.ceil((testDeadline - testNow) / 1000)) : TEST_SECONDS
  const testCorrect = testAnswers.filter((answer) => answer.correct).length
  const testNeedsPractice = testAnswers
    .filter((answer) => !answer.correct)
    .map((answer) => ({ answer, card: cards.find((card) => card.id === answer.id) }))
    .filter((item): item is { answer: TestAnswer; card: Card } => Boolean(item.card))
  const resultKnown = sessionReviews.filter((review) => review.confidence === 'know').length
  const resultNeedsPractice = sessionReviews
    .filter((review) => review.confidence !== 'know')
    .map((review) => ({ review, card: cards.find((card) => card.id === review.id) }))
    .filter((item): item is { review: SessionReview; card: Card } => Boolean(item.card))

  const startStudy = () => {
    const session = selectSessionCards(activeCards, states, now, cycleSpeed)
      .map((card) => ({ id: card.id, direction: directionForMode(studyMode) }))
    setSessionCards(session)
    setSessionReviews([])
    setCardIndex(0)
    setFlipped(false)
    setView('study')
  }

  const startTest = () => {
    const questions = buildTestQuestions(activeCards, states, now, cycleSpeed)
    setTestQuestions(questions)
    setTestAnswers([])
    setTestIndex(0)
    setTestNow(now)
    setTestDeadline(now + TEST_SECONDS * 1000)
    setView('test')
  }

  const finishReview = (confidence: Confidence) => {
    if (!currentCard) return
    setStates((current) => ({ ...current, [currentCard.id]: reviewCard(current[currentCard.id], confidence, cycleSpeed) }))
    setSessionReviews((reviews) => [...reviews, { id: currentCard.id, confidence }])
    setFlipped(false)
    if (cardIndex + 1 >= sessionCards.length) {
      const today = dateKey(Date.now())
      const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10)
      setStreak((current) => ({
        lastDate: today,
        count: current.lastDate === today ? current.count : current.lastDate === yesterday ? current.count + 1 : 1,
      }))
      setView('results')
    } else {
      setCardIndex((index) => index + 1)
    }
  }

  const finishTestQuestion = useCallback((choice: string | null) => {
    if (!currentTestCard) return
    const correct = choice === currentTestCard.pt
    if (correct) {
      setStates((current) => ({ ...current, [currentTestCard.id]: masterCard(current[currentTestCard.id], cycleSpeed) }))
    }
    setTestAnswers((answers) => [...answers, { id: currentTestCard.id, correct, timedOut: choice === null }])
    if (testIndex + 1 >= testQuestions.length) {
      setView('testResults')
      return
    }
    setTestIndex((index) => index + 1)
    setTestNow(testNow)
    setTestDeadline(testNow + TEST_SECONDS * 1000)
  }, [currentTestCard, cycleSpeed, testIndex, testNow, testQuestions.length])

  useEffect(() => {
    if (view !== 'test' || !currentTestCard || !testDeadline) return
    const timeout = window.setTimeout(() => finishTestQuestion(null), Math.max(0, testDeadline - testNow))
    return () => window.clearTimeout(timeout)
  }, [currentTestCard, finishTestQuestion, testDeadline, testNow, view])

  const resetData = () => {
    if (!confirm('学習データをリセットしますか？')) return
    localStorage.removeItem(CARDS_KEY)
    localStorage.removeItem(STREAK_KEY)
    setStates(loadCardStates())
    setStreak({ lastDate: '', count: 0 })
  }

  return (
    <main className="min-h-screen bg-[#f6f3ed] text-[#25211c]">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-4 py-5 sm:px-6">
        <header className="mb-5 flex items-center justify-between">
          <button className="brand" onClick={() => setView('home')} type="button">
            Palemu
          </button>
          <nav className="segmented" aria-label="Main navigation">
            {(['home', 'study', 'test', 'stats'] as View[]).map((item) => (
              <button
                key={item}
                className={view === item ? 'active' : ''}
                onClick={() => (item === 'study' ? startStudy() : item === 'test' ? startTest() : setView(item))}
                type="button"
              >
                {item === 'home' ? 'Home' : item === 'study' ? 'Study' : item === 'test' ? 'Test' : 'Stats'}
              </button>
            ))}
          </nav>
        </header>

        {view === 'home' && (
          <section className="space-y-5">
            <div className="hero-panel">
              <p className="eyebrow">Português para música barroca</p>
              <h1>Palavras</h1>
              <div className="mt-5">
                <div className="flex justify-between text-sm font-medium">
                  <span>今日の達成率</span>
                  <span>{todayTarget.length ? `${todayReviewed}/${todayTarget.length}` : '0/0'}</span>
                </div>
                <div className="meter mt-2">
                  <span style={{ width: `${todayTarget.length ? (todayReviewed / todayTarget.length) * 100 : 0}%` }} />
                </div>
              </div>
              <button className="primary mt-5 w-full" onClick={startStudy} type="button">
                今日の単語を始める ({Math.min(activeCards.length, SESSION_SIZE)} / {activeCards.length})
              </button>
              <button className="ghost mt-3 w-full" onClick={startTest} type="button">
                テストする ({SESSION_SIZE})
              </button>
            </div>

            <section>
              <div className="section-title">
                <h2>学習方向</h2>
              </div>
              <div className="mode-grid">
                {[
                  { id: 'pt-first', label: 'PT → 意味', detail: 'ポルトガル語から確認' },
                  { id: 'reverse', label: '意味 → PT', detail: '英語・日本語から推測' },
                  { id: 'random', label: 'ランダム', detail: 'カードごとに混在' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    className={studyMode === mode.id ? 'mode-option selected' : 'mode-option'}
                    onClick={() => setStudyMode(mode.id as StudyMode)}
                    type="button"
                  >
                    <strong>{mode.label}</strong>
                    <span>{mode.detail}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="section-title">
                <h2>回転速度</h2>
              </div>
              <div className="mode-grid speed-grid">
                {[
                  { id: 'normal', label: '通常', detail: '標準の復習サイクル' },
                  { id: 'fast', label: '超高速', detail: '復習サイクルを10倍速にする' },
                ].map((speed) => (
                  <button
                    key={speed.id}
                    className={cycleSpeed === speed.id ? 'mode-option selected' : 'mode-option'}
                    onClick={() => setCycleSpeed(speed.id as CycleSpeed)}
                    type="button"
                  >
                    <strong>{speed.label}</strong>
                    <span>{speed.detail}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="stats-grid">
              <Stat label="総単語数" value={activeCards.length} />
              <Stat label="習得済み" value={mastered} />
              <Stat label="要復習" value={needsReview} />
            </div>
          </section>
        )}

        {view === 'study' && (
          <section className="flex flex-1 flex-col">
            {currentCard ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{sessionReviews.length + 1} / {sessionCards.length}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="meter mt-2"><span style={{ width: `${progress}%` }} /></div>
                </div>
                <button className={flipped ? 'flashcard flipped' : 'flashcard'} onClick={() => setFlipped((value) => !value)} type="button">
                  <span className="category-tag">{currentCard.category}</span>
                  <span
                    className="audio-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      speakPortuguese(currentCard.pt)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        speakPortuguese(currentCard.pt)
                      }
                    }}
                  >
                    ▶
                  </span>
                  {currentDirection === 'pt-first' ? (
                    <span className="pt">{currentCard.pt}</span>
                  ) : (
                    <span className="answer">
                      <strong>{currentCard.en}</strong>
                      <span>{currentCard.ja}</span>
                    </span>
                  )}
                  {flipped && currentDirection === 'pt-first' && (
                    <span className="answer">
                      <strong>{currentCard.en}</strong>
                      <span>{currentCard.ja}</span>
                    </span>
                  )}
                  {flipped && currentDirection === 'reverse' && <span className="pt">{currentCard.pt}</span>}
                </button>
                <div className="answer-grid mt-5">
                  <button className="know" onClick={() => finishReview('know')} type="button">わかる</button>
                  <button className="unsure" onClick={() => finishReview('unsure')} type="button">不安</button>
                  <button className="unknown" onClick={() => finishReview('unknown')} type="button">わからない</button>
                </div>
                <button className="ghost mt-4" onClick={() => setView('home')} type="button">スキップ</button>
              </>
            ) : (
              <EmptyState title="今日の対象はありません" action="Homeに戻る" onAction={() => setView('home')} />
            )}
          </section>
        )}

        {view === 'results' && (
          <section className="space-y-5">
            <div className="hero-panel">
              <p className="eyebrow">Session complete</p>
              <h1>今回の結果</h1>
              <div className="mt-5">
                <div className="flex justify-between text-sm font-medium">
                  <span>達成度</span>
                  <span>{sessionReviews.length ? `${resultKnown}/${sessionReviews.length}` : '0/0'}</span>
                </div>
                <div className="meter mt-2">
                  <span style={{ width: `${sessionReviews.length ? (resultKnown / sessionReviews.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="stats-grid mt-5">
                <Stat label="今回の単語" value={sessionReviews.length} />
                <Stat label="わかる" value={resultKnown} />
                <Stat label="再学習" value={resultNeedsPractice.length} />
              </div>
              <button className="primary mt-5 w-full" onClick={startStudy} type="button">
                もう一度やる
              </button>
            </div>

            <section className="panel">
              <h2>再学習が必要な単語</h2>
              {resultNeedsPractice.length ? (
                <div className="practice-list">
                  {resultNeedsPractice.map(({ review, card }) => (
                    <div key={card.id}>
                      <span>
                        <strong>{card.pt}</strong>
                        <small>{card.en} / {card.ja}</small>
                      </span>
                      <b>{review.confidence === 'unsure' ? '不安' : 'わからない'}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-copy">今回の再学習対象はありません。</p>
              )}
            </section>
          </section>
        )}

        {view === 'test' && (
          <section className="flex flex-1 flex-col">
            {currentTestCard && currentTestQuestion ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{testAnswers.length + 1} / {testQuestions.length}</span>
                    <span>{testTimeLeft}s</span>
                  </div>
                  <div className="meter mt-2 timer-meter"><span style={{ width: `${(testTimeLeft / TEST_SECONDS) * 100}%` }} /></div>
                </div>
                <section className="test-card">
                  <span className="category-tag">{currentTestCard.category}</span>
                  <span className="answer">
                    <strong>{currentTestCard.en}</strong>
                    <span>{currentTestCard.ja}</span>
                  </span>
                </section>
                <div className="choice-grid mt-5">
                  {currentTestQuestion.choices.map((choice) => (
                    <button key={choice} onClick={() => finishTestQuestion(choice)} type="button">
                      {choice}
                    </button>
                  ))}
                </div>
                <button className="ghost mt-4" onClick={() => setView('home')} type="button">中断</button>
              </>
            ) : (
              <EmptyState title="テスト対象がありません" action="Homeに戻る" onAction={() => setView('home')} />
            )}
          </section>
        )}

        {view === 'testResults' && (
          <section className="space-y-5">
            <div className="hero-panel">
              <p className="eyebrow">Test complete</p>
              <h1>Teste</h1>
              <div className="mt-5">
                <div className="flex justify-between text-sm font-medium">
                  <span>正答率</span>
                  <span>{testAnswers.length ? `${testCorrect}/${testAnswers.length}` : '0/0'}</span>
                </div>
                <div className="meter mt-2">
                  <span style={{ width: `${testAnswers.length ? (testCorrect / testAnswers.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="stats-grid mt-5">
                <Stat label="出題数" value={testAnswers.length} />
                <Stat label="正解" value={testCorrect} />
                <Stat label="失敗" value={testNeedsPractice.length} />
              </div>
              <button className="primary mt-5 w-full" onClick={startTest} type="button">
                もう一度テスト
              </button>
            </div>

            <section className="panel">
              <h2>失敗した単語</h2>
              {testNeedsPractice.length ? (
                <div className="practice-list">
                  {testNeedsPractice.map(({ answer, card }) => (
                    <div key={card.id}>
                      <span>
                        <strong>{card.pt}</strong>
                        <small>{card.en} / {card.ja}</small>
                      </span>
                      <b>{answer.timedOut ? '時間切れ' : '不正解'}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-copy">全問正解です。</p>
              )}
            </section>
          </section>
        )}

        {view === 'stats' && (
          <section className="space-y-5">
            <div className="stats-grid">
              <Stat label="達成率" value={`${Math.round((mastered / activeCards.length) * 100 || 0)}%`} />
              <Stat label="Streak" value={`${streak.count}日`} />
              <Stat label="次回あり" value={activeCards.filter((card) => states[card.id].nextReview > now).length} />
            </div>
            <section className="panel">
              <h2>カテゴリ別達成率</h2>
              <div className="mt-4 space-y-3">
                {categories.map((category) => {
                  const categoryCards = cards.filter((card) => card.category === category)
                  const categoryMastered = categoryCards.filter((card) => isMastered(states[card.id], cycleSpeed, now)).length
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm"><span>{category}</span><span>{Math.round((categoryMastered / categoryCards.length) * 100)}%</span></div>
                      <div className="meter mt-1"><span style={{ width: `${(categoryMastered / categoryCards.length) * 100}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            </section>
            <section className="panel">
              <h2>次回レビュー</h2>
              <div className="review-list">
                {cards.map((card) => (
                  <div key={card.id}>
                    <span>{card.pt}</span>
                    <time>{states[card.id].nextReview ? new Date(states[card.id].nextReview).toLocaleDateString('ja-JP') : '未学習'}</time>
                  </div>
                ))}
              </div>
            </section>
            <button className="danger w-full" onClick={resetData} type="button">データリセット</button>
          </section>
        )}
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function EmptyState({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <div className="panel mt-16 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <button className="primary mt-5" onClick={onAction} type="button">{action}</button>
    </div>
  )
}

export default App
