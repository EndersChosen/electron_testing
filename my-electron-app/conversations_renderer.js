// ****************************************
//
// Conversation endpoints
//
// ****************************************
async function conversationTemplate(e) {
    // const eContent = document.querySelector('#endpoint-content');
    // eContent.innerHTML = '';

    switch (e.target.id) {
        case 'delete-conversations-subject':
            deleteConvos(e);
            break;
        case 'download-conversations-csv': // Not Complete
            downloadConvos(e);
            break;
        case 'get-deleted-conversations':
            getDeletedConversations(e);
            break;
        case 'gc-between-users': // Not complete
            getConvos(e);
            break;
        case 'restore-deleted-conversations':
            restoreDeletedConversations(e);
            break;
        default:
            break;
    }
};

async function restoreDeletedConversations(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let form = eContent.querySelector('#restore-deleted-convos-form');

    if (!form) {
        form = document.createElement('form');
        form.id = 'restore-deleted-convos-form';
    form.innerHTML = `
            <div>
                <h3>Restore Deleted Conversations</h3>
        <p>Upload a CSV that includes 'user_id', 'id','conversation_id' headers</p>
            </div>
            <div class="row align-items-center mt-2">
                <div class="col-auto">
                    <button id="rdc-upload" type="button" class="btn btn-secondary">Choose CSV</button>
                </div>
                <div class="col-auto">
                    <span id="rdc-upload-info" class="form-text"></span>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-auto">
                    <button id="rdc-restore" type="button" class="btn btn-primary" disabled>Restore</button>
                </div>
                <div class="col-auto">
                    <button id="rdc-clear" type="button" class="btn btn-outline-secondary">Clear</button>
                </div>
            </div>
            <div hidden id="rdc-progress-div" class="mt-3">
                <p id="rdc-progress-info"></p>
                <div class="progress mt-1" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="rdc-response" class="mt-3"></div>
        `;
        eContent.append(form);
    }
    form.hidden = false;

    const uploadBtn = form.querySelector('#rdc-upload');
    const uploadInfo = form.querySelector('#rdc-upload-info');
    const restoreBtn = form.querySelector('#rdc-restore');
    const clearBtn = form.querySelector('#rdc-clear');
    const progressDiv = form.querySelector('#rdc-progress-div');
    const progressBar = progressDiv.querySelector('.progress-bar');
    const progressInfo = form.querySelector('#rdc-progress-info');
    const responseDiv = form.querySelector('#rdc-response');

    let records = [];

    function parseCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === '"') {
                if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (ch === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current);
        return result.map(v => v.trim());
    }

    function normalizeHeader(h) {
        return (h || '')
            .replace(/^\uFEFF/, '') // strip BOM
            .toLowerCase()
            .replace(/\s+/g, '_');
    }

    function parseDeletedConvosCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length === 0) return [];
        const headers = parseCSVRow(lines[0]).map(normalizeHeader);
        const colIdx = {
            user_id: headers.indexOf('user_id'),
            id: headers.indexOf('id'),
            conversation_id: headers.indexOf('conversation_id')
        };
        if (colIdx.user_id === -1 || colIdx.id === -1 || colIdx.conversation_id === -1) {
            throw new Error(`CSV must include headers: user_id, id, conversation_id. Found: ${headers.join(', ')}`);
        }
        const out = [];
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVRow(lines[i]);
            if (!row.length) continue;
            const user_id = row[colIdx.user_id];
            const message_id = row[colIdx.id];
            const conversation_id = row[colIdx.conversation_id];
            if (user_id && message_id && conversation_id) {
                out.push({ user_id: String(user_id).trim(), message_id: String(message_id).trim(), conversation_id: String(conversation_id).trim() });
            }
        }
        return out;
    }

    if (form.dataset.bound !== 'true') {
    uploadBtn.addEventListener('click', async (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        uploadBtn.disabled = true;
        uploadInfo.textContent = '';
        records = [];
        try {
            // Prefer native file dialog via hidden input here to control parsing locally
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,text/csv';
            // If the user cancels the dialog, 'change' won't fire.
            // When the window regains focus, if no file was chosen, re-enable the button.
            const onFocus = () => {
                if (!input.files || input.files.length === 0) {
                    uploadBtn.disabled = false;
                }
            };
            window.addEventListener('focus', onFocus, { once: true });
            input.onchange = async () => {
                try {
                    window.removeEventListener('focus', onFocus);
                    const file = input.files && input.files[0];
                    if (!file) return;
                    const text = await file.text();
                    records = parseDeletedConvosCSV(text);
                    uploadInfo.textContent = `Loaded ${records.length} row(s).`;
                    restoreBtn.disabled = records.length === 0;
                } catch (err) {
                    errorHandler(err, uploadInfo);
                } finally {
                    uploadBtn.disabled = false;
                }
            };
            input.click();
        } catch (error) {
            errorHandler(error, uploadInfo);
            uploadBtn.disabled = false;
        }
    });

    restoreBtn.addEventListener('click', async (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        if (records.length === 0) return;

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();

        // Validate rows: ensure all three fields are numeric
        const isNum = (v) => /^\d+$/.test(String(v).trim());
        const validRecords = records.filter(r => isNum(r.user_id) && isNum(r.message_id) && isNum(r.conversation_id));
        const skipped = records.length - validRecords.length;

        if (validRecords.length === 0) {
            progressDiv.hidden = false;
            progressBar.style.width = '0%';
            progressInfo.innerHTML = 'No valid rows to process. Ensure CSV has numeric user_id, id, and conversation_id values.';
            restoreBtn.disabled = false;
            return;
        }

        progressDiv.hidden = false;
        progressBar.style.width = '0%';
        progressInfo.innerHTML = `Restoring ${validRecords.length} conversation message(s)...${skipped > 0 ? ` (skipping ${skipped} invalid row(s))` : ''}`;
        responseDiv.innerHTML = '';
        restoreBtn.disabled = true;

        if (window.progressAPI && window.ProgressUtils) {
            window.ProgressUtils.autoWireGlobalProgress();
        } else if (window.progressAPI) {
            window.progressAPI.onUpdateProgress((progress) => {
                if (typeof progress === 'number') {
                    progressBar.style.width = `${progress}%`;
                } else if (progress && typeof progress.value === 'number') {
                    progressBar.style.width = `${Math.round(progress.value * 100)}%`;
                }
            });
        }

        try {
            const result = await window.axios.restoreDeletedConversations({ domain, token, rows: validRecords });
            const success = result?.successful?.length || 0;
            const failed = result?.failed?.length || 0;
            progressBar.style.width = '100%';
            progressInfo.innerHTML = `Done. Restored ${success}, failed ${failed}.${skipped > 0 ? ` Skipped ${skipped}.` : ''}`;
            if (failed > 0) {
                const ul = document.createElement('ul');
                result.failed.slice(0, 50).forEach(f => {
                    const li = document.createElement('li');
                    li.textContent = f.reason || 'Unknown error';
                    ul.appendChild(li);
                });
                responseDiv.append(ul);
            }
        } catch (error) {
            progressBar.parentElement.hidden = true;
            errorHandler(error, progressInfo);
        } finally {
            restoreBtn.disabled = false;
        }
    });
    clearBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        // Reset in-memory records and UI state
        records = [];
        uploadInfo.textContent = '';
        restoreBtn.disabled = true;
        responseDiv.innerHTML = '';
        progressInfo.innerHTML = '';
        progressBar.style.width = '0%';
        progressDiv.hidden = true;
    });
    form.dataset.bound = 'true';
    }
}

