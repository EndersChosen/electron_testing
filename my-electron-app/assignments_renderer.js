// ****************************************************
//
// Assignment Endpoints
//
// ****************************************************

function assignmentTemplate(e) {
    // const eContent = document.querySelector('#endpoint-content');
    // eContent.innerHTML = `${e.target.id} was clicked`;

    switch (e.target.id) {
        case 'create-assignments':
            assignmentCreator(e);
            break;
        case 'delete-nosubmission-assignments':
            noSubmissionAssignments(e);
            break;
        case 'delete-no-due-date-assignments':
            deleteNoDueDateAssignments(e);
            break;
        case 'delete-unpublished-assignments':
            unpublishedAssignments(e);
            break;
        case 'delete-nonmodule-assignments':
            nonModuleAssignments(e);
            break;
        case 'delete-old-assignments':
            deleteOldAssignments(e);
            break;
        case 'delete-assignments-from-import':
            deleteAssignmentsFromImport(e);
            break;
        case 'keep-assignments-in-group':
            keepAssignmentsInGroup(e);
            break;
        case 'move-assignments':
            moveAssignmentsToSingleGroup(e);
            break;
        case 'delete-assignments-from-group':
            deleteAssignmentsInGroup(e);
            break;
        default:
            break;
    }
}

function assignmentCreator(e) {
    let emptyGroups = [];
    hideEndpoints(e)

    const eContent = document.querySelector('#endpoint-content');
    let assignmentCreatorForm = eContent.querySelector('#assignment-creator-form');

    if (!assignmentCreatorForm) {
        // const assignmentCreatorHeader = document.createElement('div');
        // assignmentCreatorHeader.id = 'assignment-creator-header';
        // assignmentCreatorHeader.innerHTML = '<h3>Create Assignments</h3>'

        assignmentCreatorForm = document.createElement('form');
        assignmentCreatorForm.id = 'assignment-creator-form';
        assignmentCreatorForm.innerHTML = `
            <div>
                <h3>Create Assignments</h3>
            </div>
            <div class="row">
                <div class="row align-items-center">
                    <div class="col-2">
                        <label class="form-label">Course</label>
                        <input id="course-id" type="text" class="form-control" aria-describedby="input-checker" />
                    </div>
                    <div class="col-auto" >
                        <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                    </div>
                    <div class="col-2">
                        <label class="form-label">How many</label>
                        <input id="assignment-number" type="text" class="form-control" value="1">
                    </div>
                    <div class="col-2">
                        <label class="form-label">Points</label>
                        <input id="assignment-points" type="text" class="form-control" value="10">
                    </div>
                </div>
                <hr class="mt-2">
                <div class="row">
                    <div>
                        <h5>Assignment Settings</h5>
                        <div class="col-auto form-check form-switch" >
                            <input id="assignment-publish" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="assignment-publish" class="form-check-label">Publish</label>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="assignment-peer" class="form-check-input" type="checkbox" role="switch">
                            <label for="assignment-peer" class="form-check-label">Peer Reviews</label>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <input id="assignment-anonymous" class="form-check-input" type="checkbox" role="switch">
                            <label for="assignment-anonymous" class="form-check-label">Anonymous</label>
                        </div>
                        <div class="row justify-content-start align-items-baseline" >
                            <label for="assignment-grade-type" class="form-label col-auto">Display Grade as</label>
                            <select id="assignment-grade-type" class="form-select col-auto custom-select-width">
                                <option value="points" selected>Points</option>
                                <option value="percent">Percent</option>
                                <option value="letter">Letter</option>
                                <option value="gpa_scale">GPA Scale</option>
                                <option value="pass_fail">Complete/Incomplete</option>
                            </select>
                        </div>
                    </div>
                    <div id="submission-types">
                        <h5>Submission Types</h5>
                        <div class="col-auto form-check form-switch" >
                            <label for="submission-none" class="form-label">No Submission</label>
                            <input id="submission-none" class="form-check-input" type="checkbox" role="switch" />
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <label for="submission-on_paper" class="form-label">On Paper</label>
                            <input id="submission-on_paper" class="form-check-input" type="checkbox" role="switch" />
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <label for="submission-online_upload" class="form-label">File Upload</label>
                            <input id="submission-online_upload" class="form-check-input" type="checkbox" role="switch" checked/>
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <label for="submission-online_text_entry" class="form-label">Text Entry</label>
                            <input id="submission-online_text_entry" class="form-check-input" type="checkbox" role="switch" />
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <label for="submission-online_url" class="form-label">Website URL</label>
                            <input id="submission-online_url" class="form-check-input" type="checkbox" role="switch" />
                        </div>
                        <div class="col-auto form-check form-switch" >
                            <label for="submission-media_recording" class="form-label">Media recording</label>
                            <input id="submission-media_recording" class="form-check-input" type="checkbox" role="switch" />
                        </div>
                    </div>
                </div>
                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="action-btn" class="btn btn-primary mt-3">Create</button>
                </div>
            </div>
            <div hidden id="assignment-creator-progress-div">
                <p id="assignment-creator-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">

                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="assignment-creator-response-container" class="mt-3">
            </div>
        `;
        eContent.append(assignmentCreatorForm);

        // Enhance the progress bar with percent label
        const progressBar = assignmentCreatorForm.querySelector('.progress-bar');
        if (progressBar) {
            enhanceProgressBarWithPercent(progressBar);
        }

        // Wire up listeners ONCE when the form is created
        const submissionTypes = assignmentCreatorForm.querySelector('#submission-types');

        function uncheckAllSubmissions() {
            submissionTypes.querySelector('#submission-none').checked = false;
            submissionTypes.querySelector('#submission-on_paper').checked = false;
            submissionTypes.querySelector('#submission-online_upload').checked = false;
            submissionTypes.querySelector('#submission-online_text_entry').checked = false;
            submissionTypes.querySelector('#submission-online_url').checked = false;
            submissionTypes.querySelector('#submission-media_recording').checked = false;
        }

        function handleSubmissionTypes(ev) {
            if (ev.target.id === 'submission-none' || ev.target.id === 'submission-on_paper') {
                uncheckAllSubmissions();
                ev.target.checked = true;
            } else {
                submissionTypes.querySelector('#submission-none').checked = false;
                submissionTypes.querySelector('#submission-on_paper').checked = false;
            }
        }
        submissionTypes.addEventListener('change', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            handleSubmissionTypes(ev);
        });

        const courseID = assignmentCreatorForm.querySelector('#course-id');
        courseID.addEventListener('change', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            checkCourseID(courseID, assignmentCreatorForm);
        });

        const assignmentCreateBtn = assignmentCreatorForm.querySelector('#action-btn');
        assignmentCreateBtn.addEventListener('click', async function (ev) {
            ev.stopPropagation();
            ev.preventDefault();

            assignmentCreateBtn.disabled = true;

            // get values and inputs
            const assigmentCreatorResponseContainer = assignmentCreatorForm.querySelector('#assignment-creator-response-container');
            const domain = document.querySelector('#domain');
            const apiToken = document.querySelector('#token');
            const checkedSubTypes = submissionTypes.querySelectorAll('input[type="checkbox"]:checked');
            const checkedSubmissionTypes = Array.from(checkedSubTypes).map((subType) => {
                return subType.id.split('-')[1];
            });
            const assignmentNumber = assignmentCreatorForm.querySelector('#assignment-number').value.trim();
            const assignmentPoints = assignmentCreatorForm.querySelector('#assignment-points');
            const publish = assignmentCreatorForm.querySelector('#assignment-publish').checked;
            const peerReviews = assignmentCreatorForm.querySelector('#assignment-peer').checked;
            const anonymous = assignmentCreatorForm.querySelector('#assignment-anonymous').checked;
            const gradeType = assignmentCreatorForm.querySelector('#assignment-grade-type').value;

            const assignmentCreatorProgressDiv = assignmentCreatorForm.querySelector('#assignment-creator-progress-div');
            const assignmentCreatorProgressBar = assignmentCreatorProgressDiv.querySelector('.progress-bar');
            const assignmentCreatorProgressInfo = assignmentCreatorForm.querySelector('#assignment-creator-progress-info');

            // clean environment
            assignmentCreatorProgressDiv.hidden = false;
            updateProgressWithPercent(assignmentCreatorProgressBar, 0);
            enhanceProgressBarWithPercent(assignmentCreatorProgressBar);
            assignmentCreatorProgressInfo.innerHTML = '';

            // data to be used to create assignments
            const requestData = {
                domain: domain.value.trim(),
                token: apiToken.value.trim(),
                course_id: courseID.value.trim(),
                number: parseInt(assignmentNumber),
                name: 'Assignment',
                points: parseInt(assignmentPoints.value.trim()),
                publish: publish ? 'published' : 'unpublished',
                peer_reviews: peerReviews,
                anonymous: anonymous,
                grade_type: gradeType,
                submissionTypes: checkedSubmissionTypes
            }


            window.progressAPI.onUpdateProgress((progress) => {
                updateProgressWithPercent(assignmentCreatorProgressBar, progress);
            });

            try {
                const createAssignmentResponse = await window.axios.createAssignments(requestData);
                if (createAssignmentResponse.successful.length > 0) {
                    assignmentCreatorProgressInfo.innerHTML = `Successfully created ${createAssignmentResponse.successful.length} assignments.`;
                }
                if (createAssignmentResponse.failed.length > 0) {
                    assignmentCreatorProgressInfo.innerHTML += `Failed to create ${createAssignmentResponse.failed.length} assignments.`;
                    assignmentCreatorProgressBar.parentElement.hidden = true;
                    errorHandler({ message: `${createAssignmentResponse.failed[0].reason}` }, assignmentCreatorProgressInfo);
                }
            } catch (error) {
                assignmentCreatorProgressBar.parentElement.hidden = true;
                errorHandler(error, assignmentCreatorProgressInfo);
            } finally {
                assignmentCreateBtn.disabled = false;
            }
        });
    }
    assignmentCreatorForm.hidden = false;
}

