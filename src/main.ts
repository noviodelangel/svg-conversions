import * as grunt from 'grunt';
import * as path from 'path';
import {Config} from "./Config";
import {SvgProcessor} from "./SvgProcessor";


console.debug = () => {}

// default config
let config: Config = new Config();

// override default config
if (process.argv[2]) {
    config.inputFolder = process.argv[2];
}
if (process.argv[3]) {
    config.outputFolder = process.argv[3];
}
if (process.argv[4]) {
    config.primaryColor = process.argv[4];
}
if (process.argv[5]) {
    config.tolerance = Number(process.argv[5]);
}
if (process.argv[6]) {
    config.outputMode = process.argv[6];
}

// in case paths are relative
config.inputFolder = path.resolve(config.inputFolder);
config.outputFolder = path.resolve(config.outputFolder);

const svgProcessor: SvgProcessor = new SvgProcessor(config);
const sources = grunt.file.expand(`${config.inputFolder}/**/*.svg`);

function getOutputPath(filePath: string, inputBaseFolder: string, outputBaseFolder: string) {
    return `${outputBaseFolder}${filePath.replace(inputBaseFolder, '')}`;
}

sources.forEach((filePath: any) => {
    const fileName: string = path.basename(filePath);
    const outputPath: string = getOutputPath(filePath, config.inputFolder, config.outputFolder);
    console.log(outputPath)
    const svgFileContent: string = grunt.file.read(filePath);
    let output: string = svgFileContent;

    output = svgProcessor.processImage(output, fileName, config.outputMode);

    grunt.file.write(outputPath, output);
});

if (config.outputMode === 'css_vars') {
    grunt.file.write(`${config.outputFolder}/color_map.sass`, svgProcessor.generateColorMap());
}
