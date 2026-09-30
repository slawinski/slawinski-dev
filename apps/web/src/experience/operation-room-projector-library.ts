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

const easeMotionControl = (value: number) => value * value * value * (value * (value * 6 - 15) + 10)

const createProjectorWhirr = () => {
  type AudioContextWindow = typeof window & { webkitAudioContext?: typeof AudioContext }
  const AudioContextClass = window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext
  if (!AudioContextClass) {
    return { start: async () => undefined, stop: () => undefined, dispose: () => undefined }
  }

  let context: AudioContext | null = null
  let master: GainNode | null = null
  let noiseSource: AudioBufferSourceNode | null = null
  let humSource: OscillatorNode | null = null
  let flutterSource: OscillatorNode | null = null

  const stopSources = () => {
    for (const source of [noiseSource, humSource, flutterSource]) {
      if (!source) continue
      try { source.stop() } catch { /* already stopped */ }
    }
    noiseSource = null
    humSource = null
    flutterSource = null
  }

  const ensureGraph = async () => {
    if (!context) {
      context = new AudioContextClass()
      master = context.createGain()
      master.gain.value = 0.0001
      master.connect(context.destination)
    }
    if (context.state === 'suspended') await context.resume()
  }

  const start = async () => {
    await ensureGraph()
    if (!context || !master || noiseSource || humSource) return

    const seconds = 2
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate)
    const samples = buffer.getChannelData(0)
    let previous = 0
    for (let index = 0; index < samples.length; index += 1) {
      const white = Math.random() * 2 - 1
      previous = previous * 0.78 + white * 0.22
      samples[index] = previous * 0.72
    }

    const noise = context.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const noiseFilter = context.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 620
    noiseFilter.Q.value = 0.62
    const noiseGain = context.createGain()
    noiseGain.gain.value = 0.022
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(master)

    const hum = context.createOscillator()
    hum.type = 'sawtooth'
    hum.frequency.value = 54
    const humFilter = context.createBiquadFilter()
    humFilter.type = 'lowpass'
    humFilter.frequency.value = 240
    const humGain = context.createGain()
    humGain.gain.value = 0.010
    hum.connect(humFilter)
    humFilter.connect(humGain)
    humGain.connect(master)

    const flutter = context.createOscillator()
    flutter.type = 'sine'
    flutter.frequency.value = 13.5
    const flutterGain = context.createGain()
    flutterGain.gain.value = 0.0045
    flutter.connect(flutterGain)
    flutterGain.connect(noiseGain.gain)

    noiseSource = noise
    humSource = hum
    flutterSource = flutter

    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
    master.gain.exponentialRampToValueAtTime(0.055, now + 0.45)
    noise.start()
    hum.start()
    flutter.start()
  }

  const stop = () => {
    if (!context || !master) {
      stopSources()
      return
    }

    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
    window.setTimeout(stopSources, 320)
  }

  const dispose = () => {
    stopSources()
    if (context && context.state !== 'closed') void context.close()
    context = null
    master = null
  }

  return { start, stop, dispose }
}

