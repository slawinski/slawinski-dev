from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

world_block = """const WORLD = {
  floorY: 0,
  backWallZ: -6.1,
  roomWidth: 18,
  roomDepth: 13,
  wallHeight: 7.25,
  map: { x: -2.55, y: 3.42, z: -5.79, width: 8.4, height: 4.45 },
  mainTable: { x: -0.6, y: 1.16, z: 1.15, width: 4.8, depth: 9.2 },
  radioDesk: { x: -5.9, y: 1.18, z: -2.25, width: 3.7, depth: 1.25 },
  board: { x: -5.25, y: 5.55, z: -1.4, width: 4.1, height: 0.78 },
}
"""
world_replacement = world_block + """
// The WORK hover beam is physically anchored to this period wall sconce.
// Keep the source at the shade opening so the cone visibly originates from
// the fixture instead of appearing from an arbitrary point in the room.
const MAP_SCONCE_MOUNT = new THREE.Vector3(-1.15, 5.96, WORLD.backWallZ + 0.18)
const MAP_SCONCE_SOURCE = new THREE.Vector3(-1.15, 5.72, WORLD.map.z + 0.78)
"""
if world_block not in text:
    raise SystemExit('WORLD block not found')
text = text.replace(world_block, world_replacement, 1)

anchor = """const createHoverTarget = (
"""
sconce_fn = """const createMapSconce = (scene: THREE.Scene) => {
  const mount = MAP_SCONCE_MOUNT.clone()
  const source = MAP_SCONCE_SOURCE.clone()
  const target = new THREE.Vector3(WORLD.map.x, WORLD.map.y + 0.10, WORLD.map.z + 0.18)
  const aim = target.clone().sub(source).normalize()

  const darkMetal = makeMaterial(0x252b27, 0.78); darkMetal.flatShading = true
  const greenEnamel = new THREE.MeshStandardMaterial({
    color: 0x354d27,
    roughness: 0.72,
    metalness: 0.10,
    flatShading: true,
    side: THREE.DoubleSide,
  })
  const warmInterior = new THREE.MeshStandardMaterial({
    color: 0xe2d7ad,
    roughness: 0.88,
    metalness: 0,
    emissive: 0xc9994e,
    emissiveIntensity: 0.28,
    side: THREE.DoubleSide,
  })

  // Compact wall plate and bent black conduit, matching the period task-light
  // silhouette in the reference image. The arm projects into the room before
  // turning down toward the map rather than hanging from the ceiling.
  const plate = cylinder(0.18, 0.075, [mount.x, mount.y, mount.z], darkMetal, 12, [Math.PI / 2, 0, 0])
  scene.add(plate)
  const armCurve = new THREE.CatmullRomCurve3([
    mount.clone().add(new THREE.Vector3(0, 0, 0.04)),
    mount.clone().add(new THREE.Vector3(0, 0, 0.38)),
    new THREE.Vector3(source.x, source.y + 0.22, source.z - 0.18),
    source.clone().addScaledVector(aim, -0.12),
  ])
  const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 12, 0.035, 7, false), darkMetal)
  arm.castShadow = true
  arm.receiveShadow = true
  scene.add(arm)

  // Shallow green enamel hood. ConeGeometry is used open-ended so the cream
  // inner reflector and warm bulb remain visible from the room camera.
  const shadeLength = 0.38
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.34, shadeLength, 10, 1, true), greenEnamel)
  shade.position.copy(source).addScaledVector(aim, -shadeLength / 2)
  shade.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim)
  shade.castShadow = true
  shade.receiveShadow = true
  scene.add(shade)

  const reflector = new THREE.Mesh(new THREE.CircleGeometry(0.285, 12), warmInterior)
  reflector.position.copy(source).addScaledVector(aim, -0.012)
  reflector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), aim)
  scene.add(reflector)

  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe7ad,
    roughness: 0.34,
    emissive: 0xffc96c,
    emissiveIntensity: 0.72,
  })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 9, 7), bulbMaterial)
  bulb.position.copy(source).addScaledVector(aim, -0.055)
  bulb.scale.set(0.88, 1.05, 0.88)
  scene.add(bulb)

  // A restrained local glow makes the fixture read as the source even before
  // the translucent hover volume becomes visible.
  const glow = new THREE.PointLight(0xffd38a, 0.20, 1.25, 2)
  glow.position.copy(source)
  scene.add(glow)
}

"""
if anchor not in text:
    raise SystemExit('createHoverTarget anchor not found')
text = text.replace(anchor, sconce_fn + anchor, 1)

old_map_source = """    source = new THREE.Vector3(2.35, 6.25, -1.80)
    radius = 3.15
"""
new_map_source = """    source = MAP_SCONCE_SOURCE.clone()
    radius = 3.15
"""
if old_map_source not in text:
    raise SystemExit('old map hover source not found')
text = text.replace(old_map_source, new_map_source, 1)

old_scene = """  createPendant(scene, [-1.35, 5.0, -4.75], 0x5e8a32, 1.4, 5)
  const boardDraw = createHangingBoard(scene)
"""
new_scene = """  createPendant(scene, [-1.35, 5.0, -4.75], 0x5e8a32, 1.4, 5)
  createMapSconce(scene)
  const boardDraw = createHangingBoard(scene)
"""
if old_scene not in text:
    raise SystemExit('scene lamp anchor not found')
text = text.replace(old_scene, new_scene, 1)

path.write_text(text)
