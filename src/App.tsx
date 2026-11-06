
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  Download,
  FileImage,
  Heart,
  Layers3,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  WandSparkles
} from 'lucide-react'
import {
  examples,
  renderDiagram,
  starter,
  themes,
  validate,
  type ThemeId
} from './diagram'

function App() {
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem('nd-code') || starter
    } catch {
      return starter
    }
  })

  const [theme, setTheme] = useState<ThemeId>(() => {
    try {
      const t = localStorage.getItem('nd-theme')
      return t && t in themes ? t as ThemeId : 'paper'
    } catch {
      return 'paper'
    }
  })

  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [totalExports, setTotalExports] = useState<number | null>(null)
  const [showEditor, setShowEditor] = useState(true)
  const [example, setExample] = useState('Flowchart')

  const preview = useRef<HTMLDivElement>(null)
  const sequence = useRef(0)

  const notify = (s: string) => {
    setToast(s)
    window.setTimeout(() => setToast(''), 2400)
  }

  useEffect(() => {
    let cancelled = false

    const loadStats = async () => {
      try {
        const response = await fetch('/api/stats', {
          cache: 'no-store'
        })

        if (!response.ok) return

        const data = await response.json() as {
          totalExports?: number
        }

        if (
          !cancelled &&
          typeof data.totalExports === 'number' &&
          Number.isFinite(data.totalExports)
        ) {
          setTotalExports(data.totalExports)
        }
      } catch {
        // Statistics are optional; the editor remains usable.
      }
    }

    void loadStats()

    return () => {
      cancelled = true
    }
  }, [])

  const recordExport = async (format: 'svg' | 'png') => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format })
      })

      if (!response.ok) return

      const stats = await fetch('/api/stats', {
        cache: 'no-store'
      })

      if (!stats.ok) return

      const data = await stats.json() as {
        totalExports?: number
      }

      if (
        typeof data.totalExports === 'number' &&
        Number.isFinite(data.totalExports)
      ) {
        setTotalExports(data.totalExports)
      }
    } catch {
      // A statistics error must not interrupt an export.
    }
  }

  const render = useCallback(async (src: string, t: ThemeId) => {
    const id = ++sequence.current
    const issue = validate(src)

    if (issue) {
      setError(issue)
      setSvg('')
      return
    }

    setBusy(true)

    try {
      const result = await renderDiagram(src, t)

      if (id === sequence.current) {
        setSvg(result)
        setError('')
      }
    } catch (e) {
      if (id === sequence.current) {
        setSvg('')
        setError(
          e instanceof Error
            ? e.message
            : 'Check your Mermaid syntax.'
        )
      }
    } finally {
      if (id === sequence.current) {
        setBusy(false)
      }
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('nd-code', code)
      localStorage.setItem('nd-theme', theme)
    } catch {
      // Local saving may be unavailable in some browsers.
    }

    const timer = window.setTimeout(
      () => void render(code, theme),
      240
    )

    return () => window.clearTimeout(timer)
  }, [code, theme, render])

  useEffect(() => {
    if (preview.current) {
      preview.current.innerHTML = svg
    }
  }, [svg])

  const copy = async (s: string, label: string) => {
    try {
      await navigator.clipboard.writeText(s)
      notify(label)
    } catch {
      notify('Clipboard access unavailable')
    }
  }

  const save = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = name

    document.body.append(a)
    a.click()
    a.remove()

    setTimeout(() => URL.revokeObjectURL(url), 900)
  }

  const exportSvg = () => {
    if (!svg) return

    try {
      save(
        new Blob([svg], { type: 'image/svg+xml' }),
        'neatdraw.svg'
      )

      notify('SVG export ready')
      void recordExport('svg')
    } catch {
      notify('SVG export failed')
    }
  }

  const png = async () => {
    if (!svg) return

    try {
      const url = URL.createObjectURL(
        new Blob([svg], { type: 'image/svg+xml' })
      )

      const im = new Image()
      im.src = url
      await im.decode()

      const vb = preview.current
        ?.querySelector('svg')
        ?.getAttribute('viewBox')
        ?.split(/[ ,]+/)
        .map(Number)

      const w = vb?.[2] || im.naturalWidth || 1000
      const h = vb?.[3] || im.naturalHeight || 700
      const s = Math.min(3, 2400 / Math.max(w, h))

      const c = document.createElement('canvas')
      c.width = w * s
      c.height = h * s

      const ctx = c.getContext('2d')

      if (!ctx) {
        URL.revokeObjectURL(url)
        throw Error('Canvas unavailable')
      }

      ctx.fillStyle = themes[theme].bg
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(im, 0, 0, c.width, c.height)

      URL.revokeObjectURL(url)

      const blob = await new Promise<Blob>((resolve, reject) => {
        c.toBlob(
          result => result
            ? resolve(result)
            : reject(Error('PNG conversion failed')),
          'image/png'
        )
      })

      save(blob, 'neatdraw.png')
      notify('PNG export ready')
      void recordExport('png')
    } catch (e) {
      notify(
        e instanceof Error
          ? e.message
          : 'PNG export failed'
      )
    }
  }

  return (
    <div className="shell" id="top">
      <header>
        <a className="brand" href="#top">
          <span className="mark"><Layers3 size={18} /></span>
          neatdraw<span className="period">.</span>
        </a>

        <nav>
          <a href="#how">How it works</a>
          <a href="#themes">Themes</a>
        </nav>

        <a className="navbutton" href="#studio">
          Try the editor <ArrowRight size={15} />
        </a>
      </header>

      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">
              <i /> A LITTLE POLISH FOR MERMAID
            </div>

            <h1>
              Your diagrams,<br />
              <span>a little more</span> <em>neat.</em>
            </h1>

            <p className="lede">
              Good ideas deserve good diagrams. Give your Mermaid charts
              a thoughtful finish, then take them wherever they need to go.
            </p>

            <div className="actions">
              <a className="primary" href="#studio">
                Make something neat <ArrowRight size={16} />
              </a>
              <span>
                <LockKeyhole size={14} /> No account. No upload.
              </span>
            </div>

            <div className="scribble">
              ✳ For flowcharts, maps and moments in between.
            </div>
          </div>

          <div className="art">
            <div className="paper">
              <div className="paperhead">
                <span>● ● ●</span>
                <small>untitled-flow.mmd</small>
                <b>PAPER / 01</b>
              </div>

              <div className="flow">
                <div className="node">A good idea</div>
                <div className="vline" />
                <div className="node question">What if?</div>

                <div className="branches">
                  <div>
                    <small>YES</small>
                    <div className="node">Make it real</div>
                  </div>
                  <div>
                    <small>NOT YET</small>
                    <div className="node later">Keep thinking</div>
                  </div>
                </div>

                <div className="vline short" />
                <div className="node end">Something neat ✳</div>
              </div>

              <div className="paperfoot">
                FIG. 01 <span>A thought, made visible.</span>
              </div>
            </div>

            <div className="float f1">
              <Sparkles size={14} /> Four thoughtful themes
            </div>

            <div className="float f2">
              <FileImage size={14} /> SVG + PNG exports
            </div>

            <div className="handnote">made to make sense ↗</div>
          </div>
        </section>

        <section className="milestone" aria-label="Neatdraw export milestone">
          <div className="milestone-copy">
            <div className="eyebrow">
              <i /> A LITTLE NEATDRAW MILESTONE
            </div>

            <h2>A few diagrams, made neater.</h2>

            <p>
              Every export adds a little something to our shared count.
            </p>
          </div>

          <div className="milestone-count">
            <strong>
              {totalExports === null
                ? '—'
                : totalExports.toLocaleString()}
            </strong>

            <span>export actions recorded</span>
          </div>
        </section>

        <section className="trust">
          <div>
            <LockKeyhole />
            <b>Private by default</b>
            <small>Your code stays in your browser</small>
          </div>

          <div>
            <WandSparkles />
            <b>Easy on the eyes</b>
            <small>Four considered color themes</small>
          </div>

          <div>
            <Download />
            <b>Ready to take away</b>
            <small>Export clean SVG or PNG</small>
          </div>
        </section>

        <section className="studio-section" id="studio">
          <div className="secthead">
            <div>
              <div className="eyebrow">THE LITTLE WORKSHOP</div>
              <h2>Make it look <em>right.</em></h2>
            </div>

            <p>
              Paste your Mermaid code, pick a mood, and see it come together.
            </p>
          </div>

          <div className="workshop">
            <div className="toolbar">
              <b>
                <i /> Untitled diagram <small>Saved in this browser</small>
              </b>

              <div>
                <button
                  onClick={() => {
                    setCode(starter)
                    setTheme('paper')
                    setExample('Flowchart')
                    notify('Starter restored')
                  }}
                >
                  <RotateCcw /> Reset
                </button>

                <button onClick={() => void copy(code, 'Code copied')}>
                  <Copy /> Copy code
                </button>
              </div>
            </div>

            <div className={`workbody ${showEditor ? '' : 'single'}`}>
              {showEditor && (
                <div className="editor">
                  <div className="panehead">
                    <span><Code2 /> YOUR MERMAID CODE</span>
                    <button onClick={() => setShowEditor(false)}>
                      Hide
                    </button>
                  </div>

                  <div className="examples">
                    <label>START WITH</label>

                    {examples.map(x => (
                      <button
                        className={example === x.label ? 'active' : ''}
                        key={x.label}
                        onClick={() => {
                          setCode(x.code)
                          setExample(x.label)
                        }}
                      >
                        {x.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    aria-label="Mermaid source"
                    spellCheck={false}
                    value={code}
                    onChange={e => {
                      setCode(e.target.value)
                      setExample('')
                    }}
                  />

                  <div className="editorfoot">
                    {code.length.toLocaleString()} / 50,000 characters

                    <button onClick={() => void copy(code, 'Code copied')}>
                      <Copy /> Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="preview">
                <div className="panehead">
                  <span>◫ LIVE PREVIEW</span>
                  <span className="status">
                    {busy
                      ? 'Rendering…'
                      : error
                        ? 'Needs a look'
                        : '● Preview'}
                  </span>
                </div>

                {!showEditor && (
                  <button
                    className="show"
                    onClick={() => setShowEditor(true)}
                  >
                    Show code editor
                  </button>
                )}

                <div className={`canvas ${theme}`}>
                  {error ? (
                    <div className="error">
                      <b>Not quite there yet</b>
                      <p>{error}</p>
                      <small>Check the Mermaid syntax and try again.</small>
                    </div>
                  ) : svg ? (
                    <div className="output" ref={preview} />
                  ) : (
                    <span className="muted">
                      Putting the pieces together…
                    </span>
                  )}
                </div>

                <div className="previewfoot">
                  <div className="swatches">
                    <label>THEME</label>

                    {(Object.keys(themes) as ThemeId[]).map(id => (
                      <button
                        key={id}
                        aria-label={themes[id].name}
                        title={themes[id].name}
                        className={theme === id ? 'chosen' : ''}
                        onClick={() => setTheme(id)}
                      >
                        <i style={{ background: themes[id].bg }} />
                        <i style={{
                          background: themes[id].variables.primaryColor
                        }} />
                      </button>
                    ))}
                  </div>

                  <div className="exports">
                    <button
                      disabled={!svg}
                      onClick={() => void copy(svg, 'SVG copied')}
                    >
                      <Copy /> SVG
                    </button>

                    <button
                      disabled={!svg}
                      className="green"
                      onClick={() => void png()}
                    >
                      <FileImage /> PNG
                    </button>

                    <button
                      disabled={!svg}
                      onClick={exportSvg}
                    >
                      <Download /> Save SVG
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="workbottom">
              <span>
                <LockKeyhole /> Rendering happens locally in your browser.
              </span>

              <span>Mermaid syntax · No sign-in needed</span>
            </div>
          </div>
        </section>

        <section className="themes" id="themes">
          <div className="secthead">
            <div>
              <div className="eyebrow">A CHANGE OF MOOD</div>
              <h2>Four ways to <em>feel neat.</em></h2>
            </div>

            <p>
              One diagram, a few different personalities. Pick the one
              that fits the room.
            </p>
          </div>

          <div className="themegrid">
            {(Object.keys(themes) as ThemeId[]).map((id, i) => (
              <button
                className={`theme-card ${id}`}
                key={id}
                onClick={() => {
                  setTheme(id)
                  document.querySelector('#studio')?.scrollIntoView({
                    behavior: 'smooth'
                  })
                }}
              >
                <div className="minipreview">
                  <span className="mininode" />
                  <i />
                  <span className="mininode wide" />
                  <i />
                  <span className="mininode bottom" />
                  <small>0{i + 1}</small>
                </div>

                <div>
                  <b>{themes[id].name}</b>
                  <small>{themes[id].desc}</small>
                  <ArrowRight />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="how" id="how">
          <div>
            <div className="eyebrow">NO BIG LEARNING CURVE</div>
            <h2>
              Three small steps.<br />
              <em>One clearer idea.</em>
            </h2>
            <p>
              Here for the finishing touches, not another thing to figure out.
            </p>
          </div>

          <div className="steps">
            {[
              ['01', 'Bring your code', 'Paste Mermaid or start with an example.'],
              ['02', 'Find your look', 'Try a theme. Preview follows as you edit.'],
              ['03', 'Take it with you', 'Copy or save SVG and PNG exports.']
            ].map(s => (
              <article key={s[0]}>
                <small>{s[0]}</small>
                <div className="stepicon"><WandSparkles /></div>
                <b>{s[1]}</b>
                <p>{s[2]}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="closing">
          <div className="eyebrow">THAT'S THE WHOLE IDEA</div>
          <h2>Go make something <em>neat.</em></h2>
          <p>Your next clear thought is a few lines of Mermaid away.</p>

          <a className="primary" href="#studio">
            Open the workshop <ArrowRight />
          </a>

          <small>Free to use · Runs in your browser</small>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <span className="mark"><Layers3 /></span>
              neatdraw<span className="period">.</span>
            </a>

            <p>A little polish for Mermaid diagrams.</p>
            <small>Made for clearer thinking <Heart /></small>
          </div>

          <div className="footer-links">
            <div>
              <b>Make</b>
              <a href="#studio">Workshop</a>
              <a href="#themes">Themes</a>
            </div>

            <div>
              <b>Discover</b>
              <a href="#how">How it works</a>
              <a href="#top">Back to top ↑</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Neatdraw</span>
          <span>Mermaid diagrams, made a little neater.</span>
        </div>
      </footer>

      {toast && (
        <div className="toast">
          <Check />{toast}
        </div>
      )}
    </div>
  )
}

export default App
