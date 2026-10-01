import './operation-room-project-dossier.css'

export type ProjectDossierMedia = {
  url: string
  alt?: string
  width?: number
  height?: number
  caption?: string
}

export type ProjectDossierLink = {
  label?: string
  url?: string
}

export type ProjectDossierData = {
  slug: string
  title: string
  summary: string
  year?: number
  role?: string
  status?: 'live' | 'prototype' | 'archived'
  tags?: string[]
  links?: ProjectDossierLink[]
  caseStudy?: unknown
  cover?: ProjectDossierMedia
  gallery?: ProjectDossierMedia[]
}

type Controller = {
  open: (project: ProjectDossierData) => void
  close: () => void
  dispose: () => void
  readonly isOpen: boolean
}

const appendLexical = (parent: HTMLElement, node: any) => {
  if (!node) return
  if (node.type === 'text') {
    let child: Node = document.createTextNode(node.text || '')
    const wrap = (tag: string) => {
      const element = document.createElement(tag)
      element.append(child)
      child = element
    }
    if (node.format & 16) wrap('code')
    if (node.format & 8) wrap('u')
    if (node.format & 4) wrap('s')
    if (node.format & 2) wrap('em')
    if (node.format & 1) wrap('strong')
    parent.append(child)
    return
  }

  if (node.type === 'linebreak') {
    parent.append(document.createElement('br'))
    return
  }

  const tags: Record<string, string> = {
    paragraph: 'p',
    quote: 'blockquote',
    heading: node.tag || 'h2',
    list: node.tag === 'ol' || node.listType === 'number' ? 'ol' : 'ul',
    listitem: 'li',
    link: 'a',
    autolink: 'a',
    code: 'pre',
  }
  const element = document.createElement(tags[node.type] || 'div')
  if ((node.type === 'link' || node.type === 'autolink') && typeof node.url === 'string') {
    if (/^(https?:|mailto:|\/)/.test(node.url)) {
      ;(element as HTMLAnchorElement).href = node.url
      if (/^https?:/.test(node.url)) {
        ;(element as HTMLAnchorElement).target = '_blank'
        ;(element as HTMLAnchorElement).rel = 'noreferrer'
      }
    }
  }
  if (node.type === 'code' && typeof node.code === 'string') element.textContent = node.code
  if (Array.isArray(node.children)) node.children.forEach((child: unknown) => appendLexical(element, child))
  parent.append(element)
}

const createElement = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string) => {
  const element = document.createElement(tag)
  if (className) element.className = className
  return element
}

const inferLinkLabel = (url: string) => {
  if (url.includes('github.com')) return 'GitHub ↗'
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    return `${hostname} ↗`
  } catch {
    return 'Open link ↗'
  }
}

const githubPreview = (project: ProjectDossierData): ProjectDossierMedia | null => {
  const github = project.links?.find((link) => link.url?.includes('github.com'))?.url
  if (!github) return null
  try {
    const path = new URL(github).pathname.replace(/^\//, '').replace(/\/$/, '')
    if (!path) return null
    return {
      url: `https://opengraph.githubassets.com/${encodeURIComponent(project.slug)}/${path}`,
      alt: `${project.title} repository preview`,
      caption: 'Repository preview',
    }
  } catch {
    return null
  }
}

const renderFacts = (container: HTMLElement, project: ProjectDossierData) => {
  container.replaceChildren()
  const facts = [
    ['Role', project.role],
    ['Year', project.year ? String(project.year) : undefined],
    ['Status', project.status],
    ['Stack', project.tags?.join(' · ')],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]))

  for (const [label, value] of facts) {
    const dl = createElement('dl', 'operation-room__dossier-fact')
    const dt = document.createElement('dt')
    const dd = document.createElement('dd')
    dt.textContent = label
    dd.textContent = value
    dl.append(dt, dd)
    container.append(dl)
  }
}

const renderEvidence = (container: HTMLElement, project: ProjectDossierData) => {
  container.replaceChildren()
  const media = [project.cover, ...(project.gallery ?? [])].filter((item): item is ProjectDossierMedia => Boolean(item?.url))
  if (media.length === 0) {
    const fallback = githubPreview(project)
    if (fallback) media.push(fallback)
  }

  media.slice(0, 3).forEach((item, index) => {
    const figure = createElement('figure', 'operation-room__evidence-photo')
    const image = document.createElement('img')
    image.src = item.url
    image.alt = item.alt || `${project.title} project image ${index + 1}`
    image.loading = 'eager'
    if (item.width) image.width = item.width
    if (item.height) image.height = item.height
    const caption = document.createElement('figcaption')
    caption.textContent = item.caption || item.alt || `Evidence ${String(index + 1).padStart(2, '0')}`
    figure.append(image, caption)
    container.append(figure)
  })
}

