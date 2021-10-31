import * as grunt from 'grunt';
import * as path from 'path';
import * as SVG from '@svgdotjs/svg.js';
import {Color} from "@svgdotjs/svg.js";
// import {sos} from "./sos";

// console.log("TEST")

// sos()



class Boundaries {
    public range: number;
    constructor(public low: number,
                public high: number) {
        this.calculateRange();
    }

    public setLow(newLow: number) {
        this.low = newLow;
        this.calculateRange();
    }

    public setHigh(newHigh: number) {
        this.high = newHigh;
        this.calculateRange();
    }

    public contains(other: Boundaries) {
        return other.low >= this.low && other.high <= this.high
    }

    private calculateRange() {
        this.range = this.high - this.low;
    }
}

const inputFolder = '../InnoTopicWebsite/src/assets/images/logos';

// const outputFolder = '..';
const outputFolder = 'out';
const sources = grunt.file.expand(`${inputFolder}/**/*.svg`);
const namedColors: Array<string> = grunt.file.read('named-colors.txt').split('\n');
const colorizeColor: Color = new SVG.Color('#ff7000').hsl();
// const colorizeColor: Color = new SVG.Color('#9B5D39').hsl();
// const colorizeColor: Color = new SVG.Color('#b14121').hsl();
const selectedNamedColors: Map<string, string> = new Map([
    ['currentColor', colorizeColor.rgb().toHex()],
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
 * Colorizes picture using current colorize color
 * @param color - input color
 * @param fileName - file name for logging purposes (in case we want to know which files contain certain color encodings)
 */
function getColorizedColor(color: string, fileName?: string) {
    if (namedColors.includes(color)) {
        return colorizeNamedColor(color);
    }
    return colorizeRgbString(color);
}

function getColorizedColorWithLightness(colorizeColor: Color, lightness: number) {
    const colorizedColor = new SVG.Color(colorizeColor.h, colorizeColor.s, lightness, 'hsl');
    return colorizedColor.toHex();
}

function getHSLColor(color: string) {
    if (namedColors.includes(color)) {
        return new SVG.Color(selectedNamedColors.get(color)).hsl();
    }
    return new SVG.Color(color).hsl();
}

function scaleLightness(primaryLightness: number, currentLightness: number, tolerance: number) {
    const lowerLightnessBoundary: number = (1 - tolerance) * primaryLightness;
    const upperLightnessBoundary: number = (1 + tolerance) * primaryLightness;
    if (currentLightness >= lowerLightnessBoundary && currentLightness <= upperLightnessBoundary) {
        return currentLightness;
    }
    if (currentLightness < primaryLightness) {
        return lowerLightnessBoundary;
    }
    if (currentLightness > primaryLightness) {
        return upperLightnessBoundary;
    }
}

function scaleLightnessWithReference(referenceBoundaries: Boundaries, boundaries: Boundaries, color: SVG.Color): number {
    if (boundaries.range == 0) { // if svg has only one color then boundaries point to the same lightness and distance is 0 so I just set lightness to primaryColorLightness
        return colorizeColor.l;
    }

    const distance = color.l - boundaries.low;
    return referenceBoundaries.low + (distance / boundaries.range) * referenceBoundaries.range;
}

/**
 * @param inputColor - accepts three based (e.g. #f06), six based (e.g. #ff0066) hex format, RGB function string (e.g. rgb(211,56,51))
 */
function colorizeRgbString(inputColor: string) {
    const color: Color = new SVG.Color(inputColor);
    const lightness: number = scaleLightness(colorizeColor.l, color.hsl().l, 0.99);
    const colorizedColor = new SVG.Color(colorizeColor.h, colorizeColor.s, lightness, 'hsl');
    return colorizedColor.toHex();
}

function colorizeNamedColor(color: string) {
    if (!selectedNamedColors.get(color)) {
        console.error(`Unknown color mapping for: ${color}`);
        return color;
    }
    return colorizeRgbString(selectedNamedColors.get(color));
}

function getLightnessBoundariesWithTolerance(color: Color, tolerance: number): Boundaries {
    return new Boundaries((1 - tolerance) * color.l, (1 + tolerance) * color.l);
}

function getLightnessBoundariesFromSortedColorArray(colors: Array<SVG.Color>): Boundaries {
    return new Boundaries(colors[0].l, colors[colors.length - 1].l);
}

function adjustBoundaries(referenceBoundaries: Boundaries, boundaries: Boundaries) {
    boundaries.setLow((boundaries.low < referenceBoundaries.low) ? referenceBoundaries.low : boundaries.low);
    boundaries.setHigh((boundaries.high > referenceBoundaries.high) ? referenceBoundaries.high : boundaries.high);
    return boundaries;
}

function processImage(output: string, fileName: string) {
    try {
        const namedColorsRegExpString = Array.from(selectedNamedColors.keys()).map(word => `\\b${word}\\b`).join('|');
        const regExp: RegExp = new RegExp(`${namedColorsRegExpString}|#[0-9A-F]{3,6}|rgb\\(.*?\\)`, 'gi');
        let match: RegExpExecArray = null;
        const hslColorsFromSvg: Array<SVG.Color> = new Array<SVG.Color>();
        const matches: Array<string> = new Array<string>();
        while (match = regExp.exec(output)) {
            hslColorsFromSvg.push(getHSLColor(match[0]));
            matches.push(match[0]);
        }

        if (matches.length == 0) {
            return output;
        }

        hslColorsFromSvg.sort((a, b) => a.l - b.l);
        const primaryLightnessBoundaries: Boundaries = getLightnessBoundariesWithTolerance(colorizeColor, 0.2);
        // console.log(`[${fileName}] Reference boundaries: [${primaryLightnessBoundaries.low}, ${primaryLightnessBoundaries.high}]`);
        let svgLightnessBoundaries: Boundaries =  getLightnessBoundariesFromSortedColorArray(hslColorsFromSvg);
        // console.log(`[${fileName}] SVG boundaries: [${svgLightnessBoundaries.low}, ${svgLightnessBoundaries.high}]`);
        // svgLightnessBoundaries = adjustBoundaries(primaryLightnessBoundaries, svgLightnessBoundaries); // -> adjusting boundaries may be a bit tricky in further calculations

        return output.replace(regExp, (match) => {
            const color = getHSLColor(match);
            const scaledLightness = scaleLightnessWithReference(primaryLightnessBoundaries, svgLightnessBoundaries, color);
            const scaledColor: string = getColorizedColorWithLightness(colorizeColor, (primaryLightnessBoundaries.contains(svgLightnessBoundaries)) ? color.l : scaledLightness);
            // console.log(`[${fileName}] changing color=${color.toHex()} with lightness=${color.l} to color=${scaledColor} with lightness=${scaledLightness}`);
            return scaledColor;
        });
    } catch (x) {
        console.error(`!! ERROR processing file ` + fileName, x)
    }
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
