function moduleTemplate(e) {
    switch (e.target.id) {
        case 'delete-modules':
            deleteModules(e);
            break;
        case 'relock-modules':
            reLockModules(e);
            break;
        default:
            break;
    }
}

async function deleteModules(e) {
    hideEndpoints(e)

    const eContent = document.querySelector('#endpoint-content');
    let createModuleDeleteForm = eContent.querySelector('#create-module-delete-form');

    if (!createModuleDeleteForm) {
        createModuleDeleteForm = document.createElement('form');
        createModuleDeleteForm.id = 'create-module-delete-form';
        createModuleDeleteForm.innerHTML = `
            <div>
                <h3>Delete Modules</h3>
            </div>
            <div class="row">
                <div class="row align-items-center">
                        <div class="col-2">
                            <label class="form-label">Course</label>
                            <input id="course-id" type="text" class="form-control" aria-describedby="input-checker" />
                        </div>
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <hr class="mt-2">
                <div class="row">
                    <div class="mt-3">
                        <div class="col-auto form-check form-switch" >
                            <input id="empty-modules" class="form-check-input" type="checkbox" role="switch" checked>
                            <label for="empty-modules" class="form-check-label">Delete Only empty modules</label>
                            <div id="delete-module-help" class="form-text">
                                (otherwise this will delete <em>all</em> modules)
                            </div>
                        </div>
                    </div>          
                </div>
                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="check-modules-btn" class="btn btn-primary mt-3" disabled>Check</button>
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

        eContent.append(createModuleDeleteForm);
    }
    createModuleDeleteForm.hidden = false;

    const courseID = createModuleDeleteForm.querySelector('#course-id');
    courseID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();


        checkCourseID(courseID, createModuleDeleteForm);
    });

    const checkModulesBtn = createModuleDeleteForm.querySelector('button');
    checkModulesBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();


        const responseContainer = createModuleDeleteForm.querySelector('#response-container');
        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const course_id = courseID.value.trim();
        const emptyModules = createModuleDeleteForm.querySelector('#empty-modules').checked;

        const progressDiv = createModuleDeleteForm.querySelector('#progress-div');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressInfo = createModuleDeleteForm.querySelector('#progress-info');

        // clean environment
        responseContainer.innerHTML = '';
        progressDiv.hidden = false;
        progressBar.parentElement.hidden = true;
        progressBar.style.width = '0%';
        progressInfo.innerHTML = 'Checking...';

        const requestData = {
            domain,
            token,
            course_id,
            emptyModules
        };

        // first get all modules
        let courseModules = [];
        let hasError = false;

        try {
            courseModules = await window.axios.getModules(requestData);
            progressInfo.innerHTML = 'Done';
        } catch (error) {
            errorHandler(error, progressInfo)
            hasError = true;
        } finally {
            // checkModulesBtn.disabled = true;
        }

        if (!hasError) {
            responseContainer.innerHTML = `
                        <div>
                            <div class="row align-items-center">
                                <div id="response-details" class="col-auto">
                                    <span>Found ${courseModules.length} to delete</span>
                                </div>

                                <div class="w-100"></div>

                                <div class="col-2">
                                    <button id="remove-btn" type="button" class="btn btn-danger" disabled>Remove</button>
                                </div>
                                <div class="col-2">
                                    <button id="cancel-btn" type="button" class="btn btn-secondary" disabled>Cancel</button>
                                </div>
                            </div>
                        </div>    
                    `;

            const responseDetails = responseContainer.querySelector('#response-details');

            const cancelBtn = responseDetails.querySelector('#cancel-btn');
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                courseID.value = '';
                responseContainer.innerHTML = '';
                progressInfo.innerHTML = '';
                checkModulesBtn.disabled = true;
                //clearData(courseID, responseContent);
            });

            const removeBtn = responseDetails.querySelector('#remove-btn');
            if (courseModules.length > 0) {
                removeBtn.disabled = false;
                cancelBtn.disabled = false;
            }
            removeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                responseDetails.innerHTML = ``;
                progressBar.parentElement.hidden = false;
                progressInfo.innerHTML = `Removing ${courseModules.length} modules...`;

                const courseModuleIds = courseModules.map((module) => {
                    return {
                        name: module.node.name,
                        id: module.node._id
                    };
                });

                const requestData = {
                    domain,
                    token,
                    course_id,
                    number: courseModuleIds.length,
                    module_ids: courseModuleIds
                };

                window.progressAPI.onUpdateProgress((progress) => {
                    progressBar.style.width = `${progress}%`;
                });

                try {
                    const deleteModuleIds = await window.axios.deleteModules(requestData);

                    if (deleteModuleIds.successful.length > 0) {
                        progressInfo.innerHTML = `Successfully removed ${deleteModuleIds.successful.length} modules.`;
                    }
                    if (deleteModuleIds.failed.length > 0) {
                        progressInfo.innerHTML = `Failed to remove ${deleteModuleIds.failed.length} modules.`;
                    }
                } catch (error) {
                    errorHandler(error, progressInfo)
                } finally {
                    checkModulesBtn.disabled = false;
                    removeBtn.hidden = true;
                    removeBtn.disabled = true;
                    cancelBtn.hidden = true;
                    cancelBtn.disabled = true;
                }
            });
        }
    })
}

async function reLockModules(e) {
    hideEndpoints(e)

    const eContent = document.querySelector('#endpoint-content');
    let reLockModulesForm = eContent.querySelector('#relock-modules-form');

    if (!reLockModulesForm) {
        reLockModulesForm = document.createElement('form');
        reLockModulesForm.id = 'relock-modules-form';
        reLockModulesForm.innerHTML = `
            <div>
                <h3>Re-lock Modules</h3>
                <p>Relocks all modules in a course</p>
            </div>
            <div class="row">
                <div class="row align-items-center">
                        <div class="col-2">
                            <label class="form-label">Course</label>
                            <input id="course-id" type="text" class="form-control" aria-describedby="input-checker" />
                        </div>
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <hr class="mt-2">
                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="check-modules-btn" class="btn btn-primary mt-3" disabled>Check</button>
                </div>
            </div>
            <div hidden id="relock-progress-div">
                <p id="relock-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="relock-response-container" class="mt-3">
            </div>
        `;

        eContent.append(createModuleDeleteForm);
    }
    createModuleDeleteForm.hidden = false;
}