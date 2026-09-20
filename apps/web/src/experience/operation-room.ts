import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

type SectionId = 'work' | 'writing' | 'speaking' | 'about' | 'contact'

type Hotspot = {
  id: SectionId
  label: string
  href: string
  hitbox: THREE.Mesh
  highlight: THREE.Mesh
  cameraOffset: THREE.Vector3
}

type HoverTarget = {
  id: string
  label: string
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  lights: THREE.SpotLight[]
}

const SECTION_ORDER: SectionId[] = ['work', 'writing', 'speaking', 'about', 'contact']

const SECTIONS: Record<SectionId, { label: string; href: string }> = {
  work: { label: 'WORK', href: '/work' },
  writing: { label: 'WRITING', href: '/blog' },
  speaking: { label: 'SPEAKING', href: '/speaking' },
  about: { label: 'ABOUT', href: '/about' },
  contact: { label: 'CONTACT', href: '/contact' },
}

const PALETTE = {
  wall: 0xa6b0ac,
  wallShadow: 0x75827f,
  floor: 0x82785e,
  wood: 0x98612e,
  woodDark: 0x5f3e22,
  felt: 0x274b3d,
  paper: 0xd8c79b,
  paperLight: 0xe6d8b6,
  green: 0x2f5f32,
  metal: 0xa1a29a,
  metalDark: 0x48525a,
  red: 0xa84428,
  black: 0x181b1a,
  brass: 0xa57a2a,
}

const WORLD = {
  floorY: 0,
  backWallZ: -6.1,
  roomWidth: 18,
  roomDepth: 13,
  wallHeight: 7.25,
  map: { x: -2.55, y: 3.42, z: -5.79, width: 8.4, height: 4.45 },
  mainTable: { x: -0.6, y: 1.16, z: 1.15, width: 4.8, depth: 9.2 },
  radioDesk: { x: -5.9, y: 1.18, z: -2.25, width: 3.7, depth: 1.25 },
  board: { x: -5.25, y: 5.55, z: -1.4, width: 4.1, height: 0.78 },
  closet: { x: 2.75, width: 1.7, height: 4.9, depth: 1.65 },
}

// The WORK hover beam is physically anchored to this period wall sconce.
// The fixture sits centered above the map. Its shade projects just far enough
// from the wall to clear the map/screen hardware, then aims almost vertically
// down so the visible cone reads like the reference spotlight.
const MAP_SCONCE_MOUNT = new THREE.Vector3(WORLD.map.x, 6.55, WORLD.backWallZ + 0.18)
const MAP_SCONCE_SOURCE = new THREE.Vector3(WORLD.map.x, 6.08, WORLD.map.z + 0.55)
const CLOSET_SCONCE_MOUNT = new THREE.Vector3(WORLD.closet.x, 5.48, WORLD.backWallZ + 0.18)
const CLOSET_SCONCE_SOURCE = new THREE.Vector3(WORLD.closet.x, 5.10, WORLD.backWallZ + 0.55)

const makeMaterial = (color: number, roughness = 0.88) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 })

const materials = {
  wall: makeMaterial(PALETTE.wall, 0.96),
  wallShadow: makeMaterial(PALETTE.wallShadow, 0.96),
  floor: makeMaterial(PALETTE.floor, 1),
  wood: makeMaterial(PALETTE.wood, 0.92),
  woodDark: makeMaterial(PALETTE.woodDark, 0.92),
  felt: makeMaterial(PALETTE.felt, 0.95),
  paper: makeMaterial(PALETTE.paper, 1),
  paperLight: makeMaterial(PALETTE.paperLight, 1),
  mapFrame: makeMaterial(PALETTE.woodDark, 0.93),
  green: makeMaterial(PALETTE.green, 0.9),
  metal: makeMaterial(PALETTE.metal, 0.72),
  metalDark: makeMaterial(PALETTE.metalDark, 0.78),
  red: makeMaterial(PALETTE.red, 0.88),
  black: makeMaterial(PALETTE.black, 0.9),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.brass, roughness: 0.62, metalness: 0.36 }),
}

const box = (
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
  rotation: [number, number, number] = [0, 0, 0],
) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material)
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

const cylinder = (
  radius: number,
  height: number,
  position: [number, number, number],
  material: THREE.Material,
  segments = 8,
  rotation: [number, number, number] = [0, 0, 0],
) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material)
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

const strut = (
  from: [number, number, number],
  to: [number, number, number],
  material: THREE.Material,
) => {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const direction = b.clone().sub(a)
  const length = direction.length()
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, length, 0.18), material)
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

const createCanvasTexture = (
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void,
) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D canvas context unavailable')
  draw(context, canvas)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  return { canvas, context, texture }
}

const createMapTexture = () =>
  createCanvasTexture(1024, 540, (context, canvas) => {
    context.fillStyle = '#b68743'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = 'rgba(87, 62, 32, .27)'
    context.lineWidth = 2
    for (let x = 0; x < canvas.width; x += 64) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke()
    }
    for (let y = 0; y < canvas.height; y += 54) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()
    }

    context.fillStyle = 'rgba(113, 83, 43, .45)'
    const shapes: Array<Array<[number, number]>> = [
      [[120, 100], [240, 70], [320, 120], [300, 220], [210, 250], [110, 200]],
      [[360, 90], [520, 65], [610, 130], [570, 245], [430, 280], [335, 210]],
      [[560, 180], [720, 140], [835, 210], [800, 330], [660, 350], [575, 280]],
      [[275, 270], [430, 245], [535, 330], [475, 455], [315, 430], [220, 350]],
    ]
    for (const points of shapes) {
      context.beginPath(); context.moveTo(points[0][0], points[0][1])
      for (const point of points.slice(1)) context.lineTo(point[0], point[1])
      context.closePath(); context.fill()
    }

    context.fillStyle = '#70522f'
    context.font = 'bold 26px Georgia, serif'
    context.fillText('UNITED', 130, 210)
    context.fillText('KINGDOM', 140, 240)
    context.fillText('FRANCE', 420, 380)
    context.fillText('GERMANY', 650, 205)

    context.strokeStyle = '#795032'
    context.lineWidth = 4
    context.beginPath(); context.moveTo(285, 335); context.lineTo(445, 300); context.lineTo(595, 335); context.lineTo(680, 235); context.stroke()
    const nodes: Array<[number, number, boolean]> = [[285, 335, true], [445, 300, false], [595, 335, false], [680, 235, true]]
    for (const [x, y, filled] of nodes) {
      context.beginPath(); context.arc(x, y, 12, 0, Math.PI * 2)
      context.fillStyle = filled ? '#9d3f25' : '#b68743'; context.fill()
      context.strokeStyle = '#68492e'; context.lineWidth = 4; context.stroke()
    }
    context.fillStyle = '#933d26'; context.font = 'bold 30px sans-serif'; context.fillText('★', 330, 360); context.fillText('★', 515, 285)
  })

const createBoardTexture = () => {
  const state = createCanvasTexture(1024, 192, (context, canvas) => {
    context.fillStyle = '#244326'; context.fillRect(0, 0, canvas.width, canvas.height)
  })
  const draw = (label: string) => {
    const { context, canvas, texture } = state
    context.clearRect(0, 0, canvas.width, canvas.height)
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#477c3d'); gradient.addColorStop(1, '#315d31')
    context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = 'rgba(225, 237, 181, .45)'; context.lineWidth = 5; context.strokeRect(15, 15, canvas.width - 30, canvas.height - 30)
    context.fillStyle = '#eef0c7'; context.beginPath(); context.moveTo(50, canvas.height / 2); context.lineTo(82, canvas.height / 2 - 22); context.lineTo(82, canvas.height / 2 + 22); context.closePath(); context.fill()
    context.font = '700 72px ui-monospace, SFMono-Regular, Menlo, monospace'; context.textBaseline = 'middle'; context.fillText(label, 122, canvas.height / 2 + 2)
    texture.needsUpdate = true
  }
  draw('WORK')
  return { texture: state.texture, draw }
}

const createHangingBoard = (scene: THREE.Scene) => {
  const board = new THREE.Group()
  const { x, y, z, width, height } = WORLD.board
  board.position.set(x, y, z)
  const boardState = createBoardTexture()
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.22, height - 0.18), new THREE.MeshBasicMaterial({ map: boardState.texture }))
  screen.position.z = 0.065; board.add(screen)
  board.add(box([width, 0.13, 0.14], [0, height / 2, 0], materials.woodDark))
  board.add(box([width, 0.13, 0.14], [0, -height / 2, 0], materials.woodDark))
  board.add(box([0.13, height, 0.14], [-width / 2, 0, 0], materials.woodDark))
  board.add(box([0.13, height, 0.14], [width / 2, 0, 0], materials.woodDark))
  const rodLength = 1.28
  board.add(cylinder(0.028, rodLength, [-width * 0.36, height / 2 + rodLength / 2, 0], materials.metalDark, 8))
  board.add(cylinder(0.028, rodLength, [width * 0.36, height / 2 + rodLength / 2, 0], materials.metalDark, 8))
  board.rotation.y = 0; scene.add(board)
  return boardState.draw
}

const createRoomShell = (scene: THREE.Scene) => {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.roomWidth, WORLD.roomDepth), materials.floor)
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, WORLD.floorY, 0); floor.receiveShadow = true; scene.add(floor)
  // The ABOUT doorway is a real opening in the back wall. Split the wall into
  // left/right/top sections so the camera can actually see into the closet once
  // the door swings inward instead of revealing another wall behind it.
  const backWallMinX = -WORLD.roomWidth / 2
  const backWallMaxX = WORLD.roomWidth / 2
  const closetMinX = WORLD.closet.x - WORLD.closet.width / 2
  const closetMaxX = WORLD.closet.x + WORLD.closet.width / 2
  const leftBackWidth = closetMinX - backWallMinX
  const rightBackWidth = backWallMaxX - closetMaxX
  scene.add(box([leftBackWidth, WORLD.wallHeight, 0.18], [(backWallMinX + closetMinX) / 2, WORLD.wallHeight / 2, WORLD.backWallZ], materials.wall))
  scene.add(box([rightBackWidth, WORLD.wallHeight, 0.18], [(closetMaxX + backWallMaxX) / 2, WORLD.wallHeight / 2, WORLD.backWallZ], materials.wall))
  scene.add(box([WORLD.closet.width, WORLD.wallHeight - WORLD.closet.height, 0.18], [WORLD.closet.x, WORLD.closet.height + (WORLD.wallHeight - WORLD.closet.height) / 2, WORLD.backWallZ], materials.wall))
  scene.add(box([0.18, WORLD.wallHeight, WORLD.roomDepth], [-8.8, WORLD.wallHeight / 2, 0], materials.wallShadow))
  scene.add(box([0.18, WORLD.wallHeight, WORLD.roomDepth], [6.8, WORLD.wallHeight / 2, 0], materials.wallShadow))
  // Green trim is a low baseboard, not a raised wall panel. It wraps the
  // back wall and both side walls at floor level.
  const baseboardHeight = 0.42
  const baseboardY = baseboardHeight / 2
  const leftWallX = -8.8
  const rightWallX = 6.8
  const wallSpan = rightWallX - leftWallX
  // Keep the back-wall baseboard clear of the black door as well.
  const backDoorMinX = WORLD.closet.x - WORLD.closet.width / 2
  const backDoorMaxX = WORLD.closet.x + WORLD.closet.width / 2
  scene.add(box([backDoorMinX - leftWallX, baseboardHeight, 0.18], [(leftWallX + backDoorMinX) / 2, baseboardY, WORLD.backWallZ + 0.12], materials.green))
  scene.add(box([rightWallX - backDoorMaxX, baseboardHeight, 0.18], [(backDoorMaxX + rightWallX) / 2, baseboardY, WORLD.backWallZ + 0.12], materials.green))
  scene.add(box([0.18, baseboardHeight, WORLD.roomDepth], [leftWallX + 0.12, baseboardY, 0], materials.green))
  // Leave the right-wall doorway clear: the brown door spans z -3.775..-2.125.
  const doorMinZ = -2.95 - 1.65 / 2
  const doorMaxZ = -2.95 + 1.65 / 2
  const roomMinZ = -WORLD.roomDepth / 2
  const roomMaxZ = WORLD.roomDepth / 2
  const rightWallBaseboardX = rightWallX - 0.12
  scene.add(box([0.18, baseboardHeight, doorMinZ - roomMinZ], [rightWallBaseboardX, baseboardY, (roomMinZ + doorMinZ) / 2], materials.green))
  scene.add(box([0.18, baseboardHeight, roomMaxZ - doorMaxZ], [rightWallBaseboardX, baseboardY, (doorMaxZ + roomMaxZ) / 2], materials.green))

  const beamMaterial = makeMaterial(0xb5aa8e, 0.95)
  const beamSpecs: Array<[[number, number, number], [number, number, number], [number, number, number]]> = [
    [[15.6, 0.58, 0.62], [-1.0, 6.60, -1.9], [0, 0, 0]],
    [[15.6, 0.58, 0.62], [-1.0, 6.60, 2.2], [0, 0, 0]],
    [[0.62, 6.55, 0.62], [3.3, 3.275, -1.9], [0, 0, 0]],
    [[0.62, 6.55, 0.62], [3.3, 3.275, 2.2], [0, 0, 0]],
    [[0.62, 6.55, 0.62], [-8.83, 3.275, -1.9], [0, 0, 0]],
    [[0.62, 6.55, 0.62], [-8.83, 3.275, 2.2], [0, 0, 0]],
  ]
  for (const [size, position, rotation] of beamSpecs) scene.add(box(size, position, beamMaterial, rotation))
  // Surface-mounted planks: the front/back z offsets are the post half-depth
  // plus half the plank depth, so the planks sit against the timber faces
  // instead of passing through them. They continue above the beams into the
  // ceiling structure.
  scene.add(strut([3.3, 4.95, -1.5], [-0.94, 7.4, -1.5], beamMaterial))
  scene.add(strut([3.3, 4.95, -2.3], [7.54, 7.4, -2.3], beamMaterial))
  scene.add(strut([3.3, 4.95, 2.6], [-0.94, 7.4, 2.6], beamMaterial))
  scene.add(strut([3.3, 4.95, 1.8], [7.54, 7.4, 1.8], beamMaterial))
  scene.add(strut([-8.83, 4.95, -1.5], [-4.59, 7.4, -1.5], beamMaterial))
  scene.add(strut([-8.83, 4.95, 2.6], [-4.59, 7.4, 2.6], beamMaterial))

  scene.add(box([0.26, 4.9, 1.65], [6.82, 2.45, -2.95], materials.wood))
  for (let y = 0.55; y <= 3.5; y += 0.72) scene.add(box([0.03, 0.045, 1.48], [6.66, y, -2.95], materials.woodDark))

  // The clock is mounted on the visible face of the front strut. The strut
  // face is at z=-1.41; keep the clock's rear rim just in front of it so the
  // dial never intersects the plank after the support structure is thickened.
  scene.add(cylinder(0.38, 0.10, [2.15, 5.53, -1.34], materials.black, 16, [Math.PI / 2, 0, 0]))
  scene.add(cylinder(0.31, 0.025, [2.15, 5.53, -1.28], materials.paperLight, 16, [Math.PI / 2, 0, 0]))
  const clockCenter: [number, number, number] = [2.15, 5.53, -1.26]
  const minuteHand = new THREE.Group(); minuteHand.position.set(...clockCenter)
  minuteHand.add(box([0.025, 0.22, 0.02], [0, 0.11, 0], materials.black))
  const hourHand = new THREE.Group(); hourHand.position.set(...clockCenter)
  hourHand.add(box([0.025, 0.16, 0.02], [0, 0.08, 0], materials.black))
  scene.add(minuteHand, hourHand)
  const updateClock = () => {
    const now = new Date()
    const minutes = now.getMinutes() + now.getSeconds() / 60
    const hours = (now.getHours() % 12) + minutes / 60
    minuteHand.rotation.z = -minutes / 60 * Math.PI * 2
    hourHand.rotation.z = -hours / 12 * Math.PI * 2
  }
  updateClock()
  return updateClock
}

