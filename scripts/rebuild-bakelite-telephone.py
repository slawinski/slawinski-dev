from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

camera_start_marker = "  const getTraysViewPosition = () => {\n"
camera_end_marker = "  const setProjectorActive = (active: boolean) => {\n"
camera_start = text.index(camera_start_marker)
camera_end = text.index(camera_end_marker)
camera_before = text[camera_start:camera_end]

start = text.index('const createPhone = (scene: THREE.Scene')
end = text.index('const createPostPhoneShelf = (scene: THREE.Scene)', start)

replacement = r'''const createRotaryTelephone = (
  scene: THREE.Scene,
  x: number,
  z: number,
  color: number,
  rotationY = 0,
  y = 1.70,
  scale = 0.72,
) => {
  // Completely new telephone artwork. No geometry or construction logic from
  // the previous prop is retained; this is a fresh reusable scene object whose
  // local origin is the supporting surface beneath it.
  const group = new THREE.Group()
  group.position.set(x, y, z)
  group.rotation.y = rotationY
  group.scale.setScalar(scale)

  const baseColor = new THREE.Color(color)
  const bakelite = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.86,
    metalness: 0.015,
    flatShading: true,
  })
  const bakeliteDeep = new THREE.MeshStandardMaterial({
    color: baseColor.clone().multiplyScalar(0.56),
    roughness: 0.94,
    metalness: 0.01,
    flatShading: true,
  })
  const bakeliteHandset = new THREE.MeshStandardMaterial({
    color: baseColor.clone().multiplyScalar(0.80),
    roughness: 0.80,
    metalness: 0.02,
    flatShading: true,
  })
  const ivory = new THREE.MeshStandardMaterial({
    color: 0xd8cfb2,
    roughness: 0.91,
    metalness: 0,
    flatShading: true,
  })
  const ivoryLight = new THREE.MeshStandardMaterial({
    color: 0xe9dfc2,
    roughness: 0.86,
    metalness: 0,
    flatShading: true,
  })
  const dark = new THREE.MeshStandardMaterial({
    color: 0x202321,
    roughness: 0.90,
    metalness: 0.03,
    flatShading: true,
  })
  const hardware = new THREE.MeshStandardMaterial({
    color: 0x81755d,
    roughness: 0.66,
    metalness: 0.28,
    flatShading: true,
  })

  const finish = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  // Authored faceted hull. Three octagonal rings form a heavy plinth, broad
  // shoulder and narrower crown, with the front kept fuller than the back so
  // the silhouette reads as moulded Bakelite rather than a generic enclosure.
  const hullRings = [
    { y: 0.055, hx: 0.55, back: -0.38, front: 0.40, bevel: 0.115 },
    { y: 0.165, hx: 0.51, back: -0.35, front: 0.36, bevel: 0.105 },
    { y: 0.385, hx: 0.395, back: -0.255, front: 0.225, bevel: 0.082 },
  ]
  const hullVertices: number[] = []
  const ringPoints = (ring: (typeof hullRings)[number]) => [
    [-ring.hx + ring.bevel, ring.back],
    [ ring.hx - ring.bevel, ring.back],
    [ ring.hx, ring.back + ring.bevel],
    [ ring.hx, ring.front - ring.bevel],
    [ ring.hx - ring.bevel, ring.front],
    [-ring.hx + ring.bevel, ring.front],
    [-ring.hx, ring.front - ring.bevel],
    [-ring.hx, ring.back + ring.bevel],
  ] as Array<[number, number]>

  for (const ring of hullRings) {
    for (const [vx, vz] of ringPoints(ring)) hullVertices.push(vx, ring.y, vz)
  }
  const bottomCenter = hullVertices.length / 3
  hullVertices.push(0, hullRings[0].y, 0)
  const topCenter = hullVertices.length / 3
  hullVertices.push(0, hullRings[2].y, -0.015)

  const hullIndices: number[] = []
  for (let ring = 0; ring < 2; ring += 1) {
    const lower = ring * 8
    const upper = (ring + 1) * 8
    for (let i = 0; i < 8; i += 1) {
      const next = (i + 1) % 8
      hullIndices.push(lower + i, lower + next, upper + next)
      hullIndices.push(lower + i, upper + next, upper + i)
    }
  }
  for (let i = 0; i < 8; i += 1) {
    const next = (i + 1) % 8
    hullIndices.push(bottomCenter, next, i)
    hullIndices.push(topCenter, 16 + i, 16 + next)
  }

  const hullGeometry = new THREE.BufferGeometry()
  hullGeometry.setAttribute('position', new THREE.Float32BufferAttribute(hullVertices, 3))
  hullGeometry.setIndex(hullIndices)
  hullGeometry.computeVertexNormals()
  group.add(finish(new THREE.Mesh(hullGeometry, bakelite)))

  // Four broad feet keep the set visually planted and create a small shadow
  // break under the body without introducing decorative noise.
  for (const footX of [-0.39, 0.39]) for (const footZ of [-0.25, 0.25]) {
    group.add(box([0.13, 0.045, 0.13], [footX, 0.023, footZ], bakeliteDeep))
  }

  // The rotary dial is the strongest front-face cue: pale plate, dark wheel,
  // eight deliberately oversized recesses, central hub and a restrained stop.
  const dial = new THREE.Group()
  dial.position.set(0.008, 0.265, 0.315)
  dial.rotation.x = -0.19

  const dialPlate = finish(new THREE.Mesh(new THREE.CircleGeometry(0.285, 12), ivory))
  dialPlate.position.z = 0.008
  dial.add(dialPlate)

  const wheelOuter = finish(new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.031, 6, 12), bakeliteDeep))
  wheelOuter.position.z = 0.031
  dial.add(wheelOuter)
  const wheelInner = finish(new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.020, 5, 10), bakeliteDeep))
  wheelInner.position.z = 0.034
  dial.add(wheelInner)

  const openingCount = 8
  for (let i = 0; i < openingCount; i += 1) {
    const angle = -Math.PI * 0.12 + i * Math.PI * 2 / openingCount
    const opening = finish(new THREE.Mesh(new THREE.CircleGeometry(0.034, 7), dark))
    opening.position.set(Math.cos(angle) * 0.151, Math.sin(angle) * 0.151, 0.041)
    dial.add(opening)
  }

  const hub = finish(new THREE.Mesh(new THREE.CylinderGeometry(0.061, 0.061, 0.030, 9), ivoryLight))
  hub.rotation.x = Math.PI / 2
  hub.position.z = 0.041
  dial.add(hub)
  dial.add(box([0.040, 0.105, 0.038], [0.205, -0.075, 0.048], hardware, [0, 0, -0.30]))
  group.add(dial)

  // Two tapered cradle cheeks remain visibly separate from the body and leave
  // a dark pause under the handset, making the handset look removable.
  const makeCradleCheek = (side: -1 | 1) => {
    const cheekGeometry = new THREE.BufferGeometry()
    const w0 = 0.105
    const w1 = 0.072
    const d0 = 0.15
    const d1 = 0.105
    const h = 0.19
    cheekGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
      -w0, 0, -d0,  w0, 0, -d0,  w0, 0, d0, -w0, 0, d0,
      -w1, h, -d1,  w1, h, -d1,  w1, h, d1, -w1, h, d1,
    ], 3))
    cheekGeometry.setIndex([
      0, 2, 1, 0, 3, 2,
      4, 5, 6, 4, 6, 7,
      0, 1, 5, 0, 5, 4,
      1, 2, 6, 1, 6, 5,
      2, 3, 7, 2, 7, 6,
      3, 0, 4, 3, 4, 7,
    ])
    cheekGeometry.computeVertexNormals()
    const cheek = finish(new THREE.Mesh(cheekGeometry, bakeliteDeep))
    cheek.position.set(side * 0.31, 0.35, -0.045)
    cheek.rotation.z = side * -0.08
    return cheek
  }
  group.add(makeCradleCheek(-1), makeCradleCheek(1))

  // Broad low-poly handset sweep. Slightly different receiver-end proportions
  // keep it from feeling mechanically mirrored while preserving one clear family.
  const handsetCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.405, 0.535, -0.060),
    new THREE.Vector3(-0.255, 0.602, -0.075),
    new THREE.Vector3(0.000, 0.625, -0.083),
    new THREE.Vector3(0.255, 0.602, -0.075),
    new THREE.Vector3(0.405, 0.535, -0.060),
  ])
  group.add(finish(new THREE.Mesh(new THREE.TubeGeometry(handsetCurve, 8, 0.061, 6, false), bakeliteHandset)))

  const addReceiverEnd = (side: -1 | 1, outerRadius: number, faceRadius: number) => {
    const neck = finish(new THREE.Mesh(new THREE.CylinderGeometry(0.090, 0.075, 0.14, 8), bakeliteHandset))
    neck.rotation.z = Math.PI / 2
    neck.position.set(side * 0.445, 0.535, -0.060)
    group.add(neck)

    const bell = finish(new THREE.Mesh(new THREE.CylinderGeometry(outerRadius * 0.82, outerRadius, 0.135, 8), bakelite))
    bell.rotation.z = Math.PI / 2
    bell.position.set(side * 0.515, 0.525, -0.055)
    group.add(bell)

    const face = finish(new THREE.Mesh(new THREE.CylinderGeometry(faceRadius, faceRadius, 0.018, 8), dark))
    face.rotation.z = Math.PI / 2
    face.position.set(side * 0.584, 0.525, -0.055)
    group.add(face)
  }
  addReceiverEnd(-1, 0.145, 0.083)
  addReceiverEnd(1, 0.132, 0.073)

  // A short line exits the rear-right of the shell and settles onto the support.
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.37, 0.13, -0.285),
    new THREE.Vector3(0.49, 0.09, -0.37),
    new THREE.Vector3(0.57, 0.035, -0.29),
    new THREE.Vector3(0.55, 0.012, -0.12),
    new THREE.Vector3(0.47, 0.010, 0.015),
  ])
  group.add(finish(new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 9, 0.012, 5, false), dark)))

  scene.add(group)
}

'''

