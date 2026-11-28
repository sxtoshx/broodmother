import base64
import json
import math
import os
import time
import urllib.request

import numpy as np
import shapely
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import linemerge, polygonize, unary_union

CACHE = os.path.expanduser('~/.cache/broodmother')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'dobryanka.json')
LAT0, LON0 = 58.4635, 56.4055
GAME = (58.449, 56.383, 58.478, 56.428)
MARGIN = 450
WATER_LEVEL = 108.5
LAND_MIN = 1.0
H_BASE, H_STEP = -5.0, 0.3
KY = 111195.0
KX = KY * math.cos(math.radians(LAT0))

DRIVE = {'trunk': 14, 'primary': 14, 'secondary': 13, 'secondary_link': 10, 'tertiary': 11, 'tertiary_link': 9, 'unclassified': 9, 'residential': 8, 'living_street': 7, 'service': 5}
FOOT = {'footway', 'pedestrian', 'path', 'steps'}
HOUSE = {'house', 'detached', 'hut', 'semidetached_house', 'bungalow', 'cabin', 'farm_auxiliary', 'barn'}
GARAGE = {'garages', 'garage', 'shed', 'roof', 'carport'}
FLATS = {'apartments', 'residential', 'dormitory'}
SHOP = {'retail', 'commercial', 'supermarket', 'kiosk', 'office', 'public', 'civic', 'hotel'}
WORK = {'industrial', 'warehouse', 'service', 'manufacture', 'transportation'}
SCHOOL = {'school', 'kindergarten', 'college', 'university'}
CHURCH = {'church', 'chapel', 'cathedral', 'religious', 'mosque'}

PLACES = {
    'shawarma': (58.4665, 56.39542), 'tire': (58.47102, 56.41229), 'crypto': (58.46317, 56.40251), 'pawn': (58.46349, 56.40112),
    'guns': (58.47145, 56.41171), 'pharmacy': (58.46866, 56.40031), 'mvd': (58.47203, 56.39871), 'strip': (58.46628, 56.3917),
    'yantar': (58.46825, 56.39342), 'kb': (58.45961, 56.41782), 'hotel': (58.46952, 56.38617), 'ozon': (58.46642, 56.40367),
    'wb': (58.46555, 56.3974), 'school': (58.46496, 56.40586), 'autoschool': (58.46722, 56.38554), 'race': (58.4722, 56.41407),
    'hospital': (58.47038, 56.39154), 'gres': (58.4773, 56.41515), 'statue': (58.45831, 56.40098), 'market': (58.46684, 56.40934),
    'bus': (58.46097, 56.41329), 'triada1': (58.4674, 56.408), 'triada2': (58.4626, 56.3988), 'triada3': (58.4705, 56.4045),
}


def xy(lat, lon):
    return ((lon - LON0) * KX, -(lat - LAT0) * KY)


def rnd(v, q=0.5):
    return round(v / q) * q


def elevations(points):
    path = os.path.join(CACHE, 'elev.json')
    cache = json.load(open(path)) if os.path.exists(path) else {}
    keys = [f'{la:.5f},{lo:.5f}' for la, lo in points]
    todo = [k for k in keys if k not in cache]
    for i in range(0, len(todo), 100):
        chunk = todo[i:i + 100]
        url = 'https://api.opentopodata.org/v1/srtm30m?locations=' + '|'.join(chunk)
        for attempt in range(5):
            try:
                data = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'game-map/1.0'}), timeout=60))
                break
            except Exception:
                time.sleep(3 * (attempt + 1))
        for k, r in zip(chunk, data['results']):
            cache[k] = r['elevation'] if r['elevation'] is not None else WATER_LEVEL
        json.dump(cache, open(path, 'w'))
        time.sleep(1.2)
    return [cache[k] for k in keys]


