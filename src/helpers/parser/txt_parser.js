import { DataParser } from './parser';
import Papa from 'papaparse';

export class TXTParser extends DataParser {
    constructor(options) {
        super();
        this.separators = { 0: ',', 1: '.', 2: ',', 3: ' ' }
        this.separator = options.separator;
        this.delimiter = options.delimiter;
        this.has_header = options.header
    }
    parse(content) {
        return new Promise((resolve) => {
            Papa.parse(content, {
                worker: false,
                header: this.has_header,
                delimiter: this.separators[this.separator],
                transform: (val) => {
                    if (val === "?" || val === "NA") {
                        return NaN
                    }
                    return val
                },
                // transformHeader: (val) => {
                //     return val.replace(/[^a-zA-Z0-9 ]/g, "").trim()
                // },
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: async function (result) {
                    if (this.delimiter == 1) {
                        for (let i = 0; i < result.data.length; i++) {
                            const element = result.data[i];
                            for (let j = 0; j < element.length; j++) {
                                result.data[i][j] = parseFloat(result.data[i][j].replace(/\./g, '').replace(',', '.'));
                            }
                        }
                    }
                    resolve(result.data)
                }
            })
        }
        )
    }
}