import { useEffect, useMemo, useState } from 'react'
import { beats, drills, latest, mcqs, tracks, words } from './data'

const STORAGE_KEY = 'desk-round'
const views = [
  { id: 'market', label: 'Market' },
  { id: 'practice', label: 'Practice' },
  { id: 'words', label: 'Words' },
  { id: 'drills', label: 'Drills' },
  { id: 'latest', label: 'Spoken' },
  { id: 'mock', label: 'Mock' },
  { id: 'story', label: 'Story' },
]
const levels = [
  { id: 'all', label: 'All' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'bug', label: 'Bugs' },
]
const javaTopics = [
  { id: 'all', label: 'All topics' },
  { id: 'basics', label: 'Basics' },
  { id: 'collections', label: 'Collections' },
  { id: 'modern', label: 'Modern JDK' },
  { id: 'scenario', label: 'Scenarios' },
]
const topicNames = {
  basics: 'basics',
  collections: 'collections',
  modern: 'modern JDK',
}

function loadDesk() {
  const empty = { picks: {}, notes: {}, saved: {}, best: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const data = JSON.parse(raw)
    return {
      picks: data.picks && typeof data.picks === 'object' ? data.picks : {},
      notes: data.notes && typeof data.notes === 'object' ? data.notes : {},
      saved: data.saved && typeof data.saved === 'object' ? data.saved : {},
      best: data.best ?? null,
    }
  } catch {
    return empty
  }
}

function matches(query, parts) {
  if (!query) return true
  return parts.join(' ').toLowerCase().includes(query)
}

function studyCount(id) {
  const keep = (item) => id === 'all' || item.track === id
  return mcqs.filter(keep).length + latest.filter(keep).length + drills.filter(keep).length + words.filter(keep).length
}

function levelOf(item) {
  if (item.kind === 'bug') return 'bug'
  return item.level ?? 'easy'
}

function acceptLevel(item, level) {
  if (level === 'all') return true
  if (level === 'bug') return item.kind === 'bug'
  if (level === 'medium') return item.level === 'medium' || item.kind === 'bug'
  return (item.level ?? 'easy') === 'easy' && item.kind !== 'bug'
}

function acceptTopic(item, topic) {
  if (topic === 'all') return true
  if (topic === 'scenario') return item.scenario === true
  return item.topic === topic
}

function kicker(item, number) {
  const parts = [label(item.track)]
  if (topicNames[item.topic]) parts.push(topicNames[item.topic])
  if (item.scenario) parts.push('scenario')
  if (item.options) parts.push(levelOf(item))
  if (number) parts.push(String(number))
  return parts.join(' · ')
}

function focusLabel(trackId, topic) {
  if (trackId === 'all') return 'the full syllabus'
  if (trackId === 'java' && topic !== 'all') {
    const name = javaTopics.find((item) => item.id === topic)?.label ?? topic
    return `Java · ${name}`
  }
  return label(trackId)
}