function noSubmissionAssignments(e) {
    hideEndpoints(e);
    console.log('renderer > noSubmissionAssignments');


    let assignments = [];

    const eContent = document.querySelector('#endpoint-content');
    let noSubmissionAssignmentsForm = eContent.querySelector('#no-submission-assignments-form');

    if (!noSubmissionAssignmentsForm) {
        noSubmissionAssignmentsForm = document.createElement('form');
        noSubmissionAssignmentsForm.id = 'no-submission-assignments-form';

        // eContent.innerHTML = `
        //     <div>
        //         <h3>Delete Assignments With No Submissions</h3>
        //     </div>
        // `;

        // const eForm = document.createElement('form');

        noSubmissionAssignmentsForm.innerHTML = `
            <div>
                <h3>Delete Assignments With No Submissions</h3>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
                    <label class="form-label">Course</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="course-id" type="text" class="form-control" aria-describedby="input-checker" />
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div> 
                <div class="col-auto form-check form-switch mt-3 ms-3">
                    <input id="graded-submissions" class="form-check-input" type="checkbox" role="switch" />
                    <label for="graded-submissions" class="form-check-label">Delete assignments with grades</label>
                    <div id="graded-help" class="form-text">
                        (otherwise this will check for assignments with no submissions <em>AND</em> no grades)
                    </div>
                </div>
                <div class="col-auto">
    
                </div>
                <div class="w-100"></div> 
                <div class="col-auto">
                    <button id="action-btn" class="btn btn-primary mt-3">Check</button>
                </div>
            </div>
            <div hidden id="nsa-progress-div">
                <p id="nsa-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
    
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="nsa-response-container" class="mt-5">
            </div>
        `;



        eContent.append(noSubmissionAssignmentsForm);
    }
    noSubmissionAssignmentsForm.hidden = false;


    const courseID = document.querySelector('#course-id');
    courseID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkCourseID(courseID, eContent);
    });

    const checkBtn = noSubmissionAssignmentsForm.querySelector('#action-btn');
    checkBtn.addEventListener('click', async function (e) {
        e.stopPropagation();
        e.preventDefault();

        const gradedSubmissions = noSubmissionAssignmentsForm.querySelector('#graded-submissions').checked;
        console.log(gradedSubmissions);

        checkBtn.disabled = true;
        console.log('renderer > noSubmissionAssignments > check');

        const nsaResponseContainer = noSubmissionAssignmentsForm.querySelector('#nsa-response-container');
        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const course_id = courseID.value.trim();
        const nsaProgressDiv = noSubmissionAssignmentsForm.querySelector('#nsa-progress-div');
        const nsaProgressBar = nsaProgressDiv.querySelector('.progress-bar');
        const nsaProgressInfo = noSubmissionAssignmentsForm.querySelector('#nsa-progress-info');


        // clean environment
        nsaResponseContainer.innerHTML = '';
        nsaProgressDiv.hidden = false;
        nsaProgressBar.parentElement.hidden = true;
        updateProgressWithPercent(nsaProgressBar, 0);
        enhanceProgressBarWithPercent(nsaProgressBar);
        nsaProgressInfo.innerHTML = 'Checking...';


        const requestData = {
            domain,
            token,
            course_id,
            graded: gradedSubmissions
        }

        let hasError = false;
        try {
            assignments = await window.axios.getNoSubmissionAssignments(requestData);
            nsaProgressInfo.innerHTML = 'Done';
        }
        catch (error) {
            errorHandler(error, nsaProgressInfo)
            hasError = true;
        } finally {
            checkBtn.disabled = false;
        }

        if (!hasError) {
            console.log(`found ${assignments.length} assignments with no submissions`);


            //const eContent = document.querySelector('#endpoint-content');
            let gradedText = gradedSubmissions ? 'no submissions.' : 'no submissions or grades.';
            nsaResponseContainer.innerHTML = `
                        <div id="nsa-response-details">
                            <div class="row align-items-center">
                                <div  class="col-auto">
                                    <span>Found ${assignments.length} assignments with ${gradedText}</span>
                                </div>

                                <div class="w-100"></div>

                                <div class="col-2">
                                    <button id="remove-btn" type="button" class="btn btn-danger">Remove</button>
                                </div>
                                <div class="col-2">
                                    <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                                </div>
                            </div>
                        </div>    
                    `;

            const nsaResponseDetails = nsaResponseContainer.querySelector('#nsa-response-details');

            const cancelBtn = nsaResponseDetails.querySelector('#cancel-btn');
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                courseID.value = '';
                nsaResponseContainer.innerHTML = '';
                checkBtn.disabled = false;
                //clearData(courseID, responseContent);
            });

            const removeBtn = nsaResponseDetails.querySelector('#remove-btn');
            removeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('renderer > getNoSubmissionAssignments > removeBtn');

                nsaResponseDetails.innerHTML = ``;
                nsaProgressBar.parentElement.hidden = false;
                nsaProgressInfo.innerHTML = `Removing ${assignments.length} assignments...`;

                const assignmentIDs = assignments.map((assignment) => {
                    return {
                        name: assignment.node.name,
                        id: assignment.node._id
                    };
                });

                const messageData = {
                    domain,
                    token,
                    course_id,
                    number: assignmentIDs.length,
                    assignments: assignmentIDs
                }

                window.progressAPI.onUpdateProgress((progress) => {
                    updateProgressWithPercent(nsaProgressBar, progress);
                });

                try {
                    const deleteNoSubmissionASsignments = await window.axios.deleteAssignments(messageData);

                    if (deleteNoSubmissionASsignments.successful.length > 0) {
                        nsaProgressInfo.innerHTML = `Successfully removed ${deleteNoSubmissionASsignments.successful.length} assignments.`;
                    }
                    if (deleteNoSubmissionASsignments.failed.length > 0) {
                        nsaProgressInfo.innerHTML = `Failed to remove ${deleteNoSubmissionASsignments.failed.length} assignments.`;
                    }
                } catch (error) {
                    errorHandler(error, nsaProgressInfo)
                } finally {
                    checkBtn.disabled = false;
                }
            });

            if (assignments.length < 1) {
                removeBtn.disabled = true;
            } else {
                removeBtn.disabled = false;
            }
        }

        // console.error(error)
        // const lastIndex = error.message.lastIndexOf(':');
        // let errorInfo = '';
        // const statusCode = error.message.match(/(?<=status code )[0-9]+/);
        // if (statusCode) {
        //     switch (statusCode[0]) {
        //         case '404':
        //             errorInfo = 'Check your inputs to make sure they\'re valid.';
        //             break;
        //         case '403':
        //             errorInfo = 'Check to make sure you have permissions for the request and try again.';
        //             break;
        //         default:
        //             errorInfo = 'Message Caleb and tell him to fix it.'
        //             break;
        //     }
        // }
        // responseContainer.innerHTML = `<p>There was an error: <span class="error">${error.message.slice(lastIndex + 1)}</span></p><p>${errorInfo}</p>`;
        // checkBtn.disabled = false;


    });
}

