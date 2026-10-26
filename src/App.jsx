import { useMemo, useState } from 'react'
import { latest, mcqs, tracks } from './data'

const views = [
  { id: 'market', label: 'Market' },
  { id: 'practice', label: 'Easy MCQs' },
  { id: 'latest', label: 'Latest questions' },
]

function matches(query, parts) {
  if (!query) return true
  const hay = parts.join(' ').toLowerCase()
  return hay.includes(query)
}

export default function App() {
  const [view, setView] = useState('market')
  const [track, setTrack] = useState('all')
  const [query, setQuery] = useState('')
  const [picks, setPicks] = useState({})

  const needle = query.trim().toLowerCase()
  const searching = needle.length > 0

  const visibleMcqs = useMemo(
    () =>
      mcqs.filter(
        (item) =>
          (track === 'all' || item.track === track) &&
          matches(needle, [item.prompt, item.why, ...item.options, item.track]),
      ),
    [needle, track],
  )

  const visibleLatest = useMemo(
    () =>
      latest.filter(
        (item) =>
          (track === 'all' || item.track === track) &&
          matches(needle, [item.prompt, item.answer, item.track]),
      ),
    [needle, track],
  )

  const answered = visibleMcqs.filter((item) => picks[item.id] !== undefined)
  const correct = answered.filter((item) => picks[item.id] === item.answer).length

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <p className="eyebrow">October 2026</p>
          <h1>Desk Round</h1>
          <p className="lede">
            A prep desk for Java, React, MySQL, and PostgreSQL interviews. Easy MCQs, the questions
            that changed this year, and a market brief you can say out loud.
          </p>
        </div>
        <label className="search">
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try virtual threads, skip scan, replica…"
          />
        </label>
      </header>

      <div className="layout">
        <aside>
          <p className="side-label">Track</p>
          <button
            className={track === 'all' ? 'track on' : 'track'}
            onClick={() => setTrack('all')}
            type="button"
          >
            <strong>All four</strong>
            <span>32 MCQs and 16 short answers</span>
          </button>
          {tracks.map((item) => (
            <button
              key={item.id}
              className={track === item.id ? 'track on' : 'track'}
              onClick={() => setTrack(item.id)}
              type="button"
            >
              <strong>{item.name}</strong>
              <span>{item.version}</span>
            </button>
          ))}
        </aside>

        <main>
          <nav className="views" aria-label="Sections">
            {views.map((item) => (
              <button
                key={item.id}
                className={view === item.id && !searching ? 'on' : ''}
                onClick={() => {
                  setQuery('')
                  setView(item.id)
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {searching ? (
            <SearchResults mcqs={visibleMcqs} latest={visibleLatest} picks={picks} setPicks={setPicks} />
          ) : view === 'market' ? (
            <Market track={track} />
          ) : view === 'practice' ? (
            <Practice
              items={visibleMcqs}
              picks={picks}
              setPicks={setPicks}
              correct={correct}
              onReset={() => setPicks({})}
            />
          ) : (
            <LatestList items={visibleLatest} />
          )}
        </main>
      </div>

      <footer>
        <p>
          Version notes follow public releases as of October 2026:{' '}
          <a href="https://openjdk.org/projects/jdk/25/">JDK 25</a>,{' '}
          <a href="https://blogs.oracle.com/mysql/mysql-october-2026-ga-releases-now-available">
            MySQL October 2026
          </a>
          , and <a href="https://www.postgresql.org/docs/18/release-18.html">PostgreSQL 18</a>.
          Salary bands are rough India product-company ranges, not offers.
        </p>
      </footer>
    </div>
  )
}

function Market({ track }) {
  const focus = tracks.find((item) => item.id === track)
  return (
    <section>
      <h2>What interviews for this stack look like</h2>
      <p className="intro">
        Java and React are still the default full-stack screen. MySQL is the database many existing
        products already run. Postgres is what a lot of new services ask you to defend. The loop
        rarely cares that you memorised every flag. It cares that you can read a plan, explain a
        re-render, and say which JDK is actually LTS.
      </p>
      {focus && <p className="callout">{focus.line}</p>}

      <div className="grid">
        <article>
          <h3>The loop</h3>
          <ol>
            <li>Recruiter screen: stack, years, and one project you can narrate.</li>
            <li>Easy test: Java basics, SQL, or a short React quiz. This is the MCQ desk.</li>
            <li>Live work: a bug, a query, or a small component. Talk while you type.</li>
            <li>Deep dive: virtual threads, rendering, or an EXPLAIN you disagree with.</li>
            <li>Hiring manager: tradeoffs, not a second trivia round.</li>
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
            <li>React interviews start from rendering and React 19 forms, not class components.</li>
            <li>MySQL 8.0 is end of life. Say “replica”, not “slave”.</li>
            <li>Postgres 18 made async I/O, skip scan, and uuidv7 fair game.</li>
          </ul>
        </article>
        <article>
          <h3>Seven-day pass</h3>
          <ol>
            <li>Java: collections, exceptions, records.</li>
            <li>Java: virtual threads and one Spring transaction trap.</li>
            <li>React: state, effects, keys.</li>
            <li>React: memo, context, one React 19 action.</li>
            <li>MySQL: InnoDB, indexes, EXPLAIN.</li>
            <li>Postgres: MVCC, vacuum, EXPLAIN ANALYZE.</li>
            <li>Say the version table below without notes.</li>
          </ol>
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

function Practice({ items, picks, setPicks, correct, onReset }) {
  return (
    <section>
      <div className="section-head">
        <h2>Easy MCQs</h2>
        <p>
          {correct} correct of {items.filter((item) => picks[item.id] !== undefined).length} answered
          · {items.length} in this set
        </p>
        <button type="button" className="text-btn" onClick={onReset}>
          Clear answers
        </button>
      </div>
      {items.length === 0 && <p className="empty">Nothing in this track.</p>}
      <div className="stack">
        {items.map((item, index) => (
          <McqCard
            key={item.id}
            item={item}
            number={index + 1}
            pick={picks[item.id]}
            onPick={(choice) => setPicks((current) => ({ ...current, [item.id]: choice }))}
          />
        ))}
      </div>
    </section>
  )
}

function McqCard({ item, number, pick, onPick }) {
  const chosen = pick !== undefined
  return (
    <article className="card">
      <p className="kicker">
        {label(item.track)} · easy · {number}
      </p>
      <h3>{item.prompt}</h3>
      <div className="options">
        {item.options.map((option, index) => {
          let tone = ''
          if (chosen && index === item.answer) tone = 'good'
          else if (chosen && index === pick) tone = 'bad'
          return (
            <button key={option} type="button" className={tone} disabled={chosen} onClick={() => onPick(index)}>
              {option}
            </button>
          )
        })}
      </div>
      {chosen && <p className="why">{item.why}</p>}
    </article>
  )
}

function LatestList({ items }) {
  return (
    <section>
      <div className="section-head">
        <h2>Latest questions</h2>
        <p>Short answers you can practise out loud. Open one, close it, say it again.</p>
      </div>
      {items.length === 0 && <p className="empty">Nothing in this track.</p>}
      <div className="stack">
        {items.map((item) => (
          <details key={item.id} className="card">
            <summary>
              <span className="kicker">{label(item.track)}</span>
              {item.prompt}
            </summary>
            <p className="why">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function SearchResults({ mcqs: foundMcqs, latest: foundLatest, picks, setPicks }) {
  const empty = foundMcqs.length === 0 && foundLatest.length === 0
  return (
    <section>
      <div className="section-head">
        <h2>Search</h2>
        <p>
          {foundMcqs.length} MCQs · {foundLatest.length} short answers
        </p>
      </div>
      {empty && <p className="empty">No match. Try a track word: vacuum, key, replica, record.</p>}
      <div className="stack">
        {foundMcqs.map((item, index) => (
          <McqCard
            key={item.id}
            item={item}
            number={index + 1}
            pick={picks[item.id]}
            onPick={(choice) => setPicks((current) => ({ ...current, [item.id]: choice }))}
          />
        ))}
        {foundLatest.map((item) => (
          <details key={item.id} className="card" open>
            <summary>
              <span className="kicker">{label(item.track)} · latest</span>
              {item.prompt}
            </summary>
            <p className="why">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function label(id) {
  return tracks.find((item) => item.id === id)?.name ?? id
}
