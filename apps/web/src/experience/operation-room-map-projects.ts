import * as THREE from 'three'

type ProjectDefinition = {
  id: string
  title: string
  repo: string
  url: string
  note: [number, number]
  noteRotation: number
  summary: string
  overview: string
  highlights: string[]
  stack: string[]
}

const MAP = {
  x: -3.35,
  y: 3.42,
  z: -5.79,
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
    note: [-6.62, 5.02],
    noteRotation: -0.055,
    summary: 'A mobile firearm inventory and shooting log with a deliberately retro terminal interface.',
    overview: 'G-LOG (TriggerNote) is a React Native app for keeping firearm inventory, ammunition, range visits and shooting statistics together in one local-first tool. The project treats the logbook as an operational utility rather than a generic collection app.',
    highlights: [
      'Firearm inventory with specifications, purchase details and photos.',
      'Ammunition stock and consumption tracking across range visits.',
      'Per-firearm round counts, collection statistics and usage history.',
      'Local persistence and a green-on-black terminal-inspired visual system.',
    ],
    stack: ['React Native', 'TypeScript', 'Expo', 'MMKV', 'React Hook Form', 'Zod'],
  },
  {
    id: 'eggspedition',
    title: 'EGGSPEDITION',
    repo: 'slawinski/eggspedition',
    url: 'https://github.com/slawinski/eggspedition',
    note: [-6.57, 1.79],
    noteRotation: 0.045,
    summary: 'A household grocery-list app built around quick capture, shared lists and mobile-first use.',
    overview: 'Eggspedition is a shared household grocery application. Signed-in users work with a household-scoped list, categories, stores and activity history, while the interface is designed around fast additions and a compact mobile workflow.',
    highlights: [
      'Shared household model with onboarding and join flows.',
      'Fast grocery-item capture with categories and stores.',
      'Grouped smart views and household activity history.',
      'Custom claymorphism-inspired UI built without utility-first CSS.',
    ],
    stack: ['TanStack Start', 'React', 'TanStack Router', 'TanStack Query', 'TypeScript', 'CSS Modules'],
  },
  {
    id: 'spray-and-pray',
    title: 'SPRAY & PRAY',
    repo: 'slawinski/spray-and-pray',
    url: 'https://github.com/slawinski/spray-and-pray',
    note: [-0.20, 5.00],
    noteRotation: 0.052,
    summary: 'A local-first job-application engine that turns job hunting into a trackable terminal workflow.',
    overview: 'Spray & Pray is a single-user job-search system that captures job descriptions, tailors CVs and cover letters, tracks application state, supports interview preparation and turns weak areas into learning material. The core workflow stays local, with external calls limited to configured LLM providers.',
    highlights: [
      'ATS-oriented CV and cover-letter generation from a master CV.',
      'Application pipeline with status history and Sankey visualisation.',
      'Browser-extension capture plus a terminal-native dashboard.',
      'Mock interviews, evaluation and generated deep-dive lessons.',
    ],
    stack: ['Python', 'FastAPI', 'Textual', 'SQLite', 'OpenAI-compatible APIs', 'Vanilla JS'],
  },
  {
    id: 'podklajdal',
    title: 'PODKŁAJDAL',
    repo: 'slawinski/podklajdal',
    url: 'https://github.com/slawinski/podklajdal',
    note: [-0.20, 1.82],
    noteRotation: -0.042,
    summary: 'A one-command local CLI that turns a YouTube video into vocal and instrumental MP3 tracks.',
    overview: 'Podkłajdal is intentionally narrow: paste one YouTube URL and receive two local files — vocals and instrumental. Downloading, audio preparation, source separation and encoding are handled as one staged workflow so the user does not need to understand the tools underneath it.',
    highlights: [
      'Single-command YouTube-to-stems workflow.',
      'Local audio processing and AI source separation.',
      'Stage-based progress, diagnostics and actionable failures.',
      'Apple Silicon macOS as the primary target with cached separation models.',
    ],
    stack: ['Python 3.12', 'Typer', 'Rich', 'yt-dlp', 'FFmpeg', 'python-audio-separator'],
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
  context.fillText('Open dossier', 42, 276)
})

