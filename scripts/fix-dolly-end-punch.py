from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

old = """  const settleControls = (enabled: boolean) => {
    // OrbitControls keeps internal damping deltas. Flushing them at a camera
    // hand-off prevents the one-frame snap that used to happen at the end of a dolly.
    controls.target.copy(cameraTarget)
    const damping = controls.enableDamping
    controls.enableDamping = false
    controls.update()
    controls.enableDamping = damping
    controls.enabled = enabled
  }
"""
new = """  const settleControls = (enabled: boolean) => {
    // Focused views intentionally sit closer than OrbitControls.minDistance.
    // Calling controls.update() while handing off to a disabled focused view
    // clamps that distance and causes the sharp punch-zoom backwards at the
    // exact end of the dolly. Keep the camera pose untouched while focused;
    // only flush OrbitControls when returning to the normal room view.
    controls.target.copy(cameraTarget)
    controls.enabled = enabled
    if (!enabled) return

    const damping = controls.enableDamping
    controls.enableDamping = false
    controls.update()
    controls.enableDamping = damping
  }
"""

count = text.count(old)
if count != 1:
    raise SystemExit(f'settleControls: expected exactly one match, found {count}')
text = text.replace(old, new, 1)

# Regression guards for the camera fix and an unrelated map bug we have hit before.
if 'controls.minDistance = 5' not in text:
    raise SystemExit('expected OrbitControls minDistance configuration missing')
if 'context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()' not in text:
    raise SystemExit('map horizontal grid regression detected')

path.write_text(text)
