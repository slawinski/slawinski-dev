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
  wallHeight: 7,
  map: { x: -2.55, y: 3.42, z: -5.79, width: 8.4, height: 4.45 },
  mainTable: { x: 1.4, y: 1.16, z: 1.15, width: 4.8, depth: 9.2 },
  radioDesk: { x: -5.9, y: 1.18, z: -2.25, width: 3.7, depth: 1.25 },
  board: { x: -5.25, y: 5.55, z: -1.4, width: 4.1, height: 0.78 },
}

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
  scene.add(box([WORLD.roomWidth, WORLD.wallHeight, 0.18], [0, WORLD.wallHeight / 2, WORLD.backWallZ], materials.wall))
  scene.add(box([0.18, WORLD.wallHeight, WORLD.roomDepth], [8.8, WORLD.wallHeight / 2, 0], materials.wallShadow))
  scene.add(box([WORLD.roomWidth, 0.42, 0.18], [0, 1.05, WORLD.backWallZ + 0.12], materials.green))

  const beamMaterial = makeMaterial(0xb5aa8e, 0.95)
  const beamSpecs: Array<[[number, number, number], [number, number, number], [number, number, number]]> = [
    [[18, 0.58, 0.62], [0, 6.35, -1.9], [0, 0, 0]],
    [[18, 0.58, 0.62], [0, 6.35, 1.0], [0, 0, 0]],
    [[0.62, 6.3, 0.62], [5.3, 3.15, -1.9], [0, 0, 0]],
    [[0.62, 6.3, 0.62], [5.3, 3.15, 1.0], [0, 0, 0]],
    [[0.62, 6.3, 0.62], [-8.83, 3.15, -1.9], [0, 0, 0]],
    [[0.62, 6.3, 0.62], [-8.83, 3.15, 1.0], [0, 0, 0]],
  ]
  for (const [size, position, rotation] of beamSpecs) scene.add(box(size, position, beamMaterial, rotation))
  // Surface-mounted planks: the front/back z offsets are the post half-depth
  // plus half the plank depth, so the planks sit against the timber faces
  // instead of passing through them. They continue above the beams into the
  // ceiling structure.
  scene.add(strut([5.3, 4.7, -1.5], [1.06, 7.15, -1.5], beamMaterial))
  scene.add(strut([5.3, 4.7, -2.3], [9.54, 7.15, -2.3], beamMaterial))
  scene.add(strut([5.3, 4.7, 1.4], [1.06, 7.15, 1.4], beamMaterial))
  scene.add(strut([5.3, 4.7, 0.6], [9.54, 7.15, 0.6], beamMaterial))
  scene.add(strut([-8.83, 4.7, -1.5], [-4.59, 7.15, -1.5], beamMaterial))
  scene.add(strut([-8.83, 4.7, 1.4], [-4.59, 7.15, 1.4], beamMaterial))

  scene.add(box([1.7, 4.9, 0.28], [2.75, 2.45, WORLD.backWallZ + 0.02], materials.black))
  scene.add(box([0.26, 4.2, 1.65], [8.82, 2.1, -2.95], materials.wood))
  for (let y = 0.55; y <= 3.5; y += 0.72) scene.add(box([0.03, 0.045, 1.48], [8.66, y, -2.95], materials.woodDark))

  // The clock is mounted on the visible face of the front strut. The strut
  // face is at z=-1.41; keep the clock's rear rim just in front of it so the
  // dial never intersects the plank after the support structure is thickened.
  scene.add(cylinder(0.38, 0.10, [4.6, 5.28, -1.34], materials.black, 16, [Math.PI / 2, 0, 0]))
  scene.add(cylinder(0.31, 0.025, [4.6, 5.28, -1.28], materials.paperLight, 16, [Math.PI / 2, 0, 0]))
  const clockCenter: [number, number, number] = [4.6, 5.28, -1.26]
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
  scene.add(box([1.2, 0.46, 9.2], [1.4, y + 0.31, z], materials.wood))
}

const createChair = (scene: THREE.Scene, x: number, z: number, rotationY: number) => {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = rotationY
  group.add(box([1.25, 0.16, 1.25], [0, 0.72, 0], materials.wood))
  for (const sx of [-0.48, 0.48]) for (const sz of [-0.48, 0.48]) group.add(box([0.13, 0.72, 0.13], [sx, 0.36, sz], materials.woodDark))
  group.add(box([1.25, 0.12, 0.14], [0, 1.42, 0.55], materials.woodDark))
  for (const sx of [-0.5, 0, 0.5]) group.add(box([0.1, 0.74, 0.1], [sx, 1.08, 0.53], materials.woodDark))
  scene.add(group)
}