export const installOperationRoomProjectorLibrary = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-operation-room-canvas]')
  const live = root.querySelector<HTMLElement>('[data-operation-room-live]')
  const projector = root.querySelector<HTMLElement>('[data-operation-room-projector-library]')
  const projectorSurface = root.querySelector<HTMLElement>('.operation-room__projector-surface')
  const titleCard = root.querySelector<HTMLElement>('[data-projector-title-card]')
  const player = root.querySelector<HTMLElement>('[data-projector-player]')
  const playerHeader = root.querySelector<HTMLElement>('.operation-room__projector-header')
  const videoShell = root.querySelector<HTMLElement>('.operation-room__projector-video-shell')
  const iframe = root.querySelector<HTMLIFrameElement>('[data-projector-iframe]')
  const filmstrip = root.querySelector<HTMLElement>('[data-projector-filmstrip]')
  const zoomOutButton = root.querySelector<HTMLButtonElement>('[data-operation-room-zoom-out]')
  const resetButton = root.querySelector<HTMLButtonElement>('[data-operation-room-reset]')
  const controlsBar = root.querySelector<HTMLElement>('.operation-room__controls')
  const talksNode = root.querySelector<HTMLScriptElement>('[data-operation-room-talks]')

  if (!canvas || !projector || !player || !videoShell || !iframe || !zoomOutButton || !controlsBar) {
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

  const whirr = createProjectorWhirr()

  const reelIndicator = document.createElement('span')
  reelIndicator.className = 'operation-room__control operation-room__reel-indicator'
  reelIndicator.hidden = true

  const previousButton = document.createElement('button')
  previousButton.type = 'button'
  previousButton.className = 'operation-room__control operation-room__reel-control'
  previousButton.textContent = 'Previous reel'
  previousButton.hidden = true

  const nextButton = document.createElement('button')
  nextButton.type = 'button'
  nextButton.className = 'operation-room__control operation-room__reel-control'
  nextButton.textContent = 'Next reel'
  nextButton.hidden = true

  controlsBar.insertBefore(reelIndicator, zoomOutButton)
  controlsBar.insertBefore(previousButton, zoomOutButton)
  controlsBar.insertBefore(nextButton, zoomOutButton)

  const projectionLink = document.createElement('a')
  projectionLink.className = 'operation-room__projection-link'
  projectionLink.target = '_blank'
  projectionLink.rel = 'noreferrer'
  projectionLink.setAttribute('aria-label', 'Open projected talk on YouTube')
  videoShell.appendChild(projectionLink)

  if (titleCard) titleCard.hidden = true
  if (playerHeader) playerHeader.hidden = true
  if (filmstrip) filmstrip.hidden = true
  player.hidden = false
  projector.dataset.mode = 'player'

  const style = document.createElement('style')
  style.dataset.operationRoomProjectorImmersion = 'true'
  style.textContent = `
    .operation-room__projector-player {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      padding: 0 !important;
    }
    .operation-room__projector-video-shell {
      position: relative !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      overflow: hidden !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    .operation-room__projector-video-shell::after {
      z-index: 4;
      border: 0 !important;
      box-shadow: inset 0 0 5rem rgb(20 18 13 / .34) !important;
    }
    .operation-room__projector-video {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      border: 0 !important;
      pointer-events: none !important;
      filter: grayscale(1) sepia(.08) contrast(1.16) brightness(.88);
      opacity: .82;
      mix-blend-mode: multiply;
      transform: translate(-50%, -50%);
      animation:
        operation-room-film-exposure 430ms steps(2, end) infinite,
        operation-room-film-gate 3.1s steps(1, end) infinite;
    }
    .operation-room__projection-link {
      position: absolute;
      z-index: 8;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      cursor: pointer;
    }
    .operation-room__projection-link:focus-visible {
      outline: 1px solid rgb(238 231 198 / .7);
      outline-offset: -5px;
    }
    .operation-room__projector-surface::before {
      display: none !important;
      content: none !important;
      background: none !important;
      animation: none !important;
    }
    .operation-room__reel-indicator {
      display: inline-flex;
      align-items: center;
      cursor: default;
      pointer-events: none;
    }
    .operation-room__reel-indicator[hidden],
    .operation-room__reel-control[hidden] { display: none !important; }
    @keyframes operation-room-film-exposure {
      0% { opacity: .80; filter: grayscale(1) sepia(.08) contrast(1.15) brightness(.86); }
      25% { opacity: .84; filter: grayscale(1) sepia(.07) contrast(1.17) brightness(.91); }
      50% { opacity: .81; filter: grayscale(1) sepia(.09) contrast(1.16) brightness(.87); }
      75% { opacity: .83; filter: grayscale(1) sepia(.08) contrast(1.18) brightness(.90); }
      100% { opacity: .82; filter: grayscale(1) sepia(.08) contrast(1.16) brightness(.88); }
    }
    @keyframes operation-room-film-gate {
      0%, 84%, 100% { transform: translate(-50%, -50%); }
      85% { transform: translate(calc(-50% + .8px), calc(-50% - .5px)); }
      87% { transform: translate(calc(-50% - .5px), calc(-50% + .4px)); }
      89% { transform: translate(-50%, -50%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .operation-room__projector-video { animation: none !important; }
    }
  `
  root.appendChild(style)

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

  const updateReelControls = () => {
    const hasReels = talks.length > 0
    const visible = open && root.dataset.projectorView === 'open' && hasReels
    reelIndicator.hidden = !visible
    previousButton.hidden = !visible
    nextButton.hidden = !visible
    reelIndicator.textContent = hasReels ? `Reel ${selectedIndex + 1} / ${talks.length}` : ''
  }

  const fitIframeToProjection = () => {
    const width = projector.clientWidth
    if (width <= 0) return

    // Preserve the entire 16:9 source frame. The physical cloth is taller than
    // the video, so the unused cloth remains visible above and below the image
    // instead of cropping the left/right edges of the talk.
    const videoHeight = width * 9 / 16
    iframe.style.width = '100%'
    iframe.style.height = `${videoHeight}px`
    projectionLink.style.width = '100%'
    projectionLink.style.height = `${videoHeight}px`
  }

  const loadTalk = (index: number) => {
    if (talks.length === 0) {
      iframe.src = 'about:blank'
      projectionLink.removeAttribute('href')
      updateReelControls()
      return
    }

    const normalizedIndex = ((index % talks.length) + talks.length) % talks.length
    const talk = talks[normalizedIndex]
    const source = parseYouTubeSource(talk.videoUrl)
    if (!source) return

    selectedIndex = normalizedIndex
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      controls: '0',
      playsinline: '1',
      rel: '0',
      fs: '0',
      disablekb: '1',
      modestbranding: '1',
      iv_load_policy: '3',
    })
    if (source.start > 0) params.set('start', String(source.start))

    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.id)}?${params.toString()}`
    iframe.title = `Projected film: ${talk.title}`
    projectionLink.href = talk.videoUrl
    projectionLink.setAttribute('aria-label', `Open ${talk.title} on YouTube`)
    updateReelControls()
    window.requestAnimationFrame(fitIframeToProjection)
    if (live) live.textContent = `Projecting reel ${selectedIndex + 1} of ${talks.length}: ${talk.title}`
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
    const insetX = width * 0.018
    const insetY = height * 0.018

    projector.style.left = `${left + insetX}px`
    projector.style.top = `${top + insetY}px`
    projector.style.width = `${Math.max(1, width - insetX * 2)}px`
    projector.style.height = `${Math.max(1, height - insetY * 2)}px`
    projector.style.transform = 'none'
    fitIframeToProjection()
  }

  const setImmersiveScreenStyling = () => {
    canvas.style.transform = 'none'
    canvas.style.filter = 'none'
    if (projectorSurface) {
      projectorSurface.style.background = 'rgb(235 230 207 / .12)'
      projectorSurface.style.border = '0'
      projectorSurface.style.boxShadow = 'inset 0 0 5rem rgb(36 32 20 / .22)'
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
    zoomOutButton.hidden = false
    updateReelControls()
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
    selectedIndex = 0
    root.dataset.projectorView = 'deploying'
    setImmersiveScreenStyling()
    projector.setAttribute('aria-hidden', 'true')
    zoomOutButton.hidden = false
    loadTalk(0)
    void whirr.start()
    updateReelControls()
    if (live) live.textContent = 'Projector running. Moving closer to the screen.'
    beginOpen()
  }

  const finishClose = () => {
    transitioning = false
    cameraOverride = false
    if (roomControls) roomControls.enabled = true
    delete root.dataset.projectorView
    iframe.src = 'about:blank'
    projector.setAttribute('aria-hidden', 'true')
    zoomOutButton.hidden = true
    updateReelControls()
    canvas.focus({ preventScroll: true })
  }

  const closeProjector = () => {
    if (!open) return
    open = false
    transitioning = true
    whirr.stop()
    projector.setAttribute('aria-hidden', 'true')
    root.dataset.projectorView = 'closing'
    zoomOutButton.hidden = true
    updateReelControls()

    const camera = getCamera()
    const controls = roomControls
    const route = focusRoute
    if (!camera || !controls || !route) {
      resetButton?.click()
      finishClose()
      return
    }

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

  const changeReel = (direction: 1 | -1) => {
    if (!open || talks.length === 0) return
    loadTalk(selectedIndex + direction)
  }

  const onCanvasPointerUp = (event: PointerEvent) => {
    if (open || event.button !== 0) return
    if (live?.textContent?.trim() !== 'SPEAKING selected') return
    openProjector()
  }

  const onPrevious = () => changeReel(-1)
  const onNext = () => changeReel(1)
  const onReturn = () => {
    if (open) closeProjector()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (!open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      closeProjector()
    }
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

  canvas.addEventListener('pointerup', onCanvasPointerUp)
  previousButton.addEventListener('click', onPrevious)
  nextButton.addEventListener('click', onNext)
  zoomOutButton.addEventListener('click', onReturn)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onResize)

  return () => {
    window.cancelAnimationFrame(cameraAnimationFrame)
    whirr.dispose()
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
    projectionLink.remove()
    reelIndicator.remove()
    previousButton.remove()
    nextButton.remove()
    style.remove()
    canvas.removeEventListener('pointerup', onCanvasPointerUp)
    previousButton.removeEventListener('click', onPrevious)
    nextButton.removeEventListener('click', onNext)
    zoomOutButton.removeEventListener('click', onReturn)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('resize', onResize)
    delete root.dataset.projectorView
  }
}
