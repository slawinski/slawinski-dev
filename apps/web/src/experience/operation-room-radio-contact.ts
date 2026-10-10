import * as THREE from 'three'
import { InteractionManager } from 'three/addons/interaction/InteractionManager.js'
import { installHtmlInCanvasPolyfill, uninstallHtmlInCanvasPolyfill } from 'three-html-render/polyfill'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export type RadioContactDeps = {
  canvas: HTMLCanvasElement
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  renderer: THREE.WebGLRenderer
  radioGroup: THREE.Group
  isRadioSettled: () => boolean
}

export type RadioContactPanel = {
  readonly supported: boolean
  setActive: (active: boolean) => void
  update: () => void
  dispose: () => void
}

// The contact placard is bolted to the radio bench: PlaneGeometry(1.5, 0.9)
// (5:3 aspect, matched by CSS 560x336px) at radioGroup-local (0, 0.55, 0.45)
// -> world (-5.9, 1.81, -1.83), facing +Z with no rotation. depthTest stays
// on so the set occludes the panel.
const PANEL_WIDTH = 1.5
const PANEL_HEIGHT = 0.9
const PANEL_POSITION: [number, number, number] = [0, 0.55, 0.45]

const supportsHtmlInCanvas = (renderer: THREE.WebGLRenderer) => {
  // Check the entry points after installing the compatibility polyfill.
  // Missing support leaves the existing /contact link as the fallback.
  if (!('requestPaint' in HTMLCanvasElement.prototype)) return false
  const gl = renderer.getContext() as (WebGLRenderingContext & { texElementImage2D?: unknown }) | null
  return typeof gl?.texElementImage2D === 'function'
}

// three-html-render's install is idempotent, but track it locally so dispose
// can cleanly restore the patched prototypes via uninstall.
let polyfillInstalled = false

const ensureHtmlInCanvas = () => {
  if (polyfillInstalled) return
  // Mark ownership before installing so a partial installation can be undone.
  polyfillInstalled = true
  // Compatibility workaround: Chrome 154's native first-paint path throws
  // "No cached paint record" (or uploads black after prepainting). Bypass it
  // even when requestPaint exists; this does not fix the native implementation.
  installHtmlInCanvasPolyfill({ force: true })
}

// Root cause: three 0.186 WebGLTextures (WebGLTextures.js ~L1298) branches on
// `_gl.texElementImage2D.length === 3` — length 3 means the native Chrome 150+
// 3-arg form `texElementImage2D(target, internalformat, element)`, anything
// else means the Chrome 138-149 6-arg form
// `texElementImage2D(target, level, internalformat, format, type, element)`.
// three-html-render@0.1.2 declares its polyfill as
// `function V(target, level, internalformat, ...rest)` (polyfill.mjs ~L539),
// so `.length === 3`, yet it only accepts 6/8/10/12 total args
// (`rest.length` 3/5/7/9) and throws
// `TypeError: texElementImage2D: unexpected argument count 3` for the 3-arg
// call three therefore issues. Bridge the polyfilled entry point on the
// renderer's own gl instance (not the prototype): advertise `.length === 6`
// so three takes the 6-arg path the polyfill implements, and translate any
// 3-arg call into the equivalent 6-arg upload for safety.
const bridgePolyfillTexElementArity = (renderer: THREE.WebGLRenderer): (() => void) => {
  const noop = () => undefined
  // Only bridge the polyfill we installed; a native implementation already
  // speaks whichever arity its `.length` advertises.
  if (!polyfillInstalled) return noop
  const gl = renderer.getContext() as (WebGL2RenderingContext & Record<string, unknown>) | null
  if (!gl || typeof gl.texElementImage2D !== 'function') return noop
  // Idempotent per gl instance: the bridge lives as an own property, while
  // both native and polyfilled entry points live on the prototype.
  if (Object.prototype.hasOwnProperty.call(gl, 'texElementImage2D')) return noop
  const original = gl.texElementImage2D as unknown as (...args: unknown[]) => unknown
  function bridgedTexElementImage2D(
    this: WebGL2RenderingContext,
    target: number,
    level: number,
    internalFormat: number,
    format?: number,
    type?: number,
    element?: unknown,
  ): void {
    void level
    void format
    void type
    void element
    if (arguments.length === 3) {
      const glContext = this as WebGL2RenderingContext
      const elementArg = internalFormat as unknown
      original.call(glContext, target, 0, glContext.RGBA, glContext.RGBA, glContext.UNSIGNED_BYTE, elementArg)
      return
    }
    original.apply(this, arguments as unknown as unknown[])
  }
  Object.defineProperty(gl, 'texElementImage2D', {
    configurable: true,
    writable: true,
    value: bridgedTexElementImage2D,
  })
  let cleaned = false
  return () => {
    if (cleaned) return
    cleaned = true
    if ((gl as Record<string, unknown>).texElementImage2D === bridgedTexElementImage2D) {
      delete (gl as Record<string, unknown>).texElementImage2D
    }
  }
}