const renderNotes = (container: HTMLElement, project: ProjectDossierData) => {
  container.replaceChildren()
  const rootNode = (project.caseStudy as any)?.root ?? project.caseStudy
  if (Array.isArray(rootNode?.children)) {
    rootNode.children.forEach((node: unknown) => appendLexical(container, node))
    return
  }
  const paragraph = document.createElement('p')
  paragraph.textContent = project.summary
  container.append(paragraph)
}

const renderLinks = (container: HTMLElement, project: ProjectDossierData) => {
  container.replaceChildren()
  for (const link of project.links ?? []) {
    if (!link.url || !/^(https?:|mailto:)/.test(link.url)) continue
    const anchor = createElement('a', 'operation-room__dossier-link')
    anchor.href = link.url
    anchor.textContent = link.label?.trim() || inferLinkLabel(link.url)
    if (/^https?:/.test(link.url)) {
      anchor.target = '_blank'
      anchor.rel = 'noreferrer'
    }
    container.append(anchor)
  }
}

export const createProjectDossier = (root: HTMLElement, canvas: HTMLCanvasElement): Controller => {
  const reader = createElement('div', 'operation-room__dossier-reader')
  reader.dataset.operationRoomDossierReader = ''
  reader.setAttribute('aria-hidden', 'true')

  const backdrop = createElement('button', 'operation-room__dossier-backdrop')
  backdrop.type = 'button'
  backdrop.setAttribute('aria-label', 'Close project dossier')

  const dossier = createElement('section', 'operation-room__dossier')
  dossier.tabIndex = -1
  dossier.setAttribute('role', 'dialog')
  dossier.setAttribute('aria-modal', 'true')
  dossier.setAttribute('aria-labelledby', 'operation-room-dossier-title')

  const tab = createElement('p', 'operation-room__dossier-tab')
  tab.textContent = 'CASE FILE / WORK'

  const close = createElement('button', 'operation-room__dossier-close')
  close.type = 'button'
  close.setAttribute('aria-label', 'Close project dossier')
  close.textContent = '×'

  const paper = createElement('div', 'operation-room__dossier-paper')
  const heading = createElement('header', 'operation-room__dossier-heading')
  const stamp = createElement('p', 'operation-room__dossier-stamp')
  stamp.textContent = 'FEATURED PROJECT'
  const title = createElement('h1', 'operation-room__dossier-title')
  title.id = 'operation-room-dossier-title'
  const summary = createElement('p', 'operation-room__dossier-summary')
  heading.append(stamp, title, summary)

  const facts = createElement('div', 'operation-room__dossier-facts')
  const evidence = createElement('div', 'operation-room__dossier-evidence')
  evidence.setAttribute('aria-label', 'Project evidence')
  const notes = createElement('div', 'operation-room__dossier-notes')
  const links = createElement('div', 'operation-room__dossier-links')

  paper.append(heading, facts, evidence, notes, links)
  dossier.append(tab, close, paper)
  reader.append(backdrop, dossier)
  root.append(reader)

  let open = false

  const closeDossier = () => {
    if (!open) return
    open = false
    reader.dataset.open = 'false'
    reader.setAttribute('aria-hidden', 'true')
    root.dataset.readerOpen = 'false'
    document.body.style.overflow = ''
    window.setTimeout(() => canvas.focus(), 260)
  }

  const openDossier = (project: ProjectDossierData) => {
    title.textContent = project.title
    summary.textContent = project.summary
    renderFacts(facts, project)
    renderEvidence(evidence, project)
    renderNotes(notes, project)
    renderLinks(links, project)
    open = true
    root.dataset.readerOpen = 'true'
    reader.dataset.open = 'true'
    reader.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => dossier.focus())
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    closeDossier()
  }

  backdrop.addEventListener('click', closeDossier)
  close.addEventListener('click', closeDossier)
  window.addEventListener('keydown', onKeyDown)

  return {
    open: openDossier,
    close: closeDossier,
    dispose: () => {
      backdrop.removeEventListener('click', closeDossier)
      close.removeEventListener('click', closeDossier)
      window.removeEventListener('keydown', onKeyDown)
      if (open) {
        root.dataset.readerOpen = 'false'
        document.body.style.overflow = ''
      }
      reader.remove()
      open = false
    },
    get isOpen() {
      return open
    },
  }
}
