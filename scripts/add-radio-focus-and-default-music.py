from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    if old not in text:
        raise SystemExit(f'{label}: pattern not found')
    path.write_text(text.replace(old, new, 1))


room = Path('apps/web/src/experience/operation-room.ts')

replace_once(
    room,
    """  const live = root.querySelector<HTMLElement>('[data-operation-room-live]')
  if (!canvas) return () => undefined
""",
    """  const live = root.querySelector<HTMLElement>('[data-operation-room-live]')
  const zoomOutButton = root.querySelector<HTMLButtonElement>('[data-operation-room-zoom-out]')
  if (!canvas) return () => undefined
""",
    'zoom-out button query',
)

replace_once(
    room,
    """  const MAP_TARGET = new THREE.Vector3(WORLD.map.x, WORLD.map.y, WORLD.map.z + 0.06)
  const TARGET_BOUNDS = { minX: -6, maxX: 4, minY: 0.8, maxY: 5.2, minZ: -5.8, maxZ: 4 }
""",
    """  const MAP_TARGET = new THREE.Vector3(WORLD.map.x, WORLD.map.y, WORLD.map.z + 0.06)
  const RADIO_TARGET = new THREE.Vector3(WORLD.radioDesk.x, 1.92, WORLD.radioDesk.z + 0.04)
  const TARGET_BOUNDS = { minX: -6, maxX: 4, minY: 0.8, maxY: 5.2, minZ: -5.8, maxZ: 4 }
""",
    'radio target',
)

replace_once(
    room,
    """  let viewMode: 'home' | 'transition' | 'map' = 'home'
  let cameraTransition: {
    startTime: number
    duration: number
    path: THREE.CatmullRomCurve3
    startTarget: THREE.Vector3
    endTarget: THREE.Vector3
  } | null = null
""",
    """  let viewMode: 'home' | 'transition' | 'map' | 'radio' = 'home'
  let cameraTransition: {
    startTime: number
    duration: number
    path: THREE.CatmullRomCurve3
    startTarget: THREE.Vector3
    endTarget: THREE.Vector3
    destination: 'home' | 'map' | 'radio'
  } | null = null
""",
    'camera transition state',
)

replace_once(
    room,
    """  const resize = () => {
    const width = root.clientWidth
    const height = root.clientHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.fov = 54
    camera.updateProjectionMatrix()
    if (viewMode === 'map') {
      camera.position.copy(getMapViewPosition())
      cameraTarget.copy(MAP_TARGET)
      controls.target.copy(MAP_TARGET)
    }
  }
""",
    """  const getRadioViewPosition = () => {
    // Keep the whole communications bench in frame while moving the camera
    // physically through the room. This is a real dolly move, not a CSS/FOV fake.
    const frameWidth = WORLD.radioDesk.width + 0.45
    const frameHeight = 2.55
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (frameHeight * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (frameWidth * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.06
    return new THREE.Vector3(RADIO_TARGET.x, RADIO_TARGET.y + 0.12, RADIO_TARGET.z + distance)
  }
  const setZoomOutVisible = (visible: boolean) => {
    if (zoomOutButton) zoomOutButton.hidden = !visible
  }
  const resize = () => {
    const width = root.clientWidth
    const height = root.clientHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.fov = 54
    camera.updateProjectionMatrix()
    if (viewMode === 'map') {
      camera.position.copy(getMapViewPosition())
      cameraTarget.copy(MAP_TARGET)
      controls.target.copy(MAP_TARGET)
    } else if (viewMode === 'radio') {
      camera.position.copy(getRadioViewPosition())
      cameraTarget.copy(RADIO_TARGET)
      controls.target.copy(RADIO_TARGET)
    }
  }
""",
    'radio framing and resize',
)

replace_once(
    room,
    """      camera.position.copy(end)
      cameraTarget.copy(MAP_TARGET)
      controls.target.copy(MAP_TARGET)
      viewMode = 'map'
      return
""",
    """      camera.position.copy(end)
      cameraTarget.copy(MAP_TARGET)
      controls.target.copy(MAP_TARGET)
      viewMode = 'map'
      setZoomOutVisible(true)
      return
""",
    'map reduced motion focus',
)