const createBackCloset = (scene: THREE.Scene) => {
  const { x, width, height, depth } = WORLD.closet
  const frontZ = WORLD.backWallZ + 0.10
  const backZ = WORLD.backWallZ - depth
  const interiorCenterZ = (WORLD.backWallZ + backZ) / 2
  const closetWall = makeMaterial(0x69716c, 0.98); closetWall.flatShading = true
  const closetDark = makeMaterial(0x363b37, 0.96); closetDark.flatShading = true
  const doorMaterial = makeMaterial(0x25221e, 0.90); doorMaterial.flatShading = true
  const doorInset = makeMaterial(0x35312b, 0.92); doorInset.flatShading = true
  const shelfMaterial = makeMaterial(0x5b4228, 0.92); shelfMaterial.flatShading = true
  const coatMaterial = makeMaterial(0x313b34, 0.96); coatMaterial.flatShading = true

  // Recessed closet shell behind the wall opening.
  scene.add(box([width + 0.10, height, 0.12], [x, height / 2, backZ], closetDark))
  scene.add(box([0.12, height, depth], [x - width / 2 - 0.01, height / 2, interiorCenterZ], closetWall))
  scene.add(box([0.12, height, depth], [x + width / 2 + 0.01, height / 2, interiorCenterZ], closetWall))
  scene.add(box([width + 0.10, 0.12, depth], [x, height - 0.06, interiorCenterZ], closetWall))
  scene.add(box([width + 0.10, 0.10, depth], [x, 0.05, interiorCenterZ], materials.floor))

  // Heavy jamb/frame on the room side makes the recess read as a closet rather
  // than a black rectangle cut into the wall.
  const frameDepth = 0.20
  scene.add(box([0.13, height + 0.12, frameDepth], [x - width / 2 - 0.07, height / 2, frontZ], materials.woodDark))
  scene.add(box([0.13, height + 0.12, frameDepth], [x + width / 2 + 0.07, height / 2, frontZ], materials.woodDark))
  scene.add(box([width + 0.27, 0.13, frameDepth], [x, height + 0.065, frontZ], materials.woodDark))

  // A shelf, rail and a couple of low-poly coats give the close-up something
  // recognisably closet-like to inspect without over-detailing the scene.
  scene.add(box([width - 0.24, 0.10, 0.52], [x, 3.72, backZ + 0.40], shelfMaterial))
  scene.add(cylinder(0.022, width - 0.40, [x, 3.35, backZ + 0.58], materials.metalDark, 10, [0, 0, Math.PI / 2]))
  scene.add(box([0.52, 1.30, 0.18], [x - 0.36, 2.54, backZ + 0.55], coatMaterial, [0, 0, -0.05]))
  scene.add(box([0.54, 1.16, 0.18], [x + 0.34, 2.61, backZ + 0.57], makeMaterial(0x51483b, 0.96), [0, 0, 0.06]))
  scene.add(box([0.72, 0.42, 0.52], [x, 0.28, backZ + 0.44], shelfMaterial))

  // Door pivots at its left jamb. Positive Y rotation sends the free edge into
  // negative Z, so it genuinely opens inward into the closet during the dolly.
  const doorPivot = new THREE.Group()
  doorPivot.position.set(x - width / 2 + 0.06, 0.08, frontZ + 0.015)
  const doorWidth = width - 0.12
  const doorHeight = height - 0.16
  const door = box([doorWidth, doorHeight, 0.12], [doorWidth / 2, doorHeight / 2, 0], doorMaterial)
  doorPivot.add(door)
  doorPivot.add(box([doorWidth - 0.24, 1.62, 0.035], [doorWidth / 2, 3.63, 0.075], doorInset))
  doorPivot.add(box([doorWidth - 0.24, 1.62, 0.035], [doorWidth / 2, 1.57, 0.075], doorInset))
  doorPivot.add(cylinder(0.065, 0.10, [doorWidth - 0.18, 2.36, 0.105], materials.brass, 10, [Math.PI / 2, 0, 0]))
  scene.add(doorPivot)

  // Soft practical light at the closet ceiling. Its intensity follows the door
  // opening so the light does not leak through the closed door in the home view.
  const fixtureMaterial = new THREE.MeshStandardMaterial({
    color: 0xe5dbb9,
    roughness: 0.80,
    emissive: 0xffd797,
    emissiveIntensity: 0.05,
  })
  const fixture = cylinder(0.18, 0.055, [x, height - 0.16, WORLD.backWallZ - depth * 0.45], fixtureMaterial, 12)
  scene.add(fixture)
  const light = new THREE.SpotLight(0xffdda5, 0, 5.2, 0.88, 0.78, 1.35)
  light.position.set(x, height - 0.22, WORLD.backWallZ - depth * 0.45)
  light.target.position.set(x, 1.55, backZ + 0.42)
  light.castShadow = true
  light.shadow.mapSize.set(512, 512)
  light.shadow.bias = -0.00025
  light.shadow.normalBias = 0.025
  scene.add(light, light.target)

  const setProgress = (value: number) => {
    const progress = THREE.MathUtils.clamp(value, 0, 1)
    doorPivot.rotation.y = progress * 1.36
    light.intensity = progress * 4.2
    fixtureMaterial.emissiveIntensity = 0.05 + progress * 0.72
  }
  setProgress(0)

  return { setProgress }
}

const createMapBoard = (scene: THREE.Scene) => {
  const { x, y, z, width, height } = WORLD.map
  scene.add(box([width + 0.28, height + 0.28, 0.22], [x, y, z - 0.08], materials.mapFrame))
  const mapMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: createMapTexture().texture, roughness: 1 }))
  mapMesh.position.set(x, y, z + 0.06); mapMesh.receiveShadow = true; scene.add(mapMesh)
  const pinned = [[-4.65, 3.75], [-3.2, 2.8], [-1.4, 4.2], [-0.2, 3.05], [0.3, 4.45]]
  pinned.forEach(([px, py], index) => scene.add(box([0.58, 0.72, 0.025], [px, py, z + 0.095], index % 2 ? materials.paper : materials.paperLight, [0, 0, (index - 2) * 0.035])))
}

const createTable = (scene: THREE.Scene) => {
  const { x, y, z, width, depth } = WORLD.mainTable
  scene.add(box([width, 0.18, depth], [x, y, z], materials.wood))
  scene.add(box([width - 0.42, 0.035, depth - 0.32], [x, y + 0.11, z], materials.felt))
  for (const lx of [x - width / 2 + 0.32, x + width / 2 - 0.32]) for (const lz of [z - depth / 2 + 0.42, z + depth / 2 - 0.42]) scene.add(box([0.28, 1.07, 0.28], [lx, 0.535, lz], materials.woodDark))
  scene.add(box([1.2, 0.46, 9.2], [-0.6, y + 0.31, z], materials.wood))
}

const createChair = (scene: THREE.Scene, x: number, z: number, rotationY: number) => {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = rotationY
  const chairWood = makeMaterial(0x77471f, 0.76); chairWood.flatShading = true
  const chairWoodDark = makeMaterial(0x4e2d18, 0.82); chairWoodDark.flatShading = true
  const cushion = makeMaterial(0x8b7a60, 0.96); cushion.flatShading = true

  // Period office armchair based on the reference: slim splayed legs, a curved
  // horseshoe arm/back rail, vertical back spindles and a separate seat cushion.
  // Tube and cylinder geometry keep the silhouette rounded while staying low-poly.
  const addRail = (
    from: [number, number, number],
    to: [number, number, number],
    radius: number,
    material: THREE.Material,
    bottomScale = 1,
  ) => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const direction = b.clone().sub(a)
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.82, radius * bottomScale, direction.length(), 7),
      material,
    )
    mesh.position.copy(a).add(b).multiplyScalar(0.5)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
    mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh)
  }
  const addBentRail = (points: Array<[number, number, number]>, radius: number, material: THREE.Material) => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)))
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, radius, 6, false), material)
    mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh)
  }

  // Seat frame and muted leather/fabric cushion. The cushion is inset slightly,
  // avoiding the slab-like seat used by the previous chair model.
  group.add(box([1.10, 0.12, 1.02], [0, 0.73, 0], chairWoodDark))
  group.add(box([0.98, 0.13, 0.89], [0, 0.83, -0.02], cushion, [-0.025, 0, 0]))
  group.add(box([0.91, 0.025, 0.80], [0, 0.905, -0.035], makeMaterial(0x9a896d, 0.94), [-0.025, 0, 0]))

  // Four slender legs splay outward as in the reference instead of dropping
  // vertically from the seat corners.
  addRail([-0.43, 0.75, -0.39], [-0.56, 0.05, -0.54], 0.075, chairWoodDark, 1.15)
  addRail([0.43, 0.75, -0.39], [0.56, 0.05, -0.54], 0.075, chairWoodDark, 1.15)
  addRail([-0.43, 0.75, 0.39], [-0.55, 0.05, 0.53], 0.075, chairWoodDark, 1.15)
  addRail([0.43, 0.75, 0.39], [0.55, 0.05, 0.53], 0.075, chairWoodDark, 1.15)

  // Side/front stretchers and the crossed lower braces give the chair the
  // characteristic light but braced wartime-office construction.
  addRail([-0.52, 0.29, -0.49], [0.52, 0.29, -0.49], 0.034, chairWoodDark)
  addRail([-0.52, 0.29, 0.49], [0.52, 0.29, 0.49], 0.034, chairWoodDark)
  addRail([-0.53, 0.31, -0.48], [-0.53, 0.31, 0.48], 0.034, chairWoodDark)
  addRail([0.53, 0.31, -0.48], [0.53, 0.31, 0.48], 0.034, chairWoodDark)
  addRail([-0.50, 0.27, -0.42], [0.50, 0.27, 0.42], 0.028, chairWoodDark)
  addRail([0.50, 0.265, -0.42], [-0.50, 0.265, 0.42], 0.028, chairWoodDark)

  // Rear uprights rise continuously from the rear legs into the back. Front
  // arm supports are slimmer and stop below the curved arm rail.
  addRail([-0.44, 0.74, 0.39], [-0.51, 1.54, 0.50], 0.060, chairWoodDark, 1.08)
  addRail([0.44, 0.74, 0.39], [0.51, 1.54, 0.50], 0.060, chairWoodDark, 1.08)
  addRail([-0.45, 0.75, -0.37], [-0.52, 1.18, -0.39], 0.052, chairWood, 1.05)
  addRail([0.45, 0.75, -0.37], [0.52, 1.18, -0.39], 0.052, chairWood, 1.05)

  // Curved arms sweep from the back around to the front supports. This is the
  // most important visual change from the old rectangular-chair silhouette.
  addBentRail([
    [-0.50, 1.47, 0.49], [-0.58, 1.39, 0.27], [-0.59, 1.30, 0.02], [-0.56, 1.22, -0.22], [-0.52, 1.18, -0.39],
  ], 0.058, chairWood)
  addBentRail([
    [0.50, 1.47, 0.49], [0.58, 1.39, 0.27], [0.59, 1.30, 0.02], [0.56, 1.22, -0.22], [0.52, 1.18, -0.39],
  ], 0.058, chairWood)

  // Arched crest rail across the back.
  addBentRail([
    [-0.51, 1.52, 0.50], [-0.31, 1.62, 0.54], [0, 1.66, 0.56], [0.31, 1.62, 0.54], [0.51, 1.52, 0.50],
  ], 0.062, chairWood)

  // Five thin back spindles fan gently toward the crest rail.
  const spindleXs = [-0.34, -0.17, 0, 0.17, 0.34]
  spindleXs.forEach((sx, index) => {
    const crown = 1.50 + (1 - Math.abs(index - 2) / 2) * 0.08
    addRail([sx * 0.82, 0.88, 0.43], [sx, crown, 0.535], 0.026, chairWoodDark)
  })

  scene.add(group)
}

