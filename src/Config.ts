export class Config {
    constructor(public inputFolder: string = 'svg',
                public outputFolder: string = 'out',
                public primaryColor: string = '#00acc1',
                public tolerance: number = 0.2) {
    }
}