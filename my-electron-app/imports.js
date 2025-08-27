// imports.js - Helpers for working with Content Migrations imported assets

const axios = require('axios');
const { errorCheck } = require('./utilities');

// Fetch imported assets for a given content migration (import) id
// Returns an object: { assignments: string[], discussions: string[], quizzes: string[] }
async function getImportedAssets(data) {
    // GET /api/v1/courses/:course_id/content_migrations/:id
    const axiosConfig = {
        method: 'get',
        url: `https://${data.domain}/api/v1/courses/${data.course_id}/content_migrations/${data.import_id}`,
        headers: {
            'Authorization': `Bearer ${data.token}`
        }
    };

    try {
        const request = async () => axios(axiosConfig);
        const response = await errorCheck(request);
        const imported = response?.data?.audit_info?.migration_settings?.imported_assets || {};
        // Values are comma-separated id strings; normalize to arrays for each supported asset type
        const toArray = (str) => (str && String(str).trim() !== '')
            ? String(str).split(',').map(s => s.trim()).filter(Boolean)
            : [];

        // Map Canvas asset keys to normalized buckets
        const assets = {
            attachments: toArray(imported.Attachment || ''),
            folders: toArray(imported.Folder || ''),
            outcomes: toArray(imported.LearningOutcome || ''),
            contentTags: toArray(imported.ContentTag || ''),
            rubrics: toArray(imported.Rubric || ''),
            assignmentGroups: toArray(imported.AssignmentGroup || ''),
            assignments: toArray(imported.Assignment || ''),
            // Quizzes key observed as "Quizzes::Quiz"; fallback to "Quiz" if present
            quizzes: toArray(imported['Quizzes::Quiz'] || imported.Quiz || ''),
            announcements: toArray(imported.Announcement || ''),
            discussions: toArray(imported.DiscussionTopic || ''),
            pages: toArray(imported.WikiPage || ''),
            modules: toArray(imported.ContextModule || ''),
            calendarEvents: toArray(imported.CalendarEvent || ''),
        };

        return assets;
    } catch (error) {
        throw error;
    }
}

module.exports = { getImportedAssets };

// List recent content migrations for a course (helps the user pick a valid import id)
async function listContentMigrations(data) {
    const axiosConfig = {
        method: 'get',
        url: `https://${data.domain}/api/v1/courses/${data.course_id}/content_migrations?per_page=${data.per_page || 50}`,
        headers: {
            'Authorization': `Bearer ${data.token}`
        }
    };

    try {
        const request = async () => axios(axiosConfig);
        const response = await errorCheck(request);
        return response.data;
    } catch (error) {
        throw error;
    }
}

module.exports.listContentMigrations = listContentMigrations;