const createPhone = (scene: THREE.Scene, x: number, z: number, color: number, rotationY = 0) => {
  // The scaled phone base is aligned to the brown beam's top (y=1.70), with
  // only its underside touching the surface—no levitation or intersection.
  const group = new THREE.Group(); group.position.set(x, 1.72, z); group.rotation.y = rotationY
  group.scale.setScalar(0.72)
  const phoneMaterial = makeMaterial(color, 0.82)
  phoneMaterial.side = THREE.DoubleSide
  phoneMaterial.flatShading = true
  const shadowColor = new THREE.Color(color).multiplyScalar(0.43).getHex()
  const shadowMaterial = makeMaterial(shadowColor, 0.92)
  shadowMaterial.flatShading = true

  // Broad, low Bakelite wedge. The reference phone has a strong sloping front
  // and a noticeably wider footprint than the earlier boxy model.
  const lowerWidth = 0.98; const lowerDepth = 0.76
  const upperWidth = 0.68; const upperDepth = 0.46; const bodyHeight = 0.42
  const upperZ = -0.075
  const bodyGeometry = new THREE.BufferGeometry()
  bodyGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -lowerWidth / 2, 0, -lowerDepth / 2,
     lowerWidth / 2, 0, -lowerDepth / 2,
     lowerWidth / 2, 0,  lowerDepth / 2,
    -lowerWidth / 2, 0,  lowerDepth / 2,
    -upperWidth / 2, bodyHeight, upperZ - upperDepth / 2,
     upperWidth / 2, bodyHeight, upperZ - upperDepth / 2,
     upperWidth / 2, bodyHeight, upperZ + upperDepth / 2,
    -upperWidth / 2, bodyHeight, upperZ + upperDepth / 2,
  ], 3))
  bodyGeometry.setIndex([
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
  ])
  bodyGeometry.computeVertexNormals()
  const body = new THREE.Mesh(bodyGeometry, phoneMaterial)
  body.position.y = 0.055; body.castShadow = true; body.receiveShadow = true
  group.add(box([1.04, 0.09, 0.79], [0, 0.025, -0.01], shadowMaterial))
  group.add(body)

  // Slight front lip gives the body the stepped plinth visible on period sets.
  group.add(box([0.84, 0.075, 0.16], [0, 0.105, 0.335], phoneMaterial, [-0.08, 0, 0]))

  // Rotary dial mounted on the sloping front face. The cream plate, dark finger
  // wheel and large holes are intentionally exaggerated enough to read from the
  // fixed room camera instead of collapsing into a single disc.
  const dial = new THREE.Group(); dial.position.set(0, 0.285, 0.335); dial.rotation.x = -0.32
  dial.add(cylinder(0.245, 0.035, [0, 0, 0], materials.paperLight, 18, [Math.PI / 2, 0, 0]))
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.183, 0.027, 6, 20), shadowMaterial)
  outerRing.position.z = 0.027; outerRing.castShadow = true; dial.add(outerRing)
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.015, 5, 16), materials.paper)
  innerRing.position.z = 0.045; innerRing.castShadow = true; dial.add(innerRing)
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI * 0.13 + i * Math.PI * 2 / 10
    const holeRadius = 0.14
    dial.add(cylinder(
      0.034,
      0.024,
      [Math.cos(angle) * holeRadius, Math.sin(angle) * holeRadius, 0.055],
      materials.black,
      8,
      [Math.PI / 2, 0, 0],
    ))
  }
  dial.add(cylinder(0.060, 0.028, [0, 0, 0.060], materials.paperLight, 10, [Math.PI / 2, 0, 0]))
  dial.add(box([0.035, 0.090, 0.028], [0.205, -0.105, 0.066], materials.brass, [0, 0, -0.40]))
  group.add(dial)

  // Proper cradle ears below the handset, rather than two posts merging into it.
  for (const side of [-1, 1]) {
    group.add(box([0.105, 0.18, 0.13], [side * 0.31, 0.49, -0.105], shadowMaterial, [0, 0, side * -0.12]))
    group.add(box([0.16, 0.055, 0.16], [side * 0.31, 0.565, -0.105], phoneMaterial))
  }

  // Curved handset: a coarse tube supplies the continuous bow seen in the
  // reference, while the chunky end bells keep the low-poly silhouette.
  const handsetCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, 0.585, -0.075),
    new THREE.Vector3(-0.20, 0.675, -0.085),
    new THREE.Vector3(0, 0.705, -0.09),
    new THREE.Vector3(0.20, 0.675, -0.085),
    new THREE.Vector3(0.34, 0.585, -0.075),
  ])
  const handsetGrip = new THREE.Mesh(new THREE.TubeGeometry(handsetCurve, 10, 0.068, 6, false), phoneMaterial)
  handsetGrip.castShadow = true; handsetGrip.receiveShadow = true; group.add(handsetGrip)

  for (const side of [-1, 1]) {
    group.add(cylinder(0.105, 0.16, [side * 0.39, 0.56, -0.07], phoneMaterial, 8, [0, 0, Math.PI / 2]))
    group.add(cylinder(0.145, 0.115, [side * 0.48, 0.545, -0.065], phoneMaterial, 9, [0, 0, Math.PI / 2]))
    group.add(cylinder(0.105, 0.016, [side * 0.545, 0.545, -0.065], shadowMaterial, 9, [0, 0, Math.PI / 2]))
  }

  // Cord leaves the right rear of the set and falls onto the desk. Keeping the
  // tube coarse makes it visible without adding a smooth modern-looking cable.
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.43, 0.22, -0.24),
    new THREE.Vector3(0.56, 0.12, -0.18),
    new THREE.Vector3(0.58, 0.01, 0.03),
    new THREE.Vector3(0.48, -0.035, 0.26),
    new THREE.Vector3(0.30, -0.055, 0.40),
  ])
  const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 9, 0.012, 5, false), materials.black)
  cord.castShadow = true; group.add(cord)

  scene.add(group)
}

const createDeskLamp = (scene: THREE.Scene, x: number, z: number, scale = 1, rotationY = 0) => {
  const group = new THREE.Group(); group.position.set(x, 0.3, z); group.rotation.y = rotationY
  const brass = new THREE.MeshStandardMaterial({ color: 0xa87925, roughness: 0.5, metalness: 0.42, flatShading: true })
  const brassDark = new THREE.MeshStandardMaterial({ color: 0x6f4f1d, roughness: 0.62, metalness: 0.34, flatShading: true })
  const shadeGreen = new THREE.MeshStandardMaterial({
    color: 0x1f4e3d,
    roughness: 0.72,
    metalness: 0.02,
    flatShading: true,
    // The shade is a hand-built frustum and is viewed from both above and
    // below as the camera moves. Double-sided rendering prevents faces from
    // disappearing because of winding/back-face culling.
    side: THREE.DoubleSide,
  })
  const warmUnderside = new THREE.MeshStandardMaterial({
    color: 0xd8c992,
    roughness: 0.86,
    metalness: 0,
    emissive: 0xb08a48,
    emissiveIntensity: 0.22,
    side: THREE.DoubleSide,
  })

  group.add(cylinder(0.285 * scale, 0.055 * scale, [0, 1.00, 0], brassDark, 14))
  group.add(cylinder(0.225 * scale, 0.070 * scale, [0, 1.055, 0], brass, 14))
  group.add(cylinder(0.145 * scale, 0.070 * scale, [0, 1.115, 0], brassDark, 12))
  group.add(cylinder(0.065 * scale, 0.055 * scale, [0, 1.175, 0], brass, 10))

  // Taller banker's-lamp stem. The base stays planted on the desk while
  // the shade is raised enough to clear the paperwork in the top-down view.
  group.add(cylinder(0.026 * scale, 0.86 * scale, [0, 1.61, 0], brass, 10))
  group.add(cylinder(0.052 * scale, 0.055 * scale, [0, 2.04, 0], brassDark, 10))
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.04, 0),
    new THREE.Vector3(0, 2.10, 0.015),
    new THREE.Vector3(0, 2.13, 0.075),
    new THREE.Vector3(0, 2.14, 0.13),
  ])
  const neck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 8, 0.024 * scale, 7, false), brass)
  neck.castShadow = true; neck.receiveShadow = true; group.add(neck)

  const halfBottomW = 0.43 * scale
  const halfBottomD = 0.19 * scale
  const halfTopW = 0.34 * scale
  const halfTopD = 0.125 * scale
  const shadeBottomY = 2.10
  const shadeTopY = 2.26
  const shadeZ = 0.13
  const shadeGeometry = new THREE.BufferGeometry()
  shadeGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -halfBottomW, shadeBottomY, shadeZ - halfBottomD,
     halfBottomW, shadeBottomY, shadeZ - halfBottomD,
     halfBottomW, shadeBottomY, shadeZ + halfBottomD,
    -halfBottomW, shadeBottomY, shadeZ + halfBottomD,
    -halfTopW, shadeTopY, shadeZ - halfTopD,
     halfTopW, shadeTopY, shadeZ - halfTopD,
     halfTopW, shadeTopY, shadeZ + halfTopD,
    -halfTopW, shadeTopY, shadeZ + halfTopD,
  ], 3))
  shadeGeometry.setIndex([
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
    4, 5, 6, 4, 6, 7,
  ])
  shadeGeometry.computeVertexNormals()
  const shade = new THREE.Mesh(shadeGeometry, shadeGreen)
  shade.castShadow = true; shade.receiveShadow = true; group.add(shade)

  const underside = new THREE.Mesh(new THREE.PlaneGeometry(0.76 * scale, 0.30 * scale), warmUnderside)
  underside.position.set(0, shadeBottomY + 0.006, shadeZ)
  underside.rotation.x = -Math.PI / 2
  group.add(underside)

  group.add(box([0.88 * scale, 0.025 * scale, 0.025 * scale], [0, shadeBottomY - 0.005, shadeZ + halfBottomD], brass))
  group.add(box([0.88 * scale, 0.025 * scale, 0.025 * scale], [0, shadeBottomY - 0.005, shadeZ - halfBottomD], brassDark))
  group.add(box([0.025 * scale, 0.025 * scale, 0.38 * scale], [-halfBottomW, shadeBottomY - 0.005, shadeZ], brassDark))
  group.add(box([0.025 * scale, 0.025 * scale, 0.38 * scale], [halfBottomW, shadeBottomY - 0.005, shadeZ], brassDark))

  const chainX = 0.34 * scale
  group.add(cylinder(0.009 * scale, 0.18 * scale, [chainX, 2.00, shadeZ + 0.10], brassDark, 6))
  group.add(cylinder(0.026 * scale, 0.035 * scale, [chainX, 1.90, shadeZ + 0.10], brass, 8))

  scene.add(group)

  // Return the physical opening of the shade so hover lighting can originate
  // from the lamp model itself rather than from an unrelated ceiling point.
  const lightSource = new THREE.Vector3(0, shadeBottomY - 0.035, shadeZ + 0.015)
  lightSource.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY)
  lightSource.add(group.position)
  return lightSource
}

