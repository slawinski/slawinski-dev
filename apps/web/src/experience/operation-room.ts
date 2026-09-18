import * as THREE from 'three'

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
  mainTable: { x: 2.1, y: 0.86, z: 1.15, width: 6.2, depth: 9.2 },
  radioDesk: { x: -5.9, y: 0.76, z: -2.25, width: 3.7, depth: 1.25 },
  board: { x: -5.25, y: 5.55, z: -2.1, width: 4.1, height: 0.78 },
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
  board.rotation.y = -0.12; scene.add(board)
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
    [[8.8, 0.34, 0.38], [1.4, 6.35, -1.9], [0, 0, -0.03]],
    [[8.5, 0.32, 0.36], [3.8, 5.95, -0.2], [0, 0, -0.38]],
    [[8.3, 0.30, 0.34], [5.25, 5.5, 0.9], [0, 0, -0.69]],
    [[0.34, 5.6, 0.34], [4.15, 3.5, -2.2], [0, 0, 0]],
  ]
  for (const [size, position, rotation] of beamSpecs) scene.add(box(size, position, beamMaterial, rotation))

  scene.add(box([1.7, 4.9, 0.28], [2.75, 2.45, WORLD.backWallZ + 0.02], materials.black))
  scene.add(box([1.65, 4.2, 0.26], [5.65, 2.1, WORLD.backWallZ + 0.02], materials.wood))
  for (let y = 0.55; y <= 3.5; y += 0.72) scene.add(box([1.48, 0.045, 0.03], [5.65, y, WORLD.backWallZ + 0.18], materials.woodDark))

  scene.add(cylinder(0.38, 0.10, [3.8, 5.0, WORLD.backWallZ + 0.35], materials.black, 16, [Math.PI / 2, 0, 0]))
  scene.add(cylinder(0.31, 0.025, [3.8, 5.0, WORLD.backWallZ + 0.41], materials.paperLight, 16, [Math.PI / 2, 0, 0]))
  scene.add(box([0.025, 0.22, 0.02], [3.8, 5.07, WORLD.backWallZ + 0.45], materials.black, [0, 0, -0.25]))
  scene.add(box([0.025, 0.16, 0.02], [3.83, 4.94, WORLD.backWallZ + 0.45], materials.black, [0, 0, 0.65]))
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
  for (const lx of [x - width / 2 + 0.32, x + width / 2 - 0.32]) for (const lz of [z - depth / 2 + 0.42, z + depth / 2 - 0.42]) scene.add(box([0.28, 0.86, 0.28], [lx, 0.43, lz], materials.woodDark))
  scene.add(box([4.8, 0.46, 0.65], [x + 0.35, y + 0.31, z - 1.0], materials.wood))
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
  const group = new THREE.Group(); group.position.set(x, 1.26, z); group.rotation.y = rotationY
  const phoneMaterial = makeMaterial(color, 0.82)
  group.add(box([0.78, 0.22, 0.62], [0, 0, 0], phoneMaterial))
  group.add(cylinder(0.19, 0.035, [0.12, 0.14, 0.08], materials.paperLight, 12, [Math.PI / 2, 0, 0]))
  group.add(box([0.72, 0.12, 0.16], [0, 0.27, -0.16], phoneMaterial, [0.08, 0, 0]))
  group.add(cylinder(0.12, 0.18, [-0.29, 0.27, -0.16], phoneMaterial, 8, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.12, 0.18, [0.29, 0.27, -0.16], phoneMaterial, 8, [0, 0, Math.PI / 2]))
  scene.add(group)
}

const createDeskLamp = (scene: THREE.Scene, x: number, z: number, scale = 1) => {
  const group = new THREE.Group(); group.position.set(x, 0, z)
  group.add(cylinder(0.25 * scale, 0.07 * scale, [0, 1.02, 0], materials.brass, 12))
  group.add(cylinder(0.035 * scale, 0.7 * scale, [0, 1.4, 0], materials.brass, 8))
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.36 * scale, 0.3 * scale, 8, 1, true), materials.green)
  shade.position.set(0, 1.77, 0); shade.rotation.x = Math.PI; shade.castShadow = true; group.add(shade); scene.add(group)
}

