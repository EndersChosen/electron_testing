// quizzes.js

const axios = require('axios');
const pagination = require('./pagination.js');
const { errorCheck } = require('./utilities.js');


async function createQuiz(data) {
    let url = `https://${data.domain}/api/v1/courses/${data.course_id}/quizzes`;

    const axiosConfig = {
        method: 'post',
        url: url,
        headers: {
            'Authorization': `Bearer ${data.token}`
        },
        data: {
            "quiz": {
                "title": data.quiz_title,
                "quiz_type": data.quiz_type,
                "allowed_attempts": -1,
                "published": data.publish
            }
        }
    }

    try {
        const request = async () => {
            return await axios(axiosConfig);
        }
        const response = await errorCheck(request);
        return response.data;
    } catch (error) {
        throw error
    }
}

async function createQuestions(data) {
    const axiosConfig = {
        method: 'POST',
        url: `https://${data.domain}/api/v1/courses/${data.course_id}/quizzes/${data.quiz_id}/questions`,
        headers: {
            'Authorization': `Bearer ${data.token}`
        }
    };

    // const data = {
    //     question: {}
    // };
    // loop through all the 
    for (let qData of data.questionTypes) {
        if (qData.enabled) {
            // loop through the number of question to add of the specific type
            for (let qNum = 0; qNum < qData.number; qNum++) {
                switch (qData.name) {
                    case "calculated_question":
                        await addCalculatedQuestion(data);
                        break;
                    case "essay_question":
                        await addEssayQuestion(data);
                        break;
                    case "file_upload_question":
                        await addFileUploadQuestion(data)
                        break;
                    case "fill_in_multiple_blanks_question":
                        await addFillInMultipleBlanksQuestion(data);
                        break;
                    case "matching_question":
                        await addMatchingQuestion(data);
                        break;
                    case "multiple_answers_question":
                        await addMultipleAnswerQuestion(data);
                        break;
                    case "multiple_choice_question":
                        await addMultipleChoiceQuestion(data);
                        break;
                    case "multiple_dropdowns_question":
                        await addMultipleDropdownsQuestion(data);
                        break;
                    case "numerical_question":
                        await addNumericalQuestion(data);
                        break;
                    case "short_answer_question":
                        await addShortAnswerQuestion(data);
                        break;
                    case "text_only_question":
                        await addTextOnlyQuestion(data);
                        break;
                    case "true_false_question":
                        await addTrueFalseQuestion(data);
                        break;
                    default:
                        break;
                }
            }

            // loop through total number of questions to add of this type
            for (let i = 0; i < qData.number; i++) {

            }
        }
    }
    try {
        const request = async () => {
            return await axios(axiosConfig);
        }
        const response = await errorCheck(request);
        return response.data;
    } catch (error) {
        throw error
    }

}

async function addCalculatedQuestion(data) {
    const questionData = {
        "question_name": "Question",
        "assessment_question_id": null,
        "question_type": "calculated_question",
        "points_possible": 1,
        "correct_comments_html": null,
        "incorrect_comments_html": null,
        "neutral_comments_html": null,
        "question_text": "<p>What is 5 plus [x]</p>",
        "regrade_option": null,
        "position": 0,
        "text_after_answers": null,
        "matching_answer_incorrect_matches": null,
        "formulas": ["5 + x"],
        "variables": [
            {
                "name": "x",
                "min": 1,
                "max": 10,
                "scale": 0
            }
        ],
        "answer_tolerance": 0,
        "formula_decimal_places": 0,
        "answers": [
            { "variables": [{ "name": "x", "value": 8 }], "answer_text": "13" },
            { "variables": [{ "name": "x", "value": 7 }], "answer_text": "12" },
            { "variables": [{ "name": "x", "value": 7 }], "answer_text": "12" },
            { "variables": [{ "name": "x", "value": 9 }], "answer_text": "14" },
            { "variables": [{ "name": "x", "value": 5 }], "answer_text": "10" },
            { "variables": [{ "name": "x", "value": 3 }], "answer_text": "8" },
            { "variables": [{ "name": "x", "value": 10 }], "answer_text": "15" },
            { "variables": [{ "name": "x", "value": 6 }], "answer_text": "11" },
            { "variables": [{ "name": "x", "value": 4 }], "answer_text": "9" },
            { "variables": [{ "name": "x", "value": 9 }], "answer_text": "14" }
        ]
    };
}

async function addEssayQuestion(data) {
    const questionData = {
        question_name: "Question",
        assessment_question_id: null,
        question_type: "essay_question",
        points_possible: 1,
        correct_comments_html: null,
        incorrect_comments_html: null,
        neutral_comments_html: null,
        question_text: "<p>Essay Question</p>",
        regrade_option: null,
        position: 0,
        text_after_answers: null,
        matching_answer_incorrect_matches: null
    };
}

async function addFileUploadQuestion(data) {
    const questionData = {
        question_name: "Question",
        assessment_question_id: null,
        question_type: "file_upload_question",
        points_possible: 1,
        correct_comments_html: null,
        incorrect_comments_html: null,
        neutral_comments_html: null,
        question_text: "<p>File Upload</p>",
        regrade_option: null,
        position: 0,
        text_after_answers: null,
        matching_answer_incorrect_matches: null
    };
}

async function addFillInMultipleBlanksQuestion(data) {
    const questionData = {
        question_name: "Question",
        assessment_question_id: null,
        question_type: "fill_in_multiple_blanks_question",
        points_possible: 1,
        correct_comments_html: null,
        incorrect_comments_html: null,
        neutral_comments_html: null,
        question_text: "<p>Roses are [color1], violets are [color2]</p>",
        regrade_option: null,
        position: 0,
        text_after_answers: null,
        matching_answer_incorrect_matches: null,
        answers: [
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 100,
                numerical_answer_type: "exact_answer",
                blank_id: "color1",
                answer_text: "red",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 100,
                numerical_answer_type: "exact_answer",
                blank_id: "color2",
                answer_text: "blue",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            }
        ]
    };
}