const createRadioDesk = (scene: THREE.Scene) => {
  const { x, y, z, width, depth } = WORLD.radioDesk
  scene.add(box([width, 0.14, depth], [x, y, z], materials.wood))
  for (const lx of [x - width / 2 + 0.25, x + width / 2 - 0.25]) scene.add(box([0.24, y, 0.24], [lx, y / 2, z - depth * 0.25], materials.woodDark))

  // Proper 1940s communications bench based on the reference: a broad central
  // receiver/transmitter, tall loudspeaker cabinet and two companion units.
  const radioGroup = new THREE.Group(); radioGroup.position.set(x, y + 0.08, z - 0.03)
  const radioMetal = makeMaterial(0x9da39d, 0.78); radioMetal.flatShading = true
  const radioFace = makeMaterial(0xb7bbb2, 0.82); radioFace.flatShading = true
  const radioTrim = makeMaterial(0x5b6462, 0.88); radioTrim.flatShading = true
  const dialCream = makeMaterial(0xd9d2b8, 0.9)
  const dialGlass = new THREE.MeshStandardMaterial({ color: 0x394442, roughness: 0.24, metalness: 0.08 })
  const meterGlass = new THREE.MeshStandardMaterial({ color: 0xd4c8a3, roughness: 0.3, metalness: 0.02 })

  const addKnob = (parent: THREE.Group, px: number, py: number, pz: number, radius: number, material: THREE.Material = materials.black) => {
    parent.add(cylinder(radius, 0.065, [px, py, pz], material, 10, [Math.PI / 2, 0, 0]))
    parent.add(cylinder(radius * 0.28, 0.072, [px, py, pz + 0.01], dialCream, 8, [Math.PI / 2, 0, 0]))
  }
  const addVentRow = (parent: THREE.Group, px: number, py: number, pz: number, count: number, spacing: number) => {
    for (let i = 0; i < count; i += 1) parent.add(box([0.035, 0.055, 0.022], [px + (i - (count - 1) / 2) * spacing, py, pz], materials.black))
  }

  const main = new THREE.Group(); main.position.set(0, 0.34, 0)
  main.add(box([1.58, 0.76, 0.62], [0, 0, 0], radioMetal))
  main.add(box([1.50, 0.31, 0.04], [0, 0.17, 0.33], radioFace))
  main.add(box([1.50, 0.33, 0.04], [0, -0.19, 0.33], radioFace))
  main.add(box([1.52, 0.035, 0.055], [0, -0.005, 0.35], radioTrim))
  main.add(box([0.42, 0.13, 0.032], [-0.12, 0.17, 0.365], dialGlass))
  for (let i = 0; i < 5; i += 1) main.add(box([0.018, 0.085, 0.012], [-0.27 + i * 0.075, 0.17, 0.386], dialCream))
  addKnob(main, -0.56, 0.16, 0.37, 0.11)
  addKnob(main, 0.56, 0.16, 0.37, 0.11)
  addKnob(main, -0.52, -0.20, 0.37, 0.075, radioTrim)
  addKnob(main, 0.53, -0.20, 0.37, 0.075, radioTrim)
  for (const row of [-0.12, -0.23]) for (let i = 0; i < 4; i += 1) main.add(cylinder(0.022, 0.035, [-0.18 + i * 0.12, row, 0.375], materials.black, 7, [Math.PI / 2, 0, 0]))
  addVentRow(main, 0.31, 0.04, 0.37, 5, 0.07)
  radioGroup.add(main)

  // Tall speaker cabinet above the central chassis. The circular grille and
  // horizontal bars are the strongest silhouette/detail cues in the reference.
  const speaker = new THREE.Group(); speaker.position.set(0, 1.05, -0.04)
  speaker.add(box([1.16, 0.86, 0.58], [0, 0, 0], radioFace))
  speaker.add(box([1.10, 0.09, 0.60], [0, -0.39, 0], radioMetal))
  speaker.add(cylinder(0.27, 0.035, [0.12, -0.10, 0.31], materials.black, 16, [Math.PI / 2, 0, 0]))
  for (const sy of [-0.12, -0.04, 0.04, 0.12]) speaker.add(box([0.47, 0.025, 0.028], [0.12, -0.10 + sy, 0.335], radioTrim))
  speaker.add(cylinder(0.032, 0.03, [-0.43, -0.30, 0.315], materials.black, 8, [Math.PI / 2, 0, 0]))
  radioGroup.add(speaker)

  const left = new THREE.Group(); left.position.set(-1.18, 0.18, 0.04)
  left.add(box([0.82, 0.56, 0.56], [0, 0, 0], radioMetal))
  left.add(box([0.76, 0.48, 0.04], [0, 0, 0.30], radioFace))
  left.add(box([0.34, 0.20, 0.035], [-0.14, -0.11, 0.325], meterGlass))
  left.add(box([0.29, 0.015, 0.012], [-0.14, -0.11, 0.348], materials.black, [0, 0, 0.08]))
  addKnob(left, 0.24, -0.10, 0.33, 0.075)
  addVentRow(left, 0.14, 0.11, 0.33, 4, 0.065)
  left.add(box([0.34, 0.04, 0.025], [0.08, -0.23, 0.332], materials.green))
  radioGroup.add(left)

  const right = new THREE.Group(); right.position.set(1.18, 0.23, 0.02)
  right.add(box([0.82, 0.62, 0.56], [0, 0, 0], radioMetal))
  right.add(box([0.76, 0.54, 0.04], [0, 0, 0.30], radioFace))
  addKnob(right, -0.22, 0.14, 0.33, 0.095)
  addKnob(right, 0.23, 0.14, 0.33, 0.065, radioTrim)
  right.add(cylinder(0.15, 0.055, [-0.18, -0.15, 0.33], materials.black, 12, [Math.PI / 2, 0, 0]))
  right.add(cylinder(0.058, 0.064, [-0.18, -0.15, 0.345], dialCream, 10, [Math.PI / 2, 0, 0]))
  right.add(box([0.31, 0.15, 0.035], [0.22, -0.14, 0.325], dialCream))
  for (let i = 0; i < 3; i += 1) right.add(box([0.22, 0.014, 0.014], [0.22, -0.10 - i * 0.045, 0.347], radioTrim))
  radioGroup.add(right)

  // Small dark key/control box at the far left, visible in the supplied shot.
  const key = new THREE.Group(); key.position.set(-1.72, 0.10, 0.08)
  key.add(box([0.46, 0.20, 0.42], [0, 0, 0], materials.woodDark))
  key.add(box([0.38, 0.05, 0.30], [0, 0.12, -0.02], materials.black, [-0.16, 0, 0]))
  key.add(box([0.26, 0.035, 0.05], [0, 0.16, 0.04], materials.metalDark))
  radioGroup.add(key)

  scene.add(radioGroup)
}

const createProjector = (scene: THREE.Scene) => {
  const group = new THREE.Group(); group.position.set(-0.6, 1.88, 3.9); group.rotation.y = -1.57

  // The projector is deliberately more detailed than the surrounding props,
  // because it doubles as the ABOUT hotspot. Keep the geometry chunky and
  // low-poly, but make the silhouette unmistakably a 1930s/40s 16 mm machine:
  // pale die-cast body, open spoke reels, exposed film path and long lens tube.
  const enamel = makeMaterial(0xb8b5a8, 0.74); enamel.flatShading = true
  const enamelDark = makeMaterial(0x747975, 0.78); enamelDark.flatShading = true
  const reelMetal = makeMaterial(0xc4c0b1, 0.66); reelMetal.flatShading = true
  const rubber = makeMaterial(0x262928, 0.94)

  // Wide cast base with four dark isolation feet.
  group.add(box([1.02, 0.10, 0.84], [0, -0.08, 0], enamelDark))
  group.add(box([0.88, 0.045, 0.72], [0, -0.005, 0], enamel))
  for (const fx of [-0.38, 0.38]) for (const fz of [-0.29, 0.29]) group.add(box([0.13, 0.08, 0.13], [fx, -0.155, fz], rubber))

  // Main motor/lamp housing. The stacked boxes create a cast, tapered profile
  // without introducing a smooth modern-looking shell.
  group.add(box([0.76, 0.58, 0.64], [0.02, 0.29, 0], enamel))
  group.add(box([0.64, 0.24, 0.58], [0.00, 0.69, 0], enamel))
  group.add(box([0.47, 0.22, 0.54], [0.08, 0.87, 0], enamel, [0, 0, -0.10]))
  group.add(box([0.42, 0.46, 0.035], [-0.02, 0.41, 0.338], enamelDark))
  group.add(box([0.29, 0.26, 0.025], [-0.03, 0.43, 0.362], materials.black))

  // Ribbed ventilation on the visible side panel, plus a small period maker's
  // plate. These read clearly at the home camera distance without tiny meshes.
  for (let i = 0; i < 4; i += 1) group.add(box([0.30, 0.026, 0.018], [0.09, 0.12 + i * 0.085, 0.374], materials.black))
  group.add(box([0.25, 0.11, 0.02], [0.07, 0.63, 0.375], materials.brass))

  // Lens turret and stepped focusing barrel. The final glass stays slightly
  // warm, echoing an incandescent projection lamp without turning into a glow.
  group.add(cylinder(0.19, 0.20, [-0.43, 0.49, 0.01], enamelDark, 10, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.145, 0.34, [-0.68, 0.49, 0.01], materials.metalDark, 10, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.16, 0.09, [-0.87, 0.49, 0.01], enamelDark, 10, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.13, 0.17, [-0.99, 0.49, 0.01], materials.metal, 10, [0, 0, Math.PI / 2]))
  const lensMaterial = new THREE.MeshStandardMaterial({
    color: 0x17232b,
    roughness: 0.18,
    metalness: 0.18,
    emissive: 0xffd58c,
    emissiveIntensity: 0.08,
  })
  const lensGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.025, 12),
    lensMaterial,
  )
  lensGlass.position.set(-1.087, 0.49, 0.01); lensGlass.rotation.z = Math.PI / 2; lensGlass.castShadow = true; group.add(lensGlass)

  // Reel support mast and film gate. The top arm is intentionally asymmetric,
  // like period portable projectors, instead of a generic rectangular tower.
  group.add(box([0.11, 0.55, 0.13], [0.18, 0.94, 0.05], enamelDark, [0, 0, -0.06]))
  group.add(box([0.50, 0.09, 0.13], [0.03, 1.18, 0.05], enamelDark, [0, 0, 0.06]))
  group.add(box([0.16, 0.44, 0.10], [0.29, 0.67, 0.31], enamelDark))
  group.add(box([0.08, 0.36, 0.018], [0.39, 0.72, 0.375], materials.black))

  const reels: THREE.Group[] = []
  const addReel = (x: number, y: number, radius: number, rotation = 0) => {
    const reel = new THREE.Group(); reel.position.set(x, y, 0.44); reel.rotation.z = rotation

    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.034, 6, 20), reelMetal)
    outerRim.castShadow = true; outerRim.receiveShadow = true; reel.add(outerRim)
    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, 0.018, 5, 18), enamelDark)
    innerRim.castShadow = true; reel.add(innerRim)

    // Five broad spokes are much closer to the stamped aluminium reels in the
    // reference than the old solid discs, while still staying low-poly.
    for (let i = 0; i < 5; i += 1) {
      const angle = i * Math.PI * 2 / 5 + Math.PI / 10
      const length = radius * 0.68
      const center = radius * 0.45
      reel.add(box(
        [length, 0.060, 0.035],
        [Math.cos(angle) * center, Math.sin(angle) * center, 0],
        reelMetal,
        [0, 0, angle],
      ))
    }
    reel.add(cylinder(radius * 0.15, 0.12, [0, 0, 0], enamelDark, 10, [Math.PI / 2, 0, 0]))
    reel.add(cylinder(radius * 0.06, 0.15, [0, 0, 0.015], rubber, 8, [Math.PI / 2, 0, 0]))
    reels.push(reel)
    group.add(reel)
  }

  addReel(0.15, 1.18, 0.48, 0.08)
  addReel(0.15, 0.35, 0.39, -0.16)

  // Visible film path and guide rollers connect the two reels to the gate so
  // the model reads as a functioning machine rather than two wheels on a box.
  group.add(cylinder(0.064, 0.07, [0.37, 0.85, 0.43], materials.brass, 8, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.055, 0.07, [0.37, 0.62, 0.43], materials.metalDark, 8, [Math.PI / 2, 0, 0]))
  group.add(box([0.024, 0.29, 0.018], [0.40, 0.735, 0.47], rubber, [0, 0, -0.03]))

  // Large focus/control knobs and a simple folding crank are period cues that
  // remain legible in silhouette.
  group.add(cylinder(0.075, 0.075, [-0.18, 0.73, 0.365], materials.brass, 9, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.065, 0.075, [0.25, 0.73, 0.365], enamelDark, 9, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.035, 0.16, [0.45, 0.28, 0.38], enamelDark, 8, [Math.PI / 2, 0, 0]))
  group.add(box([0.20, 0.045, 0.045], [0.53, 0.30, 0.43], enamelDark, [0, 0, 0.35]))
  group.add(cylinder(0.055, 0.09, [0.62, 0.335, 0.45], rubber, 8, [Math.PI / 2, 0, 0]))

  // Projection light follows the physical lens direction. The projector group
  // is rotated toward the map, so a local -X spotlight lands on the pull-down
  // screen without hard-coding a second world-space aiming calculation.
  const projectionLight = new THREE.SpotLight(0xffefbd, 0, 18, 0.22, 0.42, 1.25)
  projectionLight.position.set(-1.08, 0.49, 0.01)
  projectionLight.target.position.set(-8, 0.49, 0.01)
  projectionLight.castShadow = true
  projectionLight.shadow.mapSize.set(512, 512)
  projectionLight.shadow.bias = -0.0003
  group.add(projectionLight, projectionLight.target)

  const lensFill = new THREE.PointLight(0xffd58c, 0, 1.8, 2)
  lensFill.position.set(-1.08, 0.49, 0.01)
  group.add(lensFill)

  scene.add(group)
  return { reels, projectionLight, lensFill, lensMaterial }
}

