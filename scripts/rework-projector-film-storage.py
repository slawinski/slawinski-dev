from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

start = text.index("const createFilmReelStorage = (scene: THREE.Scene) => {\n")
end = text.index("const createProjectionScreen = (scene: THREE.Scene) => {\n", start)

replacement = r'''const createFilmReelStorage = (scene: THREE.Scene) => {
  // Projector-film props live on the green felt to the LEFT of the projector,
  // not on the raised brown centre box. The arrangement follows the reference:
  // a low wooden shelf with loose reels on top and an open wooden crate holding
  // additional reels beside it.
  const group = new THREE.Group()
  group.position.set(-1.86, 1.295, 3.72)
  group.rotation.y = -0.06

  const shelfWood = makeMaterial(0x65411f, 0.88); shelfWood.flatShading = true
  const shelfEdge = makeMaterial(0x432915, 0.92); shelfEdge.flatShading = true
  const crateWood = makeMaterial(0x74502a, 0.90); crateWood.flatShading = true
  const crateDark = makeMaterial(0x4b3019, 0.94); crateDark.flatShading = true
  const reelMetal = makeMaterial(0x838a87, 0.72); reelMetal.flatShading = true
  const reelLight = makeMaterial(0xa1a6a0, 0.68); reelLight.flatShading = true
  const reelDark = makeMaterial(0x555d5b, 0.82); reelDark.flatShading = true

  const addLooseReel = (
    radius: number,
    position: [number, number, number],
    rotation: [number, number, number] = [-Math.PI / 2, 0, 0],
    material: THREE.Material = reelMetal,
  ) => {
    const reel = new THREE.Group()
    reel.position.set(...position)
    reel.rotation.set(...rotation)

    const outer = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.025, 5, 18), material)
    outer.castShadow = true; outer.receiveShadow = true; reel.add(outer)
    const inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, 0.014, 5, 16), reelDark)
    inner.castShadow = true; reel.add(inner)

    for (let i = 0; i < 5; i += 1) {
      const angle = i * Math.PI * 2 / 5 + Math.PI / 10
      const length = radius * 0.67
      const centre = radius * 0.43
      reel.add(box(
        [length, 0.045, 0.030],
        [Math.cos(angle) * centre, Math.sin(angle) * centre, 0],
        material,
        [0, 0, angle],
      ))
    }
    reel.add(cylinder(radius * 0.14, 0.075, [0, 0, 0], reelDark, 9, [Math.PI / 2, 0, 0]))
    reel.add(cylinder(radius * 0.055, 0.090, [0, 0, 0.012], reelLight, 8, [Math.PI / 2, 0, 0]))
    return reel
  }

  // Low shelf/platform on the felt. It is deliberately squat so the reels stay
  // visible from the room camera and do not compete with the projector silhouette.
  const shelf = new THREE.Group()
  shelf.position.set(0.26, 0, 0.10)
  shelf.add(box([1.34, 0.10, 0.76], [0, 0.20, 0], shelfWood))
  shelf.add(box([1.42, 0.055, 0.82], [0, 0.275, 0], shelfEdge))
  for (const x of [-0.57, 0.57]) {
    for (const z of [-0.27, 0.27]) shelf.add(box([0.095, 0.20, 0.095], [x, 0.10, z], shelfEdge))
  }

  // Three loose reels lying on the shelf: a small stack plus one larger reel,
  // matching the cluttered film-handling setup in the reference image.
  shelf.add(addLooseReel(0.245, [-0.30, 0.33, 0.02], [-Math.PI / 2, 0.02, -0.12], reelMetal))
  shelf.add(addLooseReel(0.245, [-0.28, 0.385, 0.00], [-Math.PI / 2, -0.02, 0.04], reelLight))
  shelf.add(addLooseReel(0.32, [0.34, 0.34, -0.01], [-Math.PI / 2, 0.03, 0.12], reelDark))
  group.add(shelf)

  // Open 'apple-box' style wooden crate next to the shelf. Slatted sides and an
  // open top make it read as a storage box instead of another solid desk block.
  const crate = new THREE.Group()
  crate.position.set(-0.68, 0, -0.66)
  crate.rotation.y = 0.10
  const crateWidth = 0.92
  const crateDepth = 0.70
  const crateHeight = 0.54
  crate.add(box([crateWidth, 0.065, crateDepth], [0, 0.035, 0], crateDark))
  for (const x of [-crateWidth / 2 + 0.045, crateWidth / 2 - 0.045]) {
    crate.add(box([0.09, crateHeight, crateDepth], [x, crateHeight / 2, 0], crateWood))
  }
  // Back and front are slatted rather than solid, leaving glimpses of the reels.
  for (const y of [0.12, 0.29, 0.46]) {
    crate.add(box([crateWidth - 0.12, 0.085, 0.075], [0, y, -crateDepth / 2 + 0.035], crateWood))
    crate.add(box([crateWidth - 0.12, 0.085, 0.075], [0, y, crateDepth / 2 - 0.035], crateWood))
  }
  crate.add(box([crateWidth + 0.04, 0.07, 0.08], [0, crateHeight + 0.01, -crateDepth / 2 + 0.03], crateDark))
  crate.add(box([crateWidth + 0.04, 0.07, 0.08], [0, crateHeight + 0.01, crateDepth / 2 - 0.03], crateDark))

  // More reels sit inside the crate at slightly different angles, as if they
  // were dropped in rather than carefully displayed.
  crate.add(addLooseReel(0.24, [-0.19, 0.31, 0.00], [-0.35, 0.16, 0.92], reelMetal))
  crate.add(addLooseReel(0.22, [0.16, 0.30, -0.06], [-0.28, -0.20, 1.08], reelLight))
  crate.add(addLooseReel(0.20, [0.02, 0.22, 0.17], [-0.52, 0.08, 0.74], reelDark))
  group.add(crate)

  scene.add(group)
}

'''

text = text[:start] + replacement + text[end:]

checks = {
    'storage on left green felt': 'group.position.set(-1.86, 1.295, 3.72)',
    'shelf reels': 'Three loose reels lying on the shelf',
    'open crate': "Open 'apple-box' style wooden crate",
    'projector still present': 'const createProjector = (scene: THREE.Scene) => {',
    'camera transition untouched marker': 'let focusRoute: NonNullable<typeof cameraTransition> | null = null',
    'map grid': 'context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()',
}
for label, needle in checks.items():
    if needle not in text:
        raise SystemExit(f'{label} check failed')

path.write_text(text)
