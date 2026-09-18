import { mountOperationRoom } from './operation-room'

/**
 * The homepage deliberately behaves like the original operations-room menu:
 * the room is 3D, but the observer/camera is fixed.
 *
 * The base scene currently gates its tiny pointer-camera parallax behind the
 * reduced-motion media query. During mount we provide a fixed result for that
 * one query, then immediately restore the browser API. The scene retains the
 * fixed result it captured at mount time while all other media queries remain
 * native.
 *
 * This adapter is intentionally isolated so the scene can be refactored later
 * without leaking camera-control concerns into the Astro component.
 */
export const mountFixedOperationRoom = (root: HTMLElement) => {
  const nativeMatchMedia = window.matchMedia.bind(window)
  const fixedCameraQuery = '(prefers-reduced-motion: reduce)'

  const fixedMediaQueryList: MediaQueryList = {
    matches: true,
    media: fixedCameraQuery,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }

  window.matchMedia = ((query: string) =>
    query === fixedCameraQuery ? fixedMediaQueryList : nativeMatchMedia(query)) as typeof window.matchMedia

  try {
    return mountOperationRoom(root)
  } finally {
    window.matchMedia = nativeMatchMedia
  }
}