function unpublishedAssignments(e) {
    hideEndpoints(e)
    let assignments = [];

    const eContent = document.querySelector('#endpoint-content');
    let deleteUnpublishedAssignmentsForm = eContent.querySelector('#delete-upublished-assignments-form');

    if (!deleteUnpublishedAssignmentsForm) {
        deleteUnpublishedAssignmentsForm = document.createElement('form');
        deleteUnpublishedAssignmentsForm.id = 'delete-upublished-assignments-form';

        // eContent.innerHTML = `
        //     <div>
        //         <h3>Delete All Unpublished Assignments</h3>
        //     </div>
        // `;

        // const eForm = document.createElement('form');

        deleteUnpublishedAssignmentsForm.innerHTML = `
            <div>
                <h3>Delete All Unpublished Assignments</h3>
                <div>Deletes all unpublished assignments without grades</div>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
                    <label class="form-label">Course</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="course-id" type="text" class="form-control" aria-describedby="input-checker" />
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div> 
                <div class="col-auto">
                    <button id="action-btn" class="btn btn-primary mt-3">Check</button>
                </div>
            </div>
            <div hidden id="dua-progress-div">
                <p id="dua-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="dua-response-container" class="mt-3">
            </div>
        `;

        eContent.append(deleteUnpublishedAssignmentsForm);
    }
    deleteUnpublishedAssignmentsForm.hidden = false;

    const courseID = deleteUnpublishedAssignmentsForm.querySelector('#course-id');
    courseID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkCourseID(courseID, eContent);
    });

    const checkBtn = deleteUnpublishedAssignmentsForm.querySelector('#action-btn');
    checkBtn.addEventListener('click', async function (e) {
        e.stopPropagation();
        e.preventDefault();

        checkBtn.disabled = true;
        const domain = document.querySelector('#domain').value.trim();
        const apiToken = document.querySelector('#token').value.trim();
        const duaResponseContainer = deleteUnpublishedAssignmentsForm.querySelector('#dua-response-container');
        const duaProgressDiv = deleteUnpublishedAssignmentsForm.querySelector('#dua-progress-div');
        const duaProgressBar = duaProgressDiv.querySelector('.progress-bar');
        const duaProgressInfo = deleteUnpublishedAssignmentsForm.querySelector('#dua-progress-info');

        // clean environment
        duaProgressDiv.hidden = false;
        updateProgressWithPercent(duaProgressBar, 0);
        enhanceProgressBarWithPercent(duaProgressBar);
        duaProgressBar.parentElement.hidden = true;
        duaProgressInfo.innerHTML = "Checking...";

        const requestData = {
            domain: domain,
            token: apiToken,
            course: courseID.value.trim()
        }

        let hasError = false;
        try {
            assignments = await window.axios.getUnpublishedAssignments(requestData);
            duaProgressInfo.innerHTML = 'Done';
        } catch (error) {
            errorHandler(error, duaProgressInfo);
            hasError = true;
        } finally {
            checkBtn.disabled = false;
        }


        if (!hasError) {
            console.log('found assignments', assignments.length);

            //const eContent = document.querySelector('#endpoint-content');
            duaResponseContainer.innerHTML = `
                <div id="dua-response-details">
                    <div class="row align-items-center">
                        <div  class="col-auto">
                            <span>Found ${assignments.length} unpublished assignments.</span>
                        </div>

                        <div class="w-100"></div>

                        <div class="col-2">
                            <button id="remove-btn" type="button" class="btn btn-danger">Remove</button>
                        </div>
                        <div class="col-2">
                            <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>    
            `;

            const duaResponseDetails = deleteUnpublishedAssignmentsForm.querySelector('#dua-response-details');

            const cancelBtn = duaResponseDetails.querySelector('#cancel-btn');
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                courseID.value = '';
                duaResponseContainer.innerHTML = '';
                checkBtn.disabled = false;
                //clearData(courseID, responseContent);
            });

            const removeBtn = duaResponseDetails.querySelector('#remove-btn');
            removeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('inside remove');

                // responseDetails.innerHTML = `Removing ${assignments.length} assignments...`;
                duaResponseDetails.innerHTML = ``;
                duaProgressInfo.innerHTML = `Deleting ${assignments.length} assignments...`;
                updateProgressWithPercent(duaProgressBar, 0);
                duaProgressBar.parentElement.hidden = false;


                // remapping to only include the id from the graphql response
                const assignmentIDs = assignments.map((assignment) => {
                    return {
                        id: assignment._id
                    };
                });

                const messageData = {
                    domain,
                    token: apiToken,
                    course_id: courseID.value.trim(),
                    number: assignmentIDs.length,
                    assignments: assignmentIDs
                }

                // const successful = [];
                // const failed = [];


                window.progressAPI.onUpdateProgress((progress) => {
                    updateProgressWithPercent(duaProgressBar, progress);
                });

                try {
                    const deleteUnpublishedAssignments = await window.axios.deleteAssignments(messageData);
                    if (deleteUnpublishedAssignments.successful.length > 0) {
                        duaProgressInfo.innerHTML = `Successfully removed ${deleteUnpublishedAssignments.successful.length} assignments.`;
                    }
                    if (deleteUnpublishedAssignments.failed.length > 0) {
                        duaProgressInfo.innerHTML = `Failed to remove ${deleteUnpublishedAssignments.failed.length} assignments.`;
                    }
                } catch (error) {
                    errorHandler(error, duaProgressInfo);
                } finally {
                    checkBtn.disabled = false;
                }

                // const deleteUnpublishedAssignments = async (data) => {
                //     try {
                //         // const response = await window.axios.deleteTheThings(messageData);
                //         const response = await window.axios.deleteAssignment(data);
                //         return response;
                //     } catch (error) {
                //         console.error('Error deleting unpublished assignments', error);
                //         throw error;
                //     } finally {
                //         updateProgress();
                //     }
                // }

                //     const totalRequests = assignmentIDs.length;
                //     let completedRequests = 0;

                //     const updateProgress = () => {
                //         completedRequests++;
                //         progressBar.style.width = `${(completedRequests / totalRequests) * 50}%`;
                //     }

                //     let requests = assignmentIDs.map(assignment => {
                //         const messageDataCopy = { ...messageData, assignment: assignment.id };
                //         return () => deleteUnpublishedAssignments(messageDataCopy);
                //     });

                //     const processBatchRequests = async (requests, batchSize, timeDelay) => {
                //         const results = [];
                //         for (let i = 0; i < requests.length; i += batchSize) {
                //             const batch = requests.slice(i, i + batchSize);
                //             const batchResults = await Promise.allSettled(batch.map((request) => request()));
                //             results.push(...batchResults);
                //             if (i + batchSize < requests.length) {
                //                 await waitFunc(timeDelay);
                //             }
                //         }
                //         return results;
                //     }

                //     let counter = 0;
                //     const finalResults = {
                //         successful: [],
                //         failed: []
                //     }

                //     // looping through the requests until all are successful or until 3 attempts
                //     do {
                //         const response = await processBatchRequests(requests, batchSize, timeDelay);

                //         // checking for successful requests and mapping them to a new array
                //         successful = response.filter((result) => {
                //             if (result.status === 'fulfilled') {
                //                 return result;
                //             }
                //         }).map((result) => {
                //             return {
                //                 status: result.status,
                //                 id: result.value
                //             }
                //         });
                //         finalResults.successful.push(...successful);

                //         // checking for failed requests and mapping them to a new array
                //         failed = response.filter((result) => {
                //             if (result.status === 'rejected') {
                //                 return result
                //             }
                //         }).map((result) => {
                //             return {
                //                 status: result.status,
                //                 reason: result.reason.message,
                //                 id: result.reason.config.url.split('/').pop()
                //             }
                //         });

                //         // removing successful requests from the failed requests
                //         finalResults.successful.forEach((success) => {
                //             finalResults.failed = finalResults.failed.filter((fail) => {
                //                 return fail.id != success.id;
                //             });
                //         });

                //         requests = failed;
                //         counter++;
                //     } while (requests.length > 0 && counter < 3);


                //     // await Promise.allSettled(requests);
                //     progressBar.style.width = '100%';

                //     if (finalResults.successful.length > 0) {
                //         responseContainer.innerHTML = `Successfully removed ${finalResults.successful.length} assignments.`

                //     }
                //     if (finalResults.failed.length > 0) {
                //         for (let fail of finalResults.failed) {
                //             responseContainer.innerHTML += `<p>Failed to remove assignment: ${fail.id} "${fail.reason}"</p>`;
                //         }
                // }
            });
        }


        // } else {
        //     document.querySelector('#courseChecker').style.display = 'inline';
        //     checkBtn.disabled = false;
        // }
    });
}

