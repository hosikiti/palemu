import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Confidence = 'know' | 'unsure' | 'unknown'
type Category =
  | 'Solfejo'
  | 'Fundamentos'
  | 'Instrumento & Técnica'
  | 'Música Antiga / HIP'
  | 'Frases no Workshop'
type View = 'home' | 'study' | 'stats'
type StudyMode = 'pt-first' | 'reverse' | 'random'
type StudyDirection = 'pt-first' | 'reverse'

interface SessionCard {
  id: string
  direction: StudyDirection
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
const DAY_MS = 24 * 60 * 60 * 1000

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
const isMastered = (state: CardState) => state.interval >= 7 && state.lastConfidence === 'know'
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

function directionForMode(mode: StudyMode): StudyDirection {
  if (mode === 'random') return Math.random() < 0.5 ? 'pt-first' : 'reverse'
  return mode
}

function reviewCard(state: CardState, confidence: Confidence): CardState {
  const now = Date.now()
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
      nextReview: now + interval * DAY_MS,
      repetitions: state.repetitions + 1,
      lastConfidence: confidence,
    }
  }

  const interval = state.repetitions === 0 ? 4 : Math.max(1, Math.round(state.interval * (state.easeFactor + 0.15)))
  return {
    ...state,
    interval,
    nextReview: now + interval * DAY_MS,
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
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(categories)
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([])
  const [reviewedIds, setReviewedIds] = useState<string[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => localStorage.setItem(CARDS_KEY, JSON.stringify(states)), [states])
  useEffect(() => localStorage.setItem(STREAK_KEY, JSON.stringify(streak)), [streak])
  useEffect(() => localStorage.setItem(STUDY_MODE_KEY, studyMode), [studyMode])
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

  const activeCards = useMemo(
    () => cards.filter((card) => selectedCategories.includes(card.category)),
    [selectedCategories],
  )
  const dueCards = useMemo(
    () => activeCards.filter((card) => states[card.id].nextReview <= now),
    [activeCards, now, states],
  )
  const todayTarget = useMemo(
    () => activeCards.filter((card) => states[card.id].nextReview <= startOfDay(now) + DAY_MS - 1),
    [activeCards, now, states],
  )
  const todayReviewed = todayTarget.filter((card) => states[card.id].nextReview > now).length
  const mastered = activeCards.filter((card) => isMastered(states[card.id])).length
  const needsReview = activeCards.filter((card) => states[card.id].lastConfidence !== 'know').length
  const currentSessionCard = sessionCards[cardIndex]
  const currentCard = cards.find((card) => card.id === currentSessionCard?.id)
  const currentDirection = currentSessionCard?.direction ?? 'pt-first'
  const progress = sessionCards.length ? Math.round((reviewedIds.length / sessionCards.length) * 100) : 0

  const startStudy = () => {
    const session = dueCards.map((card) => ({ id: card.id, direction: directionForMode(studyMode) }))
    setSessionCards(session)
    setReviewedIds([])
    setCardIndex(0)
    setFlipped(false)
    setView('study')
  }

  const finishReview = (confidence: Confidence) => {
    if (!currentCard) return
    setStates((current) => ({ ...current, [currentCard.id]: reviewCard(current[currentCard.id], confidence) }))
    setReviewedIds((ids) => [...ids, currentCard.id])
    setFlipped(false)
    if (cardIndex + 1 >= sessionCards.length) {
      const today = dateKey(Date.now())
      const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10)
      setStreak((current) => ({
        lastDate: today,
        count: current.lastDate === today ? current.count : current.lastDate === yesterday ? current.count + 1 : 1,
      }))
      setView('home')
    } else {
      setCardIndex((index) => index + 1)
    }
  }

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
            {(['home', 'study', 'stats'] as View[]).map((item) => (
              <button key={item} className={view === item ? 'active' : ''} onClick={() => (item === 'study' ? startStudy() : setView(item))} type="button">
                {item === 'home' ? 'Home' : item === 'study' ? 'Study' : 'Stats'}
              </button>
            ))}
          </nav>
        </header>

        {view === 'home' && (
          <section className="space-y-5">
            <div className="hero-panel">
              <p className="eyebrow">Português para música barroca</p>
              <h1>今日の単語を定着させる</h1>
              <div className="mt-5">
                <div className="flex justify-between text-sm font-medium">
                  <span>今日の達成率</span>
                  <span>{todayTarget.length ? `${todayReviewed}/${todayTarget.length}` : '0/0'}</span>
                </div>
                <div className="meter mt-2">
                  <span style={{ width: `${todayTarget.length ? (todayReviewed / todayTarget.length) * 100 : 0}%` }} />
                </div>
              </div>
              <button className="primary mt-5 w-full" disabled={dueCards.length === 0} onClick={startStudy} type="button">
                今日の単語を始める ({dueCards.length})
              </button>
            </div>

            <section>
              <div className="section-title">
                <h2>カテゴリ</h2>
                <button type="button" onClick={() => setSelectedCategories(selectedCategories.length === categories.length ? [] : categories)}>
                  {selectedCategories.length === categories.length ? '全解除' : '全選択'}
                </button>
              </div>
              <div className="chips">
                {categories.map((category) => (
                  <label key={category} className={selectedCategories.includes(category) ? 'chip selected' : 'chip'}>
                    <input
                      checked={selectedCategories.includes(category)}
                      onChange={() =>
                        setSelectedCategories((current) =>
                          current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
                        )
                      }
                      type="checkbox"
                    />
                    {category}
                  </label>
                ))}
              </div>
            </section>

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
                    <span>{reviewedIds.length + 1} / {sessionCards.length}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="meter mt-2"><span style={{ width: `${progress}%` }} /></div>
                </div>
                <button className={flipped ? 'flashcard flipped' : 'flashcard'} onClick={() => setFlipped((value) => !value)} type="button">
                  <span className="category-tag">{currentCard.category}</span>
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
                  const categoryMastered = categoryCards.filter((card) => isMastered(states[card.id])).length
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
