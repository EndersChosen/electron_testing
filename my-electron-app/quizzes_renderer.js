function quizTemplate(e) {
    switch (e.target.id) {
        case 'create-classic-quiz':
            createQuiz(e);
            break;
        case 'delete-classic-quizzes':
            deleteAllClassicQuizzes(e);
            break;
        case 'add-nq-questions':
            addQuestionsNQ(e);
            break;
        default:
            break;
    }
}

async function createQuiz(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let createQuizForm = eContent.querySelector('#create-quiz-form');

    if (!createQuizForm) {
        createQuizForm = document.createElement('form');
        createQuizForm.id = 'create-quiz-form';
        createQuizForm.innerHTML = `
            <div>
                <h3>Create Classic Quiz</h3>
                <p>Quizzes are created with a default of unlimited attempts. If you feel you need more control over quiz settings let Caleb know.</p>
            </div>
            <div class="row">
                <div class="row align-items-center">
                        <div class="col-2">
                            <label class="form-label">Course</label>
                            <input id="course-id" type="number" class="form-control" aria-describedby="input-checker" />
                        </div>
                    <div class="col-2">
                        <label class="form-label">How many</label>
                        <input id="quiz-number" type="number" class="form-control" value="1">
                    </div>
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <hr class="mt-2">
                <div class="row">
                    <div>
                        <h5>Type</h5>
                        <select id="quiz-type" class="form-select col-auto custom-select-width">
                            <option value="practice_quiz" selected>Practice</option>
                            <option value="assignment" selected>Graded</option>
                            <option value="survey">Survey</option>
                            <option value="graded_survey">Graded Survey</option>
                        </select>
                    </div>
                    <div id="quiz-settings" class="mt-3">
                        <h5>Settings</h5>
                        <div class="col-auto form-check form-switch" >
                            <input id="quiz-publish" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="quiz-publish" class="form-check-label">Publish</label>
                        </div>
                    </div>           
                    <div id="question-types" class="mt-3">
                        <h5>Questions</h5>
                        <div class="col-auto form-check form-switch" >
                            <input id="true_false_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="true_false_question" class="form-check-label">True/False</label>
                        </div>
                        <div id="add-true-false-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-true-false-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-true-false-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="short_answer_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="short_answer_question" class="form-check-label">Fill in the Blank</label>
                        </div>
                        <div id="add-short-answer-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-short-answer-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-short-answer-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="essay_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="essay_question" class="form-check-label">Essay</label>
                        </div>
                        <div id="add-essay-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-essay-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-essay-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="file_upload_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="file_upload_question" class="form-check-label">File Upload</label>
                        </div>
                        <div id="add-fileUpload-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-fileUpload-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-fileUpload-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="fill_in_multiple_blanks_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="fill_in_multiple_blanks_question" class="form-check-label">Fill in multiple blanks</label>
                        </div>
                        <div id="add-fill-mlt-blanks-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-fill-mlt-blanks-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-fill-mlt-blanks-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="matching_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="matching_question" class="form-check-label">Matching</label>
                        </div>
                        <div id="add-matching-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-matching-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-matching-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="multiple_answers_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="multiple_answers_question" class="form-check-label">Multiple Answers</label>
                        </div>
                         <div id="add-mlt-answers-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-mlt-answers-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-mlt-answers-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="multiple_choice_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="multiple_choice_question" class="form-check-label">Multiple Choice</label>
                        </div>
                        <div id="add-mlt-choice-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-mlt-choice-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-mlt-choice-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="multiple_dropdowns_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="multiple_dropdowns_question" class="form-check-label">Multiple Dropdowns</label>
                        </div>
                        <div id="add-mlt-drop-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-mlt-drop-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-mlt-drop-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="numerical_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="numerical_question" class="form-check-label">Numerical</label>
                        </div>
                        <div id="add-numerical-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-numerical-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-numerical-input">
                            </div>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="calculated_question" class="form-check-input" type="checkbox" role="switch">
                            <label for="calculated_question" class="form-check-label">Formula</label>
                        </div>
                        <div id="add-calculated-div" class="row hidden">
                            <div class="col-2">
                                <label for="add-calculated-input" class="form-label">How many</label>
                                <input type="text" class="form-control" role="switch" id="add-calculated-input">
                            </div>
                        </div>
                    </div>           
                </div>
                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="action-btn" class="btn btn-primary mt-3" disabled>Create</button>
                </div>
            </div>
            <div hidden id="create-cq-progress-div">
                <p id="create-cq-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="create-cq-response-container" class="mt-3">
            </div>
        `;

        eContent.append(createQuizForm);
    }
    createQuizForm.hidden = false;

    const courseID = createQuizForm.querySelector('#course-id');
    courseID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkCourseID(courseID, createQuizForm);
    });

    const numOfQuizzes = createQuizForm.querySelector('#quiz-number');
    numOfQuizzes.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkCourseID(numOfQuizzes, createQuizForm);
    })

    // map to use for eventHandler to toggle the div on or off
    const quizToggleMap = {
        "true_false_question": 'add-true-false-div',
        "short_answer_question": 'add-short-answer-div',
        "essay_question": 'add-essay-div',
        "file_upload_question": 'add-fileUpload-div',
        "fill_in_multiple_blanks_question": 'add-fill-mlt-blanks-div',
        "matching_question": 'add-matching-div',
        "multiple_answers_question": 'add-mlt-answers-div',
        "multiple_choice_question": 'add-mlt-choice-div',
        "multiple_dropdowns_question": 'add-mlt-drop-div',
        "numerical_question": 'add-numerical-div',
        "calculated_question": 'add-calculated-div'
    }

    const questionToggles = createQuizForm.querySelector('#question-types');
    questionToggles.addEventListener('change', (e) => {
        e.stopPropagation();

        // find the function for the event id
        // const handler = quizEventHandlers[e.target.id];
        // if (handler) {
        //     handler(e);
        // }
        const toggleDivID = quizToggleMap[e.target.id];
        if (toggleDivID) {
            const toggleDiv = createQuizForm.querySelector(`#${toggleDivID}`);
            if (toggleDiv) {
                toggleDiv.classList.toggle('hidden');
            }
        }
    });

    const createBtn = createQuizForm.querySelector('#action-btn');
    createBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const responseContainer = createQuizForm.querySelector('#create-cq-response-container');

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const course_id = courseID.value.trim();
        const quiz_type = createQuizForm.querySelector('#quiz-type').value;
        const publish = createQuizForm.querySelector('#quiz-publish').checked;
        const num_quizzes = numOfQuizzes.value.trim();

        // finding out which question types to add
        const questionTypes = [
            {
                name: "true_false_question",
                enabled: createQuizForm.querySelector('#true_false_question').checked,
                number: createQuizForm.querySelector('#add-true-false-input').value.trim()
            },
            {
                name: "short_answer_question",
                enabled: createQuizForm.querySelector('#short_answer_question').checked,
                number: createQuizForm.querySelector('#add-short-answer-input').value.trim()
            },
            {
                name: "numerical_question",
                enabled: createQuizForm.querySelector('#numerical_question').checked,
                number: createQuizForm.querySelector('#add-numerical-input').value.trim()
            },
            {
                name: "calculated_question",
                enabled: createQuizForm.querySelector('#calculated_question').checked,
                number: createQuizForm.querySelector('#add-calculated-input').value.trim()
            },
            {
                name: "multiple_dropdowns_question",
                enabled: createQuizForm.querySelector('#multiple_dropdowns_question').checked,
                number: createQuizForm.querySelector('#add-mlt-drop-input').value.trim()
            },
            {
                name: "multiple_choice_question",
                enabled: createQuizForm.querySelector('#multiple_choice_question').checked,
                number: createQuizForm.querySelector('#add-mlt-choice-input').value.trim()
            },
            {
                name: "multiple_answers_question",
                enabled: createQuizForm.querySelector('#multiple_answers_question').checked,
                number: createQuizForm.querySelector('#add-mlt-answers-input').value.trim()
            },
            {
                name: "matching_question",
                enabled: createQuizForm.querySelector('#matching_question').checked,
                number: createQuizForm.querySelector('#add-matching-input').value.trim()
            },
            {
                name: "fill_in_multiple_blanks_question",
                enabled: createQuizForm.querySelector('#fill_in_multiple_blanks_question').checked,
                number: createQuizForm.querySelector('#add-fill-mlt-blanks-input').value.trim()
            },
            {
                name: "file_upload_question",
                enabled: createQuizForm.querySelector('#file_upload_question').checked,
                number: createQuizForm.querySelector('#add-fileUpload-input').value.trim()
            },
            {
                name: "essay_question",
                enabled: createQuizForm.querySelector('#essay_question').checked,
                number: createQuizForm.querySelector('#add-essay-input').value.trim()
            }
        ];

        // const numerical_question = createQuizForm.querySelector('#numerical_question').checked;
        // const multiple_dropdowns_question = createQuizForm.querySelector('#multiple_dropdowns_question').checked;
        // const multiple_choice_question = createQuizForm.querySelector('#multiple_choice_question').checked;
        // const multiple_answers_question = createQuizForm.querySelector('#multiple_answers_question').checked;
        // const matching_question = createQuizForm.querySelector('#matching_question').checked;
        // const fill_in_multiple_blanks_question = createQuizForm.querySelector('#fill_in_multiple_blanks_question').checked;
        // const file_upload_question = createQuizForm.querySelector('#file_upload_question').checked;
        // const essay_question = createQuizForm.querySelector('#essay_question').checked;

        const progressDiv = createQuizForm.querySelector('#create-cq-progress-div');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressInfo = createQuizForm.querySelector('#create-cq-progress-info');

        // clean environment
        progressDiv.hidden = false;
        progressBar.style.width = '0%';
        progressInfo.innerHTML = '';

        const data = {
            domain,
            token,
            course_id,
            quiz_type,
            publish,
            num_quizzes,
            questionTypes
        };

        try {
            window.progressAPI.onUpdateProgress((progress) => {
                progressBar.style.width = `${progress}%`;
            });

            // returns the IDs of the quizzes created
            const createQuizzesResponse = await window.axios.createClassicQuizzes(data);
            if (createQuizzesResponse.successful.length > 0) {
                progressInfo.innerHTML = `Successfully created ${createQuizzesResponse.successful.length} quizzes.`;
                responseContainer.innerHTML = '<p>Creating questions in the new quizzes...</p>';
                // resetting progress bar
                progressBar.style.width = '0%';

                // get the quiz ids from teh createQuizzesResponse.successful
                const quizIDs = createQuizzesResponse.successful.map(quiz => quiz.value.id);

                const quizQuestionData = {
                    domain,
                    token,
                    course_id,
                    questionTypes,
                    quizzes: quizIDs
                }

                const createQuestionsResponse = await window.axios.createClassicQuestions(quizQuestionData);
                if (createQuestionsResponse.successful.length > 0) {
                    progressInfo.innerHTML += ` Successfully created ${createQuestionsResponse.successful.length} questions.`;
                    progressBar.style.width = '100%';
                } else {
                    progressInfo.innerHTML += ` Failed to create questions for ${quizIDs.length} quizzes.`;
                    progressBar.parentElement.hidden = true;
                    errorHandler({ message: `${createQuestionsResponse.failed[0].reason}` }, progressInfo);
                }
            }
            if (createQuizzesResponse.failed.length > 0) {
                progressInfo.innerHTML += `Failed to create ${createQuizzesResponse.failed.length} quizzes.`;
                progressBar.parentElement.hidden = true;
                errorHandler({ message: `${createQuizzesResponse.failed[0].reason}` }, progressInfo);
            }


        } catch (error) {
            progressBar.parentElement.hidden = true;
            errorHandler(error, progressInfo);
        } finally {
            createBtn.disabled = false;
        }
    });
}

