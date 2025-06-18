// csvExporter.js
const fs = require('fs');
const path = require('path');

async function exportToCSV(data, filePath = 'MyCSV') {
    console.log('writing to file');
    let underWaterMark = false;
    const csvHeaders = [];
    const csvRows = [];

    // const wStream = fs.createWriteStream(`${path.join(__dirname, fileName)}.csv`);
    const wStream = fs.createWriteStream(filePath, { flag: 'a' });

    const headers = getHeaders(data[0]);
    //console.log(headers);

    const reMappedHeaders = headers.map((header) => {
        const lastIndex = header.lastIndexOf('>');
        return header.slice(lastIndex + 1);
    })
    //const writeStream = fs.createWriteStream('my_file.csv', { flag: 'a' });
    wStream.write(reMappedHeaders.toString() + '\n');

    writeValues(data, headers);
    //console.log(values);
    wStream.close();

    // loop through each item and write the values to the file
    async function writeValues(data, headers) {
        let values = [];

        for (item of data) {
            for (let header of headers) {
                const hDepth = header.split('->');
                if (hDepth.length < 2) {
                    values.push(item[hDepth[0]]);
                } else if (hDepth.length < 3) {
                    values.push(item[hDepth[0]][hDepth[1]]);
                } else if (hDepth.length < 4) {
                    values.push(item[hDepth[0]][hDepth[1]][hDepth[2]]);
                }
            }

            // check for any values which have commas in them
            for (let value of values) {
                if (typeof (value) === 'string') {
                    if (value?.indexOf(',') > 0) {
                        values[values.indexOf(value)] = `"${value}"`;
                    }
                }
            }
            underWaterMark = wStream.write(values.toString() + '\n');
            if (!underWaterMark) {
                await new Promise((resolve) => {
                    wStream.once('drain', resolve);
                });
            }
            values = [];
        }
    }

    function getHeaders(data) {
        //console.log('inside getHeaders ', data);
        const nonObjectKeys = [];
        for (let key in data) {
            if (typeof (data[key]) === 'object') {
                for (let newKey of getHeaders(data[key])) {
                    nonObjectKeys.push(`${key}->${newKey}`);
                }
            } else {
                nonObjectKeys.push(key);
            }
        }
        return nonObjectKeys;
    }

    // try {
    //     console.log('Geting headers');
    //     // if (csvHeaders.length === 0) {
    //     //     for (const [key, value] of Object.entries(data[0])) {
    //     //         if ((typeof value === 'object') && value != null) {
    //     //             csvHeaders.push(...Object.keys(value));
    //     //         } else {
    //     //             csvHeaders.push(key);
    //     //         }
    //     //     }
    //     // }
    //     //     for (const key in data[0]) {
    //     //         // check if key is also an object
    //     //         if (typeof (data[0][key]) === 'object' && data[0][key] !== null) {
    //     //             for (const nkey in data[0][key]) {
    //     //                 csvHeaders.push(nkey);
    //     //             }
    //     //         } else {
    //     //             csvHeaders.push(key);
    //     //         }
    //     //     }
    //     //     //console.log(csvHeaders);
    //     //     csvHeaders = csvHeaders.join();
    //     //     console.log('Writing headers');
    //     //     wStream.write(csvHeaders + '\n');

    //     //     console.log('Getting Rows');
    //     //     for (const element of data) {
    //     //         //console.log('Writing Row');
    //     //         let csvRow = [];
    //     //         let newRow = '';
    //     //         for (const value of Object.values(element)) {
    //     //             if ((typeof value === 'object') && value != null) {
    //     //                 csvRow.push(...Object.values(value));
    //     //             } else {
    //     //                 csvRow.push(`"${value}"`);
    //     //             }

    //     //         }
    //     //         newRow = csvRow.join();
    //     //         wStream.write(newRow + '\n');
    //     //     }
    //     // } catch (error) {
    //     //     console.log('There was an error', error.message);
    //     // }

    //     // create the headers for the csv
    //     for (const key in data[0]) {
    //         // check if key is also an object
    //         if (typeof (data[0][key]) === 'object' && data[0][key] !== null) {
    //             for (const nkey in data[0][key]) {
    //                 csvHeaders.push(nkey);
    //             }
    //         } else {
    //             csvHeaders.push(key);
    //         }
    //     }

    //     // convert headers to comma separated string
    //     // csvRows.push(csvHeaders.map(header => `"${header}"`).join(','));
    //     // const convertedHeader = csvHeaders.map(header => `"${header}"`).join(',');
    //     for (let header of csvHeaders) {
    //         console.log(header);
    //     }
    //     wStream.write(csvHeaders.map(header => `"${header}"`).join(',') + '\n');

    //     // loop through each object and push the values 
    //     // onto the array as a comma separated string
    //     for (const row of data) {
    //         const values = csvHeaders.map((header) => {
    //             let value;
    //             switch (header) {
    //                 case 'user':
    //                     value = row.links.user;
    //                     break;
    //                 case 'context':
    //                     value = row.links.context;
    //                     break;
    //                 case 'asset':
    //                     value = row.links.asset;
    //                     break;
    //                 case 'real_user':
    //                     value = row.links.real_user;
    //                     break;
    //                 case 'account':
    //                     value = row.links.account;
    //                     break;
    //                 default:
    //                     value = row[header];
    //                     break;
    //             }
    //             return isNaN(value) ? `"${value.replace(/"/g, '""')}"` : value;
    //         });
    //         // csvRows.push(values.join(','));
    //         overWaterMark = wStream.write(values.join(',') + '\n');

    //         if (!overWaterMark) {
    //             await new Promise((resolve) => {
    //                 wStream.once('drain', resolve);
    //             });
    //         }
    //     }
    //     wStream.end();
    //     console.log('Finished writing');
    // } catch {
    //     console.log('error');
    // }
}

function exportToTxt(data, filePath = 'MyTXT') {
    console.log('Inside exportToTxt');

    const wStream = fs.createWriteStream(filePath);
    try {
        wStream.write(data.join('\n'));
        return true;
    } catch (error) {
        throw error;
    } finally {
        wStream.end();
    }
}
// (async () => {
//     const response = await axios.get('https://ckruger.instructure.com/api/v1/users/26/page_views?start_time=2023-02-15&end_time=2023-02-16');
//     exportToCSV(response.data);
// })();

module.exports = {
    exportToCSV, exportToTxt
};