function nonModuleAssignments(e) {
    hideEndpoints(e)
    let assignments = [];

    const eContent = document.querySelector('#endpoint-content');
    let deleteAssignmentsNotInModulesForm = eContent.querySelector('#delete-assignments-not-in-modules-form');
    // setHeader('Delete All Assignments Not in a Module', eContent);
    // createForm('deleteNonModuleAssignments', eContent);

    if (!deleteAssignmentsNotInModulesForm) {
        deleteAssignmentsNotInModulesForm = document.createElement('form');
        deleteAssignmentsNotInModulesForm.id = 'delete-assignments-not-in-modules-form';
        // eContent.innerHTML = `
        //     <div>
        //         <h3>Delete All Assignments Not in a Module</h3>
        //     </div>
        // `;

        // const eForm = document.createElement('form');

        deleteAssignmentsNotInModulesForm.innerHTML = `
            <div>
                <h3>Delete All Assignments Not in a Module</h3>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
                    <label class="form-label">Course</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="course" type="text" class="form-control" aria-describedby="input-checker" />
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div>
                <div class="col-auto mt-3">
                    <label class="form-label">Mode</label>
                </div>
                <div class="w-100"></div>
                <div class="col-auto form-check form-check-inline mt-1">
                    <input class="form-check-input" type="radio" name="danim-mode" id="danim-mode-all" value="all" checked>
                    <label class="form-check-label" for="danim-mode-all">All assignments not in modules</label>
                </div>
                <div class="col-auto form-check form-check-inline mt-1">
                    <input class="form-check-input" type="radio" name="danim-mode" id="danim-mode-specific" value="specific">
                    <label class="form-check-label" for="danim-mode-specific">Specific modules</label>
                </div>
                <div class="w-100"></div>
                <div id="danim-modules-picker" class="mt-2" hidden>
                    <div class="mb-2">Enter module IDs (comma-separated) or fetch and select from the list.</div>
                    <div class="row g-2 align-items-end">
                        <div class="col-auto">
                            <label class="form-label" for="danim-module-ids">Module IDs</label>
                            <input id="danim-module-ids" type="text" class="form-control" placeholder="e.g. 123,456" />
                        </div>
                        <div class="col-auto">
                            <button id="danim-fetch-mods" type="button" class="btn btn-outline-secondary">Fetch course modules</button>
                        </div>
                    </div>
                    <div class="mt-2" id="danim-modules-list-container" hidden>
                        <div class="mb-1">Select one or more modules:</div>
                        <div id="danim-modules-list" class="border rounded p-2" style="max-height: 200px; overflow-y: auto;"></div>
                    </div>
                </div>
                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="action-btn" class="btn btn-primary mt-3">Check</button>
                </div>
            </div>
            <div hidden id="danim-progress-div">
                <p id="danim-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
    
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="danim-response-container" class="mt-5">
            </div>
        `;

        eContent.append(deleteAssignmentsNotInModulesForm);
    }
    deleteAssignmentsNotInModulesForm.hidden = false;
    //checks for valid input in the course id field

    const courseID = deleteAssignmentsNotInModulesForm.querySelector('#course');
    courseID.addEventListener('change', (e) => {
        e.stopPropagation();
        e.preventDefault();

        checkCourseID(courseID, eContent);

    })

    // Mode toggle and module picker loading
    const modeAll = deleteAssignmentsNotInModulesForm.querySelector('#danim-mode-all');
    const modeSpecific = deleteAssignmentsNotInModulesForm.querySelector('#danim-mode-specific');
    const modulesPicker = deleteAssignmentsNotInModulesForm.querySelector('#danim-modules-picker');
    const modulesList = deleteAssignmentsNotInModulesForm.querySelector('#danim-modules-list');
    const modulesListContainer = deleteAssignmentsNotInModulesForm.querySelector('#danim-modules-list-container');
    const fetchModsBtn = deleteAssignmentsNotInModulesForm.querySelector('#danim-fetch-mods');
    const moduleIdsInput = deleteAssignmentsNotInModulesForm.querySelector('#danim-module-ids');

    async function fetchModules() {
        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const cid = courseID.value.trim();
        if (!cid || isNaN(Number(cid))) {
            modulesListContainer.hidden = false;
            modulesList.innerHTML = '<div class="text-danger">Enter a valid numeric Course ID first.</div>';
            return;
        }
        fetchModsBtn.disabled = true;
        modulesList.innerHTML = '<div class="text-muted">Loading modules…</div>';
        modulesListContainer.hidden = false;
        try {
            const mods = await window.axios.getModules({ domain, token, course_id: cid });
            modulesList.innerHTML = '';
            if (!mods || mods.length === 0) {
                modulesList.innerHTML = '<div class="text-muted">No modules found.</div>';
                return;
            }
            mods.forEach(edge => {
                const id = edge.node._id;
                const name = edge.node.name;
                const wrapper = document.createElement('div');
                wrapper.className = 'form-check';
                wrapper.innerHTML = `
                    <input class="form-check-input" type="checkbox" data-id="${id}" id="mod-${id}">
                    <label class="form-check-label" for="mod-${id}">${name} <span class="text-muted">(${id})</span></label>
                `;
                modulesList.appendChild(wrapper);
            });
        } catch (err) {
            modulesList.innerHTML = `<div class="text-danger">Failed to load modules: ${err}</div>`;
        } finally {
            fetchModsBtn.disabled = false;
        }
    }

    function toggleModeUI() {
        if (modeSpecific.checked) {
            modulesPicker.hidden = false;
        } else {
            modulesPicker.hidden = true;
        }
    }
    modeAll.addEventListener('change', toggleModeUI);
    modeSpecific.addEventListener('change', toggleModeUI);
    fetchModsBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        fetchModules();
    });

    const checkBtn = deleteAssignmentsNotInModulesForm.querySelector('#action-btn');
    checkBtn.addEventListener('click', async function (e) {
        e.stopPropagation();
        e.preventDefault();

        checkBtn.disabled = true;
        console.log('Inside renderer check');

        const danimResponseContainer = deleteAssignmentsNotInModulesForm.querySelector('#danim-response-container');
        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const danimProgressDiv = deleteAssignmentsNotInModulesForm.querySelector('#danim-progress-div');
        const danimProgressBar = danimProgressDiv.querySelector('.progress-bar');
        const danimProgressInfo = deleteAssignmentsNotInModulesForm.querySelector('#danim-progress-info');

        // clean environment
        danimProgressDiv.hidden = false;
        danimProgressBar.parentElement.hidden = true;
        updateProgressWithPercent(danimProgressBar, 0);
        danimProgressInfo.innerHTML = "Checking...";

        const requestData = {
            domain,
            token,
            course: courseID.value.trim()
        }

        let hasError = false;
        try {
            if (modeSpecific.checked) {
                // Gather selected module IDs from manual input and fetched list
                const manualIds = (moduleIdsInput.value || '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !isNaN(Number(s)));
                const selectedIds = Array.from(modulesList.querySelectorAll('input[type="checkbox"]:checked'))
                    .map(cb => cb.getAttribute('data-id'));
                const allIds = Array.from(new Set([...manualIds, ...selectedIds]));
                if (allIds.length === 0) {
                    danimProgressInfo.innerHTML = '<span style="color: red;">Enter or select at least one module.</span>';
                    hasError = true;
                } else {
                    assignments = await window.axios.getAssignmentsInModules({ domain, token, course_id: courseID.value.trim(), module_ids: allIds });
                    danimProgressInfo.innerHTML = 'Done';
                }
            } else {
                assignments = await window.axios.getNonModuleAssignments(requestData);
                danimProgressInfo.innerHTML = 'Done';
            }
        } catch (error) {
            errorHandler(error, danimProgressInfo);
            hasError = true;
        } finally {
            checkBtn.disabled = false;
        }

        if (!hasError) {
            console.log('found assignments', assignments.length);

            //const eContent = document.querySelector('#endpoint-content');
            danimResponseContainer.innerHTML = `
                <div>
                    <div class="row align-items-center">
                        <div id="danim-response-details" class="col-auto">
                            <span>Found ${assignments.length} assignments, without submissions or grades, ${modeSpecific.checked ? 'in selected modules' : 'not in modules'}.</span>
                        </div>

                        <div class="w-100"></div>

                        <div class="col-2">
                            <button id="remove-btn" type="button" class="btn btn-danger">Remove</button>
                        </div>
                        <div class="col-2">
                            <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>    
            `;

            const cancelBtn = deleteAssignmentsNotInModulesForm.querySelector('#cancel-btn');
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                courseID.value = '';
                danimResponseContainer.innerHTML = '';
                checkBtn.disabled = false;
                //clearData(courseID, responseContent);
            });

            const removeBtn = deleteAssignmentsNotInModulesForm.querySelector('#remove-btn');
            removeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('inside remove');

                const danimResponseDetails = danimResponseContainer.querySelector('#danim-response-details');
                danimResponseDetails.innerHTML = ``;

                danimProgressBar.parentElement.hidden = false;
                danimProgressInfo.innerHTML = `Removing ${assignments.length} assignments...`;

                // const messageData = {
                //     url: `https://${domain}/api/v1/courses/${courseID}/assignments`,
                //     token: apiToken,
                //     content: assignments
                // }

                const remapped = assignments.map(a => ({ id: a.id || a._id || a.node?._id }));
                const messageData = {
                    domain,
                    token,
                    course_id: courseID.value.trim(),
                    number: remapped.length,
                    assignments: remapped
                }

                window.progressAPI.onUpdateProgress((progress) => {
                    updateProgressWithPercent(danimProgressBar, progress);
                });

                try {
                    const deleteNonModuleAssignments = await window.axios.deleteAssignments(messageData);
                    if (deleteNonModuleAssignments.successful.length > 0) {
                        danimProgressInfo.innerHTML = `Successfully removed ${deleteNonModuleAssignments.successful.length} assignments.`;
                    }
                    if (deleteNonModuleAssignments.failed.length > 0) {
                        danimProgressInfo.innerHTML = `Failed to remove ${deleteNonModuleAssignments.failed.length} assignments.`;
                    }
                } catch (error) {
                    errorHandler(error, danimProgressInfo);
                } finally {
                    checkBtn.disabled = false;
                }
            });
        }
    })
}

