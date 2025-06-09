function quizTemplate(e) {
    switch (e.target.id) {
        case 'create-classic-quiz':
            createQuiz(e);
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
                            <input id="course-id" type="text" class="form-control" aria-describedby="input-checker" />
                        </div>
                    <div class="col-2">
                        <label class="form-label">How many</label>
                        <input id="quiz-number" type="text" class="form-control" value="1">
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
                    </div>           
                </div>
                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="action-btn" class="btn btn-primary mt-3" disabled>Create</button>
                </div>
            </div>
            <div hidden id="progress-div">
                <p id="progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="response-container" class="mt-3">
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
        "essay_question": 'add-essay-div',
        "file_upload_question": 'add-fileUpload-div',
        "fill_in_multiple_blanks_question": 'add-fill-mlt-blanks-div',
        "matching_question": 'add-matching-div',
        "multiple_answers_question": 'add-mlt-answers-div',
        "multiple_choice_question": 'add-mlt-choice-div',
        "multiple_dropdowns_question": 'add-mlt-drop-div',
        "numerical_question": 'add-numerical-div'
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

        const responseContainer = createQuizForm.querySelector('#response-container');

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const course_id = courseID.value.trim();
        const quiz_type = createQuizForm.querySelector('#quiz-type').value;
        const publish = createQuizForm.querySelector('#quiz-publish').checked;
        const num_quizzes = numOfQuizzes.value.trim();

        // finding out which question types to add
        const questionTypes = [
            {
                name: "numerical_question",
                enabled: createQuizForm.querySelector('#numerical_question').checked,
                number: createQuizForm.querySelector('#add-numerical-input').value.trim()
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

        const progressDiv = createQuizForm.querySelector('#progress-div');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressInfo = createQuizForm.querySelector('#progress-info');

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
            questionTypes
        };

        try {
            window.progressAPI.onUpdateProgress((progress) => {
                progressBar.style.width = `${progress}%`;
            });

            const createQuizzesResponse = await window.axios.createQuiz(data);
            if (createQuizzesResponse.successful.length > 0) {
                progressInfo.innerHTML = `Successfully created ${createQuizzesResponse.successful.length} quizzes.`;
                responseContainer.innerHTML = '<p>Creating questions in the new quizzes...</p>';
                // resetting progress bar
                progressBar.style.width = '0%';

                const quizQuestionData = {
                    domain,
                    token,
                    course_id,
                    questionTypes,
                    quizzes: createQuizzesResponse
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