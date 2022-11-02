export class Config {
    constructor(
        public inputFolder: string = '../../InnoTopic_Website/InnoTopicWebsite/src/assets/images/logos',
        // public inputFolder: string = 'example_data/single_color',
        public outputFolder: string = '../../InnoTopic_Website/InnoTopicWebsite/src/assets/images/logos-l/',
        // public outputFolder: string = '../out/example_data/single_color',
        public primaryColor: string = '#00acc1',
        public tolerance: number = 0.6,
        public outputMode: string = 'rgb'
    ) {
    }
}
