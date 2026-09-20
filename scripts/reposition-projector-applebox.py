from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

start = text.index('const createFilmReelStorage = (scene: THREE.Scene) => {\n')
end = text.index('const createProjectionScreen = (scene: THREE.Scene) => {\n', start)

replacement = r'''const createFilmReelStorage = (scene: THREE.Scene) => {
  // Open film-reel apple box on the green felt immediately beside the raised
  // brown projector support. Its long side runs along the support and the box
  // physically touches the support edge at x = -1.20 without overlapping it.
  const group = new THREE.Group()

  const crateWood = makeMaterial(0x74502a, 0.90); crateWood.flatShading = true
  const crateDark = makeMaterial(0x4b3019, 0.94); crateDark.flatShading = true
  const reelMetal = makeMaterial(0x838a87, 0.72); reelMetal.flatShading = true
  const reelLight = makeMaterial(0xa1a6a0, 0.68); reelLight.flatShading = true
  const reelDark = makeMaterial(0x555d5b, 0.82); reelDark.flatShading = true

  const addLooseReel = (
    radius: number,
    position: [number, number, number],
    rotation: [number, number, number],
    material: THREE.Material,
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

  // The raised centre support is 1.2 m wide and centred at x = -0.6, so its
  // left edge is x = -1.20. The crate is 0.70 m wide across X and 1.08 m long
  // along Z; centring it at x = -1.55 places its right long side exactly on
  // that support edge. Y sits on top of the green felt surface.
  const crateWidth = 0.70
  const crateDepth = 1.08
  const crateHeight = 0.56
  group.position.set(-1.55, 1.295, 3.90)

  group.add(box([crateWidth, 0.065, crateDepth], [0, 0.035, 0], crateDark))

  // Short end walls at front/back.
  for (const z of [-crateDepth / 2 + 0.045, crateDepth / 2 - 0.045]) {
    group.add(box([crateWidth, crateHeight, 0.09], [0, crateHeight / 2, z], crateWood))
  }

  // Long sides are slatted so the reels remain visible. These are the faces
  // parallel to the brown support; the +X side is flush against it.
  for (const y of [0.12, 0.29, 0.46]) {
    group.add(box([0.075, 0.085, crateDepth - 0.12], [-crateWidth / 2 + 0.035, y, 0], crateWood))
    group.add(box([0.075, 0.085, crateDepth - 0.12], [crateWidth / 2 - 0.035, y, 0], crateWood))
  }
  group.add(box([0.08, 0.07, crateDepth + 0.04], [-crateWidth / 2 + 0.03, crateHeight + 0.01, 0], crateDark))
  group.add(box([0.08, 0.07, crateDepth + 0.04], [crateWidth / 2 - 0.03, crateHeight + 0.01, 0], crateDark))

  // Several reels sit inside the open box at varied angles. No separate shelf
  // or loose shelf reels remain in the scene.
  group.add(addLooseReel(0.22, [-0.12, 0.31, -0.25], [-0.42, 0.10, 0.82], reelMetal))
  group.add(addLooseReel(0.21, [0.10, 0.32, 0.04], [-0.30, -0.18, 1.04], reelLight))
  group.add(addLooseReel(0.19, [-0.03, 0.23, 0.27], [-0.55, 0.06, 0.70], reelDark))
  group.add(addLooseReel(0.18, [0.08, 0.20, -0.38], [-0.48, -0.12, 0.92], reelMetal))

  scene.add(group)
}

'''

text = text[:start] + replacement + text[end:]

checks = {
    'applebox touches support': "group.position.set(-1.55, 1.295, 3.90)",
    'long dimension': 'const crateDepth = 1.08',
    'shelf removed': 'const shelf = new THREE.Group()',
    'camera reverse preserved': 'reverse: true',
    'map grid preserved': 'context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()',
}
for label, needle in checks.items():
    if label == 'shelf removed':
        if needle in replacement:
            raise SystemExit('old shelf still present in film storage')
    elif needle not in text:
        raise SystemExit(f'{label} check failed')

path.write_text(text)