async function getDeletedConversations(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let form = eContent.querySelector('#get-deleted-conversations-form');

    if (!form) {
        form = document.createElement('form');
        form.id = 'get-deleted-conversations-form';
        form.innerHTML = `
            <div>
                <h3>Get Deleted Conversations</h3>
                <p>Fetch deleted conversations for a user, optionally filtered by deleted_before/after.</p>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
                    <label for="gdc-user-id" class="form-label">User ID</label>
                </div>
                <div class="col-2">
                    <input id="gdc-user-id" type="text" class="form-control" aria-describedby="gdc-user-help" />
                </div>
                <div class="col-auto">
                    <span id="gdc-user-help" class="form-text" style="display:none;">Must only contain numbers</span>
                </div>
            </div>
        <div class="row align-items-center mt-2">
                <div class="col-auto">
                    <label for="gdc-deleted-after" class="form-label">Deleted After</label>
                </div>
                <div class="col-auto">
            <input id="gdc-deleted-after" type="date" class="form-control" />
                </div>
                <div class="col-auto">
                    <label for="gdc-deleted-before" class="form-label">Deleted Before</label>
                </div>
                <div class="col-auto">
            <input id="gdc-deleted-before" type="date" class="form-control" />
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-auto">
                    <button id="gdc-search" type="button" class="btn btn-primary" disabled>Get Deleted</button>
                </div>
                <div class="col-auto">
                    <button id="gdc-export-csv" type="button" class="btn btn-secondary" hidden>Export to CSV</button>
                </div>
            </div>
            <!-- Single-user progress moved above the divider -->
            <div hidden id="gdc-single-progress-div" class="mt-3">
                <p id="gdc-single-progress-info"></p>
                <div class="progress mt-1" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <hr class="my-3" />
            <div class="row align-items-center">
                <div class="col-auto">
                    <label class="form-label">Bulk: Upload user list (txt/csv)</label>
                </div>
                <div class="col-auto">
                    <button id="gdc-upload" type="button" class="btn btn-secondary">Choose file</button>
                </div>
                <div class="col-auto">
                    <span id="gdc-upload-info" class="form-text"></span>
                </div>
            </div>
            <div class="row mb-3 mt-2">
                <div class="col-12">
                    <label for="gdc-output-path" class="form-label">Output Folder</label>
                    <div class="input-group">
                        <input type="text" id="gdc-output-path" class="form-control" placeholder="Select output folder..." readonly>
                        <button type="button" id="gdc-browse-folder" class="btn btn-outline-secondary">Browse</button>
                    </div>
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-auto">
                    <button id="gdc-export-multi" type="button" class="btn btn-primary" disabled>Export for users</button>
                </div>
            </div>
            <!-- Bulk progress -->
            <div hidden id="gdc-bulk-progress-div" class="mt-3">
                <p id="gdc-bulk-progress-info"></p>
                <div class="progress mt-1" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="gdc-response" class="mt-3"></div>
        `;

        eContent.append(form);
    }
    form.hidden = false;

    const userInput = form.querySelector('#gdc-user-id');
    const searchBtn = form.querySelector('#gdc-search');
    const singleProgressDiv = form.querySelector('#gdc-single-progress-div');
    const singleProgressBar = singleProgressDiv.querySelector('.progress-bar');
    const singleProgressInfo = form.querySelector('#gdc-single-progress-info');
    const bulkProgressDiv = form.querySelector('#gdc-bulk-progress-div');
    const bulkProgressBar = bulkProgressDiv.querySelector('.progress-bar');
    const bulkProgressInfo = form.querySelector('#gdc-bulk-progress-info');
    const responseDiv = form.querySelector('#gdc-response');
    const uploadBtn = form.querySelector('#gdc-upload');
    const uploadInfo = form.querySelector('#gdc-upload-info');
    const browseFolderBtn = form.querySelector('#gdc-browse-folder');
    const outputPathInput = form.querySelector('#gdc-output-path');
    const exportMultiBtn = form.querySelector('#gdc-export-multi');
    let bulkUserIds = [];
    let outputFolder = '';
    const updateExportEnabled = () => {
        exportMultiBtn.disabled = !(bulkUserIds.length > 0 && !!outputFolder);
    };

    const toggleBtn = () => {
        searchBtn.disabled = !(userInput.value && userInput.value.trim() !== '' && !isNaN(Number(userInput.value.trim())));
        form.querySelector('#gdc-user-help').style.display = searchBtn.disabled ? 'inline' : 'none';
    };
    userInput.addEventListener('input', toggleBtn);

    if (form.dataset.bound !== 'true') {
        searchBtn.addEventListener('click', async (evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            searchBtn.disabled = true;
            responseDiv.innerHTML = '';
            singleProgressDiv.hidden = false;
            singleProgressBar.style.width = '0%';
            singleProgressInfo.innerHTML = 'Fetching deleted conversations...';

            const domain = document.querySelector('#domain').value.trim();
            const token = document.querySelector('#token').value.trim();
            const user_id = userInput.value.trim();
            const deleted_after = form.querySelector('#gdc-deleted-after').value.trim();
            const deleted_before = form.querySelector('#gdc-deleted-before').value.trim();

            try {
                const params = { domain, token, user_id };
                const toStartOfDayISO = (dateStr) => dateStr ? new Date(`${dateStr}T00:00:00`).toISOString() : undefined;
                const toEndOfDayISO = (dateStr) => dateStr ? new Date(`${dateStr}T23:59:59.999`).toISOString() : undefined;
                const afterISO = toStartOfDayISO(deleted_after);
                const beforeISO = toEndOfDayISO(deleted_before);
                if (afterISO) params.deleted_after = afterISO;
                if (beforeISO) params.deleted_before = beforeISO;

                const results = await window.axios.getDeletedConversations(params);

                const count = results.length;
                singleProgressInfo.innerHTML = `Found ${count} deleted conversation(s).`;
                singleProgressBar.style.width = '100%';

                if (count > 0) {
                    const exportBtn = form.querySelector('#gdc-export-csv');
                    exportBtn.hidden = false;
                    // exportBtn.id = 'gdc-export-csv';
                    // exportBtn.className = 'btn btn-secondary mt-2';
                    // exportBtn.textContent = 'Export to CSV';
                    // responseDiv.append(exportBtn);

                    exportBtn.addEventListener('click', (e2) => {
                        e2.preventDefault();
                        e2.stopPropagation();
                        const fileName = `deleted_conversations_${user_id}.csv`;

                        // Sanitize each record: keep top-level fields; stringify arrays/objects
                        const sanitized = results.map((item) => {
                            const row = {};
                            for (const key of Object.keys(item)) {
                                const val = item[key];
                                if (key === 'attachments' && Array.isArray(val)) {
                                    // Only include id and url for attachments; join as a semicolon-separated list
                                    const pairs = val.map(att => `${att.id}:${att.url}`).join('; ');
                                    row[key] = pairs;
                                } else if (val !== null && typeof val === 'object') {
                                    // Fallback: stringify objects/arrays
                                    row[key] = JSON.stringify(val);
                                } else {
                                    row[key] = val;
                                }
                            }
                            return row;
                        });

                        // Ensure headers include all keys (Canvas responses should be consistent,
                        // but we build a union just in case). csvExporter uses the first row to build headers.
                        const allKeys = Array.from(new Set(sanitized.flatMap(obj => Object.keys(obj))));
                        if (!allKeys.includes('deleted_at')) allKeys.push('deleted_at');
                        if (sanitized.length > 0) {
                            const first = sanitized[0];
                            const headerCompleteFirst = {};
                            for (const k of allKeys) {
                                headerCompleteFirst[k] = Object.prototype.hasOwnProperty.call(first, k) ? first[k] : '';
                            }
                            const data = [headerCompleteFirst, ...sanitized.slice(1).map(obj => {
                                const full = {};
                                for (const k of allKeys) full[k] = Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : '';
                                return full;
                            })];
                            window.csv.sendToCSV({ fileName, data });
                        }
                    });
                }
            } catch (error) {
                singleProgressBar.parentElement.hidden = true;
                errorHandler(error, singleProgressInfo);
            } finally {
                searchBtn.disabled = false;
            }
        });

        // Handle upload of user list
        uploadBtn.addEventListener('click', async (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            uploadBtn.disabled = true;
            uploadInfo.textContent = '';
            try {
                if (window.fileUpload && typeof window.fileUpload.getUserIdsFromFile === 'function') {
                    const ids = await window.fileUpload.getUserIdsFromFile();
                    if (ids === 'cancelled') {
                        uploadInfo.textContent = 'Cancelled.';
                        return;
                    }
                    // Ensure numeric uniqueness
                    bulkUserIds = Array.from(new Set(ids.map((v) => Number(v)).filter((n) => !isNaN(n))));
                    uploadInfo.textContent = `Found ${bulkUserIds.length} user(s).`;
                    updateExportEnabled();
                } else {
                    // Fallback: client-side file picker and parser (txt/csv)
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.txt,.csv,text/plain,text/csv';
                    input.onchange = async () => {
                        try {
                            const file = input.files && input.files[0];
                            if (!file) return;
                            const text = await file.text();
                            const tokens = text.split(/\r?\n|\r|,|\s+/).filter(Boolean);
                            const numeric = tokens.map((v) => Number(v)).filter((n) => !isNaN(n));
                            bulkUserIds = Array.from(new Set(numeric));
                            uploadInfo.textContent = `Found ${bulkUserIds.length} user(s).`;
                            updateExportEnabled();
                        } catch (err) {
                            errorHandler(err, uploadInfo);
                        }
                    };
                    input.click();
                }
            } catch (error) {
                errorHandler(error, uploadInfo);
            } finally {
                uploadBtn.disabled = false;
            }
        });

        // Choose output folder for bulk exports
        browseFolderBtn.addEventListener('click', async (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            try {
                const selected = await window.electronAPI.selectFolder();
                if (selected) {
                    outputFolder = selected;
                    outputPathInput.value = outputFolder;
                    // Enable export only if we have users and a folder
                    updateExportEnabled();
                }
            } catch (error) {
                errorHandler(error, outputPathInput);
            }
        });

        // Bulk export per user
        exportMultiBtn.addEventListener('click', async (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            if (bulkUserIds.length === 0) return;
            if (!outputFolder) {
                bulkProgressDiv.hidden = false;
                bulkProgressInfo.textContent = 'Please choose an output folder first.';
                return;
            }

            exportMultiBtn.disabled = true;
            bulkProgressDiv.hidden = false;
            bulkProgressBar.style.width = '0%';
            bulkProgressInfo.innerHTML = `Exporting for ${bulkUserIds.length} user(s)...`;

            const domain = document.querySelector('#domain').value.trim();
            const token = document.querySelector('#token').value.trim();
            const deleted_after = form.querySelector('#gdc-deleted-after').value.trim();
            const deleted_before = form.querySelector('#gdc-deleted-before').value.trim();

            const toStartOfDayISO = (dateStr) => dateStr ? new Date(`${dateStr}T00:00:00`).toISOString() : undefined;
            const toEndOfDayISO = (dateStr) => dateStr ? new Date(`${dateStr}T23:59:59.999`).toISOString() : undefined;

            let completed = 0;
            let exported = 0;
            let skipped = 0;

            for (const uid of bulkUserIds) {
                try {
                    const params = { domain, token, user_id: String(uid) };
                    const afterISO = toStartOfDayISO(deleted_after);
                    const beforeISO = toEndOfDayISO(deleted_before);
                    if (afterISO) params.deleted_after = afterISO;
                    if (beforeISO) params.deleted_before = beforeISO;

                    const results = await window.axios.getDeletedConversations(params);

                    if (results.length > 0) {
                        // Sanitize rows (attachments handled, JSON stringify objects)
                        const sanitized = results.map((item) => {
                            const row = {};
                            for (const key of Object.keys(item)) {
                                const val = item[key];
                                if (key === 'attachments' && Array.isArray(val)) {
                                    const pairs = val.map(att => `${att.id}:${att.url}`).join('; ');
                                    row[key] = pairs;
                                } else if (val !== null && typeof val === 'object') {
                                    row[key] = JSON.stringify(val);
                                } else {
                                    row[key] = val;
                                }
                            }
                            return row;
                        });

                        // Build union-of-keys for header consistency per file
                        const allKeys = Array.from(new Set(sanitized.flatMap(obj => Object.keys(obj))));
                        if (!allKeys.includes('deleted_at')) allKeys.push('deleted_at');
                        const first = sanitized[0];
                        const headerCompleteFirst = {};
                        for (const k of allKeys) headerCompleteFirst[k] = Object.prototype.hasOwnProperty.call(first, k) ? first[k] : '';
                        const data = [headerCompleteFirst, ...sanitized.slice(1).map(obj => {
                            const full = {};
                            for (const k of allKeys) full[k] = Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : '';
                            return full;
                        })];

                        const fileName = `deleted_conversations_${uid}.csv`;
                        const fullPath = `${outputFolder.replace(/[\\/]+$/, '')}\\${fileName}`;
                        await window.csv.writeAtPath(fullPath, data);
                        exported++;
                    } else {
                        skipped++;
                    }
                } catch (err) {
                    // count as skipped on error
                    skipped++;
                } finally {
                    completed++;
                    const pct = Math.round((completed / bulkUserIds.length) * 100);
                    bulkProgressBar.style.width = `${pct}%`;
                    bulkProgressInfo.innerHTML = `Processed ${completed}/${bulkUserIds.length}. Exported: ${exported}. Skipped: ${skipped}.`;
                }
            }

            exportMultiBtn.disabled = false;
        });
        form.dataset.bound = 'true';
    }
}

