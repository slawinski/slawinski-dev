from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()
old = "scene.add(cylinder((width - 0.40) / 2, 0.045, [x, 3.35, backZ + 0.58], materials.metalDark, 10, [0, 0, Math.PI / 2]))"
new = "scene.add(cylinder(0.022, width - 0.40, [x, 3.35, backZ + 0.58], materials.metalDark, 10, [0, 0, Math.PI / 2]))"
if text.count(old) != 1:
    raise SystemExit(f'closet rail: expected exactly one match, found {text.count(old)}')
text = text.replace(old, new, 1)
expected_grid = "context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()"
if expected_grid not in text:
    raise SystemExit('map horizontal grid regression detected')
path.write_text(text)