replace_once(
    room,
    """    cameraTransition = {
      startTime: performance.now(),
      duration: 2200,
      path: new THREE.CatmullRomCurve3([start, firstGuide, secondGuide, end], false, 'catmullrom', 0.42),
      startTarget: cameraTarget.clone(),
      endTarget: MAP_TARGET.clone(),
    }
    viewMode = 'transition'
  }
  const setProjectorActive = (active: boolean) => {
""",
    """    cameraTransition = {
      startTime: performance.now(),
      duration: 2200,
      path: new THREE.CatmullRomCurve3([start, firstGuide, secondGuide, end], false, 'catmullrom', 0.42),
      startTarget: cameraTarget.clone(),
      endTarget: MAP_TARGET.clone(),
      destination: 'map',
    }
    setZoomOutVisible(false)
    viewMode = 'transition'
  }
  const startRadioDolly = () => {
    if (viewMode !== 'home') return

    hoverTargets.forEach((target) => { target.material.opacity = 0 })
    hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
    boardDraw('CONTACT')

    const end = getRadioViewPosition()
    if (reducedMotion.matches) {
      camera.position.copy(end)
      cameraTarget.copy(RADIO_TARGET)
      controls.target.copy(RADIO_TARGET)
      viewMode = 'radio'
      setZoomOutVisible(true)
      return
    }

    const start = camera.position.clone()
    const direction = end.clone().sub(start)
    // The guide points make the move feel like a camera riding a short track:
    // forward first, then a gentle lateral settle in front of the equipment.
    const firstGuide = start.clone().addScaledVector(direction, 0.30).add(new THREE.Vector3(-0.10, 0.02, 0.20))
    const secondGuide = start.clone().addScaledVector(direction, 0.72).add(new THREE.Vector3(-0.18, -0.02, 0.06))
    cameraTransition = {
      startTime: performance.now(),
      duration: 1900,
      path: new THREE.CatmullRomCurve3([start, firstGuide, secondGuide, end], false, 'catmullrom', 0.42),
      startTarget: cameraTarget.clone(),
      endTarget: RADIO_TARGET.clone(),
      destination: 'radio',
    }
    setZoomOutVisible(false)
    viewMode = 'transition'
  }
  const setProjectorActive = (active: boolean) => {
""",
    'radio dolly',
)

replace_once(
    room,
    """    setProjectorActive(false)
    if (target.id === 'map') startMapDolly()
  }
""",
    """    setProjectorActive(false)
    if (target.id === 'map') startMapDolly()
    if (target.id === 'radio') startRadioDolly()
  }
""",
    'radio click behavior',
)

replace_once(
    room,
    """  const resetView = () => {
    cameraTransition = null
    viewMode = 'home'
    setProjectorActive(false)
    camera.position.copy(HOME_POSITION)
    cameraTarget.copy(HOME_TARGET)
    controls.target.copy(HOME_TARGET)
    controls.update()
    selectDefault()
  }
  const dolly = (direction: 1 | -1) => {
""",
    """  const resetView = () => {
    cameraTransition = null
    viewMode = 'home'
    setProjectorActive(false)
    setZoomOutVisible(false)
    camera.position.copy(HOME_POSITION)
    cameraTarget.copy(HOME_TARGET)
    controls.target.copy(HOME_TARGET)
    controls.update()
    selectDefault()
  }
  const startZoomOut = () => {
    if (viewMode !== 'map' && viewMode !== 'radio') return
    setZoomOutVisible(false)

    if (reducedMotion.matches) {
      resetView()
      return
    }

    const start = camera.position.clone()
    const direction = HOME_POSITION.clone().sub(start)
    const firstGuide = start.clone().addScaledVector(direction, 0.30).add(new THREE.Vector3(0, 0.08, 0.10))
    const secondGuide = start.clone().addScaledVector(direction, 0.72).add(new THREE.Vector3(0.08, 0.08, 0.16))
    cameraTransition = {
      startTime: performance.now(),
      duration: 1850,
      path: new THREE.CatmullRomCurve3([start, firstGuide, secondGuide, HOME_POSITION.clone()], false, 'catmullrom', 0.42),
      startTarget: cameraTarget.clone(),
      endTarget: HOME_TARGET.clone(),
      destination: 'home',
    }
    viewMode = 'transition'
  }
  const dolly = (direction: 1 | -1) => {
""",
    'zoom-out transition',
)

