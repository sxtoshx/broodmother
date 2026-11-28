import os
import re

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
KENNEY = os.path.expanduser('~/.cache/broodmother/kenney-1bit/colored-transparent_packed.png')
OUT = os.path.join(ROOT, 'img', 'gta-icons.png')

KENNEY_TILES = {
    'gold': (3, 41, None), 'heart': (10, 39, None), 'aegis': (4, 37, '#ffd24a'), 'cheese': (16, 34, None),
    'gun': (9, 37, None), 'cross': (11, 43, None), 'pharmacy': (10, 43, '#39d36a'), 'bus': (0, 46, None),
    'car': (0, 43, None), 'skull': (12, 34, None), 'apple': (18, 33, None), 'statue': (21, 42, None),
    'bed': (8, 6, None), 'book': (5, 45, None), 'passport': (5, 45, '#c0392b'), 'scroll': (15, 33, None),
    'chest': (6, 8, None), 'flag': (8, 17, None), 'spider': (5, 28, None), 'seven': (17, 42, '#ff3b3b'),
    'crown': (2, 43, None), 'trophy': (16, 40, '#ffd24a'), 'hourglass': (12, 39, None), 'target': (12, 43, None),
    'gear': (16, 45, None), 'cards': (16, 20, None), 'strip': (10, 39, '#ff4fb8'), 'bottle': (19, 33, None),
}