const createRadioDesk = (scene: THREE.Scene) => {
  const { x, y, z, width, depth } = WORLD.radioDesk
  scene.add(box([width, 0.14, depth], [x, y, z], materials.wood))
  for (const lx of [x - width / 2 + 0.25, x + width / 2 - 0.25]) scene.add(box([0.24, y, 0.24], [lx, y / 2, z - depth * 0.25], materials.woodDark))
  const radios: Array<[number, number, number]> = [[-6.75, 1.3, -2.45], [-5.85, 1.15, -2.35], [-5.05, 1.22, -2.35]]
  radios.forEach(([rx, ry, rz], index) => {
    scene.add(box([0.72, 0.58 + index * 0.05, 0.48], [rx, ry, rz], materials.metal))
    scene.add(cylinder(0.11, 0.04, [rx - 0.18, ry, rz + 0.26], materials.black, 10, [Math.PI / 2, 0, 0]))
    scene.add(cylinder(0.07, 0.04, [rx + 0.18, ry, rz + 0.26], materials.black, 10, [Math.PI / 2, 0, 0]))
  })
}

const createProjector = (scene: THREE.Scene) => {
  const group = new THREE.Group(); group.position.set(4.45, 1.2, 3.15); group.rotation.y = -0.25
  group.add(box([1.15, 1.15, 1.15], [0, 0.38, 0], materials.metal))
  for (const [y, radius] of [[1.34, 0.72], [0.25, 0.62]] as const) {
    group.add(cylinder(radius, 0.13, [0.18, y, -0.06], materials.metal, 10, [Math.PI / 2, 0, 0]))
    group.add(cylinder(radius * 0.18, 0.18, [0.18, y, -0.13], materials.metalDark, 8, [Math.PI / 2, 0, 0]))
  }
  group.add(cylinder(0.18, 1.2, [-0.65, 0.52, 0.02], materials.metalDark, 8, [0, 0, Math.PI / 2])); scene.add(group)
}

const createPendant = (scene: THREE.Scene, position: [number, number, number], color: number, intensity: number, distance: number) => {
  const [x, y, z] = position
  scene.add(cylinder(0.022, 1.2, [x, y + 0.72, z], materials.black, 6))
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.34, 8, 1, true), makeMaterial(color, 0.9))
  shade.position.set(x, y, z); shade.rotation.x = Math.PI; scene.add(shade)
  const light = new THREE.PointLight(0xffd38a, intensity, distance, 1.7)
  light.position.set(x, y - 0.18, z); light.castShadow = true; light.shadow.mapSize.set(512, 512); scene.add(light)
}

const createWallFan = (scene: THREE.Scene) => {
  const group = new THREE.Group(); group.position.set(6.3, 4.35, -5.75)
  group.add(new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.028, 6, 18), materials.metalDark))
  group.add(cylinder(0.12, 0.16, [0, 0, 0.03], materials.metalDark, 10, [Math.PI / 2, 0, 0]))
  for (let i = 0; i < 4; i += 1) group.add(box([0.12, 0.62, 0.035], [0, 0.27, 0], materials.metal, [0, 0, i * Math.PI / 2 + 0.42]))
  scene.add(group)
}

const createPaperCluster = (scene: THREE.Scene) => {
  const papers = new THREE.Group(); papers.position.set(0.65, 1.0, 2.35)
  papers.add(box([1.75, 0.025, 1.15], [0, 0, 0], materials.paperLight, [0, 0.08, 0]))
  papers.add(box([1.35, 0.028, 0.95], [0.2, 0.035, 0.13], materials.paper, [0, -0.05, 0])); scene.add(papers)
}

