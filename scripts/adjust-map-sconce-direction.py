from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

old_constants = """// The WORK hover beam is physically anchored to this period wall sconce.
// Keep the source at the shade opening so the cone visibly originates from
// the fixture instead of appearing from an arbitrary point in the room.
const MAP_SCONCE_MOUNT = new THREE.Vector3(-1.15, 5.96, WORLD.backWallZ + 0.18)
const MAP_SCONCE_SOURCE = new THREE.Vector3(-1.15, 5.72, WORLD.map.z + 0.78)
"""
new_constants = """// The WORK hover beam is physically anchored to this period wall sconce.
// The fixture sits centered above the map. Its shade projects just far enough
// from the wall to clear the map/screen hardware, then aims almost vertically
// down so the visible cone reads like the reference spotlight.
const MAP_SCONCE_MOUNT = new THREE.Vector3(WORLD.map.x, 6.55, WORLD.backWallZ + 0.18)
const MAP_SCONCE_SOURCE = new THREE.Vector3(WORLD.map.x, 6.08, WORLD.map.z + 0.55)
"""
if old_constants not in text:
    raise SystemExit('map sconce constants block not found')
text = text.replace(old_constants, new_constants, 1)

old_target = """  const target = new THREE.Vector3(WORLD.map.x, WORLD.map.y + 0.10, WORLD.map.z + 0.18)
"""
new_target = """  const target = new THREE.Vector3(WORLD.map.x, WORLD.map.y + 0.10, WORLD.map.z + 0.18)
"""
if old_target not in text:
    raise SystemExit('map sconce target not found')
# Kept explicit: with the new source coordinates this target produces only a
# slight rearward tilt while remaining centered on the map.
text = text.replace(old_target, new_target, 1)

old_comment = """  } else if (id === 'map') {
    // The map is wall-mounted, so its beam comes from a ceiling lamp position
    // in front/right of the board rather than dropping vertically. This makes
    // the volume read like an angled spotlight sweeping onto the wall.
    source = MAP_SCONCE_SOURCE.clone()
    radius = 3.15
    footprintX = 1.35
    footprintZ = 0.78
  }
"""
new_comment = """  } else if (id === 'map') {
    // The map beam starts at the centered wall sconce and drops almost straight
    // down, with only enough rearward angle to visibly land on the wall map.
    // Keep the pool tighter than the full map so it reads as a real spotlight.
    source = MAP_SCONCE_SOURCE.clone()
    radius = 2.05
    footprintX = 1.18
    footprintZ = 0.62
  }
"""
if old_comment not in text:
    raise SystemExit('map hover cone block not found')
text = text.replace(old_comment, new_comment, 1)

path.write_text(text)