text = text[:start] + replacement + text[end:]
text = text.replace('createPhone(', 'createRotaryTelephone(')

old_bank = "  createRotaryTelephone(scene, -0.6, -2.0, 0x315b3c, 0); createRotaryTelephone(scene, -0.6, -1.0, 0xd8ceb0, 1.57); createRotaryTelephone(scene, -0.6, 0, PALETTE.red, -1.57); createRotaryTelephone(scene, -0.6, 1.0, 0xd9d1b8, 1.57); createRotaryTelephone(scene, -0.6, 2.0, 0x315b3c, -1.57)"
new_bank = "  createRotaryTelephone(scene, -0.6, -2.0, 0x30483b, 0); createRotaryTelephone(scene, -0.6, -1.0, 0x4b3029, 1.57); createRotaryTelephone(scene, -0.6, 0, 0x6a302a, -1.57); createRotaryTelephone(scene, -0.6, 1.0, 0x303637, 1.57); createRotaryTelephone(scene, -0.6, 2.0, 0x30483b, -1.57)"
if old_bank not in text:
    raise SystemExit('desk telephone bank call row not found')
text = text.replace(old_bank, new_bank, 1)

old_shelf = 'createRotaryTelephone(scene, shelfCenterX - 0.03, postZ, PALETTE.red, -Math.PI / 2, shelfTop + 0.018, 0.58)'
new_shelf = 'createRotaryTelephone(scene, shelfCenterX - 0.03, postZ, 0x633129, -Math.PI / 2, shelfTop, 0.58)'
if old_shelf not in text:
    raise SystemExit('shelf telephone call not found')
text = text.replace(old_shelf, new_shelf, 1)

camera_start_after = text.index(camera_start_marker)
camera_end_after = text.index(camera_end_marker)
if text[camera_start_after:camera_end_after] != camera_before:
    raise SystemExit('camera/zoom transition changed unexpectedly')

for token in [
    'const createPhone =',
    'Broad, low Bakelite wedge',
    'Proper cradle ears below the handset',
    'lowerWidth = 0.98',
    'upperWidth = 0.68',
]:
    if token in text:
        raise SystemExit(f'legacy telephone fragment still present: {token}')

if text.count('const createRotaryTelephone =') != 1:
    raise SystemExit('unexpected number of new telephone factories')
if text.count('createRotaryTelephone(') < 7:
    raise SystemExit('telephone placements were not fully migrated')

path.write_text(text)