DRAWN = {
    'star': ({'y': '#ffd24a'}, [
        '................', '.......yy.......', '.......yy.......', '......yyyy......', '......yyyy......', '.yyyyyyyyyyyyyy.',
        '..yyyyyyyyyyyy..', '...yyyyyyyyyy...', '....yyyyyyyy....', '....yyyyyyyy....', '...yyyyyyyyyy...', '...yyyy..yyyy...',
        '..yyy......yyy..', '..yy........yy..', '................', '................']),
    'sun': ({'y': '#ffd24a'}, [
        '................', '.......yy.......', '..y....yy....y..', '...y........y...', '......yyyy......', '.....yyyyyy.....',
        '....yyyyyyyy....', 'yy..yyyyyyyy..yy', 'yy..yyyyyyyy..yy', '....yyyyyyyy....', '.....yyyyyy.....', '......yyyy......',
        '...y........y...', '..y....yy....y..', '.......yy.......', '................']),
    'rain': ({'c': '#c8ccd8', 'b': '#5ab0ff'}, [
        '................', '................', '......ccc.......', '....ccccccc.....', '...cccccccccc...', '.cccccccccccccc.',
        '.cccccccccccccc.', '..cccccccccccc..', '................', '...b...b...b....', '..b...b...b.....', '................',
        '....b...b...b...', '...b...b...b....', '................', '................']),
    'storm': ({'c': '#9aa0b0', 'y': '#ffd24a'}, [
        '................', '................', '......ccc.......', '....ccccccc.....', '...cccccccccc...', '.cccccccccccccc.',
        '.cccccccccccccc.', '..cccccccccccc..', '........yy......', '.......yy.......', '......yyyyy.....', '........yy......',
        '.......yy.......', '......y.........', '................', '................']),
    'snow': ({'w': '#eef6ff'}, [
        '................', '.......w........', '..w..w.w.w..w...', '...w..www..w....', '....w..w..w.....', '.w...w.w.w...w..',
        '..w...www...w...', 'wwwwwwwwwwwwwww.', '..w...www...w...', '.w...w.w.w...w..', '....w..w..w.....', '...w..www..w....',
        '..w..w.w.w..w...', '.......w........', '................', '................']),
    'fog': ({'g': '#b8bcc8'}, [
        '................', '................', '................', '..gggggggggg....', '................', '....gggggggggggg',
        '................', '.gggggggggg.....', '................', '...gggggggggggg.', '................', '..ggggggggg.....',
        '................', '................', '................', '................']),
    'moon': ({'m': '#e4ecff'}, [
        '................', '......mmmm......', '....mmmmm.......', '...mmmmm........', '..mmmmm.........', '..mmmm..........',
        '.mmmmm..........', '.mmmmm..........', '.mmmmm..........', '.mmmmmm.........', '..mmmmmm.......m', '..mmmmmmm....mm.',
        '...mmmmmmmmmmm..', '....mmmmmmmmm...', '......mmmmm.....', '................']),
    'radio': ({'r': '#c8c8d0'}, [
        '................', '...........r....', '............r...', '.............r..', '.rrrrrrrrrrrrrr.', '.rrrrrrrrrrrrrr.',
        '.rr....rrrrrrrr.', '.r......rrrrrrr.', '.r......rr...rr.', '.r......rr...rr.', '.r......rrrrrrr.', '.rr....rrrrrrrr.',
        '.rrrrrrrrrrrrrr.', '.rr..........rr.', '................', '................']),
    'tire': ({'k': '#77778a', 'h': '#d8d8e0'}, [
        '................', '.....kkkkkk.....', '...kkkkkkkkkk...', '..kkkkkkkkkkkk..', '.kkkk......kkkk.', '.kkk..hhhh..kkk.',
        'kkk..hhhhhh..kkk', 'kkk..hh..hh..kkk', 'kkk..hh..hh..kkk', 'kkk..hhhhhh..kkk', '.kkk..hhhh..kkk.', '.kkkk......kkkk.',
        '..kkkkkkkkkkkk..', '...kkkkkkkkkk...', '.....kkkkkk.....', '................']),
    'race': ({'p': '#d8d8e0', 'w': '#ffffff', 'k': '#2a2a36'}, [
        '................', '.p..............', '.pwwkkwwkkwwkk..', '.pwwkkwwkkwwkk..', '.pkkwwkkwwkkww..', '.pkkwwkkwwkkww..',
        '.pwwkkwwkkwwkk..', '.pwwkkwwkkwwkk..', '.pkkwwkkwwkkww..', '.pkkwwkkwwkkww..', '.p..............', '.p..............',
        '.p..............', '.p..............', 'ppp.............', '................']),
    'mvd': ({'b': '#2a6bff', 'y': '#ffd24a'}, [
        '................', '.bbbbbbbbbbbbbb.', '.bbbbbbbbbbbbbb.', '.bbbbbbyybbbbbb.', '.bbbbbbyybbbbbb.', '.bbbyyyyyyyybbb.',
        '.bbbbyyyyyybbbb.', '.bbbbbyyyybbbbb.', '.bbbbyyyyyybbbb.', '.bbbbyybbyybbbb.', '..bbbbbbbbbbbb..', '..bbbbbbbbbbbb..',
        '...bbbbbbbbbb...', '....bbbbbbbb....', '......bbbb......', '................']),
    'pin': ({'p': '#ff4fb8'}, [
        '................', '.....pppppp.....', '....pppppppp....', '...pppppppppp...', '...pppp..pppp...', '...ppp....ppp...',
        '...ppp....ppp...', '...pppp..pppp...', '....pppppppp....', '....pppppppp....', '.....pppppp.....', '......pppp......',
        '......pppp......', '.......pp.......', '.......pp.......', '................']),
    'sunset': ({'o': '#ff8a5c', 'p': '#ff4fb8', 'y': '#ffd24a'}, [
        '................', '................', '................', '......yyyy......', '....yyyyyyyy....', '...oyyyyyyyyo...',
        '..oooooooooooo..', '..oooooooooooo..', '.oooooooooooooo.', 'pppppppppppppppp', '................', '..pppppppppppp..',
        '................', '....pppppppp....', '................', '................']),
    'barrier': ({'g': '#c8c8d0', 'r': '#ff3b3b', 'w': '#ffffff'}, [
        '................', '................', '................', '.gg.............', '.gg.............', '.ggrrwwrrwwrrwwr',
        '.ggrrwwrrwwrrwwr', '.gg.............', '.gg.............', '.gg.............', '.gg.............', '.gg.............',
        '.gg.............', 'gggg............', '................', '................']),
    'license': ({'c': '#ff9ad0', 'p': '#8a3a6a', 'l': '#c05a90'}, [
        '................', '................', '................', '.cccccccccccccc.', '.cccccccccccccc.', '.cpppcccccccccc.',
        '.cpppcllllllllc.', '.cpppcccccccccc.', '.cpppcllllllccc.', '.cccccccccccccc.', '.cllllllllllllc.', '.cccccccccccccc.',
        '.cccccccccccccc.', '................', '................', '................']),
    'meteor': ({'b': '#8fd0ff', 't': '#ffffff', 'w': '#e8f6ff'}, [
        '................', 't...............', '.t..t...........', '..t..t..........', '...t..t.........', '.t..t..tbbb.....',
        '..t..tbbbbbbb...', '...t.bbbbbbbbb..', '.....bbbwbbbbb..', '....bbbbbbbwbbb.', '....bbbbbbbbbbb.', '....bbbwbbbbbbb.',
        '.....bbbbbbbbb..', '......bbbbbbb...', '........bbb.....', '................']),
    'bolt': ({'y': '#ffd24a'}, [
        '................', '........yyyy....', '.......yyyy.....', '......yyyy......', '.....yyyy.......', '....yyyyyyyy....',
        '.......yyyy.....', '......yyyy......', '.....yyyy.......', '....yyy.........', '...yy...........', '..y.............',
        '................', '................', '................', '................']),
    'shawarma': ({'b': '#e8c890', 'r': '#d0482a', 'g': '#5aa040'}, [
        '................', '...........bb...', '..........bbbb..', '.........bbrgbb.', '........bbrgrbb.', '.......bbgrgbb..',
        '......bbrgrbb...', '.....bbgrgbb....', '....bbbrgbb.....', '...bbbbbbb......', '..bbbbbbb.......', '..bbbbbb........',
        '..bbbbb.........', '...bbb..........', '................', '................']),
    'gres': ({'s': '#cfc8d8', 'r': '#e0453a', 'w': '#f2f2f2', 'd': '#9a9aa6'}, [
        '..ss.....ss.....', '.ssss...ssss....', '..ss.....ss.....', '..rr.....rr.....', '..ww.....ww.....', '..rr.....rr.....',
        '..ww.....ww.....', '..rr.....rr.....', '..ww..d..ww.....', '..rr.ddd.rr.d...', '.dddddddddddddd.', '.dddddddddddddd.',
        '.dd.dd.dd.dd.dd.', '.dddddddddddddd.', '.dddddddddddddd.', '................']),
    'ozon': ({'o': '#2f6fff', 'w': '#ffffff'}, [
        '................', '................', '.oooooooooooooo.', '.oooooooooooooo.', '.ooooowwwwooooo.', '.oooowwoowwoooo.',
        '.ooowwoooowwooo.', '.ooowwoooowwooo.', '.ooowwoooowwooo.', '.ooowwoooowwooo.', '.oooowwoowwoooo.', '.ooooowwwwooooo.',
        '.oooooooooooooo.', '.oooooooooooooo.', '................', '................']),
    'wb': ({'v': '#b03ad0', 'w': '#ffffff'}, [
        '................', '................', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vwvvvwvwwwvvvv.',
        '.vwvvvwvwvvwvvv.', '.vwvwvwvwwwvvvv.', '.vwvwvwvwvvwvvv.', '.vvwvwvvwwwvvvv.', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.',
        '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '................', '................']),
    'amber': ({'a': '#ffb020', 'h': '#fff0a0', 'd': '#d07a10'}, [
        '................', '................', '.....aaaaaa.....', '....ahhaaaaa....', '...ahhaaaaaaa...', '..ahaaaaaaaaaa..',
        '..aaaaaaaaaaaa..', '.aaaaaaaaaaaaad.', '.aaaaaaaaaaaadd.', '.aaaaaaaaaaaadd.', '..aaaaaaaaaaddd.', '..aaaaaaaaaddd..',
        '...aaaaaaaddd...', '....aaaadddd....', '......dddd......', '................']),
    'kb': ({'w': '#f2f2f2', 'r': '#e0302a'}, [
        '.......ww.......', '.......ww.......', '.......rr.......', '.......ww.......', '......wwww......', '.....wwwwww.....',
        '.....wwwwww.....', '.....rrrrrr.....', '.....rrwwrr.....', '.....rrwwrr.....', '.....rrrrrr.....', '.....wwwwww.....',
        '.....wwwwww.....', '.....wwwwww.....', '.....wwwwww.....', '................']),
    'uschool': ({'r': '#e0302a', 'w': '#ffffff', 'k': '#1a1a24'}, [
        '................', '.......rr.......', '......rrrr......', '......rwwr......', '.....rwwwwr.....', '.....rwwwwr.....',
        '....rwkwwkwr....', '....rwkwwkwr....', '...rwwwkkkwwr...', '...rwwwwwkwwr...', '..rwwwwwwkwwwr..', '..rwwwwwkkwwwr..',
        '.rwwwwwwwwwwwwr.', '.rrrrrrrrrrrrrr.', '................', '................']),
}


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def kenney(sheet, r, c, tint):
    tile = sheet.crop((c * 16, r * 16, c * 16 + 16, r * 16 + 16))
    if tint:
        out = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
        out.paste(Image.new('RGBA', (16, 16), hexrgb(tint)), (0, 0), tile.split()[3])
        return out
    return tile


def drawn(palette, rows):
    assert len(rows) == 16 and all(len(r) == 16 for r in rows), rows
    tile = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != '.':
                tile.putpixel((x, y), hexrgb(palette[ch]))
    return tile


def main():
    src = open(os.path.join(ROOT, 'js', 'gta.js'), encoding='utf-8').read()
    keys = re.search(r"const ICONS = '([a-z,]+)'\.split", src).group(1).split(',')
    sheet = Image.open(KENNEY).convert('RGBA')
    atlas = Image.new('RGBA', (16 * len(keys), 16), (0, 0, 0, 0))
    for i, k in enumerate(keys):
        tile = kenney(sheet, *KENNEY_TILES[k]) if k in KENNEY_TILES else drawn(*DRAWN[k])
        atlas.paste(tile, (i * 16, 0))
    atlas.save(OUT, optimize=True)
    print(len(keys), 'icons', os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    main()