function deleteOldAssignments(e) {
    hideEndpoints(e)
    console.log('renderer > deleteOldAssignments');

    const eContent = document.querySelector('#endpoint-content');
    let deleteOldAssignmentsForm = eContent.querySelector('#delete-old-assignments-form');

    if (!deleteOldAssignmentsForm) {
        deleteOldAssignmentsForm = document.createElement('form');
        deleteOldAssignmentsForm.id = 'create-module-delete-form';
        deleteOldAssignmentsForm.innerHTML = `
            <div>
                <h3>Delete Old Assignments</h3>
                <p>Deletes assignments before the specified date filter. Ignores assignments with grades or submissions.</p>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
                    <label class="form-label">Course</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="course-id" type="text" class="form-control" aria-describedby="input-checker" />
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div>
                <div class="col-auto mt-3">
                    <input class="form-control" id="due-date-input" type="date">
                </div>
            </div>
            <div id="date-switches" class="mt-3">
                <div class=" form-check form-switch" >
                    <input id="created-at-switch" class="form-check-input" type="checkbox" data-id="createdAt" role="switch">
                    <label for="created-at-switch" class="form-check-label">Created At</label>
                </div>
                <div class=" form-check form-switch" >
                    <input id="due-at-switch" class="form-check-input" type="checkbox" data-id="dueAt" role="switch"
                    <label for="due-at-switch" class="form-check-label">Due At</label>
                </div>               
            </div>
            <div >
                <button id="check-old-assignments-btn" class="btn btn-primary mt-3" disabled>Check</button>
            </div>
            <div hidden id="doa-progress-div">
                <p id="doa-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="doa-response-container" class="mt-3">
            </div>
        `;

        eContent.append(deleteOldAssignmentsForm);
    }
    deleteOldAssignmentsForm.hidden = false;

    const courseID = deleteOldAssignmentsForm.querySelector('#course-id');
    // const dueDate = deleteOldAssignmentsForm.querySelector('#due-date-input');
    const dateSwitches = deleteOldAssignmentsForm.querySelector('#date-switches');

    // disables all switches except the one checked
    dateSwitches.addEventListener('change', (e) => {
        e.stopPropagation();

        const switches = dateSwitches.querySelectorAll('input[type="checkbox"]');
        switches.forEach(switchInput => {
            if (switchInput.id !== e.target.id) {
                switchInput.checked = false;
            }
        })
    })

    courseID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkCourseID(courseID, deleteOldAssignmentsForm);
    });

    const deleteOldAssignmentsBtn = deleteOldAssignmentsForm.querySelector('button');
    deleteOldAssignmentsBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteOldAssignmentsBtn.disabled = true;

        let dateType = '';
        const switches = dateSwitches.querySelectorAll('input[type="checkbox"]');
        switches.forEach(switchInput => {
            if (switchInput.checked) {
                dateType = switchInput.dataset.id;
            }
        });

        const dateFilter = deleteOldAssignmentsForm.querySelector('#due-date-input').value;

        const doaResponseContainer = deleteOldAssignmentsForm.querySelector('#doa-response-container');
        const doaProgressDiv = deleteOldAssignmentsForm.querySelector('#doa-progress-div');
        const doaProgressBar = doaProgressDiv.querySelector('.progress-bar');
        const doaProgressInfo = deleteOldAssignmentsForm.querySelector('#doa-progress-info');

        if (dateFilter !== '') {

            const domain = document.querySelector('#domain').value.trim();
            const token = document.querySelector('#token').value.trim();
            const course_id = courseID.value.trim();

            // clean environment
            doaResponseContainer.innerHTML = '';
            doaProgressDiv.hidden = false;
            doaProgressBar.parentElement.hidden = true;
            updateProgressWithPercent(doaProgressBar, 0);
            doaProgressInfo.innerHTML = 'Checking...';

            const requestData = {
                domain,
                token,
                course_id,
                date_filter: dateFilter,
                date_type: dateType
            };
            console.log('The data is ', requestData);

            let assignments = [];
            let hasError = false;

            try {
                assignments = await window.axios.getOldAssignments(requestData);
            } catch (error) {
                hasError = true;
                errorHandler(error, doaProgressInfo);
            } finally {
                deleteOldAssignmentsBtn.disabled = false;
            }

            if (!hasError) {
                doaProgressInfo.innerHTML = '';
                if (assignments.length < 1) {
                    doaResponseContainer.innerHTML = `
                        <div>
                            <div class="row align-items-center">
                                <div id="doa-response-details" class="col-auto">
                                    <span>Didn't find any assignments due at or before the current selected date.</span>
                                </div>
                            </div>
                        </div>`
                } else {
                    console.log('found old assignments', assignments.length);

                    //const eContent = document.querySelector('#endpoint-content');
                    doaResponseContainer.innerHTML = `
                    <div id="doa-response-details">
                        <div class="row align-items-center">
                            <div  class="col-auto">
                                <span>Found ${assignments.length} old assignments.</span>
                            </div>
    
                            <div class="w-100"></div>
    
                            <div class="col-2">
                                <button id="remove-btn" type="button" class="btn btn-danger">Remove</button>
                            </div>
                            <div class="col-2">
                                <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                            </div>
                        </div>
                    </div>    
                    `;

                    const doaResponseDetails = deleteOldAssignmentsForm.querySelector('#doa-response-details');

                    const cancelBtn = doaResponseDetails.querySelector('#cancel-btn');
                    cancelBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        courseID.value = '';
                        doaResponseContainer.innerHTML = '';
                        deleteOldAssignmentsBtn.disabled = false;
                        //clearData(courseID, responseContent);
                    });

                    const removeBtn = doaResponseDetails.querySelector('#remove-btn');
                    removeBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        console.log('inside remove');

                        // responseDetails.innerHTML = `Removing ${assignments.length} assignments...`;
                        doaResponseDetails.innerHTML = ``;
                        doaProgressInfo.innerHTML = `Deleting ${assignments.length} assignments...`;
                        updateProgressWithPercent(doaProgressBar, 0);
                        doaProgressBar.parentElement.hidden = false;


                        // remapping to only include the id from the graphql response
                        const assignmentIDs = assignments.map((assignment) => {
                            return {
                                id: assignment._id
                            };
                        });

                        const messageData = {
                            domain,
                            token,
                            course_id,
                            number: assignmentIDs.length,
                            assignments: assignmentIDs
                        }

                        // const successful = [];
                        // const failed = [];


                        window.progressAPI.onUpdateProgress((progress) => {
                            updateProgressWithPercent(doaProgressBar, progress);
                        });

                        try {
                            const deleteOldAssignments = await window.axios.deleteAssignments(messageData);
                            if (deleteOldAssignments.successful.length > 0) {
                                doaProgressInfo.innerHTML = `Successfully removed ${deleteOldAssignments.successful.length} assignments.`;
                            }
                            if (deleteOldAssignments.failed.length > 0) {
                                doaProgressInfo.innerHTML = `Failed to remove ${deleteOldAssignments.failed.length} assignments.`;
                            }
                        } catch (error) {
                            errorHandler(error, doaProgressInfo);
                        } finally {
                            deleteOldAssignmentsBtn.disabled = false;
                        }
                    })
                }
            }
        } else {
            doaResponseContainer.innerHTML = '';
            doaProgressDiv.hidden = false;
            doaProgressBar.parentElement.hidden = true;
            updateProgressWithPercent(doaProgressBar, 0);
            doaProgressInfo.innerHTML = '<span style="color: red;">Enter a valid due date</span>';

            deleteOldAssignmentsBtn.disabled = false;
        }

    });
}

function deleteAssignmentsFromImport(e) {
    hideEndpoints(e)
    console.log('renderer > deleteAssignmentsFromImport');

    const eContent = document.querySelector('#endpoint-content');
    let deleteAssignmentsFromImportForm = eContent.querySelector('#dafi-form');

    if (!deleteAssignmentsFromImportForm) {
        deleteAssignmentsFromImportForm = document.createElement('form');
        deleteAssignmentsFromImportForm.id = 'dafi-form';
        deleteAssignmentsFromImportForm.innerHTML = `
            <div>
                <h3>Delete Assignments Created From Import</h3>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
                    <label class="form-label">Course</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="course-id" type="text" class="form-control" aria-describedby="input-checker" />
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div>
                <div class="col-auto mt-3" >
                    <label class="form-label">Import ID</label>
                </di>
                <div class="col-4">
                    <input class="form-control" id="import-id" type="text">
                </div>
                <div class="col-auto">
                    <button id="check-import-assignments-btn" class="btn btn-primary mt-3" disabled>Check</button>
                </div>
            </div>
            <div hidden id="dafi-progress-div">
                <p id="dafi-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="dafi-response-container" class="mt-3">
            </div>
        `;

        eContent.append(deleteAssignmentsFromImportForm);
    }
    deleteAssignmentsFromImportForm.hidden = false;

    const courseID = deleteAssignmentsFromImportForm.querySelector('#course-id');
    const importID = deleteAssignmentsFromImportForm.querySelector('#import-id');

    courseID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkCourseID(courseID, deleteAssignmentsFromImportForm);
    });

    const dafiCheckBtn = deleteAssignmentsFromImportForm.querySelector('button');
    dafiCheckBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        dafiCheckBtn.disabled = true;

        // getting the elements
        const dafiResponseContainer = deleteAssignmentsFromImportForm.querySelector('#dafi-response-container');
        const dafiProgressDiv = deleteAssignmentsFromImportForm.querySelector('#dafi-progress-div');
        const dafiProgressBar = dafiProgressDiv.querySelector('.progress-bar');
        const dafiProgressInfo = deleteAssignmentsFromImportForm.querySelector('#dafi-progress-info');

        // clearing values
        dafiResponseContainer.innerHTML = '';
        dafiProgressBar.parentElement.hidden = true;
        updateProgressWithPercent(dafiProgressBar, 0);
        dafiProgressInfo.innerHTML = '';
        dafiProgressDiv.hidden = false;

        // getting the values
        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const course_id = courseID.value;
        const import_id = importID.value;

        // creating request object
        const requestData = {
            domain,
            token,
            course_id,
            import_id
        }

        dafiProgressInfo.innerHTML = `Checking for imported assignments from the import ${import_id}...`;

        let importedAssignments = [];
        let hasError = false;
        try {
            importedAssignments = await window.axios.getImportedAssignments(requestData);
            dafiProgressInfo.innerHTML = 'Done';
        } catch (error) {
            errorHandler(error, dafiProgressInfo);
            hasError = true;
        } finally {
            dafiCheckBtn.disabled = false;
        }

        if (!hasError) {
            console.log('found assignments', importedAssignments.length);

            //const eContent = document.querySelector('#endpoint-content');
            dafiResponseContainer.innerHTML = `
                <div id="dafi-response-details">
                    <div class="row align-items-center">
                        <div  class="col-auto">
                            <span>Found ${importedAssignments.length} assignments in the import.</span>
                        </div>

                        <div class="w-100"></div>

                        <div class="col-2">
                            <button id="dafi-remove-btn" type="button" class="btn btn-danger">Remove</button>
                        </div>
                        <div class="col-2">
                            <button id="dafi-cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>    
            `;

            const dafiResponseDetails = dafiResponseContainer.querySelector('#dafi-response-details');

            const dafiCancelBtn = dafiResponseDetails.querySelector('#dafi-cancel-btn');
            dafiCancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                courseID.value = '';
                dafiResponseContainer.innerHTML = '';
                dafiCancelBtn.disabled = false;
                //clearData(courseID, responseContent);
            });

            const dafiRemoveBtn = dafiResponseDetails.querySelector('#dafi-remove-btn');
            dafiRemoveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('inside remove');
                dafiRemoveBtn.disabled = true;
                dafiCancelBtn.disabled = true;

                dafiResponseDetails.innerHTML = '';
                dafiProgressBar.parentElement.hidden = false;
                dafiProgressInfo.innerHTML = `Removing ${assignments.length} assignments...`;

                // const messageData = {
                //     url: `https://${domain}/api/v1/courses/${courseID}/assignments`,
                //     token: apiToken,
                //     content: assignments
                // }

                const messageData = {
                    domain,
                    course_id,
                    token,
                    number: importedAssignments.length,
                    assignments: importedAssignments
                }

                window.progressAPI.onUpdateProgress((progress) => {
                    updateProgressWithPercent(dafiProgressBar, progress);
                });

                try {
                    const response = await window.axios.deleteAssignments(messageData);

                    if (response.successful.length > 0) {
                        dafiProgressInfo.innerHTML = `<p>Successfully removed ${response.successful.length} assignments.</p>`;
                    }
                    if (response.failed.length > 0) {
                        dafiProgressInfo.innerHTML += `<p>Failed to remove ${response.failed.length} assignments.</p>`;
                    }
                    dafiCheckBtn.disabled = false;
                } catch (error) {
                    errorHandler(error, dafiProgressInfo)
                } finally {
                    dafiCheckBtn.disabled = false;
                }
            });
        }
    })
}

