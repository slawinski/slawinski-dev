from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

text = text.replace(
    "  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(2, 2)\n  const hoverRaycaster = new THREE.Raycaster()\n",
    "  const pointer = new THREE.Vector2(2, 2)\n  const hoverRaycaster = new THREE.Raycaster()\n",
)
text = text.replace("  const DRAG_THRESHOLD_PX = 6\n", "")
text = text.replace("  let downX = 0; let downY = 0; let dragged = false\n", "")

start = text.index("  const pick = () => {")
end = text.index("  const resetView =", start)
hover_block = """  const onPointerMove = (event: PointerEvent) => {
    // Desktop interaction is hover-only: moving the pointer over a menu region
    // immediately updates both the cover highlight and the hanging board.
    if (event.pointerType === 'touch') return
    updatePointer(event)
    hoverRaycaster.setFromCamera(pointer, camera)
    const hoverHit = hoverRaycaster.intersectObjects(hoverTargets.map((target) => target.mesh), false)[0]?.object
    const hoveredTarget = hoverTargets.find((target) => target.mesh === hoverHit)

    hoverTargets.forEach((target) => {
      target.material.opacity = target.mesh === hoverHit ? 0.18 : 0
    })

    if (hoveredTarget) {
      const hoveredSection = SECTION_ORDER.find((id) => SECTIONS[id].label === hoveredTarget.label)
      if (hoveredSection) setActive(hoveredSection)
    } else {
      activeId = 'work'
      boardDraw('WORK')
      hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
      if (live) live.textContent = 'Work selected'
    }
    canvas.style.cursor = 'default'
  }
"""
text = text[:start] + hover_block + text[end:]

start = text.index("  const onPointerDown =")
end = text.index("  const dolly =", start)
text = text[:start] + text[end:]

text = text.replace(
    "canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointermove', onDragMove); canvas.addEventListener('pointerdown', onPointerDown); canvas.addEventListener('pointerup', onPointerUp);",
    "canvas.addEventListener('pointermove', onPointerMove);",
)
text = text.replace(
    "canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointermove', onDragMove); canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointerup', onPointerUp);",
    "canvas.removeEventListener('pointermove', onPointerMove);",
)

path.write_text(text)
