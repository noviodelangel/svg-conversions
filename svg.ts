import * as grunt from 'grunt';
import * as path from 'path';
import * as util from 'util';
import * as SVG from '@svgdotjs/svg.js';
import {Color} from "@svgdotjs/svg.js";

const inputFolder = 'svg';
const outputFolder = 'out';
const sources = grunt.file.expand(`${inputFolder}/**/*.svg`);
const namedColors: Array<string> = grunt.file.read('named-colors.txt').split('\n');
const selectedNamedColors: Map<string, string> = new Map([
    ['currentColor', '#000000'],
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
const colorizeColor: Color = new SVG.Color('#00acc1').hsl();

/**
 * Converts given fill color into grayscale
 * @param fill - input color
 * @param fileName - file name for logging purposes (in case we want to know which files contain certain color encodings)
 */
function getColorizedGrayscaleColor(fill: string, fileName?: string) {
    if (fill.startsWith('#')) {
        // if (fileName && fill.length == 4) console.log(`3-based-color=${fill} file=${fileName}`);
        return rgbStringToColorizedGrayscale(fill);
    }
    if (fill.startsWith('rgb(')) {
        return rgbStringToColorizedGrayscale(fill);
    }
    if (namedColors.includes(fill)) {
        return namedColorToColorizedGrayscale(fill);
    }
    return fill;
}

/**
 * @param fill - accepts both three based (e.g. #f06) and six based (e.g. #ff0066) hex format
 */
function rgbStringToColorizedGrayscale(fill: string) {
    const color: Color = new SVG.Color(fill);
    const grayScale = Math.round((0.3 * color.r) + (0.59 * color.g) + (0.11 * color.b));
    const grayScaleColor: Color = new SVG.Color(grayScale, grayScale, grayScale, 'rgb');
    const colorizedGrayScaleColor = new SVG.Color(colorizeColor.h, colorizeColor.s, grayScaleColor.hsl().l, 'hsl');
    return colorizedGrayScaleColor.toHex();
}

function namedColorToColorizedGrayscale(fill: string) {
    if (!selectedNamedColors.get(fill)) {
        console.error(`Unknown color mapping for: ${fill}`);
        return fill;
    }
    return rgbStringToColorizedGrayscale(selectedNamedColors.get(fill));
}

function processFill(output: string, fileName: string) {
    const fillRegExp: RegExp = new RegExp('fill="(.*?)"', 'g');
    let fillMatch: RegExpExecArray = null;
    while (fillMatch = fillRegExp.exec(output)) {
        const newFill: string = getColorizedGrayscaleColor(fillMatch[1], fileName);
        output = output.replace(`fill="${fillMatch[1]}"`, `fill="${newFill}"`);
    }
    return output;
}

function processGradient(output: string, fileName: string) {
    const gradientRegExp: RegExp = new RegExp('stop-color="(.*?)"', 'g');
    let gradientMatch: RegExpExecArray = null;
    while (gradientMatch = gradientRegExp.exec(output)) {
        const newGradient: string = getColorizedGrayscaleColor(gradientMatch[1], fileName);
        output = output.replace(`stop-color="${gradientMatch[1]}"`, `stop-color="${newGradient}"`);
    }
    return output;
}

function processStyles(output: string, fileName: string) {
    const styleRegExp: RegExp = new RegExp('fill:\\s*(.*?);', 'g');
    let styleMatch: RegExpExecArray = null;
    while (styleMatch = styleRegExp.exec(output)) {
        const newStyle: string = getColorizedGrayscaleColor(styleMatch[1], fileName);
        // output = output.replace(new RegExp(`fill:\\s*${styleMatch[1]}`), `fill:${newStyle}`); -> this was not working for codelyzer.svg, not sure why. Applying following workaround:
        output = output.replace(`fill: ${styleMatch[1]}`, `fill:${newStyle}`);
        output = output.replace(`fill:${styleMatch[1]}`, `fill:${newStyle}`);
    }
    return output;
}

function getRelativeFolderPath(filePath) {
    let relativeOutputPath: string = '';
    const pathArray = filePath.split(path.sep);
    for (let i = 1; i < pathArray.length - 1; i++) {
        relativeOutputPath = relativeOutputPath + path.sep + pathArray[i];
    }
    return relativeOutputPath;
}


sources.forEach(filePath => {
    //console.log(util.inspect(namedColors, { maxArrayLength: null }));
    const fileName: string = path.basename(filePath);
    const fileFolder: string = getRelativeFolderPath(filePath);
    const svgFileContent: string = grunt.file.read(filePath);
    let output: string = svgFileContent;

    output = processFill(output, fileName);
    output = processGradient(output, fileName);
    output = processStyles(output, fileName);

    grunt.file.write(`${outputFolder}${fileFolder}/${fileName}`, output);
});