function keepAssignmentsInGroup(e) {
    hideEndpoints(e)
    console.log('renderer > keepAssignmentsInGroup');

    // create form
    const eContent = document.querySelector('#endpoint-content');
    let keepAssignmentsInGroupForm = eContent.querySelector('#keep-assignments-in-group-form');

    if (!keepAssignmentsInGroupForm) {
        keepAssignmentsInGroupForm = document.createElement('form');
        keepAssignmentsInGroupForm.id = 'keep-assignments-in-group-form';

        keepAssignmentsInGroupForm.innerHTML = `
            <div>
                <h3>Only keep assignments in the specific Assignment Group</h3>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
                    <label class="form-label">Course</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="course-id" type="text" class="form-control" aria-describedby="course-checker" />
                </div>
                <div class="col-auto" >
                    <span id="course-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
            </div>
            <div class="row align-item-center">
                <div class="col-auto">
                    <label class="form-label">Group ID: Delete all assignments not in this assignment group</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="group-id" type="text" class="form-control" aria-describedby="group-checker" />
                </div>
                <div class="col-auto" >
                    <span id="group-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div>
            </div>
            <div hidden id="kaig-progress-div">
                <p id="kaig-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
    
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div class="w-100"></div>
                <div class="col-auto">
                    <button id="kaig-btn" class="btn btn-primary mt-3">Check</button>
                </div>
            <div id="kaig-response-container" class="mt-5">
            </div>
        `;

        eContent.append(keepAssignmentsInGroupForm);
    }
    keepAssignmentsInGroupForm.hidden = false;

    keepAssignmentsInGroupForm.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const kaigCheckBtn = keepAssignmentsInGroupForm.querySelector('#kaig-btn');
        const courseChecker = keepAssignmentsInGroupForm.querySelector('#course-checker')
        const courseID = keepAssignmentsInGroupForm.querySelector('#course-id')
        const groupChecker = keepAssignmentsInGroupForm.querySelector('#group-checker')
        const groupID = keepAssignmentsInGroupForm.querySelector('#group-id')
        const input = e.target.value;

        console.log(e.target);

        if (courseID.value.trim() !== '' && groupID.value.trim() !== '') {
            if (isNaN(Number(input))) {
                if (e.target.id === 'group-id') {
                    groupChecker.style.display = 'inline';
                } else {
                    courseChecker.style.display = 'inline';
                }
                // daigCheckBtn.disabled = true;
            } else {
                if (e.target.id === 'group-id') {
                    groupChecker.style.display = 'none';
                } else {
                    courseChecker.style.display = 'none';
                }
            }

            if (groupChecker.style.display === 'inline' || courseChecker.style.display === 'inline') {
                kaigCheckBtn.disabled = true;
            } else {
                kaigCheckBtn.disabled = false;
            }
        } else {
            kaigCheckBtn.disabled = true;
        }
    })

    // const courseID = keepAssignmentsInGroupForm.querySelector('#course');
    // courseID.addEventListener('change', (e) => {
    //     e.preventDefault();
    //     e.stopPropagation();

    //     checkCourseID(courseID, eContent);
    // });

    const kaigCheckBtn = keepAssignmentsInGroupForm.querySelector('#kaig-btn');
    kaigCheckBtn.addEventListener('click', async (e) => {

        e.stopPropagation();
        e.preventDefault();

        kaigCheckBtn.disabled = true;
        console.log('Inside renderer check');

        const kaigResponseContainer = keepAssignmentsInGroupForm.querySelector('#kaig-response-container');
        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const courseID = keepAssignmentsInGroupForm.querySelector('#course-id').value.trim();
        const groupID = keepAssignmentsInGroupForm.querySelector('#group-id').value.trim();
        const kaigProgressDiv = keepAssignmentsInGroupForm.querySelector('#kaig-progress-div');
        const kaigProgressBar = kaigProgressDiv.querySelector('.progress-bar');
        const kaigProgressInfo = keepAssignmentsInGroupForm.querySelector('#kaig-progress-info');

        // clean environment
        kaigProgressDiv.hidden = false;
        kaigProgressBar.parentElement.hidden = true;
        updateProgressWithPercent(kaigProgressBar, 0);
        kaigProgressInfo.innerHTML = "Checking...";

        const data = {
            domain,
            token,
            courseID,
            groupID
        }

        let assignmentsNotInGroup = '';
        let hasError = false;
        try {
            assignmentsNotInGroup = await window.axios.keepAssignmentsInGroup(data);

            // if (response.successful.length > 0) {
            //     kaigProgressInfo.innerHTML = `<p>Successfully removed ${response.successful.length} assignments.</p>`;
            // }
            // if (response.failed.length > 0) {
            //     kaigProgressInfo.innerHTML += `<p>Failed to remove ${response.failed.length} assignments.</p>`;
            // }
        } catch (error) {
            errorHandler(error, kaigProgressInfo);
            hasError = true;
        } finally {
            kaigCheckBtn.disabled = false;
        }

        if (!hasError) {
            console.log('found assignments', assignmentsNotInGroup.length);

            //const eContent = document.querySelector('#endpoint-content');
            kaigResponseContainer.innerHTML = `
                <div id="kaig-response-details"
                    <div class="row align-items-center">
                        <div  class="col-auto">
                            <span>Found ${assignmentsNotInGroup.length} assignments not in the group.</span>
                        </div>

                        <div class="w-100"></div>

                        <div class="col-2">
                            <button id="kaig-remove-btn" type="button" class="btn btn-danger">Remove</button>
                        </div>
                        <div class="col-2">
                            <button id="kaig-cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>    
            `;

            const kaigResponseDetails = kaigResponseContainer.querySelector('#kaig-response-details');

            const kaigCancelBtn = kaigResponseDetails.querySelector('#kaig-cancel-btn');
            kaigCancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                courseID.value = '';
                kaigResponseContainer.innerHTML = '';
                kaigCancelBtn.disabled = false;
                //clearData(courseID, responseContent);
            });

            const kaigRemoveBtn = kaigResponseDetails.querySelector('#kaig-remove-btn');
            kaigRemoveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('inside remove');
                kaigRemoveBtn.disabled = true;
                kaigCancelBtn.disabled = true;

                kaigResponseDetails.innerHTML = '';
                kaigProgressBar.parentElement.hidden = false;
                kaigProgressInfo.innerHTML = `Removing ${assignmentsNotInGroup.length} assignments...`;

                // const messageData = {
                //     url: `https://${domain}/api/v1/courses/${courseID}/assignments`,
                //     token: apiToken,
                //     content: assignments
                // }

                const messageData = {
                    domain,
                    course_id: courseID,
                    token,
                    number: assignmentsNotInGroup.length,
                    assignments: assignmentsNotInGroup
                }

                window.progressAPI.onUpdateProgress((progress) => {
                    updateProgressWithPercent(kaigProgressBar, progress);
                });

                try {
                    const response = await window.axios.deleteAssignments(messageData);

                    if (response.successful.length > 0) {
                        kaigProgressInfo.innerHTML = `<p>Successfully removed ${response.successful.length} assignments.</p>`;
                    }
                    if (response.failed.length > 0) {
                        kaigProgressInfo.innerHTML += `<p>Failed to remove ${response.failed.length} assignments.</p>`;
                    }
                    kaigCheckBtn.disabled = false;
                } catch (error) {
                    errorHandler(error, kaigProgressInfo)
                } finally {
                    kaigCheckBtn.disabled = false;
                }
            });
        }
    })
}

