from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    text = text.replace(old, new, 1)


# Shorten only from the board's right-hand side by preserving its old left edge
# (-5.25 - 4.1 / 2 = -7.30) while reducing the width from 4.1 to 2.9.
replace_once(
    "  board: { x: -5.25, y: 5.55, z: -1.4, width: 4.1, height: 0.78 },",
    "  board: { x: -5.85, y: 5.55, z: -1.4, width: 2.9, height: 0.78 },",
    'board dimensions',
)

# The green board keeps its border/surface when idle, but no arrow or copy.
replace_once(
    """    context.strokeStyle = 'rgba(225, 237, 181, .45)'; context.lineWidth = 5; context.strokeRect(15, 15, canvas.width - 30, canvas.height - 30)
    context.fillStyle = '#eef0c7'; context.beginPath(); context.moveTo(50, canvas.height / 2); context.lineTo(82, canvas.height / 2 - 22); context.lineTo(82, canvas.height / 2 + 22); context.closePath(); context.fill()
    context.font = '700 72px ui-monospace, SFMono-Regular, Menlo, monospace'; context.textBaseline = 'middle'; context.fillText(label, 122, canvas.height / 2 + 2)
    texture.needsUpdate = true
  }
  draw('WORK')
""",
    """    context.strokeStyle = 'rgba(225, 237, 181, .45)'; context.lineWidth = 5; context.strokeRect(15, 15, canvas.width - 30, canvas.height - 30)
    if (label) {
      context.fillStyle = '#eef0c7'; context.beginPath(); context.moveTo(50, canvas.height / 2); context.lineTo(82, canvas.height / 2 - 22); context.lineTo(82, canvas.height / 2 + 22); context.closePath(); context.fill()
      context.font = '700 72px ui-monospace, SFMono-Regular, Menlo, monospace'; context.textBaseline = 'middle'; context.fillText(label, 122, canvas.height / 2 + 2)
    }
    texture.needsUpdate = true
  }
  draw('')
""",
    'blank board texture',
)

