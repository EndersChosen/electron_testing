// ****************************************
//
// Course endpoints
//
// ****************************************
function courseTemplate(e) {
    switch (e.target.id) {
        case 'reset-courses':
            resetCourses(e);
            break;
        case 'create-support-course':
            createSupportCourse(e);
            break;
        default:
            break;
    }
}

async function resetCourses(e) {
    const eContent = document.querySelector('#endpoint-content');

    eContent.innerHTML = `
        <div>
            <h3>Reset Courses</h3>
        </div>
    `;

    const eForm = document.createElement('form');


    eForm.innerHTML = `
            <div class="row">
                <div class="mb-3">
                    <div class="col-auto">
                        <label for="reset-courses-area" class="form-label">Courses to be reset - useful when an Admin is needing to re-apply a template</label>
                        <textarea class="form-control" id="reset-courses-area" rows="3" placeholder="Enter comma separated course ids to be reset here."></textarea>
                    </div>
                </div>
            </div>
        <button type="button" class="btn btn-primary mt-3" id="resetBtn" disabled>Reset</button>
        <div id="progress-div" hidden>
            <p id="progress-info"></p>
            <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
        </div>`

    eContent.append(eForm);

    const progressDiv = eContent.querySelector('#progress-div');
    const progressBar = eContent.querySelector('.progress-bar');
    const progressInfo = eContent.querySelector('#progress-info');
    const resetBtn = eContent.querySelector('#resetBtn');
    const courseTextArea = eContent.querySelector('#reset-courses-area');
    courseTextArea.addEventListener('input', (e) => {
        if (courseTextArea.value.length < 1) {
            resetBtn.disabled = true;
        } else {
            resetBtn.disabled = false;
        }
    })

    resetBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();


        resetBtn.disabled = true;
        progressDiv.hidden = false;
        progressInfo.innerHTML = 'Resetting courses....';

        const domain = document.querySelector('#domain').value.trim();
        const apiToken = document.querySelector('#token').value.trim();
        const courses = eContent.querySelector('#reset-courses-area').value.split(/[\n,]/).map(course => course.trim());

        const data = {
            domain: domain,
            token: apiToken,
            courses: courses
        }

        let response;
        try {
            window.progressAPI.onUpdateProgress((progress) => {
                progressBar.style.width = `${progress}%`;
            });

            response = await window.axios.resetCourses(data);
            if (response.successful.length > 0) {
                progressInfo.innerHTML = `Successfully reset ${response.successful.length} courses.`;
            }
            if (response.failed.length > 0) {
                progressInfo.innerHTML += `Failed to reset ${response.failed.length} courses.`;
                progressBar.parentElement.hidden = true;
                for (let failure of response.failed) {
                    errorHandler({ message: `${failure.reason}` }, progressInfo);
                }
            }

            // for (let response of responses) {
            //     eContent.querySelector('#response-container').innerHTML += '<p>Course ID: ' + response.course_id + ' ' + response.status + '</p>';
            // }
        } catch (error) {
            errorHandler(error, progressInfo);
        } finally {
            resetBtn.disabled = false;
        }
    })

    // adding response container
    const eResponse = document.createElement('div');
    eResponse.id = "response-container";
    eResponse.classList.add('mt-5');
    eContent.append(eResponse);
}