async function deleteConvos(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let deleteSpecificConversationsForm = eContent.querySelector('#delete-conversation-form');

    if (!deleteSpecificConversationsForm) {
        deleteSpecificConversationsForm = document.createElement('form');
        deleteSpecificConversationsForm.id = 'delete-conversation-form';

        // eContent.innerHTML = `
        //     <div>
        //         <h3>Delete Specific Conversations</h3>
        //     </div>
        // `;

        // const eForm = document.createElement('form');
        deleteSpecificConversationsForm.innerHTML = `
            <div>
                <h3>Delete Specific Conversations</h3>
            </div>
                <div class="row">
                    <div class="col-auto">
                        <label for="input-checker" class="form-label">User ID who sent the message</label>
                    </div>
                    <div class="w-100"></div>
                    <div class="col-2">
                        <input type="text" id="user-id" class="form-control">
                    </div>
                    <div class="col-auto">
                        <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                    </div>
                </div>
                </div>
            <div class="row mt-3">
                <div class="col-auto">
                    <label for="conversation-subject" class="form-label">Message Subject</label>
                </div>
                <div class="w-100"></div>
                <div class="col-6">
                    <input id="conversation-subject" type="text" class="form-control" aria-describedby="messageHelper">
                    <div id="messageHelper" class="form-text">
                        <span>NOTE: This is case sensative and must match exactly</span>
                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-primary mt-3" id="action-btn" disabled>Search</button>
            <div hidden id="progress-div">
                <p id="progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="response-container" class="mt-5"></div>`

        eContent.append(deleteSpecificConversationsForm);
    }
    deleteSpecificConversationsForm.hidden = false;

    const uID = deleteSpecificConversationsForm.querySelector('#user-id');
    uID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        checkCourseID(uID, deleteSpecificConversationsForm);
    })

    // 1. Get messages
    // 2. Filter messages
    // 3. Delete messaages ( or cancel )
    // 4. If filter more go back to 2


    // ************************************
    // starting step 1. Getting messages
    //
    // ************************************

    const searchBtn = deleteSpecificConversationsForm.querySelector('#action-btn');
    searchBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        searchBtn.disabled = true;


        const domain = document.querySelector('#domain').value.trim();
        const apiToken = document.querySelector('#token').value.trim();
        const convoSubject = deleteSpecificConversationsForm.querySelector('#conversation-subject');
        const userID = uID.value.trim();
        const responseContainer = deleteSpecificConversationsForm.querySelector('#response-container');
        const progressDiv = deleteSpecificConversationsForm.querySelector('#progress-div');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressInfo = deleteSpecificConversationsForm.querySelector('#progress-info');

        progressBar.parentElement.hidden = true;
        progressBar.style.width = '0%';
        progressDiv.hidden = false;

        // console.log(`Subject: ${convoSubject.value}, User_ID: ${userID.value}`);

        // const responseContainer = document.querySelector('#response-container');
        // responseContainer.innerHTML = 'Searching....';

        const searchData = {
            domain: domain,
            token: apiToken,
            subject: convoSubject.value,
            user_id: userID
        };

        console.log(searchData);

        let messages
        let hasError = false;
        try {
            progressInfo.innerHTML = 'Searching....';
            messages = await window.axios.getConvos(searchData);
        } catch (error) {
            hasError = true;
            errorHandler(error, progressInfo);
        } finally {
            searchBtn.disabled = false;
            progressInfo.innerHTML = `Done. Found ${messages.length} conversations.`
        }

        // if (!messages) {
        //     //alert('Query failed, check domain, token or user id.');

        //     searchBtn.disabled = false;
        //     responseContainer.innerHTML = 'Search Failed. Check domain, token or user id.';
        // } else {
        if (!hasError) {

            // ********************************
            // Step 2. Filtering messages
            //
            // ********************************

            // const filteredMessages = filterMessages(messages, convoSubject.value);
            // const flattenedMessages = flattenMessages(filteredMessages);

            //     responseContainer.innerHTML = `
            // <div id="response-info" class="container">Total messages searched: ${messages.length}. Found ${filteredMessages.length}.
            //     <div class="row justify-content-start my-2">
            //         <div id="response-details" class="col-auto">
            //         </div>
            //     </div>
            //     <div class="row justify-content-start my-2">
            //         <div class="col-2">
            //             <button id="remove-btn" type="button" class="btn btn-danger">Remove</button>
            //         </div>
            //         <div class="col-2">
            //             <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
            //         </div>
            //         <div class="col-3">
            //             <button id="csv-btn" type="button" class="btn btn-secondary">Send to CSV</button>
            //         </div>
            //     </div>
            // </div>`

            responseContainer.innerHTML = `
                <div>
                    <div class="row align-items-start">
                        <div id="response-details" class="col-auto">
                        </div>

                        <div class="w-100"></div>

                        <div class="col-2">
                            <button id="remove-btn" type="button" class="btn btn-danger">Remove</button>
                        </div>
                        <div class="col-2">
                            <button id="cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
                        </div>
                        <div class="col-3">
                            <button id="csv-btn" type="button" class="btn btn-secondary" aria-describedby="sendcsv-check">Send to CSV</button>
                            <div id="sendcsv-check" class="form-text">
                                NOTE: This only sends the message subject and conversation ID to the csv
                            </div>
                        </div>
                    </div>
                </div>
            `;


            const removeBtn = responseContainer.querySelector('#remove-btn');
            const cancelBtn = responseContainer.querySelector('#cancel-btn');
            const sendToCSV = responseContainer.querySelector('#csv-btn');

            // Remove selected conversations by subject
            removeBtn.addEventListener('click', async (evt) => {
                evt.preventDefault();
                evt.stopPropagation();

                progressDiv.hidden = false;
                progressBar.parentElement.hidden = false;
                progressBar.style.width = '0%';
                progressInfo.innerHTML = 'Removing conversations...';

                const messageData = {
                    domain,
                    token: apiToken,
                    messages
                };

                if (window.progressAPI && window.ProgressUtils) {
                    window.ProgressUtils.autoWireGlobalProgress();
                } else if (window.progressAPI) {
                    window.progressAPI.onUpdateProgress((progress) => {
                        progressBar.style.width = `${progress}%`;
                    });
                }

                try {
                    const result = await window.axios.deleteConvos(messageData);
                    if (result.successful.length > 0) {
                        progressInfo.innerHTML += `<p>Successfully removed ${result.successful.length} messages</p>`;
                    }
                    if (result.failed.length > 0) {
                        progressBar.parentElement.hidden = true;
                        progressInfo.innerHTML += `Failed to remove ${result.failed.length} messages`;
                        errorHandler({ message: `${result.failed[0].reason}` }, progressInfo);
                    }
                } catch (error) {
                    errorHandler(error, progressInfo);
                }
            });

            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // clearData(userID, convoSubject, responseContainer, searchBtn);
                uID.value = '';
                convoSubject.value = '';
                progressInfo.innerHTML = '';
                responseContainer.innerHTML = '';
                searchBtn.disabled = true;
                progressDiv.hidden = true;
            });

            sendToCSV.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('inside sendTocCSV');
                //console.log(filteredMessages);

                const csvData = {
                    fileName: 'exported_convos.csv',
                    data: messages
                };

                window.csv.sendToCSV(csvData);
            })
        }
    });
}