def main():
    osm = json.load(open(os.path.join(CACHE, 'dob.json')))['elements']
    nodes = {e['id']: xy(e['lat'], e['lon']) for e in osm if e['type'] == 'node' and 'lat' in e}
    ways = {e['id']: e for e in osm if e['type'] == 'way'}
    x0, z1 = xy(GAME[0], GAME[1])
    x1, z0 = xy(GAME[2], GAME[3])
    game = box(x0, z0, x1, z1)
    ext = box(x0 - MARGIN, z0 - MARGIN, x1 + MARGIN, z1 + MARGIN)
    inner = ext.buffer(-30)

    water = []
    for w in ways.values():
        t = w.get('tags', {})
        if t.get('natural') == 'water' and len(w['nodes']) > 3 and w['nodes'][0] == w['nodes'][-1]:
            pts = [nodes[n] for n in w['nodes'] if n in nodes]
            if len(pts) > 3:
                water.append(Polygon(pts).buffer(0))
    for rel in (e for e in osm if e['type'] == 'relation'):
        outer = [LineString([nodes[n] for n in ways[m['ref']]['nodes'] if n in nodes]) for m in rel['members'] if m['type'] == 'way' and m['ref'] in ways and m.get('role') != 'inner']
        outer = [l for l in outer if len(l.coords) > 1]
        water.extend(p.buffer(0) for p in polygonize(linemerge(outer)))
    wet = unary_union(water).intersection(ext.buffer(60))
    roads = [LineString([nodes[n] for n in w['nodes'] if n in nodes]).buffer(DRIVE[w["tags"]["highway"]] / 2 + 12) for w in ways.values() if w.get('tags', {}).get('highway') in DRIVE and sum(1 for n in w['nodes'] if n in nodes) > 1]
    wet = wet.difference(unary_union(roads))
    step = 80.0
    ex0, ez0, ex1, ez1 = ext.bounds
    hnx, hnz = int((ex1 - ex0) / step) + 2, int((ez1 - ez0) / step) + 2
    pts = []
    for j in range(hnz):
        for i in range(hnx):
            x, z = ex0 + i * step, ez0 + j * step
            pts.append((LAT0 - z / KY, LON0 + x / KX))
    elev = np.array(elevations(pts), dtype=float).reshape(hnz, hnx) - WATER_LEVEL
    pad = np.pad(elev, 1, mode='edge')
    kern = np.array([[1, 2, 1], [2, 4, 2], [1, 2, 1]]) / 16
    smooth = sum(kern[a, b] * pad[a:a + hnz, b:b + hnx] for a in range(3) for b in range(3))

    fine = 16.0
    fnx, fnz = int((ex1 - ex0) / fine) + 1, int((ez1 - ez0) / fine) + 1
    fx, fz = np.meshgrid(np.arange(fnx) * fine, np.arange(fnz) * fine)
    gi, gj = fx / step, fz / step
    i0, j0 = np.clip(gi.astype(int), 0, hnx - 2), np.clip(gj.astype(int), 0, hnz - 2)
    ti, tj = gi - i0, gj - j0
    land = (smooth[j0, i0] * (1 - ti) * (1 - tj) + smooth[j0, i0 + 1] * ti * (1 - tj) + smooth[j0 + 1, i0] * (1 - ti) * tj + smooth[j0 + 1, i0 + 1] * ti * tj)
    land = np.maximum(land, LAND_MIN)
    px, pz = (fx + ex0).ravel(), (fz + ez0).ravel()
    wetmask = shapely.contains_xy(wet, px, pz)
    depth = np.zeros(px.shape)
    depth[wetmask] = shapely.distance(shapely.points(px[wetmask], pz[wetmask]), wet.boundary)
    height = np.where(wetmask, -0.2 - np.minimum(3.5, depth * 0.05), land.ravel())
    quant = np.clip(np.round((height - H_BASE) / H_STEP), 0, 255).astype(np.uint8)

    use = {}
    for w in ways.values():
        t = w.get('tags', {})
        if t.get('highway') in DRIVE and t.get('service') not in ('parking_aisle', 'drive-through'):
            for n in w['nodes']:
                use[n] = use.get(n, 0) + 1
    index, nodes_out, edges = {}, [], []

    def node_at(p, key=None):
        if key is not None and key in index:
            return index[key]
        nodes_out.append((rnd(p[0]), rnd(p[1])))
        k = len(nodes_out) - 1
        if key is not None:
            index[key] = k
        return k

    bridge = None
    for w in ways.values():
        t = w.get('tags', {})
        cls = t.get('highway')
        if cls not in DRIVE or t.get('service') in ('parking_aisle', 'drive-through'):
            continue
        ids = [n for n in w['nodes'] if n in nodes]
        if len(ids) < 2 or not LineString([nodes[n] for n in ids]).intersects(ext):
            continue
        width = DRIVE[cls]
        cuts = [0] + [k for k in range(1, len(ids) - 1) if use.get(ids[k], 0) > 1] + [len(ids) - 1]
        for a, b in zip(cuts, cuts[1:]):
            seg = LineString([nodes[n] for n in ids[a:b + 1]]).simplify(2.0)
            coords = list(seg.coords)
            chain = [node_at(coords[0], ids[a])] + [node_at(c) for c in coords[1:-1]] + [node_at(coords[-1], ids[b])]
            for u, v in zip(chain, chain[1:]):
                if u != v and inner.contains(Point(nodes_out[u])) and inner.contains(Point(nodes_out[v])):
                    edges.append((u, v, width))
        if t.get('bridge') and cls == 'secondary':
            pa, pb = nodes[ids[0]], nodes[ids[-1]]
            bridge = [rnd(pa[0]), rnd(pa[1]), rnd(pb[0]), rnd(pb[1])]

    parent = list(range(len(nodes_out)))

    def root(k):
        while parent[k] != k:
            parent[k] = parent[parent[k]]
            k = parent[k]
        return k

    for u, v, _ in edges:
        parent[root(u)] = root(v)
    sizes = {}
    for u, v, _ in edges:
        sizes[root(u)] = sizes.get(root(u), 0) + 1
    main_root = max(sizes, key=sizes.get)
    edges = [e for e in edges if root(e[0]) == main_root]
    remap = {}
    for u, v, _ in edges:
        for k in (u, v):
            remap.setdefault(k, len(remap))
    nodes_out = [nodes_out[k] for k in sorted(remap, key=remap.get)]
    edges = [(remap[u], remap[v], w) for u, v, w in edges]
    print('components', len(sizes), 'kept edges', sizes[main_root], 'dropped', sum(sizes.values()) - sizes[main_root])

    bx, bz = (bridge[0] + bridge[2]) / 2, (bridge[1] + bridge[3]) / 2
    bl = math.hypot(bx, bz)
    beyond = [k for k, (x, z) in enumerate(nodes_out) if math.hypot(x - bx, z - bz) < 650 and (x * bx + z * bz) / bl > bl + 60]
    exit_node = max(beyond, key=lambda k: math.hypot(*nodes_out[k]))

    lines = [LineString([nodes_out[u], nodes_out[v]]) for u, v, _ in edges]
    widths = [w for _, _, w in edges]
    tree = shapely.STRtree(lines)

    def place(lat, lon):
        p = Point(xy(lat, lon))
        k = tree.nearest(p)
        q = lines[k].interpolate(lines[k].project(p))
        dx, dz = p.x - q.x, p.y - q.y
        d = math.hypot(dx, dz)
        if d < 1:
            (ax, az), (cx, cz) = lines[k].coords
            dx, dz, d = -(cz - az), cx - ax, math.hypot(cz - az, cx - ax)
        dx, dz = dx / d, dz / d
        off = widths[k] / 2 + 3.5
        return [rnd(q.x + dx * off), rnd(q.y + dz * off), round(math.atan2(-dx, -dz), 3), rnd(p.x), rnd(p.y)]

    places = {k: place(*v) for k, v in PLACES.items()}

    buildings = []
    for w in ways.values():
        t = w.get('tags', {})
        if 'building' not in t:
            continue
        pts = [nodes[n] for n in w['nodes'] if n in nodes]
        if len(pts) < 4:
            continue
        poly = Polygon(pts).buffer(0)
        if poly.is_empty or not inner.contains(poly.centroid) or poly.area < 15:
            continue
        if poly.geom_type != 'Polygon':
            poly = max(poly.geoms, key=lambda g: g.area)
        kind = t['building']
        levels = t.get('building:levels')
        area = poly.area
        if kind in HOUSE or (kind == 'yes' and area < 160 and not levels):
            code, h = 'h', 4.0
        elif kind in GARAGE:
            code, h = 'g', 2.8
        elif kind in FLATS or (kind == 'yes' and area >= 160):
            code, h = 'a', 15.0 if area > 300 else 9.0
        elif kind in SHOP:
            code, h = 'r', 5.5
        elif kind in WORK:
            code, h = 'i', 8.0
        elif kind in SCHOOL:
            code, h = 's', 10.0
        elif kind in CHURCH:
            code, h = 'c', 12.0
        else:
            code, h = 'a', 9.0
        if levels:
            try:
                h = float(str(levels).split(';')[0]) * 3 + .6
            except ValueError:
                pass
        if code == 'h':
            rect = poly.minimum_rotated_rectangle
            c = list(rect.exterior.coords)[:4]
            e1, e2 = (c[1][0] - c[0][0], c[1][1] - c[0][1]), (c[2][0] - c[1][0], c[2][1] - c[1][1])
            w1, w2 = math.hypot(*e1), math.hypot(*e2)
            ang = math.atan2(e1[0], e1[1]) if w1 >= w2 else math.atan2(e2[0], e2[1])
            buildings.append(['h', round(h, 1), rnd(rect.centroid.x), rnd(rect.centroid.y), round(min(w1, w2), 1), round(max(w1, w2), 1), round(ang, 3)])
        else:
            ring = list(poly.simplify(0.8).exterior.coords)[:-1]
            if len(ring) < 3:
                continue
            flat = []
            for x, z in ring:
                flat += [rnd(x), rnd(z)]
            buildings.append([code, round(h, 1)] + flat)

    green = []
    for w in ways.values():
        t = w.get('tags', {})
        kind = 'f' if t.get('landuse') == 'forest' or t.get('natural') == 'wood' else 'p' if t.get('leisure') in ('park', 'garden', 'pitch') or t.get('landuse') in ('grass', 'meadow', 'recreation_ground', 'village_green', 'allotments', 'cemetery') else None
        if not kind:
            continue
        pts = [nodes[n] for n in w['nodes'] if n in nodes]
        if len(pts) < 4 or w['nodes'][0] != w['nodes'][-1]:
            continue
        poly = Polygon(pts).buffer(0).intersection(ext)
        if poly.is_empty or poly.area < 200:
            continue
        for g in getattr(poly, 'geoms', [poly]):
            if g.geom_type != 'Polygon':
                continue
            flat = []
            for x, z in list(g.simplify(2).exterior.coords)[:-1]:
                flat += [rnd(x, 1), rnd(z, 1)]
            if len(flat) >= 6:
                green.append([kind] + flat)

    foot = []
    for w in ways.values():
        t = w.get('tags', {})
        if t.get('highway') not in FOOT:
            continue
        pts = [nodes[n] for n in w['nodes'] if n in nodes]
        if len(pts) < 2:
            continue
        seg = LineString(pts).intersection(game)
        for g in getattr(seg, 'geoms', [seg]):
            if g.geom_type != 'LineString' or g.length < 8:
                continue
            flat = []
            for x, z in g.simplify(1.5).coords:
                flat += [rnd(x, 1), rnd(z, 1)]
            foot.append(flat)

    out = {
        'game': [rnd(x0), rnd(z0), rnd(x1), rnd(z1)],
        'height': {'x0': rnd(ex0), 'z0': rnd(ez0), 'step': fine, 'nx': fnx, 'nz': fnz, 'base': H_BASE, 'q': H_STEP, 'b64': base64.b64encode(quant.tobytes()).decode()},
        'nodes': [c for p in nodes_out for c in p],
        'edges': [c for e in edges for c in e],
        'bridge': bridge,
        'exit': list(nodes_out[exit_node]),
        'places': places,
        'buildings': buildings,
        'green': green,
        'foot': foot,
    }
    json.dump(out, open(OUT, 'w'), separators=(',', ':'), ensure_ascii=False)
    print('nodes', len(nodes_out), 'edges', len(edges), 'buildings', len(buildings), 'green', len(green), 'foot', len(foot), 'grid', fnx, fnz, 'heights', round(float(height.min()), 1), round(float(height.max()), 1), 'bridge', bridge, 'exit', nodes_out[exit_node], 'size', os.path.getsize(OUT))


if __name__ == '__main__':
    main()