async function createSupportCourse(e) {
    const domain = `https://${document.querySelector('#domain').value}`;
    const apiToken = document.querySelector('#token').value;
    const eContent = document.querySelector('#endpoint-content');

    eContent.innerHTML = `
        <div>
            <h3>Create Support Course</h3>
        </div>
    `;

    const eForm = document.createElement('form');

    eForm.innerHTML = `
            <div class="row">
                <div class="mb-3">
                    <div class="col-6">
                        <label for="course-name" class="form-label">Course name</label>
                        <input type="text" class="form-control" id="course-name">
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-publish" class="form-label">Publish</label>
                        <input type="checkbox" class="form-check-input" role="switch" id="course-publish">
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-blueprint" class="form-label">Blueprint</label>
                        <input type="checkbox" class="form-check-input" role="switch" id="course-blueprint">
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-add-users" class="form-label">Add Users</label>
                        <input type="checkbox" class="form-check-input" role="switch" id="course-add-users">
                    </div>
                    <div id="add-users-div" class="row hidden">
                        <div class="col-2">
                            <label for="course-add-students" class="form-label">Students</label>
                            <input type="text" class="form-control" role="switch" id="course-add-students">
                        </div>
                        <div class="col-2">
                            <label for="course-add-teachers" class="form-label">Teachers</label>
                            <input type="text" class="form-control" role="switch" id="course-add-teachers">
                        </div>
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-assignments" class="form-label">Add Assignments</label>
                        <input type="checkbox" class="form-check-input" role="switch" id="course-assignments">
                    </div>
                    <div id="add-assignments-div" class="row hidden">
                        <div class="col-2">
                            <label for="course-add-assignments" class="form-label">How many</label>
                            <input type="text" class="form-control" role="switch" id="course-add-assignments">
                        </div>
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-add-cq" class="form-label">Add Classic Quizzes</label>
                        <input type="checkbox" class="form-check-input" role="switch" id="course-add-cq">
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-add-nq" class="form-label">Add New Quizzes</label>
                        <input type="checkbox" class="form-check-input"  role="switch" id="course-add-nq">
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-add-discussions" class="form-label">Add Discussions</label>
                        <input type="checkbox" class="form-check-input"  role="switch" id="course-add-discussions">
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-add-pages" class="form-label">Add Pages</label>
                        <input type="checkbox" class="form-check-input"  role="switch" id="course-add-pages">
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-add-modules" class="form-label">Add Modules</label>
                        <input type="checkbox" class="form-check-input"  role="switch" id="course-add-modules">
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-add-sections" class="form-label">Add Sections</label>
                        <input type="checkbox" class="form-check-input"  role="switch" id="course-add-sections">
                    </div>
                    <div class="col-auto form-check form-switch">
                        <label for="course-submissions" class="form-label">Create Submissions</label>
                        <input type="checkbox" class="form-check-input"  role="switch" id="course-submissions">
                    </div>
                </div>
            </div>
        <button type="button" class="btn btn-primary mt-3" id="createBtn">Create</button>`

    eContent.append(eForm);

    // currently disabled features
    eContent.querySelector('#course-blueprint').disabled = true;

    const addUsersToggle = eContent.querySelector('#course-add-users');
    addUsersToggle.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const addUsersDiv = eContent.querySelector('#add-users-div');
        if (e.target.checked) {
            addUsersDiv.classList.remove('hidden');
            addUsersDiv.classList.add('visible');
        } else {
            addUsersDiv.classList.remove('visible');
            addUsersDiv.classList.add('hidden');
        }
    });

    function checkIfEnabled() {
        const addUsersDiv = eContent.querySelector('#add-users-div');
        if (addUsersToggle.checked) {
            addUsersDiv.classList.remove('hidden');
            addUsersDiv.classList.add('visible');
        } else {
            addUsersDiv.classList.remove('visible');
            addUsersDiv.classList.add('hidden');
        }
    }

    const createBtn = eContent.querySelector('button');
    createBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const courseName = eContent.querySelector('#course-name').value;
        const coursePublishChbx = eContent.querySelector('#course-publish').checked;
        const courseBlueprintChbx = eContent.querySelector('#course-blueprint').checked;
        const courseAddUsersChbx = eContent.querySelector('#course-add-users').checked;
        const courseAddAssignmentsChbx = eContent.querySelector('#course-add-assignments').checked;
        const courseAddCQChbx = eContent.querySelector('#course-add-cq').checked;
        const courseAddNQChbx = eContent.querySelector('#course-add-nq').checked;
        const courseAddDiscussionsChbx = eContent.querySelector('#course-add-discussions').checked;
        const courseAddPagesChbx = eContent.querySelector('#course-add-pages').checked;
        const courseAddModulesChbx = eContent.querySelector('#course-add-modules').checked;
        const courseAddSectionsChbx = eContent.querySelector('#course-add-sections').checked;
        const courseSubmissionsChbx = eContent.querySelector('#course-submissions').checked;




        const data = {
            domain: domain,
            token: apiToken,
            course: {
                name: courseName,
                publish: coursePublishChbx,
                blueprint: courseBlueprintChbx,
                addUsers: courseAddUsersChbx,
                addAssignments: courseAddAssignmentsChbx,
                addCQ: courseAddCQChbx,
                addNQ: courseAddNQChbx,
                addDiscussions: courseAddDiscussionsChbx,
                addPages: courseAddPagesChbx,
                addModules: courseAddModulesChbx,
                addSections: courseAddSectionsChbx,
                submissions: courseSubmissionsChbx
            }
        }

        console.log('The data is: ', data);

        try {
            const response = await window.axios.createSupportCourse(data);
            eContent.querySelector('#response-container').innerHTML = '<p>Course ID: ' + response.course_id + ' ' + response.status + '</p>';
        } catch (error) {
            console.log('Error: ', error);
        } finally {
            checkBtn.disabled = false;
        }
    })

    // adding response container
    const eResponse = document.createElement('div');
    eResponse.id = "response";
}