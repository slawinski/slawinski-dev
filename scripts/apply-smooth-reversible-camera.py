from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    text = text.replace(old, new, 1)


replace_once(
    """    traysSequence?: {
      forwardPosition: THREE.Vector3
      forwardTarget: THREE.Vector3
      turnPosition: THREE.Vector3
      turnTarget: THREE.Vector3
    }
    destination: 'home' | 'map' | 'radio' | 'trays' | 'closet'
  } | null = null
""",
    """    traysSequence?: {
      forwardPosition: THREE.Vector3
      forwardTarget: THREE.Vector3
      turnPosition: THREE.Vector3
      turnTarget: THREE.Vector3
    }
    targetPath?: THREE.Curve<THREE.Vector3>
    traysTilt?: boolean
    reverse?: boolean
    destination: 'home' | 'map' | 'radio' | 'trays' | 'closet'
  } | null = null
  let focusRoute: NonNullable<typeof cameraTransition> | null = null
""",
    'camera transition route metadata',
)

replace_once(
    """      // The generic path remains the source of the exact first/final camera
      // positions; the render loop uses the staged waypoints in between.
      path: new THREE.CubicBezierCurve3(start, forwardPosition, turnPosition, end),
      startTarget,
      endTarget: TRAYS_TARGET.clone(),
      startUp: camera.up.clone(),
      endUp: TRAYS_UP.clone(),
      traysSequence: { forwardPosition, forwardTarget, turnPosition, turnTarget },
      destination: 'trays',
""",
    """      // One continuous centripetal spline passes through the intended beats
      // (forward, right turn, overhead) without easing to a stop at either
      // intermediate waypoint. Arc-length sampling keeps translation even.
      path: new THREE.CatmullRomCurve3(
        [start, forwardPosition, turnPosition, end],
        false,
        'centripetal',
        0.5,
      ),
      startTarget,
      endTarget: TRAYS_TARGET.clone(),
      startUp: camera.up.clone(),
      endUp: TRAYS_UP.clone(),
      targetPath: new THREE.CatmullRomCurve3(
        [startTarget, forwardTarget, turnTarget, TRAYS_TARGET.clone()],
        false,
        'centripetal',
        0.5,
      ),
      traysTilt: true,
      destination: 'trays',
""",
    'continuous trays route',
)

replace_once(
    """  const resetView = () => {
    cameraTransition = null
    viewMode = 'home'
""",
    """  const resetView = () => {
    cameraTransition = null
    focusRoute = null
    viewMode = 'home'
""",
    'clear remembered route on reset',
)

zoom_start = text.index("  const startZoomOut = () => {\n")
zoom_end = text.index("  const dolly = (direction: 1 | -1) => {\n", zoom_start)
zoom_block = """  const startZoomOut = () => {
    if (viewMode !== 'map' && viewMode !== 'radio' && viewMode !== 'trays' && viewMode !== 'closet') return
    setZoomOutVisible(false)
    closetTargetProgress = 0

    if (reducedMotion.matches) {
      resetView()
      return
    }

    // Zoom-out is the exact zoom-in timeline played backwards: the same
    // position path, look-target path, camera-up interpolation and duration.
    if (!focusRoute) {
      resetView()
      return
    }
    cameraTransition = {
      ...focusRoute,
      startTime: performance.now(),
      reverse: true,
      destination: 'home',
    }
    viewMode = 'transition'
  }
"""
text = text[:zoom_start] + zoom_block + text[zoom_end:]

render_start_marker = "    if (cameraTransition) {\n      const elapsed = now - cameraTransition.startTime\n"
render_end_marker = "\n\n    if (cameraTransition || viewMode !== 'home') {\n"
render_start = text.index(render_start_marker)
render_end = text.index(render_end_marker, render_start)
render_block = """    if (cameraTransition) {
      const elapsed = now - cameraTransition.startTime
      const progress = Math.min(elapsed / cameraTransition.duration, 1)
      const eased = easeMotionControl(progress)
      const routeProgress = cameraTransition.reverse ? 1 - eased : eased

      // A single globally-eased, arc-length-parameterized path prevents the
      // mid-shot slowdowns caused by separately eased animation phases.
      camera.position.copy(cameraTransition.path.getPointAt(routeProgress))
      if (cameraTransition.targetPath) {
        cameraTarget.copy(cameraTransition.targetPath.getPointAt(routeProgress))
      } else {
        cameraTarget.lerpVectors(cameraTransition.startTarget, cameraTransition.endTarget, routeProgress)
      }

      // WRITING stays upright through the forward move/right turn and blends
      // into the top-down roll only on the final leg. This is a pure function
      // of routeProgress, so playing the route backwards reproduces it exactly.
      const upProgress = cameraTransition.traysTilt
        ? easeMotionControl(THREE.MathUtils.clamp((routeProgress - 0.62) / 0.38, 0, 1))
        : routeProgress
      camera.up.lerpVectors(cameraTransition.startUp, cameraTransition.endUp, upProgress).normalize()
      controls.target.copy(cameraTarget)
      updateCameraReadout()

      if (progress >= 1) {
        const completedTransition = cameraTransition
        const destination = completedTransition.destination
        const endpoint = completedTransition.reverse ? 0 : 1
        camera.position.copy(completedTransition.path.getPointAt(endpoint))
        cameraTarget.copy(completedTransition.reverse ? completedTransition.startTarget : completedTransition.endTarget)
        camera.up.copy(completedTransition.reverse ? completedTransition.startUp : completedTransition.endUp)
        controls.target.copy(cameraTarget)

        if (destination === 'home') focusRoute = null
        else focusRoute = completedTransition

        cameraTransition = null
        viewMode = destination
        settleControls(destination === 'home')
        setZoomOutVisible(destination === 'map' || destination === 'radio' || destination === 'trays' || destination === 'closet')
        if (destination === 'home') selectDefault()
      }
    }"""
text = text[:render_start] + render_block + text[render_end:]

checks = {
    'map grid': 'context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()',
    'latest paper layout': 'deskPapers.position.set(-2.38, 1.305, 0.92)',
    'arc-length sampling': 'cameraTransition.path.getPointAt(routeProgress)',
    'reverse route': 'reverse: true',
    'remembered route': 'focusRoute = completedTransition',
    'continuous trays target path': 'targetPath: new THREE.CatmullRomCurve3(',
}
for label, needle in checks.items():
    if needle not in text:
        raise SystemExit(f'{label} check failed')

if 'const phase = easeMotionControl(progress / forwardEnd)' in text:
    raise SystemExit('old stop-start trays phase easing is still present')

path.write_text(text)
