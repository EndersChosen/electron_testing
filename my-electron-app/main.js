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
const { getPageViews, createUsers, enrollUser, addUsers, getCommChannels, updateNotifications } = require('./users');
const { send } = require('process');
const { deleteRequester, waitFunc } = require('./utilities');
const { emailCheck, getBouncedData, checkCommDomain, checkUnconfirmedEmails, confirmEmail, resetEmail } = require('./comm_channels');
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
const quizzes_nq = require('./quizzes_nq');
const discussions = require('./discussions');
const pages = require('./pages');
const sections = require('./sections');
const sisImports = require('./sis_imports');

let mainWindow;
let suppressedEmails = [];

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        minWidth: 900,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, './preload.js')
        }
    })

    // Hide DevTools on startup; uncomment to open automatically during development
    // mainWindow.webContents.openDevTools();
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

    ipcMain.handle('axios:getDeletedConversations', async (event, data) => {
        console.log('Inside main:getDeletedConversations');
        try {
            const results = await convos.getDeletedConversations(data);
            return results;
        } catch (error) {
            throw error.message || error;
        }
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

    // Removed duplicate handler for 'axios:resetCommChannelsByPattern' (see single definition near bottom)

    ipcMain.handle('axios:createAssignments', async (event, data) => {
        console.log('inside axios:createAssignments');

        let completedRequests = 0;
        let totalRequests = data.number;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        const request = async (requestData) => {
            try {
                // const response = await window.axios.deleteTheThings(messageData);
                const response = await assignments.createAssignments(requestData);
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
            const requestData = {
                domain: data.domain,
                token: data.token,
                course_id: data.course_id,
                anonymous: data.anonymous,
                grade_type: data.grade_type,
                name: data.name,
                peer_reviews: data.peer_reviews,
                points: data.points,
                publish: data.publish,
                submissionTypes: data.submissionTypes
            };
            requests.push({ id: i + 1, request: () => request(requestData) });
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

    ipcMain.handle('axios:getNoDueDateAssignments', async (event, data) => {
        console.log('main.js > axios:getNoDueDateAssignments');
        try {
            const results = await assignments.getNoDueDateAssignments(data.domain, data.course_id, data.token);
            return results;
        } catch (error) {
            throw error.message;
        }
    });

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

    ipcMain.handle('axios:getAssignmentsInGroup', async (event, data) => {
        console.log('main.js > axios:getAssignmentsInGroup');

        try {
            const assignmentsInGroup = await assignments.getAssignmentsInGroup(data.domain, data.token, data.group_id);
            return assignmentsInGroup;
        } catch (error) {
            throw error.message;
        }
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
                        course_id: data.course_id,
                        name: `Assignment ${i + 1}`,
                        submissionTypes: ["online_upload"],
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

            // Create Classic Quizzes if requested
            if (data.course.addCQ.state && data.course.addCQ.number > 0) {
                console.log('creating classic quizzes....');
                try {
                    await createClassicQuizzes({
                        domain: data.domain,
                        token: data.token,
                        course_id: data.course_id,
                        quiz_type: 'assignment',
                        publish: true,
                        num_quizzes: data.course.addCQ.number
                    });
                    console.log('finished creating classic quizzes.');
                } catch (error) {
                    throw error;
                }
            }

            // Create New Quizzes if requested
            if (data.course.addNQ.state && data.course.addNQ.number > 0) {
                console.log('creating new quizzes....');
                const totalRequests = data.course.addNQ.number;
                let completedRequests = 0;
                const updateProgress = () => {
                    completedRequests++;
                    mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
                };

                const request = async (requestData) => {
                    try {
                        return await quizzes_nq.createNewQuiz(requestData);
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
                        quiz_title: `New Quiz ${i + 1}`,
                        published: true,
                        grading_type: 'points',
                    };
                    requests.push({ id: i + 1, request: () => request(requestData) });
                }

                await batchHandler(requests);
                console.log('finished creating new quizzes.');
            }

            // Create Discussions if requested
            if (data.course.addDiscussions.state && data.course.addDiscussions.number > 0) {
                console.log('creating discussions....');
                const totalRequests = data.course.addDiscussions.number;
                let completedRequests = 0;
                const updateProgress = () => {
                    completedRequests++;
                    mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
                };
                const request = async (requestData) => {
                    try {
                        return await discussions.createDiscussion(requestData);
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
                        title: `Discussion ${i + 1}`,
                        message: '',
                        published: true,
                    };
                    requests.push({ id: i + 1, request: () => request(requestData) });
                }
                await batchHandler(requests);
                console.log('finished creating discussions.');
            }

            // Create Pages if requested
            if (data.course.addPages.state && data.course.addPages.number > 0) {
                console.log('creating pages....');
                const totalRequests = data.course.addPages.number;
                let completedRequests = 0;
                const updateProgress = () => {
                    completedRequests++;
                    mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
                };
                const request = async (requestData) => {
                    try {
                        return await pages.createPage(requestData);
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
                        title: `Page ${i + 1}`,
                        body: '',
                        published: true,
                    };
                    requests.push({ id: i + 1, request: () => request(requestData) });
                }
                await batchHandler(requests);
                console.log('finished creating pages.');
            }

            // Create Modules if requested
            if (data.course.addModules.state && data.course.addModules.number > 0) {
                console.log('creating modules....');
                const totalRequests = data.course.addModules.number;
                let completedRequests = 0;
                const updateProgress = () => {
                    completedRequests++;
                    mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
                };
                const request = async (requestData) => {
                    try {
                        return await modules.createModule(requestData);
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
                        module_name: `Module ${i + 1}`,
                    };
                    requests.push({ id: i + 1, request: () => request(requestData) });
                }
                await batchHandler(requests);
                console.log('finished creating modules.');
            }

            // Create Sections if requested
            if (data.course.addSections.state && data.course.addSections.number > 0) {
                console.log('creating sections....');
                const totalRequests = data.course.addSections.number;
                let completedRequests = 0;
                const updateProgress = () => {
                    completedRequests++;
                    mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
                };
                const request = async (requestData) => {
                    try {
                        return await sections.createSection(requestData);
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
                        name: `Section ${i + 1}`,
                    };
                    requests.push({ id: i + 1, request: () => request(requestData) });
                }
                await batchHandler(requests);
                console.log('finished creating sections.');
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

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        };

        const request = async (requestData) => {
            try {
                const response = await createSupportCourse(requestData)
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
            // Return the full migration object so callers can inspect workflow_state and other fields
            return migrationRequest;
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
        const fileContents = await getFileContentsForEmails();
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

    ipcMain.handle('axios:updateClassicQuiz', async (event, data) => {
        console.log('main.js > axios:updateClassicQuiz');

        try {
            return await quizzes_classic.updateClassicQuiz(data);
        } catch (error) {
            throw error.message;
        }
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

    ipcMain.handle('axios:getAssignmentsInModules', async (event, data) => {
        console.log('main.js > axios:getAssignmentsInModules');
        try {
            const result = await assignments.getAssignmentsInModules(data);
            return result;
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

    ipcMain.handle('axios:updateNotifications', async (event, data) => {
        console.log('main.js > axios:updateNotifications');

        try {
            const { domain, token, user, commChannel, frequency } = data;

            await updateNotifications(frequency, domain, user, commChannel, token);

            return { success: true, data: 'Notifications updated successfully' };
        } catch (error) {
            console.error('Error updating notifications:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('axios:getCommChannels', async (event, data) => {
        console.log('main.js > axios:getCommChannels');

        try {
            const { domain, token, user } = data;

            const channels = await getCommChannels(domain, user, token);

            return { success: true, data: channels };
        } catch (error) {
            console.error('Error fetching communication channels:', error);
            return { success: false, error: error.message };
        }
    })

    ipcMain.handle('fileUpload:confirmEmails', async (event, data) => {

        let emails = [];
        // get the file contents
        try {

            const fileContent = await getFileContentsForEmails();
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
        const fileContent = await getFileContentsForEmails();

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

    // Write CSV directly to a provided full path (no dialog)
    ipcMain.handle('csv:writeAtPath', async (event, payload) => {
        try {
            const { fullPath, data } = payload || {};
            if (!fullPath || !data) throw new Error('fullPath and data are required');
            await csvExporter.exportToCSV(data, fullPath);
            return true;
        } catch (err) {
            console.error('csv:writeAtPath error:', err);
            throw err;
        }
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

    // Select and parse a list of user IDs (txt or csv)
    ipcMain.handle('fileUpload:getUserIdsFromFile', async () => {
        // Reuse getFileContentsForEmails dialog and parsing flow, then map to numeric IDs
        const fileContent = await getFileContentsForEmails();
        if (fileContent === 'cancelled') return 'cancelled';

        // fileContent comes back as raw text with newlines when txt, or joined emails for csv parser.
        const tokens = removeBlanks(fileContent.split(/\r?\n|\r|,|\s+/));
        // Keep only numeric values for user IDs
        const ids = tokens.filter((v) => v && !isNaN(Number(v))).map((v) => v.trim());
        return ids;
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

async function getFileContentsForEmails() {
    const options = {
        properties: ['openFile'],
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        modal: true
    };

    const result = await dialog.showOpenDialog(mainWindow, options);

    if (result.canceled) {
        return 'cancelled';
    } else {
        console.log(result.filePaths);
        const filePath = result.filePaths[0];
        const fileContent = await fs.promises.readFile(filePath, 'utf8');

        // Determine file type based on extension
        const fileExt = path.extname(filePath).toLowerCase();

        if (fileExt === '.csv') {
            try {
                return parseEmailsFromCSV(fileContent);
            } catch (error) {
                throw new Error(`CSV parsing error: ${error.message}`);
            }
        } else {
            // Handle as text file (original behavior)
            return fileContent;
        }
    }
}

function parseEmailsFromCSV(csvContent) {
    const lines = csvContent.split(/\r?\n/);
    if (lines.length === 0) return '';

    // Find the header row and locate the email column
    const headerRow = lines[0];
    const headers = parseCSVRow(headerRow);

    // Look for email-related columns (case insensitive)
    let emailColumnIndex = -1;
    const emailColumnNames = ['path', 'email', 'email_address', 'communication_channel_path'];

    for (let i = 0; i < headers.length; i++) {
        const headerLower = headers[i].toLowerCase().trim();
        if (emailColumnNames.includes(headerLower)) {
            emailColumnIndex = i;
            break;
        }
    }

    if (emailColumnIndex === -1) {
        const availableHeaders = headers.map(h => `"${h}"`).join(', ');
        throw new Error(`Could not find email column in CSV. Expected column names: ${emailColumnNames.join(', ')}. Available columns: ${availableHeaders}`);
    }

    // Extract emails from the specified column
    const emails = [];
    let emailCount = 0;
    for (let i = 1; i < lines.length; i++) { // Skip header row
        const line = lines[i].trim();
        if (line) {
            const row = parseCSVRow(line);
            if (row[emailColumnIndex] && row[emailColumnIndex].includes('@')) {
                emails.push(row[emailColumnIndex].trim());
                emailCount++;
            }
        }
    }

    console.log(`Parsed CSV: Found ${emailCount} emails from column "${headers[emailColumnIndex]}"`);

    if (emailCount === 0) {
        throw new Error(`No valid email addresses found in the "${headers[emailColumnIndex]}" column. Please ensure the column contains email addresses with @ symbols.`);
    }

    return emails.join('\n');
}

function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // Add the last field
    result.push(current);

    return result;
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

// SIS Import IPC Handlers
ipcMain.handle('sis:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (result.canceled) {
        return null;
    }

    return result.filePaths[0];
});

ipcMain.handle('sis:previewData', async (event, fileType, rowCount, emailDomain = '@school.edu', authProviderId = '', allOptions = {}) => {
    try {
        let csvContent = '';

        // Extract individual options from the consolidated object
        const enrollmentOptions = allOptions.enrollmentOptions || {};
        const userOptions = allOptions.userOptions || {};
        const accountOptions = allOptions.accountOptions || {};
        const termOptions = allOptions.termOptions || {};
        const courseOptions = allOptions.courseOptions || {};
        const sectionOptions = allOptions.sectionOptions || {};
        const groupCategoryOptions = allOptions.groupCategoryOptions || {};
        const groupOptions = allOptions.groupOptions || {};
        const groupMembershipOptions = allOptions.groupMembershipOptions || {};
        const adminOptions = allOptions.adminOptions || {};
        const loginOptions = allOptions.loginOptions || {};
        const crossListingOptions = allOptions.crossListingOptions || {};
        const userObserverOptions = allOptions.userObserverOptions || {};
        const changeSisIdOptions = allOptions.changeSisIdOptions || {};
        const differentiationTagSetOptions = allOptions.differentiationTagSetOptions || {};
        const differentiationTagOptions = allOptions.differentiationTagOptions || {};
        const differentiationTagMembershipOptions = allOptions.differentiationTagMembershipOptions || {};

        switch (fileType) {
            case 'users':
                csvContent = sisImports.generateUsersCSV(rowCount, emailDomain, authProviderId, userOptions);
                break;
            case 'accounts':
                csvContent = sisImports.generateAccountsCSV(rowCount, accountOptions);
                break;
            case 'terms':
                csvContent = sisImports.generateTermsCSV(rowCount, termOptions);
                break;
            case 'courses':
                csvContent = sisImports.generateCoursesCSV(rowCount, courseOptions);
                break;
            case 'sections':
                csvContent = sisImports.generateSectionsCSV(rowCount, sectionOptions);
                break;
            case 'enrollments':
                csvContent = sisImports.generateEnrollmentsCSV(rowCount, enrollmentOptions);
                break;
            case 'group_categories':
                csvContent = sisImports.generateGroupCategoriesCSV(rowCount, groupCategoryOptions);
                break;
            case 'groups':
                csvContent = sisImports.generateGroupsCSV(rowCount, groupOptions);
                break;
            case 'group_memberships':
                csvContent = sisImports.generateGroupMembershipsCSV(rowCount, groupMembershipOptions);
                break;
            case 'differentiation_tag_sets':
                csvContent = sisImports.generateDifferentiationTagSetsCSV(rowCount, differentiationTagSetOptions);
                break;
            case 'differentiation_tags':
                csvContent = sisImports.generateDifferentiationTagsCSV(rowCount, differentiationTagOptions);
                break;
            case 'differentiation_tag_membership':
                csvContent = sisImports.generateDifferentiationTagMembershipCSV(rowCount, differentiationTagMembershipOptions);
                break;
            case 'xlists':
                csvContent = sisImports.generateXlistsCSV(rowCount, crossListingOptions);
                break;
            case 'user_observers':
                csvContent = sisImports.generateUserObserversCSV(rowCount, userObserverOptions);
                break;
            case 'logins':
                csvContent = sisImports.generateLoginsCSV(rowCount, emailDomain, authProviderId, loginOptions);
                break;
            case 'change_sis_id':
                csvContent = sisImports.generateChangeSisIdCSV(rowCount, changeSisIdOptions);
                break;
            case 'admins':
                csvContent = sisImports.generateAdminsCSV(rowCount, emailDomain, adminOptions);
                break;
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }

        return csvContent;
    } catch (error) {
        throw new Error(`Error generating preview: ${error.message}`);
    }
});

ipcMain.handle('sis:fetchAuthProviders', async (event, domain, token, accountId = 1) => {
    try {
        const providers = await sisImports.fetchAuthenticationProviders(domain, token, accountId);
        return providers;
    } catch (error) {
        throw new Error(`Error fetching authentication providers: ${error.message}`);
    }
});

ipcMain.handle('sis:createFile', async (event, fileType, rowCount, outputPath, emailDomain = '@school.edu', authProviderId = '', allOptions = {}) => {
    try {
        // Extract individual options from the consolidated object
        const enrollmentOptions = allOptions.enrollmentOptions || {};
        const userOptions = allOptions.userOptions || {};
        const accountOptions = allOptions.accountOptions || {};
        const termOptions = allOptions.termOptions || {};
        const courseOptions = allOptions.courseOptions || {};
        const sectionOptions = allOptions.sectionOptions || {};
        const groupCategoryOptions = allOptions.groupCategoryOptions || {};
        const groupOptions = allOptions.groupOptions || {};
        const groupMembershipOptions = allOptions.groupMembershipOptions || {};
        const adminOptions = allOptions.adminOptions || {};
        const loginOptions = allOptions.loginOptions || {};
        const crossListingOptions = allOptions.crossListingOptions || {};
        const userObserverOptions = allOptions.userObserverOptions || {};
        const changeSisIdOptions = allOptions.changeSisIdOptions || {};
        const differentiationTagSetOptions = allOptions.differentiationTagSetOptions || {};
        const differentiationTagOptions = allOptions.differentiationTagOptions || {};
        const differentiationTagMembershipOptions = allOptions.differentiationTagMembershipOptions || {};

        const filePath = await sisImports.createSISImportFile(fileType, rowCount, outputPath, emailDomain, authProviderId, enrollmentOptions, userOptions, accountOptions, termOptions, courseOptions, sectionOptions, groupCategoryOptions, groupOptions, groupMembershipOptions, adminOptions, loginOptions, crossListingOptions, userObserverOptions, changeSisIdOptions, differentiationTagSetOptions, differentiationTagOptions, differentiationTagMembershipOptions);
        const fileName = path.basename(filePath);

        return {
            success: true,
            filePath: filePath,
            fileName: fileName
        };
    } catch (error) {
        throw new Error(`Error creating SIS file: ${error.message}`);
    }
});

ipcMain.handle('sis:createBulkFiles', async (event, fileTypes, rowCounts, outputPath, createZip, emailDomain = '@school.edu', authProviderId = '', enrollmentOptions = {}) => {
    try {
        const createdFiles = await sisImports.createBulkSISImport(fileTypes, rowCounts, outputPath, emailDomain, authProviderId, enrollmentOptions);

        let zipPath = null;
        if (createZip && createdFiles.length > 0) {
            // Create ZIP file using a simple approach
            const JSZip = require('jszip');
            const zip = new JSZip();

            for (const filePath of createdFiles) {
                const fileName = path.basename(filePath);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                zip.file(fileName, fileContent);
            }

            const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
            zipPath = path.join(outputPath, 'sis_import_package.zip');
            fs.writeFileSync(zipPath, zipContent);
        }

        return {
            success: true,
            files: createdFiles.map(file => path.basename(file)),
            zipPath: zipPath
        };
    } catch (error) {
        throw new Error(`Error creating bulk SIS files: ${error.message}`);
    }
});

// Progress helpers (main process)
function progressStartIndeterminate(label = 'Working...') {
    if (!mainWindow) return;
    mainWindow.webContents.send('update-progress', { mode: 'indeterminate', label });
    // Windows taskbar indeterminate
    try { mainWindow.setProgressBar(0.5, { mode: 'indeterminate' }); } catch { }
}

function progressUpdateDeterminate(processed, total) {
    if (!mainWindow) return;
    const value = total > 0 ? processed / total : 0;
    mainWindow.webContents.send('update-progress', { mode: 'determinate', value, processed, total });
    try { mainWindow.setProgressBar(value, { mode: 'normal' }); } catch { }
}

function progressTickUnknown(processed, label) {
    if (!mainWindow) return;
    mainWindow.webContents.send('update-progress', { mode: 'indeterminate', processed, label });
    try { mainWindow.setProgressBar(0.5, { mode: 'indeterminate' }); } catch { }
}

function progressDone() {
    if (!mainWindow) return;
    mainWindow.webContents.send('update-progress', { mode: 'done' });
    try { mainWindow.setProgressBar(-1, { mode: 'none' }); } catch { }
}

// Example: unknown total flow (fixes undefined completedRequests/totalRequests bug)
ipcMain.handle('axios:resetCommChannelsByPattern', async (event, data) => {
    console.log('inside axios:resetCommChannelsByPattern');

    let emailResetResponse = [];
    let moreEmails = true;
    let processed = 0;

    progressStartIndeterminate('Searching for bounced emails...');

    while (moreEmails) {
        try {
            const response = await getBouncedData(data); // returns a chunk/page
            if (response.length > 0) {
                console.log(`Found ${response.length} emails, resetting...`);
                for (const row of response) {
                    const requestData = {
                        domain: data.domain,
                        token: data.token,
                        email: row[4],
                        region: data.region
                    };
                    emailResetResponse.push(await resetEmail(requestData));
                    processed++;
                    // tick in unknown mode; if you later know a total, call progressUpdateDeterminate(...)
                    progressTickUnknown(processed, 'Resetting bounced emails...');
                }
            } else {
                moreEmails = false;
                console.log('No more emails found.');
            }
        } catch (error) {
            progressDone();
            throw error.message;
        }
    }

    progressDone();
    return emailResetResponse;
});

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
