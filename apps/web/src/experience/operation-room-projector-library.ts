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
const FEED_DELAY_MS = 900

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
  let motorSource: OscillatorNode | null = null
  let gearSource: OscillatorNode | null = null
  let flutterSource: OscillatorNode | null = null
  let stopTimer = 0

  const stopSources = () => {
    window.clearTimeout(stopTimer)
    for (const source of [noiseSource, motorSource, gearSource, flutterSource]) {
      if (!source) continue
      try { source.stop() } catch { /* already stopped */ }
    }
    noiseSource = null
    motorSource = null
    gearSource = null
    flutterSource = null
  }

  const ensureGraph = async () => {
    if (!context) {
      context = new AudioContextClass()
      master = context.createGain()
      master.gain.value = 0.0001

      const compressor = context.createDynamicsCompressor()
      compressor.threshold.value = -26
      compressor.knee.value = 14
      compressor.ratio.value = 2.5
      compressor.attack.value = 0.01
      compressor.release.value = 0.22
      master.connect(compressor)
      compressor.connect(context.destination)
    }
    if (context.state === 'suspended') await context.resume()
  }

  const start = async () => {
    await ensureGraph()
    if (!context || !master || noiseSource || motorSource) return

    window.clearTimeout(stopTimer)

    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
    const samples = buffer.getChannelData(0)
    let previous = 0
    for (let index = 0; index < samples.length; index += 1) {
      const white = Math.random() * 2 - 1
      previous = previous * 0.72 + white * 0.28
      samples[index] = previous
    }

    const noise = context.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const noiseBand = context.createBiquadFilter()
    noiseBand.type = 'bandpass'
    noiseBand.frequency.value = 760
    noiseBand.Q.value = 0.48
    const noiseGain = context.createGain()
    noiseGain.gain.value = 0.12
    noise.connect(noiseBand)
    noiseBand.connect(noiseGain)
    noiseGain.connect(master)

    const motor = context.createOscillator()
    motor.type = 'sawtooth'
    motor.frequency.value = 58
    const motorFilter = context.createBiquadFilter()
    motorFilter.type = 'lowpass'
    motorFilter.frequency.value = 260
    const motorGain = context.createGain()
    motorGain.gain.value = 0.042
    motor.connect(motorFilter)
    motorFilter.connect(motorGain)
    motorGain.connect(master)

    const gear = context.createOscillator()
    gear.type = 'triangle'
    gear.frequency.value = 116
    const gearGain = context.createGain()
    gearGain.gain.value = 0.018
    gear.connect(gearGain)
    gearGain.connect(master)

    const flutter = context.createOscillator()
    flutter.type = 'sine'
    flutter.frequency.value = 13.8
    const flutterGain = context.createGain()
    flutterGain.gain.value = 0.018
    flutter.connect(flutterGain)
    flutterGain.connect(noiseGain.gain)

    noiseSource = noise
    motorSource = motor
    gearSource = gear
    flutterSource = flutter

    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.35)

    noise.start()
    motor.start()
    gear.start()
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
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
    stopTimer = window.setTimeout(stopSources, 340)
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
  let feedTimer = 0
  let roomControls: OrbitControls | null = null
  let focusRoute: FocusRoute | null = null

  const whirr = createProjectorWhirr()

  // Remove the old archive/splash chrome entirely. There should never be a
  // "TECHNICAL BRIEFING" caption or film-library UI in the projected image.
  titleCard?.remove()
  playerHeader?.remove()
  filmstrip?.remove()
  player.hidden = false
  projector.dataset.mode = 'player'
  projector.dataset.feedReady = 'false'

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

  const style = document.createElement('style')
  style.dataset.operationRoomProjectorImmersion = 'true'
  style.textContent = `
    .operation-room__projector-player {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      padding: 0 !important;
    }
    .operation-room__projector-surface {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }
    .operation-room__projector-surface::before,
    .operation-room__projector-surface::after {
      content: none !important;
      display: none !important;
      background: none !important;
      box-shadow: none !important;
    }
    .operation-room__projector-video-shell {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      overflow: hidden !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    .operation-room__projector-video-shell::after {
      content: none !important;
      display: none !important;
    }
    .operation-room__projector-video {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      width: 100% !important;
      border: 0 !important;
      pointer-events: none !important;
      opacity: 0;
      filter: grayscale(1) contrast(1.04) brightness(1.04);
      transform: translate(-50%, -50%);
      transition: opacity 480ms ease;
    }
    .operation-room__projector-library[data-feed-ready='true'] .operation-room__projector-video {
      opacity: .76;
      animation:
        operation-room-film-exposure 430ms steps(2, end) infinite,
        operation-room-film-gate 3.1s steps(1, end) infinite;
    }
    .operation-room__projection-link {
      position: absolute;
      z-index: 8;
      left: 0;
      right: 0;
      cursor: pointer;
      pointer-events: none;
    }
    .operation-room__projector-library[data-feed-ready='true'] .operation-room__projection-link {
      pointer-events: auto;
    }
    .operation-room__projection-link:focus-visible {
      outline: 1px solid rgb(238 231 198 / .7);
      outline-offset: -5px;
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
      0% { opacity: .73; filter: grayscale(1) contrast(1.02) brightness(1.00); }
      25% { opacity: .78; filter: grayscale(1) contrast(1.05) brightness(1.07); }
      50% { opacity: .75; filter: grayscale(1) contrast(1.03) brightness(1.03); }
      75% { opacity: .77; filter: grayscale(1) contrast(1.05) brightness(1.06); }
      100% { opacity: .76; filter: grayscale(1) contrast(1.04) brightness(1.04); }
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

  // The room owns its OrbitControls instance privately. Capture only the one
  // attached to this canvas and suspend its update during the projector dolly.
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
    const visible = open && root.dataset.projectorView === 'open' && projector.dataset.feedReady === 'true' && hasReels
    reelIndicator.hidden = !visible
    previousButton.hidden = !visible
    nextButton.hidden = !visible
    reelIndicator.textContent = hasReels ? `Reel ${selectedIndex + 1} / ${talks.length}` : ''
  }

  const fitIframeToProjection = () => {
    const width = projector.clientWidth
    if (width <= 0) return

    // The physical cloth is taller than a 16:9 film frame. Keep the whole
    // image width and expose illuminated cloth above and below it instead of
    // cropping the sides.
    const videoHeight = width / (16 / 9)
    iframe.style.width = '100%'
    iframe.style.height = `${videoHeight}px`
    projectionLink.style.height = `${videoHeight}px`
    projectionLink.style.top = `calc(50% - ${videoHeight / 2}px)`
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
    window.requestAnimationFrame(fitIframeToProjection)
    if (live) live.textContent = `Projecting reel ${selectedIndex + 1} of ${talks.length}: ${talk.title}`
  }

  const hideFeed = () => {
    window.clearTimeout(feedTimer)
    projector.dataset.feedReady = 'false'
    projector.style.visibility = 'hidden'
    projector.style.opacity = '0'
    projector.style.pointerEvents = 'none'
    iframe.src = 'about:blank'
    updateReelControls()
  }

  const revealFeed = () => {
    if (!open || root.dataset.projectorView !== 'open') return
    loadTalk(selectedIndex)
    projector.style.visibility = 'visible'
    projector.style.pointerEvents = 'auto'
    projector.setAttribute('aria-hidden', 'false')
    window.requestAnimationFrame(() => {
      if (!open) return
      projector.dataset.feedReady = 'true'
      projector.style.opacity = '1'
      updateReelControls()
    })
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

    projector.style.left = `${left}px`
    projector.style.top = `${top}px`
    projector.style.width = `${Math.max(1, width)}px`
    projector.style.height = `${Math.max(1, height)}px`
    projector.style.transform = 'none'
    fitIframeToProjection()
  }

  const setImmersiveScreenStyling = () => {
    // Do not paint another artificial screen on top of the Three.js cloth.
    // The actual projector SpotLight should be the visible illumination and
    // naturally remain visible in the margins around the 16:9 moving image.
    canvas.style.transform = 'none'
    canvas.style.filter = 'none'
    if (projectorSurface) {
      projectorSurface.style.background = 'transparent'
      projectorSurface.style.border = '0'
      projectorSurface.style.boxShadow = 'none'
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
    zoomOutButton.hidden = false
    updateReelControls()

    // Hold on the bare, illuminated cloth for a beat after the camera settles.
    // Only then thread the first reel and fade the picture into the light.
    feedTimer = window.setTimeout(revealFeed, FEED_DELAY_MS)
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
    hideFeed()
    setImmersiveScreenStyling()
    root.dataset.projectorView = 'deploying'
    zoomOutButton.hidden = false
    void whirr.start()
    if (live) live.textContent = 'Projector running. Moving closer to the illuminated screen.'
    beginOpen()
  }

  const finishClose = () => {
    transitioning = false
    cameraOverride = false
    if (roomControls) roomControls.enabled = true
    delete root.dataset.projectorView
    hideFeed()
    zoomOutButton.hidden = true
    canvas.focus({ preventScroll: true })
  }

  const closeProjector = () => {
    if (!open) return
    open = false
    transitioning = true
    window.clearTimeout(feedTimer)
    whirr.stop()
    hideFeed()
    root.dataset.projectorView = 'closing'
    zoomOutButton.hidden = true

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
    if (!open || talks.length === 0 || projector.dataset.feedReady !== 'true') return
    projector.dataset.feedReady = 'false'
    const nextIndex = ((selectedIndex + direction) % talks.length + talks.length) % talks.length
    window.setTimeout(() => {
      if (!open) return
      loadTalk(nextIndex)
      projector.dataset.feedReady = 'true'
      updateReelControls()
    }, 180)
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
    if (!open || event.key !== 'Escape') return
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

  hideFeed()
  canvas.addEventListener('pointerup', onCanvasPointerUp)
  previousButton.addEventListener('click', onPrevious)
  nextButton.addEventListener('click', onNext)
  zoomOutButton.addEventListener('click', onReturn)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onResize)

  return () => {
    window.cancelAnimationFrame(cameraAnimationFrame)
    window.clearTimeout(feedTimer)
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
