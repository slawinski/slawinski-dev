import * as THREE from 'three'

type ProjectLink = { label?: string; url?: string }
type PayloadProject = {
  slug: string
  title: string
  summary: string
  year?: number
  role?: string
  status?: 'live' | 'prototype' | 'archived'
  tags?: Array<{ label?: string }>
  links?: ProjectLink[]
  caseStudy?: unknown
}
type PayloadList<T> = { docs: T[] }
type NoteLayout = { x: number; y: number; rotation: number }
type ProjectDefinition = PayloadProject & {
  id: string
  github?: string
  repoLabel: string
  note: NoteLayout
}

const CMS_URL = import.meta.env.PUBLIC_CMS_URL
const MAP = { x: -3.35, y: 3.42, z: -5.79 } as const
const MAP_FACE_Z = MAP.z + 0.06
const PROJECT_LAYER_Z = MAP_FACE_Z + 0.075
const PROJECT_GROUP_NAME = 'operation-room-map-projects'

// Deliberately irregular rather than a tidy grid. These positions keep notes
// inside the framed map while making them feel like papers left on a working map.
const NOTE_LAYOUTS: NoteLayout[] = [
  { x: -5.96, y: 4.78, rotation: -0.072 },
  { x: -3.68, y: 2.14, rotation: 0.048 },
  { x: -1.18, y: 4.08, rotation: 0.031 },
  { x: -5.08, y: 3.16, rotation: -0.036 },
  { x: -2.14, y: 1.72, rotation: 0.061 },
  { x: -0.54, y: 2.62, rotation: -0.052 },
]

const getGithubLink = (project: PayloadProject) =>
  project.links?.find((link) => link.url?.includes('github.com'))?.url

const getRepoLabel = (github: string | undefined, slug: string) => {
  if (!github) return slug
  try {
    return new URL(github).pathname.replace(/^\//, '').replace(/\/$/, '') || slug
  } catch {
    return slug
  }
}

const loadFeaturedProjects = async (): Promise<ProjectDefinition[]> => {
  if (!CMS_URL) return []

  const url = new URL('/api/projects', CMS_URL)
  url.searchParams.set('where[featured][equals]', 'true')
  url.searchParams.set('where[_status][equals]', 'published')
  url.searchParams.set('sort', 'sortOrder')
  url.searchParams.set('limit', String(NOTE_LAYOUTS.length))
  url.searchParams.set('depth', '0')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Payload projects request failed: ${response.status}`)
  const data = (await response.json()) as PayloadList<PayloadProject>

  return data.docs.map((project, index) => {
    const github = getGithubLink(project)
    return {
      ...project,
      id: project.slug,
      github,
      repoLabel: getRepoLabel(github, project.slug),
      note: NOTE_LAYOUTS[index % NOTE_LAYOUTS.length],
    }
  })
}

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

const createNoteTexture = (project: ProjectDefinition) =>
  createTexture(768, 352, (context, canvas) => {
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
    const titleSize = project.title.length > 13 ? 38 : project.title.length > 10 ? 43 : 47
    context.font = `700 ${titleSize}px Georgia, serif`
    context.fillText(project.title, 42, 132)

    context.strokeStyle = 'rgba(66, 53, 35, .32)'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(42, 164)
    context.lineTo(canvas.width - 42, 164)
    context.stroke()

    context.fillStyle = '#544a38'
    context.font = '600 25px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    context.fillText(project.repoLabel, 42, 220)

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
  group.position.set(project.note.x, project.note.y, 0)
  group.rotation.z = project.note.rotation

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
  group.userData.mapProjects = new Map<string, ProjectDefinition>()

  const hitMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  })

  void loadFeaturedProjects()
    .then((projects) => {
      const projectMap = group.userData.mapProjects as Map<string, ProjectDefinition>
      projects.forEach((project) => {
        projectMap.set(project.id, project)
        group.add(createNote(project, hitMaterial))
      })
    })
    .catch((error) => console.warn('Unable to load featured projects from Payload.', error))

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

const appendLexical = (parent: HTMLElement, node: any) => {
  if (!node) return
  if (node.type === 'text') {
    let child: Node = document.createTextNode(node.text || '')
    const wrap = (tag: string) => {
      const element = document.createElement(tag)
      element.append(child)
      child = element
    }
    if (node.format & 16) wrap('code')
    if (node.format & 8) wrap('u')
    if (node.format & 4) wrap('s')
    if (node.format & 2) wrap('em')
    if (node.format & 1) wrap('strong')
    parent.append(child)
    return
  }
  if (node.type === 'linebreak') {
    parent.append(document.createElement('br'))
    return
  }

  const tags: Record<string, string> = {
    paragraph: 'p',
    quote: 'blockquote',
    heading: node.tag || 'h2',
    list: node.tag === 'ol' || node.listType === 'number' ? 'ol' : 'ul',
    listitem: 'li',
    link: 'a',
    autolink: 'a',
    code: 'pre',
  }
  const element = document.createElement(tags[node.type] || 'div')
  if ((node.type === 'link' || node.type === 'autolink') && typeof node.url === 'string') {
    if (/^(https?:|mailto:|\/)/.test(node.url)) {
      ;(element as HTMLAnchorElement).href = node.url
      if (/^https?:/.test(node.url)) {
        ;(element as HTMLAnchorElement).target = '_blank'
        ;(element as HTMLAnchorElement).rel = 'noreferrer'
      }
    }
  }
  if (node.type === 'code' && typeof node.code === 'string') element.textContent = node.code
  if (Array.isArray(node.children)) node.children.forEach((child: unknown) => appendLexical(element, child))
  parent.append(element)
}

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
    const hitboxes: THREE.Mesh[] = []
    projectRoot.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.mapProjectHit) hitboxes.push(object)
    })
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(hitboxes, false)[0]?.object
    return hit?.userData.mapProjectId as string | undefined
  }

  const renderCaseStudy = (project: ProjectDefinition) => {
    if (!readerBody) return
    readerBody.replaceChildren()
    const rootNode = (project.caseStudy as any)?.root ?? project.caseStudy
    if (Array.isArray(rootNode?.children)) {
      rootNode.children.forEach((node: unknown) => appendLexical(readerBody, node))
    } else {
      const paragraph = document.createElement('p')
      paragraph.textContent = project.summary
      readerBody.append(paragraph)
    }

    if (project.github) {
      const actions = document.createElement('p')
      const githubLink = document.createElement('a')
      githubLink.href = project.github
      githubLink.target = '_blank'
      githubLink.rel = 'noreferrer'
      githubLink.textContent = 'View project on GitHub ↗'
      actions.append(githubLink)
      readerBody.append(actions)
    }
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
    const metadata = [project.role, project.year ? String(project.year) : undefined, project.status, ...(project.tags?.map((tag) => tag.label).filter(Boolean) ?? [])]
    readerTags.textContent = metadata.filter(Boolean).join(' / ')
    readerExcerpt.textContent = project.summary
    if (readerDate) {
      readerDate.textContent = ''
      readerDate.removeAttribute('datetime')
      readerDate.hidden = true
    }
    if (readerStamp) readerStamp.textContent = 'CASE FILE / WORK'
    renderCaseStudy(project)

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
    const projects = projectRoot.userData.mapProjects as Map<string, ProjectDefinition>
    const project = projects.get(projectId)
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
