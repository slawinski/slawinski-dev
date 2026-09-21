from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

old_count = """  const canCount = 5
  const stackStartZ = -0.28
  const stackStepZ = 0.14
  const floorTop = 0.055
  const leanAngles = [-0.12, -0.145, -0.17, -0.19, -0.205]
"""
new_count = """  // Three cased reels remain in the box; two matching reels are stored loose
  // on the table beside it, so the total reel count stays unchanged.
  const canCount = 3
  const stackStartZ = -0.28
  const stackStepZ = 0.14
  const floorTop = 0.055
  const leanAngles = [-0.12, -0.155, -0.19]
"""
if text.count(old_count) != 1:
    raise SystemExit('Expected film-can count block not found exactly once')
text = text.replace(old_count, new_count, 1)

old_tail = """    can.rotation.x = lean
    group.add(can)
  }

  scene.add(group)
}
"""
new_tail = """    can.rotation.x = lean
    group.add(can)
  }

  // The two cans removed from the box reappear as uncased metal reels on the
  // felt immediately beside it. Their spoke geometry makes the distinction
  // from the closed film cans obvious at room-camera distance.
  const looseReelMetal = makeMaterial(0x8d948f, 0.68); looseReelMetal.flatShading = true
  const looseReelDark = makeMaterial(0x444b48, 0.80); looseReelDark.flatShading = true

  const addLooseTableReel = (
    radius: number,
    position: [number, number, number],
    rotation: [number, number, number],
  ) => {
    const reel = new THREE.Group()
    reel.position.set(...position)
    reel.rotation.set(...rotation)

    const outer = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.022, 5, 18), looseReelMetal)
    outer.castShadow = true
    outer.receiveShadow = true
    reel.add(outer)

    const inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.38, 0.014, 5, 14), looseReelDark)
    inner.castShadow = true
    reel.add(inner)

    for (let i = 0; i < 5; i += 1) {
      const angle = i * Math.PI * 2 / 5 + Math.PI / 10
      const spokeLength = radius * 0.58
      const spokeCentre = radius * 0.55
      reel.add(box(
        [spokeLength, 0.040, 0.024],
        [Math.cos(angle) * spokeCentre, Math.sin(angle) * spokeCentre, 0],
        looseReelMetal,
        [0, 0, angle],
      ))
    }

    reel.add(cylinder(radius * 0.15, 0.055, [0, 0, 0], looseReelDark, 9, [Math.PI / 2, 0, 0]))
    group.add(reel)
  }

  // Local -X is the clear patch of felt beside the box (world x about -2.2),
  // safely away from the raised centre support. Both reels lie nearly flat,
  // with slight opposing rotations so they look handled rather than staged.
  addLooseTableReel(0.235, [-0.64, 0.070, -0.18], [Math.PI / 2 - 0.055, 0.08, -0.10])
  addLooseTableReel(0.205, [-0.61, 0.075, 0.27], [Math.PI / 2 + 0.040, -0.10, 0.13])

  scene.add(group)
}
"""
if text.count(old_tail) != 1:
    raise SystemExit('Expected film-storage tail not found exactly once')
text = text.replace(old_tail, new_tail, 1)
path.write_text(text)
