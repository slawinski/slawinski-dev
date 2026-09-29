import * as THREE from 'three'

type ProjectDefinition = {
  id: string
  title: string
  repo: string
  url: string
  pin: [number, number]
  note: [number, number]
  noteRotation: number
  labelSide: 'left' | 'right'
  stringBend: [number, number]
}

const MAP = {
  x: -3.35,
  y: 3.42,
  z: -5.79,
  width: 8.4,
  height: 4.45,
} as const

const MAP_FACE_Z = MAP.z + 0.06
const PROJECT_LAYER_Z = MAP_FACE_Z + 0.075
const PROJECT_GROUP_NAME = 'operation-room-map-projects'

const PROJECTS: ProjectDefinition[] = [
  {
    id: 'g-log',
    title: 'G-LOG',
    repo: 'slawinski/glock-log',
    url: 'https://github.com/slawinski/glock-log',
    pin: [-5.72, 4.12],
    note: [-6.62, 5.02],
    noteRotation: -0.055,
    labelSide: 'right',
    stringBend: [-0.18, 0.12],
  },
  {
    id: 'eggspedition',
    title: 'EGGSPEDITION',
    repo: 'slawinski/eggspedition',
    url: 'https://github.com/slawinski/eggspedition',
    pin: [-4.75, 2.52],
    note: [-6.57, 1.79],
    noteRotation: 0.045,
    labelSide: 'right',
    stringBend: [-0.12, -0.12],
  },
  {
    id: 'spray-and-pray',
    title: 'SPRAY & PRAY',
    repo: 'slawinski/spray-and-pray',
    url: 'https://github.com/slawinski/spray-and-pray',
    pin: [-1.62, 4.08],
    note: [-0.20, 5.00],
    noteRotation: 0.052,
    labelSide: 'left',
    stringBend: [0.12, 0.13],
  },
  {
    id: 'podklajdal',
    title: 'PODKŁAJDAL',
    repo: 'slawinski/podklajdal',
    url: 'https://github.com/slawinski/podklajdal',
    pin: [-2.34, 2.33],
    note: [-0.20, 1.82],
    noteRotation: -0.042,
    labelSide: 'right',
    stringBend: [0.10, -0.13],
  },
]

const createTexture = (
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
  texture.anisotropy = 4
  return texture
}

const createLabelTexture = (title: string) => createTexture(640, 128, (context, canvas) => {
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#d9c89f'
  context.fillRect(0, 10, canvas.width, canvas.height - 20)
  context.strokeStyle = 'rgba(78, 58, 35, .48)'
  context.lineWidth = 5
  context.strokeRect(8, 18, canvas.width - 16, canvas.height - 36)
  context.fillStyle = '#362d21'
  context.font = '700 49px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(title, canvas.width / 2, canvas.height / 2 + 1)
})

const createNoteTexture = (project: ProjectDefinition) => createTexture(768, 352, (context, canvas) => {
  context.fillStyle = '#ded0aa'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.strokeStyle = 'rgba(86, 67, 42, .22)'
  context.lineWidth = 3
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36)

  context.fillStyle = '#8a3527'
  context.font = '700 24px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  context.textAlign = 'left'
  context.fillText('CASE FILE / FEATURED PROJECT', 42, 58)

  context.fillStyle = '#2f2a20'
  context.font = '700 47px Georgia, serif'
  context.fillText(project.title, 42, 132)

  context.strokeStyle = 'rgba(66, 53, 35, .32)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(42, 164)
  context.lineTo(canvas.width - 42, 164)
  context.stroke()

  context.fillStyle = '#544a38'
  context.font = '600 25px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  context.fillText(project.repo, 42, 220)

  context.fillStyle = '#746750'
  context.font = 'italic 25px Georgia, serif'
  context.fillText('GitHub repository', 42, 276)
})

const makePaperMaterial = (texture?: THREE.Texture) => new THREE.MeshStandardMaterial({
  color: 0xdac89f,
  map: texture ?? null,
  roughness: 1,
  metalness: 0,
  side: THREE.DoubleSide,
})

const tagProjectObject = (object: THREE.Object3D, projectId: string, role: string) => {
  object.userData.mapProjectId = projectId
  object.userData.mapProjectRole = role
  return object
}

const createString = (project: ProjectDefinition) => {
  const start = new THREE.Vector3(project.pin[0], project.pin[1], PROJECT_LAYER_Z + 0.018)
  const end = new THREE.Vector3(project.note[0], project.note[1], PROJECT_LAYER_Z + 0.018)
  const midpoint = start.clone().lerp(end, 0.52)
  midpoint.x += project.stringBend[0]
  midpoint.y += project.stringBend[1]
  const quarter = start.clone().lerp(midpoint, 0.50)
  quarter.y -= 0.035
  const threeQuarter = midpoint.clone().lerp(end, 0.50)
  threeQuarter.y -= 0.025
  const curve = new THREE.CatmullRomCurve3([start, quarter, midpoint, threeQuarter, end], false, 'catmullrom', 0.18)
  const material = new THREE.MeshStandardMaterial({ color: 0x6a3025, roughness: 0.98, metalness: 0 })
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.014, 5, false), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return tagProjectObject(mesh, project.id, 'string')
}

