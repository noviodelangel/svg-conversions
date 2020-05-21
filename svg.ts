import * as grunt from 'grunt';
import * as path from 'path';
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
 * Converts given color into grayscale
 * @param color - input color
 * @param fileName - file name for logging purposes (in case we want to know which files contain certain color encodings)
 */
function getColorizedGrayscaleColor(color: string, fileName?: string) {
    if (namedColors.includes(color)) {
        return namedColorToColorizedGrayscale(color);
    }
    return rgbStringToColorizedGrayscale(color);
}

/**
 * @param inputColor - accepts three based (e.g. #f06), six based (e.g. #ff0066) hex format, RGB function string (e.g. rgb(211,56,51))
 */
function rgbStringToColorizedGrayscale(inputColor: string) {
    const color: Color = new SVG.Color(inputColor);
    const grayScale = Math.round((0.3 * color.r) + (0.59 * color.g) + (0.11 * color.b));
    const grayScaleColor: Color = new SVG.Color(grayScale, grayScale, grayScale, 'rgb');
    const colorizedGrayScaleColor = new SVG.Color(colorizeColor.h, colorizeColor.s, grayScaleColor.hsl().l, 'hsl');
    return colorizedGrayScaleColor.toHex();
}

function namedColorToColorizedGrayscale(color: string) {
    if (!selectedNamedColors.get(color)) {
        console.error(`Unknown color mapping for: ${color}`);
        return color;
    }
    return rgbStringToColorizedGrayscale(selectedNamedColors.get(color));
}

function processImage(output: string, fileName: string) {
    const namedColorsRegExpString = Array.from(selectedNamedColors.keys()).join('|');
    const regExp: RegExp = new RegExp(`${namedColorsRegExpString}|#[0-9A-Fa-f]{3,6}|rgb\\(.*?\\)`, 'g');
    let match: RegExpExecArray = null;
    while (match = regExp.exec(output)) {
        const newValue: string = getColorizedGrayscaleColor(match[0], fileName);
        output = output.replace(match[0], newValue);
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
    const fileName: string = path.basename(filePath);
    const fileFolder: string = getRelativeFolderPath(filePath);
    const svgFileContent: string = grunt.file.read(filePath);
    let output: string = svgFileContent;

    output = processImage(output, fileName);

    grunt.file.write(`${outputFolder}${fileFolder}/${fileName}`, output);
});
