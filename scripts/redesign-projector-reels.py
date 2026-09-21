from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

camera_start = text.index('  const getTraysViewPosition = () => {\n')
camera_end = text.index('  const setProjectorActive = (active: boolean) => {\n')
camera_before = text[camera_start:camera_end]

map_grid = """    for (let y = 0; y < canvas.height; y += 54) {\n      context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()\n    }\n"""
assert map_grid in text

marker = "const createProjector = (scene: THREE.Scene) => {\n"
assert marker in text
helper = """const createOpenFilmReel = (radius: number, metal: THREE.Material, dark: THREE.Material) => {\n  // Shared low-poly open reel used both on the projector and as loose reels on\n  // the table. Proportions are derived from the loose table reels so scaling\n  // the radius preserves the same stamped-metal construction instead of\n  // switching to a separate projector-only model.\n  const reel = new THREE.Group()\n  const rimTube = radius * 0.094\n  const innerTube = radius * 0.060\n  const spokeThickness = radius * 0.170\n  const spokeDepth = radius * 0.100\n\n  const outer = new THREE.Mesh(new THREE.TorusGeometry(radius, rimTube, 5, 18), metal)\n  outer.castShadow = true\n  outer.receiveShadow = true\n  reel.add(outer)\n\n  const inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.38, innerTube, 5, 14), dark)\n  inner.castShadow = true\n  reel.add(inner)\n\n  for (let i = 0; i < 5; i += 1) {\n    const angle = i * Math.PI * 2 / 5 + Math.PI / 10\n    const spokeLength = radius * 0.58\n    const spokeCentre = radius * 0.55\n    reel.add(box(\n      [spokeLength, spokeThickness, spokeDepth],\n      [Math.cos(angle) * spokeCentre, Math.sin(angle) * spokeCentre, 0],\n      metal,\n      [0, 0, angle],\n    ))\n  }\n\n  reel.add(cylinder(radius * 0.15, radius * 0.234, [0, 0, 0], dark, 9, [Math.PI / 2, 0, 0]))\n  return reel\n}\n\n"""
text = text.replace(marker, helper + marker, 1)

old_materials = """  const enamel = makeMaterial(0xb8b5a8, 0.74); enamel.flatShading = true\n  const enamelDark = makeMaterial(0x747975, 0.78); enamelDark.flatShading = true\n  const reelMetal = makeMaterial(0xc4c0b1, 0.66); reelMetal.flatShading = true\n  const rubber = makeMaterial(0x262928, 0.94)\n"""
new_materials = """  const enamel = makeMaterial(0xb8b5a8, 0.74); enamel.flatShading = true\n  const enamelDark = makeMaterial(0x747975, 0.78); enamelDark.flatShading = true\n  // Use the same metal palette as the newly modelled uncased table reels.\n  const openReelMetal = makeMaterial(0x8d948f, 0.68); openReelMetal.flatShading = true\n  const openReelDark = makeMaterial(0x444b48, 0.80); openReelDark.flatShading = true\n  const rubber = makeMaterial(0x262928, 0.94)\n"""
assert old_materials in text
text = text.replace(old_materials, new_materials, 1)