async function downloadConvos(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let downloadConversationsForm = eContent.querySelector('#download-conversations-form');

    if (!downloadConversationsForm) {
        downloadConversationsForm = document.createElement('form');
        downloadConversationsForm.id = 'download-conversations-form';

        // const domain = document.querySelector('#domain');
        // const apiToken = document.querySelector('#token');
        // const eHeader = document.createElement('div');
        // eHeader.innerHTML = `<h3>${e.target.id}</h3>`;
        // eContent.append(eHeader);
        // eContent.innerHTML = `
        //     <div>
        //         <h3>Download Converations to CSV</h3>
        //     </div>
        // `;

        // const eForm = document.createElement('form');
        downloadConversationsForm.innerHTML = `
            <div>
                <h3>Download Conversations to CSV</h3>
            </div>
                <div class="row">
                    <div class="col-auto">
                        <label for="user-id" class="form-label">Canvas user ID</label>
                    </div>
                    <div class="col-2">
                        <input type="text" id="user-id" class="form-control" aria-desribedby="userChecker">
                    </div>
                    <div class="col-auto">
                        <span id="userChecker" class="form-text" style="display: none;">Must only contain numbers</span>
                    </div>
                </div>
                <div class="row align-items-center">
                    <div class="col-auto form-check form-switch mt-2 ms-3 mb-2">
                        <input id="delete-convos" class="form-check-input" type="checkbox" role="switch" />
                        <label for="deleted-convos" class="form-check-label">Only search for <em>Deleted</em> Conversations</label>
                            <div id="graded-help" class="form-text">
                                (otherwise this will search for active and deleted)
                            </div>
                    </div>
                    <div class="w-100"></div>
                    <div class="col-auto">
                        <label for="start-date" class="form-label">Start</label>
                    </div>
                    <div class="col-auto">
                        <input id="start-date" type="date" class="form-control">
                    </div>
                    <div class="col-auto">
                        <label for="end-date" class="form-label">End</label>
                    </div>
                    <div class="col-auto">
                        <input id="end-date" type="date" class="form-control">
                    </div>
                    <div class="w-100"></div>
                    <div class="col-auto">
                        <button type="button" class="btn btn-primary mt-3" id="convo-search">Search</button>
                    </div>
                </div>
            <div id="response-container" class="mt-5"></div>`

        eContent.append(downloadConversationsForm);
    }
    downloadConversationsForm.hidden = false;
}

