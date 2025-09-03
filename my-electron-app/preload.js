const { contextBridge, ipcRenderer } = require('electron');
// const axios = require('axios');

// contextBridge.exposeInMainWorld('eAPI', {
//     onUpdateCounter: (callback) => ipcRenderer.on('update-counter', callback),
//     helloTest: (channel, data) => ipcMain.send(channel, data),

// });

contextBridge.exposeInMainWorld('axios', {
    getConvos: async (data) => {
        const result = await ipcRenderer.invoke('axios:getConvos', data);
        if (!result) {
            return false;
        }

        console.log('in preload total result ', result.length);

        return result;
    },
    getDeletedConversations: async (data) => {
        console.log('preload.js > getDeletedConversations');
        return await ipcRenderer.invoke('axios:getDeletedConversations', data);
    },
    deleteConvos: async (data) => {
        console.log('inside deleteConvos');

        return await ipcRenderer.invoke('axios:deleteConvos', data);
        // const result = await ipcRenderer.invoke('axios:deleteConvos', data, url);
    },
    checkCommChannel: async (data) => {
        console.log('inside preload checkCommChannel');
        return await ipcRenderer.invoke('axios:checkCommChannel', data);
    },
    checkCommDomain: async (data) => {
        console.log('Inside preload axios:checkCommDomain');
        return await ipcRenderer.invoke('axios:checkCommDomain', data);
    },
    resetCommChannelsByPattern: async (data) => {
        console.log('Inside preload axios:resetCommChannelsByPattern');
        return await ipcRenderer.invoke('axios:resetCommChannelsByPattern', data);
    },
    cancelResetCommChannelsByPattern: async () => {
        console.log('Inside preload axios:cancelResetCommChannelsByPattern');
        return await ipcRenderer.invoke('axios:cancelResetCommChannelsByPattern');
    },
    createAssignments: async (data) => {
        console.log('inside preload createAssignments');

        return await ipcRenderer.invoke('axios:createAssignments', data);

    },
    deleteAssignments: async (data) => {
        console.log('inside preload deleteAssignments');
        return await ipcRenderer.invoke('axios:deleteAssignments', data);
    },
    getEmptyAssignmentGroups: async (data) => {
        console.log('inside preload getEmptyAssignmentGroups');
        return await ipcRenderer.invoke('axios:getEmptyAssignmentGroups', data);
    },
    deleteEmptyAssignmentGroups: async (data) => {
        console.log('Inside axios:deleteEmptyAssignmentGroups');

        return await ipcRenderer.invoke('axios:deleteEmptyAssignmentGroups', data);
    },
    getNoSubmissionAssignments: async (data) => {
        console.log('preload > getNoSubmissionAssignments');

        try {
            const response = await ipcRenderer.invoke('axios:getNoSubmissionAssignments', data);
            return response;
        } catch (error) {
            throw error;
        }

    },
    deleteNoSubmissionAssignments: async (data) => {
        console.log('preload > deleteNoSubmissionAssignments');

        return await ipcRenderer.invoke('axios:deleteNoSubmissionAssignments', data);
    },
    getUnpublishedAssignments: async (data) => {
        console.log('preload > getUnpublishedAssignments');

        return await ipcRenderer.invoke('axios:getUnpublishedAssignments', data);
    },
    getNonModuleAssignments: async (data) => {
        console.log('preload > deleteNonModuleAssignments');

        return await ipcRenderer.invoke('axios:getNonModuleAssignments', data);
    },
    getOldAssignments: async (data) => {
        console.log('preload > getOldAssignments')

        return await ipcRenderer.invoke('axios:getOldAssignments', data);
    },
    getNoDueDateAssignments: async (data) => {
        console.log('preload > getNoDueDateAssignments');
        return await ipcRenderer.invoke('axios:getNoDueDateAssignments', data);
    },
    getAllAssignmentsForCombined: async (data) => {
        console.log('preload > getAllAssignmentsForCombined');
        return await ipcRenderer.invoke('axios:getAllAssignmentsForCombined', data);
    },
    cancelAllAssignmentsForCombined: async () => {
        console.log('preload > cancelAllAssignmentsForCombined');
        return await ipcRenderer.invoke('axios:cancelAllAssignmentsForCombined');
    },
    deleteOldAssignments: async (data) => {
        console.log('preload > deleteOldAssignments');

        return await ipcRenderer.invoke('axios:deleteOldAssignments', data);
    },
    getImportedAssignments: async (data) => {
        console.log('preload > getImportedAssignments');

        return await ipcRenderer.invoke('axios:getImportedAssignments', data);
    },
    getImportedAssets: async (data) => {
        console.log('preload > getImportedAssets');
        return await ipcRenderer.invoke('axios:getImportedAssets', data);
    },
    listContentMigrations: async (data) => {
        console.log('preload > listContentMigrations');
        return await ipcRenderer.invoke('axios:listContentMigrations', data);
    },
    getAssignmentsToMove: async (data) => {
        console.log('preload > getAssignmentsToMove');

        return await ipcRenderer.invoke('axios:getAssignmentsToMove', data);
    },
    keepAssignmentsInGroup: async (data) => {
        console.log('preload > keepAssignmentsInGroup');

        return await ipcRenderer.invoke('axios:keepAssignmentsInGroup', data);
    },
    moveAssignmentsToSingleGroup: async (data) => {
        console.log('preload > moveAssignmentsToSingleGroup');

        return await ipcRenderer.invoke('axios:moveAssignmentsToSingleGroup', data);
    },
    getAssignmentsInGroup: async (data) => {
        console.log('preload > getAssignmentsInGroup');
        return await ipcRenderer.invoke('axios:getAssignmentsInGroup', data);
    },
    deleteAssignmentsInGroup: async (data) => {
        console.log('preload > deleteAssignmentsInGroup');

        return await ipcRenderer.invoke('axios:deleteAssignmentsInGroup', data);
    },
    deleteAssignmentGroupAssignments: async (data) => {
        console.log('preload > deleteAssignmentGroupAssignments');

        return await ipcRenderer.invoke('axios:deleteAssignmentGroupAssignments', data);
    },
    createAssignmentGroups: async (data) => {
        console.log('preload.js > createAssignmentGroups');

        return await ipcRenderer.invoke('axios:createAssignmentGroups', data);
    },
    deleteTheThings: async (data) => {
        console.log('preload.js > deleteTheThings');

        return await ipcRenderer.invoke('axios:deleteTheThings', data);
    },
    getPageViews: async (data) => {
        console.log('preload.js > getPageViews');

        return await ipcRenderer.invoke('axios:getPageViews', data);
    },
    restoreDeletedConversations: async (data) => {
        console.log('preload.js > restoreDeletedConversations');
        return await ipcRenderer.invoke('axios:restoreDeletedConversations', data);
    },
    restoreContent: async (data) => {
        console.log('preload.js > restoreContent');

        return await ipcRenderer.invoke('axios:restoreContent', data);
    },
    resetCourses: async (data) => {
        console.log('preload.js > resetCourses');

        return await ipcRenderer.invoke('axios:resetCourses', data);
    },
    getCourseInfo: async (data) => {
        console.log('preload.js > getCourseInfo');

        return await ipcRenderer.invoke('axios:getCourseInfo', data);
    },
    addAssociateCourse: async (data) => {
        console.log('preload.js > addAssociateCourse');

        return await ipcRenderer.invoke('axios:addAssociateCourse', data);
    },
    resetCommChannel: async (data) => {
        console.log('preload.js > rsetCommChannel');

        return await ipcRenderer.invoke('axios:resetCommChannel', data);
    },
    checkUnconfirmedEmails: async (data) => {
        console.log('preload.js > checkUnconfirmedEmails');

        return await ipcRenderer.invoke('axios:checkUnconfirmedEmails', data);
    },
    confirmEmails: async (data) => {
        console.log('preload.js > confirmEmails');

        return await ipcRenderer.invoke('axios:confirmEmails', data);
    },
    resetEmails: async (data) => {
        console.log('preload.js > resetEmails');

        return await ipcRenderer.invoke('axios:resetEmails', data);
    },
    cancelResetEmails: async () => {
        console.log('preload.js > cancelResetEmails');
        return await ipcRenderer.invoke('axios:cancelResetEmails');
    },
    createSupportCourse: async (data) => {
        console.log('preload.js > createSupportCourse');

        return await ipcRenderer.invoke('axios:createSupportCourse', data);
    },
    createBasicCourse: async (data) => {
        console.log('preload.js > createBasicCourse');

        return await ipcRenderer.invoke('axios:createBasicCourse', data);
    },
    associateCourses: async (data) => {
        console.log('preload.js > associateCourses');

        return await ipcRenderer.invoke('axios:associateCourses', data);
    },
    getClassicQuizzes: async (data) => {
        console.log('preload.js > getClassicQuizzes');

        const result = await ipcRenderer.invoke('axios:getClassicQuizzes', data);
        if (!result) {
            return false;
        }
        console.log('in preload total classic quizzes result ', result.length);
        return result;
    },
    createClassicQuizzes: async (data) => {
        console.log('preload.js > createClassicQuizzes');

        return await ipcRenderer.invoke('axios:createClassicQuizzes', data)
    },
    updateClassicQuiz: async (data) => {
        console.log('preload.js > updateClassicQuiz');

        return await ipcRenderer.invoke('axios:updateClassicQuiz', data);
    },
    createClassicQuestions: async (data) => {
        console.log('preload.js > createClassicQuestions');

        return await ipcRenderer.invoke('axios:createClassicQuestions', data);
    },
    deleteClassicQuizzes: async (data) => {
        console.log('preload.js > deleteClassicQuizzes');

        return await ipcRenderer.invoke('axios:deleteClassicQuizzes', data);
    },
    deleteDiscussions: async (data) => {
        console.log('preload.js > deleteDiscussions');
        return await ipcRenderer.invoke('axios:deleteDiscussions', data);
    },
    deleteFolders: async (data) => {
        console.log('preload.js > deleteFolders');
        return await ipcRenderer.invoke('axios:deleteFolders', data);
    },
    deleteAttachments: async (data) => {
        console.log('preload.js > deleteAttachments');
        return await ipcRenderer.invoke('axios:deleteAttachments', data);
    },
    deleteGroupCategories: async (data) => {
        console.log('preload.js > deleteGroupCategories');
        return await ipcRenderer.invoke('axios:deleteGroupCategories', data);
    },
    getFoldersMeta: async (data) => {
        console.log('preload.js > getFoldersMeta');
        return await ipcRenderer.invoke('axios:getFoldersMeta', data);
    },
    createNQQuestions: async (data) => {
        console.log('preload.js > createNQQuestions');

        return await ipcRenderer.invoke('axios:createNQQuestions', data);
    },

    getModules: async (data) => {
        console.log('preload.js > getModules');

        return await ipcRenderer.invoke('axios:getModules', data);
    },
    getAssignmentsInModules: async (data) => {
        console.log('preload.js > getAssignmentsInModules');
        return await ipcRenderer.invoke('axios:getAssignmentsInModules', data);
    },
    deleteModules: async (data) => {
        console.log('preload.js > deleteModules');

        return await ipcRenderer.invoke('axios:deleteModules', data);
    },
    createModules: async (data) => {
        console.log('preload.js > createModules');

        return await ipcRenderer.invoke('axios:createModules', data);
    },
    getModulesSimple: async (data) => {
        console.log('preload.js > getModulesSimple');

        return await ipcRenderer.invoke('axios:getModulesSimple', data);
    },
    relockModules: async (data) => {
        console.log('preload.js > relockModules');

        return await ipcRenderer.invoke('axios:relockModules', data);
    },
    createDiscussions: async (data) => {
        console.log('preload.js > createDiscussions');
        return await ipcRenderer.invoke('axios:createDiscussions', data);
    },
    createAnnouncements: async (data) => {
        console.log('preload.js > createAnnouncements');
        return await ipcRenderer.invoke('axios:createAnnouncements', data);
    },
    createPages: async (data) => {
        console.log('preload.js > createPages');
        return await ipcRenderer.invoke('axios:createPages', data);
    },
    createSections: async (data) => {
        console.log('preload.js > createSections');
        return await ipcRenderer.invoke('axios:createSections', data);
    },
    updateNotifications: async (data) => {
        console.log('preload.js > updateNotifications');

        return await ipcRenderer.invoke('axios:updateNotifications', data);
    },
    getCommChannels: async (data) => {
        console.log('preload.js > getCommChannels');

        return await ipcRenderer.invoke('axios:getCommChannels', data);
    }
});

