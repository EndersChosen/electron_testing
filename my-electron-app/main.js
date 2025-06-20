const path = require('path');
const fs = require('fs');
const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    clipboard,
    shell,
    Menu
} = require('electron');
//const axios = require('axios');
const convos = require('./conversations');
const csvExporter = require('./csvExporter');
const assignmentGroups = require('./assignment_groups');
const assignments = require('./assignments');
const { getPageViews, createUsers, enrollUser, addUsers } = require('./users');
const { send } = require('process');
const { deleteRequester, waitFunc } = require('./utilities');
const { emailCheck, checkCommDomain, checkUnconfirmedEmails, confirmEmail, resetEmail } = require('./comm_channels');
const {
    restoreContent,
    resetCourse,
    getCourseInfo,
    createSupportCourse,
    editCourse,
    associateCourses,
    syncBPCourses
} = require('./courses');
const quizzes_classic = require('./quizzes_classic');
const modules = require('./modules');

let mainWindow;
let suppressedEmails = [];

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        minWidth: 900,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, './preload.js')
        }
    })

    mainWindow.webContents.openDevTools();
    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {

    ipcMain.handle('axios:getConvos', async (event, data) => {
        console.log('Inside main:getConvos');
        // console.log(searchData);

        //const searchQuery = JSON.parse(searchData);
        // const domain = searchData.domain;
        // const userID = searchData.user_id;
        // const apiToken = searchData.token;
        // const subject = searchData.subject;

        // const inboxMessages = [];
        // const sentMessages = [];
        // const totalMessages = [];

        // console.log('The domain ', domain);
        // console.log('The userID ', userID);
        // console.log('The apiToken ', apiToken);

        // getting messages in 'inbox'

        // let url = `https://${domain}/api/v1/conversations?as_user_id=${userID}&per_page=100`;
        // console.log(url);

        //setting up graphql Query for messages


        // let query = `query MyQuery {
        //     legacyNode(type: User, _id: "26") {
        //         ...on User {
        //             email
        //         }
        //     }
        // }`

        let sentMessages;
        try {
            sentMessages = await convos.getConversationsGraphQL(data);
            return sentMessages;
        } catch (error) {
            throw error.message;
        }

        // const inboxMessages = await convos.getConversations(userID, url, 'inbox', apiToken);
        // if (!inboxMessages) {
        //     return false;
        // }
        // console.log('Total inbox messages: ', inboxMessages.length)

        // getting messages in 'sent'
        // const sentMessages = await convos.getConversations(userID, url, 'sent', apiToken);

        // let url = `https://${domain}/api/graphql?as_user_id=${userID}`;
        // const sentMessages = await convos.getConversationsGraphQL(url, query, variables, apiToken);
        //console.log('Returned messages: ', sentMessages);

        // console.log('Total sent messages', sentMessages.length);

        // const totalMessages = [...sentMessages];
        // console.log('Total messages ', totalMessages.length);


    });

    ipcMain.handle('axios:deleteConvos', async (event, data) => {
        console.log('inside axios:deleteConvos');

        let completedRequests = 0;
        const totalRequests = data.messages.length;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        const request = async (requestData) => {
            try {
                const response = await convos.deleteForAll(requestData);
                return response;
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        };

        let requests = [];
        for (let i = 0; i < data.messages.length; i++) {
            const requestData = {
                domain: data.domain,
                token: data.token,
                message: data.messages[i].id
            }
            requests.push({ id: i + 1, request: () => request(requestData) });
        };

        // data.messages.forEach((message) => {
        //     const requestData = {
        //         domain: data.domain,
        //         token: data.token,
        //         message: message.id
        //     }
        //     requests.push(() => request(requestData));
        // })

        const batchResponse = await batchHandler(requests);

        return batchResponse;
    });

    ipcMain.handle('axios:checkCommChannel', async (event, data) => {
        console.log('inside axios:checkCommChannel');

        try {
            const response = await emailCheck(data);
            return response;
        } catch (error) {
            throw error.message;
        }

    });

    ipcMain.handle('axios:checkCommDomain', async (event, data) => {
        console.log('inside axios:checkCommDomain');
        suppressedEmails = [];

        // handle 1000 items at a time to prevent max call stack size exceeded
        function processLargeArray(largeArray) {
            const chunkSize = 1000;
            for (let i = 0; i < largeArray.length; i += chunkSize) {
                const chunk = largeArray.slice(i, i + chunkSize);
                suppressedEmails.push(...chunk);
            }
        }
        // const fakeEmails = Array.from({ length: 20 }, (_, i) => `fake${i + 1}@example.com`);
        // suppressedEmails.push(...fakeEmails);

        try {
            const response = await checkCommDomain(data);
            processLargeArray(response);

            // suppressedEmails.push(...response);
            if (suppressedEmails.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:createAssignments', async (event, data) => {
        console.log('inside axios:createAssignments');

        let completedRequests = 0;
        let totalRequests = data.number;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        const request = async (data) => {
            try {
                // const response = await window.axios.deleteTheThings(messageData);
                const response = await assignments.createAssignments(data);
                return response;
            } catch (error) {
                //console.error('Error: ', error);
                throw error;
            } finally {
                updateProgress();
            }
        }

        let requests = [];
        for (let i = 0; i < data.number; i++) {
            requests.push({ id: i + 1, request: () => request(data) });
        }

        const batchResponse = await batchHandler(requests);
        return batchResponse;
    });

    ipcMain.handle('axios:deleteAssignments', async (event, data) => {
        console.log('inside axios:deleteAssignments');

        let completedRequests = 0;
        let totalRequests = data.number;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        const request = async (requestData) => {
            try {
                // const response = await window.axios.deleteTheThings(messageData);
                const response = await assignments.deleteAssignments(requestData);
                return response;
            } catch (error) {
                // console.error('Error: ', error);
                throw error;
            } finally {
                updateProgress();
            }
        }

        let requests = [];
        for (let i = 0; i < data.assignments.length; i++) {
            const requestData = {
                domain: data.domain,
                token: data.token,
                course_id: data.course_id,
                id: data.assignments[i]?.id || data.assignments[i]
            };
            requests.push({ id: i + 1, request: () => request(requestData) });
        }

        const batchResponse = await batchHandler(requests);
        console.log('Finished deleting assignments.');
        return batchResponse;
    });

    ipcMain.handle('axios:getEmptyAssignmentGroups', async (event, data) => {
        console.log('Inside axios:getEmptyAssignmentGroups')

        try {
            const aGroups = await assignmentGroups.getEmptyAssignmentGroups(data);

            return aGroups;
        } catch (error) {
            throw error.message;
        }

    });

    ipcMain.handle('axios:deleteEmptyAssignmentGroups', async (event, data) => {
        console.log('Inside axios:deleteEmptyAssignmentGroups')

        let completedRequests = 0;
        const totalRequests = data.content.length;
        // let batchResponse = null;
        // let failed = [];

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }


        const request = async (data) => {
            try {
                const response = await assignmentGroups.deleteEmptyAssignmentGroup(data);
                return response;
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        }

        let requests = [];
        let requestCounter = 1;
        data.content.forEach((group) => {
            const requestData = {
                domain: data.url,
                token: data.token,
                groupID: group._id,
                id: requestCounter
            }
            requests.push(() => request(requestData));
            requestCounter++;
        });

        // batchResponse = await batchHandler(requests);
        // failed = batchResponse

        const responses = [];
        for (let request of requests) {
            responses.push(await request());
        }

        const formattedResponses = {
            successful: [], failed: []
        };

        formattedResponses.successful = responses.filter(response => !isNaN(response));
        formattedResponses.failed = responses.filter(response => isNaN(response));

        console.log('Finished Deleting Empty Assignment groups.');
        return formattedResponses;
    });

    ipcMain.handle('axios:getNoSubmissionAssignments', async (event, data) => {
        console.log('main.js > axios:getNoSubmissionAssignments');

        try {
            const result = await assignments.getNoSubmissionAssignments(data.domain, data.course_id, data.token, data.graded);

            return result;
        } catch (error) {
            console.log(error);
            throw error.message;
        }

    });

    ipcMain.handle('axios:getUnpublishedAssignments', async (event, data) => {
        console.log('main.js > axios:getUnpublishedAssignments');

        try {
            const results = await assignments.getUnpublishedAssignments(data.domain, data.course, data.token);

            return results;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:getNonModuleAssignments', async (event, data) => {
        console.log('main.js > axios:getNonModuleAssignments');

        try {
            const results = await assignments.getNonModuleAssignments(data.domain, data.course, data.token);
            return results;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:getOldAssignments', async (event, data) => {
        console.log('main.js > axios:getOldAssignments');

        try {
            const response = await assignments.getOldAssignmentsGraphQL(data);
            return response;
        } catch (error) {
            throw error.message
        }
    })

    ipcMain.handle('axios:deleteOldAssignments', async (event, data) => {
        console.log('main.js > axios:deleteOldAssignments');

        console.log('The data in main: ', data);
        return;
    });

    ipcMain.handle('axios:getImportedAssignments', async (event, data) => {
        console.log('main.js > axios:getImportedAssignments');

        try {
            const importedAssignments = await assignments.getImportedAssignments(data);
            return importedAssignments;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:keepAssignmentsInGroup', async (event, data) => {
        console.log('main.js > axios:keepAssignmentsInGroup');

        try {
            const response = await assignments.getAssignmentsInOtherGroups(data);
            return response;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:getAssignmentsToMove', async (event, data) => {
        console.log('main.js > axios:getAssignmentsToMove');

        // 1. Get all assignments
        // 2. Get assignment group id of first assignment
        // 3. Move all assignments to that group

        try {
            const results = await assignments.getAssignmentsToMove(data.domain, data.course, data.token);
            return results;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:moveAssignmentsToSingleGroup', async (event, data) => {
        console.log('main.js > axios:moveAssignmentsToSingleGroup');

        let completedRequests = 0;
        let totalRequests = data.number;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        const request = async (data) => {
            try {
                const response = await assignments.moveAssignmentToGroup(data)
                return response;
            } catch (error) {
                throw `status code ${error.status} - ${error.message}`;
            } finally {
                updateProgress();
            }
        }

        const requests = [];
        let requestCounter = 1;
        for (let assignment of data.assignments) {
            const requestData = {
                url: data.url,
                token: data.token,
                id: assignment._id,
                groupID: data.groupID
            }
            requests.push({ id: requestCounter, request: () => request(requestData) });
            requestCounter++;
        }

        const batchResponse = await batchHandler(requests);
        return batchResponse;
    });
    ipcMain.handle('axios:deleteAssignmentGroupAssignments', async (event, data) => {
        console.log('main.js > axios:deleteAssignmentGroupAssignments');

        let completedRequests = 0;
        let totalRequests = data.number;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        // try to delete the assignment group and all assignments
        const request = async (requestData) => {
            return await assignments.deleteAssignmentGroupWithAssignments(requestData)
        }
        try {
            const response = await request(data);
            return response.data;
        } catch (error) {
            console.log(error);
            throw error.message;
        }

        // const requests = [];
        // let requestCounter = 1;
        // for (let assignment of data.assignments) {
        //     const requestData = {
        //         url: data.url,
        //         token: data.token,
        //         id: assignment._id,
        //         groupID: data.groupID
        //     }
        //     requests.push({ id: requestCounter, request: () => request(requestData) });
        //     requestCounter++;
        // }

        // const batchResponse = await batchHandler(requests);
        // return batchResponse;
    });


    ipcMain.handle('axios:createAssignmentGroups', async (event, data) => {
        console.log('Inside axios:createAssignmentGroups')

        let completedRequests = 0;
        let totalRequests = data.number;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        const request = async (data) => {
            try {
                const response = await assignmentGroups.createAssignmentGroups(data);
                return response;
            } catch (error) {
                throw error
            } finally {
                updateProgress();
            }
        };

        const requests = [];
        for (let i = 0; i < totalRequests; i++) {
            requests.push({ id: i + 1, request: () => request(data) });
        }

        const batchResponse = await batchHandler(requests);

        return batchResponse;
    });
    // ipcMain.handle('axios:deleteTheThings', async (event, data) => {
    //     console.log('Inside axios:deleteTheThings')

    //     // const result = deleteRequester(data.content, data.url, null, data.token);
    //     // const result = await assignmentGroups.deleteEmptyAssignmentGroups(data.domain, data.course, data.token, data.groups);
    //     const batchResponse = await batchHandler(data, data.action);

    //     return result;
    // });

    ipcMain.handle('axios:getPageViews', async (event, data) => {
        console.log('main.js > axios:getPageViews');

        let response;
        try {
            response = await getPageViews(data);
        } catch (error) {
            throw error.message
        }

        // if (!response) {
        //     return response;
        // }
        // console.log(response.length);
        if (response.length > 0) {
            //const filteredResults = convertToPageViewsCsv(result);

            const filename = `${data.user}_page_views.csv`;
            const fileDetails = getFileLocation(filename);
            if (fileDetails) {
                await csvExporter.exportToCSV(response, fileDetails);
            } else {
                return 'cancelled';
            }
            return true;
        } else {
            console.log('no page views');
            return false;
        }
    });

    ipcMain.handle('axios:restoreContent', async (event, data) => {
        console.log('main.js > axios:restoreContent');

        const totalNumber = data.values.length;
        let completedRequests = 0;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalNumber) * 100);
        };

        const request = async (requestData) => {
            try {
                const response = await restoreContent(requestData);
                return response;
            } catch (error) {
                throw error
            } finally {
                updateProgress();
            }
        };

        const requests = [];
        let requestID = 1;
        data.values.forEach((value) => {
            const requestData = {
                domain: data.domain,
                token: data.token,
                course_id: data.courseID,
                context: data.context,
                value: value
            };
            requests.push({ id: requestID, request: () => request(requestData) });
            requestID++;
        });

        const batchResponse = await batchHandler(requests);
        return batchResponse;
    });

    ipcMain.handle('axios:resetCourses', async (event, data) => {
        console.log('main.js > axios:resetCourses');

        let completedRequests = 0;
        const totalRequests = data.courses.length;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100)
        }

        const request = async (requestData) => {
            try {
                const response = await resetCourse(requestData);
                return response;
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        }

        const requests = [];
        let requestID = 1;
        data.courses.forEach((course) => {
            const requestData = {
                domain: data.domain,
                token: data.token,
                course: course
            };
            requests.push({ id: requestID, request: () => request(requestData) });
            requestID++;
        })

        const batchResponse = await batchHandler(requests);
        return batchResponse;
    });

    ipcMain.handle('axios:createSupportCourse', async (event, data) => {
        console.log("Inside axios:createSupportCourse");
        // 1. Create the course
        // 2. Add options

        // creating the course
        let response;
        try {
            response = await createSupportCourse(data);
            console.log('Finished creating course. Checking options....');
        } catch (error) {
            throw `${error.message}`;
        }

        data.course_id = response.id;
        let totalUsers = null;

        // check other options 
        try {
            if (data.course.blueprint.state) { // do we need to make it a blueprint course 
                console.log('Enabling blueprint...');
                await enableBlueprint(data);
                const associatedCourses = data.course.blueprint.associated_courses;

                // loop through and create basic courses to be associated to the blueprint
                const requests = [];
                for (let i = 0; i < associatedCourses; i++) {
                    const courseData = {
                        ...data,
                        course: { ...data.course }
                    };
                    courseData.course.name = `${data.course.name} - AC ${1 + i}`;

                    const request = async (courseData) => {
                        try {
                            return await createSupportCourse(courseData);
                        } catch (error) {
                            throw error;
                        }
                    };
                    requests.push({ id: i + 1, request: () => request(courseData) });
                }

                // create the courses to be used to associate
                console.log('Creating any associated courses...');
                const newCourses = await batchHandler(requests);
                const newCourseIDS = newCourses.successful.map(course => course.value.id);
                console.log('Finished creating associated courses.')

                const acCourseData = {
                    domain: data.domain,
                    token: data.token,
                    bpCourseID: data.course_id,
                    associated_course_ids: newCourseIDS
                };

                console.log('Linking associated courses to blueprint...')
                const associateRequest = await associateCourses(acCourseData); // associate the courses to the BP
                // await waitFunc(2000);
                const migrationRequest = await syncBPCourses(acCourseData);
                console.log('Finished associating courses.');
            }

            if (data.course.addUsers.state) { // do we need to add users
                const usersToEnroll = {
                    domain: data.domain,
                    token: data.token,
                    course_id: data.course_id,
                    students: null,
                    teachers: null
                };

                // genereate randomUsers to add to Canvas
                usersToEnroll.students = createUsers(data.course.addUsers.students, data.email);
                usersToEnroll.teachers = createUsers(data.course.addUsers.teachers, data.email);

                // add users to Canvas
                console.log('Adding users to Canvas')
                const userResponse = await addUsersToCanvas(usersToEnroll);
                const userIDs = userResponse.successful.map(user => user.value); // store the successfully created user IDs
                console.log('Finished adding users to Canvas.');

                // enroll users to course
                console.log('Enrolling users to course.');
                const enrollResponse = await enrollUsers(usersToEnroll, userIDs);
                totalUsers = enrollResponse.successful.length;
                console.log('Finished enrolling users in the course.');
            }

            if (data.course.addAssignments.state) {     // do we need to add assignments
                console.log('creating assignments....');

                const request = async (requestData) => {
                    try {
                        return await assignments.createAssignments(requestData);
                    } catch (error) {
                        throw error;
                    }
                };

                const requests = [];
                for (let i = 0; i < data.course.addAssignments.number; i++) {
                    const requestData = {
                        domain: data.domain,
                        token: data.token,
                        course: data.course_id,
                        name: `Assignment ${i + 1}`,
                        submissionTypes: "online_upload",
                        grade_type: "points",
                        points: 10,
                        publish: "published",
                        peer_reviews: false,
                        anonymous: false
                    };
                    requests.push({ id: i + 1, request: () => request(requestData) });
                }

                const assignmentResponses = await batchHandler(requests);
                console.log('finished creating assignments.');
            }
        } catch (error) {
            throw error.message;
        }


        return { course_id: data.course_id, status: 200, totalUsersEnrolled: totalUsers };
    });

    ipcMain.handle('axios:createBasicCourse', async (event, data) => {
        console.log('main.js > axios:createBasicCourse');

        let completedRequests = 0;
        const totalRequests = data.acCourseNum;

        const request = async (requestData) => {
            try {
                const response = await createSupportCourse(requestData)
                return response;
            } catch (error) {
                throw error;
            }
        };

        const requests = [];
        for (let i = 0; i < totalRequests; i++) {
            const requestData = {
                domain: data.domain,
                token: data.token
            };
            requests.push({ id: i + 1, request: () => request(requestData) });
        }

        const batchResponse = await batchHandler(requests);
        return batchResponse;
    });


    ipcMain.handle('axios:associateCourses', async (event, data) => {
        console.log('main.js > axios:associateCourses');

        // first associate the courses to the BP
        try {
            const associateRequest = await associateCourses(data); // associate the courses to the BP
            const migrationRequest = await syncBPCourses(data);
            return migrationRequest.workflow_state;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:getCourseInfo', async (event, data) => {
        console.log('getting course info');

        try {
            return await getCourseInfo(data);
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:addAssociateCourse', async (event, data) => {
        console.log('main.js > axios:addAssociateCourse');

        const totalRequests = data.acCourseNum;
        let completedRequests = 0;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        };

        const request = async (requestD) => {
            try {
                const response = await associateCourses(requestD);
                return response;
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        };

        const requests = [];
        for (let i = 0; i < totalRequests; i++) {
            const requestData = {
                domain: data.domain,
                token: data.token,
                bp_course: data.bpCourseID,
                ac_course
            }
        }
    });

    ipcMain.handle('axios:resetCommChannel', async (event, data) => {
        try {
            const response = await resetEmail(data);
            return response;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:checkUnconfirmedEmails', async (event, data) => {
        try {
            const response = await checkUnconfirmedEmails(data); //returns a data stream to write to file
            const filePath = getFileLocation('unconfirmed_emails.csv')
            const wStream = fs.createWriteStream(filePath);

            response.pipe(wStream);

            return new Promise((resolve, reject) => {
                wStream.on('finish', resolve)
                wStream.on('error', (error) => {
                    reject(error);
                })
            }).catch((error) => {
                if (error.code === 'EBUSY') {
                    throw new Error('File write failed. resource busy, locked or open. Make sure you\'re not trying to overwrite a file currently open.');
                }
                throw new Error('File write failed: ', error.message);
            });
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:confirmEmails', async (event, data) => {
        console.log('main.js > axios:resetCourses');

        let completedRequests = 0;
        const totalRequests = data.emails.length;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100)
        }

        const request = async (requestData) => {
            try {
                const response = await confirmEmail(requestData);
                return response;
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        }

        const requests = [];
        let requestID = 1;
        data.emails.forEach((email) => {
            const requestData = {
                domain: data.domain,
                token: data.token,
                email: email
            };
            requests.push({ id: requestID, request: () => request(requestData) });
            requestID++;
        })

        const batchResponse = await batchHandler(requests);
        let confirmedCount = 0;
        batchResponse.successful.forEach((success) => {
            if (success.id.confirmed) {
                confirmedCount++;
            }
        });
        const reMappedResponse = {
            failed: batchResponse.failed,
            successful: batchResponse.successful,
            confirmed: confirmedCount
        };
        return reMappedResponse;
    })

    ipcMain.handle('axios:resetEmails', async (event, data) => {
        const fileContents = await getFileContents('txt');
        if (fileContents != 'cancelled') {
            const emails = removeBlanks(fileContents.split(/\r?\n|\r|\,/))
                .map((email) => { // remove spaces
                    return email.trim();
                });

            const totalRequests = emails.length;
            let completedRequests = 0;
            let successful = [];
            let failed = [];

            const updateProgress = () => {
                completedRequests++;
                mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
            };

            const request = async (requestData) => {
                try {
                    const response = await resetEmail(requestData);
                    successful.push({
                        id: requestData.id,
                        status: 'fulfilled',
                        value: response
                    });
                    return response;
                } catch (error) {
                    failed.push({
                        id: requestData.id,
                        reason: error.message
                    })
                    throw error;
                } finally {
                    updateProgress();
                }
            };

            const requests = [];
            for (let i = 0; i < emails.length; i++) {
                const requestData = {
                    domain: data.domain,
                    token: data.token,
                    region: data.region,
                    email: emails[i],
                };
                requests.push({ id: i + 1, request_response: await request(requestData) });
            }



            // const batchResponse = await batchHandler(requests);
            console.log('Finished processing emails.');
            return { successful, failed };
        } else {
            throw new Error('Cancelled');
        }
    });

    ipcMain.handle('axios:getClassicQuizzes', async (event, data) => {
        console.log('main.js > axios:getClassicQuizzes');
        try {
            const quizzes = await quizzes_classic.getClassicQuizzes(data);
            return quizzes;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:createClassicQuizzes', async (event, data) => {
        console.log('main.js > axios:createClassicQuizzes');

        try {
            const quizzes = await createClassicQuizzes(data);
            // get the IDs of the successfully created quizzes to then create questions in
            return quizzes;
        } catch (error) {
            throw error.message;
        }
    })

    ipcMain.handle('axios:createClassicQuestions', async (event, data) => {
        console.log('main.js > axios:createClassicQuestions');

        const totalNumber = data.quizzes.length;
        let completedRequests = 0;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalNumber) * 100);
        }

        const request = async (requestData) => {
            try {
                return await quizzes_classic.createQuestions(requestData);
            } catch (error) {
                throw error
            } finally {
                updateProgress();
            }
        };

        const requests = [];
        for (let i = 0; i < totalNumber; i++) {
            const requestData = {
                domain: data.domain,
                token: data.token,
                course_id: data.course_id,
                quiz_id: data.quizzes[i],
                question_data: data.questionTypes
            };
            requests.push({ id: i + 1, request: () => request(requestData) });
        }

        const batchResponse = await batchHandler(requests);
        return batchResponse;

    });

    ipcMain.handle('axios:deleteClassicQuizzes', async (event, data) => {
        console.log('main.js > axios:deleteClassicQuizzes');

        try {
            const totalNumber = data.quizzes.length;
            let completedRequests = 0;

            const updateProgress = () => {
                completedRequests++;
                mainWindow.webContents.send('update-progress', (completedRequests / totalNumber) * 100);
            }

            const request = async (requestData) => {
                try {
                    return await quizzes_classic.deleteClassicQuiz(requestData);
                } catch (error) {
                    throw error;
                } finally {
                    updateProgress();
                }
            };
            const requests = [];
            for (let i = 0; i < totalNumber; i++) {
                const requestData = {
                    domain: data.domain,
                    token: data.token,
                    course_id: data.courseID,
                    quiz_id: data.quizzes[i]._id
                };
                requests.push({ id: i + 1, request: () => request(requestData) });
            }
            const batchResponse = await batchHandler(requests);
            return batchResponse;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:createNQQuestions', async (event, data) => {
        console.log('main.js > axios:createNQQuestions');

        let completedRequests = 0;
        const totalRequests = data.num_questions;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }


        const request = async (requestData) => {
            try {
                return await quizzes.createNQQuestions(requestData);
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        }

        const requests = [];
        for (let i = 0; i < totalRequests; i++) {
            const requestData = {
                domain: data.domain,
                token: data.token,
                course_id: data.course_id,
                quiz_id: data.quiz_id,
                question_type: data.question_type
            }
            requests.push({ id: i + 1, request: () => request(requestData) });
        }

        const batchResponse = await batchHandler(requests);

        return batchResponse;
    })

    ipcMain.handle('axios:getModules', async (event, data) => {
        console.log('main.js > axios:getModules');

        try {
            const courseModules = await modules.getModules(data);
            return courseModules;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:deleteModules', async (event, data) => {
        console.log('main.js > axios:deleteModules');

        let completedRequests = 0;
        let totalRequests = data.number;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        const request = async (data) => {
            try {
                // const response = await window.axios.deleteTheThings(messageData);
                const response = await modules.deleteModule(data);
                return response;
            } catch (error) {
                console.error('Error: ', error);
                throw error;
            } finally {
                updateProgress();
            }
        }

        let requests = [];
        for (let i = 0; i < data.number; i++) {
            const requestData = {
                domain: data.domain,
                token: data.token,
                course_id: data.course_id,
                module_id: data.module_ids[i].id
            };
            requests.push({ id: i + 1, request: () => request(requestData) });
        }

        const batchResponse = await batchHandler(requests);
        console.log('Finished deleting assignments.');
        return batchResponse;
    })

    ipcMain.handle('axios:createModules', async (event, data) => {
        console.log('main.js > axios:createModules');

        let completedRequests = 0;
        const totalRequests = data.number;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        const request = async (requestData) => {
            try {
                return await modules.createModule(requestData);
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        }

        try {
            // check if the course has modules  
            const currentModules = await modules.getModules(data);
            const requests = [];
            for (let i = 0; i < totalRequests; i++) {
                const requestData = {
                    domain: data.domain,
                    token: data.token,
                    course_id: data.course_id,
                    module_name: "Module " + (currentModules.length + i + 1)
                };
                requests.push({ id: i + 1, request: () => request(requestData) });
            }

            const batchResponse = await batchHandler(requests);
            return batchResponse;
        } catch (error) {
            throw error.message;
        }
    })

    ipcMain.handle('fileUpload:confirmEmails', async (event, data) => {

        let emails = [];
        // get the file contents
        try {

            const fileContent = await getFileContents('txt');
            emails = removeBlanks(fileContent.split(/\r?\n|\r|\,/))
                .map((email) => { // remove spaces
                    return email.trim();
                });
        } catch (error) {
            throw error;
        }

        // ********************************
        // handle the bulk requests for 
        //  confirming the emails
        // ********************************
        const totalRequests = emails.length;
        let completedRequests = 0;

        mainWindow.webContents.send('email-count', totalRequests);

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        };

        const request = async (data) => {
            try {
                const response = await confirmEmail(data);
                return response;
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        }

        const requests = [];
        for (let email of emails) {
            data.email = email;
            requests.push(() => request(data));
        };

        const batchResponse = await batchHandler(requests);
        let confirmedCount = 0;
        batchResponse.successful.forEach((success) => {
            if (success.id.confirmed) {
                confirmedCount++;
            }
        });
        const reMappedResponse = {
            failed: batchResponse.failed,
            successful: batchResponse.successful,
            confirmed: confirmedCount
        };
        return reMappedResponse;
    })

    ipcMain.handle('fileUpload:resetEmails', async (event, data) => {
        const fileContent = await getFileContents('txt');

        return true;
    });
    ipcMain.handle('fileUpload:resetCourses', async (event) => {
        let courses = [];
        try {
            const fileContent = await getFileContents('txt');
            courses = removeBlanks(fileContent.split(/\r?\n|\r|\,/))
                .filter((course) => !isNaN(Number(course)))
                .map((course) => { // remove spaces
                    return course.trim();
                });
        } catch (error) {
            throw error;
        }
        return courses;
    })

    ipcMain.handle('csv:sendToCSV', async (event, data) => {
        sendToCSV(data);
    });

    ipcMain.on('csv:sendToText', () => {
        console.log('csv:sendToText');

        try {
            sendToTxt(suppressedEmails);
        } catch (error) {
            console.log('There was an error in the sendToText');
        }
    })

    ipcMain.on('testAPI:testing', () => {
        console.log('main.js > testAPI:testing');
    });

    // right click menu
    ipcMain.on('right-click', (event) => {
        const template = [
            {
                label: 'Copy',
                click: () => {
                    const text = clipboard.readText();
                    event.sender.send('context-menu-command', { command: 'copy', text: text });
                }
            },
            {
                label: 'Cut',
                click: () => {
                    event.sender.send('context-menu-command', { command: 'cut', text: null })
                }
            },
            {
                label: 'Paste',
                click: () => {
                    const text = clipboard.readText();

                    event.sender.send('context-menu-command', { command: 'paste', text: text })
                }
            },
        ]
        const menu = Menu.buildFromTemplate(template)
        menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })
    });

    ipcMain.on('shell:openExternal', (event, data) => {
        console.log('main.js > shell:openExternal');
        shell.openExternal(data);
    })

    ipcMain.on('write-text', (event, data) => {
        clipboard.writeText(data);
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

async function createClassicQuizzes(data) {
    // console.log('The data: ', data);

    // first create the quizzes
    const totalRequests = data.num_quizzes;
    let completedRequests = 0;

    const updateProgress = () => {
        completedRequests++;
        mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
    };

    const request = async (requestData) => {
        try {
            return await quizzes_classic.createQuiz(requestData)
        } catch (error) {
            throw error;
        } finally {
            updateProgress();
        }

    };

    const requests = [];
    for (let i = 0; i < totalRequests; i++) {
        const requestData = {
            domain: data.domain,
            token: data.token,
            course_id: data.course_id,
            quiz_type: data.quiz_type,
            publish: data.publish,
            num_quizzes: data.num_quizzes,
            quiz_title: `Quiz ${i + 1}`
        };
        requests.push({ id: i + 1, request: () => request(requestData) })
    }

    const batchResponse = await batchHandler(requests);
    return batchResponse;
}

async function addQuizQuestions(quizIDs, data) {

}

async function enableBlueprint(data) {
    try {
        await editCourse(data);
    } catch (error) {
        throw error
    } finally {
        console.log('Finished enabling blueprint course');
        return;
    }
}

async function addUsersToCanvas(data) {

    const request = async (requestData) => {
        try {
            return await addUsers(requestData);
        } catch (error) {
            throw error;
        }
    }

    const requests = [];

    // add student users to the requests
    for (let i = 0; i < data.students.length; i++) {
        requests.push({ id: i + 1, request: () => request({ domain: data.domain, token: data.token, user: data.students[i] }) });
    }

    // add teachers users to the requests
    for (let i = 0; i < data.teachers.length; i++) {
        requests.push({ id: i + data.students.length, request: () => request({ domain: data.domain, token: data.token, user: data.teachers[i] }) });
    }

    const batchResponse = await batchHandler(requests);
    return batchResponse;
}

async function enrollUsers(data, userIds) {

    const totalUsers = userIds.length;
    const totalStudents = data.students.length;
    const totalTeachers = data.teachers.length;

    const request = async (requestData) => {
        try {
            const response = await enrollUser(requestData);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const requests = [];
    // loop through the total users to be added
    for (let i = 0; i < totalUsers; i++) {
        let enrollType = i < totalStudents ? 'StudentEnrollment' : 'TeacherEnrollment';

        const userData = {
            domain: data.domain,
            token: data.token,
            type: enrollType,
            course_id: data.course_id,
            user_id: userIds[i]
        }
        requests.push({ id: i + 1, request: () => request(userData) });
    }

    // loop through all the teaches to be added
    // for (let t = 0; t < totalTeachers; t++){
    //     const teacherData = {
    //         domain: data.domain,
    //         token: data.token,
    //         type: 'TeacherEnrollment',
    //         user_id: userIds[counter]
    //     }
    //     requests.push({ id: counter, request: () => request(teacherData) });
    // }

    const batchResponse = await batchHandler(requests);
    return batchResponse;
}

async function getFileContents(ext) {
    const options = {
        properties: ['openFile'],
        filters: [{ name: '', extensions: [ext] }],
        modal: true
    };

    const result = await dialog.showOpenDialog(mainWindow, options);

    if (result.canceled) {
        return 'cancelled';
    } else {
        console.log(result.filePaths);
        const filePath = result.filePaths[0];
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        // const emails = removeBlanks(fileContent.split(/\r?\n|\r|,/));
        return fileContent;
    }
}

function removeBlanks(arr) {
    return arr.filter((element) => element.length > 0);
}

function sendToCSV(data) {
    console.log('inside sendToCSV()');
    //console.log(data);

    const fileDetails = getFileLocation(data.fileName)
    if (fileDetails) {
        csvExporter.exportToCSV(data.data, fileDetails);
    } else {
        return false;
    }
}

function sendToTxt(data) {
    console.log('inside sendToTxt');

    const fileDetails = getFileLocation('suppressed_emails.txt');
    if (fileDetails) {
        csvExporter.exportToTxt(data, fileDetails)
    } else {
        throw new Error('Failed to write file.');
    }
}

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

async function batchHandler(requests, batchSize = 35, timeDelay = 2000) {
    let myRequests = requests
    let successful = [];
    let failed = [];
    let retryRequests = [];
    let counter = 0;

    const processBatchRequests = async (myRequests) => {
        console.log('Inside processBatchRequests');

        retryRequests = []; // zeroing out failed requests
        // const results = [];
        for (let i = 0; i < myRequests.length; i += batchSize) {
            const batch = myRequests.slice(i, i + batchSize);
            await Promise.allSettled(batch.map(request => request.request()
                .then(response => successful.push(handleSuccess(response, request)))
                .catch(error => failed.push(handleError(error, request)))));
            // results.push(...batchResults);
            if (i + batchSize < myRequests.length) {
                await waitFunc(timeDelay);
            }
        }

        // return results;

        function handleSuccess(response, request) {
            return {
                id: request.id,
                status: 'fulfilled',
                value: response
            };
        }

        function handleError(error, request) {
            return {
                id: request.id,
                reason: error.message,
                status: error.status
            };
        }
    }

    const filterStatus = [
        404, 401, 422
    ];

    do {
        if (retryRequests.length > 0) {
            myRequests = requests.filter(request => retryRequests.some(r => r.id === request.id)); // find the request data to process the failed requests
            counter++;
            await waitFunc(timeDelay); // wait for the time delay before attempting a retry
            await processBatchRequests(myRequests);
            retryRequests = failed.filter(request => !filterStatus.includes(request.status)); // don't retry for 401, 404 or 422 errors
        } else {
            await processBatchRequests(myRequests);
            retryRequests = failed.filter(request => !filterStatus.includes(request.status)); // don't retry for 401, 404 or 422 errors
        }
    }
    while (counter < 3 && retryRequests.length > 0) // loop through if there are failed requests until the counter is ove 3

    return { successful, failed };
}
