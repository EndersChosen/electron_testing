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
const folders = require('./folders');
const files = require('./files');
const quizzes_nq = require('./quizzes_nq');
const discussions = require('./discussions');
const pages = require('./pages');
const sections = require('./sections');
const sisImports = require('./sis_imports');
const imports = require('./imports');
const groupCategories = require('./group_categories');

let mainWindow;
let suppressedEmails = [];

// Cancellation flags for comm-channel resets (module-level to avoid scope issues)
const resetEmailsCancelFlags = new Map(); // key: senderId -> boolean
const resetPatternCancelFlags = new Map(); // key: senderId -> boolean

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1400,
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

    // Cancellable subject search (per renderer)
    const getConvosControllers = new Map(); // senderId -> AbortController
    ipcMain.handle('axios:getConvos', async (event, data) => {
        console.log('Inside main:getConvos');
        const senderId = event.sender.id;
        try {
            if (getConvosControllers.has(senderId)) {
                try { getConvosControllers.get(senderId).abort('superseded'); } catch { }
            }
            const controller = new AbortController();
            getConvosControllers.set(senderId, controller);
            const sentMessages = await convos.getConversationsGraphQL({ ...data, signal: controller.signal });
            if (getConvosControllers.get(senderId) === controller) getConvosControllers.delete(senderId);
            return sentMessages;
        } catch (error) {
            try {
                const current = getConvosControllers.get(senderId);
                if (!current || current.signal.aborted || current === undefined) {
                    getConvosControllers.delete(senderId);
                }
            } catch { }
            throw error.message || error;
        }
    });
    ipcMain.handle('axios:cancelGetConvos', async (event) => {
        try {
            const senderId = event.sender.id;
            const controller = getConvosControllers.get(senderId);
            if (controller) {
                controller.abort('user_cancelled');
                getConvosControllers.delete(senderId);
                return { cancelled: true };
            }
            return { cancelled: false };
        } catch (e) { return { cancelled: false }; }
    });

    // Cancellable fetch for deleted conversations (per renderer)
    const getDeletedConvosControllers = new Map(); // key: senderId -> AbortController

    ipcMain.handle('axios:getDeletedConversations', async (event, data) => {
        console.log('Inside main:getDeletedConversations');
        const senderId = event.sender.id;
        try {
            // Abort any previous fetch for this sender
            if (getDeletedConvosControllers.has(senderId)) {
                try { getDeletedConvosControllers.get(senderId).abort('superseded'); } catch { }
            }
            const controller = new AbortController();
            getDeletedConvosControllers.set(senderId, controller);
            const results = await convos.getDeletedConversations({ ...data, signal: controller.signal });
            // Clear controller if it still matches
            if (getDeletedConvosControllers.get(senderId) === controller) getDeletedConvosControllers.delete(senderId);
            return results;
        } catch (error) {
            // Clear controller if aborted or errored and matches
            try {
                const current = getDeletedConvosControllers.get(senderId);
                if (!current || current.signal.aborted || current === undefined) {
                    getDeletedConvosControllers.delete(senderId);
                }
            } catch { }
            throw error.message || error;
        }
    });

    ipcMain.handle('axios:cancelGetDeletedConversations', async (event) => {
        try {
            const senderId = event.sender.id;
            const controller = getDeletedConvosControllers.get(senderId);
            if (controller) {
                controller.abort('user_cancelled');
                getDeletedConvosControllers.delete(senderId);
                return { cancelled: true };
            }
            return { cancelled: false };
        } catch (e) {
            return { cancelled: false };
        }
    });

    // Cancellation flags for restoring deleted conversations (per renderer)
    const restoreConvosCancelFlags = new Map(); // key: senderId -> boolean

    ipcMain.handle('axios:restoreDeletedConversations', async (event, data) => {
        console.log('Inside main:restoreDeletedConversations');

        const senderId = event.sender.id;
        // Reset cancel flag for this invocation
        restoreConvosCancelFlags.set(senderId, false);

        const rows = Array.isArray(data.rows) ? data.rows : [];
        const toInt = (v) => {
            const n = parseInt(v, 10);
            return Number.isFinite(n) ? n : null;
        };
        const normalized = rows.map(r => ({
            user_id: toInt(r.user_id),
            message_id: toInt(r.message_id),
            conversation_id: toInt(r.conversation_id)
        }));
        const valid = normalized.filter(r => r.user_id !== null && r.message_id !== null && r.conversation_id !== null);
        const skipped = rows.length - valid.length;
        console.log(`restoreDeletedConversations: processing ${valid.length} row(s), skipped ${skipped}.`);
        const total = valid.length || 1;

        const requests = valid.map((row, idx) => ({
            id: idx + 1,
            request: async () => convos.restoreConversation({
                domain: data.domain,
                token: data.token,
                user_id: row.user_id,
                message_id: row.message_id,
                conversation_id: row.conversation_id
            })
        }));

        let response = await canvasRateLimitedHandler(requests, {
            maxConcurrent: 35,
            baseDelayMs: 100,
            jitterMs: 150,
            maxRetries: 3,
            isCancelled: () => restoreConvosCancelFlags.get(senderId) === true
        });
        if ((response.successful?.length || 0) + (response.failed?.length || 0) === 0 && valid.length > 0) {
            // Fallback probe to surface a concrete error reason
            try {
                const probe = await convos.restoreConversation({
                    domain: data.domain,
                    token: data.token,
                    user_id: valid[0].user_id,
                    message_id: valid[0].message_id,
                    conversation_id: valid[0].conversation_id
                });
                response.successful.push({ id: 0, status: 'fulfilled', value: probe });
            } catch (err) {
                const status = err?.response?.status || err?.status || 0;
                const reason = err?.message || 'Unknown error';
                response.failed.push({ id: 0, status, reason });
            }
        }
        // Clean up cancel flag and include cancelled state in response
        const cancelled = restoreConvosCancelFlags.get(senderId) === true;
        restoreConvosCancelFlags.delete(senderId);
        return { ...response, cancelled };
    });

    ipcMain.handle('axios:cancelRestoreDeletedConversations', async (event) => {
        try {
            const senderId = event.sender.id;
            // Lazily create the map if not present in some edge scope
            // but it's defined above; this is just defensive.
            if (typeof restoreConvosCancelFlags.set === 'function') {
                restoreConvosCancelFlags.set(senderId, true);
                return { cancelled: true };
            }
            return { cancelled: false };
        } catch (e) {
            return { cancelled: false };
        }
    });

    // Cancellable deletion of conversations (per renderer)
    const deleteConvosCancelFlags = new Map(); // senderId -> boolean
    ipcMain.handle('axios:deleteConvos', async (event, data) => {
        console.log('inside axios:deleteConvos');
        const senderId = event.sender.id;
        deleteConvosCancelFlags.set(senderId, false);

        let completedRequests = 0;
        const totalRequests = data.messages.length;
        const updateProgress = () => {
            completedRequests++;
            try {
                mainWindow.webContents.send('update-progress', {
                    mode: 'determinate',
                    label: 'Deleting conversations',
                    processed: completedRequests,
                    total: totalRequests,
                    value: totalRequests ? (completedRequests / totalRequests) : 0
                });
            } catch { }
        };

        const requests = data.messages.map((msg, i) => ({
            id: i + 1,
            requestData: { domain: data.domain, token: data.token, message: msg.id }
        }));

        const successful = [];
        const failed = [];
        const batchSize = 35;
        const timeDelay = 2000;
        for (let i = 0; i < requests.length; i += batchSize) {
            // cancel check before starting a batch
            if (deleteConvosCancelFlags.get(senderId)) break;
            const batch = requests.slice(i, i + batchSize);
            const results = await Promise.allSettled(batch.map(r =>
                convos.deleteForAll(r.requestData)
                    .then(res => ({ ok: true, res, id: r.id }))
                    .catch(err => ({ ok: false, err, id: r.id }))
                    .finally(() => updateProgress())
            ));
            for (const r of results) {
                const val = r.value || r.reason;
                if (r.status === 'fulfilled' && val?.ok) {
                    successful.push({ id: val.id, value: val.res });
                } else {
                    const vv = r.status === 'fulfilled' ? r.value : r.reason;
                    failed.push({ id: vv?.id, reason: (vv?.err?.message || vv?.err || 'Unknown error'), status: vv?.err?.status });
                }
            }
            if (i + batchSize < requests.length && !deleteConvosCancelFlags.get(senderId)) {
                await new Promise(r => setTimeout(r, timeDelay));
            }
        }

        const cancelled = deleteConvosCancelFlags.get(senderId) === true;
        deleteConvosCancelFlags.delete(senderId);
        return { successful, failed, cancelled };
    });
    ipcMain.handle('axios:cancelDeleteConvos', async (event) => {
        try {
            const senderId = event.sender.id;
            deleteConvosCancelFlags.set(senderId, true);
            return { cancelled: true };
        } catch { return { cancelled: false }; }
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
            mainWindow.webContents.send('update-progress', {
                mode: 'determinate',
                label: 'Creating assignments',
                processed: completedRequests,
                total: totalRequests,
                value: completedRequests / totalRequests
            });
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

        const batchResponse = await batchHandler(requests, { batchSize: 35, timeDelay: 2000, isCancelled });
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

    // Create Discussions (REST) and Announcements (REST with is_announcement)
    ipcMain.handle('axios:createDiscussions', async (_event, data) => {
        console.log('inside axios:createDiscussions');
        const items = Array.isArray(data.requests) ? data.requests : [];
        let completed = 0;
        const total = items.length || 1;
        const update = () => {
            completed++;
            mainWindow?.webContents.send('update-progress', {
                mode: 'determinate', label: 'Creating discussions', processed: completed, total, value: completed / total
            });
        };
        const requests = items.map((it, idx) => ({
            id: idx + 1,
            request: async () => {
                try {
                    const payload = {
                        domain: it.domain, token: it.token, course_id: it.course_id,
                        title: it.title, message: it.message, published: !!it.published
                    };
                    const resp = await discussions.createDiscussion(payload);
                    return resp;
                } finally { update(); }
            }
        }));
        const res = await batchHandler(requests);
        return res;
    });

    ipcMain.handle('axios:createAnnouncements', async (_event, data) => {
        console.log('inside axios:createAnnouncements');
        const items = Array.isArray(data.requests) ? data.requests : [];
        let completed = 0;
        const total = items.length || 1;
        const update = () => {
            completed++;
            mainWindow?.webContents.send('update-progress', {
                mode: 'determinate', label: 'Creating announcements', processed: completed, total, value: completed / total
            });
        };
        const requests = items.map((it, idx) => ({
            id: idx + 1,
            request: async () => {
                try {
                    // Announcements use the discussions endpoint with is_announcement
                    const payload = {
                        domain: it.domain, token: it.token, course_id: it.course_id,
                        title: it.title, message: it.message, published: !!it.published
                    };
                    // Reuse discussions.createDiscussion but pass is_announcement via message prefix/body note if needed
                    const resp = await discussions.createDiscussion({ ...payload, is_announcement: true });
                    return resp;
                } finally { update(); }
            }
        }));
        const res = await batchHandler(requests);
        return res;
    });

    ipcMain.handle('axios:createPages', async (_event, data) => {
        console.log('inside axios:createPages');
        const items = Array.isArray(data.requests) ? data.requests : [];
        let completed = 0;
        const total = items.length || 1;
        const update = () => {
            completed++;
            mainWindow?.webContents.send('update-progress', {
                mode: 'determinate', label: 'Creating pages', processed: completed, total, value: completed / total
            });
        };
        const requests = items.map((it, idx) => ({
            id: idx + 1,
            request: async () => {
                try {
                    const resp = await pages.createPage({
                        domain: it.domain, token: it.token, course_id: it.course_id,
                        title: it.title, body: it.body, published: !!it.published
                    });
                    return resp;
                } finally { update(); }
            }
        }));
        const res = await batchHandler(requests);
        return res;
    });

    ipcMain.handle('axios:createSections', async (_event, data) => {
        console.log('inside axios:createSections');
        const items = Array.isArray(data.requests) ? data.requests : [];
        let completed = 0;
        const total = items.length || 1;
        const update = () => {
            completed++;
            mainWindow?.webContents.send('update-progress', {
                mode: 'determinate', label: 'Creating sections', processed: completed, total, value: completed / total
            });
        };
        const requests = items.map((it, idx) => ({
            id: idx + 1,
            request: async () => {
                try {
                    const resp = await sections.createSection({
                        domain: it.domain, token: it.token, course_id: it.course_id, name: it.name
                    });
                    return resp;
                } finally { update(); }
            }
        }));
        const res = await batchHandler(requests);
        return res;
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

    // Unified fetch for combined delete assignments flow
    // Track cancellable requests by sender
    const combinedFetchControllers = new Map(); // key: senderId, value: AbortController

    ipcMain.handle('axios:getAllAssignmentsForCombined', async (event, data) => {
        console.log('main.js > axios:getAllAssignmentsForCombined');
        try {
            // Abort any previous fetch for this sender
            const senderId = event.sender.id;
            if (combinedFetchControllers.has(senderId)) {
                try { combinedFetchControllers.get(senderId).abort('superseded'); } catch { }
            }
            const controller = new AbortController();
            combinedFetchControllers.set(senderId, controller);
            const results = await assignments.getAllAssignmentsForCombined({ ...data, signal: controller.signal });
            // clear on success
            if (combinedFetchControllers.get(senderId) === controller) combinedFetchControllers.delete(senderId);
            return results;
        } catch (error) {
            // Clear controller if it belongs to this request
            try {
                const senderId = event.sender.id;
                if (combinedFetchControllers.get(senderId)?.signal?.aborted) combinedFetchControllers.delete(senderId);
            } catch { }
            throw error.message || error;
        }
    });

    ipcMain.handle('axios:cancelAllAssignmentsForCombined', async (event) => {
        try {
            const senderId = event.sender.id;
            const controller = combinedFetchControllers.get(senderId);
            if (controller) {
                controller.abort('user_cancelled');
                combinedFetchControllers.delete(senderId);
                return { cancelled: true };
            }
            return { cancelled: false };
        } catch (e) {
            return { cancelled: false };
        }
    });

    // Cancellation flags defined at module scope

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

    // New unified imported assets fetch
    ipcMain.handle('axios:getImportedAssets', async (event, data) => {
        console.log('main.js > axios:getImportedAssets');
        try {
            return await imports.getImportedAssets(data);
        } catch (error) {
            // Surface clearer guidance for 404 (likely wrong import id)
            if (String(error.message).includes('status code 404')) {
                throw new Error('404 Not Found: The Import ID may be invalid for this course. Use "List Imports" to find a valid Import ID.');
            }
            throw error.message;
        }
    });

    ipcMain.handle('axios:listContentMigrations', async (event, data) => {
        console.log('main.js > axios:listContentMigrations');
        try {
            return await imports.listContentMigrations(data);
        } catch (error) {
            throw error.message;
        }
    });

    // Batch delete discussions by ids
    ipcMain.handle('axios:deleteDiscussions', async (event, data) => {
        console.log('main.js > axios:deleteDiscussions');

        const totalRequests = data.discussions.length;
        let completedRequests = 0;
        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        };

        const request = async (reqData) => {
            try {
                return await discussions.deleteDiscussion(reqData);
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        };

        const requests = [];
        for (let i = 0; i < totalRequests; i++) {
            const reqData = {
                domain: data.domain,
                token: data.token,
                course_id: data.course_id,
                discussion_id: data.discussions[i]?.id || data.discussions[i]
            };
            requests.push({ id: i + 1, request: () => request(reqData) });
        }

        const batchResponse = await batchHandler(requests);
        return batchResponse;
    });

    // Batch delete attachments (files)
    ipcMain.handle('axios:deleteAttachments', async (event, data) => {
        console.log('main.js > axios:deleteAttachments');

        const totalRequests = data.attachments.length;
        let completedRequests = 0;
        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        };

        const request = async (reqData) => {
            try {
                return await files.deleteFile(reqData);
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        };

        const requests = [];
        for (let i = 0; i < totalRequests; i++) {
            const reqData = {
                domain: data.domain,
                token: data.token,
                file_id: data.attachments[i]?.id || data.attachments[i]
            };
            requests.push({ id: i + 1, request: () => request(reqData) });
        }

        const batchResponse = await batchHandler(requests);
        return batchResponse;
    });

    // Batch delete group categories (for Content Tags handling)
    ipcMain.handle('axios:deleteGroupCategories', async (event, data) => {
        console.log('main.js > axios:deleteGroupCategories');
        const totalRequests = data.group_categories.length;
        let completedRequests = 0;
        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        };

        const request = async (reqData) => {
            try {
                return await groupCategories.deleteGroupCategory(reqData);
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        };

        const requests = [];
        for (let i = 0; i < totalRequests; i++) {
            const reqData = {
                domain: data.domain,
                token: data.token,
                group_category_id: data.group_categories[i]?.id || data.group_categories[i]
            };
            requests.push({ id: i + 1, request: () => request(reqData) });
        }

        const batchResponse = await batchHandler(requests);
        return batchResponse;
    });

    // Batch delete folders by ids
    ipcMain.handle('axios:deleteFolders', async (event, data) => {
        console.log('main.js > axios:deleteFolders');

        const totalRequests = data.folders.length;
        let completedRequests = 0;
        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        };

        const request = async (reqData) => {
            try {
                // Pre-check folder to avoid deleting root folders
                const info = await folders.getFolder(reqData);
                // Canvas returns root folders with parent_folder_id null
                if (
                    info && (
                        info.parent_folder_id === null ||
                        typeof info.parent_folder_id === 'undefined' ||
                        info.parent_folder_id === 'null'
                    )
                ) {
                    const err = new Error(`Folder ${info.id || reqData.folder_id} is a root folder and cannot be deleted.`);
                    err.status = 422; // Unprocessable / business rule
                    throw err;
                }
                return await folders.deleteFolder(reqData);
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        };

        const requests = [];
        for (let i = 0; i < totalRequests; i++) {
            const reqData = {
                domain: data.domain,
                token: data.token,
                folder_id: data.folders[i]?.id || data.folders[i]
            };
            requests.push({ id: i + 1, request: () => request(reqData) });
        }

        const batchResponse = await batchHandler(requests);
        return batchResponse;
    });

    // Get folder metadata for a list of folder IDs and tag root folders
    ipcMain.handle('axios:getFoldersMeta', async (event, data) => {
        console.log('main.js > axios:getFoldersMeta');
        const ids = (data.folders || []).map(f => (f?.id || f));
        const requests = ids.map((id, idx) => ({
            id: idx + 1,
            request: async () => folders.getFolder({ domain: data.domain, token: data.token, folder_id: id })
        }));
        const result = await batchHandler(requests, 35, 200);
        const meta = [];
        // successful is array of {id,status,value}
        for (const s of result.successful) {
            const f = s.value;
            meta.push({ id: f.id, parent_folder_id: f.parent_folder_id, isRoot: (f.parent_folder_id === null || f.parent_folder_id === 'null' || typeof f.parent_folder_id === 'undefined') });
        }
        // failed items: include ids for visibility
        for (const f of result.failed) {
            meta.push({ id: ids[(f.id - 1)] || null, error: f.reason, isRoot: false });
        }
        return meta;
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
            // Indicate starting course creation
            progressStartIndeterminate('Creating course...');
            response = await createSupportCourse(data);
            console.log('Finished creating course. Checking options....');
            // Update label after creation
            mainWindow.webContents.send('update-progress', { label: 'Course created. Processing options...' });
        } catch (error) {
            throw `${error.message}`;
        }

        data.course_id = response.id;
        let totalUsers = null;

        // Overall progress accounting across selected content operations
        const toInt = (v) => Math.max(0, parseInt(v ?? 0, 10) || 0);
        const counts = {
            associatedCourses: data.course.blueprint?.state ? toInt(data.course.blueprint.associated_courses) : 0,
            assignments: data.course.addAssignments?.state ? toInt(data.course.addAssignments.number) : 0,
            classicQuizzes: data.course.addCQ?.state ? toInt(data.course.addCQ.number) : 0,
            newQuizzes: data.course.addNQ?.state ? toInt(data.course.addNQ.number) : 0,
            discussions: data.course.addDiscussions?.state ? toInt(data.course.addDiscussions.number) : 0,
            pages: data.course.addPages?.state ? toInt(data.course.addPages.number) : 0,
            modules: data.course.addModules?.state ? toInt(data.course.addModules.number) : 0,
            sections: data.course.addSections?.state ? toInt(data.course.addSections.number) : 0
        };
        const totalOverallUnits = Object.values(counts).reduce((a, b) => a + b, 0);
        let processedOverallUnits = 0;

        const sendOverall = (label, processedSection, totalSection) => {
            const percent = totalOverallUnits > 0 ? (processedOverallUnits / totalOverallUnits) * 100 : 0;
            mainWindow.webContents.send('update-progress', {
                mode: 'determinate',
                processed: processedOverallUnits,
                total: totalOverallUnits,
                percent,
                label: label ?? (totalSection > 0 ? `Processing (${processedSection}/${totalSection})...` : 'Processing...')
            });
        };

        // check other options 
        try {
            if (data.course.blueprint.state) { // do we need to make it a blueprint course 
                console.log('Enabling blueprint...');
                mainWindow.webContents.send('update-progress', { label: 'Enabling blueprint...' });
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
                mainWindow.webContents.send('update-progress', { label: `Creating ${associatedCourses} associated course(s)...` });
                // Track progress while creating associated courses
                let completedRequestsAC = 0;
                const totalRequestsAC = associatedCourses;
                let processedAC = 0;
                const requestWithProgress = (fn) => async () => {
                    try {
                        return await fn();
                    } finally {
                        completedRequestsAC++;
                        processedAC++;
                        processedOverallUnits++;
                        sendOverall(`Creating associated courses (${processedAC}/${totalRequestsAC})...`, processedAC, totalRequestsAC);
                    }
                };
                const progressWrapped = requests.map((r) => ({ id: r.id, request: requestWithProgress(r.request) }));
                const newCourses = await batchHandler(progressWrapped);
                const newCourseIDS = newCourses.successful.map(course => course.value.id);
                console.log('Finished creating associated courses.')

                const acCourseData = {
                    domain: data.domain,
                    token: data.token,
                    bpCourseID: data.course_id,
                    associated_course_ids: newCourseIDS
                };

                console.log('Linking associated courses to blueprint...')
                mainWindow.webContents.send('update-progress', { label: 'Associating courses to blueprint and syncing...' });
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
                mainWindow.webContents.send('update-progress', { label: 'Creating users in Canvas...' });
                const userResponse = await addUsersToCanvas(usersToEnroll);
                const userIDs = userResponse.successful.map(user => user.value); // store the successfully created user IDs
                console.log('Finished adding users to Canvas.');

                // enroll users to course
                console.log('Enrolling users to course.');
                mainWindow.webContents.send('update-progress', { label: 'Enrolling users to course...' });
                const enrollResponse = await enrollUsers(usersToEnroll, userIDs);
                totalUsers = enrollResponse.successful.length;
                console.log('Finished enrolling users in the course.');
            }

            if (data.course.addAssignments.state) {     // do we need to add assignments
                console.log('creating assignments....');
                mainWindow.webContents.send('update-progress', { label: `Creating ${data.course.addAssignments.number} assignment(s)...` });

                const request = async (requestData) => {
                    try {
                        return await assignments.createAssignments(requestData);
                    } catch (error) {
                        throw error;
                    }
                };

                const requests = [];
                const totalRequestsAssignments = data.course.addAssignments.number;
                let processedAssignments = 0;
                const updateProgressAssignments = () => {
                    processedAssignments++;
                    processedOverallUnits++;
                    sendOverall(`Creating assignments (${processedAssignments}/${totalRequestsAssignments})...`, processedAssignments, totalRequestsAssignments);
                };
                for (let i = 0; i < totalRequestsAssignments; i++) {
                    const requestData = {
                        domain: data.domain,
                        token: data.token,
                        course_id: data.course_id,
                        name: `Assignment ${i + 1}`,
                        submissionTypes: ["online_upload"],
                        grade_type: "points",
                        points: 10,
                        publish: data.course?.contentPublish?.assignments ? "published" : "unpublished",
                        peer_reviews: false,
                        anonymous: false
                    };
                    const req = async () => {
                        try { return await request(requestData); } finally { updateProgressAssignments(); }
                    };
                    requests.push({ id: i + 1, request: req });
                }

                const assignmentResponses = await batchHandler(requests);
                console.log('finished creating assignments.');
            }

            // Create Classic Quizzes if requested
            if (data.course.addCQ.state && data.course.addCQ.number > 0) {
                console.log('creating classic quizzes....');
                mainWindow.webContents.send('update-progress', { label: `Creating ${data.course.addCQ.number} classic quiz(zes)...` });
                try {
                    await createClassicQuizzes({
                        domain: data.domain,
                        token: data.token,
                        course_id: data.course_id,
                        quiz_type: 'assignment',
                        publish: !!data.course?.contentPublish?.classicQuizzes,
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
                mainWindow.webContents.send('update-progress', { label: `Creating ${data.course.addNQ.number} new quiz(zes)...` });
                const totalRequests = data.course.addNQ.number;
                let processedNQ = 0;
                const updateProgress = () => {
                    processedNQ++;
                    processedOverallUnits++;
                    sendOverall(`Creating new quizzes (${processedNQ}/${totalRequests})...`, processedNQ, totalRequests);
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
                        published: !!data.course?.contentPublish?.newQuizzes,
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
                mainWindow.webContents.send('update-progress', { label: `Creating ${data.course.addDiscussions.number} discussion(s)...` });
                const totalRequests = data.course.addDiscussions.number;
                let processedDiscussions = 0;
                const updateProgress = () => {
                    processedDiscussions++;
                    processedOverallUnits++;
                    sendOverall(`Creating discussions (${processedDiscussions}/${totalRequests})...`, processedDiscussions, totalRequests);
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
                        published: !!data.course?.contentPublish?.discussions,
                    };
                    requests.push({ id: i + 1, request: () => request(requestData) });
                }
                await batchHandler(requests);
                console.log('finished creating discussions.');
            }

            // Create Pages if requested
            if (data.course.addPages.state && data.course.addPages.number > 0) {
                console.log('creating pages....');
                mainWindow.webContents.send('update-progress', { label: `Creating ${data.course.addPages.number} page(s)...` });
                const totalRequests = data.course.addPages.number;
                let processedPages = 0;
                const updateProgress = () => {
                    processedPages++;
                    processedOverallUnits++;
                    sendOverall(`Creating pages (${processedPages}/${totalRequests})...`, processedPages, totalRequests);
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
                        published: !!data.course?.contentPublish?.pages,
                    };
                    requests.push({ id: i + 1, request: () => request(requestData) });
                }
                await batchHandler(requests);
                console.log('finished creating pages.');
            }

            // Create Modules if requested
            if (data.course.addModules.state && data.course.addModules.number > 0) {
                console.log('creating modules....');
                mainWindow.webContents.send('update-progress', { label: `Creating ${data.course.addModules.number} module(s)...` });
                const totalRequests = data.course.addModules.number;
                let processedMods = 0;
                const updateProgress = () => {
                    processedMods++;
                    processedOverallUnits++;
                    sendOverall(`Creating modules (${processedMods}/${totalRequests})...`, processedMods, totalRequests);
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
                mainWindow.webContents.send('update-progress', { label: `Creating ${data.course.addSections.number} section(s)...` });
                const totalRequests = data.course.addSections.number;
                let processedSections = 0;
                const updateProgress = () => {
                    processedSections++;
                    processedOverallUnits++;
                    sendOverall(`Creating sections (${processedSections}/${totalRequests})...`, processedSections, totalRequests);
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

        progressDone();
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
            progressDone();
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
        if (fileContents === 'cancelled') throw new Error('Cancelled');

        // Parse, normalize and dedupe emails
        const emails = Array.from(new Set(
            removeBlanks(fileContents.split(/\r?\n|\r|\,/))
                .map((email) => String(email).trim().toLowerCase())
                .filter((email) => email.includes('@'))
        ));

        const total = emails.length;
        let processed = 0;
        const results = { successful: [], failed: [] };

        // Initial progress
        mainWindow.webContents.send('update-progress', {
            mode: 'determinate',
            label: 'Resetting communication channels',
            processed: 0,
            total,
            value: total > 0 ? 0 : 0
        });

        const { bounceReset, awsReset, bounceCheck } = require('./comm_channels');

        // Set up per-sender cancellation
        const senderId = event.sender.id;
        resetEmailsCancelFlags.set(senderId, false);
        const isCancelled = () => resetEmailsCancelFlags.get(senderId) === true;

        // Use batchHandler to process resets with retry/backoff and progress updates
        const updateProgress = () => {
            processed++;
            mainWindow.webContents.send('update-progress', {
                mode: 'determinate',
                label: 'Resetting communication channels',
                processed,
                total,
                value: total > 0 ? processed / total : 0
            });
        };

        const request = async (reqData) => {
            try {
                console.log('Resetting email:', reqData.email);
                const bounceRes = await bounceReset({ domain: reqData.domain, token: reqData.token, email: reqData.email });
                console.log('Bounce reset response:', bounceRes);
                if (Number(bounceRes?.reset || 0) > 0) {
                    await waitFunc(800);
                    try { await bounceCheck(reqData.domain, reqData.token, reqData.email); } catch { /* ignore */ }
                }
                console.log('Clearing from Suppression list', reqData.email);
                const awsRes = await awsReset({ region: reqData.region, token: reqData.token, email: reqData.email });
                console.log('AWS reset response:', awsRes);
                return { bounce: bounceRes, suppression: awsRes };
            } catch (err) {
                throw err;
            } finally {
                updateProgress();
            }
        };

        const requests = emails.map((email, idx) => ({
            id: idx + 1,
            request: () => request({ domain: data.domain, token: data.token, region: data.region, email })
        }));

        // Sequential processing (one at a time) — keep for reference
        // for (let i = 0; i < emails.length; i++) {
        //     if (isCancelled()) break;
        //     const email = emails[i];
        //     try {
        //         // Direct resets (idempotent): bounce then suppression
        //         const bounceRes = await bounceReset({ domain: data.domain, token: data.token, email });
        //         // Give Canvas a moment if it scheduled a clear, then optionally recheck
        //         if (Number(bounceRes?.reset || 0) > 0) {
        //             await waitFunc(800);
        //             try { await bounceCheck(data.domain, data.token, email); } catch { /* ignore */ }
        //         }
        //         const awsRes = await awsReset({ region: data.region, token: data.token, email });
        //         results.successful.push({ id: i + 1, status: 'fulfilled', value: { bounce: bounceRes, suppression: awsRes } });
        //     } catch (err) {
        //         results.failed.push({ id: i + 1, reason: err?.message || String(err), email });
        //     } finally {
        //         processed++;
        //         mainWindow.webContents.send('update-progress', {
        //             mode: 'determinate',
        //             label: 'Resetting communication channels',
        //             processed,
        //             total,
        //             value: total > 0 ? processed / total : 0
        //         });
        //     }
        // }

        const batchResponse = await batchHandler(requests);

        const cancelled = isCancelled();
        resetEmailsCancelFlags.delete(senderId);
        return { ...batchResponse, cancelled };
    });

    ipcMain.handle('axios:cancelResetEmails', async (event) => {
        const senderId = event.sender.id;
        resetEmailsCancelFlags.set(senderId, true);
        return { cancelled: true };
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
            mainWindow.webContents.send('update-progress', {
                mode: 'determinate',
                label: 'Creating questions',
                processed: completedRequests,
                total: totalNumber,
                value: completedRequests / totalNumber
            });
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

    ipcMain.handle('axios:getModulesSimple', async (event, data) => {
        console.log('main.js > axios:getModulesSimple');

        try {
            const courseModules = await modules.getModulesSimple(data);
            return courseModules;
        } catch (error) {
            throw error.message;
        }
    });

    ipcMain.handle('axios:relockModules', async (event, data) => {
        console.log('main.js > axios:relockModules');

        let completedRequests = 0;
        let totalRequests = data.module_ids.length;

        const updateProgress = () => {
            completedRequests++;
            mainWindow.webContents.send('update-progress', (completedRequests / totalRequests) * 100);
        }

        const request = async (requestData) => {
            try {
                return await modules.relockModule(requestData);
            } catch (error) {
                throw error;
            } finally {
                updateProgress();
            }
        }

        const requests = [];
        for (let i = 0; i < data.module_ids.length; i++) {
            const requestData = {
                domain: data.domain,
                token: data.token,
                course_id: data.course_id,
                module_id: data.module_ids[i]
            };
            requests.push({ id: i + 1, request: () => request(requestData) });
        }

        const batchResponse = await batchHandler(requests);
        console.log('Finished relocking modules.');
        return batchResponse;
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

    // Let renderer pick a CSV or ZIP and return its full path
    ipcMain.handle('fileUpload:pickCsvOrZip', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'CSV/ZIP/JSON', extensions: ['csv', 'zip', 'json'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            modal: true
        });
        if (result.canceled) return null;
        return result.filePaths[0];
    });

    ipcMain.handle('fileUpload:readFile', async (event, payload) => {
        const { fullPath } = payload || {};
        if (!fullPath) throw new Error('fullPath required');
        return await fs.promises.readFile(fullPath, 'utf8');
    });

    ipcMain.handle('fileUpload:readFileBuffer', async (event, payload) => {
        const { fullPath } = payload || {};
        if (!fullPath) throw new Error('fullPath required');
        const buf = await fs.promises.readFile(fullPath);
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    });

    // Write a JSON errors file alongside the uploaded file
    ipcMain.handle('fileUpload:writeErrorsFile', async (event, payload) => {
        try {
            const { dirPath, baseName, failed } = payload || {};
            if (!dirPath || !baseName || !Array.isArray(failed)) throw new Error('dirPath, baseName and failed[] required');
            const stem = path.basename(baseName, path.extname(baseName));
            const outPath = path.join(dirPath, `${stem}_restore_errors.json`);
            await fs.promises.writeFile(outPath, JSON.stringify(failed, null, 2), 'utf8');
            return outPath;
        } catch (err) {
            console.error('writeErrorsFile error:', err);
            throw err;
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

async function createClassicQuizzes(data) {
    // console.log('The data: ', data);

    // first create the quizzes
    const totalRequests = data.num_quizzes;
    let completedRequests = 0;

    const updateProgress = () => {
        completedRequests++;
        mainWindow.webContents.send('update-progress', {
            mode: 'determinate',
            label: 'Creating quizzes',
            processed: completedRequests,
            total: totalRequests,
            value: completedRequests / totalRequests
        });
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
    const hasQuestions = Array.isArray(data.questionTypes) && data.questionTypes.some(q => q && q.enabled && Number(q.number) > 0);
    const publishAtCreate = data.publish && !hasQuestions;
    for (let i = 0; i < totalRequests; i++) {
        const requestData = {
            domain: data.domain,
            token: data.token,
            course_id: data.course_id,
            quiz_type: data.quiz_type,
            publish: !!publishAtCreate,
            num_quizzes: data.num_quizzes,
            quiz_title: (() => {
                const base = (data.quiz_name && data.quiz_name.length > 0) ? data.quiz_name : 'Quiz';
                // If creating multiple, suffix with index; otherwise use as-is
                return (totalRequests > 1) ? `${base} ${i + 1}` : base;
            })()
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
            { name: 'All Files', extensions: ['*'] },
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'CSV Files', extensions: ['csv'] }

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

ipcMain.handle('sis:createMultiFiles', async (event, fileConfigurations, outputPath) => {
    try {
        const createdFiles = [];

        // Create each file based on its configuration
        for (const config of fileConfigurations) {
            const fileName = await sisImports.createSISImportFile(
                config.fileType,
                config.rowCount,
                outputPath,
                config.emailDomain,
                config.authProviderId,
                config.options.enrollmentOptions || {},
                config.options.userOptions || {},
                config.options.accountOptions || {},
                config.options.termOptions || {},
                config.options.courseOptions || {},
                config.options.sectionOptions || {},
                config.options.groupCategoryOptions || {},
                config.options.groupOptions || {},
                config.options.groupMembershipOptions || {},
                config.options.adminOptions || {},
                config.options.loginOptions || {},
                config.options.crossListingOptions || {},
                config.options.userObserverOptions || {},
                config.options.changeSisIdOptions || {},
                config.options.differentiationTagSetOptions || {},
                config.options.differentiationTagOptions || {},
                config.options.differentiationTagMembershipOptions || {}
            );
            createdFiles.push(fileName);
        }

        // Create ZIP file
        const JSZip = require('jszip');
        const zip = new JSZip();

        for (const filePath of createdFiles) {
            const fileName = path.basename(filePath);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            zip.file(fileName, fileContent);
        }

        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
        const zipPath = path.join(outputPath, 'sis_multi_import_package.zip');
        fs.writeFileSync(zipPath, zipContent);

        return {
            success: true,
            files: createdFiles.map(file => path.basename(file)),
            zipPath: zipPath
        };
    } catch (error) {
        throw new Error(`Error creating multi SIS files: ${error.message}`);
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
    const senderId = event.sender.id;
    resetPatternCancelFlags.set(senderId, false);
    const isCancelled = () => resetPatternCancelFlags.get(senderId) === true;

    // Normalize pattern once
    const normalizedPattern = String(data.pattern || '').trim().toLowerCase();
    const base = { ...data, pattern: normalizedPattern };

    try {
        progressStartIndeterminate('Collecting emails to reset...');

        // 1) Gather bounced emails (Canvas) and suppressed emails (AWS) for this pattern
        const [bouncedRows, suppressedList] = await Promise.all([
            getBouncedData(base), // array of row arrays; row[4] is the email
            checkCommDomain(base) // array of email strings
        ]);

        if (isCancelled()) {
            progressDone();
            resetPatternCancelFlags.delete(senderId);
            return [];
        }

        // 2) Build a unique set of emails (lowercased)
        const targets = new Set();
        if (Array.isArray(bouncedRows)) {
            for (const row of bouncedRows) {
                const em = Array.isArray(row) ? row[4] : null;
                if (em) targets.add(String(em).trim().toLowerCase());
            }
        }
        if (Array.isArray(suppressedList)) {
            for (const em of suppressedList) {
                if (em) targets.add(String(em).trim().toLowerCase());
            }
        }

        const emails = Array.from(targets);
        const total = emails.length;
        if (total === 0) {
            progressDone();
            resetPatternCancelFlags.delete(senderId);
            return [];
        }

        // 3) Reset both bounce and suppression for each unique email with a small worker pool
        const { bounceReset, awsReset, bounceCheck } = require('./comm_channels');
        let processed = 0;
        progressUpdateDeterminate(0, total);

        const maxWorkers = Math.max(1, Math.min(10, Number(process.env.RESET_EMAILS_CONCURRENCY) || 8));
        let idx = 0;
        const results = [];

        const worker = async () => {
            while (idx < emails.length && !isCancelled()) {
                const myIdx = idx++;
                const email = emails[myIdx];
                try {
                    await waitFunc(100 + Math.floor(Math.random() * 100));
                    const bounceRes = await bounceReset({ domain: data.domain, token: data.token, email });
                    if (Number(bounceRes?.reset || 0) > 0) {
                        await waitFunc(800);
                        try { await bounceCheck(data.domain, data.token, email); } catch { }
                    }
                    const awsRes = await awsReset({ region: data.region, token: data.token, email });
                    results.push({ bounce: bounceRes, suppression: awsRes, email });
                } catch (e) {
                    // Record failure as a result with error flags (optional)
                    results.push({ bounce: { reset: 0, error: e?.message || String(e) }, suppression: { reset: 0, error: e?.message || String(e) }, email });
                } finally {
                    processed++;
                    progressUpdateDeterminate(processed, total);
                }
            }
        };

        const workers = [];
        for (let w = 0; w < maxWorkers; w++) workers.push(worker());
        await Promise.all(workers);
        progressDone();
        resetPatternCancelFlags.delete(senderId);
        return results;
    } catch (err) {
        progressDone();
        resetPatternCancelFlags.delete(senderId);
        throw err.message || err;
    }
});

ipcMain.handle('axios:cancelResetCommChannelsByPattern', async (event) => {
    const senderId = event.sender.id;
    resetPatternCancelFlags.set(senderId, true);
    return { cancelled: true };
});

async function batchHandler(requests, batchSize = 35, timeDelay = 2000) {
    // Support options overload: batchHandler(reqs, { batchSize, timeDelay, isCancelled })
    let isCancelled = null;
    if (typeof batchSize === 'object' && batchSize !== null) {
        const opts = batchSize;
        isCancelled = typeof opts.isCancelled === 'function' ? opts.isCancelled : null;
        timeDelay = typeof opts.timeDelay === 'number' ? opts.timeDelay : 2000;
        batchSize = typeof opts.batchSize === 'number' ? opts.batchSize : 35;
    } else if (typeof timeDelay === 'object' && timeDelay !== null) {
        const opts = timeDelay;
        isCancelled = typeof opts.isCancelled === 'function' ? opts.isCancelled : null;
        timeDelay = typeof opts.timeDelay === 'number' ? opts.timeDelay : 2000;
    }

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
            if (isCancelled && isCancelled()) break;
            const batch = myRequests.slice(i, i + batchSize);
            await Promise.allSettled(batch.map(request => request.request()
                .then(response => successful.push(handleSuccess(response, request)))
                .catch(error => failed.push(handleError(error, request)))));
            // results.push(...batchResults);
            if (i + batchSize < myRequests.length) {
                if (isCancelled && isCancelled()) break;
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
        if (isCancelled && isCancelled()) break;
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

// Adaptive rate-limited runner for Canvas API with concurrency control and backoff
async function canvasRateLimitedHandler(requests, options = {}) {
    const {
        maxConcurrent = 35,
        baseDelayMs = 200,
        jitterMs = 200,
        maxRetries = 3,
        isCancelled = () => false
    } = options;

    let successful = [];
    let failed = [];
    let completed = 0;
    const total = requests.length || 1;

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const withJitter = (ms) => ms + Math.floor(Math.random() * jitterMs);

    const queue = [...requests];
    let inflight = 0;

    return await new Promise((resolve) => {
        const startNext = () => {
            while (inflight < maxConcurrent && queue.length > 0) {
                if (isCancelled && isCancelled()) {
                    // Stop launching new tasks; resolve when inflight drains
                    if (inflight === 0) return resolve({ successful, failed, cancelled: true });
                    return; // let inflight complete, no more dequeues
                }
                const item = queue.shift();
                inflight++;

                const run = async (attempt = 0) => {
                    try {
                        const value = await item.request();
                        successful.push({ id: item.id, status: 'fulfilled', value });
                    } catch (err) {
                        const status = err?.response?.status || err?.status || 0;
                        const headers = err?.response?.headers || {};
                        const data = err?.response?.data || {};
                        const msg = (Array.isArray(data?.errors) ? data.errors.map(e => e?.message || '').join(' ') : (data?.message || '')) + '';
                        // Canvas throttling commonly returns 403 with throttling language; also honor 429/5xx
                        const looksThrottled = /throttl|rate.?limit|too many|try again later|exceed/i.test(msg) || String(headers['x-rate-limit-remaining'] || headers['X-Rate-Limit-Remaining'] || '').trim() === '0' || typeof headers['retry-after'] !== 'undefined' || typeof headers['Retry-After'] !== 'undefined';
                        const isRetryable = [429, 500, 502, 503, 504].includes(status) || (!status) || (status === 403 && looksThrottled);
                        if (attempt < maxRetries && isRetryable) {
                            // Prefer Retry-After if present; otherwise exponential backoff with jitter
                            const retryAfter = Number(headers['retry-after'] ?? headers['Retry-After']);
                            const base = isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : baseDelayMs * Math.pow(2, attempt);
                            const delay = withJitter(base);
                            await sleep(delay);
                            return run(attempt + 1);
                        }
                        failed.push({ id: item.id, status, reason: err?.message || 'Request failed' });
                    } finally {
                        completed++;
                        const pct = Math.round((completed / total) * 100);
                        try { mainWindow?.webContents?.send('update-progress', pct); } catch (_) { /* noop */ }
                        inflight--;
                        if (queue.length > 0 && !(isCancelled && isCancelled())) startNext();
                        else if (inflight === 0) resolve({ successful, failed, cancelled: isCancelled && isCancelled() });
                    }
                };

                run(0);
            }
        };

        if (queue.length === 0) return resolve({ successful, failed });
        startNext();
    });
}
