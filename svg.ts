import * as grunt from 'grunt';
import * as path from 'path';
import * as util from 'util';
import * as SVG from '@svgdotjs/svg.js';
import {ColorLike} from "@svgdotjs/svg.js";

const sources = grunt.file.expand('svg/**/*.svg');
const namedColors: Array<string> = grunt.file.read('named-colors.txt').split('\n');
const selectedNamedColors: Map<string, string> = new Map([
    ['black', '#000000'],
    ['gold', '#FFD700'],
    ['gray', '#808080'],
    ['green', '#008000'],
    ['orange', '#FFA500'],
    ['purple', '#800080'],
    ['red', '#FF0000'],
    ['silver', '#C0C0C0'],
    ['white', '#FFFFFF'],
]);

/**
 * Converts given fill color into grayscale
 * @param fill - input color
 * @param fileName - file name for logging purposes (in case we want to know which files contain certain color encodings)
 */
function getGrayscaleColor(fill: string, fileName?: string) {
    if (fill.startsWith('#')) {
        // if (fileName && fill.length == 4) console.log(`3-based-color=${fill} file=${fileName}`);
        return hexStringToGrayscale(fill);
    }
    if (namedColors.includes(fill)) {
        if (!selectedNamedColors.get(fill)) {
            console.log(`Unknown color mapping for: ${fill}`);
            return fill;
        }
        return hexStringToGrayscale(selectedNamedColors.get(fill));
    }
    return fill;
}

/**
 * @param fill - accepts both three based (e.g. #f06) and six based (e.g. #ff0066) hex format
 */
function hexStringToGrayscale(fill: string) {
    const color: ColorLike = new SVG.Color(fill);
    const grayScale = Math.round((0.3 * color.r) + (0.59 * color.g) + (0.11 * color.b));
    const grayScaleHex = grayScale.toString(16);
    return `#${grayScaleHex}${grayScaleHex}${grayScaleHex}`;
}

sources.forEach(filePath => {
    //console.log(util.inspect(namedColors, { maxArrayLength: null }));
    const fileName: string = path.basename(filePath);
    const svgFileContent: string = grunt.file.read(filePath);
    const fillRegExp: RegExp = new RegExp('fill="(.*?)"', 'g');
    const gradientRegExp: RegExp = new RegExp('stop-color="(.*?)"', 'g');
    let output: string = svgFileContent;

    let fillMatch: RegExpExecArray = null;
    while(fillMatch = fillRegExp.exec(output)) {
        const newFill: string = getGrayscaleColor(fillMatch[1], fileName);
        output = output.replace(`fill="${fillMatch[1]}"`, `fill="${newFill}"`);
    }

    let gradientMatch: RegExpExecArray = null;
    while(gradientMatch = gradientRegExp.exec(output)) {
        const newGradient: string = getGrayscaleColor(gradientMatch[1], fileName);
        output = output.replace(`stop-color="${gradientMatch[1]}"`, `stop-color="${newGradient}"`);
    }

    grunt.file.write(`out/${fileName}`, output);
});