const createPhone = (scene: THREE.Scene, x: number, z: number, color: number, rotationY = 0) => {
  const group = new THREE.Group(); group.position.set(x, 1.81, z); group.rotation.y = rotationY
  const phoneMaterial = makeMaterial(color, 0.82)
  group.add(box([0.78, 0.22, 0.62], [0, 0, 0], phoneMaterial))
  group.add(cylinder(0.19, 0.035, [0.12, 0.14, 0.08], materials.paperLight, 12, [Math.PI / 2, 0, 0]))
  group.add(box([0.72, 0.12, 0.16], [0, 0.27, -0.16], phoneMaterial, [0.08, 0, 0]))
  group.add(cylinder(0.12, 0.18, [-0.29, 0.27, -0.16], phoneMaterial, 8, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.12, 0.18, [0.29, 0.27, -0.16], phoneMaterial, 8, [0, 0, Math.PI / 2]))
  scene.add(group)
}

const createDeskLamp = (scene: THREE.Scene, x: number, z: number, scale = 1) => {
  const group = new THREE.Group(); group.position.set(x, 0.3, z)
  group.add(cylinder(0.25 * scale, 0.07 * scale, [0, 1.02, 0], materials.brass, 12))
  group.add(cylinder(0.035 * scale, 0.7 * scale, [0, 1.4, 0], materials.brass, 8))
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.36 * scale, 0.3 * scale, 8, 1, true), materials.green)
  shade.position.set(0, 1.77, 0); shade.rotation.x = Math.PI; shade.castShadow = true; group.add(shade); scene.add(group)
}

const createRadioDesk = (scene: THREE.Scene) => {
  const { x, y, z, width, depth } = WORLD.radioDesk
  scene.add(box([width, 0.14, depth], [x, y, z], materials.wood))
  for (const lx of [x - width / 2 + 0.25, x + width / 2 - 0.25]) scene.add(box([0.24, y, 0.24], [lx, y / 2, z - depth * 0.25], materials.woodDark))
  const radios: Array<[number, number, number]> = [[-6.75, 1.72, -2.45], [-5.85, 1.57, -2.35], [-5.05, 1.64, -2.35]]
  radios.forEach(([rx, ry, rz], index) => {
    scene.add(box([0.72, 0.58 + index * 0.05, 0.48], [rx, ry, rz], materials.metal))
    scene.add(cylinder(0.11, 0.04, [rx - 0.18, ry, rz + 0.26], materials.black, 10, [Math.PI / 2, 0, 0]))
    scene.add(cylinder(0.07, 0.04, [rx + 0.18, ry, rz + 0.26], materials.black, 10, [Math.PI / 2, 0, 0]))
  })
}

const createProjector = (scene: THREE.Scene) => {
  const group = new THREE.Group(); group.position.set(1.4, 1.88, 3.9); group.rotation.y = -1.57
  group.add(box([0.72, 0.85, 0.8], [0, 0.33, 0], materials.metal))
  for (const fx of [-0.26, 0.26]) for (const fz of [-0.3, 0.3]) group.add(box([0.1, 0.08, 0.1], [fx, -0.135, fz], materials.metalDark))
  for (const [y, radius] of [[0.98, 0.45], [0.3, 0.38]] as const) {
    group.add(cylinder(radius, 0.1, [0.12, y, -0.04], materials.metal, 10, [Math.PI / 2, 0, 0]))
    group.add(cylinder(radius * 0.18, 0.14, [0.12, y, -0.09], materials.metalDark, 8, [Math.PI / 2, 0, 0]))
  }
  group.add(cylinder(0.12, 0.85, [-0.45, 0.42, 0.02], materials.metalDark, 8, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.15, 0.08, [-0.88, 0.42, 0.02], materials.metalDark, 8, [0, 0, Math.PI / 2]))
  const lensGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12),
    new THREE.MeshStandardMaterial({ color: 0x1a2530, roughness: 0.2, metalness: 0.2, emissive: 0xffe2a8, emissiveIntensity: 0.5 }),
  )
  lensGlass.position.set(-0.93, 0.42, 0.02); lensGlass.rotation.z = Math.PI / 2; group.add(lensGlass)
  for (let i = 0; i < 4; i += 1) group.add(box([0.3, 0.03, 0.02], [0.1, 0.08 + i * 0.09, -0.41], materials.black))
  group.add(cylinder(0.05, 0.07, [0.22, 0.79, 0.28], materials.brass, 8))
  group.add(cylinder(0.045, 0.06, [-0.2, 0.785, 0.28], materials.metalDark, 8))
  for (const hx of [-0.2, 0.2]) group.add(box([0.05, 0.2, 0.05], [hx, 0.855, -0.28], materials.metalDark))
  group.add(box([0.45, 0.05, 0.05], [0, 0.975, -0.28], materials.metalDark))
  scene.add(group)
}

