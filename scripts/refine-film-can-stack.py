from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()
start_marker = 'const createFilmReelStorage = (scene: THREE.Scene) => {'
end_marker = '\nconst createProjectionScreen = (scene: THREE.Scene) => {'

start = text.index(start_marker)
end = text.index(end_marker, start)
old = text[start:end]

assert 'Four matching metal film cases' in old, 'expected current film-case stack not found'
assert 'caseGroup.position.set(-0.03, 0.16 + i * 0.13, 0)' in old, 'expected vertical stack layout not found'

new = '''const createFilmReelStorage = (scene: THREE.Scene) => {
  // Open cardboard office-storage box on the green felt immediately beside the
  // raised brown projector support. Its contents remain visible, but the box
  // reads as corrugated packing material rather than an apple crate.
  const group = new THREE.Group()

  const crateWood = makeMaterial(0x68452e, 0.96); crateWood.flatShading = true
  const crateDark = makeMaterial(0x3f2b20, 0.96); crateDark.flatShading = true
  const caseMetal = makeMaterial(0x737975, 0.70); caseMetal.flatShading = true
  const caseLight = makeMaterial(0x979d98, 0.68); caseLight.flatShading = true
  const caseDark = makeMaterial(0x3e4543, 0.82); caseDark.flatShading = true

  // The raised centre support is 1.2 m wide and centred at x = -0.6, so its
  // left edge is x = -1.20. The box is 0.70 m wide across X and 1.08 m long
  // along Z; its long axis therefore matches the long axis of the operations
  // table. Y sits on top of the green felt surface.
  const crateWidth = 0.70
  const crateDepth = 1.08
  const crateHeight = 0.56
  group.position.set(-1.55, 1.295, 3.90)

  group.add(box([crateWidth, 0.045, crateDepth], [0, 0.025, 0], crateDark))

  // Cardboard end walls at front/back.
  for (const z of [-crateDepth / 2 + 0.045, crateDepth / 2 - 0.045]) {
    group.add(box([crateWidth, crateHeight, 0.055], [0, crateHeight / 2, z], crateWood))
  }

  // Solid corrugated side panels with a dark packing-tape stripe.
  group.add(box([0.05, crateHeight - 0.04, crateDepth - 0.12], [-crateWidth / 2 + 0.025, crateHeight / 2, 0], crateWood))
  group.add(box([0.05, crateHeight - 0.04, crateDepth - 0.12], [crateWidth / 2 - 0.025, crateHeight / 2, 0], crateWood))
  group.add(box([0.06, 0.045, crateDepth - 0.08], [crateWidth / 2 - 0.07, crateHeight * 0.52, 0], crateDark))
  group.add(box([0.06, 0.045, crateDepth - 0.08], [-crateWidth / 2 + 0.07, crateHeight * 0.52, 0], crateDark))

  // A sideways row of closed metal film cans runs along local Z, exactly
  // parallel to the long edge of the main table. Each can stands on edge like
  // a book on a shelf. The whole row leans in the same direction, with a small
  // progressive variation so it reads as a neatly placed but relaxed stack
  // rather than a rigid vertical rack.
  const canRadius = 0.26
  const canThickness = 0.085
  const canCount = 5
  const stackStartZ = -0.28
  const stackStepZ = 0.14
  const floorTop = 0.055
  const leanAngles = [-0.12, -0.145, -0.17, -0.19, -0.205]

  for (let i = 0; i < canCount; i += 1) {
    const can = new THREE.Group()
    const lean = leanAngles[i]

    // Cylinder axis points along Z before the group lean is applied, so the
    // circular lid faces are vertical and the stack itself advances along Z.
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(canRadius, canRadius, canThickness, 16), caseMetal)
    shell.rotation.x = Math.PI / 2
    shell.castShadow = true
    shell.receiveShadow = true
    can.add(shell)

    // Closed stamped-metal lids on both sides, with dark rolled rims and a
    // restrained central pressing. These are film cans, not exposed reels.
    for (const side of [-1, 1] as const) {
      const faceZ = side * (canThickness / 2 + 0.002)
      const lid = new THREE.Mesh(new THREE.CircleGeometry(canRadius * 0.92, 16), caseLight)
      lid.position.z = faceZ
      lid.castShadow = true
      lid.receiveShadow = true
      can.add(lid)

      const rim = new THREE.Mesh(new THREE.TorusGeometry(canRadius * 0.94, 0.012, 5, 16), caseDark)
      rim.position.z = faceZ + side * 0.004
      rim.castShadow = true
      can.add(rim)

      const press = new THREE.Mesh(new THREE.CircleGeometry(canRadius * 0.22, 10), caseDark)
      press.position.z = faceZ + side * 0.007
      can.add(press)
    }

    // Rest each tilted can on the box floor instead of rotating around a
    // floating centre. Increasing Z positions make the row parallel to the
    // table's 9.2 m long edge; negative X rotation makes every can lean toward
    // the same end of the box like loosely placed books on a shelf.
    const leanAbs = Math.abs(lean)
    const centreY = floorTop
      + canRadius * Math.cos(leanAbs)
      + (canThickness / 2) * Math.sin(leanAbs)
    can.position.set(0, centreY, stackStartZ + i * stackStepZ)
    can.rotation.x = lean
    group.add(can)
  }

  scene.add(group)
}
'''

updated = text[:start] + new + text[end:]
assert updated.count(start_marker) == 1
assert 'Four matching metal film cases' not in updated
assert 'const stackStartZ = -0.28' in updated
assert 'can.rotation.x = lean' in updated
path.write_text(updated)
