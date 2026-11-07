import mermaid from 'mermaid'

export type ThemeId = 'paper' | 'midnight' | 'citrus' | 'lavender'

export type CurveStyle =
  | 'basis'
  | 'linear'
  | 'cardinal'
  | 'step'
  | 'monotoneX'
  | 'monotoneY'
  | 'natural'

export type NodeShape = 'square' | 'soft' | 'pill'
export type CanvasAlignment = 'center' | 'left'

export interface CustomStyle {
  background: string
  primaryColor: string
  primaryTextColor: string
  primaryBorderColor: string
  lineColor: string
  fontFamily: string
  fontSize: string
  secondaryColor?: string
  tertiaryColor?: string
  nodeSpacing?: number
  rankSpacing?: number
  padding?: number
  curve?: CurveStyle
  nodeShape?: NodeShape
  borderWidth?: number
  fontWeight?: string
  letterSpacing?: number
  canvasPadding?: number
  canvasAlignment?: CanvasAlignment
}

export const themes: Record<ThemeId, {
  name: string
  desc: string
  bg: string
  variables: Record<string, string>
}> = {
  paper: {
    name: 'Paper',
    desc: 'Warm, quiet and clear',
    bg: '#fffdf8',
    variables: {
      background: '#fffdf8',
      primaryColor: '#e2eee6',
      primaryTextColor: '#244c3b',
      primaryBorderColor: '#7ca38b',
      lineColor: '#648b77',
      secondaryColor: '#f3e8d7',
      tertiaryColor: '#f8f4eb',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '16px',
      edgeLabelBackground: '#fffdf8'
    }
  },
  midnight: {
    name: 'Midnight',
    desc: 'Deep contrast, low glare',
    bg: '#171b2b',
    variables: {
      background: '#171b2b',
      primaryColor: '#293b5b',
      primaryTextColor: '#edf2ff',
      primaryBorderColor: '#7894d0',
      lineColor: '#9db7ff',
      secondaryColor: '#34304d',
      tertiaryColor: '#24283a',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '16px',
      edgeLabelBackground: '#171b2b'
    }
  },
  citrus: {
    name: 'Citrus',
    desc: 'Bright, lively and bold',
    bg: '#fff9dc',
    variables: {
      background: '#fff9dc',
      primaryColor: '#e8f3a7',
      primaryTextColor: '#3e4a19',
      primaryBorderColor: '#9eae49',
      lineColor: '#71852b',
      secondaryColor: '#ffe3a8',
      tertiaryColor: '#f7edc9',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '16px',
      edgeLabelBackground: '#fff9dc'
    }
  },
  lavender: {
    name: 'Lavender',
    desc: 'Soft color, sharp structure',
    bg: '#f7f3ff',
    variables: {
      background: '#f7f3ff',
      primaryColor: '#e8e0ff',
      primaryTextColor: '#493b70',
      primaryBorderColor: '#a796d1',
      lineColor: '#806caf',
      secondaryColor: '#f9dfec',
      tertiaryColor: '#eee9f8',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '16px',
      edgeLabelBackground: '#f7f3ff'
    }
  }
}

export const defaultCustomStyle: CustomStyle = {
  background: '#fffdf8',
  primaryColor: '#e2eee6',
  primaryTextColor: '#244c3b',
  primaryBorderColor: '#7ca38b',
  lineColor: '#648b77',
  secondaryColor: '#f3e8d7',
  tertiaryColor: '#f8f4eb',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '16px',
  nodeSpacing: 50,
  rankSpacing: 50,
  padding: 18,
  curve: 'basis',
  nodeShape: 'soft',
  borderWidth: 1.5,
  fontWeight: '600',
  letterSpacing: 0,
  canvasPadding: 28,
  canvasAlignment: 'center'
}

export const fontOptions = [
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { label: 'Courier New', value: 'Courier New, monospace' }
]

export const curveOptions: { label: string; value: CurveStyle }[] = [
  { label: 'Smooth', value: 'basis' },
  { label: 'Straight', value: 'linear' },
  { label: 'Rounded', value: 'cardinal' },
  { label: 'Stepped', value: 'step' },
  { label: 'Natural', value: 'natural' }
]