const createProjectionScreen = (scene: THREE.Scene) => {
  // The projector screen covers only the right half of the map. Its right edge
  // stays aligned with the map while the left edge is pulled inward, matching
  // the requested 'shorten from the left' behavior.
  const width = WORLD.map.width * 0.5
  const height = WORLD.map.height + 0.38
  const topY = Math.min(WORLD.wallHeight - 0.55, WORLD.map.y + WORLD.map.height / 2 + 0.55)
  const z = WORLD.map.z + 0.32
  const rightEdgeX = WORLD.map.x + WORLD.map.width / 2
  const screenX = rightEdgeX - width / 2
  const group = new THREE.Group()
  group.position.set(screenX, topY, z)

  const housingMaterial = makeMaterial(0x6f716b, 0.74); housingMaterial.flatShading = true
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0eee3,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide,
  })

  // Permanent ceiling roller/cassette. The cloth itself is translated so its
  // local origin sits at the top edge; scaling Y therefore unrolls it downward
  // rather than expanding from the centre.
  group.add(cylinder(0.13, width + 0.34, [0, 0, 0], housingMaterial, 12, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.17, 0.08, [-width / 2 - 0.17, 0, 0], materials.metalDark, 10, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.17, 0.08, [width / 2 + 0.17, 0, 0], materials.metalDark, 10, [0, 0, Math.PI / 2]))

  const panelGeometry = new THREE.PlaneGeometry(width, height)
  panelGeometry.translate(0, -height / 2, 0)
  const panel = new THREE.Mesh(panelGeometry, screenMaterial)
  panel.position.z = 0.035
  panel.scale.y = 0.001
  panel.castShadow = true
  panel.receiveShadow = true
  group.add(panel)

  const bottomBar = box([width + 0.08, 0.075, 0.075], [0, -0.04, 0.055], housingMaterial)
  bottomBar.visible = false
  group.add(bottomBar)
  scene.add(group)

  const setProgress = (value: number) => {
    const progress = THREE.MathUtils.clamp(value, 0, 1)
    panel.scale.y = Math.max(progress, 0.001)
    bottomBar.position.y = -height * progress
    bottomBar.visible = progress > 0.015
  }

  return { setProgress }
}

const createPendant = (scene: THREE.Scene, position: [number, number, number], color: number, intensity: number, distance: number) => {
  const [x, y, z] = position
  const group = new THREE.Group(); group.position.set(x, y, z)
  const cordMaterial = makeMaterial(0x171918, 0.9); cordMaterial.flatShading = true
  const socketMaterial = makeMaterial(0x292d2a, 0.82); socketMaterial.flatShading = true
  const shadeMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.08,
    flatShading: true,
    side: THREE.DoubleSide,
  })
  const shadeInterior = new THREE.MeshStandardMaterial({
    color: 0xe5dfc2,
    roughness: 0.88,
    metalness: 0,
    emissive: 0xb88d4b,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide,
  })
  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe2a1,
    roughness: 0.35,
    emissive: 0xffc86c,
    emissiveIntensity: 0.75,
  })

  // Long black drop cable and compact Bakelite socket, matching the simple
  // utilitarian pendant in the reference instead of a generic cone on a rod.
  group.add(cylinder(0.016, 1.72, [0, 1.22, 0], cordMaterial, 8))
  group.add(cylinder(0.050, 0.10, [0, 0.34, 0], socketMaterial, 10))
  group.add(cylinder(0.075, 0.08, [0, 0.27, 0], socketMaterial, 10))
  group.add(cylinder(0.105, 0.055, [0, 0.20, 0], socketMaterial, 12))

  // Shallow enamel bell shade with a rounded shoulder and wide lower lip.
  const shadeProfile = [
    new THREE.Vector2(0.09, 0.19),
    new THREE.Vector2(0.16, 0.16),
    new THREE.Vector2(0.27, 0.10),
    new THREE.Vector2(0.39, 0.00),
    new THREE.Vector2(0.47, -0.11),
    new THREE.Vector2(0.50, -0.15),
  ]
  const shade = new THREE.Mesh(new THREE.LatheGeometry(shadeProfile, 12), shadeMaterial)
  shade.castShadow = true
  shade.receiveShadow = true
  group.add(shade)

  // Pale enamel underside, rolled dark rim and exposed warm bulb are the main
  // period cues visible from the room camera.
  const interior = new THREE.Mesh(new THREE.CircleGeometry(0.44, 16), shadeInterior)
  interior.position.y = -0.135
  interior.rotation.x = -Math.PI / 2
  group.add(interior)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.495, 0.018, 6, 18), socketMaterial)
  rim.position.y = -0.145
  rim.rotation.x = Math.PI / 2
  rim.castShadow = true
  group.add(rim)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), bulbMaterial)
  bulb.position.y = -0.09
  bulb.scale.set(0.82, 1.12, 0.82)
  group.add(bulb)

  scene.add(group)

  // The fixture in the reference throws a concentrated pool onto the map.
  // A spotlight reproduces that better than the previous omnidirectional bulb.
  const light = new THREE.SpotLight(0xffd38a, intensity * 1.35, distance, 0.70, 0.48, 1.7)
  light.position.set(x, y - 0.10, z)
  light.castShadow = true
  light.shadow.mapSize.set(512, 512)
  light.shadow.bias = -0.00025
  light.target.position.set(x - 0.25, y - 3.0, z - 0.15)
  scene.add(light, light.target)

  // Low-power local fill keeps the bulb and pale underside visibly warm.
  const bulbFill = new THREE.PointLight(0xffd89a, intensity * 0.16, 1.4, 2)
  bulbFill.position.set(x, y - 0.08, z)
  scene.add(bulbFill)
}

const createWallFan = (scene: THREE.Scene) => {
  const group = new THREE.Group(); group.position.set(2.25, 4.55, 2.2); group.rotation.y = -Math.PI / 2
  const fanMetal = makeMaterial(0x9ca19c, 0.74); fanMetal.flatShading = true
  const fanDark = makeMaterial(0x343b3a, 0.84); fanDark.flatShading = true
  const fanBladeMaterial = new THREE.MeshStandardMaterial({
    color: 0xb1b2aa,
    roughness: 0.76,
    metalness: 0.08,
    flatShading: true,
    side: THREE.DoubleSide,
  })

  // Heavy circular wall plate, short mounting arm and cylindrical motor body.
  // These make the fan read as a real wall-mounted appliance rather than a
  // floating cage with a rod behind it.
  // The post's near face is at world x=2.99. With this group's rotation and
  // position, the plate's rear face lands exactly on that surface: touching,
  // not buried in the post and not floating short of it.
  group.add(cylinder(0.27, 0.09, [0, 0, -0.70], fanDark, 16, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.075, 0.58, [0, 0, -0.415], fanDark, 10, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.17, 0.25, [0, 0, -0.13], fanDark, 12, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.135, 0.17, [0, 0, 0.07], fanMetal, 12, [Math.PI / 2, 0, 0]))

  // A small fork/yoke below the motor suggests the adjustable tilt joint seen
  // on period wall fans.
  group.add(box([0.055, 0.31, 0.055], [-0.20, -0.10, -0.13], fanDark, [0, 0, -0.18]))
  group.add(box([0.055, 0.31, 0.055], [0.20, -0.10, -0.13], fanDark, [0, 0, 0.18]))
  group.add(cylinder(0.055, 0.46, [0, -0.24, -0.13], fanDark, 8, [0, 0, Math.PI / 2]))

  // Deep wire cage: front and rear hoops, an inner stabilising ring, radial
  // spokes and short bridge clips around the perimeter. This replaces the old
  // overlapping half-tori that made the guard look tangled in silhouette.
  const rearZ = 0.02
  const frontZ = 0.22
  for (const z of [rearZ, frontZ]) {
    const outer = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.014, 5, 28), fanDark)
    outer.position.z = z; outer.castShadow = true; group.add(outer)
    const inner = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.010, 5, 24), fanDark)
    inner.position.z = z; inner.castShadow = true; group.add(inner)
  }

  const addRadialWire = (angle: number, z: number, innerRadius: number, outerRadius: number) => {
    const length = outerRadius - innerRadius
    const mid = innerRadius + length / 2
    group.add(box(
      [length, 0.018, 0.018],
      [Math.cos(angle) * mid, Math.sin(angle) * mid, z],
      fanDark,
      [0, 0, angle],
    ))
  }
  for (let i = 0; i < 12; i += 1) {
    const angle = i * Math.PI * 2 / 12
    addRadialWire(angle, frontZ, 0.14, 0.56)
  }
  for (let i = 0; i < 8; i += 1) {
    const angle = i * Math.PI * 2 / 8 + Math.PI / 8
    addRadialWire(angle, rearZ, 0.16, 0.56)
    group.add(box(
      [0.020, 0.020, frontZ - rearZ],
      [Math.cos(angle) * 0.565, Math.sin(angle) * 0.565, (frontZ + rearZ) / 2],
      fanDark,
    ))
  }

  // Four broad stamped-metal blades. A simple faceted polygon is closer to the
  // chunky rounded paddles in the reference than the previous five rectangles.
  const bladeGeometry = new THREE.BufferGeometry()
  bladeGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0.09, -0.035, 0.00,
    0.18, -0.105, 0.01,
    0.47, -0.145, -0.025,
    0.53, 0.020, -0.055,
    0.30, 0.185, -0.025,
    0.13, 0.095, 0.00,
  ], 3))
  bladeGeometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5])
  bladeGeometry.computeVertexNormals()

  const spinner = new THREE.Group(); spinner.position.z = 0.12; group.add(spinner)
  for (let i = 0; i < 4; i += 1) {
    const pivot = new THREE.Group(); pivot.rotation.z = i * Math.PI / 2 + 0.22
    const blade = new THREE.Mesh(bladeGeometry, fanBladeMaterial)
    blade.castShadow = true; blade.receiveShadow = true
    pivot.add(blade); spinner.add(pivot)
  }

  // Layered hub/cap gives the centre the cast-metal depth visible in the shot.
  group.add(cylinder(0.145, 0.10, [0, 0, 0.14], fanDark, 12, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.095, 0.075, [0, 0, 0.215], fanMetal, 10, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.040, 0.085, [0, 0, 0.255], fanDark, 8, [Math.PI / 2, 0, 0]))

  // Hanging power cord loop below the mount, another strong cue from the
  // supplied reference image.
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.16, -0.13, -0.55),
    new THREE.Vector3(0.23, -0.34, -0.55),
    new THREE.Vector3(0.20, -0.62, -0.55),
    new THREE.Vector3(0.03, -0.72, -0.55),
    new THREE.Vector3(-0.08, -0.56, -0.55),
  ])
  const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 10, 0.010, 5, false), materials.black)
  cord.castShadow = true; group.add(cord)

  scene.add(group)
  return spinner
}

const createPaperCluster = (scene: THREE.Scene) => {
  const papers = new THREE.Group(); papers.position.set(-1.85, 1.3, 2.35)
  papers.add(box([1.75, 0.025, 1.15], [0, 0, 0], materials.paperLight, [0, 0.08, 0]))
  papers.add(box([1.35, 0.028, 0.95], [0.2, 0.035, 0.13], materials.paper, [0, -0.05, 0])); scene.add(papers)
}

