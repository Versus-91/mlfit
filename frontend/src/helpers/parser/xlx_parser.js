/* eslint-disable no-undef */
import { DataParser } from './parser';

export class XLXParser extends DataParser {
    parse(content) {
        return new Promise((resolve) => {
            var reader = new FileReader();
            reader.onload = function () {
                var arrayBuffer = this.result,
                    array = new Uint8Array(arrayBuffer),
                    binaryString = String.fromCharCode.apply(null, array);
                var workbook = XLSX.read(binaryString, {
                    type: "binary"
                });
                var first_sheet_name = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[first_sheet_name];
                resolve(XLSX.utils.sheet_to_json(worksheet, {
                    raw: true
                }));
            }
            reader.readAsArrayBuffer(content);
        }
        )
    }
}