async function deleteAllClassicQuizzes(e) {
    hideEndpoints(e);
    const eContent = document.querySelector('#endpoint-content');
    let deleteQuizForm = eContent.querySelector('#delete-quiz-form');
    if (!deleteQuizForm) {
        deleteQuizForm = document.createElement('form');
        deleteQuizForm.id = 'delete-quiz-form';
        deleteQuizForm.innerHTML = `
            <div class="row">
                <div class="col-2 mb-3">
                    <label for="course-id" class="form-label">Course ID</label>
                    <input type="number" class="form-control" id="course-id" required>
                </div>
            </div>
            <button id="check-quiz-btn" type="button" class="btn btn-danger" disabled>Check</button>
            <div hidden id="delete-quiz-progress-div">
                <p id="delete-quiz-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">

                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="delete-quiz-response-container" class="mt-3">
            </div>
        `;

        eContent.append(deleteQuizForm);
    }
    deleteQuizForm.hidden = false;

    const checkQuizBtn = deleteQuizForm.querySelector('#check-quiz-btn');
    // check the see if the course ID is valid
    const courseIDInput = deleteQuizForm.querySelector('#course-id');
    const toggleCheckQuizzesBtn = () => {
        checkQuizBtn.disabled = !(courseIDInput.value && courseIDInput.value.trim() !== '');

    };

    courseIDInput.addEventListener('input', toggleCheckQuizzesBtn);

    checkQuizBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkQuizBtn.disabled = true;

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const courseID = deleteQuizForm.querySelector('#course-id').value;
        const responseContainer = deleteQuizForm.querySelector('#delete-quiz-response-container');

        const progressDiv = deleteQuizForm.querySelector('#delete-quiz-progress-div');
        const progressInfo = deleteQuizForm.querySelector('#delete-quiz-progress-info');
        const progressBar = deleteQuizForm.querySelector('.progress-bar');

        progressBar.style.width = '0%';
        progressDiv.hidden = false;
        progressInfo.innerHTML = '';

        window.progressAPI.onUpdateProgress((progress) => {
            progressBar.style.width = `${progress}%`;
        });

        let quizzes = '';
        let hasError = false;
        try {
            quizzes = await window.axios.getClassicQuizzes({ domain, token, courseID });
            if (quizzes.length === 0) {
                progressInfo.innerHTML = 'No quizzes found to delete.';
                return;
            }
            progressInfo.innerHTML = `Found ${quizzes.length} quizzes to delete.`;

        } catch (error) {
            // Handle error (e.g., show an error message)
            hasError = true;
            errorHandler(error, progressInfo);
        } finally {
            checkQuizBtn.disabled = false;
        }

        if (!hasError) {
            responseContainer.innerHTML = `<div>
                    <div class="col-auto">
                        <div id="dcq-response-details" class="row align-items-center">
                            <div class="col-2">
                                <button id="delete-btn" type="button" class="btn btn-danger">Delete</button>
                            </div>
                            <div class="col-2">
                                <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>`;


            const dcqResponseDetails = responseContainer.querySelector('#dcq-response-details');
            const deleteBtn = dcqResponseDetails.querySelector('#delete-btn');
            const cancelBtn = dcqResponseDetails.querySelector('#cancel-btn');

            deleteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                deleteBtn.disabled = true;
                cancelBtn.disabled = true;

                progressInfo.innerHTML = 'Deleting quizzes...';
                progressBar.style.width = '0%';

                try {
                    const deleteResponse = await window.axios.deleteClassicQuizzes({ domain, token, courseID, quizzes });
                    if (deleteResponse.successful.length > 0) {
                        progressInfo.innerHTML = `Successfully deleted ${deleteResponse.successful.length} quizzes.`;
                        progressBar.style.width = '100%';
                    } else {
                        progressInfo.innerHTML = `Failed to delete quizzes`;
                        errorHandler({ message: deleteResponse.failed[0].reason }, progressInfo);
                    }
                } catch (error) {
                    errorHandler(error, progressInfo);
                } finally {
                    deleteBtn.hidden = true;
                    deleteBtn.disabled = true
                    cancelBtn.hidden = true;
                    cancelBtn.disabled = true;
                }
            });

            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                deleteQuizForm.querySelector('#course-id').value = '';
                checkQuizBtn.disabled = true;
                responseContainer.innerHTML = '';
                progressDiv.hidden = true;
            });
        }
    });
}