// creates a new conversation object simplified to basic data
// to write to a csv before deletion
function flattenMessages(conversations) {
    const flattened = [];
    for (const conversation of conversations) {
        flattened.push({
            id: conversation.id,
            subject: conversation.subject,
            workflow_state: conversation.workflow_state,
            last_message: conversation.last_message,
            last_message_at: conversation.last_message_at,
            message_count: conversation.message_count
        });
    }
    return flattened;
}

// ********************************
// currently not implemented
// ********************************

// Gets the conversations between 2 users
async function getConvos(e) {
    const domain = document.querySelector('#domain');
    const apiToken = document.querySelector('#token');

    // const eHeader = document.createElement('div');
    // eHeader.classList.add('row');
    // eHeader.innerHTML = `
    //     <div class="col border-bottom">
    //         <h3>Get Conversations Between Two Users</h3>
    //     </div>
    // </div>`

    const eContent = document.querySelector('#endpoint-content');
    // eContent.append(eHeader);
    eContent.innerHTML = `
        <div>
            <h3>Get Conversations Between Two Users</h3>
        </div>
    `;

    const eForm = document.createElement('form');
    eForm.classList.add('row', 'mt-3');
    eForm.innerHTML = `
        <div class="col-2">
            <label for="user-1" class="form-label">First user</label>
        </div>
        <div class="col-2">
            <input type="text" id="user-1" class="form-control" aria-describedby="user-1-help">
        </div>
        <div class="col-8">
            <span id="user-1-help" class="form-text">Enter Canvas user_ID</span>
        </div>
        <div class="row mt-3">
            <div class="col-2">
                <label for="user-2" class="form-label">Second user</label>
            </div>
            <div class="col-2">
                <input type="text" id="user-2" class="form-control" aria-describedby="user-2-help">
            </div>
            <div class="col-8">
                <span id="user-2-help" class="form-text">Enter Canvas user_ID</span>
            </div>
        </div>
        <div class="col-12 mt-3">
            <div class="form-check form-switch">
                <label for="include-deletes" class="form-check-label">Include Deleted Messages</label>
                <input class="form-check-input" type="checkbox" value="" id="include-deletes">
            </div>
        </div>
        <div class="col-10 mt-3">
            <button type="submit" class="btn btn-primary">Search</button>
        </div>
    `
    eContent.append(eForm);

}

function clearData(userID, convoSubject, responseContainer, searchBtn) {
    userID.value = '';
    convoSubject.value = '';
    responseContainer.innerHTML = '';
    searchBtn.disabled = false;

}

function getMessages(searchData) {
    // const qResults = window.axios.getConvos(JSON.stringify(searchData));
    // console.log(qResults.length);
    const qResults = window.axios.getConvos(searchData);

    return qResults;
}

function filterMessages(messages, myFilter) {
    console.log('filtering converations by ', myFilter);
    let counter = 1;
    filteredConversations = messages.filter((conversation) => {
        if (counter % 100 === 0)
            console.log('Done with ', counter);
        // console.log('looking at: ', conversation.id, conversation.subject);
        if (conversation.subject === myFilter) {
            console.log('conversation found', conversation.id)
            return conversation;
        }
        counter++;
    });

    return filteredConversations;
}