# Replace the flat right-wall slab with a recognisable period office door:
# proper casing, inset panels, hinges and a brass lever/lock set.
replace_once(
    """  scene.add(box([0.26, 4.9, 1.65], [6.82, 2.45, -2.95], materials.wood))
  for (let y = 0.55; y <= 3.5; y += 0.72) scene.add(box([0.03, 0.045, 1.48], [6.66, y, -2.95], materials.woodDark))
""",
    """  // Proper right-wall timber door. The visible face points into the room
  // (-X), so the casing, panel mouldings and hardware sit slightly proud of it.
  const rightDoorWood = makeMaterial(0x80502d, 0.88); rightDoorWood.flatShading = true
  const rightDoorPanel = makeMaterial(0x63391f, 0.92); rightDoorPanel.flatShading = true
  const rightDoorTrim = makeMaterial(0x4f301c, 0.90); rightDoorTrim.flatShading = true
  const rightDoorX = 6.82
  const rightDoorY = 2.45
  const rightDoorZ = -2.95
  const rightDoorHeight = 4.90
  const rightDoorWidth = 1.65
  const rightDoorFaceX = rightDoorX - 0.26 / 2

  // Door leaf plus a darker edge/reveal that separates it from the wall.
  scene.add(box([0.26, rightDoorHeight, rightDoorWidth], [rightDoorX, rightDoorY, rightDoorZ], rightDoorWood))
  scene.add(box([0.035, rightDoorHeight + 0.05, rightDoorWidth + 0.05], [rightDoorFaceX - 0.006, rightDoorY, rightDoorZ], rightDoorTrim))
  scene.add(box([0.040, rightDoorHeight - 0.10, rightDoorWidth - 0.10], [rightDoorFaceX - 0.030, rightDoorY, rightDoorZ], rightDoorWood))

  // Two tall recessed panels with simple raised mouldings. They are broad
  // enough to read from the room camera but remain consistent with the low-poly style.
  const addRightDoorPanel = (panelY: number, panelHeight: number) => {
    const faceX = rightDoorFaceX - 0.056
    const panelWidth = 1.18
    scene.add(box([0.026, panelHeight, panelWidth], [faceX, panelY, rightDoorZ], rightDoorPanel))
    const railX = faceX - 0.022
    scene.add(box([0.030, 0.065, panelWidth + 0.10], [railX, panelY + panelHeight / 2, rightDoorZ], rightDoorTrim))
    scene.add(box([0.030, 0.065, panelWidth + 0.10], [railX, panelY - panelHeight / 2, rightDoorZ], rightDoorTrim))
    scene.add(box([0.030, panelHeight, 0.065], [railX, panelY, rightDoorZ - panelWidth / 2], rightDoorTrim))
    scene.add(box([0.030, panelHeight, 0.065], [railX, panelY, rightDoorZ + panelWidth / 2], rightDoorTrim))
  }
  addRightDoorPanel(3.62, 1.55)
  addRightDoorPanel(1.55, 1.62)

  // Heavy casing around the opening. The side pieces sit outside the leaf and
  // the header projects slightly into the room, giving the door real jamb depth.
  const casingX = rightDoorFaceX - 0.11
  const casingOffsetZ = rightDoorWidth / 2 + 0.095
  scene.add(box([0.18, rightDoorHeight + 0.22, 0.16], [casingX, rightDoorY, rightDoorZ - casingOffsetZ], materials.woodDark))
  scene.add(box([0.18, rightDoorHeight + 0.22, 0.16], [casingX, rightDoorY, rightDoorZ + casingOffsetZ], materials.woodDark))
  scene.add(box([0.18, 0.16, rightDoorWidth + 0.35], [casingX, rightDoorHeight + 0.08, rightDoorZ], materials.woodDark))
  scene.add(box([0.15, 0.07, rightDoorWidth + 0.23], [casingX - 0.01, 0.035, rightDoorZ], rightDoorTrim))

  // Three visible strap hinges on the rear edge of the door.
  const hingeZ = rightDoorZ - rightDoorWidth / 2 + 0.055
  for (const hingeY of [0.78, 2.45, 4.12]) {
    scene.add(box([0.050, 0.24, 0.13], [rightDoorFaceX - 0.082, hingeY, hingeZ], materials.metalDark))
    scene.add(cylinder(0.030, 0.28, [rightDoorFaceX - 0.112, hingeY, hingeZ - 0.035], materials.metalDark, 8))
  }

  // Brass backplate, lock and lever on the latch side.
  const handleZ = rightDoorZ + rightDoorWidth / 2 - 0.28
  scene.add(box([0.040, 0.38, 0.14], [rightDoorFaceX - 0.092, 2.36, handleZ], materials.brass))
  scene.add(cylinder(0.075, 0.055, [rightDoorFaceX - 0.125, 2.43, handleZ], materials.brass, 12, [0, 0, Math.PI / 2]))
  scene.add(box([0.060, 0.055, 0.30], [rightDoorFaceX - 0.158, 2.43, handleZ - 0.10], materials.brass))
  scene.add(cylinder(0.030, 0.045, [rightDoorFaceX - 0.122, 2.22, handleZ], materials.black, 10, [0, 0, Math.PI / 2]))
""",
    'right wall door model',
)

replace_once(
    "const selectDefault = () => { activeId = 'work'; boardDraw('WORK'); hotspots.forEach((hotspot) => { hotspot.highlight.visible = false }) }",
    "const selectDefault = () => { activeId = 'work'; boardDraw(''); hotspots.forEach((hotspot) => { hotspot.highlight.visible = false }) }",
    'blank default board',
)

replace_once(
    """    } else {
      activeId = 'work'
      boardDraw('WORK')
      hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
      if (live) live.textContent = 'Work selected'
    }
""",
    """    } else {
      activeId = 'work'
      boardDraw('')
      hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
      if (live) live.textContent = 'No area selected'
    }
""",
    'blank board when pointer leaves hotspots',
)

checks = {
    'map grid': 'context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()',
    'smooth reversible trays route': 'camera.position.copy(cameraTransition.path.getPointAt(routeProgress))',
    'reverse zoom route': 'reverse: true',
    'applebox flush placement': 'group.position.set(-1.55, 1.295, 3.90)',
    'blank initial board': "draw('')",
    'right door handle': 'const handleZ = rightDoorZ + rightDoorWidth / 2 - 0.28',
}
for label, needle in checks.items():
    if needle not in text:
        raise SystemExit(f'{label} check failed')

path.write_text(text)