const tagProjectObject = (object: THREE.Object3D, projectId: string, role: string) => {
  object.userData.mapProjectId = projectId
  object.userData.mapProjectRole = role
  return object
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

  const noteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createNoteTexture(project),
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  })
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.025, height - 0.025), noteMaterial)
  face.position.z = PROJECT_LAYER_Z + 0.036
  face.castShadow = true
  group.add(tagProjectObject(face, project.id, 'paper'))

  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.30), hitMaterial)
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

  for (const project of PROJECTS) group.add(createNote(project, hitMaterial))
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

  const root = canvas.closest<HTMLElement>('[data-operation-room]')
  const reader = root?.querySelector<HTMLElement>('[data-operation-room-reader]') ?? null
  const documentPanel = root?.querySelector<HTMLElement>('[data-operation-room-document]') ?? null
  const readerTitle = root?.querySelector<HTMLElement>('[data-operation-room-reader-title]') ?? null
  const readerDate = root?.querySelector<HTMLTimeElement>('[data-operation-room-reader-date]') ?? null
  const readerTags = root?.querySelector<HTMLElement>('[data-operation-room-reader-tags]') ?? null
  const readerExcerpt = root?.querySelector<HTMLElement>('[data-operation-room-reader-excerpt]') ?? null
  const readerBody = root?.querySelector<HTMLElement>('[data-operation-room-reader-body]') ?? null
  const readerStamp = root?.querySelector<HTMLElement>('.operation-room__document-stamp') ?? null
  const closeButtons = root ? [...root.querySelectorAll<HTMLButtonElement>('[data-operation-room-reader-close]')] : []
  const originalStamp = readerStamp?.textContent ?? 'FIELD NOTES / WRITING'

  const hitboxes: THREE.Mesh[] = []
  projectRoot.traverse((object) => {
    if (object instanceof THREE.Mesh && object.userData.mapProjectHit) hitboxes.push(object)
  })

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2(2, 2)
  const mapTarget = new THREE.Vector3(MAP.x, MAP.y, MAP_FACE_Z)
  const cameraDirection = new THREE.Vector3()
  const toMap = new THREE.Vector3()
  const zoomOutButton = root?.querySelector<HTMLButtonElement>('[data-operation-room-zoom-out]') ?? null
  let hoveredId: string | null = null
  let projectReaderOpen = false

  const updatePointer = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
  }

  const isFocusedMapView = () => {
    if (!zoomOutButton || zoomOutButton.hidden || projectReaderOpen) return false
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
        if (role === 'paper') material.color.setHex(active ? 0xfff0c3 : 0xffffff)
        if (role === 'paper-backing') material.color.setHex(active ? 0xd7c497 : 0xc9b68d)
      })
    })
  }

  const projectAtPointer = () => {
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(hitboxes, false)[0]?.object
    return hit?.userData.mapProjectId as string | undefined
  }

  const appendHeading = (text: string) => {
    const heading = document.createElement('h2')
    heading.textContent = text
    readerBody?.append(heading)
  }

  const appendParagraph = (text: string) => {
    const paragraph = document.createElement('p')
    paragraph.textContent = text
    readerBody?.append(paragraph)
  }

  const appendList = (items: string[]) => {
    const list = document.createElement('ul')
    items.forEach((item) => {
      const listItem = document.createElement('li')
      listItem.textContent = item
      list.append(listItem)
    })
    readerBody?.append(list)
  }

  const closeProjectReader = () => {
    if (!projectReaderOpen || !reader || !root) return
    projectReaderOpen = false
    reader.dataset.open = 'false'
    reader.setAttribute('aria-hidden', 'true')
    root.dataset.readerOpen = 'false'
    document.body.style.overflow = ''
    if (readerStamp) readerStamp.textContent = originalStamp
    if (readerDate) readerDate.hidden = false
    window.setTimeout(() => canvas.focus(), 320)
  }

  const openProjectReader = (project: ProjectDefinition) => {
    if (!reader || !root || !readerTitle || !readerTags || !readerExcerpt || !readerBody) return

    setHovered(project.id)
    readerTitle.textContent = project.title
    readerTags.textContent = `FEATURED PROJECT / ${project.repo}`
    readerExcerpt.textContent = project.summary
    if (readerDate) {
      readerDate.textContent = ''
      readerDate.removeAttribute('datetime')
      readerDate.hidden = true
    }
    if (readerStamp) readerStamp.textContent = 'CASE FILE / WORK'

    readerBody.replaceChildren()
    appendHeading('Overview')
    appendParagraph(project.overview)
    appendHeading('Selected capabilities')
    appendList(project.highlights)
    appendHeading('Stack')
    appendParagraph(project.stack.join(' / '))

    const actions = document.createElement('p')
    const githubLink = document.createElement('a')
    githubLink.href = project.url
    githubLink.target = '_blank'
    githubLink.rel = 'noreferrer'
    githubLink.textContent = 'View project on GitHub ↗'
    actions.append(githubLink)
    readerBody.append(actions)

    projectReaderOpen = true
    root.dataset.readerOpen = 'true'
    reader.dataset.open = 'true'
    reader.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => documentPanel?.focus())
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
    event.preventDefault()
    openProjectReader(project)
  }

  const onPointerLeave = () => {
    if (!projectReaderOpen) setHovered(null)
    if (isFocusedMapView()) canvas.style.cursor = 'default'
  }

  const onReaderClose = () => closeProjectReader()
  const onReaderKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !projectReaderOpen) return
    event.preventDefault()
    closeProjectReader()
  }

  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerLeave)
  closeButtons.forEach((button) => button.addEventListener('click', onReaderClose))
  window.addEventListener('keydown', onReaderKey)

  const cleanup = () => {
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerLeave)
    closeButtons.forEach((button) => button.removeEventListener('click', onReaderClose))
    window.removeEventListener('keydown', onReaderKey)
    if (projectReaderOpen) closeProjectReader()
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
