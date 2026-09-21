from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()
text = text.replace("  const sideX = width / 2 + 0.095\n\n", "", 1)
assert "const sideX = width / 2 + 0.095" not in text
assert "const createPanelDoorLeaf" in text
assert text.count("createPanelDoorLeaf({") == 2
assert "camera.position.copy(cameraTransition.path.getPointAt(routeProgress))" in text
assert "reverse: true" in text
path.write_text(text)
