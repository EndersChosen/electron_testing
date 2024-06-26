const path = require('path');
const fs = require('fs');
const {
    app,
    BrowserWindow,
    ipcMain,
    dialog
} = require('electron');
//const axios = require('axios');
const convos = require('./conversations');
const csvExporter = require('./csvExporter');
const assignmentGroups = require('./assignment_groups');
const assignments = require('./assignments');
const { getPageViews } = require('./users');
const { send } = require('process');
const { deleteRequester } = require('./utilities');
const { emailCheck } = require('./comm_channels');


const createWindow = () => {
    const win = new BrowserWindow({
        width: 1080,
        height: 720,
        minWidth: 900,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, './preload.js')
        }
    })

    //win.webContents.openDevTools();
    win.loadFile('index.html');
}

app.whenReady().then(() => {

    ipcMain.handle('axios:getConvos', async (event, searchData) => {
        console.log('Inside main:getConvos');
        console.log(searchData);

        //const searchQuery = JSON.parse(searchData);
        const domain = searchData.domain;
        const userID = searchData.user_id;
        const apiToken = searchData.token;
        const subject = searchData.subject;

        // const inboxMessages = [];
        // const sentMessages = [];
        // const totalMessages = [];

        console.log('The domain ', domain);
        console.log('The userID ', userID);
        console.log('The apiToken ', apiToken);

        // getting messages in 'inbox'

        // let url = `https://${domain}/api/v1/conversations?as_user_id=${userID}&per_page=100`;
        // console.log(url);

        //setting up graphql Query for messages
        let query = `
            query getMessages($userID: ID!, $nextPage: String) {
                legacyNode(_id: $userID, type: User) {
                    ... on User {
                        id
                        email
                        conversationsConnection(scope: "sent", first: 200, after: $nextPage) {
                            pageInfo {
                                hasNextPage
                                endCursor
                                startCursor
                            }
                            edges {
                                node {
                                    conversation {
                                        subject
                                        _id
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        let variables = {
            "userID": userID,
            "nextPage": ""
        };

        // let query = `query MyQuery {
        //     legacyNode(type: User, _id: "26") {
        //         ...on User {
        //             email
        //         }
        //     }
        // }`


        // const inboxMessages = await convos.getConversations(userID, url, 'inbox', apiToken);
        // if (!inboxMessages) {
        //     return false;
        // }
        // console.log('Total inbox messages: ', inboxMessages.length)

        // getting messages in 'sent'
        // const sentMessages = await convos.getConversations(userID, url, 'sent', apiToken);

        let url = `https://${domain}/api/graphql?as_user_id=${userID}`;
        const sentMessages = await convos.getConversationsGraphQL(url, query, variables, apiToken);
        //console.log('Returned messages: ', sentMessages);

        // console.log('Total sent messages', sentMessages.length);

        // const totalMessages = [...sentMessages];
        // console.log('Total messages ', totalMessages.length);

        const filteredMessages = sentMessages.filter((message) => {
            if (message.node.conversation.subject === subject) {
                return message;
            }
        });

        const formattedMesages = filteredMessages.map((message) => {
            return { subject: message.node.conversation.subject, id: message.node.conversation._id };
        });

        console.log('Total filtered messages ', formattedMesages.length);

        return formattedMesages;
    });

    ipcMain.handle('axios:deleteConvos', async (event, data) => {
        console.log('inside axios:deleteConvos');

        console.log(data.token);

        const result = await convos.bulkDeleteNew(data.messages, `https://${data.domain}/api/v1/conversations`, data.token);
        console.log('finished');

        return result;

    });

    ipcMain.handle('axios:checkCommChannel', async (event, data) => {
        console.log('inside axios:checkCommChannel');

        const mainResponse = await emailCheck(data.domain, data.token, data.region, data.email);
    });

    ipcMain.handle('axios:getEmptyAssignmentGroups', async (event, data) => {
        console.log('Inside axios:getEmptyAssignmentGroups')

        const aGroups = await assignmentGroups.getEmptyAssignmentGroups(data.domain, data.course, data.token);

        return aGroups;
    });

    ipcMain.handle('axios:deleteEmptyAssignmentGroups', async (event, data) => {
        console.log('Inside axios:deleteEmptyAssignmentGroups')
        console.log('They data: ', data);

        const result = await assignmentGroups.deleteEmptyAssignmentGroups(data.url, data.token, data.content);

        return result;
    });

    ipcMain.handle('axios:getNoSubmissionAssignments', async (event, data) => {
        console.log('main.js > axios:getNoSubmissionAssignments');

        const result = await assignments.getNoSubmissionAssignments(data.domain, data.course, data.token, data.graded);

        return result;
    });

    ipcMain.handle('axios:deleteNoSubmissionAssignments', async (event, data) => {
        console.log('main.js > axios:deleteNoSubmissionAssignments');

        const result = await assignments.deleteNoSubmissionAssignments(data.domain, data.course, data.token, data.assignments);

        return result;
    });

    ipcMain.handle('axios:getNonModuleAssignments', async (event, data) => {
        console.log('main.js > axios:getNonModuleAssignments');

        const results = await assignments.getNonModuleAssignments(data.domain, data.course, data.token);

        return results;
    });

    ipcMain.handle('axios:deleteTheThings', async (event, data) => {
        console.log('Inside axios:deleteTheThings')

        const result = deleteRequester(data.content, data.url, null, data.token);
        // const result = await assignmentGroups.deleteEmptyAssignmentGroups(data.domain, data.course, data.token, data.groups);

        return result;
    });

    ipcMain.handle('axios:getPageViews', async (event, data) => {
        console.log('main.js > axios:getPageViews');

        const results = await getPageViews(data.domain, data.token, data.user, data.start, data.end);
        if (!results) {
            return results;
        }
        console.log(results.length);
        if (results.length > 0) {
            //const filteredResults = convertToPageViewsCsv(result);

            const filename = `${data.user}_page_views.csv`;
            const fileDetails = getFileLocation(filename);
            if (fileDetails) {
                await csvExporter.exportToCSV(results, fileDetails);
            } else {
                return 'cancelled';
            }
            return true;
        } else {
            console.log('no page views');
            return 'empty';
        }
    });

    ipcMain.handle('csv:sendToCSV', async (event, data) => {
        console.log('inside cvs:sendtoCSV');
        //console.log(data);

        const fileDetails = getFileLocation('exported_convos.csv')
        if (fileDetails) {
            csvExporter.exportToCSV(data, fileDetails);
        } else {
            return false;
        }
    });

    //ipcMain.handle('')
    createWindow();

    // for mac os creates new window when activated
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })


})

