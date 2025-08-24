// discussions.js - Canvas Discussion Topics API helpers

const axios = require('axios');
const { errorCheck } = require('./utilities');

async function createDiscussion(data) {
    // POST /api/v1/courses/:course_id/discussion_topics
    const axiosConfig = {
        method: 'post',
        url: `https://${data.domain}/api/v1/courses/${data.course_id}/discussion_topics`,
        headers: {
            Authorization: `Bearer ${data.token}`,
        },
        data: {
            title: data.title,
            message: data.message ?? '',
            published: data.published ?? true,
        },
    };

    try {
        const request = async () => axios(axiosConfig);
        const response = await errorCheck(request);
        return response.data;
    } catch (error) {
        throw error;
    }
}

module.exports = { createDiscussion };