async function addQuestionsNQ(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let addQuestionsNQForm = eContent.querySelector('#add-nq-questions-form');

    if (!addQuestionsNQForm) {
        addQuestionsNQForm = document.createElement('form');
        addQuestionsNQForm.id = 'add-nq-questions-form';
        addQuestionsNQForm.innerHTML = `
            <div>
                <h3>Add questions to a New Quiz</h3>
                <p></p>
            </div>
            <div class="row">
                <div class="row align-items-center">
                        <div class="col-2">
                            <label class="form-label">Course</label>
                            <input id="add-nq-questions-course-id" type="text" class="form-control" aria-describedby="input-checker" />
                        </div>
                    <div class="col-2">
                        <label class="form-label">Quiz ID</label>
                        <input id="nq-id" type="text" class="form-control" value="1">
                    </div>
                    <div class="col-2">
                        <label class="form-label">How many</label>
                        <input id="nq-question-number" type="text" class="form-control" value="1">
                    </div>
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <hr class="mt-2">
                <div class="row">
                    <div>
                        <h5>Type</h5>
                        <select id="nq-question-type" class="form-select col-auto custom-select-width">
                            <option value="choice">Multiple Choice</option>
                            <option value="multi-answer">Multi Answer</option>
                            <option value="essay">Essay</option>
                            <option value="true-false">True/False</option>
                            <option value="matching">Matching</option>
                            <option value="categorization">Categorization</option>
                            <option value="file-upload">File Upload</option>
                            <option value="formula">Formula</option>
                            <option value="ordering">Ordering</option>
                            <option value="rich-fill-blank">Fill in the Blank</option>
                            <option value="hot-spot">Hot Spot</option>
                            <option value="numeric">Numeric</option>
                        </select>
                    </div>         
                </div>
                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="add-nq-questions-btn" class="btn btn-primary mt-3" disabled>Create</button>
                </div>
            </div>
            <div hidden id="add-nq-questions-progress-div">
                <p id="add-nq-questions-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="add-nq-questions-response-container" class="mt-3">
            </div>
        `;

        eContent.append(addQuestionsNQForm);
    }
    addQuestionsNQForm.hidden = false;

    const courseID = addQuestionsNQForm.querySelector('#add-nq-questions-course-id');

    courseID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkCourseID(courseID, addQuestionsNQForm);
    });

    const createQuestionBtn = addQuestionsNQForm.querySelector('#add-nq-questions-btn');
    createQuestionBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        createQuestionBtn.disabled = true;

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();

        const nqResponseContainer = addQuestionsNQForm.querySelector('#add-nq-questions-response-container');

        const nQuestions = parseInt(addQuestionsNQForm.querySelector('#nq-question-number').value.trim());
        const quizID = parseInt(addQuestionsNQForm.querySelector('#nq-id').value.trim());

        const questionSelect = addQuestionsNQForm.querySelector('#nq-question-type');

        console.log('button pressed.');


        createQuestionBtn.disabled = false;

        const questionData = {
            domain,
            token,
            course_id: courseID.value.trim(),
            quiz_id: quizID,
            num_questions: nQuestions,
            question_type: questionSelect.value
        }

        console.log('The value: ', questionData);

        try {
            throw new Error('There was an error');
        } catch (error) {
            errorHandler(error, nqResponseContainer);
        }
    })
}