// for windows and linux closes app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})

function getFileLocation(fileName) {
    const fileDetails = dialog.showSaveDialogSync({
        defaultPath: fileName,
        properties: [
            'createDirectory',
            'showOverwriteConfirmation',
        ]
    });
    return fileDetails;
}

function convertToPageViewsCsv(data) {

    const csvHeaders = [];
    const csvRows = [];

    // create the headers for the csv
    for (const key in data[0]) {
        // check if key is also an object
        if (typeof (data[0][key]) === 'object' && data[0][key] !== null) {
            for (const nkey in data[0][key]) {
                csvHeaders.push(nkey);
            }
        } else {
            csvHeaders.push(key);
        }
    }

    // convert headers to comma separated string
    csvRows.push(csvHeaders.map(header => `"${header}"`).join(','));

    // loop through each object and push the values 
    // onto the array as a comma separated string
    for (const row of data) {
        const values = csvHeaders.map((header) => {
            let value;
            switch (header) {
                case 'user':
                    value = row.links.user;
                    break;
                case 'context':
                    value = row.links.context;
                    break;
                case 'asset':
                    value = row.links.asset;
                    break;
                case 'real_user':
                    value = row.links.real_user;
                    break;
                case 'account':
                    value = row.links.account;
                    break;
                default:
                    value = row[header];
                    break;
            }
            return isNaN(value) ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
    }
    return csvRows;
}