import type { TalkDTO } from '@/lib/content/client'

type YouTubeSource = {
  id: string
  start: number
}

const parseTime = (value: string | null) => {
  if (!value) return 0
  if (/^\d+$/.test(value)) return Number(value)

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i)
  if (!match) return 0
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0)
}

const parseYouTubeSource = (value: string): YouTubeSource | null => {
  try {
    const url = new URL(value)
    let id = ''

    if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0] || ''
    } else if (url.hostname.endsWith('youtube.com')) {
      if (url.pathname === '/watch') id = url.searchParams.get('v') || ''
      else if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) {
        id = url.pathname.split('/').filter(Boolean)[1] || ''
      }
    }

    if (!id) return null
    return {
      id,
      start: parseTime(url.searchParams.get('start') || url.searchParams.get('t')),
    }
  } catch {
    return null
  }
}

const formatDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short' }).toUpperCase()
}

const createFilmButton = (talk: TalkDTO, index: number, selectedIndex: number) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'operation-room__film-frame'
  button.dataset.projectorFilm = String(index)
  button.setAttribute('aria-label', `Load film ${index + 1}: ${talk.title}`)
  button.setAttribute('aria-current', index === selectedIndex ? 'true' : 'false')

  const sprocketsTop = document.createElement('span')
  sprocketsTop.className = 'operation-room__film-sprockets operation-room__film-sprockets--top'
  const number = document.createElement('span')
  number.className = 'operation-room__film-number'
  number.textContent = String(index + 1).padStart(2, '0')
  const label = document.createElement('span')
  label.className = 'operation-room__film-label'
  label.textContent = talk.title
  const sprocketsBottom = document.createElement('span')
  sprocketsBottom.className = 'operation-room__film-sprockets operation-room__film-sprockets--bottom'

  button.append(sprocketsTop, number, label, sprocketsBottom)
  return button
}