contextBridge.exposeInMainWorld('csv', {
    sendToCSV: async (data) => {
        console.log('inside csv exporter');

        //console.log(data);

        await ipcRenderer.invoke('csv:sendToCSV', data);
    },
    writeAtPath: async (fullPath, data) => {
        return await ipcRenderer.invoke('csv:writeAtPath', { fullPath, data });
    },
    sendToText: async () => {
        console.log('inside preload sendToText');

        ipcRenderer.send('csv:sendToText');
    }
});

// File helpers for bulk user ID uploads and related actions
contextBridge.exposeInMainWorld('fileUpload', {
    getUserIdsFromFile: async () => {
        return await ipcRenderer.invoke('fileUpload:getUserIdsFromFile');
    },
    pickCsvOrZip: async () => {
        return await ipcRenderer.invoke('fileUpload:pickCsvOrZip');
    },
    readFile: async (fullPath) => {
        return await ipcRenderer.invoke('fileUpload:readFile', { fullPath });
    },
    readFileBuffer: async (fullPath) => {
        return await ipcRenderer.invoke('fileUpload:readFileBuffer', { fullPath });
    },
    confirmEmails: async (data) => {
        return await ipcRenderer.invoke('fileUpload:confirmEmails', data);
    },
    resetCourse: async () => {
        return await ipcRenderer.invoke('fileUpload:resetCourses');
    },
    resetEmails: async (data) => {
        return await ipcRenderer.invoke('fileUpload:resetEmails', data);
    },
    writeErrorsFile: async (dirPath, baseName, failed) => {
        return await ipcRenderer.invoke('fileUpload:writeErrorsFile', { dirPath, baseName, failed });
    }
});