replace_once(
    room,
    """      if (progress >= 1) {
        camera.position.copy(getMapViewPosition())
        cameraTarget.copy(MAP_TARGET)
        controls.target.copy(MAP_TARGET)
        cameraTransition = null
        viewMode = 'map'
      }
""",
    """      if (progress >= 1) {
        const destination = cameraTransition.destination
        camera.position.copy(cameraTransition.path.getPoint(1))
        cameraTarget.copy(cameraTransition.endTarget)
        controls.target.copy(cameraTransition.endTarget)
        cameraTransition = null
        viewMode = destination
        setZoomOutVisible(destination === 'map' || destination === 'radio')
        if (destination === 'home') selectDefault()
      }
""",
    'generic transition completion',
)

replace_once(
    room,
    """  const resetButton = root.querySelector<HTMLElement>('[data-operation-room-reset]')
  const onResetClick = () => resetView()
  const copyCameraButton = root.querySelector<HTMLButtonElement>('[data-operation-room-copy-camera]')
""",
    """  const resetButton = root.querySelector<HTMLElement>('[data-operation-room-reset]')
  const onResetClick = () => resetView()
  const onZoomOutClick = () => startZoomOut()
  const copyCameraButton = root.querySelector<HTMLButtonElement>('[data-operation-room-copy-camera]')
""",
    'zoom-out click handler',
)

replace_once(
    room,
    """  canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointerup', onPointerUp); canvas.addEventListener('keydown', onKeyDown); canvas.addEventListener('webglcontextlost', onContextLost); resetButton?.addEventListener('click', onResetClick); copyCameraButton?.addEventListener('click', onCopyCameraClick)
""",
    """  canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointerup', onPointerUp); canvas.addEventListener('keydown', onKeyDown); canvas.addEventListener('webglcontextlost', onContextLost); resetButton?.addEventListener('click', onResetClick); zoomOutButton?.addEventListener('click', onZoomOutClick); copyCameraButton?.addEventListener('click', onCopyCameraClick)
""",
    'zoom-out listener',
)

replace_once(
    room,
    """    canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('keydown', onKeyDown); canvas.removeEventListener('webglcontextlost', onContextLost); resetButton?.removeEventListener('click', onResetClick); copyCameraButton?.removeEventListener('click', onCopyCameraClick)
""",
    """    canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('keydown', onKeyDown); canvas.removeEventListener('webglcontextlost', onContextLost); resetButton?.removeEventListener('click', onResetClick); zoomOutButton?.removeEventListener('click', onZoomOutClick); copyCameraButton?.removeEventListener('click', onCopyCameraClick)
""",
    'zoom-out cleanup',
)

# Audio API: expose play() so the component can treat music as enabled by default
# while still respecting browser autoplay rules.
audio = Path('apps/web/src/experience/operation-room-audio.ts')
replace_once(
    audio,
    """    return {
      toggle: async () => false,
      stop: () => undefined,
      dispose: () => undefined,
      isPlaying: () => false,
    }
""",
    """    return {
      play: async () => false,
      toggle: async () => false,
      stop: () => undefined,
      dispose: () => undefined,
      isPlaying: () => false,
    }
""",
    'audio fallback play method',
)
replace_once(
    audio,
    """  return {
    toggle,
    stop,
    dispose,
    isPlaying: () => playing,
  }
""",
    """  return {
    play,
    toggle,
    stop,
    dispose,
    isPlaying: () => playing,
  }
""",
    'audio play method',
)

# UI: add a contextual Zoom out control and make music enabled by default.
component = Path('apps/web/src/components/experience/OperationRoom.astro')
replace_once(
    component,
    """  <div class=\"operation-room__help\" aria-hidden=\"true\"><span class=\"operation-room__dot\"></span><span>Drag to look</span><span>•</span><span>Scroll to zoom</span><span>•</span><span>Click to open</span></div>
  <div class=\"operation-room__controls\">
    <button class=\"operation-room__control\" type=\"button\" data-operation-room-music aria-pressed=\"false\">Music: off</button>
    <button class=\"operation-room__control\" type=\"button\" data-operation-room-reset>Reset view</button>
""",
    """  <div class=\"operation-room__help\" aria-hidden=\"true\"><span class=\"operation-room__dot\"></span><span>Hover to select</span><span>•</span><span>Click to focus</span></div>
  <div class=\"operation-room__controls\">
    <button class=\"operation-room__control\" type=\"button\" data-operation-room-music aria-pressed=\"true\">Music: on</button>
    <button class=\"operation-room__control operation-room__zoom-out\" type=\"button\" data-operation-room-zoom-out hidden>Zoom out</button>
    <button class=\"operation-room__control\" type=\"button\" data-operation-room-reset>Reset view</button>
""",
    'controls markup',
)

