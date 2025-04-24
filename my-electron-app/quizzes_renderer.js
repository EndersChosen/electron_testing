function quizTemplate(e) {
    switch (e.target.id) {
        case 'create-classic-quiz':
            createQuiz(e);
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
                            <input id="essay_question" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="essay_question" class="form-check-label">Essay</label>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="file_upload_question" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="file_upload_question" class="form-check-label">File Upload</label>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="fill_in_multiple_blanks_question" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="fill_in_multiple_blanks_question" class="form-check-label">Fill in multiple blanks</label>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="matching_question" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="matching_question" class="form-check-label">Matching</label>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="multiple_answers_question" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="multiple_answers_question" class="form-check-label">Multiple Answers</label>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="multiple_choice_question" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="multiple_choice_question" class="form-check-label">Multiple Choice</label>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="multiple_dropdowns_question" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="multiple_dropdowns_question" class="form-check-label">Multiple Dropdowns</label>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="numerical_question" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="numerical_question" class="form-check-label">Numerical</label>
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


    const createBtn = createQuizForm.querySelector('#action-btn');
    createBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const responseContainer = eContent.querySelector('#response-container');

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const course_id = courseID.value.trim();
        const quiz_type = createQuizForm.querySelector('#quiz-type').value;
        const publish = createQuizForm.querySelector('#quiz-publish').checked;
        const numerical_question = createQuizForm.querySelector('#numerical_question').checked;
        const multiple_dropdowns_question = createQuizForm.querySelector('#multiple_dropdowns_question').checked;
        const multiple_choice_question = createQuizForm.querySelector('#multiple_choice_question').checked;
        const multiple_answers_question = createQuizForm.querySelector('#multiple_answers_question').checked;
        const matching_question = createQuizForm.querySelector('#matching_question').checked;
        const fill_in_multiple_blanks_question = createQuizForm.querySelector('#fill_in_multiple_blanks_question').checked;
        const file_upload_question = createQuizForm.querySelector('#file_upload_question').checked;
        const essay_question = createQuizForm.querySelector('#essay_question').checked;
        const num_quizzes = numOfQuizzes.value.trim();

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
            essay_question,
            file_upload_question,
            fill_in_multiple_blanks_question,
            matching_question,
            multiple_answers_question,
            multiple_choice_question,
            multiple_dropdowns_question,
            numerical_question,
            num_quizzes
        };

        try {
            const createQuizzesResponse = await window.axios.createQuiz(data);
            if (createQuizzesResponse.successful.length > 0) {
                progressInfo.innerHTML = `Successfully created ${createQuizzesResponse.successful.length} quizzes.`;
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