function moveAssignmentsToSingleGroup(e) {
    hideEndpoints(e)
    console.log('renderer > moveAssignmentsToSingleGroup');

    // create form
    const eContent = document.querySelector('#endpoint-content');
    let moveAssignmentsForm = eContent.querySelector('#move-assignments');

    if (!moveAssignmentsForm) {
        moveAssignmentsForm = document.createElement('form');
        moveAssignmentsForm.id = 'move-assignments';
        // eContent.innerHTML = `
        //     <div>
        //         <h3>Move Assignments to a Single Group</h3>
        //     </div>
        // `;
        // // setHeader('Move Assignments to Single Group', eContent);
        // // createForm('moveAssignmentsToSingleGroup', eContent);

        // // find someway to generate the form

        // const eForm = document.createElement('form');
        moveAssignmentsForm.innerHTML = `
            <div>
                <h3>Move Assignments to a Single Group</h3>
                <div class="mt-3">Move all assignments to a specific assignment group. If no group is entered, the first assignment's group will be used.</div>
            </div>
            <div class="row align-items-center">
                <div class="col-auto mt-3">
                    <label class="form-label">Course</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="course" type="text" class="form-control" aria-describedby="input-checker" />
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div>
                <div class="col-auto mt-3">
                    <label class="form-label">Assignment Group ID (optional)</label>
                </div>
                <div class="w-100"></div>
                <div class="col-3">
                    <input id="move-group-id" type="text" class="form-control" aria-describedby="group-checker" placeholder="e.g. 12345" />
                </div>
                <div class="col-auto">
                    <span id="group-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="action-btn" class="btn btn-primary mt-3">Move</button>
                </div>
            </div>
            <div hidden id="mag-progress-div">
                <p id="mag-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="mag-response-container" class="mt-5">
            </div>
        `;

        eContent.append(moveAssignmentsForm);
    }
    moveAssignmentsForm.hidden = false;

    // Objectives:
    // 1. Get inputs
    // 2. Get all assignments from a course
    // 3. Get the first assignment group from the first assignment
    // 4. Loop through all assignments and move them to the first assignment group

    const courseID = moveAssignmentsForm.querySelector('#course');
    courseID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkCourseID(courseID, eContent);
    });

    // Simple numeric validation for optional group input
    const groupIdInput = moveAssignmentsForm.querySelector('#move-group-id');
    const groupChecker = moveAssignmentsForm.querySelector('#group-checker');
    const moveBtnRef = moveAssignmentsForm.querySelector('#action-btn');
    groupIdInput.addEventListener('input', (ev) => {
        const val = groupIdInput.value.trim();
        const hasVal = val !== '';
        const isNum = !isNaN(Number(val));
        if (hasVal && !isNum) {
            groupChecker.style.display = 'inline';
            moveBtnRef.disabled = true;
        } else {
            groupChecker.style.display = 'none';
            moveBtnRef.disabled = false;
        }
    });

    const checkBtn = moveAssignmentsForm.querySelector('#action-btn');
    checkBtn.addEventListener('click', async function (e) {
        e.stopPropagation();
        e.preventDefault();

        checkBtn.disabled = true;
        console.log('Inside renderer check');

    const magResponseContainer = moveAssignmentsForm.querySelector('#mag-response-container');
    const domain = document.querySelector('#domain').value.trim();
    const apiToken = document.querySelector('#token').value.trim();
        const magProgressDiv = moveAssignmentsForm.querySelector('#mag-progress-div');
        const magProgressBar = magProgressDiv.querySelector('.progress-bar');
        const magProgressInfo = moveAssignmentsForm.querySelector('#mag-progress-info');

        // clean environment
        magProgressDiv.hidden = false;
        magProgressBar.parentElement.hidden = true;
        updateProgressWithPercent(magProgressBar, 0);
        magProgressInfo.innerHTML = "Checking...";

        const data = {
            domain: domain,
            token: apiToken,
            course: courseID.value.trim()
        }

        let assignments = [];
        let hasError = false;
        try {
            assignments = await window.axios.getAssignmentsToMove(data);
            magProgressInfo.innerHTML = 'Done';
        } catch (error) {
            errorHandler(error, magProgressInfo);
            hasError = true;
        } finally {
            checkBtn.disabled = false;

        }

        if (!hasError) {
            if (!assignments || assignments.length === 0) {
                magResponseContainer.innerHTML = `
                    <div class="alert alert-info mt-3">No assignments found for this course.</div>
                `;
                return;
            }

            // Use manual group id if provided and numeric, otherwise default to first assignment's group
            const manualGroup = groupIdInput.value.trim();
            let assignmentGroup = (!isNaN(Number(manualGroup)) && manualGroup !== '')
                ? manualGroup
                : assignments[0].assignmentGroupId;

            console.log('found assignments', assignments.length);

            //const eContent = document.querySelector('#endpoint-content');
            magResponseContainer.innerHTML = `
                <div>
                    <div class="row align-items-center">
                        <div id="mag-response-details" class="col-auto">
                            <span>Found ${assignments.length} assignments in the course. Do you want to move them all to a single assignment group?</span>
                            <div class="form-text">Target group: ${(!isNaN(Number(manualGroup)) && manualGroup !== '') ? manualGroup : assignmentGroup} ${(!isNaN(Number(manualGroup)) && manualGroup !== '') ? '(manual)' : '(auto)'} </div>
                        </div>

                        <div class="w-100"></div>

                        <div class="col-2">
                            <button id="move-btn" type="button" class="btn btn-danger">Move</button>
                        </div>
                        <div class="col-2">
                            <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>    
            `;

            const magResponseDetails = magResponseContainer.querySelector('#mag-response-details');

            const cancelBtn = magResponseContainer.querySelector('#cancel-btn');
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                courseID.value = '';
                magResponseContainer.innerHTML = '';
                checkBtn.disabled = false;
                //clearData(courseID, responseContent);
            });

            const moveBtn = magResponseContainer.querySelector('#move-btn');
            moveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('inside move');

                magResponseDetails.innerHTML = '';
                magProgressBar.parentElement.hidden = false;
                magProgressInfo.innerHTML = `Moving ${assignments.length} assignments...`;

                // const messageData = {
                //     url: `https://${domain}/api/v1/courses/${courseID}/assignments`,
                //     token: apiToken,
                //     content: assignments
                // }

                const messageData = {
                    url: `https://${domain}/api/v1/courses/${courseID.value.trim()}/assignments`,
                    token: apiToken,
                    number: assignments.length,
                    assignments: assignments,
                    groupID: assignmentGroup
                }

                window.progressAPI.onUpdateProgress((progress) => {
                    updateProgressWithPercent(magProgressBar, progress);
                });

                try {
                    const moveAssignmentsToSingleGroup = await window.axios.moveAssignmentsToSingleGroup(messageData);

                    if (moveAssignmentsToSingleGroup.successful.length > 0) {
                        magProgressInfo.innerHTML = `Successfully moved ${moveAssignmentsToSingleGroup.successful.length} assignments.`;
                    }
                    if (moveAssignmentsToSingleGroup.failed.length > 0) {
                        magProgressInfo.innerHTML = `Failed to move ${moveAssignmentsToSingleGroup.failed.length} assignments.`;
                    }
                    checkBtn.disabled = false;
                } catch (error) {
                    errorHandler(error, magProgressInfo)
                } finally {
                    checkBtn.disabled = false;
                }
            });
        }
    });
}