export const nodeShapeOptions: {
  label: string
  value: NodeShape
}[] = [
  { label: 'Square corners', value: 'square' },
  { label: 'Soft corners', value: 'soft' },
  { label: 'Pill corners', value: 'pill' }
]

export function getThemeVariables(
  theme: ThemeId,
  customStyle?: CustomStyle
): Record<string, string> {
  const base = themes[theme].variables

  if (!customStyle) {
    return { ...base }
  }

  return {
    ...base,
    background: customStyle.background,
    primaryColor: customStyle.primaryColor,
    primaryTextColor: customStyle.primaryTextColor,
    primaryBorderColor: customStyle.primaryBorderColor,
    lineColor: customStyle.lineColor,
    secondaryColor: customStyle.secondaryColor ?? base.secondaryColor,
    tertiaryColor: customStyle.tertiaryColor ?? base.tertiaryColor,
    edgeLabelBackground: customStyle.background,
    fontFamily: customStyle.fontFamily,
    fontSize: customStyle.fontSize
  }
}

export const starter = `flowchart TD
 A[Collect ideas] --> B{Worth exploring?}
 B -->|Yes| C[Make a small plan]
 B -->|Not yet| D[Save for later]
 C --> E[Build a prototype]
 E --> F[Share and learn]
 D --> A`

export const examples = [
  { label: 'Flowchart', code: starter },
  {
    label: 'Sequence',
    code: `sequenceDiagram
 participant You
 participant App
 You->>App: Write Mermaid
 App-->>You: Preview locally
 You->>App: Export diagram`
  },
  {
    label: 'Mind map',
    code: `mindmap
 root((Neat ideas))
  Plan
   Keep it focused
   Start small
  Make
   Try a theme
   Preview
  Share
   Export SVG
   Export PNG`
  },
  {
    label: 'Class diagram',
    code: `classDiagram
 class Project {
  +String name
  +preview()
  +export()
 }
 class Theme {
  +String palette
  +apply()
 }
 Project --> Theme : uses`
  }
]

let queue = Promise.resolve()

function cleanSvg(
  raw: string,
  customStyle?: CustomStyle
): string {
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml')

  if (
    doc.querySelector('parsererror') ||
    doc.documentElement.tagName.toLowerCase() !== 'svg'
  ) {
    throw Error('Invalid SVG output.')
  }

  const root = doc.documentElement

  root.querySelectorAll(
    'script,iframe,object,embed,audio,video'
  ).forEach(n => n.remove())

  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const a of Array.from(el.attributes)) {
      const n = a.name.toLowerCase()
      const v = a.value.trim()

      if (n.startsWith('on')) {
        el.removeAttribute(a.name)
      }

      if (
        (n === 'href' || n.endsWith(':href')) &&
        v &&
        !v.startsWith('#') &&
        !v.startsWith('data:image/')
      ) {
        el.removeAttribute(a.name)
      }

      if (
        (n === 'style' || n === 'fill' || n === 'stroke') &&
        v.toLowerCase().includes('url(') &&
        (
          v.toLowerCase().includes('http:') ||
          v.toLowerCase().includes('https:') ||
          v.toLowerCase().includes('javascript:')
        )
      ) {
        el.removeAttribute(a.name)
      }
    }
  }

  if (customStyle) {
    const fills = [
      customStyle.primaryColor,
      customStyle.secondaryColor ?? customStyle.primaryColor,
      customStyle.tertiaryColor ?? customStyle.primaryColor
    ]

    // Apply the three palette fills to flowchart nodes in sequence.
    const nodes = Array.from(root.querySelectorAll('.node'))

    nodes.forEach((node, index) => {
      const fill = fills[index % fills.length]

      node.querySelectorAll(
        'rect, polygon, circle, ellipse'
      ).forEach(shape => {
        shape.setAttribute('fill', fill)
        shape.setAttribute(
          'stroke',
          customStyle.primaryBorderColor
        )

        if (shape.tagName.toLowerCase() === 'rect') {
          const height = Number(shape.getAttribute('height')) || 0
          const radius =
            customStyle.nodeShape === 'square'
              ? 0
              : customStyle.nodeShape === 'pill'
                ? Math.min(height / 2, 40)
                : 9

          shape.setAttribute('rx', String(radius))
          shape.setAttribute('ry', String(radius))
        }

        shape.setAttribute(
          'stroke-width',
          String(customStyle.borderWidth ?? 1.5)
        )
      })
    })

    root.querySelectorAll(
      '.nodeLabel, .edgeLabel, .cluster-label, .label, text'
    ).forEach(label => {
      label.setAttribute(
        'font-weight',
        customStyle.fontWeight ?? '600'
      )

      label.setAttribute(
        'letter-spacing',
        `${customStyle.letterSpacing ?? 0}px`
      )
    })
  }

  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  return new XMLSerializer().serializeToString(root)
}

