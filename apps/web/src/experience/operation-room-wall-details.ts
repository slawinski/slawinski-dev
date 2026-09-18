import * as THREE from 'three'

const material = (color: number, roughness = 0.86, metalness = 0.02) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true })

const box = (
  size: [number, number, number],
  position: [number, number, number],
  meshMaterial: THREE.Material,
  rotation: [number, number, number] = [0, 0, 0],
) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), meshMaterial)
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
  meshMaterial: THREE.Material,
  segments = 10,
  rotation: [number, number, number] = [0, 0, 0],
) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), meshMaterial)
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

const tube = (
  points: Array<[number, number, number]>,
  radius: number,
  meshMaterial: THREE.Material,
) => {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), false, 'catmullrom', 0.1)
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, radius, 5, false), meshMaterial)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

const createWallDetails = () => {
  const group = new THREE.Group()
  group.name = 'operation-room-wall-details'

  const pipeBrown = material(0x58351f, 0.72, 0.18)
  const pipeDark = material(0x30251e, 0.82, 0.12)
  const pipeHighlight = material(0x754a2b, 0.68, 0.16)
  const hookMetal = material(0x353735, 0.72, 0.28)
  const boardWood = material(0x84643e, 0.94)
  const cork = material(0xb58c51, 0.98)
  const paper = material(0xdacba2, 0.98)
  const paperLight = material(0xe7ddbe, 0.98)
  const pinRed = material(0x873b2b, 0.8)
  const pinGreen = material(0x365c3c, 0.8)

  // Brown utility/steam pipe on the right wall. The room interior ends at
  // x=6.8, so the pipe is held just inside the wall rather than buried in it.
  const pipeX = 6.55
  const pipeZ = 1.15
  group.add(cylinder(0.09, 4.75, [pipeX, 3.00, pipeZ], pipeBrown, 10))
  group.add(cylinder(0.13, 0.07, [pipeX, 0.68, pipeZ], pipeDark, 10))
  group.add(cylinder(0.13, 0.07, [pipeX, 2.10, pipeZ], pipeDark, 10))
  group.add(cylinder(0.13, 0.07, [pipeX, 4.35, pipeZ], pipeDark, 10))
  group.add(cylinder(0.13, 0.07, [pipeX, 5.34, pipeZ], pipeDark, 10))

  // Broad lower shoe/flange and a subtle collar keep the bottom from reading
  // as a pipe simply disappearing into the floor.
  const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.28, 0.24, 10), pipeBrown)
  boot.position.set(pipeX, 0.42, pipeZ)
  boot.castShadow = true
  boot.receiveShadow = true
  group.add(boot)
  group.add(cylinder(0.24, 0.055, [pipeX, 0.295, pipeZ], pipeDark, 10))

  // Top elbow and short horizontal run toward the back wall.
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 7), pipeBrown))
  const elbow = group.children[group.children.length - 1] as THREE.Mesh
  elbow.position.set(pipeX, 5.42, pipeZ)
  elbow.castShadow = true
  group.add(cylinder(0.09, 1.28, [pipeX, 5.42, 0.55], pipeBrown, 10, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.125, 0.06, [pipeX, 5.42, -0.08], pipeDark, 10, [Math.PI / 2, 0, 0]))

  // Three wall straps match the strong horizontal dark marks in the reference.
  for (const y of [1.55, 3.18, 4.82]) {
    group.add(box([0.22, 0.075, 0.38], [6.66, y, pipeZ], pipeDark))
    group.add(box([0.035, 0.13, 0.50], [6.535, y, pipeZ], pipeHighlight))
  }

  // Cork/message board attached to the front face of the timber post below the
  // fan. The post's visible face is around x=2.99.
  const boardX = 2.965
  const boardY = 1.92
  const boardZ = 2.20
  group.add(box([0.075, 1.18, 0.88], [boardX, boardY, boardZ], boardWood))
  group.add(box([0.025, 1.03, 0.73], [boardX - 0.052, boardY, boardZ], cork))

  // Uneven pinned notices keep the board readable at room scale without text.
  group.add(box([0.016, 0.34, 0.28], [boardX - 0.071, boardY + 0.26, boardZ - 0.18], paperLight, [0.03, 0, 0.035]))
  group.add(box([0.016, 0.28, 0.31], [boardX - 0.072, boardY + 0.12, boardZ + 0.18], paper, [-0.025, 0, -0.05]))
  group.add(box([0.016, 0.26, 0.25], [boardX - 0.073, boardY - 0.28, boardZ - 0.12], paper, [0.02, 0, -0.02]))
  group.add(cylinder(0.025, 0.018, [boardX - 0.086, boardY + 0.39, boardZ - 0.18], pinRed, 8, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.025, 0.018, [boardX - 0.086, boardY + 0.23, boardZ + 0.18], pinGreen, 8, [0, 0, Math.PI / 2]))

  // Row of simple black coat hooks on the post above the board.
  const hookYs = [2.72, 2.93]
  const hookZs = [1.92, 2.24, 2.52]
  hookYs.forEach((y, row) => {
    hookZs.forEach((z, index) => {
      if (row === 1 && index === 1) return
      group.add(cylinder(0.025, 0.22, [2.86, y, z], hookMetal, 7, [0, 0, Math.PI / 2]))
      group.add(cylinder(0.025, 0.14, [2.75, y + 0.055, z], hookMetal, 7, [0, 0, 0.35]))
      group.add(cylinder(0.035, 0.035, [2.69, y + 0.12, z], hookMetal, 7))
    })
  })

  // Two empty wire coat hangers suspended from the lower hooks. They are coarse
  // enough to survive the fixed camera distance, but still read as wire forms.
  const addHanger = (y: number, z: number, tilt: number) => {
    const hanger = new THREE.Group()
    hanger.position.set(2.68, y, z)
    hanger.rotation.x = tilt
    hanger.add(tube([
      [0, 0.16, 0],
      [-0.02, 0.08, 0],
      [0.00, 0.00, 0],
      [0.00, -0.07, 0],
    ], 0.012, hookMetal))
    hanger.add(tube([
      [0.00, -0.07, 0],
      [-0.02, -0.13, -0.02],
      [0.00, -0.18, -0.10],
      [0.00, -0.27, -0.28],
      [0.00, -0.34, 0],
      [0.00, -0.27, 0.28],
      [0.00, -0.18, 0.10],
      [0.00, -0.07, 0],
    ], 0.012, hookMetal))
    group.add(hanger)
  }
  addHanger(2.67, 1.92, -0.08)
  addHanger(2.67, 2.52, 0.06)

  return group
}

export const installOperationRoomWallDetails = () => {
  const scenePrototype = THREE.Scene.prototype
  const originalAdd = scenePrototype.add
  let installed = false

  scenePrototype.add = function (...objects: THREE.Object3D[]) {
    const result = originalAdd.apply(this, objects)
    if (!installed) {
      installed = true
      originalAdd.call(this, createWallDetails())
      scenePrototype.add = originalAdd
    }
    return result
  }

  return () => {
    if (scenePrototype.add !== originalAdd) scenePrototype.add = originalAdd
  }
}