function deleteAssignmentsInGroup(e) {
    hideEndpoints(e)
    console.log('renderer > deleteAssignmentsInGroup');

    // create form
    const eContent = document.querySelector('#endpoint-content');
    let deleteAssignmentsInGroupForm = eContent.querySelector('#delete-assignments-in-group');

    if (!deleteAssignmentsInGroupForm) {
        deleteAssignmentsInGroupForm = document.createElement('form');
        deleteAssignmentsInGroupForm.id = 'delete-assignments-in-group';
        // eContent.innerHTML = `
        //     <div>
        //         <h3>Move Assignments to a Single Group</h3>
        //     </div>
        // `;
        // // setHeader('Move Assignments to Single Group', eContent);
        // // createForm('moveAssignmentsToSingleGroup', eContent);

        // // find someway to generate the form

        // const eForm = document.createElement('form');
        deleteAssignmentsInGroupForm.innerHTML = `
            <div>
                <h3>Delete Assignments in a Single Group</h3>
            </div>
            <div class="row align-item-center">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <label class="form-label">Course</label>
                    </div>
                    <div class="w-100"></div>
                    <div class="col-2">
                        <input id="course-id" type="text" class="form-control" aria-describedby="course-checker" />
                    </div>
                    <div class="col-auto" >
                        <span id="course-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                    </div>
                </div>
                <div class="col-auto">
                    <label class="form-label">Group ID: Only deletes assignments in this group</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="group-id" type="text" class="form-control" aria-describedby="group-checker" />
                </div>
                <div class="col-auto" >
                    <span id="group-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div>
            </div>
                <div class="col-auto">
                    <button id="daig-btn" class="btn btn-primary mt-3">Check</button>
                </div>
            <div hidden id="daig-progress-div">
                <p id="daig-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
    
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="daig-response-container" class="mt-5">
            </div>
        `;

        eContent.append(deleteAssignmentsInGroupForm);
    }
    deleteAssignmentsInGroupForm.hidden = false;

    // Objectives:
    // 1. Get inputs
    // 2. Try to delete group and all assignments in it
    // 3. If 2 fails get all assignments in the group
    // 4. Delete all those assignments
    // 5. Delete group

    // check course ID is a number
    // const courseID = deleteAssignmentsInGroupForm.querySelector('#course');
    // courseID.addEventListener('change', (e) => {
    //     e.preventDefault();
    //     e.stopPropagation();

    //     checkCourseID(courseID, eContent);
    // });

    // // check group ID is a number and exists
    // const groupID = deleteAssignmentsInGroupForm.querySelector('#group-id');
    // groupID.addEventListener('change', (e) => {
    //     e.preventDefault();
    //     e.stopPropagation();

    //     const groupChecker = deleteAssignmentsInGroupForm.querySelector(`#group-checker`);
    //     const trimmedValue = groupID.value.trim();
    //     if (trimmedValue === '') {
    //         groupChecker.style.display = 'none';
    //         deleteAssignmentsInGroupForm.querySelector('button').disabled = true;
    //     } else if (!isNaN(Number(trimmedValue))) {
    //         groupChecker.style.display = 'none';
    //         deleteAssignmentsInGroupForm.querySelector('button').disabled = false;
    //     } else {
    //         groupChecker.style.display = 'inline';
    //         deleteAssignmentsInGroupForm.querySelector('button').disabled = true;
    //     }
    // });

    //checking valid input
    deleteAssignmentsInGroupForm.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // const daigCheckBtn = deleteAssignmentsInGroupForm.querySelector('#daig-btn');
        // const courseChecker = deleteAssignmentsInGroupForm.querySelector('#course-checker')
        // const courseID = deleteAssignmentsInGroupForm.querySelector('#course-id')
        // const groupChecker = deleteAssignmentsInGroupForm.querySelector('#group-checker')
        // const groupID = deleteAssignmentsInGroupForm.querySelector('#group-id')
        // const input = e.target.value;

        // console.log(e.target);

        // if (groupID.value.trim() !== '') {
        //     if (isNaN(Number(input))) {
        //         if (e.target.id === 'group-id') {
        //             groupChecker.style.display = 'inline';
        //         } else {
        //             courseChecker.style.display = 'inline';
        //         }
        //         // daigCheckBtn.disabled = true;
        //     } else {
        //         if (e.target.id === 'group-id') {
        //             groupChecker.style.display = 'none';
        //         } else {
        //             courseChecker.style.display = 'none';
        //         }
        //     }

        //     if (groupChecker.style.display === 'inline' || courseChecker.style.display === 'inline') {
        //         daigCheckBtn.disabled = true;
        //     } else {
        //         daigCheckBtn.disabled = false;
        //     }
        // } else {
        //     daigCheckBtn.disabled = true;
        // }
    })

    const daigCheckBtn = deleteAssignmentsInGroupForm.querySelector('#daig-btn');
    daigCheckBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        daigCheckBtn.disabled = true;

        const daigProgressDiv = deleteAssignmentsInGroupForm.querySelector('#daig-progress-div');
        const daigProgressBar = daigProgressDiv.querySelector('.progress-bar');
        updateProgressWithPercent(daigProgressBar, 0);
        const daigProgressInfo = deleteAssignmentsInGroupForm.querySelector('#daig-progress-info');
        const daigResponseContainer = deleteAssignmentsInGroupForm.querySelector('#daig-response-container');
        // clean environment
        daigProgressDiv.hidden = false;
        daigProgressInfo.innerHTML = "Checking...";

        // get domain, token, course, and group ID info
        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const course_id = deleteAssignmentsInGroupForm.querySelector('#course-id').value.trim();
        const group_id = deleteAssignmentsInGroupForm.querySelector('#group-id').value.trim();

        const requestData = {
            domain,
            token,
            group_id
        }

        let hasError = false;
        let assignments = [];
        try {
            assignments = await window.axios.getAssignmentsInGroup(requestData);
            daigProgressInfo.innerHTML = 'Done';
        } catch (error) {
            errorHandler(error, daigProgressInfo);
            hasError = true;
        } finally {
            daigCheckBtn.disabled = false;
        }

        if (!hasError) {
            console.log('found assignments', assignments.length);
            daigResponseContainer.innerHTML = `
               <div>
                    <div class="row align-items-center">
                        <div id="daig-response-details" class="col-auto">
                            <span>Found ${assignments.length} assignments, without submissions or grades.</span>
                        </div>

                        <div class="w-100"></div>

                        <div class="col-2">
                            <button id="remove-btn" type="button" class="btn btn-danger">Remove</button>
                        </div>
                        <div class="col-2">
                            <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>`;

            const cancelBtn = daigResponseContainer.querySelector('#cancel-btn');
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                course_id.value = '';
                daigResponseContainer.innerHTML = '';
                daigCheckBtn.disabled = false;
                //clearData(courseID, responseContent);
            });

            const removeBtn = daigResponseContainer.querySelector('#remove-btn');
            removeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('inside remove');

                const daigResponseDetails = daigResponseContainer.querySelector('#daig-response-details');
                daigResponseDetails.innerHTML = ``;

                daigProgressBar.parentElement.hidden = false;
                daigProgressInfo.innerHTML = `Removing ${assignments.length} assignments...`;

                const messageData = {
                    domain,
                    token,
                    course_id,
                    number: assignments.length,
                    assignments
                }

                window.progressAPI.onUpdateProgress((progress) => {
                    updateProgressWithPercent(daigProgressBar, progress);
                });

                try {
                    const deletedAssignments = await window.axios.deleteAssignments(messageData);
                    if (deletedAssignments.successful.length > 0) {
                        daigProgressInfo.innerHTML = `Successfully removed ${deletedAssignments.successful.length} assignments.`;
                    }
                    if (deletedAssignments.failed.length > 0) {
                        daigProgressInfo.innerHTML = `Failed to remove ${deletedAssignments.failed.length} assignments.`;
                    }
                } catch (error) {
                    errorHandler(error, daigProgressInfo);
                } finally {
                    daigCheckBtn.disabled = false;
                }
            });
        }
    });
}
function deleteNoDueDateAssignments(e) {
    hideEndpoints(e);
    console.log('renderer > deleteNoDueDateAssignments');

    const eContent = document.querySelector('#endpoint-content');
    let form = eContent.querySelector('#delete-no-due-date-assignments-form');

    if (!form) {
        form = document.createElement('form');
        form.id = 'delete-no-due-date-assignments-form';
        form.innerHTML = `
            <div>
                <h3>Delete Assignments Without a Due Date</h3>
                <div>Finds assignments with no due date and without grades/submissions, then deletes them.</div>
            </div>
            <div class="row align-items-center">
                <div class="col-auto mt-3">
                    <label class="form-label">Course</label>
                </div>
                <div class="w-100"></div>
                <div class="col-2">
                    <input id="course-id" type="text" class="form-control" aria-describedby="input-checker" />
                </div>
                <div class="col-auto">
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="action-btn" class="btn btn-primary mt-3">Check</button>
                </div>
            </div>
            <div hidden id="ndd-progress-div">
                <p id="ndd-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="ndd-response-container" class="mt-5"></div>
        `;
        eContent.append(form);
    }
    form.hidden = false;

    const courseID = form.querySelector('#course-id');
    courseID.addEventListener('change', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        checkCourseID(courseID, eContent);
    });

    const checkBtn = form.querySelector('#action-btn');
    checkBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        checkBtn.disabled = true;

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const nddResponseContainer = form.querySelector('#ndd-response-container');
        const nddProgressDiv = form.querySelector('#ndd-progress-div');
        const nddProgressBar = nddProgressDiv.querySelector('.progress-bar');
        const nddProgressInfo = form.querySelector('#ndd-progress-info');

        // clean environment
        nddResponseContainer.innerHTML = '';
        nddProgressDiv.hidden = false;
        nddProgressBar.parentElement.hidden = true;
        updateProgressWithPercent(nddProgressBar, 0);
        enhanceProgressBarWithPercent(nddProgressBar);
        nddProgressInfo.innerHTML = 'Checking...';

        const requestData = {
            domain,
            token,
            course_id: courseID.value.trim()
        };

        let assignments = [];
        let hasError = false;
        try {
            assignments = await window.axios.getNoDueDateAssignments(requestData);
            nddProgressInfo.innerHTML = 'Done';
        } catch (error) {
            errorHandler(error, nddProgressInfo);
            hasError = true;
        } finally {
            checkBtn.disabled = false;
        }

        if (!hasError) {
            nddResponseContainer.innerHTML = `
                <div id="ndd-response-details">
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <span>Found ${assignments.length} assignments without a due date.</span>
                        </div>
                        <div class="w-100"></div>
                        <div class="col-2">
                            <button id="remove-btn" type="button" class="btn btn-danger">Remove</button>
                        </div>
                        <div class="col-2">
                            <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>`;

            const details = nddResponseContainer.querySelector('#ndd-response-details');
            const removeBtn = details.querySelector('#remove-btn');
            const cancelBtn = details.querySelector('#cancel-btn');

            cancelBtn.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                courseID.value = '';
                nddResponseContainer.innerHTML = '';
                checkBtn.disabled = false;
            });

            removeBtn.addEventListener('click', async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();

                details.innerHTML = '';
                nddProgressBar.parentElement.hidden = false;
                nddProgressInfo.innerHTML = `Removing ${assignments.length} assignments...`;

                const assignmentIDs = assignments.map((a) => ({ id: a._id || a.id || a.node?._id }));
                const messageData = {
                    domain,
                    token,
                    course_id: courseID.value.trim(),
                    number: assignmentIDs.length,
                    assignments: assignmentIDs
                };

                window.progressAPI.onUpdateProgress((progress) => {
                    updateProgressWithPercent(nddProgressBar, progress);
                });

                try {
                    const response = await window.axios.deleteAssignments(messageData);
                    if (response.successful.length > 0) {
                        nddProgressInfo.innerHTML = `Successfully removed ${response.successful.length} assignments.`;
                    }
                    if (response.failed.length > 0) {
                        nddProgressInfo.innerHTML += ` Failed to remove ${response.failed.length} assignments.`;
                    }
                } catch (error) {
                    errorHandler(error, nddProgressInfo);
                } finally {
                    checkBtn.disabled = false;
                }
            });

            if (assignments.length < 1) {
                removeBtn.disabled = true;
            }
        }
    });
}