async function addMatchingQuestion(data) {
    const questionData = {
        question_name: "Question",
        assessment_question_id: null,
        question_type: "matching_question",
        points_possible: 1,
        correct_comments_html: null,
        incorrect_comments_html: null,
        neutral_comments_html: null,
        question_text: "<p>Matching</p>",
        regrade_option: null,
        position: 0,
        text_after_answers: null,
        matching_answer_incorrect_matches: null,
        answers: [
            {
                answer_weight: 100,
                answer_match_left: "Left",
                answer_match_right: "Right"
            },
            {
                answer_weight: 100,
                answer_match_left: "Up",
                answer_match_right: "Down"
            },
            {
                answer_weight: 100,
                answer_match_left: "Black",
                answer_match_right: "White"
            }
        ]
    };

}

async function addMultipleAnswerQuestion(data) {
    const questionData = {
        question_name: "Question",
        assessment_question_id: null,
        question_type: "multiple_answers_question",
        points_possible: 1,
        correct_comments_html: null,
        incorrect_comments_html: null,
        neutral_comments_html: null,
        question_text: "<p>Multiple Answer</p>",
        regrade_option: null,
        position: 0,
        text_after_answers: null,
        matching_answer_incorrect_matches: null,
        answers: [
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 0,
                numerical_answer_type: "exact_answer",
                answer_text: "a",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 100,
                numerical_answer_type: "exact_answer",
                answer_text: "b",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 100,
                numerical_answer_type: "exact_answer",
                answer_text: "c",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 0,
                numerical_answer_type: "exact_answer",
                answer_text: "All the above",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            }
        ]
    };
}

async function addMultipleChoiceQuestion(data) {
    const questionData = {
        question_name: "Question",
        assessment_question_id: null,
        question_type: "multiple_choice_question",
        points_possible: 1,
        correct_comments_html: null,
        incorrect_comments_html: null,
        neutral_comments_html: null,
        question_text: "<p>Multiple Choice</p>",
        regrade_option: null,
        position: 0,
        text_after_answers: null,
        matching_answer_incorrect_matches: null,
        answers: [
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 100,
                numerical_answer_type: "exact_answer",
                answer_text: "a",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 0,
                numerical_answer_type: "exact_answer",
                answer_text: "b",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 0,
                numerical_answer_type: "exact_answer",
                answer_text: "c",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 0,
                numerical_answer_type: "exact_answer",
                answer_text: "d",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            }
        ]
    };
}
async function addMultipleDropdownsQuestion(data) {
    const questionData = {
        question_name: "Question",
        assessment_question_id: null,
        question_type: "multiple_dropdowns_question",
        points_possible: 1,
        correct_comments_html: null,
        incorrect_comments_html: null,
        neutral_comments_html: null,
        question_text: "<p>Roses are [color1], violets are [color2]</p>",
        regrade_option: null,
        position: 0,
        text_after_answers: null,
        matching_answer_incorrect_matches: null,
        answers: [
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 100,
                numerical_answer_type: "exact_answer",
                blank_id: "color1",
                answer_text: "red",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 0,
                numerical_answer_type: "exact_answer",
                blank_id: "color1",
                answer_text: "black",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 100,
                numerical_answer_type: "exact_answer",
                blank_id: "color2",
                answer_text: "blue",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 0,
                numerical_answer_type: "exact_answer",
                blank_id: "color2",
                answer_text: "yellow",
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            }
        ]
    };
}

async function addNumericalQuestion(data) {
    const questionData = {
        question_name: "Question",
        assessment_question_id: null,
        question_type: "numerical_question",
        points_possible: 1,
        correct_comments_html: null,
        incorrect_comments_html: null,
        neutral_comments_html: null,
        question_text: "<p>Numerical Answer</p>",
        regrade_option: null,
        position: 0,
        text_after_answers: null,
        matching_answer_incorrect_matches: null,
        answers: [
            {
                answer_exact: 10,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 100,
                numerical_answer_type: "exact_answer",
                blank_id: null,
                id: null,
                match_id: null,
                answer_text: null,
                answer_match_left: null,
                answer_match_right: null,
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            }
        ]
    };
}

async function addShortAnswerQuestion(data) { }
async function addTextOnlyQuestion(data) { }
async function addTrueFalseQuestion(data) {
    const questionData = {
        question_name: "Question",
        assessment_question_id: null,
        question_type: "true_false_question",
        points_possible: 1,
        correct_comments_html: null,
        incorrect_comments_html: null,
        neutral_comments_html: null,
        question_text: "<p>True or False</p>",
        regrade_option: null,
        position: 0,
        text_after_answers: null,
        matching_answer_incorrect_matches: null,
        answers: [
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 100,
                numerical_answer_type: "exact_answer",
                blank_id: null,
                id: null,
                match_id: null,
                answer_text: "True",
                answer_match_left: null,
                answer_match_right: null,
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            },
            {
                answer_exact: 0,
                answer_error_margin: 0,
                answer_range_start: 0,
                answer_range_end: 0,
                answer_approximate: 0,
                answer_precision: 10,
                answer_weight: 0,
                numerical_answer_type: "exact_answer",
                blank_id: null,
                id: null,
                match_id: null,
                answer_text: "False",
                answer_match_left: null,
                answer_match_right: null,
                answer_comment: null,
                answer_html: null,
                answer_match_left_html: null,
                answer_comment_html: null
            }
        ]
    };
}

module.exports = {
    createQuiz
}