const createPendant = (scene: THREE.Scene, position: [number, number, number], color: number, intensity: number, distance: number) => {
  const [x, y, z] = position
  scene.add(cylinder(0.022, 2.0, [x, y + 1.0, z], materials.black, 6))
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.34, 8, 1, true), makeMaterial(color, 0.9))
  shade.position.set(x, y, z); shade.rotation.x = Math.PI; scene.add(shade)
  const light = new THREE.PointLight(0xffd38a, intensity, distance, 1.7)
  light.position.set(x, y - 0.18, z); light.castShadow = true; light.shadow.mapSize.set(512, 512); scene.add(light)
}

const createWallFan = (scene: THREE.Scene) => {
  const group = new THREE.Group(); group.position.set(4.7, 4.3, 1.0); group.rotation.y = -Math.PI / 2
  group.add(cylinder(0.06, 0.55, [0, 0, -0.3], materials.metalDark, 8, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.15, 0.32, [0, 0, -0.18], materials.metalDark, 10, [Math.PI / 2, 0, 0]))
  group.add(new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.008, 6, 24), materials.metalDark))
  const cageWireGeo = new THREE.TorusGeometry(0.515, 0.008, 4, 16, Math.PI)
  const addCageSide = (rimZ: number, flip: boolean) => {
    for (let i = 0; i < 8; i += 1) {
      const pivot = new THREE.Group(); pivot.rotation.z = i * Math.PI / 8
      const wire = new THREE.Mesh(cageWireGeo, materials.metalDark)
      wire.scale.set(1, 0.5, 1)
      wire.rotation.x = flip ? -Math.PI / 2 : Math.PI / 2
      wire.position.z = rimZ
      pivot.add(wire); group.add(pivot)
    }
  }
  addCageSide(0, false)
  addCageSide(0, true)
  group.add(cylinder(0.07, 0.025, [0, 0, 0.25], materials.metalDark, 10, [Math.PI / 2, 0, 0]))
  const spinner = new THREE.Group(); group.add(spinner)
  for (let i = 0; i < 5; i += 1) {
    const pivot = new THREE.Group(); pivot.rotation.z = i * Math.PI * 2 / 5
    const blade = box([0.15, 0.38, 0.02], [0, 0.28, 0.02], materials.metal)
    blade.rotation.y = 0.5
    pivot.add(blade); spinner.add(pivot)
  }
  group.add(cylinder(0.13, 0.1, [0, 0, 0.02], materials.metalDark, 12, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.06, 0.06, [0, 0, 0.08], materials.metal, 8, [Math.PI / 2, 0, 0]))
  scene.add(group)
  return spinner
}

const createPaperCluster = (scene: THREE.Scene) => {
  const papers = new THREE.Group(); papers.position.set(-0.25, 1.3, 2.35)
  papers.add(box([1.75, 0.025, 1.15], [0, 0, 0], materials.paperLight, [0, 0.08, 0]))
  papers.add(box([1.35, 0.028, 0.95], [0.2, 0.035, 0.13], materials.paper, [0, -0.05, 0])); scene.add(papers)
}

const createFolders = (scene: THREE.Scene) => {
  const group = new THREE.Group(); group.position.set(-0.45, 1.42, -0.15)
  for (let i = 0; i < 4; i += 1) group.add(box([1.35, 0.12, 0.95], [0.06 * i, i * 0.13, -0.03 * i], i % 2 ? materials.green : materials.woodDark))
  scene.add(group)
}

