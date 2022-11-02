export class Boundaries {
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
