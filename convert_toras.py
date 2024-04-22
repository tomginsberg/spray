import argparse
import json

from PIL import Image

parser = argparse.ArgumentParser(description='Convert TORAS JSON polygon list for an image')
parser.add_argument('--toras', type=str, help='JSON file containing the polygon list')
parser.add_argument('--image', type=str, help='Image file to convert')
parser.add_argument('--output', type=str, help='Output file', default='polys.json')

args = parser.parse_args()

x = json.load(open(args.toras))

segs = [s['annotationBlocks'][0]['annotations'][0]['segments'][0] for s in
        x[0]['annotation']['annotationGroups'][0]['annotationEntities']]

img = Image.open(args.image)
_, h = img.size

# flip the second coordinate by h - y
# then reverse the order of the coordinates

polys = []
for s in segs:
    poly = []
    for (x, y) in s:
        poly.append([h - y, x])
    polys.append(poly)

json.dump(polys, open(args.output, 'w'))