const createFolders = (scene: THREE.Scene) => {
  // Two-tier wartime office letter tray, matching the reference more closely
  // than the previous stack of solid boxes. The open fronts keep the papers
  // readable from both the home camera and the top-down WRITING view.
  const group = new THREE.Group(); group.position.set(-1.95, 1.30, -0.15)
  const trayGreen = makeMaterial(0x173b30, 0.82); trayGreen.flatShading = true
  const trayEdge = makeMaterial(0x0f2a22, 0.88); trayEdge.flatShading = true

  const addTray = (y: number) => {
    group.add(box([1.58, 0.045, 1.06], [0, y, 0], trayGreen))
    group.add(box([1.58, 0.16, 0.055], [0, y + 0.08, -0.50], trayGreen))
    group.add(box([0.055, 0.16, 1.00], [-0.76, y + 0.08, 0], trayGreen))
    group.add(box([0.055, 0.16, 1.00], [0.76, y + 0.08, 0], trayGreen))
    group.add(box([1.58, 0.075, 0.045], [0, y + 0.04, 0.50], trayEdge))
  }

  const lowerY = 0.035
  const upperY = 0.39
  addTray(lowerY)
  addTray(upperY)

  for (const x of [-0.73, 0.73]) {
    for (const z of [-0.45, 0.45]) {
      group.add(box([0.045, upperY - lowerY, 0.045], [x, (lowerY + upperY) / 2, z], trayEdge))
    }
  }

  const addPaperStack = (baseY: number, count: number, zOffset: number, skew: number) => {
    for (let i = 0; i < count; i += 1) {
      const paperMaterial = i % 3 === 1 ? materials.paper : materials.paperLight
      group.add(box(
        [1.22 - i * 0.012, 0.012, 0.76 - i * 0.006],
        [0.02 + i * 0.006, baseY + i * 0.013, zOffset + i * 0.004],
        paperMaterial,
        [0, skew + (i - count / 2) * 0.006, 0],
      ))
    }
  }

  addPaperStack(lowerY + 0.045, 7, 0.01, -0.025)
  addPaperStack(upperY + 0.045, 9, 0.00, 0.018)
  scene.add(group)

  // A single working stack sits outside the trays. Its sheets use the same
  // A4-like footprint as the tray papers, but the whole stack is turned 90°
  // so it lies perpendicular to the trays. Keep the table free of loose pages.
  const deskPapers = new THREE.Group(); deskPapers.position.set(-2.38, 1.305, 0.92)
  for (let i = 0; i < 11; i += 1) {
    deskPapers.add(box(
      [1.22 - i * 0.012, 0.011, 0.76 - i * 0.006],
      [i * 0.006, i * 0.012, i * -0.003],
      i % 4 === 0 ? materials.paper : materials.paperLight,
      [0, Math.PI / 2 - 0.055 + i * 0.008, 0],
    ))
  }
  scene.add(deskPapers)
}

const createHotspot = (scene: THREE.Scene, id: SectionId, size: [number, number, number], position: [number, number, number]) => {
  const hitbox = box(size, position, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
  hitbox.userData.hotspot = id; hitbox.castShadow = false; hitbox.receiveShadow = false
  const highlight = box([size[0] * 1.02, size[1] * 1.02, size[2] * 1.02], position, new THREE.MeshBasicMaterial({ color: 0xa5d778, transparent: true, opacity: 0.075, depthWrite: false, blending: THREE.AdditiveBlending }))
  highlight.visible = false; highlight.castShadow = false; highlight.receiveShadow = false
  scene.add(hitbox, highlight)
  return { id, label: SECTIONS[id].label, href: SECTIONS[id].href, hitbox, highlight, cameraOffset: new THREE.Vector3() } satisfies Hotspot
}

const createMapSconce = (scene: THREE.Scene) => {
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

const createClosetSconce = (scene: THREE.Scene) => {
  const mount = CLOSET_SCONCE_MOUNT.clone()
  const source = CLOSET_SCONCE_SOURCE.clone()
  const target = new THREE.Vector3(WORLD.closet.x, 2.55, WORLD.backWallZ + 0.12)
  const aim = target.clone().sub(source).normalize()
  const darkMetal = makeMaterial(0x252b27, 0.80); darkMetal.flatShading = true
  const greenEnamel = new THREE.MeshStandardMaterial({
    color: 0x354d27,
    roughness: 0.74,
    metalness: 0.10,
    flatShading: true,
    side: THREE.DoubleSide,
  })
  const warmInterior = new THREE.MeshStandardMaterial({
    color: 0xe2d7ad,
    roughness: 0.88,
    emissive: 0xc9994e,
    emissiveIntensity: 0.24,
    side: THREE.DoubleSide,
  })

  scene.add(cylinder(0.15, 0.07, [mount.x, mount.y, mount.z], darkMetal, 12, [Math.PI / 2, 0, 0]))
  const armCurve = new THREE.CatmullRomCurve3([
    mount.clone().add(new THREE.Vector3(0, 0, 0.04)),
    mount.clone().add(new THREE.Vector3(0, 0, 0.32)),
    new THREE.Vector3(source.x, source.y + 0.16, source.z - 0.12),
    source.clone().addScaledVector(aim, -0.10),
  ])
  const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 10, 0.032, 7, false), darkMetal)
  arm.castShadow = true; arm.receiveShadow = true; scene.add(arm)

  const shadeLength = 0.31
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, shadeLength, 10, 1, true), greenEnamel)
  shade.position.copy(source).addScaledVector(aim, -shadeLength / 2)
  shade.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim)
  shade.castShadow = true; shade.receiveShadow = true; scene.add(shade)

  const reflector = new THREE.Mesh(new THREE.CircleGeometry(0.23, 12), warmInterior)
  reflector.position.copy(source).addScaledVector(aim, -0.010)
  reflector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), aim)
  scene.add(reflector)

  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe7ad,
    roughness: 0.34,
    emissive: 0xffc96c,
    emissiveIntensity: 0.64,
  })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 9, 7), bulbMaterial)
  bulb.position.copy(source).addScaledVector(aim, -0.045)
  scene.add(bulb)

  const glow = new THREE.PointLight(0xffd38a, 0.16, 1.0, 2)
  glow.position.copy(source)
  scene.add(glow)
  return source
}

const createHoverTarget = (
  scene: THREE.Scene,
  id: string,
  label: string,
  size: [number, number, number],
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  lightSources: THREE.Vector3[] = [],
): HoverTarget => {
  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false })
  const mesh = box(size, position, hitMaterial, rotation)
  mesh.visible = true
  mesh.userData.hoverTarget = id
  mesh.castShadow = false
  mesh.receiveShadow = false
  mesh.renderOrder = 20
  scene.add(mesh)

  // Kept only as part of the HoverTarget shape; visible hover feedback is
  // produced exclusively by real spotlights so it respects scene depth.
  const material = new THREE.MeshBasicMaterial({
    color: 0xffd77a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })

  let sources = [new THREE.Vector3(position[0], 6.45, position[2])]
  let targets = [new THREE.Vector3(...position)]
  let radius = Math.max(size[0], size[2]) * 0.58
  let intensity = 12

  if (id === 'radio') {
    sources = [new THREE.Vector3(WORLD.radioDesk.x, 6.35, WORLD.radioDesk.z - 0.05)]
    targets = [new THREE.Vector3(WORLD.radioDesk.x, 1.72, WORLD.radioDesk.z)]
    radius = 2.05
    intensity = 13
  } else if (id === 'trays') {
  // No detached/fallback tray light: the two physical desk lamps are
  // the only WRITING hover-light sources. Each pool starts at a shade
  // opening and lands on one half of the tray stack.
  sources = lightSources.map((source) => source.clone())
  targets = [
    new THREE.Vector3(position[0] - 0.10, 1.43, position[2] - 0.30),
    new THREE.Vector3(position[0] + 0.08, 1.41, position[2] + 0.34),
  ]
  radius = 0.88
  intensity = 9.5
  } else if (id === 'projector') {
    sources = [new THREE.Vector3(position[0] + 0.05, 6.30, position[2] - 0.06)]
    targets = [new THREE.Vector3(position[0], 2.35, position[2])]
    radius = 1.05
    intensity = 11
  } else if (id === 'map') {
    sources = [MAP_SCONCE_SOURCE.clone()]
    targets = [new THREE.Vector3(WORLD.map.x, WORLD.map.y + 0.10, WORLD.map.z + 0.06)]
    radius = 2.05
    intensity = 28
  } else if (id === 'back-door') {
    sources = lightSources.length > 0 ? lightSources.map((source) => source.clone()) : [CLOSET_SCONCE_SOURCE.clone()]
    targets = [new THREE.Vector3(WORLD.closet.x, 2.45, WORLD.backWallZ + 0.10)]
    radius = 1.05
    intensity = 16
  }

  const lights = sources.map((source, index) => {
    const target = targets[Math.min(index, targets.length - 1)]
    const distance = source.distanceTo(target)
    const angle = THREE.MathUtils.clamp(Math.atan(radius / distance), 0.18, 0.72)
    const light = new THREE.SpotLight(0xffd27a, 0, distance + 4, angle, 0.48, 1.45)
    light.position.copy(source)
    light.target.position.copy(target)
    light.castShadow = true
    light.shadow.mapSize.set(1024, 1024)
    light.shadow.camera.near = 0.04
    light.shadow.camera.far = distance + 4
    light.shadow.bias = -0.00025
    light.shadow.normalBias = 0.025
    light.userData.hoverIntensity = intensity
    scene.add(light, light.target)
    return light
  })

  return { id, label, mesh, material, lights }
}

const createScene = (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  const updateClock = createRoomShell(scene); const closet = createBackCloset(scene); createTable(scene); createRadioDesk(scene); createMapBoard(scene); const projector = createProjector(scene); const projectionScreen = createProjectionScreen(scene); createPaperCluster(scene); createFolders(scene); const fanSpinner = createWallFan(scene)
  createChair(scene, -4.65, 0.65, -1.07); createChair(scene, 2.5, -0.2, 1.91); createChair(scene, 2.5, 3.35, 1.31)
  createPhone(scene, -0.6, -2.0, 0x315b3c, 0); createPhone(scene, -0.6, -1.0, 0xd8ceb0, 1.57); createPhone(scene, -0.6, 0, PALETTE.red, -1.57); createPhone(scene, -0.6, 1.0, 0xd9d1b8, 1.57); createPhone(scene, -0.6, 2.0, 0x315b3c, -1.57)
  const trayLampRear = createDeskLamp(scene, -2.25, -1.15, 0.9, -0.04)
  // In the rotated top-down WRITING view +X is screen-up. Move the
  // right-hand lamp upward, but stop before its shade reaches the raised
  // brown centre box (which begins at x = -1.20).
  const trayLampFront = createDeskLamp(scene, -1.68, 0.85, 0.92, 0.03)
  createDeskLamp(scene, 0.9, -3.0, 0.82, 0.06)
  createPendant(scene, [-1.35, 5.0, -4.75], 0x5e8a32, 1.4, 5)
  createMapSconce(scene)
  const closetLampSource = createClosetSconce(scene)
  const boardDraw = createHangingBoard(scene)
  const hotspots: Hotspot[] = [
  // Navigation is intentionally disabled for now. These meshes only define
  // hover/select coverage and the matching highlight volume.
  createHotspot(scene, 'work', [8.55, 4.5, 0.28], [WORLD.map.x, WORLD.map.y, WORLD.map.z + 0.3]),
  createHotspot(scene, 'contact', [3.9, 1.45, 1.5], [WORLD.radioDesk.x, 1.55, WORLD.radioDesk.z]),
  createHotspot(scene, 'speaking', [1.5, 1.25, 1.6], [-0.6, 2.45, 3.9]),
  createHotspot(scene, 'writing', [1.65, 0.75, 1.25], [-1.95, 1.65, -0.15]),
  createHotspot(scene, 'about', [1.8, 4.85, 0.18], [2.75, 2.45, WORLD.backWallZ + 0.20]),
]
const hoverTargets: HoverTarget[] = [
  // Map → WORK, Radio → CONTACT, Projector → SPEAKING,
  // Trays → WRITING, Back door → ABOUT.
  createHoverTarget(scene, 'map', 'WORK', [8.55, 4.5, 0.12], [WORLD.map.x, WORLD.map.y, WORLD.map.z + 0.18]),
  createHoverTarget(scene, 'radio', 'CONTACT', [3.9, 1.45, 1.5], [WORLD.radioDesk.x, 1.55, WORLD.radioDesk.z]),
  createHoverTarget(scene, 'projector', 'SPEAKING', [1.5, 1.25, 1.6], [-0.6, 2.45, 3.9]),
  createHoverTarget(scene, 'trays', 'WRITING', [1.65, 0.75, 1.25], [-1.95, 1.65, -0.15], [0, 0, 0], [trayLampRear, trayLampFront]),
  createHoverTarget(scene, 'back-door', 'ABOUT', [1.8, 4.85, 0.12], [2.75, 2.45, WORLD.backWallZ + 0.20], [0, 0, 0], [closetLampSource]),
]
  camera.position.set(-4.08, 4.47, 10.34); camera.lookAt(-2.15, 2.7, -4.75)
  return { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock, projector, projectionScreen, closet }
}

