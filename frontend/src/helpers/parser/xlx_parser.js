// /* eslint-disable no-undef */
// import { DataParser } from './parser';

// export class XLXParser extends DataParser {
//     parse(content) {
//         return new Promise((resolve) => {
//             let reader = new FileReader();
//             reader.onload = function () {
//                 let arrayBuffer = this.result,
//                     array = new Uint8Array(arrayBuffer),
//                     binaryString = String.fromCharCode.apply(null, array);
//                 let workbook = XLSX.read(binaryString, {
//                     type: "binary"
//                 });
//                 let first_sheet_name = workbook.SheetNames[0];
//                 let worksheet = workbook.Sheets[first_sheet_name];
//                 resolve(XLSX.utils.sheet_to_json(worksheet, {
//                     raw: true
//                 }));
//             }
//             reader.readAsArrayBuffer(content);
//         }
//         )
//     }
// }