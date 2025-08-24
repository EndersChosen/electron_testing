// quizzes_nq.js - New Quizzes API helpers

const axios = require('axios');
const { errorCheck } = require('./utilities');

async function createNewQuiz(data) {
    // POST /api/quiz/v1/courses/:course_id/quizzes
    const axiosConfig = {
        method: 'post',
        url: `https://${data.domain}/api/quiz/v1/courses/${data.course_id}/quizzes`,
        headers: {
            Authorization: `Bearer ${data.token}`,
        },
        data: {
            quiz: {
                title: data.quiz_title,
                published: data.published ?? true,
                grading_type: data.grading_type ?? 'points',
                // Additional quiz settings can be added here if needed
            },
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

module.exports = { createNewQuiz };
