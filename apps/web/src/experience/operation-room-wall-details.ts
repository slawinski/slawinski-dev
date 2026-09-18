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

  // Brown utility pipe follows the foreground post straight up. It is mounted
  // just outside the post face and has no elbow or side run.
  // Keep the pipe clear of the wall/post. It hangs in the room from brackets
  // attached to the camera-facing support structure.
  const pipeX = 3.3
  // Camera is on the positive-Z side of the room, so the pipe sits on the
  // post's front face rather than disappearing behind it.
  const pipeZ = 2.95
  // Finish above the nearby chair's backrest (top ≈ 1.62), leaving a small
  // visible clearance beneath the flared termination.
  const pipeBottom = 2.75
  const pipeTop = 7.25
  group.add(cylinder(0.09, pipeTop - pipeBottom, [pipeX, (pipeTop + pipeBottom) / 2, pipeZ], pipeBrown, 10))
  group.add(cylinder(0.14, 0.24, [pipeX, pipeBottom - 0.12, pipeZ], pipeBrown, 10))
  group.add(cylinder(0.11, 0.08, [pipeX, pipeBottom - 0.27, pipeZ], pipeDark, 10))
  group.add(cylinder(0.13, 0.07, [pipeX, 4.60, pipeZ], pipeDark, 10))
  group.add(cylinder(0.13, 0.07, [pipeX, 6.20, pipeZ], pipeDark, 10))

  // Three wall straps match the strong horizontal dark marks in the reference.
  for (const y of [3.43, 5.07]) {
    // Each bracket spans the gap from the post's front face (z=2.51) to the
    // pipe, with a collar at the pipe so the suspension is legible.
    group.add(box([0.16, 0.075, pipeZ - 2.51], [pipeX, y, (2.51 + pipeZ) / 2], pipeDark))
  }

  // Cork/message board attached to the front face of the timber post below the
  // fan. The post's visible face is around x=2.99.
  const boardX = 2.965
  const boardY = 3.25
  const boardZ = 2.20
  group.add(box([0.075, 1.18, 0.88], [boardX, boardY, boardZ], boardWood))
  group.add(box([0.025, 1.03, 0.73], [boardX - 0.052, boardY, boardZ], cork))

  // Uneven pinned notices keep the board readable at room scale without text.
  group.add(box([0.016, 0.34, 0.28], [boardX - 0.071, boardY + 0.26, boardZ - 0.18], paperLight, [0.03, 0, 0.035]))
  group.add(box([0.016, 0.28, 0.31], [boardX - 0.072, boardY + 0.12, boardZ + 0.18], paper, [-0.025, 0, -0.05]))
  group.add(box([0.016, 0.26, 0.25], [boardX - 0.073, boardY - 0.28, boardZ - 0.12], paper, [0.02, 0, -0.02]))
  group.add(cylinder(0.025, 0.018, [boardX - 0.086, boardY + 0.39, boardZ - 0.18], pinRed, 8, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.025, 0.018, [boardX - 0.086, boardY + 0.23, boardZ + 0.18], pinGreen, 8, [0, 0, Math.PI / 2]))

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
