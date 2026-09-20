from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

insert_marker = """const createProjectionScreen = (scene: THREE.Scene) => {
"""
if text.count(insert_marker) != 1:
    raise SystemExit(f'projection screen marker: expected 1 match, found {text.count(insert_marker)}')

film_storage = r'''const createFilmReelStorage = (scene: THREE.Scene) => {
  // Film storage cluster inspired by the Medal of Honor operation-room desk:
  // one dark arched reel carrier plus stacked and loose metal film tins. Keep
  // the shapes chunky and low-poly so they read from the room camera without
  // competing with the projector itself.
  const group = new THREE.Group()
  group.position.set(-0.65, 1.70, 3.03)
  group.rotation.y = -0.08

  const caseBlue = makeMaterial(0x1d2b33, 0.90); caseBlue.flatShading = true
  const caseEdge = makeMaterial(0x111a20, 0.94); caseEdge.flatShading = true
  const aluminium = makeMaterial(0x777e7c, 0.72); aluminium.flatShading = true
  const aluminiumLight = makeMaterial(0x9aa09b, 0.68); aluminiumLight.flatShading = true
  const label = makeMaterial(0xc6bfa5, 0.96); label.flatShading = true
  const latch = makeMaterial(0x8b8a7e, 0.58); latch.flatShading = true

  // Upright fibreboard carrier. A low cylinder is half-buried in the box body,
  // leaving the rounded reel-shaped crown visible like the case in the reference.
  const carrier = new THREE.Group()
  carrier.position.set(-0.20, 0, 0.06)
  carrier.add(box([0.72, 0.34, 0.68], [0, 0.17, 0], caseBlue))
  carrier.add(box([0.76, 0.055, 0.72], [0, 0.055, 0], caseEdge))
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.70, 12, 1, false), caseBlue)
  crown.position.set(0, 0.34, 0)
  crown.rotation.z = Math.PI / 2
  crown.castShadow = true
  crown.receiveShadow = true
  carrier.add(crown)
  carrier.add(box([0.50, 0.19, 0.026], [0, 0.19, 0.354], caseEdge))
  carrier.add(box([0.34, 0.12, 0.018], [0, 0.19, 0.371], label))
  for (const x of [-0.25, 0.25]) {
    carrier.add(box([0.105, 0.075, 0.030], [x, 0.34, 0.370], latch))
  }
  // Small carry handle tucked into the top silhouette.
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14, 0.63, 0),
    new THREE.Vector3(-0.11, 0.72, 0),
    new THREE.Vector3(0.11, 0.72, 0),
    new THREE.Vector3(0.14, 0.63, 0),
  ])
  const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 8, 0.018, 5, false), caseEdge)
  handle.castShadow = true
  carrier.add(handle)
  group.add(carrier)

  const addFilmCan = (
    radius: number,
    position: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0],
  ) => {
    const can = new THREE.Group()
    can.position.set(...position)
    can.rotation.set(...rotation)
    const body = cylinder(radius, 0.085, [0, 0.043, 0], aluminium, 18)
    can.add(body)
    const lid = cylinder(radius * 0.94, 0.020, [0, 0.094, 0], aluminiumLight, 18)
    can.add(lid)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.92, 0.012, 5, 18), aluminium)
    rim.position.y = 0.108
    rim.rotation.x = Math.PI / 2
    rim.castShadow = true
    can.add(rim)
    can.add(cylinder(radius * 0.12, 0.024, [0, 0.112, 0], caseEdge, 10))
    can.add(cylinder(radius * 0.052, 0.030, [0, 0.126, 0], aluminiumLight, 8))
    return can
  }

  // Two tins stacked beside the carrier, plus a larger loose can laid slightly
  // askew in front. The irregular placement keeps the desk from feeling staged.
  group.add(addFilmCan(0.255, [0.30, 0, 0.10], [0, 0.10, 0]))
  group.add(addFilmCan(0.255, [0.30, 0.092, 0.10], [0, -0.05, 0]))
  group.add(addFilmCan(0.34, [0.06, 0.015, -0.48], [0.035, -0.24, -0.025]))

  scene.add(group)
}

'''
text = text.replace(insert_marker, film_storage + insert_marker, 1)

scene_old = """  const updateClock = createRoomShell(scene); const closet = createBackCloset(scene); createTable(scene); createRadioDesk(scene); createMapBoard(scene); const projector = createProjector(scene); const projectionScreen = createProjectionScreen(scene); createPaperCluster(scene); createFolders(scene); const fanSpinner = createWallFan(scene)
"""
scene_new = """  const updateClock = createRoomShell(scene); const closet = createBackCloset(scene); createTable(scene); createRadioDesk(scene); createMapBoard(scene); const projector = createProjector(scene); createFilmReelStorage(scene); const projectionScreen = createProjectionScreen(scene); createPaperCluster(scene); createFolders(scene); const fanSpinner = createWallFan(scene)
"""
if text.count(scene_old) != 1:
    raise SystemExit(f'createScene call marker: expected 1 match, found {text.count(scene_old)}')
text = text.replace(scene_old, scene_new, 1)

checks = {
    'film storage function': 'const createFilmReelStorage = (scene: THREE.Scene) => {',
    'arched carrier': 'new THREE.CylinderGeometry(0.34, 0.34, 0.70, 12, 1, false)',
    'stacked film cans': 'group.add(addFilmCan(0.255, [0.30, 0.092, 0.10]',
    'scene call': 'createProjector(scene); createFilmReelStorage(scene); const projectionScreen',
    'map grid': 'context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()',
}
for label_name, needle in checks.items():
    if needle not in text:
        raise SystemExit(f'{label_name} check failed')

path.write_text(text)