export const createRadioContactPanel = (deps: RadioContactDeps, panel: HTMLElement): RadioContactPanel => {
  const { canvas, camera, controls, renderer, radioGroup } = deps
  if (!canvas.hasAttribute('layoutsubtree')) canvas.setAttribute('layoutsubtree', 'true')

  const ownsPolyfill = !polyfillInstalled
  const panelPointerEvents = panel.style.getPropertyValue('pointer-events')
  const panelPointerPriority = panel.style.getPropertyPriority('pointer-events')
  let restoreHostPointerEvents: () => void = () => undefined
  let unbridgeTexElement: () => void = () => undefined
  const releaseCompatibility = () => {
    try {
      restoreHostPointerEvents()
      unbridgeTexElement()
      if (ownsPolyfill && polyfillInstalled) {
        polyfillInstalled = false
        uninstallHtmlInCanvasPolyfill()
      }
    } finally {
      // Uninstall removes the panel's inline pointer-events, so restore last.
      panel.style.setProperty('pointer-events', panelPointerEvents, panelPointerPriority)
    }
  }
  const unsupported = (): RadioContactPanel => {
    releaseCompatibility()
    return { supported: false, setActive: () => undefined, update: () => undefined, dispose: () => undefined }
  }

  // Keep THREE.HTMLTexture + InteractionManager, using SVG foreignObject
  // rasterization and the polyfill's DOM hit-testing overlay in all browsers.
  // No additional OrbitControls prototype patch is involved.
  try {
    ensureHtmlInCanvas()
    if (!supportsHtmlInCanvas(renderer)) return unsupported()
    // Must run before the first HTMLTexture upload so WebGLTextures observes
    // the bridged `.length`. Only the renderer's own GL instance is bridged.
    unbridgeTexElement = bridgePolyfillTexElementArity(renderer)
    // requestPaint synchronously creates the host even before DOMContentLoaded.
    ;(canvas as HTMLCanvasElement & { requestPaint: () => void }).requestPaint()
    // closest uses physical ancestry despite the polyfill's parentNode getter.
    const host = panel.closest<HTMLElement>('[data-html-in-canvas-host]')
    if (!host) return unsupported()
    const hostPointerEvents = host.style.getPropertyValue('pointer-events')
    const hostPointerPriority = host.style.getPropertyPriority('pointer-events')
    restoreHostPointerEvents = () => {
      host.style.setProperty('pointer-events', hostPointerEvents, hostPointerPriority)
    }
    // Empty overlay space must hit the canvas; only the form intercepts input.
    host.style.pointerEvents = 'none'
    panel.style.pointerEvents = 'auto'
  } catch {
    return unsupported()
  }

  const form = panel.querySelector<HTMLFormElement>('form')
  const status = panel.querySelector<HTMLElement>('[data-radio-contact-status]')
  const emailInput = form?.querySelector<HTMLInputElement>('input[name="email"]') ?? null
  const messageInput = form?.querySelector<HTMLTextAreaElement>('textarea[name="message"]') ?? null

  // v1 hands off to the visitor's mail client instead of running an email
  // backend (docs/rewrite/02_INFORMATION_ARCHITECTURE.md). The sender's
  // address rides along in the subject and the body so it can be replied to.
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    if (!form || !status || form.dataset.busy === 'true') return
    const email = emailInput?.value.trim() ?? ''
    const message = messageInput?.value ?? ''
    if (!email || !message.trim()) return
    const contactEmail = import.meta.env.PUBLIC_CONTACT_EMAIL
    if (!contactEmail) {
      status.textContent = 'NO TRANSMIT ADDRESS'
      return
    }
    form.dataset.busy = 'true'
    status.textContent = 'OPENING MAIL CLIENT…'
    const query = new URLSearchParams({
      subject: `Radio transmission from ${email}`,
      body: `${message}\n\n— reply to ${email}`,
    })
    // If nothing handles mailto: (no configured client), clear busy on the
    // next tick so the form can be used again; otherwise the page unloads.
    window.location.href = `mailto:${contactEmail}?${query}`
    window.setTimeout(() => { delete form.dataset.busy }, 0)
  }

  // The form lives inside the canvas element. Stop form pointer events at the
  // panel (bubble phase) so they never reach canvas/OrbitControls listeners,
  // without using a canvas capture-phase stopPropagation that would block
  // descent to the inputs and make them unclickable.
  const onPanelPointer = (event: Event) => { event.stopPropagation() }
  const onFocusIn = () => { controls.enabled = false }
  const onKeyDown = (event: KeyboardEvent) => {
    // Never let room shortcuts (arrows, WASD, +/-) steal form keystrokes.
    event.stopPropagation()
    if (event.key === 'Escape') canvas.focus({ preventScroll: true })
  }

  // material.map = HTMLTexture: needsUpdate on construct, then repaints on
  // the parent canvas paint events.
  const texture = new THREE.HTMLTexture(panel)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  const panelMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.95,
    metalness: 0,
    depthTest: true,
    depthWrite: true,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT), panelMaterial)
  mesh.position.set(...PANEL_POSITION)
  mesh.visible = false
  radioGroup.add(mesh)

  // Transform sync is Viewport * MVP * pixelToLocal, applied as a CSS
  // matrix3d on the panel every frame by InteractionManager.
  const interactions = new InteractionManager()
  interactions.connect(renderer, camera)
  interactions.add(mesh)

  let active = false
  const setActive = (next: boolean) => {
    if (next === active) return
    active = next
    panel.toggleAttribute('inert', !next)
    panel.style.visibility = next ? 'visible' : 'hidden'
    mesh.visible = next
    if (!next && panel.contains(document.activeElement)) {
      canvas.focus({ preventScroll: true })
    }
  }

  const update = () => {
    if (active) interactions.update()
  }

  panel.addEventListener('pointerdown', onPanelPointer)
  panel.addEventListener('pointerup', onPanelPointer)
  panel.addEventListener('pointermove', onPanelPointer)
  panel.addEventListener('focusin', onFocusIn)
  panel.addEventListener('keydown', onKeyDown)
  form?.addEventListener('submit', onSubmit)

  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    setActive(false)
    panel.removeEventListener('pointerdown', onPanelPointer)
    panel.removeEventListener('pointerup', onPanelPointer)
    panel.removeEventListener('pointermove', onPanelPointer)
    panel.removeEventListener('focusin', onFocusIn)
    panel.removeEventListener('keydown', onKeyDown)
    form?.removeEventListener('submit', onSubmit)
    interactions.remove(mesh)
    interactions.disconnect()
    radioGroup.remove(mesh)
    mesh.geometry.dispose()
    panelMaterial.dispose()
    texture.dispose()
    releaseCompatibility()
    // Leave the DOM panel as if the radio view was never entered.
    panel.toggleAttribute('inert', true)
    panel.style.visibility = 'hidden'
    panel.style.transform = ''
    if (status) status.textContent = ''
    if (form) delete form.dataset.busy
  }

  return { supported: true, setActive, update, dispose }
}
