
import mermaid from 'mermaid'

export type ThemeId = 'paper' | 'midnight' | 'citrus' | 'lavender'

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

function cleanSvg(raw: string) {
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml')

  if (
    doc.querySelector('parsererror') ||
    doc.documentElement.tagName.toLowerCase() !== 'svg'
  ) {
    throw Error('Invalid SVG output.')
  }

  const root = doc.documentElement

  // Preserve diagram labels. Mermaid is configured to use native SVG text.
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

  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  return new XMLSerializer().serializeToString(root)
}

export async function renderDiagram(source: string, theme: ThemeId) {
  const job = queue.then(async () => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: themes[theme].variables,
      flowchart: {
        htmlLabels: false,
        curve: 'basis',
        padding: 18
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

    return cleanSvg(result.svg)
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