/**
 * Adds a real background and padding to the SVG viewBox.
 * The same prepared SVG can be used for SVG and PNG downloads.
 */
export function prepareSvgExport(
  raw: string,
  background: string,
  padding = 28,
  transparent = false
): string {
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml')
  const root = doc.documentElement

  if (
    doc.querySelector('parsererror') ||
    root.tagName.toLowerCase() !== 'svg'
  ) {
    throw Error('Could not prepare the SVG export.')
  }

  const viewBox = (root.getAttribute('viewBox') || '')
    .trim()
    .split(/[ ,]+/)
    .map(Number)

  let x = 0
  let y = 0
  let width = Number(root.getAttribute('width')) || 1000
  let height = Number(root.getAttribute('height')) || 700

  if (viewBox.length === 4 && viewBox.every(Number.isFinite)) {
    ;[x, y, width, height] = viewBox
  }

  const safePadding = Math.max(0, Math.min(160, padding))
  const newX = x - safePadding
  const newY = y - safePadding
  const newWidth = width + safePadding * 2
  const newHeight = height + safePadding * 2

  root.setAttribute(
    'viewBox',
    `${newX} ${newY} ${newWidth} ${newHeight}`
  )
  root.setAttribute('width', String(newWidth))
  root.setAttribute('height', String(newHeight))
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const oldBackground = root.querySelector(
    ':scope > rect[data-neatdraw-background]'
  )
  oldBackground?.remove()

  if (!transparent) {
    const rect = doc.createElementNS(
      'http://www.w3.org/2000/svg',
      'rect'
    )

    rect.setAttribute('data-neatdraw-background', 'true')
    rect.setAttribute('x', String(newX))
    rect.setAttribute('y', String(newY))
    rect.setAttribute('width', String(newWidth))
    rect.setAttribute('height', String(newHeight))
    rect.setAttribute('fill', background)

    root.insertBefore(rect, root.firstChild)
  }

  return new XMLSerializer().serializeToString(root)
}

export async function renderDiagram(
  source: string,
  theme: ThemeId,
  customStyle?: CustomStyle
) {
  const job = queue.then(async () => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      htmlLabels: false,
      themeVariables: getThemeVariables(theme, customStyle),

      flowchart: {
        curve: customStyle?.curve ?? 'basis',
        padding: customStyle?.padding ?? 18,
        nodeSpacing: customStyle?.nodeSpacing ?? 50,
        rankSpacing: customStyle?.rankSpacing ?? 50
      },

      sequence: {
        useMaxWidth: true,
        wrap: true
      }
    })

    const result = await mermaid.render(
      'neatdraw-' + Math.random().toString(36).slice(2),
      source
    )

    return cleanSvg(result.svg, customStyle)
  })

  queue = job.then(
    () => undefined,
    () => undefined
  )

  return job
}

export function validate(source: string) {
  if (!source.trim()) {
    return 'Add Mermaid code to get started.'
  }

  if (source.length > 50000) {
    return 'This diagram exceeds the 50,000 character limit.'
  }

  return null
}
