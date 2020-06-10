import * as grunt from 'grunt';
import * as path from 'path';
import {Config} from "./Config";
import {SvgProcessor} from "./SvgProcessor";

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

// in case paths are relative
config.inputFolder = path.resolve(config.inputFolder);
config.outputFolder = path.resolve(config.outputFolder);

const svgProcessor: SvgProcessor = new SvgProcessor(config);
const sources = grunt.file.expand(`${config.inputFolder}/**/*.svg`);

function getOutputPath(filePath: string, inputBaseFolder: string, outputBaseFolder: string) {
    return `${outputBaseFolder}${filePath.replace(inputBaseFolder, '')}`;
}

sources.forEach(filePath => {
    const fileName: string = path.basename(filePath);
    const outputPath: string = getOutputPath(filePath, config.inputFolder, config.outputFolder);
    const svgFileContent: string = grunt.file.read(filePath);
    let output: string = svgFileContent;

    output = svgProcessor.processImage(output, fileName);

    grunt.file.write(outputPath, output);
});

grunt.file.write(`${config.outputFolder}/color_map.sass`, svgProcessor.generateColorMap());