old_music = """    const music = createOperationRoomMusic()
    const musicButton = root.querySelector<HTMLButtonElement>('[data-operation-room-music]')

    const syncMusicButton = () => {
      if (!musicButton) return
      const enabled = music.isPlaying()
      musicButton.textContent = enabled ? 'Music: on' : 'Music: off'
      musicButton.setAttribute('aria-pressed', String(enabled))
    }

    const toggleMusic = async () => {
      await music.toggle()
      syncMusicButton()
    }

    const onMusicClick = () => { void toggleMusic() }
    const onMusicKey = (event: KeyboardEvent) => {
      if (event.key !== 'm' && event.key !== 'M') return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      event.preventDefault()
      void toggleMusic()
    }

    musicButton?.addEventListener('click', onMusicClick)
    window.addEventListener('keydown', onMusicKey)
"""
new_music = """    const music = createOperationRoomMusic()
    const musicButton = root.querySelector<HTMLButtonElement>('[data-operation-room-music]')
    // Browsers do not allow guaranteed audible autoplay before a user gesture.
    // Treat music as enabled by default and start it on the first ordinary
    // interaction; the UI therefore reflects the user's default preference.
    let musicEnabled = true

    const syncMusicButton = () => {
      if (!musicButton) return
      musicButton.textContent = musicEnabled ? 'Music: on' : 'Music: off'
      musicButton.setAttribute('aria-pressed', String(musicEnabled))
    }

    const startMusicIfEnabled = async () => {
      if (!musicEnabled) return
      await music.play()
      syncMusicButton()
    }

    const toggleMusic = async () => {
      musicEnabled = !musicEnabled
      if (musicEnabled) await music.play()
      else music.stop()
      syncMusicButton()
    }

    const onMusicClick = () => { void toggleMusic() }
    const onMusicKey = (event: KeyboardEvent) => {
      if (event.key !== 'm' && event.key !== 'M') return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      event.preventDefault()
      void toggleMusic()
    }
    const onFirstPointer = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-operation-room-music]')) return
      void startMusicIfEnabled()
    }
    const onFirstKey = (event: KeyboardEvent) => {
      if (event.key === 'm' || event.key === 'M') return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      void startMusicIfEnabled()
    }

    syncMusicButton()
    window.addEventListener('pointerdown', onFirstPointer, { once: true })
    window.addEventListener('keydown', onFirstKey, { once: true })
    musicButton?.addEventListener('click', onMusicClick)
    window.addEventListener('keydown', onMusicKey)
"""
replace_once(component, old_music, new_music, 'default music behavior')

replace_once(
    component,
    """      musicButton?.removeEventListener('click', onMusicClick)
      window.removeEventListener('keydown', onMusicKey)
      music.dispose()
""",
    """      window.removeEventListener('pointerdown', onFirstPointer)
      window.removeEventListener('keydown', onFirstKey)
      musicButton?.removeEventListener('click', onMusicClick)
      window.removeEventListener('keydown', onMusicKey)
      music.dispose()
""",
    'music cleanup',
)

replace_once(
    component,
    """  .operation-room__control[aria-pressed='true'] { color: #eef3cf; background: #36572f; border-color: #9cb97d; box-shadow: inset 0 0 0 1px rgb(156 185 125 / .18); }
""",
    """  .operation-room__control[aria-pressed='true'] { color: #eef3cf; background: #36572f; border-color: #9cb97d; box-shadow: inset 0 0 0 1px rgb(156 185 125 / .18); }
  .operation-room__control[hidden] { display: none; }
  .operation-room__zoom-out { border-color: #b0c991; background: rgb(54 87 47 / .88); }
""",
    'zoom-out styles',
)