const createFolders = (scene: THREE.Scene) => {
  const group = new THREE.Group(); group.position.set(-0.45, 1.12, -0.15)
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
  createRoomShell(scene); createTable(scene); createRadioDesk(scene); createMapBoard(scene); createProjector(scene); createPaperCluster(scene); createFolders(scene); createWallFan(scene)
  createChair(scene, -2.65, 2.15, 0.5); createChair(scene, 5.15, -0.2, -1.2); createChair(scene, 5.4, 2.2, -1.15)
  createPhone(scene, 0.2, -1.4, 0x315b3c, 0.08); createPhone(scene, 1.25, -1.25, 0xd8ceb0, -0.03); createPhone(scene, 2.35, -1.0, PALETTE.red, 0.08); createPhone(scene, 3.4, -0.75, 0xd9d1b8, 0.14); createPhone(scene, 4.25, -0.45, 0x315b3c, 0.2)
  createDeskLamp(scene, -0.75, -0.85, 0.9); createDeskLamp(scene, 1.0, 0.6, 0.92)
  createPendant(scene, [-2.95, 5.25, -4.8], 0x284b2e, 2.2, 7); createPendant(scene, [-1.35, 5.0, -4.75], 0x5e8a32, 1.4, 5); createPendant(scene, [4.9, 4.6, -4.9], 0x4f632c, 0.7, 4)
  const boardDraw = createHangingBoard(scene)
  const hotspots: Hotspot[] = [
    createHotspot(scene, 'work', [8.55, 4.5, 0.28], [WORLD.map.x, WORLD.map.y, WORLD.map.z + 0.3]),
    createHotspot(scene, 'writing', [2.5, 0.62, 2.2], [0.7, 1.13, 2.2]),
    createHotspot(scene, 'speaking', [3.8, 1.9, 1.5], [WORLD.radioDesk.x, 1.35, WORLD.radioDesk.z]),
    createHotspot(scene, 'contact', [5.2, 1.45, 2.0], [2.35, 1.42, -0.95]),
    createHotspot(scene, 'about', [2.35, 2.5, 2.0], [4.45, 2.0, 3.15]),
  ]
  camera.position.set(4.9, 4.95, 10.2); camera.lookAt(-2.15, 2.7, -4.75)
  return { hotspots, boardDraw }
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

  const { hotspots, boardDraw } = createScene(scene, camera)
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(2, 2)
  const baseCameraPosition = camera.position.clone(); const currentCameraPosition = camera.position.clone(); const targetCameraPosition = camera.position.clone(); const targetLookAt = new THREE.Vector3(-2.15, 2.7, -4.75)
  let activeId: SectionId = 'work'; let lastTouchSelection: SectionId | null = null; let frame = 0; let disposed = false
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)'); const coarsePointer = window.matchMedia('(pointer: coarse)')

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
    if (event.pointerType === 'touch') return
    updatePointer(event); pick()
    if (!reducedMotion.matches && !coarsePointer.matches) targetCameraPosition.copy(baseCameraPosition)
  }
  const navigate = (id: SectionId) => window.location.assign(SECTIONS[id].href)
  const onPointerDown = (event: PointerEvent) => {
    updatePointer(event); const hit = pick(); if (!hit) return
    if (event.pointerType === 'touch' && lastTouchSelection !== hit) { lastTouchSelection = hit; setActive(hit); return }
    navigate(hit)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Enter'].includes(event.key)) return
    event.preventDefault(); const index = SECTION_ORDER.indexOf(activeId)
    if (event.key === 'ArrowLeft') setActive(SECTION_ORDER[(index - 1 + SECTION_ORDER.length) % SECTION_ORDER.length])
    if (event.key === 'ArrowRight') setActive(SECTION_ORDER[(index + 1) % SECTION_ORDER.length])
    if (event.key === 'Enter') navigate(activeId)
  }
  const render = () => {
    if (disposed) return
    if (!reducedMotion.matches) { currentCameraPosition.lerp(targetCameraPosition, 0.055); camera.position.copy(currentCameraPosition); camera.lookAt(targetLookAt) }
    renderer.render(scene, camera); frame = requestAnimationFrame(render)
  }
  const onContextLost = (event: Event) => { event.preventDefault(); root.dataset.webgl = 'failed' }

  resize(); selectDefault(); loading?.setAttribute('data-ready', 'true')
  canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointerdown', onPointerDown); canvas.addEventListener('keydown', onKeyDown); canvas.addEventListener('webglcontextlost', onContextLost); window.addEventListener('resize', resize)
  frame = requestAnimationFrame(render)

  return () => {
    disposed = true; cancelAnimationFrame(frame)
    canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('keydown', onKeyDown); canvas.removeEventListener('webglcontextlost', onContextLost); window.removeEventListener('resize', resize); renderer.dispose()
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose(); const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
      objectMaterials.forEach((material) => { if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose(); material.dispose() })
    })
  }
}
