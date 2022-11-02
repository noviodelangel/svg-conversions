import * as SVG from '@svgdotjs/svg.js';
import {Color} from "@svgdotjs/svg.js";

export class ImageColors {
    colorsSet = new Set<string>()
    hslColorsFromSvg: Array<SVG.Color> = []
    matches: Array<string> = new Array<string>();

}
