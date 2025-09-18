// ****************************************************
//
// Assignment Endpoints
//
// ****************************************************

// Helper function to create consistent error display across all assignment operations
function createErrorCard(failedItems, operationType = 'assignment') {
    if (!failedItems || failedItems.length === 0) return '';
    
    const errorCount = failedItems.length;
    const errorText = errorCount === 1 ? 'error' : 'errors';
    const errorCardId = `error-details-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let errorHTML = `
        <div class="card mt-3">
            <div class="card-header" style="cursor: pointer;" data-bs-toggle="collapse" data-bs-target="#${errorCardId}" aria-expanded="false">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error Details (${errorCount} ${errorText})
                    </h6>
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="collapse" id="${errorCardId}">
                <div class="card-body">
    `;
    
    failedItems.forEach((failedItem, index) => {
        const errorTitle = failedItem.isNetworkError ? 'Network Error' : 
                         failedItem.status ? `HTTP Error ${failedItem.status}` : 'Unknown Error';
        
        let errorDetail = '';
        if (failedItem.isNetworkError) {
            if (failedItem.reason.includes('ENOTFOUND') || failedItem.reason.includes('getaddrinfo')) {
                errorDetail = 'Cannot reach the server. Check your Canvas domain - make sure it\'s spelled correctly and doesn\'t include "https://".';
            } else {
                errorDetail = 'Network connection problem. Check your internet connection and Canvas domain.';
            }
        } else if (failedItem.status) {
            switch (failedItem.status) {
                case 401:
                    errorDetail = 'Authentication failed. Check your API token.';
                    break;
                case 403:
                    errorDetail = 'Access forbidden. Check permissions or wait if rate limited.';
                    break;
                case 404:
                    errorDetail = `${operationType === 'assignment' ? 'Course or assignment' : 'Resource'} not found. Check your inputs.`;
                    break;
                case 422:
                    errorDetail = 'Validation error. Check your input values.';
                    break;
                default:
                    errorDetail = `Server returned error ${failedItem.status}.`;
                    break;
            }
        } else {
            errorDetail = 'Unknown error occurred.';
        }
        
        const itemLabel = errorCount === 1 ? '' : ` - ${operationType} ${failedItem.id}`;
        errorHTML += `
            <div class="border-start border-danger border-3 ps-3 mb-3">
                <h6 class="text-danger mb-2">${errorTitle}${itemLabel}</h6>
                <p class="mb-2"><strong>Error:</strong> <code>${failedItem.reason || 'Unknown error'}</code></p>
                <p class="mb-0 text-muted">${errorDetail}</p>
            </div>
        `;
    });
    
    errorHTML += `
                </div>
            </div>
        </div>
    `;
    
    return errorHTML;
}

// Helper function to create result cards for operations with success/failure counts
function createResultCard(title, message, failedItems = [], alertType = 'success') {
    const cardId = `result-card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let cardHTML = `
        <div class="card mt-3">
            <div class="card-header">
                <h6 class="mb-0">${title}</h6>
            </div>
            <div class="card-body">
                <div class="alert alert-${alertType} mb-0" role="alert">
                    ${message}
                </div>
    `;
    
    // Add error details if there are failed items
    if (failedItems && failedItems.length > 0) {
        cardHTML += createErrorCard(failedItems, 'assignment');
    }
    
    cardHTML += `
            </div>
        </div>
    `;
    
    // Create and return the DOM element
    const container = document.createElement('div');
    container.innerHTML = cardHTML;
    return container.firstElementChild;
}