const createHotspot = (scene: THREE.Scene, id: SectionId, size: [number, number, number], position: [number, number, number]) => {
  const hitbox = box(size, position, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
  hitbox.userData.hotspot = id; hitbox.castShadow = false; hitbox.receiveShadow = false
  const highlight = box([size[0] * 1.02, size[1] * 1.02, size[2] * 1.02], position, new THREE.MeshBasicMaterial({ color: 0xa5d778, transparent: true, opacity: 0.075, depthWrite: false, blending: THREE.AdditiveBlending }))
  highlight.visible = false; highlight.castShadow = false; highlight.receiveShadow = false
  scene.add(hitbox, highlight)
  return { id, label: SECTIONS[id].label, href: SECTIONS[id].href, hitbox, highlight, cameraOffset: new THREE.Vector3() } satisfies Hotspot
}

const createScene = (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  const updateClock = createRoomShell(scene); createTable(scene); createRadioDesk(scene); createMapBoard(scene); createProjector(scene); createPaperCluster(scene); createFolders(scene); const fanSpinner = createWallFan(scene)
  createChair(scene, -2.65, 2.15, -1.07); createChair(scene, 4.5, -0.2, 1.91); createChair(scene, 4.5, 2.2, 1.31)
  createPhone(scene, 1.4, -2.25, 0x315b3c, 3.14); createPhone(scene, 1.4, -1.4, 0xd8ceb0, -1.57); createPhone(scene, 1.4, -0.55, PALETTE.red, 1.57); createPhone(scene, 1.4, 0.3, 0xd9d1b8, -1.57); createPhone(scene, 1.4, 1.15, 0x315b3c, 1.57)
  createDeskLamp(scene, -0.75, -0.85, 0.9); createDeskLamp(scene, 0.3, 0.6, 0.92)
  createPendant(scene, [-1.35, 5.0, -4.75], 0x5e8a32, 1.4, 5)
  const boardDraw = createHangingBoard(scene)
  const hotspots: Hotspot[] = [
    createHotspot(scene, 'work', [8.55, 4.5, 0.28], [WORLD.map.x, WORLD.map.y, WORLD.map.z + 0.3]),
    createHotspot(scene, 'writing', [2.0, 0.62, 2.2], [-0.2, 1.43, 2.2]),
    createHotspot(scene, 'speaking', [3.8, 1.9, 1.5], [WORLD.radioDesk.x, 1.35, WORLD.radioDesk.z]),
    createHotspot(scene, 'contact', [1.1, 1.6, 4.1], [1.4, 1.9, -0.55]),
    createHotspot(scene, 'about', [2.35, 2.5, 1.5], [1.4, 2.4, 4.05]),
  ]
  camera.position.set(-4.08, 4.47, 10.34); camera.lookAt(-2.15, 2.7, -4.75)
  return { hotspots, boardDraw, fanSpinner, updateClock }
}

export const mountOperationRoom = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-operation-room-canvas]')
  const loading = root.querySelector<HTMLElement>('[data-operation-room-loading]')
  const live = root.querySelector<HTMLElement>('[data-operation-room-live]')
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

  const { hotspots, boardDraw, fanSpinner, updateClock } = createScene(scene, camera)
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(2, 2)
  const HOME_POSITION = new THREE.Vector3(-4.08, 4.47, 10.34)
  const HOME_TARGET = new THREE.Vector3(-2.15, 2.7, -4.75)
  const TARGET_BOUNDS = { minX: -6, maxX: 4, minY: 0.8, maxY: 5.2, minZ: -5.8, maxZ: 4 }
  const DRAG_THRESHOLD_PX = 6
  const controls = new OrbitControls(camera, canvas)
  controls.target.copy(HOME_TARGET)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 5
  controls.maxDistance = 22
  controls.minPolarAngle = 0.5
  controls.maxPolarAngle = 1.53
  controls.minAzimuthAngle = -0.98
  controls.maxAzimuthAngle = 0.72
  controls.update()
  let activeId: SectionId = 'work'; let lastTouchSelection: SectionId | null = null; let frame = 0; let disposed = false
  let lastTime = performance.now()
  const FAN_SPEED = 4
  let downX = 0; let downY = 0; let dragged = false
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const applyMotionPreference = () => { controls.enableDamping = !reducedMotion.matches }
  applyMotionPreference()

  const setActive = (id: SectionId) => {
    if (id === activeId) return
    activeId = id; boardDraw(SECTIONS[id].label); if (live) live.textContent = `${SECTIONS[id].label} selected`
    hotspots.forEach((hotspot) => { hotspot.highlight.visible = hotspot.id === id })
  }
  const selectDefault = () => { activeId = 'work'; boardDraw('WORK'); hotspots.forEach((hotspot) => { hotspot.highlight.visible = hotspot.id === 'work' }) }
  const resize = () => { const width = root.clientWidth; const height = root.clientHeight; renderer.setSize(width, height, false); camera.aspect = width / height; camera.fov = 54; camera.updateProjectionMatrix() }
  const updatePointer = (event: PointerEvent) => { const bounds = canvas.getBoundingClientRect(); pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1; pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1 }
  const pick = () => {
    raycaster.setFromCamera(pointer, camera)
    const intersections = raycaster.intersectObjects(hotspots.map((hotspot) => hotspot.hitbox), false)
    const hit = intersections[0]?.object.userData.hotspot as SectionId | undefined
    if (hit) { setActive(hit); canvas.style.cursor = 'pointer'; return hit }
    canvas.style.cursor = 'default'; return null
  }
  const onPointerMove = (event: PointerEvent) => {
    if (dragged || (event.buttons & 1) === 1 || (event.buttons & 2) === 2) return
    if (event.pointerType === 'touch') return
    updatePointer(event); pick()
  }
  const navigate = (id: SectionId) => window.location.assign(SECTIONS[id].href)
  const resetView = () => {
    camera.position.copy(HOME_POSITION)
    controls.target.copy(HOME_TARGET)
    controls.update()
  }
  const onPointerDown = (event: PointerEvent) => {
    downX = event.clientX; downY = event.clientY; dragged = false
  }
  const onPointerUp = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > DRAG_THRESHOLD_PX || dragged) return
    updatePointer(event); const hit = pick(); if (!hit) return
    if (event.pointerType === 'touch' && lastTouchSelection !== hit) { lastTouchSelection = hit; setActive(hit); return }
    navigate(hit)
  }
  const onDragMove = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > DRAG_THRESHOLD_PX) dragged = true
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
    if (['ArrowLeft', 'ArrowRight', 'Enter', '+', '=', '-', '_', '0', 'r', 'R', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(event.key)) event.preventDefault(); else return
    const index = SECTION_ORDER.indexOf(activeId)
    if (event.key === 'ArrowLeft') setActive(SECTION_ORDER[(index - 1 + SECTION_ORDER.length) % SECTION_ORDER.length])
    if (event.key === 'ArrowRight') setActive(SECTION_ORDER[(index + 1) % SECTION_ORDER.length])
    if (event.key === 'Enter') navigate(activeId)
    if (event.key === '+' || event.key === '=') dolly(-1)
    if (event.key === '-' || event.key === '_') dolly(1)
    if (event.key === '0' || event.key === 'r' || event.key === 'R') resetView()
    if (event.key === 'w' || event.key === 'W') panTarget(0, -0.6)
    if (event.key === 's' || event.key === 'S') panTarget(0, 0.6)
    if (event.key === 'a' || event.key === 'A') panTarget(-0.6, 0)
    if (event.key === 'd' || event.key === 'D') panTarget(0.6, 0)
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
    clampTarget()
    controls.update()
    renderer.render(scene, camera); frame = requestAnimationFrame(render)
  }
  const onContextLost = (event: Event) => { event.preventDefault(); root.dataset.webgl = 'failed' }
  const resetButton = root.querySelector<HTMLElement>('[data-operation-room-reset]')
  const onResetClick = () => resetView()

  resize(); selectDefault(); loading?.setAttribute('data-ready', 'true')
  canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointermove', onDragMove); canvas.addEventListener('pointerdown', onPointerDown); canvas.addEventListener('pointerup', onPointerUp); canvas.addEventListener('keydown', onKeyDown); canvas.addEventListener('webglcontextlost', onContextLost); resetButton?.addEventListener('click', onResetClick)
  if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', applyMotionPreference)
  window.addEventListener('resize', resize)
  frame = requestAnimationFrame(render)

  return () => {
    disposed = true; cancelAnimationFrame(frame)
    canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointermove', onDragMove); canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('keydown', onKeyDown); canvas.removeEventListener('webglcontextlost', onContextLost); resetButton?.removeEventListener('click', onResetClick)
    if (typeof reducedMotion.removeEventListener === 'function') reducedMotion.removeEventListener('change', applyMotionPreference)
    window.removeEventListener('resize', resize); controls.dispose(); renderer.dispose()
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose(); const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
      objectMaterials.forEach((material) => { if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose(); material.dispose() })
    })
  }
}