export const installOperationRoomProjectorLibrary = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-operation-room-canvas]')
  const live = root.querySelector<HTMLElement>('[data-operation-room-live]')
  const projector = root.querySelector<HTMLElement>('[data-operation-room-projector-library]')
  const titleCard = root.querySelector<HTMLElement>('[data-projector-title-card]')
  const player = root.querySelector<HTMLElement>('[data-projector-player]')
  const viewFilmsButton = root.querySelector<HTMLButtonElement>('[data-projector-view-films]')
  const iframe = root.querySelector<HTMLIFrameElement>('[data-projector-iframe]')
  const title = root.querySelector<HTMLElement>('[data-projector-title]')
  const meta = root.querySelector<HTMLElement>('[data-projector-meta]')
  const reelCounter = root.querySelector<HTMLElement>('[data-projector-reel-counter]')
  const filmstrip = root.querySelector<HTMLElement>('[data-projector-filmstrip]')
  const emptyState = root.querySelector<HTMLElement>('[data-projector-empty]')
  const availableCount = root.querySelector<HTMLElement>('[data-projector-count]')
  const zoomOutButton = root.querySelector<HTMLButtonElement>('[data-operation-room-zoom-out]')
  const resetButton = root.querySelector<HTMLButtonElement>('[data-operation-room-reset]')
  const talksNode = root.querySelector<HTMLScriptElement>('[data-operation-room-talks]')

  if (!canvas || !projector || !titleCard || !player || !iframe || !title || !meta || !reelCounter || !filmstrip) {
    return () => undefined
  }

  let talks: TalkDTO[] = []
  try {
    talks = talksNode?.textContent ? JSON.parse(talksNode.textContent) as TalkDTO[] : []
  } catch {
    talks = []
  }

  talks = talks.filter((talk) => Boolean(parseYouTubeSource(talk.videoUrl)))
  let selectedIndex = 0
  let open = false
  let openingTimer = 0
  let closingTimer = 0

  if (availableCount) availableCount.textContent = String(talks.length)
  if (emptyState) emptyState.hidden = talks.length > 0
  if (viewFilmsButton) viewFilmsButton.hidden = talks.length === 0

  const setMode = (mode: 'title' | 'player') => {
    titleCard.hidden = mode !== 'title'
    player.hidden = mode !== 'player'
    projector.dataset.mode = mode
  }

  const renderFilmstrip = () => {
    filmstrip.replaceChildren(...talks.map((talk, index) => createFilmButton(talk, index, selectedIndex)))
  }

  const loadTalk = (index: number, autoplay = false) => {
    const talk = talks[index]
    if (!talk) return
    const source = parseYouTubeSource(talk.videoUrl)
    if (!source) return

    selectedIndex = index
    const params = new URLSearchParams({
      rel: '0',
      playsinline: '1',
      controls: '1',
      autoplay: autoplay ? '1' : '0',
    })
    if (source.start > 0) params.set('start', String(source.start))

    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.id)}?${params.toString()}`
    iframe.title = talk.title
    title.textContent = talk.title
    const date = formatDate(talk.date)
    meta.textContent = [talk.event, date].filter(Boolean).join(' / ')
    reelCounter.textContent = `REEL ${String(index + 1).padStart(2, '0')} OF ${String(talks.length).padStart(2, '0')}`
    renderFilmstrip()
    setMode('player')
  }

  const showTitleCard = () => {
    iframe.src = 'about:blank'
    selectedIndex = 0
    setMode('title')
  }

  const openProjector = () => {
    if (open) return
    open = true
    window.clearTimeout(openingTimer)
    window.clearTimeout(closingTimer)
    root.dataset.projectorView = 'deploying'
    projector.setAttribute('aria-hidden', 'false')
    if (zoomOutButton) zoomOutButton.hidden = false
    if (live) live.textContent = 'Speaking film library opening'
    showTitleCard()

    openingTimer = window.setTimeout(() => {
      if (!open) return
      root.dataset.projectorView = 'open'
      viewFilmsButton?.focus({ preventScroll: true })
      if (live) live.textContent = `${talks.length} speaking films available`
    }, 520)
  }

  const closeProjector = (resetRoom = true) => {
    if (!open) return
    open = false
    window.clearTimeout(openingTimer)
    window.clearTimeout(closingTimer)
    iframe.src = 'about:blank'
    projector.setAttribute('aria-hidden', 'true')
    root.dataset.projectorView = 'closing'

    closingTimer = window.setTimeout(() => {
      if (open) return
      delete root.dataset.projectorView
      showTitleCard()
      canvas.focus({ preventScroll: true })
    }, 460)

    if (resetRoom) resetButton?.click()
  }

  const onCanvasPointerUp = (event: PointerEvent) => {
    if (open || event.button !== 0) return
    // operation-room.ts updates this live label from the exact Three.js
    // hover target. Reuse it here so the DOM film library opens only for the
    // projector and never for the adjacent map or door regions.
    if (live?.textContent?.trim() !== 'SPEAKING selected') return
    openProjector()
  }

  const onViewFilms = () => loadTalk(0, false)
  const onFilmstripClick = (event: MouseEvent) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-projector-film]')
    if (!button) return
    const index = Number(button.dataset.projectorFilm)
    if (Number.isInteger(index)) loadTalk(index, true)
  }
  const onReturn = () => {
    if (open) closeProjector(true)
  }
  const onReset = () => {
    if (open) closeProjector(false)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    closeProjector(true)
  }

  showTitleCard()
  canvas.addEventListener('pointerup', onCanvasPointerUp)
  viewFilmsButton?.addEventListener('click', onViewFilms)
  filmstrip.addEventListener('click', onFilmstripClick)
  zoomOutButton?.addEventListener('click', onReturn)
  resetButton?.addEventListener('click', onReset)
  window.addEventListener('keydown', onKeyDown)

  return () => {
    window.clearTimeout(openingTimer)
    window.clearTimeout(closingTimer)
    iframe.src = 'about:blank'
    canvas.removeEventListener('pointerup', onCanvasPointerUp)
    viewFilmsButton?.removeEventListener('click', onViewFilms)
    filmstrip.removeEventListener('click', onFilmstripClick)
    zoomOutButton?.removeEventListener('click', onReturn)
    resetButton?.removeEventListener('click', onReset)
    window.removeEventListener('keydown', onKeyDown)
    delete root.dataset.projectorView
  }
}