const createPin = (project: ProjectDefinition, hitMaterial: THREE.Material) => {
  const group = new THREE.Group()
  group.position.set(project.pin[0], project.pin[1], 0)

  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x51473b, roughness: 0.56, metalness: 0.48 })
  const pinMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b3426,
    roughness: 0.66,
    metalness: 0.06,
    emissive: 0x000000,
    emissiveIntensity: 0,
  })

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8), stemMaterial)
  stem.position.set(0, 0, PROJECT_LAYER_Z + 0.075)
  stem.rotation.x = Math.PI / 2
  stem.castShadow = true
  group.add(stem)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 8), pinMaterial)
  head.position.set(0, 0, PROJECT_LAYER_Z + 0.175)
  head.castShadow = true
  group.add(tagProjectObject(head, project.id, 'pin'))

  const labelWidth = THREE.MathUtils.clamp(0.58 + project.title.length * 0.073, 0.92, 1.62)
  const labelOffset = project.labelSide === 'right' ? 0.18 + labelWidth / 2 : -0.18 - labelWidth / 2
  const labelTexture = createLabelTexture(project.title)
  const labelMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: labelTexture,
    roughness: 1,
    metalness: 0,
    transparent: true,
    side: THREE.DoubleSide,
  })
  const label = new THREE.Mesh(new THREE.PlaneGeometry(labelWidth, 0.30), labelMaterial)
  label.position.set(labelOffset, 0.015, PROJECT_LAYER_Z + 0.055)
  label.castShadow = true
  group.add(tagProjectObject(label, project.id, 'label'))

  const minX = Math.min(-0.18, labelOffset - labelWidth / 2)
  const maxX = Math.max(0.18, labelOffset + labelWidth / 2)
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(maxX - minX + 0.14, 0.48, 0.34), hitMaterial)
  hitbox.position.set((minX + maxX) / 2, 0, PROJECT_LAYER_Z + 0.13)
  hitbox.userData.mapProjectHit = true
  hitbox.userData.mapProjectId = project.id
  group.add(hitbox)

  return group
}

const createNote = (project: ProjectDefinition, hitMaterial: THREE.Material) => {
  const group = new THREE.Group()
  group.position.set(project.note[0], project.note[1], 0)
  group.rotation.z = project.noteRotation

  const width = 1.56
  const height = 0.78
  const backingMaterial = new THREE.MeshStandardMaterial({ color: 0xc9b68d, roughness: 1, metalness: 0 })
  const backing = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.025), backingMaterial)
  backing.position.z = PROJECT_LAYER_Z + 0.018
  backing.castShadow = true
  backing.receiveShadow = true
  group.add(tagProjectObject(backing, project.id, 'paper-backing'))

  const noteMaterial = makePaperMaterial(createNoteTexture(project))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.025, height - 0.025), noteMaterial)
  face.position.z = PROJECT_LAYER_Z + 0.036
  face.castShadow = true
  group.add(tagProjectObject(face, project.id, 'paper'))

  const tackMaterial = new THREE.MeshStandardMaterial({ color: 0x3d3428, roughness: 0.56, metalness: 0.25 })
  const tack = new THREE.Mesh(new THREE.SphereGeometry(0.043, 9, 6), tackMaterial)
  tack.position.set(-width * 0.32, height * 0.34, PROJECT_LAYER_Z + 0.075)
  tack.castShadow = true
  group.add(tack)

  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, height + 0.06, 0.30), hitMaterial)
  hitbox.position.z = PROJECT_LAYER_Z + 0.10
  hitbox.userData.mapProjectHit = true
  hitbox.userData.mapProjectId = project.id
  group.add(hitbox)

  return group
}

export const createOperationRoomMapProjects = () => {
  const group = new THREE.Group()
  group.name = PROJECT_GROUP_NAME

  const hitMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  })

  for (const project of PROJECTS) {
    group.add(createString(project))
    group.add(createPin(project, hitMaterial))
    group.add(createNote(project, hitMaterial))
  }

  return group
}

const hideLegacyMapNotes = (scene: THREE.Scene) => {
  const legacyPositions = [
    [-4.65, 3.75],
    [-3.2, 2.8],
    [-1.4, 4.2],
    [-0.2, 3.05],
    [0.3, 4.45],
  ]
  const legacyZ = MAP.z + 0.095

  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    if (object.userData.mapProjectId) return
    if (Math.abs(object.position.z - legacyZ) > 0.006) return
    if (!legacyPositions.some(([x, y]) => Math.abs(object.position.x - x) < 0.006 && Math.abs(object.position.y - y) < 0.006)) return
    object.visible = false
  })
}

