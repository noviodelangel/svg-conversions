import {Config} from "./Config";
import {Boundaries} from "./Boundaries";
import * as SVG from '@svgdotjs/svg.js';
import {Color} from "@svgdotjs/svg.js";
import * as grunt from 'grunt';

export class SvgProcessor {
    constructor(private config: Config) {
        Array.from(Array(this.COLOR_COUNT + 1).keys()).forEach((i) => {
            this.colorLightnessBase.push(i * (this.MAX_LIGHTNESS_VALUE / this.COLOR_COUNT));
        });
    }

    private namedColors: Array<string> = grunt.file.read('data/named-colors.txt').split('\n');
    private colorizeColor: Color = new SVG.Color(this.config.primaryColor).hsl();
    private selectedNamedColors: Map<string, string> = new Map([
        ['currentColor', this.colorizeColor.rgb().toHex()],
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

    private COLOR_COUNT = 255;
    private MAX_LIGHTNESS_VALUE = 100;
    private colorLightnessBase: Array<number> = [];

    public processImage(output: string, imageName: string, outputMode: string): string {
        const namedColorsRegExpString = Array.from(this.selectedNamedColors.keys()).map(word => `\\b${word}\\b`).join('|');
        const regExp: RegExp = new RegExp(`${namedColorsRegExpString}|#[0-9A-F]{3,6}|rgb\\(.*?\\)`, 'gi');
        let match: RegExpExecArray = null;
        const hslColorsFromSvg: Array<SVG.Color> = new Array<SVG.Color>();
        const matches: Array<string> = this.examineSvgColors(match, regExp, output, hslColorsFromSvg);

        if (matches.length == 0) {
            return output;
        }

        let {primaryLightnessBoundaries, svgLightnessBoundaries} = this.calculateBoundaries(hslColorsFromSvg, imageName);

        return output.replace(regExp, (match) => {
            const color = this.getHSLGrayscaleColor(match);
            const scaledLightness = this.scaleLightnessWithReference(primaryLightnessBoundaries, svgLightnessBoundaries, color);
            const scaledColor: SVG.Color = this.getColorizedColorWithLightness(this.colorizeColor, (primaryLightnessBoundaries.contains(svgLightnessBoundaries)) ? color.l : scaledLightness);
            const normalizedColor: SVG.Color = this.getNormalizedColor(scaledColor);
            console.log(`[${imageName}] changing color=${color.toHex()} with lightness=${color.l} to color=${scaledColor.toHex()} with lightness=${scaledColor.l} then normalized to color=${normalizedColor.toHex()} with lightness=${normalizedColor.l} and normalizedIndex=${this.calculateNormalizedIndex(normalizedColor.l)}`);
            return outputMode === 'rgb' ? normalizedColor.toRgb() : `var(${this.generateCssVarName(normalizedColor)})`;
        });
    }


    public generateColorMap() {
        let output: string = 'html\n';
        this.colorLightnessBase.forEach(lightness => {
            const color: SVG.Color = new SVG.Color(this.colorizeColor.h, this.colorizeColor.s, lightness, 'hsl');
            output += `\t${this.generateCssVarName(color)}: ${color.toRgb()}\n`
        });
        return output;
    }

    /**
     * Colorizes picture using current colorize color
     * @param color - input color
     * @param fileName - file name for logging purposes (in case we want to know which files contain certain color encodings)
     */
    private getColorizedColor(color: string, fileName?: string) {
        if (this.namedColors.includes(color)) {
            return this.colorizeNamedColor(color);
        }
        return this.colorizeRgbString(color);
    }

    private getColorizedColorWithLightness(colorizeColor: Color, lightness: number) {
        return new SVG.Color(colorizeColor.h, colorizeColor.s, lightness, 'hsl');
    }

    private getHSLGrayscaleColor(color: string) {
        if (this.namedColors.includes(color)) {
            return new SVG.Color(this.toGrayscale(this.selectedNamedColors.get(color))).hsl();
        }
        return new SVG.Color(this.toGrayscale(color)).hsl();
    }

    private toGrayscale(inputColor: string) {
        const color = this.isPercentageRGB(inputColor) ? this.convertPercentageRGBtoNumeric(inputColor) : inputColor;
        const svgColor: Color = new SVG.Color(color);
        const grayScale = Math.round((0.3 * svgColor.r) + (0.59 * svgColor.g) + (0.11 * svgColor.b));
        const grayScaleColor: Color = new SVG.Color(grayScale, grayScale, grayScale, 'rgb');
        return grayScaleColor.toHex();
    }

    private isPercentageRGB(inputColor: string): boolean {
        return inputColor.indexOf("%") !== -1;
    }

    private convertPercentageRGBtoNumeric(inputColor: string): string {
        const rgbRegExp = new RegExp(/rgb\((.*)\)/, "g");
        const rgbString = rgbRegExp.exec(inputColor)[1];
        const rgbPercentageArray = rgbString.replace(new RegExp('%', 'g'), '').split(',');
        const rgbArray = rgbPercentageArray.map(percentageColorRepresentation => this.percentageToNumeric(percentageColorRepresentation));
        console.log(`converting ${rgbString} to ${rgbArray[0]},${rgbArray[1]},${rgbArray[2]}`);
        return `rgb(${rgbArray[0]},${rgbArray[1]},${rgbArray[2]})`;
    }

    private percentageToNumeric(percentage: string) {
        const percentageNumber = parseFloat(percentage);
        return Math.round((percentageNumber / 100) * 255);
    }

    private scaleLightness(primaryLightness: number, currentLightness: number, tolerance: number) {
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

    private scaleLightnessWithReference(referenceBoundaries: Boundaries, boundaries: Boundaries, color: SVG.Color): number {
        if (boundaries.range == 0) { // if svg has only one color then boundaries point to the same lightness and range is 0 so I just set lightness to primaryColorLightness
            return this.colorizeColor.l;
        }

        const distance = color.l - boundaries.low;
        return referenceBoundaries.low + (distance / boundaries.range) * referenceBoundaries.range;
    }

    /**
     * @param inputColor - accepts three based (e.g. #f06), six based (e.g. #ff0066) hex format, RGB function string (e.g. rgb(211,56,51))
     */
    private colorizeRgbString(inputColor: string) {
        const color: Color = new SVG.Color(inputColor);
        const lightness: number = this.scaleLightness(this.colorizeColor.l, color.hsl().l, this.config.tolerance);
        const colorizedColor = new SVG.Color(this.colorizeColor.h, this.colorizeColor.s, lightness, 'hsl');
        return colorizedColor.toHex();
    }

    private colorizeNamedColor(color: string) {
        if (!this.selectedNamedColors.get(color)) {
            console.error(`Unknown color mapping for: ${color}`);
            return color;
        }
        return this.colorizeRgbString(this.selectedNamedColors.get(color));
    }

    private getLightnessBoundariesWithTolerance(color: Color, tolerance: number): Boundaries {
        return new Boundaries((1 - tolerance) * color.l, (1 + tolerance) * color.l);
    }

    private getLightnessBoundariesFromSortedColorArray(colors: Array<SVG.Color>): Boundaries {
        return new Boundaries(colors[0].l, colors[colors.length - 1].l);
    }

    private adjustBoundaries(referenceBoundaries: Boundaries, boundaries: Boundaries) {
        boundaries.setLow((boundaries.low < referenceBoundaries.low) ? referenceBoundaries.low : boundaries.low);
        boundaries.setHigh((boundaries.high > referenceBoundaries.high) ? referenceBoundaries.high : boundaries.high);
        return boundaries;
    }

    private examineSvgColors(match: RegExpExecArray, regExp: RegExp, output: string, hslColorsFromSvg: Array<SVG.Color>) {
        const matches: Array<string> = new Array<string>();
        while (match = regExp.exec(output)) {
            hslColorsFromSvg.push(this.getHSLGrayscaleColor(match[0]));
            matches.push(match[0]);
        }
        return matches;
    }

    private calculateBoundaries(hslColorsFromSvg: Array<SVG.Color>, fileName: string) {
        hslColorsFromSvg.sort((a, b) => a.l - b.l);
        const primaryLightnessBoundaries: Boundaries = this.getLightnessBoundariesWithTolerance(this.colorizeColor, this.config.tolerance);
        console.log(`[${fileName}] Reference boundaries: [${primaryLightnessBoundaries.low}, ${primaryLightnessBoundaries.high}]`);
        let svgLightnessBoundaries: Boundaries = this.getLightnessBoundariesFromSortedColorArray(hslColorsFromSvg);
        console.log(`[${fileName}] SVG boundaries: [${svgLightnessBoundaries.low}, ${svgLightnessBoundaries.high}]`);
        return {primaryLightnessBoundaries, svgLightnessBoundaries};
    }

    private calculateNormalizedIndex(lightness) {
        return Math.round((lightness / this.MAX_LIGHTNESS_VALUE) * this.COLOR_COUNT);
    }

    private getNormalizedColor(color: SVG.Color) {
        return new SVG.Color(color.h, color.s, this.colorLightnessBase[this.calculateNormalizedIndex(color.l)], 'hsl');
    }

    private generateCssVarName(normalizedColor: SVG.Color) {
        return `--primary-l-${this.calculateNormalizedIndex(normalizedColor.l)}`;
    }

}
