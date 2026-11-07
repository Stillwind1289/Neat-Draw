import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight, Check, Code2, Copy, Download, FileImage, Heart,
  Layers3, LockKeyhole, RotateCcw, Sparkles, WandSparkles,
  Palette, Trash2, Save, Pencil, X
} from 'lucide-react'
import {
  examples, renderDiagram, starter, themes, validate,
  defaultCustomStyle, fontOptions, curveOptions, nodeShapeOptions,
  prepareSvgExport,
  type ThemeId, type CustomStyle
} from './diagram'

interface SavedPalette {
  id: string
  name: string
  style: CustomStyle
}

const MAX_PALETTES = 20

function styleFromTheme(theme: ThemeId): CustomStyle {
  const v = themes[theme].variables
  return {
    ...defaultCustomStyle,
    background: v.background,
    primaryColor: v.primaryColor,
    primaryTextColor: v.primaryTextColor,
    primaryBorderColor: v.primaryBorderColor,
    lineColor: v.lineColor,
    secondaryColor: v.secondaryColor,
    tertiaryColor: v.tertiaryColor,
    fontFamily: v.fontFamily,
    fontSize: v.fontSize
  }
}

function App() {
  const [code, setCode] = useState(() => {
    try { return localStorage.getItem('nd-code') || starter }
    catch { return starter }
  })

  const [theme, setTheme] = useState<ThemeId>(() => {
    try {
      const t = localStorage.getItem('nd-theme')
      return t && t in themes ? t as ThemeId : 'paper'
    } catch { return 'paper' }
  })

  const [customEnabled, setCustomEnabled] = useState(false)

  const [customStyle, setCustomStyle] = useState<CustomStyle>(() => {
    try {
      const saved = localStorage.getItem('nd-custom-style')
      return saved
        ? { ...defaultCustomStyle, ...JSON.parse(saved) }
        : defaultCustomStyle
    } catch { return defaultCustomStyle }
  })

  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>(() => {
    try {
      const saved = localStorage.getItem('nd-palettes')
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed.slice(0, MAX_PALETTES) : []
    } catch { return [] }
  })

  const [paletteName, setPaletteName] = useState('')
  const [renameId, setRenameId] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [pngScale, setPngScale] = useState(2)
  const [transparentPng, setTransparentPng] = useState(false)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [totalExports, setTotalExports] = useState<number | null>(null)
  const [showEditor, setShowEditor] = useState(true)
  const [example, setExample] = useState('Flowchart')

  const preview = useRef<HTMLDivElement>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const sequence = useRef(0)

  const notify = (s: string) => {
    setToast(s)
    window.setTimeout(() => setToast(''), 2400)
  }

  useEffect(() => {
    try {
      localStorage.setItem('nd-code', code)
      localStorage.setItem('nd-theme', theme)
      localStorage.setItem('nd-custom-style', JSON.stringify(customStyle))
      localStorage.setItem('nd-palettes', JSON.stringify(savedPalettes))
    } catch {
      // Local saving may be unavailable in some browsers.
    }
  }, [code, theme, customStyle, savedPalettes])

  useEffect(() => {
    let cancelled = false

    const loadStats = async () => {
      try {
        const response = await fetch('/api/stats', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json() as { totalExports?: number }

        if (
          !cancelled &&
          typeof data.totalExports === 'number' &&
          Number.isFinite(data.totalExports)
        ) setTotalExports(data.totalExports)
      } catch {
        // Statistics are optional.
      }
    }

    void loadStats()
    return () => { cancelled = true }
  }, [])

  const recordExport = async (format: 'svg' | 'png') => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      })
      if (!response.ok) return

      const stats = await fetch('/api/stats', { cache: 'no-store' })
      if (!stats.ok) return

      const data = await stats.json() as { totalExports?: number }
      if (
        typeof data.totalExports === 'number' &&
        Number.isFinite(data.totalExports)
      ) setTotalExports(data.totalExports)
    } catch {
      // A statistics error must not interrupt an export.
    }
  }

  const render = useCallback(async (
    src: string,
    t: ThemeId,
    style: CustomStyle | undefined
  ) => {
    const id = ++sequence.current
    const issue = validate(src)

    if (issue) {
      setError(issue)
      setSvg('')
      return
    }

    setBusy(true)

    try {
      const result = await renderDiagram(src, t, style)
      if (id === sequence.current) {
        setSvg(result)
        setError('')
      }
    } catch (e) {
      if (id === sequence.current) {
        setSvg('')
        setError(e instanceof Error ? e.message : 'Check your Mermaid syntax.')
      }
    } finally {
      if (id === sequence.current) setBusy(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(
      () => void render(code, theme, customEnabled ? customStyle : undefined),
      240
    )
    return () => window.clearTimeout(timer)
  }, [code, theme, customEnabled, customStyle, render])

  useEffect(() => {
    if (preview.current) preview.current.innerHTML = svg
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

  const activeStyle = customEnabled
    ? customStyle
    : styleFromTheme(theme)

  const exportSvg = () => {
    if (!svg) return

    try {
      const prepared = prepareSvgExport(
        svg,
        activeStyle.background,
        activeStyle.canvasPadding ?? 28,
        false
      )

      save(
        new Blob([prepared], { type: 'image/svg+xml' }),
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

    let url = ''

    try {
      const prepared = prepareSvgExport(
        svg,
        activeStyle.background,
        activeStyle.canvasPadding ?? 28,
        transparentPng
      )

      url = URL.createObjectURL(
        new Blob([prepared], { type: 'image/svg+xml' })
      )

      const im = new Image()
      im.src = url
      await im.decode()

      const vb = new DOMParser()
        .parseFromString(prepared, 'image/svg+xml')
        .documentElement
        .getAttribute('viewBox')
        ?.split(/[ ,]+/)
        .map(Number)

      const w = vb?.[2] || im.naturalWidth || 1000
      const h = vb?.[3] || im.naturalHeight || 700
      const scale = pngScale

      const c = document.createElement('canvas')
      c.width = Math.round(w * scale)
      c.height = Math.round(h * scale)

      const ctx = c.getContext('2d')
      if (!ctx) throw Error('Canvas unavailable')

      ctx.drawImage(im, 0, 0, c.width, c.height)

      const blob = await new Promise<Blob>((resolve, reject) => {
        c.toBlob(
          result => result
            ? resolve(result)
            : reject(Error('PNG conversion failed')),
          'image/png'
        )
      })

      save(blob, 'neatdraw.png')
      notify(`PNG export ready · ${scale}×`)
      void recordExport('png')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'PNG export failed')
    } finally {
      if (url) URL.revokeObjectURL(url)
    }
  }

  const updateStyle = <K extends keyof CustomStyle>(
    key: K,
    value: CustomStyle[K]
  ) => {
    setCustomStyle(current => ({ ...current, [key]: value }))
  }

  const chooseTheme = (id: ThemeId) => {
    setTheme(id)
    setCustomStyle(styleFromTheme(id))
    setCustomEnabled(false)
  }

  const savePalette = () => {
    const name = paletteName.trim()

    if (!name) {
      notify('Give your palette a name first')
      return
    }
    if (savedPalettes.length >= MAX_PALETTES) {
      notify(`You can save up to ${MAX_PALETTES} palettes`)
      return
    }

    const palette: SavedPalette = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.slice(0, 30),
      style: { ...customStyle }
    }

    setSavedPalettes(current => [...current, palette])
    setPaletteName('')
    notify('Palette saved')
  }

  const applyPalette = (palette: SavedPalette) => {
    setCustomStyle({ ...defaultCustomStyle, ...palette.style })
    setCustomEnabled(true)
    notify(`Applied ${palette.name}`)
  }

  const deletePalette = (id: string) => {
    setSavedPalettes(current => current.filter(p => p.id !== id))
    notify('Palette deleted')
  }

  const startRename = (palette: SavedPalette) => {
    setRenameId(palette.id)
    setRenameValue(palette.name)
  }

  const finishRename = () => {
    const name = renameValue.trim()
    if (!name) {
      notify('Enter a palette name')
      return
    }

    setSavedPalettes(current => current.map(p =>
      p.id === renameId ? { ...p, name: name.slice(0, 30) } : p
    ))
    setRenameId('')
    setRenameValue('')
    notify('Palette renamed')
  }

  const duplicatePalette = (palette: SavedPalette) => {
    if (savedPalettes.length >= MAX_PALETTES) {
      notify(`You can save up to ${MAX_PALETTES} palettes`)
      return
    }

    setSavedPalettes(current => [...current, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${palette.name} copy`.slice(0, 30),
      style: { ...palette.style }
    }])
    notify('Palette duplicated')
  }

  const exportPalettes = () => {
    if (!savedPalettes.length) {
      notify('There are no palettes to export')
      return
    }

    const data = {
      format: 'neatdraw-presets',
      version: 1,
      palettes: savedPalettes
    }

    save(
      new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      }),
      'neatdraw-presets.json'
    )
    notify('Presets exported')
  }

  const importPalettes = async (file?: File) => {
    if (!file) return

    try {
      const parsed = JSON.parse(await file.text())
      const incoming = Array.isArray(parsed)
        ? parsed
        : parsed?.palettes

      if (!Array.isArray(incoming)) {
        throw Error('This file does not contain Neatdraw palettes.')
      }

      const valid = incoming.filter((p: any) =>
        p &&
        typeof p.name === 'string' &&
        p.style &&
        typeof p.style === 'object' &&
        typeof p.style.background === 'string' &&
        typeof p.style.primaryColor === 'string' &&
        typeof p.style.primaryTextColor === 'string' &&
        typeof p.style.primaryBorderColor === 'string' &&
        typeof p.style.lineColor === 'string' &&
        typeof p.style.fontFamily === 'string' &&
        typeof p.style.fontSize === 'string'
      )

      if (!valid.length) {
        throw Error('No valid Neatdraw palettes were found in that file.')
      }

      const additions: SavedPalette[] = valid
        .slice(0, MAX_PALETTES)
        .map((p: any) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: p.name.slice(0, 30),
          style: { ...defaultCustomStyle, ...p.style }
        }))

      setSavedPalettes(current => {
        const room = Math.max(0, MAX_PALETTES - current.length)
        return [...current, ...additions.slice(0, room)]
      })

      const room = Math.max(0, MAX_PALETTES - savedPalettes.length)
      const added = Math.min(room, additions.length)
      notify(added ? `${added} palette(s) imported` : 'Your palette list is full')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not import that file')
    } finally {
      if (importInput.current) importInput.current.value = ''
    }
  }

  const diagramHeader = code.trim().match(
    /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|xychart(?:-beta)?|sankey-beta|block-beta)\b/im
  )

  const diagramType = diagramHeader?.[1]?.toLowerCase() ?? ''
  const isFlowchart = diagramType === 'flowchart' || diagramType === 'graph'

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
            <div className="eyebrow"><i /> A LITTLE POLISH FOR MERMAID</div>
            <h1>Your diagrams,<br /><span>a little more</span> <em>neat.</em></h1>
            <p className="lede">
              Good ideas deserve good diagrams. Give your Mermaid charts
              a thoughtful finish, then take them wherever they need to go.
            </p>
            <div className="actions">
              <a className="primary" href="#studio">
                Make something neat <ArrowRight size={16} />
              </a>
              <span><LockKeyhole size={14} /> No account. No upload.</span>
            </div>
            <div className="scribble">✳ For flowcharts, maps and moments in between.</div>
          </div>

          <div className="art">
            <div className="paper">
              <div className="paperhead">
                <span>● ● ●</span><small>untitled-flow.mmd</small><b>PAPER / 01</b>
              </div>
              <div className="flow">
                <div className="node">A good idea</div>
                <div className="vline" />
                <div className="node question">What if?</div>
                <div className="branches">
                  <div><small>YES</small><div className="node">Make it real</div></div>
                  <div><small>NOT YET</small><div className="node later">Keep thinking</div></div>
                </div>
                <div className="vline short" />
                <div className="node end">Something neat ✳</div>
              </div>
              <div className="paperfoot">FIG. 01 <span>A thought, made visible.</span></div>
            </div>
            <div className="float f1"><Sparkles size={14} /> Four thoughtful themes</div>
            <div className="float f2"><FileImage size={14} /> SVG + PNG exports</div>
            <div className="handnote">made to make sense ↗</div>
          </div>
        </section>

        <section className="milestone" aria-label="Neatdraw export milestone">
          <div className="milestone-copy">
            <div className="eyebrow"><i /> A LITTLE NEATDRAW MILESTONE</div>
            <h2>A few diagrams, made neater.</h2>
            <p>Every export adds a little something to our shared count.</p>
          </div>
          <div className="milestone-count">
            <strong>{totalExports === null ? '—' : totalExports.toLocaleString()}</strong>
            <span>export actions recorded</span>
          </div>
        </section>

        <section className="trust">
          <div><LockKeyhole /><b>Private by default</b><small>Your code stays in your browser</small></div>
          <div><WandSparkles /><b>Easy on the eyes</b><small>Four considered color themes</small></div>
          <div><Download /><b>Ready to take away</b><small>Export clean SVG or PNG</small></div>
        </section>

        <section className="studio-section" id="studio">
          <div className="secthead">
            <div><div className="eyebrow">THE LITTLE WORKSHOP</div><h2>Make it look <em>right.</em></h2></div>
            <p>Paste your Mermaid code, pick a mood, and see it come together.</p>
          </div>

          <div className="workshop">
            <div className="toolbar">
              <b><i /> Untitled diagram <small>Saved in this browser</small></b>
              <div>
                <button onClick={() => {
                  setCode(starter)
                  chooseTheme('paper')
                  setExample('Flowchart')
                  notify('Starter restored')
                }}><RotateCcw /> Reset</button>
                <button onClick={() => void copy(code, 'Code copied')}><Copy /> Copy code</button>
              </div>
            </div>

            <div className={`workbody ${showEditor ? '' : 'single'}`}>
              {showEditor && (
                <div className="editor">
                  <div className="panehead">
                    <span><Code2 /> YOUR MERMAID CODE</span>
                    <button onClick={() => setShowEditor(false)}>Hide</button>
                  </div>
                  <div className="examples">
                    <label>START WITH</label>
                    {examples.map(x => (
                      <button
                        className={example === x.label ? 'active' : ''}
                        key={x.label}
                        onClick={() => { setCode(x.code); setExample(x.label) }}
                      >{x.label}</button>
                    ))}
                  </div>
                  <textarea
                    aria-label="Mermaid source"
                    spellCheck={false}
                    value={code}
                    onChange={e => { setCode(e.target.value); setExample('') }}
                  />
                  <div className="editorfoot">
                    {code.length.toLocaleString()} / 50,000 characters
                    <button onClick={() => void copy(code, 'Code copied')}><Copy /> Copy</button>
                  </div>
                </div>
              )}

              <div className="preview">
                <div className="panehead">
                  <span>◫ LIVE PREVIEW</span>
                  <span className="status">
                    {busy ? 'Rendering…' : error ? 'Needs a look' : '● Preview'}
                  </span>
                </div>
                {!showEditor && (
                  <button className="show" onClick={() => setShowEditor(true)}>
                    Show code editor
                  </button>
                )}
                <div
                  className={`canvas ${theme}`}
                  style={{ backgroundColor: activeStyle.background }}
                >
                  {error ? (
                    <div className="error">
                      <b>Not quite there yet</b>
                      <p>{error}</p>
                      <small>Check the Mermaid syntax and try again.</small>
                    </div>
                  ) : svg ? (
                    <div
                      className="output"
                      ref={preview}
                      style={{
                        padding: `${activeStyle.canvasPadding ?? 28}px`,
                        display: 'flex',
                        justifyContent: activeStyle.canvasAlignment === 'left'
                          ? 'flex-start'
                          : 'center'
                      }}
                    />
                  ) : (
                    <span className="muted">Putting the pieces together…</span>
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
                        className={theme === id && !customEnabled ? 'chosen' : ''}
                        onClick={() => chooseTheme(id)}
                      >
                        <i style={{ background: themes[id].bg }} />
                        <i style={{ background: themes[id].variables.primaryColor }} />
                      </button>
                    ))}
                  </div>
                  <div className="exports">
                    <button disabled={!svg} onClick={() => void copy(svg, 'SVG copied')}>
                      <Copy /> SVG
                    </button>
                    <button disabled={!svg} className="green" onClick={() => void png()}>
                      <FileImage /> PNG
                    </button>
                    <button disabled={!svg} onClick={exportSvg}>
                      <Download /> Save SVG
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <section className="studio-controls">
              <div className="studio-controls-heading">
                <div>
                  <div className="eyebrow">MAKE IT YOURS</div>
                  <h3><Palette /> Custom styling</h3>
                  <p>Adjust the colours, typography and layout of your diagram.</p>
                </div>
                <label className="studio-toggle">
                  <input
                    type="checkbox"
                    checked={customEnabled}
                    onChange={e => setCustomEnabled(e.target.checked)}
                  />
                  <span>Enable custom style</span>
                </label>
              </div>

              <div className={`custom-style-grid ${customEnabled ? '' : 'disabled'}`}>
                {([
                  ['Background', 'background'],
                  ['Primary node fill', 'primaryColor'],
                  ['Text', 'primaryTextColor'],
                  ['Node border', 'primaryBorderColor'],
                  ['Connectors', 'lineColor'],
                  ['Secondary node fill', 'secondaryColor'],
                  ['Tertiary node fill', 'tertiaryColor']
                ] as const).map(([label, key]) => (
                  <label className="color-control" key={key}>
                    <span>{label}</span>
                    <input
                      type="color"
                      value={customStyle[key] ?? defaultCustomStyle[key] ?? '#ffffff'}
                      disabled={!customEnabled}
                      onChange={e => updateStyle(key, e.target.value)}
                    />
                    <small>{customStyle[key] ?? defaultCustomStyle[key]}</small>
                  </label>
                ))}
              </div>

              <div className="typography-controls">
                <label>
                  <span>Font family</span>
                  <select
                    value={customStyle.fontFamily}
                    disabled={!customEnabled}
                    onChange={e => updateStyle('fontFamily', e.target.value)}
                  >
                    {fontOptions.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
                  </select>
                </label>

                <label>
                  <span>Text size</span>
                  <select
                    value={customStyle.fontSize}
                    disabled={!customEnabled}
                    onChange={e => updateStyle('fontSize', e.target.value)}
                  >
                    {['12px', '14px', '16px', '18px', '20px', '22px', '24px'].map(size =>
                      <option key={size} value={size}>{size}</option>
                    )}
                  </select>
                </label>

                <label>
                  <span>Font weight</span>
                  <select
                    value={customStyle.fontWeight ?? '400'}
                    disabled={!customEnabled}
                    onChange={e => updateStyle('fontWeight', e.target.value)}
                  >
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi-bold</option>
                    <option value="700">Bold</option>
                  </select>
                </label>

                <label>
                  <span>Letter spacing · {customStyle.letterSpacing ?? 0}px</span>
                  <input
                    type="range"
                    min="-1"
                    max="4"
                    step="0.5"
                    value={customStyle.letterSpacing ?? 0}
                    disabled={!customEnabled}
                    onChange={e => updateStyle('letterSpacing', Number(e.target.value))}
                  />
                </label>

                <button
                  className="reset-style"
                  disabled={!customEnabled}
                  onClick={() => setCustomStyle(styleFromTheme(theme))}
                ><RotateCcw /> Reset style</button>
              </div>

              <div className="layout-controls">
                <div className="studio-controls-heading">
                  <div>
                    <h3>Diagram layout</h3>
                    <p>Fine-tune flowchart structure and the exported canvas.</p>
                  </div>
                </div>

                {!isFlowchart && (
                  <p className="layout-note">
                    Flowchart-specific settings are available when you select
                    the Flowchart example or enter flowchart Mermaid code.
                  </p>
                )}

                <div className="typography-controls">
                  <label>
                    <span>Node shape</span>
                    <select
                      value={customStyle.nodeShape ?? 'soft'}
                      disabled={!customEnabled || !isFlowchart}
                      onChange={e => updateStyle(
                        'nodeShape',
                        e.target.value as CustomStyle['nodeShape']
                      )}
                    >
                      {nodeShapeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Border width · {customStyle.borderWidth ?? 1.5}px</span>
                    <input
                      type="range"
                      min="0.5"
                      max="4"
                      step="0.5"
                      value={customStyle.borderWidth ?? 1.5}
                      disabled={!customEnabled || !isFlowchart}
                      onChange={e => updateStyle('borderWidth', Number(e.target.value))}
                    />
                  </label>

                  <label>
                    <span>Node spacing · {customStyle.nodeSpacing ?? 50}</span>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="5"
                      value={customStyle.nodeSpacing ?? 50}
                      disabled={!customEnabled || !isFlowchart}
                      onChange={e => updateStyle('nodeSpacing', Number(e.target.value))}
                    />
                  </label>

                  <label>
                    <span>Level spacing · {customStyle.rankSpacing ?? 50}</span>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={customStyle.rankSpacing ?? 50}
                      disabled={!customEnabled || !isFlowchart}
                      onChange={e => updateStyle('rankSpacing', Number(e.target.value))}
                    />
                  </label>

                  <label>
                    <span>Connector style</span>
                    <select
                      value={customStyle.curve ?? 'basis'}
                      disabled={!customEnabled || !isFlowchart}
                      onChange={e => updateStyle('curve', e.target.value as CustomStyle['curve'])}
                    >
                      {curveOptions.map(option =>
                        <option key={option.value} value={option.value}>{option.label}</option>
                      )}
                    </select>
                  </label>

                  <label>
                    <span>Canvas padding · {customStyle.canvasPadding ?? 28}px</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="4"
                      value={customStyle.canvasPadding ?? 28}
                      disabled={!customEnabled}
                      onChange={e => updateStyle('canvasPadding', Number(e.target.value))}
                    />
                  </label>

                  <label>
                    <span>Canvas alignment</span>
                    <select
                      value={customStyle.canvasAlignment ?? 'center'}
                      disabled={!customEnabled}
                      onChange={e => updateStyle(
                        'canvasAlignment',
                        e.target.value as CustomStyle['canvasAlignment']
                      )}
                    >
                      <option value="center">Centered</option>
                      <option value="left">Left aligned</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="palette-saver">
                <div>
                  <b><Save /> Your saved palettes</b>
                  <small>{savedPalettes.length} of {MAX_PALETTES} saved</small>
                </div>

                <div className="palette-save-input">
                  <input
                    value={paletteName}
                    maxLength={30}
                    placeholder="Name this palette"
                    onChange={e => setPaletteName(e.target.value)}
                  />
                  <button
                    className="green"
                    disabled={!customEnabled || savedPalettes.length >= MAX_PALETTES || !paletteName.trim()}
                    onClick={savePalette}
                  ><Save /> Save palette</button>
                </div>

                <div className="preset-actions">
                  <input
                    ref={importInput}
                    type="file"
                    accept=".json,application/json"
                    hidden
                    onChange={e => void importPalettes(e.target.files?.[0])}
                  />
                  <button onClick={() => importInput.current?.click()}>
                    <Download /> Import presets
                  </button>
                  <button onClick={exportPalettes} disabled={!savedPalettes.length}>
                    <Download /> Export presets
                  </button>
                </div>

                {savedPalettes.length > 0 && (
                  <div className="saved-palette-list">
                    {savedPalettes.map(palette => (
                      <div className="saved-palette" key={palette.id}>
                        {renameId === palette.id ? (
                          <>
                            <input
                              value={renameValue}
                              maxLength={30}
                              onChange={e => setRenameValue(e.target.value)}
                              aria-label="New palette name"
                            />
                            <button onClick={finishRename}>Save name</button>
                            <button onClick={() => setRenameId('')}><X /></button>
                          </>
                        ) : (
                          <>
                            <button
                              className="palette-name"
                              onClick={() => applyPalette(palette)}
                            >
                              <i style={{ background: palette.style.background }} />
                              <span>{palette.name}</span>
                              <small>Apply</small>
                            </button>
                            <button
                              title="Duplicate"
                              aria-label={`Duplicate ${palette.name}`}
                              onClick={() => duplicatePalette(palette)}
                              disabled={savedPalettes.length >= MAX_PALETTES}
                            ><Copy /></button>
                            <button
                              aria-label={`Rename ${palette.name}`}
                              title="Rename"
                              onClick={() => startRename(palette)}
                            ><Pencil /></button>
                            <button
                              aria-label={`Delete ${palette.name}`}
                              title="Delete"
                              onClick={() => deletePalette(palette.id)}
                            ><Trash2 /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="export-settings">
                <div>
                  <b><FileImage /> PNG export settings</b>
                  <small>Choose the size and background for your next PNG.</small>
                </div>
                <label>
                  <span>Image size</span>
                  <select value={pngScale} onChange={e => setPngScale(Number(e.target.value))}>
                    <option value={1}>1× — Standard</option>
                    <option value={2}>2× — High resolution</option>
                    <option value={3}>3× — Very high resolution</option>
                    <option value={4}>4× — Maximum resolution</option>
                  </select>
                </label>
                <label className="transparent-option">
                  <input
                    type="checkbox"
                    checked={transparentPng}
                    onChange={e => setTransparentPng(e.target.checked)}
                  />
                  <span>Transparent PNG background</span>
                </label>
              </div>
            </section>

            <div className="workbottom">
              <span><LockKeyhole /> Rendering happens locally in your browser.</span>
              <span>Mermaid syntax · No sign-in needed</span>
            </div>
          </div>
        </section>

        <section className="themes" id="themes">
          <div className="secthead">
            <div><div className="eyebrow">A CHANGE OF MOOD</div><h2>Four ways to <em>feel neat.</em></h2></div>
            <p>One diagram, a few different personalities. Pick the one that fits the room.</p>
          </div>
          <div className="themegrid">
            {(Object.keys(themes) as ThemeId[]).map((id, i) => (
              <button
                className={`theme-card ${id}`}
                key={id}
                onClick={() => {
                  chooseTheme(id)
                  document.querySelector('#studio')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <div className="minipreview">
                  <span className="mininode" /><i />
                  <span className="mininode wide" /><i />
                  <span className="mininode bottom" /><small>0{i + 1}</small>
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
            <h2>Three small steps.<br /><em>One clearer idea.</em></h2>
            <p>Here for the finishing touches, not another thing to figure out.</p>
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
          <a className="primary" href="#studio">Open the workshop <ArrowRight /></a>
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
            <div><b>Make</b><a href="#studio">Workshop</a><a href="#themes">Themes</a></div>
            <div><b>Discover</b><a href="#how">How it works</a><a href="#top">Back to top ↑</a></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Neatdraw</span>
          <span>Mermaid diagrams, made a little neater.</span>
        </div>
      </footer>

      {toast && <div className="toast"><Check />{toast}</div>}
    </div>
  )
}

export default App
