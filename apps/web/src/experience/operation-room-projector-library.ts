import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import type { TalkDTO } from '@/lib/content/client'

type YouTubeSource = {
  id: string
  start: number
}

type FocusRoute = {
  path: THREE.Curve<THREE.Vector3>
  startTarget: THREE.Vector3
  endTarget: THREE.Vector3
  startUp: THREE.Vector3
  endUp: THREE.Vector3
  duration: number
}

const SCREEN = {
  width: 8.4 * 0.5,
  height: 4.45 + 0.38,
  topY: Math.min(7.25 - 0.55, 3.42 + 4.45 / 2 + 0.55),
  z: -5.79 + 0.32 + 0.04,
  x: (-3.35 + 8.4 / 2) - (8.4 * 0.5) / 2 + 0.8,
} as const

const SCREEN_TARGET = new THREE.Vector3(SCREEN.x, SCREEN.topY - SCREEN.height / 2, SCREEN.z)

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

const easeMotionControl = (value: number) => value * value * value * (value * (value * 6 - 15) + 10)

export const installOperationRoomProjectorLibrary = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-operation-room-canvas]')
  const live = root.querySelector<HTMLElement>('[data-operation-room-live]')
  const projector = root.querySelector<HTMLElement>('[data-operation-room-projector-library]')
  const projectorSurface = root.querySelector<HTMLElement>('.operation-room__projector-surface')
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
  let transitioning = false
  let cameraOverride = false
  let cameraAnimationFrame = 0
  let roomControls: OrbitControls | null = null
  let focusRoute: FocusRoute | null = null

  if (availableCount) availableCount.textContent = String(talks.length)
  if (emptyState) emptyState.hidden = talks.length > 0
  if (viewFilmsButton) viewFilmsButton.hidden = talks.length === 0

  // The room owns its OrbitControls instance privately. Capture only the one
  // attached to this canvas and suspend its normal update while the projector
  // performs a real Three.js camera dolly. This keeps the projector extension
  // isolated without duplicating the room renderer or faking zoom with CSS.
  const originalControlsUpdate = OrbitControls.prototype.update
  const patchedControlsUpdate = function (
    this: OrbitControls,
    ...args: Parameters<OrbitControls['update']>
  ): ReturnType<OrbitControls['update']> {
    if (this.domElement === canvas) {
      roomControls = this
      if (cameraOverride) return false as ReturnType<OrbitControls['update']>
    }
    return originalControlsUpdate.apply(this, args)
  }
  OrbitControls.prototype.update = patchedControlsUpdate

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

  const getCamera = () => {
    const object = roomControls?.object
    return object instanceof THREE.PerspectiveCamera ? object : null
  }

  const getScreenViewPosition = (camera: THREE.PerspectiveCamera) => {
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (SCREEN.height * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (SCREEN.width * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.08
    return new THREE.Vector3(SCREEN_TARGET.x, SCREEN_TARGET.y, SCREEN_TARGET.z + distance)
  }

  const projectToRoom = (camera: THREE.PerspectiveCamera, point: THREE.Vector3) => {
    const projected = point.clone().project(camera)
    return new THREE.Vector2(
      (projected.x + 1) * 0.5 * root.clientWidth,
      (1 - projected.y) * 0.5 * root.clientHeight,
    )
  }

  const alignLibraryToPhysicalScreen = () => {
    const camera = getCamera()
    if (!camera) return

    const topLeft = projectToRoom(camera, new THREE.Vector3(SCREEN.x - SCREEN.width / 2, SCREEN.topY, SCREEN.z))
    const bottomRight = projectToRoom(camera, new THREE.Vector3(SCREEN.x + SCREEN.width / 2, SCREEN.topY - SCREEN.height, SCREEN.z))
    const left = Math.min(topLeft.x, bottomRight.x)
    const top = Math.min(topLeft.y, bottomRight.y)
    const width = Math.abs(bottomRight.x - topLeft.x)
    const height = Math.abs(bottomRight.y - topLeft.y)
    // Keep content just inside the physical cloth edges so the roller and
    // bottom bar remain visible and continue to sell the projection illusion.
    const insetX = width * 0.025
    const insetY = height * 0.025

    projector.style.left = `${left + insetX}px`
    projector.style.top = `${top + insetY}px`
    projector.style.width = `${Math.max(1, width - insetX * 2)}px`
    projector.style.height = `${Math.max(1, height - insetY * 2)}px`
    projector.style.transform = 'none'
  }

  const setImmersiveScreenStyling = () => {
    // The Three.js cloth remains the actual visual screen. The DOM layer is
    // only the projected information/video, so remove the old floating-panel
    // treatment and let the room lighting and screen geometry show through.
    canvas.style.transform = 'none'
    canvas.style.filter = 'none'
    if (projectorSurface) {
      projectorSurface.style.background = 'linear-gradient(100deg, rgb(234 229 203 / .86), rgb(211 207 182 / .82))'
      projectorSurface.style.border = '0'
      projectorSurface.style.boxShadow = 'inset 0 0 4rem rgb(36 32 20 / .20)'
    }
  }

  const buildFocusRoute = (camera: THREE.PerspectiveCamera, controls: OrbitControls): FocusRoute => {
    const start = camera.position.clone()
    const end = getScreenViewPosition(camera)
    const direction = end.clone().sub(start)
    const controlA = start.clone().addScaledVector(direction, 0.31).add(new THREE.Vector3(0.10, 0.12, 0.22))
    const controlB = start.clone().addScaledVector(direction, 0.76).add(new THREE.Vector3(0.05, 0.06, 0.08))

    return {
      path: new THREE.CubicBezierCurve3(start, controlA, controlB, end),
      startTarget: controls.target.clone(),
      endTarget: SCREEN_TARGET.clone(),
      startUp: camera.up.clone(),
      endUp: new THREE.Vector3(0, 1, 0),
      duration: 2200,
    }
  }

  const animateRoute = (route: FocusRoute, reverse: boolean, onComplete: () => void) => {
    const camera = getCamera()
    const controls = roomControls
    if (!camera || !controls) {
      onComplete()
      return
    }

    window.cancelAnimationFrame(cameraAnimationFrame)
    const startTime = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / route.duration, 1)
      const eased = easeMotionControl(progress)
      const routeProgress = reverse ? 1 - eased : eased

      camera.position.copy(route.path.getPointAt(routeProgress))
      controls.target.lerpVectors(route.startTarget, route.endTarget, routeProgress)
      camera.up.lerpVectors(route.startUp, route.endUp, routeProgress).normalize()
      camera.lookAt(controls.target)

      if (progress >= 1) {
        onComplete()
        return
      }
      cameraAnimationFrame = window.requestAnimationFrame(tick)
    }
    cameraAnimationFrame = window.requestAnimationFrame(tick)
  }

  const finishOpen = () => {
    const camera = getCamera()
    const controls = roomControls
    if (!open || !camera || !controls) return

    transitioning = false
    camera.position.copy(getScreenViewPosition(camera))
    controls.target.copy(SCREEN_TARGET)
    camera.up.set(0, 1, 0)
    camera.lookAt(SCREEN_TARGET)
    alignLibraryToPhysicalScreen()
    root.dataset.projectorView = 'open'
    projector.setAttribute('aria-hidden', 'false')
    if (zoomOutButton) zoomOutButton.hidden = false
    viewFilmsButton?.focus({ preventScroll: true })
    if (live) live.textContent = `${talks.length} speaking films available on projector screen`
  }

  const beginOpen = () => {
    if (!open || transitioning) return
    const camera = getCamera()
    const controls = roomControls
    if (!camera || !controls) {
      cameraAnimationFrame = window.requestAnimationFrame(beginOpen)
      return
    }

    transitioning = true
    cameraOverride = true
    controls.enabled = false
    focusRoute = buildFocusRoute(camera, controls)
    animateRoute(focusRoute, false, finishOpen)
  }

  const openProjector = () => {
    if (open) return
    open = true
    showTitleCard()
    setImmersiveScreenStyling()
    root.dataset.projectorView = 'deploying'
    projector.setAttribute('aria-hidden', 'true')
    if (zoomOutButton) zoomOutButton.hidden = false
    if (live) live.textContent = 'Moving closer to the projection screen'
    beginOpen()
  }

  const finishClose = () => {
    transitioning = false
    cameraOverride = false
    if (roomControls) roomControls.enabled = true
    delete root.dataset.projectorView
    showTitleCard()
    projector.setAttribute('aria-hidden', 'true')
    if (zoomOutButton) zoomOutButton.hidden = true
    canvas.focus({ preventScroll: true })
  }

  const closeProjector = () => {
    if (!open) return
    open = false
    transitioning = true
    iframe.src = 'about:blank'
    projector.setAttribute('aria-hidden', 'true')
    root.dataset.projectorView = 'closing'
    if (zoomOutButton) zoomOutButton.hidden = true

    const camera = getCamera()
    const controls = roomControls
    const route = focusRoute
    if (!camera || !controls || !route) {
      resetButton?.click()
      finishClose()
      return
    }

    // Reset the room synchronously to switch the actual Three.js projector and
    // roll-down screen off, then restore the focused camera before the next
    // render frame. The user sees one continuous reverse dolly while the cloth
    // retracts and reels wind down in the scene.
    const focusedPosition = camera.position.clone()
    const focusedTarget = controls.target.clone()
    const focusedUp = camera.up.clone()
    resetButton?.click()
    cameraOverride = true
    controls.enabled = false
    camera.position.copy(focusedPosition)
    controls.target.copy(focusedTarget)
    camera.up.copy(focusedUp)
    camera.lookAt(focusedTarget)

    animateRoute(route, true, finishClose)
  }

  const onCanvasPointerUp = (event: PointerEvent) => {
    if (open || event.button !== 0) return
    // operation-room.ts updates this live label from the exact Three.js
    // hover target. Reuse it here so this extension reacts only to the physical
    // projector, never the adjacent map or ABOUT door.
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
    if (open) closeProjector()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    closeProjector()
  }
  const onResize = () => {
    if (!open || transitioning) return
    const camera = getCamera()
    const controls = roomControls
    if (!camera || !controls) return
    camera.position.copy(getScreenViewPosition(camera))
    controls.target.copy(SCREEN_TARGET)
    camera.up.set(0, 1, 0)
    camera.lookAt(SCREEN_TARGET)
    alignLibraryToPhysicalScreen()
  }

  showTitleCard()
  canvas.addEventListener('pointerup', onCanvasPointerUp)
  viewFilmsButton?.addEventListener('click', onViewFilms)
  filmstrip.addEventListener('click', onFilmstripClick)
  zoomOutButton?.addEventListener('click', onReturn)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onResize)

  return () => {
    window.cancelAnimationFrame(cameraAnimationFrame)
    iframe.src = 'about:blank'
    cameraOverride = false
    if (roomControls) roomControls.enabled = true
    if (OrbitControls.prototype.update === patchedControlsUpdate) OrbitControls.prototype.update = originalControlsUpdate
    canvas.style.transform = ''
    canvas.style.filter = ''
    if (projectorSurface) {
      projectorSurface.style.background = ''
      projectorSurface.style.border = ''
      projectorSurface.style.boxShadow = ''
    }
    canvas.removeEventListener('pointerup', onCanvasPointerUp)
    viewFilmsButton?.removeEventListener('click', onViewFilms)
    filmstrip.removeEventListener('click', onFilmstripClick)
    zoomOutButton?.removeEventListener('click', onReturn)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('resize', onResize)
    delete root.dataset.projectorView
  }
}