contextBridge.exposeInMainWorld('dataUpdate', {
    onUpdate: async (callback) => ipcRenderer.on('email-count', (_event, value) => callback(value))
})

// (Removed duplicate exposeInMainWorld('fileUpload') to avoid overriding methods)

contextBridge.exposeInMainWorld('progressAPI', {
    // Subscribe to progress; returns an unsubscribe function
    onUpdateProgress: (callback) => {
        const handler = (_event, payload) => callback(payload);
        ipcRenderer.on('update-progress', handler);
        return () => ipcRenderer.removeListener('update-progress', handler);
    },
    // Clear all progress listeners (useful when switching forms)
    removeAllProgressListeners: () => {
        ipcRenderer.removeAllListeners('update-progress');
    }
});

contextBridge.exposeInMainWorld('testAPI', {
    testing: () => {
        console.log('preload > testAPI:testing');
        ipcRenderer.send('testAPI:testing');
    }
});

contextBridge.exposeInMainWorld('menus', {
    rightclick: () => {
        ipcRenderer.send('right-click');
    },
    onMenuCommand: (callback) => {
        ipcRenderer.on('context-menu-command', (_event, data) => callback(data));
    },
    writeText: (data) => {
        ipcRenderer.send('write-text', (data));
    }
});

contextBridge.exposeInMainWorld('shell', {
    openExternal: (data) => {
        ipcRenderer.send('shell:openExternal', data);
    }
});

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: async () => {
        return await ipcRenderer.invoke('sis:selectFolder');
    },
    previewSISData: async (fileType, rowCount, emailDomain, authProviderId, allOptions) => {
        return await ipcRenderer.invoke('sis:previewData', fileType, rowCount, emailDomain, authProviderId, allOptions);
    },
    createSISFile: async (fileType, rowCount, outputPath, emailDomain, authProviderId, allOptions) => {
        return await ipcRenderer.invoke('sis:createFile', fileType, rowCount, outputPath, emailDomain, authProviderId, allOptions);
    },
    createBulkSISFiles: async (fileTypes, rowCounts, outputPath, createZip, emailDomain, authProviderId, enrollmentOptions) => {
        return await ipcRenderer.invoke('sis:createBulkFiles', fileTypes, rowCounts, outputPath, createZip, emailDomain, authProviderId, enrollmentOptions);
    },
    createMultiSISFiles: async (fileConfigurations, outputPath) => {
        return await ipcRenderer.invoke('sis:createMultiFiles', fileConfigurations, outputPath);
    },
    fetchAuthProviders: async (domain, token, accountId) => {
        return await ipcRenderer.invoke('sis:fetchAuthProviders', domain, token, accountId);
    }
});

// Small utilities (none exposed currently)