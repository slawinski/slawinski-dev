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
const FEED_DELAY_MS = 650
const LEADER_STEP_MS = 700
const LEADER_BLACKOUT_DELAY_MS = LEADER_STEP_MS + Math.round(LEADER_STEP_MS * 0.55)
const FEED_VERTICAL_POSITION = 0.54

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
    return {
      start: async () => undefined,
      stop: () => undefined,
      beep: async () => undefined,
      dispose: () => undefined,
    }
  }

  let context: AudioContext | null = null
  let master: GainNode | null = null
  let noiseSource: AudioBufferSourceNode | null = null
  let motorSource: OscillatorNode | null = null
  let gearSource: OscillatorNode | null = null
  let flutterSource: OscillatorNode | null = null
  let noiseBand: BiquadFilterNode | null = null
  let noiseGain: GainNode | null = null
  let motorGain: GainNode | null = null
  let gearGain: GainNode | null = null
  let flutterGain: GainNode | null = null
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
    noiseBand = null
    noiseGain = null
    motorGain = null
    gearGain = null
    flutterGain = null
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

  const rampUp = () => {
    if (!context || !master || !motorSource || !gearSource || !flutterSource || !noiseBand || !noiseGain || !motorGain || !gearGain || !flutterGain) return

    const now = context.currentTime
    const end = now + 1.15
    window.clearTimeout(stopTimer)

    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
    master.gain.exponentialRampToValueAtTime(0.075, end)

    motorSource.frequency.cancelScheduledValues(now)
    motorSource.frequency.setValueAtTime(Math.max(motorSource.frequency.value, 24), now)
    motorSource.frequency.exponentialRampToValueAtTime(58, end)

    gearSource.frequency.cancelScheduledValues(now)
    gearSource.frequency.setValueAtTime(Math.max(gearSource.frequency.value, 48), now)
    gearSource.frequency.exponentialRampToValueAtTime(116, end)

    flutterSource.frequency.cancelScheduledValues(now)
    flutterSource.frequency.setValueAtTime(Math.max(flutterSource.frequency.value, 4.8), now)
    flutterSource.frequency.exponentialRampToValueAtTime(13.8, end)

    noiseBand.frequency.cancelScheduledValues(now)
    noiseBand.frequency.setValueAtTime(Math.max(noiseBand.frequency.value, 300), now)
    noiseBand.frequency.exponentialRampToValueAtTime(760, end)

    noiseGain.gain.cancelScheduledValues(now)
    noiseGain.gain.setValueAtTime(Math.max(noiseGain.gain.value, 0.010), now)
    noiseGain.gain.exponentialRampToValueAtTime(0.10, end)

    motorGain.gain.cancelScheduledValues(now)
    motorGain.gain.setValueAtTime(Math.max(motorGain.gain.value, 0.008), now)
    motorGain.gain.exponentialRampToValueAtTime(0.035, end)

    gearGain.gain.cancelScheduledValues(now)
    gearGain.gain.setValueAtTime(Math.max(gearGain.gain.value, 0.003), now)
    gearGain.gain.exponentialRampToValueAtTime(0.014, end)

    flutterGain.gain.cancelScheduledValues(now)
    flutterGain.gain.setValueAtTime(Math.max(flutterGain.gain.value, 0.002), now)
    flutterGain.gain.exponentialRampToValueAtTime(0.014, end)
  }

  const start = async () => {
    await ensureGraph()
    if (!context || !master) return

    if (noiseSource && motorSource && gearSource && flutterSource) {
      rampUp()
      return
    }

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
    const band = context.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 300
    band.Q.value = 0.48
    const noiseLevel = context.createGain()
    noiseLevel.gain.value = 0.010
    noise.connect(band)
    band.connect(noiseLevel)
    noiseLevel.connect(master)

    const motor = context.createOscillator()
    motor.type = 'sawtooth'
    motor.frequency.value = 24
    const motorFilter = context.createBiquadFilter()
    motorFilter.type = 'lowpass'
    motorFilter.frequency.value = 260
    const motorLevel = context.createGain()
    motorLevel.gain.value = 0.008
    motor.connect(motorFilter)
    motorFilter.connect(motorLevel)
    motorLevel.connect(master)

    const gear = context.createOscillator()
    gear.type = 'triangle'
    gear.frequency.value = 48
    const gearLevel = context.createGain()
    gearLevel.gain.value = 0.003
    gear.connect(gearLevel)
    gearLevel.connect(master)

    const flutter = context.createOscillator()
    flutter.type = 'sine'
    flutter.frequency.value = 4.8
    const flutterLevel = context.createGain()
    flutterLevel.gain.value = 0.002
    flutter.connect(flutterLevel)
    flutterLevel.connect(noiseLevel.gain)

    noiseSource = noise
    motorSource = motor
    gearSource = gear
    flutterSource = flutter
    noiseBand = band
    noiseGain = noiseLevel
    motorGain = motorLevel
    gearGain = gearLevel
    flutterGain = flutterLevel

    noise.start()
    motor.start()
    gear.start()
    flutter.start()
    rampUp()
  }

  const beep = async () => {
    await ensureGraph()
    if (!context) return

    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.13)
  }

  const stop = () => {
    if (!context || !master || !motorSource || !gearSource || !flutterSource || !noiseBand || !noiseGain || !motorGain || !gearGain || !flutterGain) {
      stopSources()
      return
    }

    const now = context.currentTime
    const end = now + 1.15

    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
    master.gain.exponentialRampToValueAtTime(0.0001, end)

    motorSource.frequency.cancelScheduledValues(now)
    motorSource.frequency.setValueAtTime(Math.max(motorSource.frequency.value, 20), now)
    motorSource.frequency.exponentialRampToValueAtTime(20, end)

    gearSource.frequency.cancelScheduledValues(now)
    gearSource.frequency.setValueAtTime(Math.max(gearSource.frequency.value, 40), now)
    gearSource.frequency.exponentialRampToValueAtTime(40, end)

    flutterSource.frequency.cancelScheduledValues(now)
    flutterSource.frequency.setValueAtTime(Math.max(flutterSource.frequency.value, 4), now)
    flutterSource.frequency.exponentialRampToValueAtTime(4, end)

    noiseBand.frequency.cancelScheduledValues(now)
    noiseBand.frequency.setValueAtTime(Math.max(noiseBand.frequency.value, 260), now)
    noiseBand.frequency.exponentialRampToValueAtTime(260, end)

    noiseGain.gain.cancelScheduledValues(now)
    noiseGain.gain.setValueAtTime(Math.max(noiseGain.gain.value, 0.0001), now)
    noiseGain.gain.exponentialRampToValueAtTime(0.0015, end)

    motorGain.gain.cancelScheduledValues(now)
    motorGain.gain.setValueAtTime(Math.max(motorGain.gain.value, 0.0001), now)
    motorGain.gain.exponentialRampToValueAtTime(0.0008, end)

    gearGain.gain.cancelScheduledValues(now)
    gearGain.gain.setValueAtTime(Math.max(gearGain.gain.value, 0.0001), now)
    gearGain.gain.exponentialRampToValueAtTime(0.0003, end)

    flutterGain.gain.cancelScheduledValues(now)
    flutterGain.gain.setValueAtTime(Math.max(flutterGain.gain.value, 0.0001), now)
    flutterGain.gain.exponentialRampToValueAtTime(0.0002, end)

    window.clearTimeout(stopTimer)
    stopTimer = window.setTimeout(stopSources, 1220)
  }

  const dispose = () => {
    stopSources()
    if (context && context.state !== 'closed') void context.close()
    context = null
    master = null
  }

  return { start, stop, beep, dispose }
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
  const leaderTimers: number[] = []
  let roomControls: OrbitControls | null = null
  let focusRoute: FocusRoute | null = null

  const whirr = createProjectorWhirr()

  titleCard?.remove()
  playerHeader?.remove()
  filmstrip?.remove()
  player.hidden = false
  projector.dataset.mode = 'player'
  projector.dataset.feedReady = 'false'

  const controlClassName = resetButton?.className || 'operation-room__control'

  const reelIndicator = document.createElement('span')
  reelIndicator.className = controlClassName
  reelIndicator.hidden = true
  reelIndicator.setAttribute('role', 'status')

  const previousButton = document.createElement('button')
  previousButton.type = 'button'
  previousButton.className = controlClassName
  previousButton.textContent = 'Previous reel'
  previousButton.hidden = true

  const nextButton = document.createElement('button')
  nextButton.type = 'button'
  nextButton.className = controlClassName
  nextButton.textContent = 'Next reel'
  nextButton.hidden = true

  controlsBar.insertBefore(reelIndicator, zoomOutButton)
  controlsBar.insertBefore(previousButton, zoomOutButton)
  controlsBar.insertBefore(nextButton, zoomOutButton)

  const countdown = document.createElement('div')
  countdown.className = 'operation-room__projector-countdown'
  countdown.hidden = true
  countdown.setAttribute('aria-hidden', 'true')
  countdown.innerHTML = `
    <div class="operation-room__leader" data-leader-frame>
      <div class="operation-room__leader-cross operation-room__leader-cross--vertical"></div>
      <div class="operation-room__leader-cross operation-room__leader-cross--horizontal"></div>
      <div class="operation-room__leader-ring operation-room__leader-ring--outer"></div>
      <div class="operation-room__leader-ring operation-room__leader-ring--inner"></div>
      <div class="operation-room__leader-sweep"></div>
      <div class="operation-room__leader-number" data-leader-number>3</div>
      <div class="operation-room__leader-grain"></div>
    </div>
    <div class="operation-room__leader-black" data-leader-black hidden></div>
  `
  videoShell.appendChild(countdown)

  const leaderNumber = countdown.querySelector<HTMLElement>('[data-leader-number]')
  const leaderBlack = countdown.querySelector<HTMLElement>('[data-leader-black]')

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
    .operation-room__projector-surface::after,
    .operation-room__projector-video-shell::after {
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
    .operation-room__projector-video {
      position: absolute !important;
      left: 50% !important;
      top: ${FEED_VERTICAL_POSITION * 100}% !important;
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
    .operation-room__projector-countdown {
      position: absolute;
      z-index: 7;
      left: 0;
      width: 100%;
      overflow: hidden;
      pointer-events: none;
      user-select: none;
      background: transparent;
    }
    .operation-room__projector-countdown[hidden] { display: none !important; }
    .operation-room__leader {
      position: absolute;
      inset: 0;
      overflow: hidden;
      background:
        radial-gradient(circle at 48% 44%, rgb(232 232 228 / .28), transparent 54%),
        linear-gradient(90deg, #b7b7b3 0%, #d0d0cd 47%, #b9b9b6 100%);
      filter: grayscale(1) contrast(1.13) brightness(.96);
      animation:
        operation-room-leader-flicker 170ms steps(2, end) infinite,
        operation-room-leader-jitter 2.7s steps(1, end) infinite;
    }
    .operation-room__leader-cross {
      position: absolute;
      z-index: 2;
      background: rgb(19 19 18 / .72);
    }
    .operation-room__leader-cross--vertical {
      top: 0;
      bottom: 0;
      left: 50%;
      width: 2px;
      transform: translateX(-50%);
    }
    .operation-room__leader-cross--horizontal {
      top: 50%;
      left: 0;
      right: 0;
      height: 2px;
      transform: translateY(-50%);
    }
    .operation-room__leader-ring {
      position: absolute;
      z-index: 3;
      left: 50%;
      top: 50%;
      aspect-ratio: 1;
      border: 3px solid rgb(247 247 241 / .82);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-sizing: border-box;
    }
    .operation-room__leader-ring--outer { width: min(72%, 68vh); }
    .operation-room__leader-ring--inner { width: min(63%, 59vh); }
    .operation-room__leader-sweep {
      position: absolute;
      z-index: 1;
      left: 50%;
      top: 50%;
      width: 150%;
      aspect-ratio: 1;
      background: conic-gradient(
        from -90deg,
        rgb(43 43 41 / .27) 0deg,
        rgb(43 43 41 / .27) 44deg,
        transparent 44deg,
        transparent 360deg
      );
      transform: translate(-50%, -50%) rotate(0deg);
      transform-origin: center;
      animation: operation-room-leader-sweep ${LEADER_STEP_MS}ms linear infinite;
    }
    .operation-room__leader-sweep::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 54%;
      height: 2px;
      background: rgb(14 14 13 / .78);
      transform-origin: 0 50%;
      transform: rotate(-45deg);
    }
    .operation-room__leader-number {
      position: absolute;
      z-index: 5;
      left: 50%;
      top: 50%;
      color: rgb(7 7 7 / .94);
      font-family: Arial, Helvetica, sans-serif;
      font-size: clamp(6rem, 22vw, 14rem);
      font-weight: 500;
      line-height: .8;
      transform: translate(-50%, -50%);
      text-rendering: geometricPrecision;
    }
    .operation-room__leader-grain {
      position: absolute;
      z-index: 6;
      inset: -5%;
      background:
        repeating-linear-gradient(0deg, rgb(0 0 0 / .035) 0 1px, transparent 1px 3px),
        repeating-linear-gradient(90deg, rgb(255 255 255 / .025) 0 1px, transparent 1px 5px);
      mix-blend-mode: multiply;
      opacity: .72;
      animation: operation-room-leader-grain 240ms steps(2, end) infinite;
    }
    .operation-room__leader-black {
      position: absolute;
      z-index: 10;
      inset: 0;
      background: #030303;
      opacity: .96;
      animation: operation-room-black-frame 120ms steps(2, end) infinite;
    }
    .operation-room__leader-black[hidden] { display: none !important; }
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
    @keyframes operation-room-leader-sweep {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    @keyframes operation-room-leader-flicker {
      0%, 100% { opacity: .92; filter: grayscale(1) contrast(1.10) brightness(.95); }
      50% { opacity: .84; filter: grayscale(1) contrast(1.16) brightness(1.01); }
    }
    @keyframes operation-room-leader-jitter {
      0%, 46%, 54%, 100% { transform: translate(0, 0); }
      47% { transform: translate(.5px, -.35px); }
      49% { transform: translate(-.45px, .25px); }
      52% { transform: translate(.2px, .45px); }
    }
    @keyframes operation-room-leader-grain {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-1px, 1px); }
    }
    @keyframes operation-room-black-frame {
      0%, 100% { opacity: .96; }
      50% { opacity: .92; }
    }
    @media (prefers-reduced-motion: reduce) {
      .operation-room__projector-video,
      .operation-room__leader,
      .operation-room__leader-sweep,
      .operation-room__leader-grain,
      .operation-room__leader-black { animation: none !important; }
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

  const originalRendererRender = THREE.WebGLRenderer.prototype.render
  let projectorReels: [THREE.Group, THREE.Group] | null = null
  let reelAngles: [number, number] = [0, 0]
  let reelSpeed = 0
  let lastReelTime = performance.now()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  const findProjectorReels = (scene: THREE.Object3D) => {
    const matches: THREE.Group[] = []
    scene.traverse((object: THREE.Object3D) => {
      if (!(object instanceof THREE.Group)) return
      if (
        Math.abs(object.position.x + 0.6) < 0.03 &&
        Math.abs(object.position.y - 1.88) < 0.03 &&
        Math.abs(object.position.z - 3.9) < 0.03 &&
        Math.abs(object.scale.x - 0.8) < 0.03
      ) matches.push(object)
    })

    const projectorGroup = matches[0]
    if (!projectorGroup) return null

    const candidates: THREE.Group[] = projectorGroup.children.filter(
      (child: THREE.Object3D): child is THREE.Group => child instanceof THREE.Group,
    )
    const upper = candidates.find(
      (child: THREE.Group) => Math.abs(child.position.y - 1.29) < 0.08 && Math.abs(child.position.z - 0.40) < 0.08,
    )
    const lower = candidates.find(
      (child: THREE.Group) => Math.abs(child.position.y - 0.39) < 0.08 && Math.abs(child.position.z - 0.40) < 0.08,
    )
    if (!upper || !lower) return null
    return [upper, lower] as [THREE.Group, THREE.Group]
  }

  const patchedRendererRender = function (
    this: THREE.WebGLRenderer,
    scene: THREE.Object3D,
    camera: THREE.Camera,
  ) {
    if (this.domElement === canvas) {
      if (!projectorReels) {
        projectorReels = findProjectorReels(scene)
        if (projectorReels) reelAngles = [projectorReels[0].rotation.z, projectorReels[1].rotation.z]
      }

      if (projectorReels) {
        const now = performance.now()
        const dt = Math.min((now - lastReelTime) / 1000, 0.1)
        lastReelTime = now
        const target = open && !reducedMotion.matches ? 1 : 0
        const response = target > reelSpeed ? 3.0 : 2.45
        reelSpeed = THREE.MathUtils.damp(reelSpeed, target, response, dt)
        if (Math.abs(reelSpeed - target) < 0.002) reelSpeed = target

        reelAngles[0] -= dt * 4.5 * reelSpeed
        reelAngles[1] += dt * 3.9 * reelSpeed
        projectorReels[0].rotation.z = reelAngles[0]
        projectorReels[1].rotation.z = reelAngles[1]
      }
    }

    return originalRendererRender.call(this, scene, camera)
  }
  THREE.WebGLRenderer.prototype.render = patchedRendererRender

  const clearLeaderTimers = () => {
    while (leaderTimers.length) {
      const timer = leaderTimers.pop()
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }

  const resetLeader = () => {
    if (leaderNumber) leaderNumber.textContent = '3'
    if (leaderBlack) leaderBlack.hidden = true
  }

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
    const height = projector.clientHeight
    if (width <= 0 || height <= 0) return

    const videoHeight = width / (16 / 9)
    const centreY = height * FEED_VERTICAL_POSITION
    const top = centreY - videoHeight / 2
    iframe.style.width = '100%'
    iframe.style.height = `${videoHeight}px`
    projectionLink.style.height = `${videoHeight}px`
    projectionLink.style.top = `${top}px`
    countdown.style.height = `${videoHeight}px`
    countdown.style.top = `${top}px`
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
    clearLeaderTimers()
    resetLeader()
    countdown.hidden = true
    projector.dataset.feedReady = 'false'
    projector.style.visibility = 'hidden'
    projector.style.opacity = '0'
    projector.style.pointerEvents = 'none'
    iframe.src = 'about:blank'
    updateReelControls()
  }

  const revealFeed = () => {
    if (!open || root.dataset.projectorView !== 'open') return
    countdown.hidden = true
    resetLeader()
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

  const runCountdownLeader = () => {
    if (!open || root.dataset.projectorView !== 'open') return
    clearLeaderTimers()
    resetLeader()
    projector.style.visibility = 'visible'
    projector.style.opacity = '1'
    projector.style.pointerEvents = 'none'
    projector.setAttribute('aria-hidden', 'false')
    projector.dataset.feedReady = 'false'
    iframe.src = 'about:blank'
    countdown.hidden = false
    fitIframeToProjection()

    leaderTimers.push(window.setTimeout(() => {
      if (!open) return
      if (leaderNumber) leaderNumber.textContent = '2'
      void whirr.beep()
    }, LEADER_STEP_MS))

    // Mimic the abrupt black splice visible on old countdown leaders. It cuts
    // in after the beep, between 2 and the final internal 1 beat, and remains
    // black until the leader duration is complete and the actual reel starts.
    leaderTimers.push(window.setTimeout(() => {
      if (!open || !leaderBlack) return
      leaderBlack.hidden = false
    }, LEADER_BLACKOUT_DELAY_MS))

    leaderTimers.push(window.setTimeout(() => {
      if (!open) return
      if (leaderNumber) leaderNumber.textContent = '1'
    }, LEADER_STEP_MS * 2))

    leaderTimers.push(window.setTimeout(() => {
      if (!open) return
      revealFeed()
    }, LEADER_STEP_MS * 3))
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

    feedTimer = window.setTimeout(runCountdownLeader, FEED_DELAY_MS)
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
    lastReelTime = performance.now()
    selectedIndex = 0
    hideFeed()
    setImmersiveScreenStyling()
    root.dataset.projectorView = 'deploying'
    zoomOutButton.hidden = false
    document.dispatchEvent(new Event('operation-room:projector-start'))
    void whirr.start()
    if (live) live.textContent = 'Projector motor starting. Moving closer to the illuminated screen.'
    beginOpen()
  }

  const finishClose = () => {
    transitioning = false
    cameraOverride = false
    if (roomControls) roomControls.enabled = true
    delete root.dataset.projectorView
    hideFeed()
    zoomOutButton.hidden = true
    document.dispatchEvent(new Event('operation-room:projector-stop'))
    canvas.focus({ preventScroll: true })
  }

  const closeProjector = () => {
    if (!open) return
    open = false
    lastReelTime = performance.now()
    transitioning = true
    window.clearTimeout(feedTimer)
    clearLeaderTimers()
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
    clearLeaderTimers()
    if (open) document.dispatchEvent(new Event('operation-room:projector-stop'))
    whirr.dispose()
    iframe.src = 'about:blank'
    cameraOverride = false
    if (roomControls) roomControls.enabled = true
    if (OrbitControls.prototype.update === patchedControlsUpdate) OrbitControls.prototype.update = originalControlsUpdate
    if (THREE.WebGLRenderer.prototype.render === patchedRendererRender) THREE.WebGLRenderer.prototype.render = originalRendererRender
    canvas.style.transform = ''
    canvas.style.filter = ''
    if (projectorSurface) {
      projectorSurface.style.background = ''
      projectorSurface.style.border = ''
      projectorSurface.style.boxShadow = ''
    }
    projectionLink.remove()
    countdown.remove()
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
