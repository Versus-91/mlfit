import { CSVParser } from './csv_parser'
import { XLXParser } from './xlx_parser'
import { TXTParser } from './txt_parser'


export class ParserFactory {
    static createParser(fileType, options) {
        switch (fileType.toLowerCase()) {
            case 'csv':
                return new CSVParser(options);
            case 'txt': {
                let parser = new TXTParser(options)
                return parser
            }
            case 'xlsx':
                return new XLXParser();
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }
    }
}
