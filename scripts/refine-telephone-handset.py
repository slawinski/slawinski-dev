from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

old_cradle = '''  // One compact yoke carries both handset-end forks.\n  addCradleRod([-0.355, yokeY, cradleZ], [0.355, yokeY, cradleZ], 0.032)\n\n  // Two U-shaped/fork-shaped supports. The paired prongs straddle the handset\n  // depth around z = -0.06 and rise just into the receiver silhouette so the\n  // handset reads as physically seated in the cradle rather than floating.\n  for (const side of [-1, 1] as const) {\n    const forkX = side * 0.355\n    addCradleRod([forkX, yokeY, cradleZ], [forkX, forkBaseY, cradleZ], 0.028)\n    addCradleRod([forkX, forkBaseY, cradleZ], [forkX, forkTopY, cradleZ - 0.075], 0.022)\n    addCradleRod([forkX, forkBaseY, cradleZ], [forkX, forkTopY, cradleZ + 0.075], 0.022)\n  }\n'''

new_cradle = '''  // Keep the transverse yoke deliberately short. The two fork stems angle\n  // outward from it so the cradle still reaches the handset ends without a\n  // long bar visually competing with the receiver silhouette.\n  const yokeHalfWidth = 0.245\n  const forkX = 0.355\n  addCradleRod([-yokeHalfWidth, yokeY, cradleZ], [yokeHalfWidth, yokeY, cradleZ], 0.032)\n\n  // Two U-shaped/fork-shaped supports. Each stem rises outward from the short\n  // central yoke, then splits into paired prongs that cup the receiver end.\n  for (const side of [-1, 1] as const) {\n    const yokeX = side * yokeHalfWidth\n    const receiverX = side * forkX\n    addCradleRod([yokeX, yokeY, cradleZ], [receiverX, forkBaseY, cradleZ], 0.028)\n    addCradleRod([receiverX, forkBaseY, cradleZ], [receiverX, forkTopY, cradleZ - 0.075], 0.022)\n    addCradleRod([receiverX, forkBaseY, cradleZ], [receiverX, forkTopY, cradleZ + 0.075], 0.022)\n  }\n'''

old_ends = '''  const addReceiverEnd = (side: -1 | 1, outerRadius: number, faceRadius: number) => {\n    const neck = finish(new THREE.Mesh(new THREE.CylinderGeometry(0.090, 0.075, 0.14, 8), bakeliteHandset))\n    neck.rotation.z = Math.PI / 2\n    neck.position.set(side * 0.445, 0.535, -0.060)\n    group.add(neck)\n\n    const bell = finish(new THREE.Mesh(new THREE.CylinderGeometry(outerRadius * 0.82, outerRadius, 0.135, 8), bakelite))\n    bell.rotation.z = Math.PI / 2\n    bell.position.set(side * 0.515, 0.525, -0.055)\n    group.add(bell)\n\n    const face = finish(new THREE.Mesh(new THREE.CylinderGeometry(faceRadius, faceRadius, 0.018, 8), dark))\n    face.rotation.z = Math.PI / 2\n    face.position.set(side * 0.584, 0.525, -0.055)\n    group.add(face)\n  }\n'''

new_ends = '''  const addReceiverEnd = (side: -1 | 1, outerRadius: number, faceRadius: number) => {\n    // The receiver and transmitter cups point downward toward ear and mouth,\n    // like a real handset held to the face. Their cylinder axes therefore stay\n    // vertical instead of pointing sideways along the handset.\n    const endX = side * 0.425\n\n    const neck = finish(new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.090, 0.105, 8), bakeliteHandset))\n    neck.position.set(endX, 0.535, -0.060)\n    group.add(neck)\n\n    const bell = finish(new THREE.Mesh(new THREE.CylinderGeometry(outerRadius * 0.76, outerRadius, 0.105, 8), bakelite))\n    bell.position.set(endX, 0.468, -0.055)\n    group.add(bell)\n\n    const face = finish(new THREE.Mesh(new THREE.CylinderGeometry(faceRadius, faceRadius, 0.018, 8), dark))\n    face.position.set(endX, 0.407, -0.055)\n    group.add(face)\n  }\n'''

if text.count(old_cradle) != 1:
    raise SystemExit('expected cradle block not found exactly once')
if text.count(old_ends) != 1:
    raise SystemExit('expected handset-end block not found exactly once')

text = text.replace(old_cradle, new_cradle)
text = text.replace(old_ends, new_ends)
path.write_text(text)
