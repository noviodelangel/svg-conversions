const path = require('path');
const grunt = require('grunt');

const sources = grunt.file.expand('svg**/*.svg');

function RGBToGrayscale(fill) {
    fill = fill.substr(1);
    const R = parseInt(Number(`0x${fill.substr(0, 2)}`, 16));
    const G = parseInt(Number(`0x${fill.substr(2, 2)}`, 16));
    const B = parseInt(Number(`0x${fill.substr(4, 2)}`, 16));
    const grayScale = Math.round((0.3 * R) + (0.59 * G) + (0.11 * B));
    const grayScaleHex = grayScale.toString(16);
    return `#${grayScaleHex}${grayScaleHex}${grayScaleHex}`;
}

sources.forEach(filePath => {
    const fileName = path.basename(filePath);
    const svgFileContent = grunt.file.read(filePath);
    const fillRegExp = new RegExp('fill="(.*?)"', 'g');

    let fillMatch = null;
    let output = svgFileContent;
    while(fillMatch = fillRegExp.exec(output)) {
        const grayScaleFill = RGBToGrayscale(fillMatch[1]);
        output = output.replace(`fill="${fillMatch[1]}"`, `fill="${grayScaleFill}"`);
    }
    grunt.file.write(`out/${fileName}`, output);
});