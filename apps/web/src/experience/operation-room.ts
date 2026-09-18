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
  const group = new THREE.Group(); group.position.set(x, 1.81, z); group.rotation.y = rotationY
  const phoneMaterial = makeMaterial(color, 0.82)
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
  const shadeGreen = new THREE.MeshStandardMaterial({ color: 0x1f4e3d, roughness: 0.72, metalness: 0.02, flatShading: true })
  const warmUnderside = new THREE.MeshStandardMaterial({
    color: 0xd8c992,
    roughness: 0.86,
    metalness: 0,
    emissive: 0xb08a48,
    emissiveIntensity: 0.22,
    side: THREE.DoubleSide,
  })

  // Stepped brass base, matching the heavy circular foot of the reference lamps.
  group.add(cylinder(0.285 * scale, 0.055 * scale, [0, 1.00, 0], brassDark, 14))
  group.add(cylinder(0.225 * scale, 0.070 * scale, [0, 1.055, 0], brass, 14))
  group.add(cylinder(0.145 * scale, 0.070 * scale, [0, 1.115, 0], brassDark, 12))
  group.add(cylinder(0.065 * scale, 0.055 * scale, [0, 1.175, 0], brass, 10))

  // Slender upright and curved neck. The tiny collar below the bend helps the
  // lamp read as a period banker's lamp rather than a generic pole with a shade.
  group.add(cylinder(0.026 * scale, 0.48 * scale, [0, 1.42, 0], brass, 10))
  group.add(cylinder(0.052 * scale, 0.055 * scale, [0, 1.64, 0], brassDark, 10))
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.64, 0),
    new THREE.Vector3(0, 1.70, 0.015),
    new THREE.Vector3(0, 1.73, 0.075),
    new THREE.Vector3(0, 1.74, 0.13),
  ])
  const neck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 8, 0.024 * scale, 7, false), brass)
  neck.castShadow = true; neck.receiveShadow = true; group.add(neck)

  // Long faceted green glass shade. Its tapered prism silhouette is the main
  // visual cue in the supplied shot and replaces the previous cone shade.
  const halfBottomW = 0.43 * scale
  const halfBottomD = 0.19 * scale
  const halfTopW = 0.34 * scale
  const halfTopD = 0.125 * scale
  const shadeBottomY = 1.70
  const shadeTopY = 1.86
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

  // Brass trim along the lower edge and small end caps make the green shade
  // look like glass held in a metal frame, as in classic 1930s/40s desk lamps.
  group.add(box([0.88 * scale, 0.025 * scale, 0.025 * scale], [0, shadeBottomY - 0.005, shadeZ + halfBottomD], brass))
  group.add(box([0.88 * scale, 0.025 * scale, 0.025 * scale], [0, shadeBottomY - 0.005, shadeZ - halfBottomD], brassDark))
  group.add(box([0.025 * scale, 0.025 * scale, 0.38 * scale], [-halfBottomW, shadeBottomY - 0.005, shadeZ], brassDark))
  group.add(box([0.025 * scale, 0.025 * scale, 0.38 * scale], [halfBottomW, shadeBottomY - 0.005, shadeZ], brassDark))

  // Small pull-chain detail hanging from one end of the shade.
  const chainX = 0.34 * scale
  group.add(cylinder(0.009 * scale, 0.18 * scale, [chainX, 1.60, shadeZ + 0.10], brassDark, 6))
  group.add(cylinder(0.026 * scale, 0.035 * scale, [chainX, 1.50, shadeZ + 0.10], brass, 8))

  scene.add(group)
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
  const group = new THREE.Group(); group.position.set(1.4, 1.88, 3.9); group.rotation.y = -1.57

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
  const lensGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.025, 12),
    new THREE.MeshStandardMaterial({ color: 0x17232b, roughness: 0.18, metalness: 0.18, emissive: 0xe6b975, emissiveIntensity: 0.32 }),
  )
  lensGlass.position.set(-1.087, 0.49, 0.01); lensGlass.rotation.z = Math.PI / 2; lensGlass.castShadow = true; group.add(lensGlass)

  // Reel support mast and film gate. The top arm is intentionally asymmetric,
  // like period portable projectors, instead of a generic rectangular tower.
  group.add(box([0.11, 0.55, 0.13], [0.18, 0.94, 0.05], enamelDark, [0, 0, -0.06]))
  group.add(box([0.50, 0.09, 0.13], [0.03, 1.18, 0.05], enamelDark, [0, 0, 0.06]))
  group.add(box([0.16, 0.44, 0.10], [0.29, 0.67, 0.31], enamelDark))
  group.add(box([0.08, 0.36, 0.018], [0.39, 0.72, 0.375], materials.black))

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
  group.add(cylinder(0.27, 0.09, [0, 0, -0.56], fanDark, 16, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.075, 0.42, [0, 0, -0.31], fanDark, 10, [Math.PI / 2, 0, 0]))
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
  createDeskLamp(scene, -0.75, -0.85, 0.9, -0.04); createDeskLamp(scene, 0.3, 0.6, 0.92, 0.03); createDeskLamp(scene, 0.15, -2.45, 0.82, 0.06)
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