function shuffle(list) {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function clock(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function label(id) {
  return tracks.find((item) => item.id === id)?.name ?? id
}

export default function App() {
  const stored = useMemo(() => loadDesk(), [])
  const [view, setView] = useState('market')
  const [track, setTrack] = useState('all')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [javaTopic, setJavaTopic] = useState('all')
  const [missed, setMissed] = useState(false)
  const [picks, setPicks] = useState(stored.picks)
  const [notes, setNotes] = useState(stored.notes)
  const [saved, setSaved] = useState(stored.saved)
  const [best, setBest] = useState(stored.best)
  const [mockRun, setMockRun] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ picks, notes, saved, best }))
    } catch {
      // The desk still works for this visit when storage is blocked.
    }
  }, [picks, notes, saved, best])

  const needle = query.trim().toLowerCase()
  const searching = needle.length > 0

  const visibleMcqs = useMemo(
    () =>
      mcqs.filter((item) => {
        if (track !== 'all' && item.track !== track) return false
        if (!matches(needle, [item.prompt, item.why, item.code ?? '', ...(item.detail ?? []), ...item.options, item.track, label(item.track)])) {
          return false
        }
        if (searching) return true
        if (track === 'java' && !acceptTopic(item, javaTopic)) return false
        if (!acceptLevel(item, level)) return false
        if (missed && !(picks[item.id] !== undefined && picks[item.id] !== item.answer)) return false
        return true
      }),
    [javaTopic, level, missed, needle, picks, searching, track],
  )

  const visibleLatest = useMemo(
    () =>
      latest.filter(
        (item) =>
          (track === 'all' || item.track === track) &&
          (track !== 'java' || searching || acceptTopic(item, javaTopic)) &&
          matches(needle, [item.prompt, item.answer, ...(item.detail ?? []), item.topic ?? '', item.track, label(item.track)]),
      ),
    [javaTopic, needle, searching, track],
  )

  const visibleDrills = useMemo(
    () =>
      drills.filter(
        (item) =>
          (track === 'all' || item.track === track) &&
          (track !== 'java' || searching || acceptTopic(item, javaTopic)) &&
          matches(needle, [item.prompt, item.answer, item.why, ...(item.detail ?? []), item.schema ?? '', item.topic ?? '', item.track, label(item.track)]),
      ),
    [javaTopic, needle, searching, track],
  )

  const visibleWords = useMemo(
    () =>
      words
        .filter(
          (item) =>
            (track === 'all' || item.track === track) &&
            (track !== 'java' || searching || acceptTopic(item, javaTopic)) &&
            matches(needle, [item.term, item.meaning, ...(item.detail ?? []), item.topic ?? '', item.track, label(item.track)]),
        )
        .sort((a, b) => a.term.localeCompare(b.term)),
    [javaTopic, needle, searching, track],
  )

  const mockPool = useMemo(
    () =>
      mcqs.filter(
        (item) =>
          (track === 'all' || item.track === track) && (track !== 'java' || acceptTopic(item, javaTopic)),
      ),
    [javaTopic, track],
  )

  const answered = visibleMcqs.filter((item) => picks[item.id] !== undefined)
  const correct = answered.filter((item) => picks[item.id] === item.answer).length

  const openView = (next) => {
    setQuery('')
    setView(next)
  }

  const clearVisible = () => {
    setPicks((current) => {
      const next = { ...current }
      for (const item of visibleMcqs) delete next[item.id]
      return next
    })
  }

  return (
    <div className="shell">
      <header className="bar">
        <div className="bar-inner">
          <button className="logo" type="button" onClick={() => openView('market')}>
            <span className="mark">DR</span>
            Desk Round
          </button>
          <nav className="views" aria-label="Sections">
            {views.map((item) => (
              <button
                key={item.id}
                className={view === item.id && !searching ? 'on' : ''}
                aria-current={view === item.id && !searching ? 'page' : undefined}
                onClick={() => openView(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <label className="search">
            <span className="sr">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the desk"
              aria-label="Search"
            />
          </label>
        </div>
      </header>

      <div className="frame">
        {!searching && view === 'market' && (
          <section className="hero">
            <div>
              <p className="eyebrow">Study desk · October 2026</p>
              <h1>Prepare the interview, one track at a time.</h1>
              <p className="lede">
                Java, Spring Boot, React, MySQL, and PostgreSQL. Look up a word, work the questions,
                read a plan, sit a timed mock, and keep a project story you can say without notes.
              </p>
              <div className="actions">
                <button className="primary" type="button" onClick={() => openView('practice')}>
                  Start practice
                </button>
                <button className="ghost" type="button" onClick={() => openView('mock')}>
                  Run a 10-question mock
                </button>
              </div>
            </div>
            <ul className="stats">
              <li>
                <strong>{tracks.length}</strong>
                <span>study tracks</span>
              </li>
              <li>
                <strong>{mcqs.length}</strong>
                <span>practice questions</span>
              </li>
              <li>
                <strong>{latest.length}</strong>
                <span>spoken answers</span>
              </li>
              <li>
                <strong>{drills.length}</strong>
                <span>drills</span>
              </li>
            </ul>
          </section>
        )}

        <div className="layout">
          <aside className="syllabus">
            <p className="side-label">Syllabus</p>
            <button
              className={track === 'all' ? 'track on' : 'track'}
              onClick={() => setTrack('all')}
              type="button"
            >
              <span>
                <strong>Full syllabus</strong>
                <small>All five tracks</small>
              </span>
              <span>{studyCount('all')}</span>
            </button>
            {tracks.map((item) => (
              <button
                key={item.id}
                className={track === item.id ? 'track on' : 'track'}
                onClick={() => setTrack(item.id)}
                type="button"
              >
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.version}</small>
                </span>
                <span>{studyCount(item.id)}</span>
              </button>
            ))}
          </aside>

          <main className="panel">
            {searching ? (
              <SearchResults
                words={visibleWords}
                mcqs={visibleMcqs}
                latest={visibleLatest}
                drills={visibleDrills}
                picks={picks}
                setPicks={setPicks}
                notes={notes}
                setNotes={setNotes}
                saved={saved}
                setSaved={setSaved}
              />
            ) : view === 'market' ? (
              <Market track={track} onStory={() => openView('story')} />
            ) : view === 'practice' ? (
              <Practice
                items={visibleMcqs}
                level={level}
                setLevel={setLevel}
                missed={missed}
                setMissed={setMissed}
                showTopics={track === 'java'}
                topic={javaTopic}
                setTopic={setJavaTopic}
                picks={picks}
                setPicks={setPicks}
                correct={correct}
                onReset={clearVisible}
              />
            ) : view === 'words' ? (
              <WordList items={visibleWords} showTopics={track === 'java'} topic={javaTopic} setTopic={setJavaTopic} />
            ) : view === 'drills' ? (
              <DrillList
                items={visibleDrills}
                notes={notes}
                setNotes={setNotes}
                saved={saved}
                setSaved={setSaved}
                showTopics={track === 'java'}
                topic={javaTopic}
                setTopic={setJavaTopic}
              />
            ) : view === 'latest' ? (
              <LatestList items={visibleLatest} showTopics={track === 'java'} topic={javaTopic} setTopic={setJavaTopic} />
            ) : view === 'mock' ? (
              <Mock pool={mockPool} track={track} topic={javaTopic} run={mockRun} setRun={setMockRun} best={best} setBest={setBest} />
            ) : (
              <Story track={track} notes={notes} setNotes={setNotes} />
            )}
          </main>
        </div>
      </div>

      <footer className="site-foot">
        <p>
          Answers stay in this browser. Version notes follow public releases as of October 2026:{' '}
          <a href="https://openjdk.org/projects/jdk/25/">JDK 25</a>,{' '}
          <a href="https://github.com/spring-projects/spring-boot/releases/tag/v4.1.2">Spring Boot 4.1.2</a>,{' '}
          <a href="https://blogs.oracle.com/mysql/mysql-october-2026-ga-releases-now-available">MySQL October 2026</a>
          , and <a href="https://www.postgresql.org/docs/18/release-18.html">PostgreSQL 18</a>. Salary
          bands are rough India product-company ranges, not offers.
        </p>
      </footer>
    </div>
  )
}

function Market({ track, onStory }) {
  const focus = tracks.find((item) => item.id === track)
  return (
    <section>
      <h2>What interviews for this stack look like</h2>
      <p className="intro">
        Java and React are still the default full-stack screen. Spring Boot is the framework they
        mean when they say Java. MySQL is the database many existing products already run. Postgres
        is what a lot of new services ask you to defend. The loop cares that you can read a plan,
        explain a re-render, name the transaction boundary, and say which JDK is actually LTS.
      </p>
      {focus && <p className="callout">{focus.line}</p>}

      <div className="grid">
        <article>
          <h3>The loop</h3>
          <ol>
            <li>Recruiter screen: stack, years, and one project you can narrate.</li>
            <li>Written test: Java, Spring, SQL, or a short React quiz. Use Practice, then Mock.</li>
            <li>Live work: a bug, a query, or a small component. The Drills tab is that hour.</li>
            <li>Deep dive: virtual threads, a transaction, rendering, or an EXPLAIN you disagree with.</li>
            <li>Hiring manager: tradeoffs, which is the Story tab.</li>
          </ol>
        </article>
        <article>
          <h3>Rough India bands</h3>
          <p>Product companies, 2026, before you negotiate. City and brand move these a lot.</p>
          <ul>
            <li>0–1 year: about ₹4–12 LPA</li>
            <li>2–4 years: about ₹12–30 LPA</li>
            <li>5+ years: about ₹28–60 LPA, with a long tail above that</li>
          </ul>
        </article>
        <article>
          <h3>What changed this year</h3>
          <ul>
            <li>Java 25 is LTS. Java 27 is not. Virtual threads are a normal question now.</li>
            <li>Spring Boot 4.1 is the stable line. Java 17 is the minimum. 4.2 is still a release candidate.</li>
            <li>React interviews start from rendering and React 19 forms, not class components.</li>
            <li>MySQL 8.0 is end of life. Say “replica”, not “slave”.</li>
            <li>Postgres 18 made async I/O, skip scan, and uuidv7 fair game.</li>
          </ul>
        </article>
        <article>
          <h3>Seven-day pass</h3>
          <ol>
            <li>Java: walk All topics in order, from the object through to threads.</li>
            <li>Spring: the proxy, rollback rules, and one N+1.</li>
            <li>React: state, effects, keys.</li>
            <li>React: memo, context, one React 19 action.</li>
            <li>MySQL: InnoDB, indexes, then write the three SQL drills.</li>
            <li>Postgres: MVCC, vacuum, and one EXPLAIN you can narrate.</li>
            <li>A mixed mock, the version table, and the project story with no notes.</li>
          </ol>
          <button className="text-btn story-jump" type="button" onClick={onStory}>
            Open the project story
          </button>
        </article>
      </div>

      <h3 className="table-title">Versions worth naming</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Track</th>
              <th>Say this</th>
              <th>Leave this</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Java</td>
              <td>21 and 25 are LTS. 25 added compact source files, module imports, flexible constructors, scoped values.</td>
              <td>Do not require Java 27. Structured concurrency was still preview on 25.</td>
            </tr>
            <tr>
              <td>Spring</td>
              <td>Boot 4.0 and 4.1 on Java 17 or later. Jakarta EE 11. Name the version you actually run. 3.5 is still common in production.</td>
              <td>4.2 while it is a release candidate. javax.* imports. Undertow.</td>
            </tr>
            <tr>
              <td>React</td>
              <td>React 19. Actions, useActionState, Server Components, and the render rule.</td>
              <td>Class lifecycle methods as the main screen.</td>
            </tr>
            <tr>
              <td>MySQL</td>
              <td>LTS 8.4 and 9.7. Innovation 26.10. Upgrade 8.0 → 8.4 → 9.7.</td>
              <td>8.0 as a current target. MASTER / SLAVE syntax.</td>
            </tr>
            <tr>
              <td>PostgreSQL</td>
              <td>18 is the line to discuss. 17 and 16 are still common in production.</td>
              <td>Pretending skip scan exists in older majors.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TopicBar({ topic, setTopic }) {
  return (
    <div className="filters" role="group" aria-label="Java topic">
      {javaTopics.map((item) => (
        <button
          key={item.id}
          type="button"
          className={topic === item.id ? 'on' : ''}
          aria-pressed={topic === item.id}
          onClick={() => setTopic(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function Practice({ items, level, setLevel, missed, setMissed, showTopics, topic, setTopic, picks, setPicks, correct, onReset }) {
  const answeredCount = items.filter((item) => picks[item.id] !== undefined).length
  const progress = items.length ? Math.round((answeredCount / items.length) * 100) : 0
  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Practice</h2>
          <p>
            {correct} correct of {answeredCount} answered · {items.length} in this set. Answers stay
            in this browser.
            {showTopics && topic === 'all'
              ? ' On All topics this set is in study order: object, value, classes, failures, collections, the JDK, then threads.'
              : ''}
          </p>
        </div>
        <button type="button" className="text-btn" onClick={onReset}>
          Clear this set
        </button>
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      {showTopics && <TopicBar topic={topic} setTopic={setTopic} />}
      <div className="filters" role="group" aria-label="Question filter">
        {levels.map((item) => (
          <button
            key={item.id}
            type="button"
            className={level === item.id ? 'on' : ''}
            aria-pressed={level === item.id}
            onClick={() => setLevel(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className={missed ? 'on' : ''} aria-pressed={missed} onClick={() => setMissed((value) => !value)}>
          Missed
        </button>
      </div>
      {items.length === 0 && (
        <p className="empty">
          {missed ? 'No misses in this set.' : 'Nothing in this track for that filter.'}
        </p>
      )}
      <div className="stack">
        {items.map((item, index) => (
          <McqCard
            key={item.id}
            item={item}
            number={index + 1}
            pick={picks[item.id]}
            mode="check"
            onPick={(choice) => setPicks((current) => ({ ...current, [item.id]: choice }))}
          />
        ))}
      </div>
    </section>
  )
}

function McqCard({ item, number, pick, onPick, mode }) {
  const revealed = mode === 'review' || (mode === 'check' && pick !== undefined)
  return (
    <article className="card">
      <p className="kicker">{kicker(item, number)}</p>
      <h3>{item.prompt}</h3>
      {item.code && <pre className="code">{item.code}</pre>}
      <div className="options">
        {item.options.map((option, index) => {
          let tone = ''
          if (mode === 'exam' && pick === index) tone = 'picked'
          else if (revealed && index === item.answer) tone = 'good'
          else if (revealed && index === pick) tone = 'bad'
          return (
            <button
              key={option}
              type="button"
              className={tone}
              disabled={revealed}
              onClick={() => onPick(index)}
            >
              <span className="letter">{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </button>
          )
        })}
      </div>
      {revealed && <Explain text={item.why} detail={item.detail} />}
    </article>
  )
}

function WordList({ items, showTopics, topic, setTopic }) {
  return (
    <section>
      <div className="section-head">
        <h2>Words</h2>
        <p>One sentence, then a few notes, for the terms the questions already use.</p>
      </div>
      {showTopics && <TopicBar topic={topic} setTopic={setTopic} />}
      {items.length === 0 && (
        <p className="empty">{showTopics && topic !== 'all' ? 'No words in this topic.' : 'Nothing in this track.'}</p>
      )}
      <div className="stack">
        {items.map((item) => (
          <article key={item.id} className="card">
            <p className="kicker">{kicker(item)}</p>
            <h3>{item.term}</h3>
            <Explain text={item.meaning} detail={item.detail} />
          </article>
        ))}
      </div>
    </section>
  )
}

function LatestList({ items, showTopics, topic, setTopic }) {
  return (
    <section>
      <div className="section-head">
        <h2>Spoken answers</h2>
        <p>
          Short answers you can practise out loud. Open one, close it, say it again.
          {showTopics && topic === 'all' ? ' The Java answers follow the same path as Practice.' : ''}
        </p>
      </div>
      {showTopics && <TopicBar topic={topic} setTopic={setTopic} />}
      {items.length === 0 && <p className="empty">Nothing in this track.</p>}
      <div className="stack">
        {items.map((item) => (
          <details key={item.id} className="card">
            <summary>
              <span className="kicker">{kicker(item)}</span>
              {item.prompt}
            </summary>
            <Explain text={item.answer} detail={item.detail} />
          </details>
        ))}
      </div>
    </section>
  )
}

function DrillList({ items, notes, setNotes, saved, setSaved, showTopics, topic, setTopic }) {
  const still = items.filter((item) => !saved[item.id]).length
  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Drills</h2>
          <p>
            Write the query or say the answer, then open the model. {still} of {items.length} still
            open. Drafts stay in this browser.
          </p>
        </div>
      </div>
      {showTopics && <TopicBar topic={topic} setTopic={setTopic} />}
      {items.length === 0 && (
        <p className="empty">{showTopics && topic !== 'all' ? 'No drills in this topic.' : 'Nothing in this track.'}</p>
      )}
      <div className="stack">
        {items.map((item) => (
          <DrillCard
            key={item.id}
            item={item}
            draft={notes[item.id] ?? ''}
            done={Boolean(saved[item.id])}
            onDraft={(value) => setNotes((current) => ({ ...current, [item.id]: value }))}
            onDone={() => setSaved((current) => ({ ...current, [item.id]: !current[item.id] }))}
          />
        ))}
      </div>
    </section>
  )
}

function DrillCard({ item, draft, done, onDraft, onDone, forceOpen = false }) {
  const [open, setOpen] = useState(forceOpen)
  const kind = item.kind === 'sql' ? 'Write the SQL' : item.kind === 'plan' ? 'Read the plan' : 'Say it'
  return (
    <article className="card">
      <p className="kicker">
        {label(item.track)}
        {item.scenario ? ' · scenario' : ''} · {kind}
        {done ? ' · marked' : ''}
      </p>
      <h3>{item.prompt}</h3>
      {item.schema && <pre className="code">{item.schema}</pre>}
      <textarea
        className="draft"
        value={draft}
        onChange={(event) => onDraft(event.target.value)}
        aria-label={item.prompt}
        spellCheck={item.kind === 'speak'}
        placeholder={item.kind === 'sql' ? 'Write the query here' : 'Say it in your own words, then compare'}
      />
      <div className="row-actions">
        <button type="button" className="text-btn" onClick={() => setOpen((value) => !value)}>
          {open ? 'Hide model answer' : 'Show model answer'}
        </button>
        <button type="button" className="text-btn" onClick={onDone}>
          {done ? 'Mark as open' : 'I can say this'}
        </button>
      </div>
      {open && (
        <>
          <pre className="code answer">{item.answer}</pre>
          <Explain text={item.why} detail={item.detail} />
        </>
      )}
    </article>
  )
}

function Mock({ pool, track, topic, run, setRun, best, setBest }) {
  useEffect(() => {
    if (!run || run.status !== 'live') return undefined
    const id = setInterval(() => {
      setRun((current) => {
        if (!current || current.status !== 'live') return current
        if (current.seconds <= 1) return { ...current, seconds: 0, status: 'done' }
        return { ...current, seconds: current.seconds - 1 }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [run?.status, setRun])

  useEffect(() => {
    if (!run || run.status !== 'done') return
    const marked = run.items.filter((item) => run.answers[item.id] !== undefined).length
    if (marked === 0 && run.seconds > 0) return
    const correct = run.items.filter((item) => run.answers[item.id] === item.answer).length
    const total = run.items.length
    setBest((current) => {
      if (!current) return { correct, total }
      const better = correct / total > current.correct / current.total
      const tie = correct / total === current.correct / current.total && correct > current.correct
      return better || tie ? { correct, total } : current
    })
  }, [run, setBest])

  const count = Math.min(10, pool.length)
  const minutes = Math.round((count * 72) / 60)

  const start = () => {
    const items = shuffle(pool).slice(0, count)
    setRun({
      items,
      answers: {},
      index: 0,
      seconds: count * 72,
      status: 'live',
      track,
    })
  }

  if (!run) {
    return (
      <section>
        <div className="section-head">
          <div>
            <h2>Mock</h2>
            <p>
              {count} question{count === 1 ? '' : 's'} from {focusLabel(track, topic)}.
              {' '}
              {minutes} minutes. Answers stay hidden until you submit. Unanswered counts as a miss.
              The clock pauses if you leave this tab.
            </p>
          </div>
        </div>
        {best && (
          <p className="callout">
            Best on this browser: {best.correct}/{best.total}
          </p>
        )}
        {count === 0 ? (
          <p className="empty">This track has no questions yet.</p>
        ) : (
          <button className="primary inline" type="button" onClick={start}>
            Start mock
          </button>
        )}
      </section>
    )
  }

  if (run.status === 'done') {
    const correct = run.items.filter((item) => run.answers[item.id] === item.answer).length
    const ordered = [...run.items].sort((a, b) => {
      const aWrong = run.answers[a.id] === a.answer ? 1 : 0
      const bWrong = run.answers[b.id] === b.answer ? 1 : 0
      return aWrong - bWrong
    })
    return (
      <section>
        <div className="section-head">
          <div>
            <h2>Mock result</h2>
            <p>
              {correct} of {run.items.length} correct. Misses are first. Run it again after you can
              say those explanations.
            </p>
          </div>
          <button type="button" className="text-btn" onClick={() => setRun(null)}>
            New mock
          </button>
        </div>
        <p className="score">
          {correct}/{run.items.length}
        </p>
        <div className="stack">
          {ordered.map((item, index) => (
            <McqCard
              key={item.id}
              item={item}
              number={index + 1}
              pick={run.answers[item.id]}
              mode="review"
              onPick={() => {}}
            />
          ))}
        </div>
      </section>
    )
  }

  const item = run.items[run.index]
  const marked = run.items.filter((question) => run.answers[question.id] !== undefined).length
  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Mock</h2>
          <p>
            {marked} of {run.items.length} marked · question {run.index + 1}
          </p>
        </div>
        <p className={run.seconds < 60 ? 'timer low' : 'timer'}>{clock(run.seconds)}</p>
      </div>
      <McqCard
        item={item}
        pick={run.answers[item.id]}
        mode="exam"
        onPick={(choice) =>
          setRun((current) => ({
            ...current,
            answers: { ...current.answers, [item.id]: choice },
          }))
        }
      />
      <div className="mock-nav">
        <button
          type="button"
          className="text-btn"
          disabled={run.index === 0}
          onClick={() => setRun((current) => ({ ...current, index: current.index - 1 }))}
        >
          Previous
        </button>
        <button type="button" className="text-btn" onClick={() => setRun((current) => ({ ...current, status: 'done' }))}>
          Submit
        </button>
        <button
          type="button"
          className="text-btn"
          disabled={run.index === run.items.length - 1}
          onClick={() => setRun((current) => ({ ...current, index: current.index + 1 }))}
        >
          Next
        </button>
      </div>
    </section>
  )
}

function Story({ track, notes, setNotes }) {
  const focus = tracks.find((item) => item.id === track)
  const filled = beats.filter((beat) => (notes[beat.id] ?? '').trim()).length
  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Project story</h2>
          <p>
            Five beats, about ninety seconds out loud. {filled} of {beats.length} filled. The notes
            stay in this browser.
            {focus ? ` Tell it about a ${focus.name} change if you have one.` : ''}
          </p>
        </div>
        <button
          type="button"
          className="text-btn"
          onClick={() =>
            setNotes((current) => {
              const next = { ...current }
              for (const beat of beats) delete next[beat.id]
              return next
            })
          }
        >
          Clear story
        </button>
      </div>
      <div className="stack">
        {beats.map((beat, index) => (
          <article key={beat.id} className="card">
            <p className="kicker">
              {index + 1} of {beats.length}
            </p>
            <h3>{beat.title}</h3>
            <p className="cue">{beat.hint}</p>
            <textarea
              className="note"
              value={notes[beat.id] ?? ''}
              onChange={(event) => setNotes((current) => ({ ...current, [beat.id]: event.target.value }))}
              placeholder={beat.cue}
              aria-label={beat.title}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function SearchResults({ words: foundWords, mcqs: foundMcqs, latest: foundLatest, drills: foundDrills, picks, setPicks, notes, setNotes, saved, setSaved }) {
  const empty = foundWords.length === 0 && foundMcqs.length === 0 && foundLatest.length === 0 && foundDrills.length === 0
  return (
    <section>
      <div className="section-head">
        <h2>Search</h2>
        <p>
          {foundWords.length} {foundWords.length === 1 ? 'word' : 'words'} · {foundMcqs.length} {foundMcqs.length === 1 ? 'question' : 'questions'} · {foundLatest.length} spoken · {foundDrills.length} {foundDrills.length === 1 ? 'drill' : 'drills'}
        </p>
      </div>
      {empty && <p className="empty">No match. Try a track word: vacuum, proxy, replica, record.</p>}
      <div className="stack">
        {foundWords.map((item) => (
          <article key={item.id} className="card">
            <p className="kicker">{kicker(item)}</p>
            <h3>{item.term}</h3>
            <Explain text={item.meaning} detail={item.detail} />
          </article>
        ))}
        {foundMcqs.map((item, index) => (
          <McqCard
            key={item.id}
            item={item}
            number={index + 1}
            pick={picks[item.id]}
            mode="check"
            onPick={(choice) => setPicks((current) => ({ ...current, [item.id]: choice }))}
          />
        ))}
        {foundDrills.map((item) => (
          <DrillCard
            key={item.id}
            item={item}
            draft={notes[item.id] ?? ''}
            done={Boolean(saved[item.id])}
            forceOpen
            onDraft={(value) => setNotes((current) => ({ ...current, [item.id]: value }))}
            onDone={() => setSaved((current) => ({ ...current, [item.id]: !current[item.id] }))}
          />
        ))}
        {foundLatest.map((item) => (
          <details key={item.id} className="card" open>
            <summary>
              <span className="kicker">{label(item.track)} · spoken</span>
              {item.prompt}
            </summary>
            <Explain text={item.answer} detail={item.detail} />
          </details>
        ))}
      </div>
    </section>
  )
}

function Explain({ text, detail }) {
  return (
    <div className="why">
      <p>{text}</p>
      {detail?.length > 0 && (
        <ul>
          {detail.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