old_reels = """  const reels: THREE.Group[] = []\n  const addReel = (x: number, y: number, radius: number, rotation = 0) => {\n    const reel = new THREE.Group(); reel.position.set(x, y, 0.44); reel.rotation.z = rotation\n\n    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.034, 6, 20), reelMetal)\n    outerRim.castShadow = true; outerRim.receiveShadow = true; reel.add(outerRim)\n    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, 0.018, 5, 18), enamelDark)\n    innerRim.castShadow = true; reel.add(innerRim)\n\n    // Five broad spokes are much closer to the stamped aluminium reels in the\n    // reference than the old solid discs, while still staying low-poly.\n    for (let i = 0; i < 5; i += 1) {\n      const angle = i * Math.PI * 2 / 5 + Math.PI / 10\n      const length = radius * 0.68\n      const center = radius * 0.45\n      reel.add(box(\n        [length, 0.060, 0.035],\n        [Math.cos(angle) * center, Math.sin(angle) * center, 0],\n        reelMetal,\n        [0, 0, angle],\n      ))\n    }\n    reel.add(cylinder(radius * 0.15, 0.12, [0, 0, 0], enamelDark, 10, [Math.PI / 2, 0, 0]))\n    reel.add(cylinder(radius * 0.06, 0.15, [0, 0, 0.015], rubber, 8, [Math.PI / 2, 0, 0]))\n    reels.push(reel)\n    group.add(reel)\n  }\n\n  addReel(0.15, 1.18, 0.48, 0.08)\n  addReel(0.15, 0.35, 0.39, -0.16)\n"""
new_reels = """  // The projector now mounts the exact same open-reel model used for the two\n  // uncased reels lying beside the storage box. Only radius and mounting angle\n  // differ; there is no second projector-specific reel design.\n  const reels: THREE.Group[] = []\n  const addReel = (x: number, y: number, radius: number, rotation = 0) => {\n    const reel = createOpenFilmReel(radius, openReelMetal, openReelDark)\n    reel.position.set(x, y, 0.44)\n    reel.rotation.z = rotation\n    reels.push(reel)\n    group.add(reel)\n\n    // Short spindle and retaining cap make the shared reel look mechanically\n    // mounted rather than pasted onto the side of the projector.\n    group.add(cylinder(radius * 0.065, 0.16, [x, y, 0.375], openReelDark, 8, [Math.PI / 2, 0, 0]))\n    group.add(cylinder(radius * 0.035, 0.035, [x, y, 0.515], materials.metalDark, 8, [Math.PI / 2, 0, 0]))\n  }\n\n  addReel(0.15, 1.18, 0.48, 0.08)\n  addReel(0.15, 0.35, 0.39, -0.16)\n"""
assert old_reels in text
text = text.replace(old_reels, new_reels, 1)

old_loose = """  const looseReelMetal = makeMaterial(0x8d948f, 0.68); looseReelMetal.flatShading = true\n  const looseReelDark = makeMaterial(0x444b48, 0.80); looseReelDark.flatShading = true\n\n  const addLooseTableReel = (\n    radius: number,\n    position: [number, number, number],\n    rotation: [number, number, number],\n  ) => {\n    const reel = new THREE.Group()\n    reel.position.set(...position)\n    reel.rotation.set(...rotation)\n\n    const outer = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.022, 5, 18), looseReelMetal)\n    outer.castShadow = true\n    outer.receiveShadow = true\n    reel.add(outer)\n\n    const inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.38, 0.014, 5, 14), looseReelDark)\n    inner.castShadow = true\n    reel.add(inner)\n\n    for (let i = 0; i < 5; i += 1) {\n      const angle = i * Math.PI * 2 / 5 + Math.PI / 10\n      const spokeLength = radius * 0.58\n      const spokeCentre = radius * 0.55\n      reel.add(box(\n        [spokeLength, 0.040, 0.024],\n        [Math.cos(angle) * spokeCentre, Math.sin(angle) * spokeCentre, 0],\n        looseReelMetal,\n        [0, 0, angle],\n      ))\n    }\n\n    reel.add(cylinder(radius * 0.15, 0.055, [0, 0, 0], looseReelDark, 9, [Math.PI / 2, 0, 0]))\n    group.add(reel)\n  }\n"""
new_loose = """  const looseReelMetal = makeMaterial(0x8d948f, 0.68); looseReelMetal.flatShading = true\n  const looseReelDark = makeMaterial(0x444b48, 0.80); looseReelDark.flatShading = true\n\n  const addLooseTableReel = (\n    radius: number,\n    position: [number, number, number],\n    rotation: [number, number, number],\n  ) => {\n    const reel = createOpenFilmReel(radius, looseReelMetal, looseReelDark)\n    reel.position.set(...position)\n    reel.rotation.set(...rotation)\n    group.add(reel)\n  }\n"""
assert old_loose in text
text = text.replace(old_loose, new_loose, 1)

camera_start = text.index('  const getTraysViewPosition = () => {\n')
camera_end = text.index('  const setProjectorActive = (active: boolean) => {\n')
assert text[camera_start:camera_end] == camera_before, 'camera/zoom block changed'
assert map_grid in text, 'map grid changed'
assert text.count('const createOpenFilmReel =') == 1
assert 'createOpenFilmReel(radius, openReelMetal, openReelDark)' in text
assert 'createOpenFilmReel(radius, looseReelMetal, looseReelDark)' in text
assert 'const outerRim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.034' not in text

path.write_text(text)