let activeInteractionCleanup: (() => void) | null = null

const attachInteraction = (scene: THREE.Scene, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) => {
  activeInteractionCleanup?.()
  hideLegacyMapNotes(scene)

  const projectRoot = scene.getObjectByName(PROJECT_GROUP_NAME)
  if (!projectRoot) return

  const hitboxes: THREE.Mesh[] = []
  projectRoot.traverse((object) => {
    if (object instanceof THREE.Mesh && object.userData.mapProjectHit) hitboxes.push(object)
  })

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2(2, 2)
  const mapTarget = new THREE.Vector3(MAP.x, MAP.y, MAP_FACE_Z)
  const cameraDirection = new THREE.Vector3()
  const toMap = new THREE.Vector3()
  const zoomOutButton = document.querySelector<HTMLButtonElement>('[data-operation-room-zoom-out]')
  let hoveredId: string | null = null

  const updatePointer = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
  }

  const isFocusedMapView = () => {
    if (!zoomOutButton || zoomOutButton.hidden) return false
    if (Math.abs(camera.position.x - MAP.x) > 0.10 || Math.abs(camera.position.y - MAP.y) > 0.10) return false
    camera.getWorldDirection(cameraDirection)
    toMap.copy(mapTarget).sub(camera.position).normalize()
    return cameraDirection.dot(toMap) > 0.997
  }

  const setHovered = (projectId: string | null) => {
    if (hoveredId === projectId) return
    hoveredId = projectId

    projectRoot.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const id = object.userData.mapProjectId as string | undefined
      const role = object.userData.mapProjectRole as string | undefined
      if (!id || !role) return
      const active = id === projectId
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]

      objectMaterials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return
        if (role === 'pin') {
          material.emissive.setHex(active ? 0x5f1d12 : 0x000000)
          material.emissiveIntensity = active ? 0.95 : 0
        }
        if (role === 'string') material.color.setHex(active ? 0xb44a34 : 0x6a3025)
        if (role === 'paper') material.color.setHex(active ? 0xfff2c9 : 0xffffff)
        if (role === 'paper-backing') material.color.setHex(active ? 0xd8c79e : 0xc9b68d)
        if (role === 'label') material.color.setHex(active ? 0xfff2ca : 0xffffff)
      })
    })
  }

  const projectAtPointer = () => {
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(hitboxes, false)[0]?.object
    return hit?.userData.mapProjectId as string | undefined
  }

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    if (!isFocusedMapView()) {
      setHovered(null)
      return
    }
    updatePointer(event)
    const projectId = projectAtPointer() ?? null
    setHovered(projectId)
    canvas.style.cursor = projectId ? 'pointer' : 'default'
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!isFocusedMapView()) return
    updatePointer(event)
    const projectId = projectAtPointer()
    if (!projectId) return
    const project = PROJECTS.find((candidate) => candidate.id === projectId)
    if (!project) return
    setHovered(projectId)
    event.preventDefault()
    window.open(project.url, '_blank', 'noopener,noreferrer')
  }

  const onPointerLeave = () => {
    setHovered(null)
    if (isFocusedMapView()) canvas.style.cursor = 'default'
  }

  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerLeave)

  const cleanup = () => {
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerLeave)
    setHovered(null)
    activeInteractionCleanup = null
  }
  activeInteractionCleanup = cleanup
  document.addEventListener('astro:before-swap', cleanup, { once: true })
}

export const installOperationRoomMapProjectInteraction = () => {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-operation-room-canvas]')
  if (!canvas) return { registerScene: (_scene: THREE.Scene) => undefined, restore: () => undefined }

  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let attached = false

  const objectPrototype = THREE.Object3D.prototype as THREE.Object3D & { lookAt: (...args: unknown[]) => void }
  const originalLookAt = objectPrototype.lookAt

  const tryAttach = () => {
    if (attached || !scene || !camera) return
    attached = true
    attachInteraction(scene, camera, canvas)
  }

  const patchedLookAt = function (this: THREE.Object3D, ...args: unknown[]) {
    originalLookAt.apply(this, args)
    if (this instanceof THREE.PerspectiveCamera) {
      camera = this
      tryAttach()
    }
  }

  objectPrototype.lookAt = patchedLookAt

  return {
    registerScene: (nextScene: THREE.Scene) => {
      scene = nextScene
      tryAttach()
    },
    restore: () => {
      if (objectPrototype.lookAt === patchedLookAt) objectPrototype.lookAt = originalLookAt
    },
  }
}
