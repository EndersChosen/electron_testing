function importsTemplate(e) {
    switch (e.target.id) {
        case 'delete-imported-content':
            deleteImportedContent(e);
            break;
        default:
            break;
    }
}

async function deleteImportedContent(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let form = eContent.querySelector('#imports-delete-form');
    if (!form) {
        form = document.createElement('form');
        form.id = 'imports-delete-form';
        form.innerHTML = `
            <div>
                <h3>Delete Imported Content</h3>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
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
                <div class="col-auto mt-3">
                    <label class="form-label">Import ID</label>
                </div>
                <div class="col-4">
                    <input class="form-control" id="import-id" type="text">
                </div>
                <div class="col-auto">
                    <button id="check-imported-assets-btn" class="btn btn-primary mt-3" disabled>Check</button>
                </div>
                <div class="col-auto">
                    <button id="list-imports-btn" type="button" class="btn btn-outline-secondary mt-3">List Imports</button>
                </div>
            </div>
            <div hidden id="imports-progress-div">
                <p id="imports-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="imports-response-container" class="mt-3"></div>
        `;
        eContent.append(form);
    }

    form.hidden = false;
    const courseID = form.querySelector('#course-id');
    const importID = form.querySelector('#import-id');
    const checkBtn = form.querySelector('#check-imported-assets-btn');
    const listBtn = form.querySelector('#list-imports-btn');
    const progressDiv = form.querySelector('#imports-progress-div');
    const progressBar = progressDiv.querySelector('.progress-bar');
    const progressInfo = form.querySelector('#imports-progress-info');
    const responseContainer = form.querySelector('#imports-response-container');

    courseID.addEventListener('input', () => {
        const valid = /^(\d+)$/.test(courseID.value.trim());
        form.querySelector('#input-checker').style.display = valid ? 'none' : 'inline';
        checkBtn.disabled = !(valid && importID.value.trim().length > 0);
    });
    importID.addEventListener('input', () => {
        const valid = /^(\d+)$/.test(courseID.value.trim());
        checkBtn.disabled = !(valid && importID.value.trim().length > 0);
    });

    checkBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        checkBtn.disabled = true;
        responseContainer.innerHTML = '';
        progressDiv.hidden = false;
        progressBar.parentElement.hidden = true;
        progressBar.style.width = '0%';
        progressInfo.innerHTML = '';

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const course_id = courseID.value.trim();
        const import_id = importID.value.trim();

        const requestData = { domain, token, course_id, import_id };
        progressInfo.innerHTML = `Checking imported content for import ${import_id}...`;
        let assets = null;
        let hasError = false;
        try {
            assets = await window.axios.getImportedAssets(requestData);
            progressInfo.innerHTML = 'Done';
        } catch (error) {
            errorHandler(error, progressInfo);
            // If likely invalid Import ID, show imports list prompt
            if ((error.message || '').includes('Import ID may be invalid')) {
                responseContainer.innerHTML = `<div class="alert alert-warning">Could not load import ${import_id}. Click "List Imports" to see recent import IDs for this course.</div>`;
            }
            hasError = true;
        } finally {
            checkBtn.disabled = false;
        }

        if (hasError) return;

        const counts = {
            attachments: assets.attachments.length,
            folders: assets.folders.length,
            outcomes: assets.outcomes.length,
            contentTags: assets.contentTags.length,
            rubrics: assets.rubrics.length,
            assignmentGroups: assets.assignmentGroups.length,
            assignments: assets.assignments.length,
            quizzes: assets.quizzes.length,
            announcements: assets.announcements.length,
            discussions: assets.discussions.length,
            pages: assets.pages.length,
            modules: assets.modules.length,
            calendarEvents: assets.calendarEvents.length
        };

        const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
        if (totalAll === 0) {
            responseContainer.innerHTML = `<div class="alert alert-info">No imported assets found for this import.</div>`;
            return;
        }

        responseContainer.innerHTML = `
            <div id="imports-response-details">
                <div class="row align-items-center">
                    <div class="col-12 mb-2">
                        <div class="mb-2" style="column-count: 2; -webkit-column-count: 2; column-gap: 1rem;">
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-assignments" ${counts.assignments ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-assignments">Assignments (${counts.assignments})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-discussions" ${counts.discussions ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-discussions">Discussions (${counts.discussions})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-quizzes" ${counts.quizzes ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-quizzes">Quizzes (Classic) (${counts.quizzes})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-modules" ${counts.modules ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-modules">Modules (${counts.modules})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-pages" ${counts.pages ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-pages">Pages (${counts.pages})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-rubrics" ${counts.rubrics ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-rubrics">Rubrics (${counts.rubrics})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-assignment-groups" ${counts.assignmentGroups ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-assignment-groups">Assignment Groups (${counts.assignmentGroups})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-announcements" ${counts.announcements ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-announcements">Announcements (${counts.announcements})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-attachments" ${counts.attachments ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-attachments">Attachments (${counts.attachments})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-folders" ${counts.folders ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-folders">Folders (${counts.folders})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-outcomes" ${counts.outcomes ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-outcomes">Outcomes (${counts.outcomes})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-content-tags" ${counts.contentTags ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-content-tags">Content Tags (${counts.contentTags})</label>
                            </div>
                            <div class="form-check break-inside-avoid">
                                <input class="form-check-input" type="checkbox" id="chk-calendar-events" ${counts.calendarEvents ? '' : 'disabled'}>
                                <label class="form-check-label" for="chk-calendar-events">Calendar Events (${counts.calendarEvents})</label>
                            </div>
                        </div>
                    </div>
                    <div class="w-100"></div>
                    <div class="col-2"><button id="imports-remove-btn" type="button" class="btn btn-danger">Delete</button></div>
                    <div class="col-2"><button id="imports-cancel-btn" type="button" class="btn btn-secondary">Cancel</button></div>
                </div>
            </div>
        `;

        const details = responseContainer.querySelector('#imports-response-details');
        const removeBtn = details.querySelector('#imports-remove-btn');
        const cancelBtn = details.querySelector('#imports-cancel-btn');
        const chkAssignments = details.querySelector('#chk-assignments');
        const chkDiscussions = details.querySelector('#chk-discussions');
        const chkQuizzes = details.querySelector('#chk-quizzes');
        const chkModules = details.querySelector('#chk-modules');
        const chkPages = details.querySelector('#chk-pages');
        const chkRubrics = details.querySelector('#chk-rubrics');
        const chkAssignmentGroups = details.querySelector('#chk-assignment-groups');
        const chkAnnouncements = details.querySelector('#chk-announcements');
        const chkAttachments = details.querySelector('#chk-attachments');
        const chkFolders = details.querySelector('#chk-folders');
        const chkOutcomes = details.querySelector('#chk-outcomes');
        const chkContentTags = details.querySelector('#chk-content-tags');
        const chkCalendarEvents = details.querySelector('#chk-calendar-events');

        cancelBtn.addEventListener('click', (e2) => {
            e2.preventDefault();
            e2.stopPropagation();
            courseID.value = '';
            responseContainer.innerHTML = '';
            checkBtn.disabled = true;
        });

        removeBtn.addEventListener('click', async (e3) => {
            e3.preventDefault();
            e3.stopPropagation();

            const selections = {
                attachments: chkAttachments?.checked && counts.attachments > 0,
                folders: chkFolders?.checked && counts.folders > 0,
                outcomes: chkOutcomes?.checked && counts.outcomes > 0,
                contentTags: chkContentTags?.checked && counts.contentTags > 0,
                rubrics: chkRubrics?.checked && counts.rubrics > 0,
                assignmentGroups: chkAssignmentGroups?.checked && counts.assignmentGroups > 0,
                assignments: chkAssignments.checked && counts.assignments > 0,
                quizzes: chkQuizzes.checked && counts.quizzes > 0,
                announcements: chkAnnouncements?.checked && counts.announcements > 0,
                discussions: chkDiscussions.checked && counts.discussions > 0,
                pages: chkPages?.checked && counts.pages > 0,
                modules: chkModules?.checked && counts.modules > 0,
                calendarEvents: chkCalendarEvents?.checked && counts.calendarEvents > 0,
            };

            if (!Object.values(selections).some(Boolean)) {
                progressInfo.innerHTML = '<span style="color: red;">Select at least one content type to delete.</span>';
                return;
            }

            details.innerHTML = '';
            progressBar.parentElement.hidden = false;
            progressInfo.innerHTML = 'Deleting selected content...';

            // Wire progress
            window.progressAPI.onUpdateProgress((p) => {
                updateProgressWithPercent(progressBar, p);
            });

            try {
                // Assignments
                if (selections.assignments) {
                    const payloadA = {
                        domain,
                        token,
                        course_id,
                        number: assets.assignments.length,
                        assignments: assets.assignments.map(id => ({ id }))
                    };
                    await window.axios.deleteAssignments(payloadA);
                }

                // Discussions
                if (selections.discussions) {
                    const payloadD = {
                        domain,
                        token,
                        course_id,
                        discussions: assets.discussions
                    };
                    await window.axios.deleteDiscussions(payloadD);
                }

                // Quizzes (classic)
                if (selections.quizzes) {
                    const payloadQ = {
                        domain,
                        token,
                        courseID: course_id,
                        quizzes: assets.quizzes.map(id => ({ _id: id }))
                    };
                    await window.axios.deleteClassicQuizzes(payloadQ);
                }

                // Modules
                if (selections.modules) {
                    const payloadM = {
                        domain,
                        token,
                        course_id,
                        number: assets.modules.length,
                        module_ids: assets.modules.map(id => ({ id }))
                    };
                    await window.axios.deleteModules(payloadM);
                }

                // Note: The following types are detected but not yet wired to delete APIs in this app:
                // Attachments, Folders, Outcomes, Content Tags, Rubrics, Assignment Groups (bulk delete), Announcements, Pages, Calendar Events
                // We can implement these in a follow-up.

                progressInfo.innerHTML = 'Finished deleting selected imported content.';
                updateProgressWithPercent(progressBar, 100);
            } catch (error) {
                errorHandler(error, progressInfo);
            }
        });
    });

    listBtn.addEventListener('click', async (e2) => {
        e2.preventDefault();
        e2.stopPropagation();

        responseContainer.innerHTML = '';
        progressDiv.hidden = false;
        progressBar.parentElement.hidden = true;
        progressBar.style.width = '0%';
        progressInfo.innerHTML = 'Loading recent imports...';

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const course_id = courseID.value.trim();
        try {
            const imports = await window.axios.listContentMigrations({ domain, token, course_id });
            progressInfo.innerHTML = 'Done';
            if (!imports || imports.length === 0) {
                responseContainer.innerHTML = '<div class="alert alert-info">No imports found for this course.</div>';
                return;
            }
            const rows = imports.map(m => {
                const id = m.id ?? m.ID ?? m._id;
                const type = m.migration_type || m.workflow_state || 'import';
                const started = m.started_at || m.created_at || '';
                return `<tr><td>${id}</td><td>${type}</td><td>${started}</td></tr>`;
            }).join('');
            responseContainer.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead><tr><th>Import ID</th><th>Type/State</th><th>Started</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="form-text">Copy an Import ID from above and paste it into the Import ID field.</div>
                </div>`;
        } catch (err) {
            errorHandler(err, progressInfo);
        }
    });
}