function assignmentTemplate(e) {
    // const eContent = document.querySelector('#endpoint-content');
    // eContent.innerHTML = `${e.target.id} was clicked`;

    switch (e.target.id) {
        case 'create-assignments':
            assignmentCreator(e);
            break;
        case 'delete-assignments-combined':
            deleteAssignmentsCombined(e);
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

// Combined Delete Assignments with selectable filters (AND semantics)
function deleteAssignmentsCombined(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let form = eContent.querySelector('#combined-delete-assignments-form');

    if (!form) {
        form = document.createElement('form');
        form.id = 'combined-delete-assignments-form';
        form.innerHTML = `
            <div class="mb-3">
                <h3 class="mb-1">Delete Assignments</h3>
                <div class="text-muted small">Select one or more filters. We'll find assignments that match ALL selected filters.</div>
                <div class="alert alert-info mt-2 mb-0 py-2">
                    <small><strong>Note:</strong> Assignments with grades are automatically excluded unless you check "Include assignments with grades".</small>
                </div>
            </div>

            <div class="mb-3">
                <div class="row g-3 align-items-end">
                    <div class="col-sm-4">
                        <label for="course-id" class="form-label fw-bold">Course ID</label>
                        <input id="course-id" type="text" class="form-control" aria-describedby="course-id-help" inputmode="numeric" />
                        <div class="invalid-feedback">Please enter a valid numeric Course ID.</div>
                    </div>
                    <div class="col-sm-8 d-flex align-items-end gap-2">
                        <button id="combined-check-btn" type="button" class="btn btn-primary" disabled>Check</button>
                        <button id="combined-cancel-btn" type="button" class="btn btn-outline-secondary" disabled>Cancel</button>
                    </div>
                </div>
            </div>

            <div class="card mb-3">
                <div class="card-header" style="cursor: pointer;" id="filters-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">Filters</h6>
                            <small class="text-muted">Select one or more filters to apply</small>
                        </div>
                        <i class="fas fa-chevron-down" id="filters-chevron"></i>
                    </div>
                </div>
                <div class="card-body" id="filters-body">
                    <div class="row g-2">
                        <div class="col-auto form-check">
                            <input id="f-include-graded" class="form-check-input" type="checkbox" />
                            <label for="f-include-graded" class="form-check-label">Include assignments with grades</label>
                        </div>
                        <div class="w-100"></div>
                        <div class="col-auto form-check">
                            <input id="f-nonmodule" class="form-check-input" type="checkbox" />
                            <label for="f-nonmodule" class="form-check-label">Not in a module</label>
                        </div>
                        <div class="col-auto form-check">
                            <input id="f-noduedate" class="form-check-input" type="checkbox" />
                            <label for="f-noduedate" class="form-check-label">No due date</label>
                        </div>
                        <div class="col-auto form-check">
                            <input id="f-unpublished" class="form-check-input" type="checkbox" />
                            <label for="f-unpublished" class="form-check-label">Unpublished</label>
                        </div>
                        <div class="col-auto form-check">
                            <input id="f-nosubs" class="form-check-input" type="checkbox" />
                            <label for="f-nosubs" class="form-check-label">No submissions</label>
                        </div>
                        <div class="w-100"></div>
                        <div class="col-auto form-check" id="f-older-than-container">
                            <input id="f-older-than" class="form-check-input" type="checkbox" />
                            <label for="f-older-than" class="form-check-label">Older than date (by due date)</label>
                        </div>
                        <div class="col-auto" id="f-older-date-container">
                            <input id="f-older-date" class="form-control" type="date" disabled />
                        </div>
                        <div class="w-100"></div>
                        <div class="col-auto form-check">
                            <input id="f-older-created" class="form-check-input" type="checkbox" />
                            <label for="f-older-created" class="form-check-label">Older than date (by created at)</label>
                        </div>
                        <div class="col-auto">
                            <input id="f-older-created-date" class="form-control" type="date" disabled />
                        </div>
                        <div class="w-100"></div>
                        <div class="col-auto form-check">
                            <input id="f-from-import" class="form-check-input" type="checkbox" />
                            <label for="f-from-import" class="form-check-label">From specific import</label>
                        </div>
                        <div class="col-auto">
                            <input id="f-import-id" class="form-control" type="text" placeholder="Import ID" disabled />
                        </div>
                        <div class="w-100"></div>
                        <div class="col-auto form-check">
                            <input id="f-in-group" class="form-check-input" type="checkbox" />
                            <label for="f-in-group" class="form-check-label">In specific assignment group</label>
                        </div>
                        <div class="col-auto">
                            <input id="f-group-id" class="form-control" type="text" placeholder="Assignment Group ID" disabled />
                        </div>
                        <div class="w-100"></div>
                        <div class="col-auto form-check">
                            <input id="f-not-in-group" class="form-check-input" type="checkbox" />
                            <label for="f-not-in-group" class="form-check-label">NOT in specific assignment group</label>
                        </div>
                        <div class="col-auto">
                            <input id="f-not-group-id" class="form-control" type="text" placeholder="Assignment Group ID" disabled />
                        </div>
                    </div>
                </div>
            </div>

            <div hidden id="combined-progress-div" class="mb-3">
                <div class="d-flex align-items-center gap-2">
                    <div class="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true"></div>
                    <p id="combined-progress-info" class="mb-0">Preparing...</p>
                </div>
                <div class="progress mt-3" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="combined-response-container" class="mt-3"></div>
        `;
        eContent.append(form);

        const courseID = form.querySelector('#course-id');
        const checkBtn = form.querySelector('#combined-check-btn');
        const cancelBtn = form.querySelector('#combined-cancel-btn');
        const progressDiv = form.querySelector('#combined-progress-div');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const spinner = progressDiv.querySelector('.spinner-border');
        const progressInfo = form.querySelector('#combined-progress-info');
        const responseDiv = form.querySelector('#combined-response-container');

        const fNoSubs = form.querySelector('#f-nosubs');
        const fOlder = form.querySelector('#f-older-than');
        const fOlderDate = form.querySelector('#f-older-date');
        const fOlderCreated = form.querySelector('#f-older-created');
        const fOlderCreatedDate = form.querySelector('#f-older-created-date');
        const fNonModule = form.querySelector('#f-nonmodule');
        const fNoDue = form.querySelector('#f-noduedate');
        const fUnpub = form.querySelector('#f-unpublished');
        const fFromImport = form.querySelector('#f-from-import');
        const fImportId = form.querySelector('#f-import-id');
        const fInGroup = form.querySelector('#f-in-group');
        const fGroupId = form.querySelector('#f-group-id');
        const fNotInGroup = form.querySelector('#f-not-in-group');
        const fNotGroupId = form.querySelector('#f-not-group-id');
        const fIncludeGraded = form.querySelector('#f-include-graded');

        // Get containers for visual styling
        const fOlderContainer = form.querySelector('#f-older-than-container');
        const fOlderDateContainer = form.querySelector('#f-older-date-container');

        // Set up filters card toggle functionality
        const filtersHeader = form.querySelector('#filters-header');
        const filtersBody = form.querySelector('#filters-body');
        const filtersChevron = form.querySelector('#filters-chevron');

        const toggleFiltersCard = () => {
            if (filtersBody.style.display === 'none') {
                filtersBody.style.display = 'block';
                filtersChevron.className = 'fas fa-chevron-up';
            } else {
                filtersBody.style.display = 'none';
                filtersChevron.className = 'fas fa-chevron-down';
            }
        };

        filtersHeader.addEventListener('click', toggleFiltersCard);

        // Set initial states
        fImportId.disabled = true; // Import ID input starts disabled since checkbox is unchecked
        fGroupId.disabled = true; // Group ID input starts disabled since checkbox is unchecked
        fNotGroupId.disabled = true; // Not Group ID input starts disabled since checkbox is unchecked
        fOlderDate.disabled = true; // Older date input starts disabled since checkbox is unchecked
        fOlderCreatedDate.disabled = true; // Older created date input starts disabled since checkbox is unchecked

        const setFiltersDisabled = (disabled) => {
            [fNonModule, fNoDue, fUnpub, fNoSubs, fOlder, fOlderCreated, fOlderDate, fOlderCreatedDate, fFromImport, fImportId, fInGroup, fGroupId, fNotInGroup, fNotGroupId, fIncludeGraded].forEach(el => {
                if (el) el.disabled = disabled;
            });
        };

        // Filters are enabled by default so users can select them before the initial check

        // Enable Check button only when Course ID is numeric
        courseID.addEventListener('input', () => {
            const val = courseID.value.trim();
            const validCourse = /^(\d+)$/.test(val);
            courseID.classList.toggle('is-invalid', !validCourse && val.length > 0);
            checkBtn.disabled = !validCourse;
        });

        function renderResults(finalAssignments) {
            responseDiv.innerHTML = '';
            const details = document.createElement('div');
            details.id = 'combined-response-details';
            details.className = 'card';
            const totalCount = Array.isArray(allAssignmentsCache) ? allAssignmentsCache.length : finalAssignments.length;
            details.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>Results</span>
            <span class="text-muted small">Total: ${finalAssignments.length}/${totalCount}</span>
                </div>
                <div class="card-body">
            <div>Found ${finalAssignments.length} out of ${totalCount} assignments matching the selected filters.</div>
                </div>
                <div class="card-footer d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-secondary" id="combined-clear-btn">Clear</button>
                    <button type="button" class="btn btn-danger" id="combined-remove-btn" ${finalAssignments.length < 1 ? 'disabled' : ''}>Delete</button>
                </div>`;
            responseDiv.appendChild(details);

            const clearBtn = details.querySelector('#combined-clear-btn');
            const removeBtn = details.querySelector('#combined-remove-btn');
            clearBtn.addEventListener('click', (e2) => {
                e2.preventDefault();
                e2.stopPropagation();
                form.querySelector('#course-id').value = '';
                responseDiv.innerHTML = '';
                progressDiv.hidden = true;
            });
            removeBtn.addEventListener('click', async (e2) => {
                e2.preventDefault();
                e2.stopPropagation();
                details.innerHTML = '';
                progressBar.parentElement.hidden = false;
                progressInfo.innerHTML = `Removing ${finalAssignments.length} assignments...`;
                const domain = document.querySelector('#domain').value.trim();
                const token = document.querySelector('#token').value.trim();
                const cid = form.querySelector('#course-id').value.trim();
                const payload = {
                    domain,
                    token,
                    course_id: cid,
                    number: finalAssignments.length,
                    assignments: finalAssignments.map(a => ({ id: a.id, name: a.name }))
                };
                window.progressAPI.onUpdateProgress((p) => updateProgressWithPercent(progressBar, p));
                try {
                    const result = await window.axios.deleteAssignments(payload);
                    
                    // Check for empty assignment groups after successful deletion
                    const groupResult = await checkAndDeleteEmptyAssignmentGroups(domain, cid, token, progressInfo, details);

                    const { successful, failed } = result;
                    
                    // Create comprehensive result message including assignment group info
                    let message = `Successfully removed ${successful.length} assignments${failed.length > 0 ? `, failed to remove ${failed.length} assignments` : ''}`;
                    
                    if (groupResult.deletedCount > 0) {
                        message += `. Also deleted ${groupResult.deletedCount} empty assignment group(s)`;
                    }
                    if (groupResult.failedCount > 0) {
                        message += `. Failed to delete ${groupResult.failedCount} assignment group(s)`;
                    }
                    
                    progressInfo.innerHTML = '';
                    const resultCard = createResultCard(
                        'Delete Assignments Results',
                        message,
                        failed,
                        failed.length > 0 || groupResult.failedCount > 0 ? 'warning' : 'success'
                    );
                    responseDiv.appendChild(resultCard);
                } catch (err) {
                    errorHandler(err, progressInfo, responseDiv);
                }
            });
        }

        const updateCount = async () => {
            if (!allAssignmentsCache) return;
            const useNonModule = fNonModule.checked;
            const useNoDue = fNoDue.checked;
            const useUnpub = fUnpub.checked;
            const useNoSubs = fNoSubs.checked;
            const includeGradedGlobal = fIncludeGraded.checked;
            const useOlder = fOlder.checked;
            const useOlderCreated = fOlderCreated.checked;
            const olderDateVal = fOlderDate.value;
            const olderCreatedDateVal = fOlderCreatedDate.value;
            const useFromImport = fFromImport.checked;
            const importIdVal = fImportId.value;
            const useInGroup = fInGroup.checked;
            const groupIdVal = fGroupId.value.trim();
            const useNotInGroup = fNotInGroup.checked;
            const notGroupIdVal = fNotGroupId.value.trim();

            let filtered = allAssignmentsCache;
            if (useNonModule) {
                filtered = filtered.filter(a => {
                    const inCore = Array.isArray(a.modules) && a.modules.length > 0;
                    const inQuiz = Array.isArray(a.quiz?.modules) && a.quiz.modules.length > 0;
                    const inDisc = Array.isArray(a.discussion?.modules) && a.discussion.modules.length > 0;
                    return !(inCore || inQuiz || inDisc);
                });
            }
            if (useNoDue) filtered = filtered.filter(a => !a.dueAt);
            if (useUnpub) filtered = filtered.filter(a => !a.published);
            if (useNoSubs) {
                filtered = filtered.filter(a => !a.hasSubmittedSubmissions);
            }
            if (useOlder && olderDateVal) {
                const cutoff = new Date(olderDateVal);
                filtered = filtered.filter(a => a.dueAt && new Date(a.dueAt) < cutoff);
            }
            if (useOlderCreated && olderCreatedDateVal) {
                const cutoff = new Date(olderCreatedDateVal);
                filtered = filtered.filter(a => a.createdAt && new Date(a.createdAt) < cutoff);
            }
            // Apply global grade filter LAST - exclude graded assignments unless includeGradedGlobal is checked
            if (!includeGradedGlobal) {
                filtered = filtered.filter(a => !a.gradedSubmissionsExist);
            }
            if (useFromImport && importIdVal) {
                try {
                    // Check if we need to fetch import data (cache miss or ID changed)
                    if (cachedImportId !== importIdVal || !importedAssignmentsCache) {
                        console.log(`Import filter - fetching import data for ID: ${importIdVal} (previous: ${cachedImportId})`);

                        const domain = document.querySelector('#domain').value.trim();
                        const token = document.querySelector('#token').value.trim();
                        const course_id = form.querySelector('#course-id').value.trim();

                        const importedAssignments = await window.axios.getImportedAssignments({
                            domain,
                            token,
                            course_id,
                            import_id: importIdVal
                        });

                        // Cache the results
                        importedAssignmentsCache = importedAssignments;
                        cachedImportId = importIdVal;

                        console.log('Import filter - fetched and cached imported assignments:', importedAssignments);
                    } else {
                        console.log(`Import filter - using cached import data for ID: ${importIdVal}`);
                    }

                    console.log('Import filter - filtered assignments before import filter:', filtered.length);
                    console.log('Import filter - sample assignment IDs:', filtered.slice(0, 3).map(a => ({ _id: a._id, name: a.name })));

                    if (importedAssignmentsCache && importedAssignmentsCache.length > 0) {
                        // Convert imported IDs to strings and create Set for lookup
                        const importedIds = new Set(importedAssignmentsCache.map(id => String(id).trim()));
                        console.log('Import filter - imported IDs set:', Array.from(importedIds));

                        // Filter to keep only assignments that are in the imported set
                        const beforeLength = filtered.length;
                        filtered = filtered.filter(a => {
                            const assignmentId = String(a._id).trim();
                            const isIncluded = importedIds.has(assignmentId);
                            if (beforeLength <= 5) { // Only log for small sets to avoid spam
                                console.log(`Import filter - checking assignment ${assignmentId} (${a.name}): ${isIncluded ? 'INCLUDED' : 'excluded'}`);
                            }
                            return isIncluded;
                        });

                        console.log('Import filter - assignments after import filter:', filtered.length);
                    } else {
                        console.log('Import filter - no imported assignments found in cache');
                        // No imported assignments found, show empty results
                        filtered = [];
                    }
                } catch (error) {
                    console.error('Error fetching imported assignments:', error);
                    // On error, clear cache and don't apply import filter
                    importedAssignmentsCache = null;
                    cachedImportId = null;
                }
            }

            // Apply assignment group filters
            if (useInGroup && groupIdVal) {
                const targetGroupId = String(groupIdVal).trim();
                console.log(`Assignment group filter - filtering to include only assignments in group: ${targetGroupId}`);
                const beforeLength = filtered.length;
                filtered = filtered.filter(a => {
                    const assignmentGroupId = String(a.assignmentGroup?._id || '').trim();
                    const isIncluded = assignmentGroupId === targetGroupId;
                    if (beforeLength <= 5) { // Only log for small sets to avoid spam
                        console.log(`Assignment group filter - checking assignment ${a._id} (${a.name}) in group ${assignmentGroupId}: ${isIncluded ? 'INCLUDED' : 'excluded'}`);
                    }
                    return isIncluded;
                });
                console.log(`Assignment group filter - assignments in group ${targetGroupId}: ${filtered.length}`);
            }

            if (useNotInGroup && notGroupIdVal) {
                const excludeGroupId = String(notGroupIdVal).trim();
                console.log(`Assignment group filter - filtering to exclude assignments in group: ${excludeGroupId}`);
                const beforeLength = filtered.length;
                filtered = filtered.filter(a => {
                    const assignmentGroupId = String(a.assignmentGroup?._id || '').trim();
                    const isIncluded = assignmentGroupId !== excludeGroupId;
                    if (beforeLength <= 5) { // Only log for small sets to avoid spam
                        console.log(`Assignment group filter - checking assignment ${a._id} (${a.name}) in group ${assignmentGroupId}: ${isIncluded ? 'INCLUDED' : 'excluded'}`);
                    }
                    return isIncluded;
                });
                console.log(`Assignment group filter - assignments not in group ${excludeGroupId}: ${filtered.length}`);
            }

            renderResults(filtered.map(a => ({ id: a._id || a.id, name: a.name })));
        };

        // Cancel fetch
        cancelBtn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            try {
                await window.axios.cancelAllAssignmentsForCombined();
            } catch { }
            cancelBtn.disabled = true;
            setFiltersDisabled(false);
            if (spinner) spinner.hidden = true;
            progressInfo.innerHTML = '<span class="text-warning">Cancelled.</span>';
        });

        // Check button triggers the fetch and keeps filters disabled until completion
        checkBtn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            const val = courseID.value.trim();
            const validCourse = /^(\d+)$/.test(val);
            if (!validCourse) {
                courseID.classList.add('is-invalid');
                return;
            }

            // reset UI state
            responseDiv.innerHTML = '';
            progressDiv.hidden = false;
            progressBar.parentElement.hidden = true;
            updateProgressWithPercent(progressBar, 0);
            if (typeof enhanceProgressBarWithPercent === 'function') enhanceProgressBarWithPercent(progressBar);
            if (spinner) spinner.hidden = false;
            progressInfo.innerHTML = 'Loading assignments...';
            setFiltersDisabled(true);
            checkBtn.disabled = true;
            cancelBtn.disabled = false;

            // Clear import cache when fetching new assignments (might be different course)
            importedAssignmentsCache = null;
            cachedImportId = null;

            const domain = document.querySelector('#domain').value.trim();
            const token = document.querySelector('#token').value.trim();
            const cid = val;

            // Always re-query on Check
            try {
                const all = await window.axios.getAllAssignmentsForCombined({ domain, token, course_id: cid });
                allAssignmentsCache = all;
                progressInfo.innerHTML = '';
                if (spinner) spinner.hidden = true;
                setFiltersDisabled(false);
                cancelBtn.disabled = true;
                checkBtn.disabled = false;
                // Apply current filter state instead of showing all assignments
                updateCount();
            } catch (error) {
                if (String(error).includes('canceled') || String(error).includes('abort')) {
                    progressInfo.innerHTML = '<span class="text-warning">Cancelled.</span>';
                } else {
                    errorHandler(error, progressInfo);
                }
                checkBtn.disabled = false;
            }
        });
        // Listen for filter changes to update counts live
        fNonModule?.addEventListener('change', updateCount);

        // Handle "No due date" filter - disable "Older than date (by due date)" when checked
        fNoDue?.addEventListener('change', () => {
            if (fNoDue.checked) {
                // When "No due date" is checked, disable and uncheck "Older than date (by due date)"
                fOlder.checked = false;
                fOlder.disabled = true;
                fOlderDate.disabled = true;
                fOlderDate.value = '';

                // Add visual styling to show disabled state
                fOlderContainer.style.opacity = '0.5';
                fOlderDateContainer.style.opacity = '0.5';
                fOlderContainer.title = 'This filter is disabled because "No due date" is selected';
            } else {
                // When "No due date" is unchecked, re-enable "Older than date (by due date)"
                fOlder.disabled = false;

                // Remove visual styling
                fOlderContainer.style.opacity = '';
                fOlderDateContainer.style.opacity = '';
                fOlderContainer.title = '';

                // Date input will be enabled/disabled based on the older checkbox state
                fOlderDate.disabled = !fOlder.checked;
            }
            updateCount();
        });

        fUnpub?.addEventListener('change', updateCount);

        fNoSubs.addEventListener('change', updateCount);

        // Toggle date input enablement based on older-than checkbox
        fOlder.addEventListener('change', () => {
            // Only allow enabling if "No due date" is not checked
            if (!fNoDue.checked) {
                fOlderDate.disabled = !fOlder.checked;
            }
            updateCount();
        });
        fOlderDate.addEventListener('input', updateCount);
        fOlderCreated.addEventListener('change', () => {
            fOlderCreatedDate.disabled = !fOlderCreated.checked;
            updateCount();
        });
        fOlderCreatedDate.addEventListener('input', updateCount);

        // Toggle import ID input enablement based on from import checkbox
        fFromImport.addEventListener('change', () => {
            fImportId.disabled = !fFromImport.checked;
            // Don't clear cache when toggling - preserve it for when re-enabled
            updateCount();
        });
        fImportId.addEventListener('input', () => {
            // Clear cache when import ID changes
            const currentImportId = fImportId.value.trim();
            if (currentImportId !== cachedImportId) {
                importedAssignmentsCache = null;
                cachedImportId = null;
            }
            updateCount();
        });

        // Toggle assignment group filter input enablement based on checkboxes
        // Make the two assignment group filters mutually exclusive
        fInGroup.addEventListener('change', () => {
            fGroupId.disabled = !fInGroup.checked;
            // If "In specific group" is checked, uncheck "NOT in specific group"
            if (fInGroup.checked && fNotInGroup.checked) {
                fNotInGroup.checked = false;
                fNotGroupId.disabled = true;
            }
            updateCount();
        });
        fGroupId.addEventListener('input', updateCount);

        fNotInGroup.addEventListener('change', () => {
            fNotGroupId.disabled = !fNotInGroup.checked;
            // If "NOT in specific group" is checked, uncheck "In specific group"
            if (fNotInGroup.checked && fInGroup.checked) {
                fInGroup.checked = false;
                fGroupId.disabled = true;
            }
            updateCount();
        });
        fNotGroupId.addEventListener('input', updateCount);

        // Add event listener for the global grade filter
        fIncludeGraded.addEventListener('change', updateCount);

        // Store fetched assignments in memory; re-fetched on each Check press
        let allAssignmentsCache = null;
        let cacheKey = null; // kept for potential future use

        // Cache for imported assignments to avoid repeated API calls
        let importedAssignmentsCache = null;
        let cachedImportId = null;
    }
    form.hidden = false;

    // Helper function to toggle empty assignment groups card visibility
    function toggleEmptyGroupsCard(headerElement) {
        const cardBody = headerElement.nextElementSibling;
        const chevron = headerElement.querySelector('#empty-groups-chevron');

        if (cardBody.style.display === 'none') {
            cardBody.style.display = 'block';
            chevron.className = 'fas fa-chevron-up';
        } else {
            cardBody.style.display = 'none';
            chevron.className = 'fas fa-chevron-down';
        }
    }

    // Helper function to check and optionally delete empty assignment groups
    async function checkAndDeleteEmptyAssignmentGroups(domain, courseId, token, progressInfo, parentContainer) {
        try {
            progressInfo.innerHTML += `<br>Checking for empty assignment groups...`;
            const emptyGroups = await window.axios.getEmptyAssignmentGroups({
                domain,
                course: courseId,
                token
            });

            if (emptyGroups && emptyGroups.length > 0) {
                progressInfo.innerHTML += `<br>Found ${emptyGroups.length} empty assignment group${emptyGroups.length === 1 ? '' : 's'}.`;

                // Create assignment groups management card
                const groupsCard = document.createElement('div');
                groupsCard.className = 'card mt-3 mb-3';
                groupsCard.innerHTML = `
                    <div class="card-header d-flex justify-content-between align-items-center" style="cursor: pointer;" id="empty-groups-header">
                        <h6 class="mb-0">Empty Assignment Groups</h6>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-secondary">${emptyGroups.length} groups</span>
                            <i class="fas fa-chevron-down" id="empty-groups-chevron"></i>
                        </div>
                    </div>
                    <div class="card-body" style="display: none;">
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="select-all-empty-groups" checked>
                                <label class="form-check-label" for="select-all-empty-groups">
                                    <strong>Select all empty groups for deletion</strong>
                                </label>
                            </div>
                        </div>
                        <div class="border rounded p-3" style="max-height: 300px; overflow-y: auto; background-color: #f8f9fa;">
                            <div id="empty-groups-list">
                                ${emptyGroups.map((group, index) => `
                                    <div class="form-check mb-2">
                                        <input class="form-check-input empty-group-checkbox" type="checkbox" value="${group._id}" id="empty-group-${index}" checked>
                                        <label class="form-check-label d-flex justify-content-between align-items-center" for="empty-group-${index}">
                                            <span>
                                                <strong>${group.name || 'Unnamed Group'}</strong>
                                                <small class="text-muted d-block">ID: ${group._id}</small>
                                            </span>
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <small class="text-muted" id="selection-count">All ${emptyGroups.length} groups selected</small>
                            <div class="gap-2 d-flex">
                                <button id="cancel-empty-groups" type="button" class="btn btn-secondary">Cancel</button>
                                <button id="delete-empty-groups" type="button" class="btn btn-danger">Delete Selected</button>
                            </div>
                        </div>
                    </div>
                `;

                // Insert after the parent container
                parentContainer.parentNode.insertBefore(groupsCard, parentContainer.nextSibling);

                // Set up toggle functionality for the header
                const cardHeader = groupsCard.querySelector('#empty-groups-header');
                cardHeader.addEventListener('click', () => toggleEmptyGroupsCard(cardHeader));

                // Set up event handlers
                const selectAllCheckbox = groupsCard.querySelector('#select-all-empty-groups');
                const groupCheckboxes = groupsCard.querySelectorAll('.empty-group-checkbox');
                const deleteBtn = groupsCard.querySelector('#delete-empty-groups');
                const cancelBtn = groupsCard.querySelector('#cancel-empty-groups');
                const selectionCount = groupsCard.querySelector('#selection-count');

                function updateSelectionState() {
                    const checkedBoxes = Array.from(groupCheckboxes).filter(cb => cb.checked);
                    const totalBoxes = groupCheckboxes.length;

                    // Update select all checkbox state
                    selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < totalBoxes;
                    selectAllCheckbox.checked = checkedBoxes.length === totalBoxes;

                    // Update count display
                    if (checkedBoxes.length === 0) {
                        selectionCount.textContent = 'No groups selected';
                        deleteBtn.disabled = true;
                        deleteBtn.textContent = 'Delete Selected';
                    } else {
                        selectionCount.textContent = `${checkedBoxes.length} of ${totalBoxes} groups selected`;
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = `Delete ${checkedBoxes.length} Group${checkedBoxes.length === 1 ? '' : 's'}`;
                    }
                }

                selectAllCheckbox.addEventListener('change', () => {
                    const isChecked = selectAllCheckbox.checked;
                    groupCheckboxes.forEach(cb => cb.checked = isChecked);
                    updateSelectionState();
                });

                groupCheckboxes.forEach(cb => {
                    cb.addEventListener('change', updateSelectionState);
                });

                updateSelectionState();

                // Return a promise that resolves when user makes a choice
                return new Promise((resolve) => {
                    cancelBtn.addEventListener('click', () => {
                        groupsCard.remove();
                        resolve({ deletedCount: 0, failedCount: 0 });
                    });

                    deleteBtn.addEventListener('click', async () => {
                        const selectedIds = Array.from(groupCheckboxes)
                            .filter(cb => cb.checked)
                            .map(cb => cb.value);

                        if (selectedIds.length === 0) {
                            groupsCard.remove();
                            resolve({ deletedCount: 0, failedCount: 0 });
                            return;
                        }

                        // Update UI to show deletion in progress
                        deleteBtn.disabled = true;
                        cancelBtn.disabled = true;
                        selectAllCheckbox.disabled = true;
                        groupCheckboxes.forEach(cb => cb.disabled = true);

                        groupsCard.querySelector('.card-header h6').textContent = 'Deleting Empty Assignment Groups...';
                        progressInfo.innerHTML += `<br>Deleting ${selectedIds.length} empty assignment group${selectedIds.length === 1 ? '' : 's'}...`;

                        let deletedCount = 0;
                        let failedCount = 0;

                        for (const groupId of selectedIds) {
                            try {
                                await window.axios.deleteEmptyAssignmentGroups({
                                    domain: `https://${domain}/api/v1/courses/${courseId}/assignment_groups`,
                                    groupID: groupId,
                                    token
                                });
                                deletedCount++;

                                // Mark as deleted in UI
                                const checkbox = groupsCard.querySelector(`input[value="${groupId}"]`);
                                if (checkbox) {
                                    const label = checkbox.closest('.form-check');
                                    label.style.opacity = '0.6';
                                    label.style.backgroundColor = '#d4edda';
                                    label.style.borderRadius = '4px';
                                    label.style.padding = '4px';
                                    const statusBadge = document.createElement('span');
                                    statusBadge.className = 'badge bg-success ms-auto';
                                    statusBadge.textContent = 'Deleted';
                                    label.querySelector('label').appendChild(statusBadge);
                                }
                            } catch (error) {
                                console.error(`Failed to delete assignment group ${groupId}:`, error);
                                failedCount++;

                                // Mark as failed in UI
                                const checkbox = groupsCard.querySelector(`input[value="${groupId}"]`);
                                if (checkbox) {
                                    const label = checkbox.closest('.form-check');
                                    label.style.opacity = '0.6';
                                    label.style.backgroundColor = '#f8d7da';
                                    label.style.borderRadius = '4px';
                                    label.style.padding = '4px';
                                    const statusBadge = document.createElement('span');
                                    statusBadge.className = 'badge bg-danger ms-auto';
                                    statusBadge.textContent = 'Failed';
                                    label.querySelector('label').appendChild(statusBadge);
                                }
                            }
                        }

                        // Update header to show completion
                        groupsCard.querySelector('.card-header h6').textContent = 'Assignment Groups Deletion Complete';

                        resolve({ deletedCount, failedCount });
                    });
                });
            }
            return { deletedCount: 0, failedCount: 0 };
        } catch (error) {
            console.error('Error checking for empty assignment groups:', error);
            progressInfo.innerHTML += `<br><span class="text-warning">Error checking for empty assignment groups.</span>`;
            return { deletedCount: 0, failedCount: 0 };
        }
    }
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
            nsaProgressInfo.innerHTML = '';
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
                    const successful = deleteNoSubmissionASsignments.successful.length;
                    const failed = deleteNoSubmissionASsignments.failed.length;
                    
                    let resultHTML = `
                        <div class="alert ${failed > 0 ? 'alert-warning' : 'alert-success'}" role="alert">
                            Deleted ${successful} assignment(s)${failed ? `, ${failed} failed` : ''}.
                        </div>
                    `;
                    
                    // Display detailed error information using the helper function
                    if (failed > 0 && deleteNoSubmissionASsignments.failed) {
                        resultHTML += createErrorCard(deleteNoSubmissionASsignments.failed, 'Assignment');
                    }
                    
                    nsaProgressInfo.innerHTML = '';
                    nsaResponseContainer.innerHTML = resultHTML;
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
            duaProgressInfo.innerHTML = '';
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
                    const successful = deleteUnpublishedAssignments.successful.length;
                    const failed = deleteUnpublishedAssignments.failed.length;
                    
                    let resultHTML = `
                        <div class="alert ${failed > 0 ? 'alert-warning' : 'alert-success'}" role="alert">
                            Deleted ${successful} assignment(s)${failed ? `, ${failed} failed` : ''}.
                        </div>
                    `;
                    
                    // Display detailed error information using the helper function
                    if (failed > 0 && deleteUnpublishedAssignments.failed) {
                        resultHTML += createErrorCard(deleteUnpublishedAssignments.failed, 'Assignment');
                    }
                    
                    duaProgressInfo.innerHTML = '';
                    duaResponseContainer.innerHTML = resultHTML;
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
                    danimProgressInfo.innerHTML = '';
                }
            } else {
                assignments = await window.axios.getNonModuleAssignments(requestData);
                danimProgressInfo.innerHTML = '';
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
                    const successful = deleteNonModuleAssignments.successful.length;
                    const failed = deleteNonModuleAssignments.failed.length;
                    
                    let resultHTML = `
                        <div class="alert ${failed > 0 ? 'alert-warning' : 'alert-success'}" role="alert">
                            Deleted ${successful} assignment(s)${failed ? `, ${failed} failed` : ''}.
                        </div>
                    `;
                    
                    // Display detailed error information using the helper function
                    if (failed > 0 && deleteNonModuleAssignments.failed) {
                        resultHTML += createErrorCard(deleteNonModuleAssignments.failed, 'Assignment');
                    }
                    
                    danimProgressInfo.innerHTML = '';
                    danimResponseContainer.innerHTML = resultHTML;
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
                            const { successful, failed } = deleteOldAssignments;

                            doaProgressInfo.innerHTML = '';
                            const resultCard = createResultCard(
                                'Delete Old Assignments Results',
                                `Successfully removed ${successful.length} assignments${failed.length > 0 ? `, failed to remove ${failed.length} assignments` : ''}`,
                                failed,
                                failed.length > 0 ? 'danger' : 'success'
                            );
                            doaResponseContainer.appendChild(resultCard);
                        } catch (error) {
                            errorHandler(error, doaProgressInfo, doaResponseContainer);
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
            dafiProgressInfo.innerHTML = '';
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
                    const { successful, failed } = response;

                    dafiProgressInfo.innerHTML = '';
                    const resultCard = createResultCard(
                        'Delete from Import Results',
                        `Successfully removed ${successful.length} assignments${failed.length > 0 ? `, failed to remove ${failed.length} assignments` : ''}`,
                        failed,
                        failed.length > 0 ? 'danger' : 'success'
                    );
                    dafiResponseContainer.appendChild(resultCard);

                    dafiCheckBtn.disabled = false;
                } catch (error) {
                    errorHandler(error, dafiProgressInfo, dafiResponseContainer)
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
                    const { successful, failed } = response;

                    kaigProgressInfo.innerHTML = '';
                    const resultCard = createResultCard(
                        'Keep Assignments in Group Results',
                        `Successfully removed ${successful.length} assignments${failed.length > 0 ? `, failed to remove ${failed.length} assignments` : ''}`,
                        failed,
                        failed.length > 0 ? 'danger' : 'success'
                    );
                    kaigResponseContainer.appendChild(resultCard);

                    kaigCheckBtn.disabled = false;
                } catch (error) {
                    errorHandler(error, kaigProgressInfo, kaigResponseContainer)
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
            magProgressInfo.innerHTML = '';
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
            removeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('inside move');

                magResponseDetails.innerHTML = '';

                // Prevent new checks during deletion
                checkBtn.disabled = true;
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
                    const { successful, failed } = moveAssignmentsToSingleGroup;

                    magProgressInfo.innerHTML = '';
                    const resultCard = createResultCard(
                        'Move Assignments Results',
                        `Successfully moved ${successful.length} assignments${failed.length > 0 ? `, failed to move ${failed.length} assignments` : ''}`,
                        failed,
                        failed.length > 0 ? 'danger' : 'success'
                    );
                    // Find the container
                    const magResponseContainer = moveAssignmentsForm.querySelector('#mag-response-container');
                    magResponseContainer.appendChild(resultCard);

                    checkBtn.disabled = false;
                } catch (err) {
                    const magResponseContainer = moveAssignmentsForm.querySelector('#mag-response-container');
                    errorHandler(err, magProgressInfo, magResponseContainer)
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
            daigProgressInfo.innerHTML = '';
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
                    const { successful, failed } = deletedAssignments;
                    
                    daigProgressInfo.innerHTML = '';
                    const resultCard = createResultCard(
                        'Delete Assignments in Group Results',
                        `Successfully removed ${successful.length} assignments${failed.length > 0 ? `, failed to remove ${failed.length} assignments` : ''}`,
                        failed,
                        failed.length > 0 ? 'danger' : 'success'
                    );
                    daigResponseContainer.appendChild(resultCard);
                } catch (error) {
                    errorHandler(error, daigProgressInfo, daigResponseContainer);
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

    function renderResults(finalAssignments) {
        // wipe and render results card with count and delete capability
        const responseDiv = form.querySelector('#combined-response-container');
        responseDiv.innerHTML = '';
        const details = document.createElement('div');
        details.id = 'combined-response-details';
        details.className = 'card';
        details.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <span>Results</span>
                <span class="text-muted small">Total: ${finalAssignments.length}</span>
            </div>
            <div class="card-body">
                <div>Found ${finalAssignments.length} assignments matching the selected filters.</div>
            </div>
            <div class="card-footer d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" id="combined-clear-btn">Clear</button>
                <button type="button" class="btn btn-danger" id="combined-remove-btn" ${finalAssignments.length < 1 ? 'disabled' : ''}>Delete</button>
            </div>`;
        responseDiv.appendChild(details);

        const clearBtn = details.querySelector('#combined-clear-btn');
        const removeBtn = details.querySelector('#combined-remove-btn');
        clearBtn.addEventListener('click', (e2) => {
            e2.preventDefault();
            e2.stopPropagation();
            form.querySelector('#course-id').value = '';
            responseDiv.innerHTML = '';
            progressDiv.hidden = true;
        });
        removeBtn.addEventListener('click', async (e2) => {
            e2.preventDefault();
            e2.stopPropagation();
            details.innerHTML = '';
            progressBar.parentElement.hidden = false;
            progressInfo.innerHTML = `Removing ${finalAssignments.length} assignments...`;
            const domain = document.querySelector('#domain').value.trim();
            const token = document.querySelector('#token').value.trim();
            const cid = form.querySelector('#course-id').value.trim();
            const payload = {
                domain,
                token,
                course_id: cid,
                number: finalAssignments.length,
                assignments: finalAssignments.map(a => ({ id: a.id, name: a.name }))
            };
            window.progressAPI.onUpdateProgress((p) => updateProgressWithPercent(progressBar, p));
            try {
                const result = await window.axios.deleteAssignments(payload);
                const { successful, failed } = result;

                progressInfo.innerHTML = '';
                const resultCard = createResultCard(
                    'Combined Delete Results',
                    `Successfully removed ${successful.length} assignments${failed.length > 0 ? `, failed to remove ${failed.length} assignments` : ''}`,
                    failed,
                    failed.length > 0 ? 'danger' : 'success'
                );
                responseDiv.appendChild(resultCard);
            } catch (err) {
                errorHandler(err, progressInfo, responseDiv);
            }
        });
    }

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
            nddProgressInfo.innerHTML = '';
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
                    const { successful, failed } = response;

                    nddProgressInfo.innerHTML = '';
                    const resultCard = createResultCard(
                        'Delete No Due Date Assignments Results',
                        `Successfully removed ${successful.length} assignments${failed.length > 0 ? `, failed to remove ${failed.length} assignments` : ''}`,
                        failed,
                        failed.length > 0 ? 'danger' : 'success'
                    );
                    nddResponseContainer.appendChild(resultCard);
                } catch (error) {
                    errorHandler(error, nddProgressInfo, nddResponseContainer);
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

// Create Assignments UI and handler
function assignmentCreator(e) {
    hideEndpoints(e);
    console.log('renderer > assignmentCreator');

    const eContent = document.querySelector('#endpoint-content');
    let form = eContent.querySelector('#create-assignments-form');

    if (!form) {
        form = document.createElement('form');
        form.id = 'create-assignments-form';
        form.innerHTML = `
            <div>
                <h3>Create Assignments</h3>
            </div>
            <div class="row g-3 align-items-start">
                <div class="col-12 col-sm-3">
                    <label class="form-label" for="course-id">Course ID</label>
                    <input id="course-id" type="text" class="form-control" aria-describedby="course-help" inputmode="numeric" />
                    <div id="course-help" class="form-text">Numbers only</div>
                    <div class="invalid-feedback">Please enter a valid numeric Course ID.</div>
                </div>

                <div class="col-6 col-sm-2">
                    <label class="form-label" for="assignment-number">How many</label>
                    <input id="assignment-number" type="number" class="form-control" min="1" value="1" />
                </div>

                <div class="col-12 col-sm-4">
                    <label class="form-label" for="assignment-name">Name</label>
                    <input id="assignment-name" type="text" class="form-control" placeholder="Assignment" value="Assignment" />
                </div>

                <div class="w-100"></div>

                <div class="col-6 col-sm-2">
                    <label class="form-label" for="points">Points</label>
                    <input id="points" type="number" class="form-control" min="0" value="10" />
                </div>

                <div class="col-6 col-sm-3">
                    <label class="form-label" for="grade-type">Grading type</label>
                    <select id="grade-type" class="form-select">
                        <option value="points" selected>Points</option>
                        <option value="percent">Percent</option>
                        <option value="pass_fail">Pass/Fail</option>
                        <option value="letter_grade">Letter grade</option>
                        <option value="gpa_scale">GPA scale</option>
                    </select>
                </div>

                <div class="col-12 col-sm-7">
                    <label class="form-label">Submission types</label>
                    <div class="d-flex flex-wrap gap-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="st-upload" data-st="online_upload" checked />
                            <label class="form-check-label" for="st-upload">File upload</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="st-text" data-st="online_text_entry" />
                            <label class="form-check-label" for="st-text">Text entry</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="st-url" data-st="online_url" />
                            <label class="form-check-label" for="st-url">Website URL</label>
                        </div>
                    </div>
                </div>

                <div class="w-100"></div>

                <div class="col-auto form-check form-switch ms-1">
                    <input id="publish" class="form-check-input" type="checkbox" />
                    <label class="form-check-label" for="publish">Publish</label>
                </div>
                <div class="col-auto form-check form-switch">
                    <input id="peer-reviews" class="form-check-input" type="checkbox" />
                    <label class="form-check-label" for="peer-reviews">Peer reviews</label>
                </div>
                <div class="col-auto form-check form-switch">
                    <input id="anonymous" class="form-check-input" type="checkbox" />
                    <label class="form-check-label" for="anonymous">Anonymous grading</label>
                </div>

                <div class="w-100"></div>
                <div class="col-auto">
                    <button id="action-btn" class="btn btn-primary mt-2" type="button">Create</button>
                </div>
            </div>

            <div hidden id="cac-progress-div" class="mt-3">
                <p id="cac-progress-info" class="mb-1"></p>
                <div class="progress" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="cac-response-container" class="mt-4"></div>
        `;
        eContent.append(form);

        // Enhance progress bar with percent overlay
        const progressBar = form.querySelector('.progress-bar');
        if (progressBar && typeof enhanceProgressBarWithPercent === 'function') {
            enhanceProgressBarWithPercent(progressBar);
        }

        // Validation for course id and global domain/token - ONLY ATTACH ONCE
        const cID = form.querySelector('#course-id');
        const validateForm = () => {
            const courseVal = cID.value.trim();
            const courseValid = /^\d+$/.test(courseVal);
            const domain = document.querySelector('#domain').value.trim();
            const token = document.querySelector('#token').value.trim();

            cID.classList.toggle('is-invalid', !courseValid && courseVal.length > 0);

            // Enable button only if all required fields are present
            const allValid = courseValid && domain.length > 0 && token.length > 0;
            form.querySelector('#action-btn').disabled = !allValid;
        };

        cID.addEventListener('input', validateForm);

        // Also listen to domain and token changes
        const domainInput = document.querySelector('#domain');
        const tokenInput = document.querySelector('#token');
        domainInput.addEventListener('input', validateForm);
        tokenInput.addEventListener('input', validateForm);

        // Initial validation
        validateForm();

        // Visual indicator for assignment number field when > 1 - ONLY ATTACH ONCE
        const assignmentNumberField = form.querySelector('#assignment-number');
        const updateAssignmentNumberVisual = () => {
            const value = parseInt(assignmentNumberField.value || '1', 10);
            if (value > 1) {
                assignmentNumberField.classList.add('border-warning');
                assignmentNumberField.style.backgroundColor = '#fff3cd';
            } else {
                assignmentNumberField.classList.remove('border-warning');
                assignmentNumberField.style.backgroundColor = '';
            }
        };

        assignmentNumberField.addEventListener('input', updateAssignmentNumberVisual);
        assignmentNumberField.addEventListener('change', updateAssignmentNumberVisual);
        // Initial check
        updateAssignmentNumberVisual();

        // Create Assignment button handler - ONLY ATTACH ONCE
        const createBtn = form.querySelector('#action-btn');
        createBtn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            const domain = document.querySelector('#domain').value.trim();
            const token = document.querySelector('#token').value.trim();
            const course_id = cID.value.trim();
            const number = Math.max(1, parseInt(form.querySelector('#assignment-number').value || '1', 10));
            const name = (form.querySelector('#assignment-name').value || 'Assignment').trim();
            const points = Math.max(0, parseFloat(form.querySelector('#points').value || '0'));
            const grade_type = form.querySelector('#grade-type').value;
            const publish = form.querySelector('#publish').checked ? 'published' : 'unpublished';
            const peer_reviews = form.querySelector('#peer-reviews').checked;
            const anonymous = form.querySelector('#anonymous').checked;

            const submissionTypes = Array.from(form.querySelectorAll('[data-st]'))
                .filter(cb => cb.checked)
                .map(cb => cb.getAttribute('data-st'));
            if (submissionTypes.length < 1) submissionTypes.push('online_upload');

            const progressDiv = form.querySelector('#cac-progress-div');
            const progressBar = progressDiv.querySelector('.progress-bar');
            const progressInfo = form.querySelector('#cac-progress-info');
            const responseDiv = form.querySelector('#cac-response-container');

            // Reset UI
            responseDiv.innerHTML = '';
            progressDiv.hidden = false;
            progressBar.parentElement.hidden = false;
            updateProgressWithPercent(progressBar, 0);
            progressInfo.textContent = 'Creating assignments...';
            createBtn.disabled = true;

            // Subscribe to progress updates for this operation
            const unsub = window.progressAPI?.onUpdateProgress?.((payload) => {
                try {
                    if (typeof payload === 'number') {
                        updateProgressWithPercent(progressBar, payload);
                    } else if (payload && typeof payload === 'object') {
                        if (typeof payload.value === 'number') {
                            updateProgressWithPercent(progressBar, Math.round(Math.max(0, Math.min(1, payload.value)) * 100));
                        }
                        if (payload.label) {
                            const pct = payload.value != null ? ` (${Math.round((payload.value || 0) * 100)}%)` : '';
                            progressInfo.textContent = `${payload.label}${pct}`;
                        }
                    }
                } catch { }
            });

            const data = {
                domain,
                token,
                course_id,
                number,
                name,
                points,
                grade_type,
                publish,
                peer_reviews,
                anonymous,
                submissionTypes
            };

            try {
                const result = await window.axios.createAssignments(data);
                const ok = result?.successful?.length || 0;
                const bad = result?.failed?.length || 0;
                progressInfo.textContent = '';

                let responseHTML = `
                    <div class="alert ${bad > 0 ? 'alert-warning' : 'alert-success'}" role="alert">
                        Created ${ok} assignment(s)${bad ? `, ${bad} failed` : ''}.
                    </div>
                `;
                
                // Display detailed error information using the helper function
                if (bad > 0 && result.failed) {
                    responseHTML += createErrorCard(result.failed, 'Assignment');
                }
                
                responseDiv.innerHTML = responseHTML;                // Reset the assignment number field to 1 to prevent accidental multiple creations
                form.querySelector('#assignment-number').value = '1';
                updateAssignmentNumberVisual(); // Update visual state after reset
            } catch (error) {
                // Hide the striped bar and show error
                progressBar.parentElement.hidden = true;
                errorHandler(error, progressInfo);
            } finally {
                if (typeof unsub === 'function') try { unsub(); } catch { }
                createBtn.disabled = false;
            }
        });
    }

    form.hidden = false;
}