export const mountOperationRoom = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-operation-room-canvas]')
  const loading = root.querySelector<HTMLElement>('[data-operation-room-loading]')
  const live = root.querySelector<HTMLElement>('[data-operation-room-live]')
  const zoomOutButton = root.querySelector<HTMLButtonElement>('[data-operation-room-zoom-out]')
  if (!canvas) return () => undefined

  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x35413f); scene.fog = new THREE.Fog(0x35413f, 12, 30)
  const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 60)
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  } catch {
    root.dataset.webgl = 'failed'; loading?.setAttribute('data-ready', 'true'); return () => undefined
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap

  scene.add(new THREE.HemisphereLight(0xc6d0cc, 0x66543c, 1.25))
  const warmFill = new THREE.DirectionalLight(0xffd599, 1.15); warmFill.position.set(-4, 7, 7); warmFill.castShadow = true; warmFill.shadow.mapSize.set(1024, 1024); scene.add(warmFill)
  const coolFill = new THREE.DirectionalLight(0xb8d0cb, 0.45); coolFill.position.set(7, 5, -1); scene.add(coolFill)

  const { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock, projector, projectionScreen, closet } = createScene(scene, camera)
  const pointer = new THREE.Vector2(2, 2)
  const hoverRaycaster = new THREE.Raycaster()
  const HOME_POSITION = new THREE.Vector3(-5.08, 4.14, 8.58)
  const HOME_TARGET = new THREE.Vector3(-2.15, 2.7, -4.75)
  const HOME_UP = new THREE.Vector3(0, 1, 0)
  // Looking straight down while keeping +X at the top of the image is the same
  // orientation the viewer gets by facing the brown-door wall and tilting down.
  const TRAYS_UP = new THREE.Vector3(1, 0, 0)
  const MAP_TARGET = new THREE.Vector3(WORLD.map.x, WORLD.map.y, WORLD.map.z + 0.06)
  const RADIO_TARGET = new THREE.Vector3(WORLD.radioDesk.x, 1.92, WORLD.radioDesk.z + 0.04)
  const TRAYS_TARGET = new THREE.Vector3(-1.95, 1.50, -0.15)
  const CLOSET_TARGET = new THREE.Vector3(WORLD.closet.x, 2.42, WORLD.backWallZ - WORLD.closet.depth * 0.72)
  const TARGET_BOUNDS = { minX: -6, maxX: 4, minY: 0.8, maxY: 5.2, minZ: -5.8, maxZ: 4 }
  const cameraTarget = HOME_TARGET.clone()
  const controls = new OrbitControls(camera, canvas)
  controls.target.copy(HOME_TARGET)
  camera.position.copy(HOME_POSITION)
  camera.up.copy(HOME_UP)
  controls.enabled = true
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 5
  controls.maxDistance = 22
  controls.minPolarAngle = 0.5
  controls.maxPolarAngle = 1.53
  controls.minAzimuthAngle = -0.98
  controls.maxAzimuthAngle = 0.72
  controls.update()
  let activeId: SectionId = 'work'; let frame = 0; let disposed = false
  let lastTime = performance.now()
  let projectorActive = false
  let projectorScreenProgress = 0
  let closetProgress = 0
  let closetTargetProgress = 0
  let viewMode: 'home' | 'transition' | 'map' | 'radio' | 'trays' | 'closet' = 'home'
  let cameraTransition: {
    startTime: number
    duration: number
    path: THREE.Curve<THREE.Vector3>
    startTarget: THREE.Vector3
    endTarget: THREE.Vector3
    startUp: THREE.Vector3
    endUp: THREE.Vector3
    traysSequence?: {
      forwardPosition: THREE.Vector3
      forwardTarget: THREE.Vector3
      turnPosition: THREE.Vector3
      turnTarget: THREE.Vector3
    }
    destination: 'home' | 'map' | 'radio' | 'trays' | 'closet'
  } | null = null
  const FAN_SPEED = 4
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const applyMotionPreference = () => { controls.enableDamping = !reducedMotion.matches }
  applyMotionPreference()

  const setHoverHighlight = (target: HoverTarget, active: boolean) => {
    target.lights.forEach((light) => {
      light.intensity = active ? Number(light.userData.hoverIntensity ?? 12) : 0
    })
    target.material.opacity = 0
  }
  const clearHoverHighlights = () => hoverTargets.forEach((target) => setHoverHighlight(target, false))

  const setActive = (id: SectionId) => {
  // Re-entering the same target must restore its cover after a pointer leave.
  activeId = id; boardDraw(SECTIONS[id].label); if (live) live.textContent = `${SECTIONS[id].label} selected`
  // Legacy hotspot boxes remain raycast/navigation metadata only. The visible
  // hover feedback now comes exclusively from the scene spotlights.
  hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
}
const selectDefault = () => { activeId = 'work'; boardDraw('WORK'); hotspots.forEach((hotspot) => { hotspot.highlight.visible = false }) }
  const getMapViewPosition = () => {
    // Dolly close enough for the complete framed map to fill the viewport.
    // The distance is derived from both vertical and horizontal FOV so the
    // framing remains correct across wide and narrow desktop windows.
    const frameWidth = WORLD.map.width + 0.28
    const frameHeight = WORLD.map.height + 0.28
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (frameHeight * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (frameWidth * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.015
    return new THREE.Vector3(WORLD.map.x, WORLD.map.y, WORLD.map.z + distance)
  }
  const getRadioViewPosition = () => {
    // Keep the whole communications bench in frame while moving the camera
    // physically through the room. This is a real dolly move, not a CSS/FOV fake.
    const frameWidth = WORLD.radioDesk.width + 0.45
    const frameHeight = 2.55
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (frameHeight * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (frameWidth * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.10
    return new THREE.Vector3(RADIO_TARGET.x + 0.04, RADIO_TARGET.y + 0.10, RADIO_TARGET.z + distance)
  }
  const getTraysViewPosition = () => {
    // True top-down WRITING view. The camera roll is handled separately with
    // TRAYS_UP so the top of the image points toward the brown-door wall (+X).
    const frameWidth = 1.95
    const frameDepth = 1.55
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (frameDepth * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (frameWidth * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.24
    return new THREE.Vector3(TRAYS_TARGET.x, TRAYS_TARGET.y + distance, TRAYS_TARGET.z)
  }
  const getClosetViewPosition = () => {
    // Frame almost the entire doorway while aiming slightly into the recess so
    // the final shot reads as looking into a small room rather than at a door.
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (WORLD.closet.height * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (WORLD.closet.width * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.14
    return new THREE.Vector3(CLOSET_TARGET.x + 0.12, CLOSET_TARGET.y + 0.04, CLOSET_TARGET.z + distance)
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
      camera.up.copy(HOME_UP)
      controls.target.copy(MAP_TARGET)
    } else if (viewMode === 'radio') {
      camera.position.copy(getRadioViewPosition())
      cameraTarget.copy(RADIO_TARGET)
      camera.up.copy(HOME_UP)
      controls.target.copy(RADIO_TARGET)
    } else if (viewMode === 'trays') {
      camera.position.copy(getTraysViewPosition())
      cameraTarget.copy(TRAYS_TARGET)
      camera.up.copy(TRAYS_UP)
      controls.target.copy(TRAYS_TARGET)
    } else if (viewMode === 'closet') {
      camera.position.copy(getClosetViewPosition())
      cameraTarget.copy(CLOSET_TARGET)
      camera.up.copy(HOME_UP)
      controls.target.copy(CLOSET_TARGET)
    }
  }
  const updatePointer = (event: PointerEvent) => { const bounds = canvas.getBoundingClientRect(); pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1; pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1 }
  // Fifth-order smoothstep gives zero velocity and zero acceleration at both
  // ends, closer to a programmed motion-control camera move.
  const easeMotionControl = (value: number) => value * value * value * (value * (value * 6 - 15) + 10)
  const settleControls = (enabled: boolean) => {
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
  const startMapDolly = () => {
    if (viewMode !== 'home') return
    controls.enabled = false

    clearHoverHighlights()
    hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
    boardDraw('WORK')

    const end = getMapViewPosition()
    if (reducedMotion.matches) {
      camera.position.copy(end)
      cameraTarget.copy(MAP_TARGET)
      controls.target.copy(MAP_TARGET)
      camera.up.copy(HOME_UP)
      viewMode = 'map'
      settleControls(false)
      setZoomOutVisible(true)
      return
    }

    const start = camera.position.clone()
    const direction = end.clone().sub(start)
    const firstGuide = start.clone().addScaledVector(direction, 0.34).add(new THREE.Vector3(0, 0.16, 0.28))
    const secondGuide = start.clone().addScaledVector(direction, 0.72).add(new THREE.Vector3(0.12, 0.08, 0.08))
    cameraTransition = {
      startTime: performance.now(),
      duration: 2200,
      path: new THREE.CatmullRomCurve3([start, firstGuide, secondGuide, end], false, 'catmullrom', 0.42),
      startTarget: controls.target.clone(),
      endTarget: MAP_TARGET.clone(),
      startUp: camera.up.clone(),
      endUp: HOME_UP.clone(),
      destination: 'map',
    }
    setZoomOutVisible(false)
    viewMode = 'transition'
  }
  const startRadioDolly = () => {
    if (viewMode !== 'home') return
    controls.enabled = false

    clearHoverHighlights()
    hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
    boardDraw('CONTACT')

    const end = getRadioViewPosition()
    if (reducedMotion.matches) {
      camera.position.copy(end)
      cameraTarget.copy(RADIO_TARGET)
      controls.target.copy(RADIO_TARGET)
      camera.up.copy(HOME_UP)
      viewMode = 'radio'
      settleControls(false)
      setZoomOutVisible(true)
      return
    }

    const start = camera.position.clone()
    const direction = end.clone().sub(start)
    // A single cubic Bezier avoids the small Catmull-Rom overshoot that made
    // the old radio move wobble near the desk. The controls preserve forward
    // momentum and only introduce a restrained lateral settle at the end.
    const controlA = start.clone().addScaledVector(direction, 0.30).add(new THREE.Vector3(-0.05, 0.06, 0.12))
    const controlB = start.clone().addScaledVector(direction, 0.72).add(new THREE.Vector3(-0.04, 0.03, 0.06))
    cameraTransition = {
      startTime: performance.now(),
      duration: 2350,
      path: new THREE.CubicBezierCurve3(start, controlA, controlB, end),
      startTarget: controls.target.clone(),
      endTarget: RADIO_TARGET.clone(),
      startUp: camera.up.clone(),
      endUp: HOME_UP.clone(),
      destination: 'radio',
    }
    setZoomOutVisible(false)
    viewMode = 'transition'
  }
  const startTraysDolly = () => {
    if (viewMode !== 'home') return
    controls.enabled = false

    clearHoverHighlights()
    hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
    boardDraw('WRITING')

    const end = getTraysViewPosition()
    if (reducedMotion.matches) {
      camera.position.copy(end)
      cameraTarget.copy(TRAYS_TARGET)
      controls.target.copy(TRAYS_TARGET)
      camera.up.copy(TRAYS_UP)
      viewMode = 'trays'
      settleControls(false)
      setZoomOutVisible(true)
      return
    }

    const start = camera.position.clone()
    const startTarget = controls.target.clone()
    const forwardDirection = startTarget.clone().sub(start).normalize()

    // WRITING uses a deliberately staged motion-control move instead of a
    // single simultaneous arc: first dolly forward while holding the view,
    // then make a clear right turn toward the brown-door wall, and only
    // after the turn is established rise over the trays and tilt down.
    const forwardPosition = start.clone().addScaledVector(forwardDirection, 4.15)
    const forwardTarget = startTarget.clone().addScaledVector(forwardDirection, 4.15)
    const turnPosition = new THREE.Vector3(
      TRAYS_TARGET.x - 2.45,
      TRAYS_TARGET.y + 1.55,
      TRAYS_TARGET.z + 0.10,
    )
    const turnTarget = new THREE.Vector3(
      TRAYS_TARGET.x + 0.65,
      TRAYS_TARGET.y + 0.95,
      TRAYS_TARGET.z,
    )

    cameraTransition = {
      startTime: performance.now(),
      duration: 3000,
      // The generic path remains the source of the exact first/final camera
      // positions; the render loop uses the staged waypoints in between.
      path: new THREE.CubicBezierCurve3(start, forwardPosition, turnPosition, end),
      startTarget,
      endTarget: TRAYS_TARGET.clone(),
      startUp: camera.up.clone(),
      endUp: TRAYS_UP.clone(),
      traysSequence: { forwardPosition, forwardTarget, turnPosition, turnTarget },
      destination: 'trays',
    }
    setZoomOutVisible(false)
    viewMode = 'transition'
  }
  const startClosetDolly = () => {
    if (viewMode !== 'home') return
    controls.enabled = false

    clearHoverHighlights()
    hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
    boardDraw('ABOUT')
    closetTargetProgress = 1

    const end = getClosetViewPosition()
    if (reducedMotion.matches) {
      closetProgress = 1
      closet.setProgress(1)
      camera.position.copy(end)
      cameraTarget.copy(CLOSET_TARGET)
      controls.target.copy(CLOSET_TARGET)
      camera.up.copy(HOME_UP)
      viewMode = 'closet'
      settleControls(false)
      setZoomOutVisible(true)
      return
    }

    const start = camera.position.clone()
    const direction = end.clone().sub(start)
    // Glide toward the doorway with a small lateral settle. The door begins to
    // open as the camera approaches and swings fully inward before the close-up.
    const controlA = start.clone().addScaledVector(direction, 0.30).add(new THREE.Vector3(0.16, 0.04, 0.16))
    const controlB = start.clone().addScaledVector(direction, 0.76).add(new THREE.Vector3(0.22, -0.03, 0.04))
    cameraTransition = {
      startTime: performance.now(),
      duration: 2650,
      path: new THREE.CubicBezierCurve3(start, controlA, controlB, end),
      startTarget: controls.target.clone(),
      endTarget: CLOSET_TARGET.clone(),
      startUp: camera.up.clone(),
      endUp: HOME_UP.clone(),
      destination: 'closet',
    }
    setZoomOutVisible(false)
    viewMode = 'transition'
  }
  const setProjectorActive = (active: boolean) => {
    projectorActive = active
    if (reducedMotion.matches) {
      projectorScreenProgress = active ? 1 : 0
      projectionScreen.setProgress(projectorScreenProgress)
      projector.projectionLight.intensity = active ? 7.5 : 0
      projector.lensFill.intensity = active ? 1.6 : 0
      projector.lensMaterial.emissiveIntensity = active ? 3.6 : 0.08
    }
  }
  const onPointerUp = (event: PointerEvent) => {
    if (viewMode !== 'home') return
    updatePointer(event)
    hoverRaycaster.setFromCamera(pointer, camera)
    const hit = hoverRaycaster.intersectObjects(hoverTargets.map((target) => target.mesh), false)[0]?.object
    const target = hoverTargets.find((candidate) => candidate.mesh === hit)
    if (!target) return

    if (target.id === 'projector') {
      setProjectorActive(true)
      return
    }

    // Any other menu selection retracts the screen and powers the projector off.
    setProjectorActive(false)
    if (target.id === 'map') startMapDolly()
    if (target.id === 'radio') startRadioDolly()
    if (target.id === 'trays') startTraysDolly()
    if (target.id === 'back-door') startClosetDolly()
  }
  const onPointerMove = (event: PointerEvent) => {
    // Desktop interaction is hover-only: moving the pointer over a menu region
    // immediately updates both the cover highlight and the hanging board.
    if (event.pointerType === 'touch' || viewMode !== 'home') return
    updatePointer(event)
    hoverRaycaster.setFromCamera(pointer, camera)
    const hoverHit = hoverRaycaster.intersectObjects(hoverTargets.map((target) => target.mesh), false)[0]?.object
    const hoveredTarget = hoverTargets.find((target) => target.mesh === hoverHit)

    hoverTargets.forEach((target) => {
      setHoverHighlight(target, target.mesh === hoverHit)
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
  const resetView = () => {
    cameraTransition = null
    viewMode = 'home'
    setProjectorActive(false)
    closetTargetProgress = 0
    if (reducedMotion.matches) {
      closetProgress = 0
      closet.setProgress(0)
    }
    setZoomOutVisible(false)
    camera.position.copy(HOME_POSITION)
    cameraTarget.copy(HOME_TARGET)
    camera.up.copy(HOME_UP)
    settleControls(true)
    clearHoverHighlights()
    selectDefault()
  }
  const startZoomOut = () => {
    if (viewMode !== 'map' && viewMode !== 'radio' && viewMode !== 'trays' && viewMode !== 'closet') return
    setZoomOutVisible(false)
    closetTargetProgress = 0

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
      path: new THREE.CubicBezierCurve3(start, firstGuide, secondGuide, HOME_POSITION.clone()),
      startTarget: controls.target.clone(),
      endTarget: HOME_TARGET.clone(),
      startUp: camera.up.clone(),
      endUp: HOME_UP.clone(),
      destination: 'home',
    }
    viewMode = 'transition'
  }
  const dolly = (direction: 1 | -1) => {
    const offset = camera.position.clone().sub(controls.target)
    const next = offset.length() * (direction === 1 ? 1.15 : 1 / 1.15)
    const clamped = THREE.MathUtils.clamp(next, controls.minDistance, controls.maxDistance)
    offset.setLength(clamped)
    camera.position.copy(controls.target).add(offset)
    controls.update()
  }
  const panTarget = (dx: number, dz: number) => {
    controls.target.x = THREE.MathUtils.clamp(controls.target.x + dx, TARGET_BOUNDS.minX, TARGET_BOUNDS.maxX)
    controls.target.y = THREE.MathUtils.clamp(controls.target.y, TARGET_BOUNDS.minY, TARGET_BOUNDS.maxY)
    controls.target.z = THREE.MathUtils.clamp(controls.target.z + dz, TARGET_BOUNDS.minZ, TARGET_BOUNDS.maxZ)
    controls.update()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', '+', '=', '-', '_', '0', 'r', 'R', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(event.key)) event.preventDefault(); else return
    const index = SECTION_ORDER.indexOf(activeId)
    if (event.key === 'ArrowLeft') setActive(SECTION_ORDER[(index - 1 + SECTION_ORDER.length) % SECTION_ORDER.length])
    if (event.key === 'ArrowRight') setActive(SECTION_ORDER[(index + 1) % SECTION_ORDER.length])
  }
  const clampTarget = () => {
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, TARGET_BOUNDS.minX, TARGET_BOUNDS.maxX)
    controls.target.y = THREE.MathUtils.clamp(controls.target.y, TARGET_BOUNDS.minY, TARGET_BOUNDS.maxY)
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, TARGET_BOUNDS.minZ, TARGET_BOUNDS.maxZ)
  }
  const render = () => {
    if (disposed) return
    const now = performance.now()
    const dt = Math.min((now - lastTime) / 1000, 0.1)
    lastTime = now
    if (!reducedMotion.matches) fanSpinner.rotation.z -= dt * FAN_SPEED
    updateClock()

    if (reducedMotion.matches) {
      closetProgress = closetTargetProgress
    } else {
      closetProgress = THREE.MathUtils.damp(closetProgress, closetTargetProgress, closetTargetProgress > closetProgress ? 3.2 : 4.2, dt)
      if (Math.abs(closetProgress - closetTargetProgress) < 0.001) closetProgress = closetTargetProgress
    }
    closet.setProgress(closetProgress)

    const projectorTarget = projectorActive ? 1 : 0
    if (reducedMotion.matches) {
      projectorScreenProgress = projectorTarget
    } else {
      const response = projectorActive ? 4.3 : 5.6
      projectorScreenProgress = THREE.MathUtils.damp(projectorScreenProgress, projectorTarget, response, dt)
      if (Math.abs(projectorScreenProgress - projectorTarget) < 0.001) projectorScreenProgress = projectorTarget
    }
    projectionScreen.setProgress(projectorScreenProgress)

    projector.projectionLight.intensity = THREE.MathUtils.damp(
      projector.projectionLight.intensity,
      projectorActive ? 7.5 : 0,
      projectorActive ? 8 : 12,
      dt,
    )
    projector.lensFill.intensity = THREE.MathUtils.damp(
      projector.lensFill.intensity,
      projectorActive ? 1.6 : 0,
      projectorActive ? 9 : 13,
      dt,
    )
    projector.lensMaterial.emissiveIntensity = THREE.MathUtils.damp(
      projector.lensMaterial.emissiveIntensity,
      projectorActive ? 3.6 : 0.08,
      projectorActive ? 9 : 12,
      dt,
    )
    if (projectorActive && !reducedMotion.matches) {
      projector.reels[0].rotation.z -= dt * 4.5
      projector.reels[1].rotation.z += dt * 3.9
    }

    if (cameraTransition) {
      const elapsed = now - cameraTransition.startTime
      const progress = Math.min(elapsed / cameraTransition.duration, 1)
      const eased = easeMotionControl(progress)
    if (cameraTransition.destination === 'trays' && cameraTransition.traysSequence) {
      const sequence = cameraTransition.traysSequence
      const forwardEnd = 0.40
      const turnEnd = 0.70

      if (progress < forwardEnd) {
        // Phase 1: pure dolly forward. Translate the look target by the same
        // amount as the camera so there is no turn or tilt yet.
        const phase = easeMotionControl(progress / forwardEnd)
        camera.position.lerpVectors(cameraTransition.path.getPoint(0), sequence.forwardPosition, phase)
        cameraTarget.lerpVectors(cameraTransition.startTarget, sequence.forwardTarget, phase)
        camera.up.lerpVectors(cameraTransition.startUp, HOME_UP, phase).normalize()
      } else if (progress < turnEnd) {
        // Phase 2: sweep right until the camera is clearly facing the wall
        // with the brown door. Keep world-up vertical during the turn.
        const phase = easeMotionControl((progress - forwardEnd) / (turnEnd - forwardEnd))
        camera.position.lerpVectors(sequence.forwardPosition, sequence.turnPosition, phase)
        cameraTarget.lerpVectors(sequence.forwardTarget, sequence.turnTarget, phase)
        camera.up.copy(HOME_UP)
      } else {
        // Phase 3: once the right turn is complete, move over the trays and
        // tilt down into the 90-degree top-down final composition.
        const phase = easeMotionControl((progress - turnEnd) / (1 - turnEnd))
        camera.position.lerpVectors(sequence.turnPosition, cameraTransition.path.getPoint(1), phase)
        cameraTarget.lerpVectors(sequence.turnTarget, cameraTransition.endTarget, phase)
        camera.up.lerpVectors(HOME_UP, cameraTransition.endUp, phase).normalize()
      }
    } else {
      camera.position.copy(cameraTransition.path.getPoint(eased))
      cameraTarget.lerpVectors(cameraTransition.startTarget, cameraTransition.endTarget, eased)
      camera.up.lerpVectors(cameraTransition.startUp, cameraTransition.endUp, eased).normalize()
    }
    controls.target.copy(cameraTarget)
      updateCameraReadout()

      if (progress >= 1) {
        const destination = cameraTransition.destination
        camera.position.copy(cameraTransition.path.getPoint(1))
        cameraTarget.copy(cameraTransition.endTarget)
        camera.up.copy(cameraTransition.endUp)
        controls.target.copy(cameraTransition.endTarget)
        cameraTransition = null
        viewMode = destination
        settleControls(destination === 'home')
        setZoomOutVisible(destination === 'map' || destination === 'radio' || destination === 'trays' || destination === 'closet')
        if (destination === 'home') selectDefault()
      }
    }

    if (cameraTransition || viewMode !== 'home') {
      camera.lookAt(cameraTarget)
    } else {
      controls.update()
    }
    renderer.render(scene, camera); frame = requestAnimationFrame(render)
  }
  const onContextLost = (event: Event) => { event.preventDefault(); root.dataset.webgl = 'failed' }
  const resetButton = root.querySelector<HTMLElement>('[data-operation-room-reset]')
  const onResetClick = () => resetView()
  const onZoomOutClick = () => startZoomOut()
  const copyCameraButton = root.querySelector<HTMLButtonElement>('[data-operation-room-copy-camera]')
  const cameraReadout = document.createElement('code')
  cameraReadout.className = 'operation-room__camera-readout'
  root.appendChild(cameraReadout)
  const cameraText = () => {
    const p = camera.position; const t = controls.target
    return `position [${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}] target [${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)}]`
  }
  const updateCameraReadout = () => { cameraReadout.textContent = cameraText() }
  const onCopyCameraClick = async () => {
    const value = cameraText()
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        throw new Error('Clipboard API unavailable')
      }
      if (copyCameraButton) {
        const label = copyCameraButton.textContent
        copyCameraButton.textContent = 'Copied'
        window.setTimeout(() => { copyCameraButton.textContent = label }, 1400)
      }
    } catch {
      // Clipboard API is unavailable on non-secure/local contexts. Fall back
      // to a temporary textarea so the user can still copy the exact values.
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const selected = document.execCommand('copy')
      textarea.remove()
      if (copyCameraButton) {
        const label = copyCameraButton.textContent
        copyCameraButton.textContent = selected ? 'Copied' : 'Select readout'
        if (!selected) {
          cameraReadout.style.pointerEvents = 'auto'
          cameraReadout.style.userSelect = 'text'
          cameraReadout.title = 'Select these values and copy them manually'
        }
        window.setTimeout(() => { copyCameraButton.textContent = label }, 1800)
      }
    }
  }

  resize(); selectDefault(); updateCameraReadout(); loading?.setAttribute('data-ready', 'true')
  controls.addEventListener('change', updateCameraReadout)
  canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointerup', onPointerUp); canvas.addEventListener('keydown', onKeyDown); canvas.addEventListener('webglcontextlost', onContextLost); resetButton?.addEventListener('click', onResetClick); zoomOutButton?.addEventListener('click', onZoomOutClick); copyCameraButton?.addEventListener('click', onCopyCameraClick)
  if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', applyMotionPreference)
  window.addEventListener('resize', resize)
  frame = requestAnimationFrame(render)

  return () => {
    disposed = true; cancelAnimationFrame(frame)
    controls.removeEventListener('change', updateCameraReadout)
    cameraReadout.remove()
    canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('keydown', onKeyDown); canvas.removeEventListener('webglcontextlost', onContextLost); resetButton?.removeEventListener('click', onResetClick); zoomOutButton?.removeEventListener('click', onZoomOutClick); copyCameraButton?.removeEventListener('click', onCopyCameraClick)
    if (typeof reducedMotion.removeEventListener === 'function') reducedMotion.removeEventListener('change', applyMotionPreference)
    window.removeEventListener('resize', resize); controls.dispose(); renderer.dispose()
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose(); const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
      objectMaterials.forEach((material) => { if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose(); material.dispose() })
    })
  }
}
