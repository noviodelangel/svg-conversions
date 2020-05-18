import * as grunt from 'grunt';
import * as path from 'path';

const sources = grunt.file.expand('svg**/*.svg');

function getGrayscaleColor(fill: string) {
    if (fill.startsWith('#') && fill.length === 7) {
        return eightBitRGBToGrayscale(fill);
    }
    return fill;
}

function eightBitRGBToGrayscale(fill: string) {
    fill = fill.substr(1);
    const R = parseInt(`0x${fill.substr(0, 2)}`, 16);
    const G = parseInt(`0x${fill.substr(2, 2)}`, 16);
    const B = parseInt(`0x${fill.substr(4, 2)}`, 16);
    const grayScale = Math.round((0.3 * R) + (0.59 * G) + (0.11 * B));
    const grayScaleHex = grayScale.toString(16);
    return `#${grayScaleHex}${grayScaleHex}${grayScaleHex}`;
}

sources.forEach(filePath => {
    const fileName: string = path.basename(filePath);
    const svgFileContent: string = grunt.file.read(filePath);
    const fillRegExp: RegExp = new RegExp('fill="(.*?)"', 'g');
    const gradientRegExp: RegExp = new RegExp('stop-color="(.*?)"', 'g');
    let output: string = svgFileContent;

    let fillMatch: RegExpExecArray = null;
    while(fillMatch = fillRegExp.exec(output)) {
        const newFill: string = getGrayscaleColor(fillMatch[1]);
        output = output.replace(`fill="${fillMatch[1]}"`, `fill="${newFill}"`);
    }

    let gradientMatch: RegExpExecArray = null;
    while(gradientMatch = gradientRegExp.exec(output)) {
        const newGradient: string = getGrayscaleColor(gradientMatch[1]);
        output = output.replace(`stop-color="${gradientMatch[1]}"`, `stop-color="${newGradient}"`);
    }

    grunt.file.write(`out/${fileName}`, output);
});
