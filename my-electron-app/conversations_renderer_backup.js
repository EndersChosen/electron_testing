// ****************************************
// Conversation UI dispatcher
// ****************************************
async function conversationTemplate(e) {
    switch (e.target.id) {
        case 'delete-conversations-subject':
            return deleteConvos(e);
        case 'download-conversations-csv': // Not Complete
            return downloadConvos(e);
        case 'get-deleted-conversations':
            return getDeletedConversations(e);
        case 'restore-deleted-conversations':
            return restoreDeletedConversations(e);
        default:
            return;
    }
}

// ****************************************
// Restore Deleted Conversations
// - CSV/ZIP input
// - Robust CSV parser (quoted newlines, escaped quotes)
// - Progress and capped inline errors
// - Full error log written next to source upload
// ****************************************
async function restoreDeletedConversations(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let form = eContent.querySelector('#restore-deleted-conversations-form');

    if (!form) {
        form = document.createElement('form');
        form.id = 'restore-deleted-conversations-form';
        form.innerHTML = `
            <div>
                <h3>Restore Deleted Conversations</h3>
            </div>
            <div class="row align-items-center mt-2">
                <div class="col-auto">
                    <button id="rdc-upload" type="button" class="btn btn-secondary">Choose CSV or ZIP</button>
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

    // Robust CSV parser that respects quoted fields with embedded newlines
    function parseCSV(text) {
        const rows = [];
        let row = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === '\r') continue; // normalize CRLF to LF handling
            if (ch === '"') {
                if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (ch === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else if (ch === '\n' && !inQuotes) {
                row.push(current.trim());
                rows.push(row);
                row = [];
                current = '';
            } else {
                current += ch;
            }
        }
        if (current.length > 0 || row.length > 0) {
            row.push(current.trim());
            rows.push(row);
        }
        return rows;
    }

    function normalizeHeader(h) {
        return (h || '')
            .replace(/^\uFEFF/, '')
            .toLowerCase()
            .replace(/\s+/g, '_');
    }

    function parseDeletedConvosCSV(text) {
        const rows = parseCSV(text).filter(r => r && r.length > 0);
        if (rows.length === 0) return [];
        const headers = rows[0].map(normalizeHeader);
        const idx = {
            user_id: headers.indexOf('user_id'),
            message_id: (() => {
                const i = headers.indexOf('id');
                if (i !== -1) return i;
                return headers.indexOf('message_id');
            })(),
            conversation_id: headers.indexOf('conversation_id')
        };
        if (idx.user_id === -1 || idx.message_id === -1 || idx.conversation_id === -1) {
            throw new Error(`CSV must include headers: user_id, id (or message_id), conversation_id. Found: ${headers.join(', ')}`);
        }
        function parseCanvasId(val) {
            if (val === null || val === undefined) return null;
            let s = String(val).trim();
            if (s === '') return null;
            s = s.replace(/,/g, '');
            if (/^[+-]?\d+$/.test(s)) {
                try { return String(BigInt(s)); } catch { return s.replace(/^\+/, ''); }
            }
            if (/^[+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(s)) {
                const n = Number(s);
                if (Number.isFinite(n)) return String(Math.trunc(n));
            }
            return null;
        }
        const out = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.every(cell => String(cell || '').trim() === '')) continue;
            const user_id = parseCanvasId(row[idx.user_id]);
            const message_id = parseCanvasId(row[idx.message_id]);
            const conversation_id = parseCanvasId(row[idx.conversation_id]);
            if (user_id && message_id && conversation_id) out.push({ user_id, message_id, conversation_id });
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
                const fullPath = await (window.fileUpload?.pickCsvOrZip?.());
                if (!fullPath) { uploadBtn.disabled = false; return; }
                const fileName = fullPath.split(/[\\\/]/).pop();
                const dirPath = fullPath.slice(0, fullPath.length - fileName.length).replace(/[\\\/]+$/, '');
                const lower = (fileName || '').toLowerCase();
                if (lower.endsWith('.zip')) {
                    if (!window.JSZip) throw new Error('JSZip not available in renderer.');
                    const buf = await window.fileUpload.readFileBuffer(fullPath);
                    const zip = await window.JSZip.loadAsync(buf);
                    const csvFiles = Object.keys(zip.files).filter(n => n.toLowerCase().endsWith('.csv'));
                    if (csvFiles.length === 0) throw new Error('Zip contains no CSV files.');
                    let processed = 0;
                    const total = csvFiles.length;
                    uploadInfo.textContent = `Processed 0/${total} files`;
                    for (const name of csvFiles) {
                        const entry = zip.files[name];
                        const content = await entry.async('string');
                        const rows = parseDeletedConvosCSV(content);
                        if (rows.length > 0) records.push(...rows);
                        processed++;
                        uploadInfo.textContent = `Processed ${processed}/${total} files`;
                    }
                    uploadInfo.textContent = `Processed ${total}/${total} files`;
                } else {
                    const text = await window.fileUpload.readFile(fullPath);
                    records = parseDeletedConvosCSV(text);
                    uploadInfo.textContent = `Ready: ${fileName}`;
                }
                form.dataset.sourceDir = dirPath;
                form.dataset.sourceName = fileName;
                restoreBtn.disabled = records.length === 0;
            } catch (error) {
                errorHandler(error, uploadInfo);
            } finally {
                uploadBtn.disabled = false;
            }
        });

        restoreBtn.addEventListener('click', async (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            if (records.length === 0) return;

            const domain = document.querySelector('#domain').value.trim();
            const token = document.querySelector('#token').value.trim();

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
                    result.failed.slice(0, 5).forEach(f => {
                        const li = document.createElement('li');
                        li.textContent = f.reason || 'Unknown error';
                        ul.appendChild(li);
                    });
                    responseDiv.append(ul);
                    if (result.failed.length > 5) {
                        const dirPath = form.dataset.sourceDir || '';
                        const baseName = form.dataset.sourceName || 'restore_upload.csv';
                        if (dirPath && window.fileUpload?.writeErrorsFile) {
                            try {
                                const outPath = await window.fileUpload.writeErrorsFile(dirPath, baseName, result.failed);
                                const p = document.createElement('p');
                                p.textContent = `Full error list written to: ${outPath}`;
                                responseDiv.append(p);
                            } catch (e) {
                                const p = document.createElement('p');
                                p.textContent = `Failed to write errors file: ${e?.message || e}`;
                                responseDiv.append(p);
                            }
                        }
                    }
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
            records = [];
            uploadInfo.textContent = '';
            restoreBtn.disabled = true;
            responseDiv.innerHTML = '';
            progressInfo.innerHTML = '';
            progressBar.style.width = '0%';
            progressDiv.hidden = true;
            delete form.dataset.sourceDir;
            delete form.dataset.sourceName;
        });
        form.dataset.bound = 'true';
    }
}

// ****************************************
// Get Deleted Conversations (search + CSV export)
// ****************************************
async function getDeletedConversations(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let form = eContent.querySelector('#get-deleted-conversations-form');

    if (!form) {
        // ****************************************
        // Delete Conversations (temporarily disabled)
        // ****************************************
        async function deleteConvos(e) {
            hideEndpoints(e);
            const eContent = document.querySelector('#endpoint-content');
            eContent.innerHTML = `
                <div>
                    <h3>Delete Specific Conversations</h3>
                    <p class="text-muted">This tool is temporarily disabled in this build.</p>
                </div>
            `;
        }
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
        uploadBtn.addEventListener('click', async (evt) => {
        e.preventDefault();
        e.stopPropagation();
        checkCourseID(uID, deleteSpecificConversationsForm);
    })

    // 1. Get messages
                const fullPath = await (window.fileUpload?.pickCsvOrZip?.());
                if (!fullPath) { uploadBtn.disabled = false; return; }
                const fileName = fullPath.split(/[\\/]/).pop();
                const dirPath = fullPath.slice(0, fullPath.length - fileName.length).replace(/[\\/]+$/, '');
                const lower = (fileName || '').toLowerCase();
                if (lower.endsWith('.zip')) {
                    if (!window.JSZip) throw new Error('JSZip not available in renderer.');
                    const buf = await window.fileUpload.readFileBuffer(fullPath);
                    const zip = await window.JSZip.loadAsync(buf);
                    const csvFiles = Object.keys(zip.files).filter(n => n.toLowerCase().endsWith('.csv'));
                    if (csvFiles.length === 0) throw new Error('Zip contains no CSV files.');
                    let processed = 0;
                    const total = csvFiles.length;
                    uploadInfo.textContent = `Processed 0/${total} files`;
                    for (const name of csvFiles) {
                        const entry = zip.files[name];
                        const content = await entry.async('string');
                        const rows = parseDeletedConvosCSV(content);
                        if (rows.length > 0) records.push(...rows);
                        processed++;
                        uploadInfo.textContent = `Processed ${processed}/${total} files`;
                    }
                    uploadInfo.textContent = `Processed ${total}/${total} files`;
                    form.dataset.sourceDir = dirPath;
                    form.dataset.sourceName = fileName;
                    restoreBtn.disabled = records.length === 0;
                } else {
                    const text = await window.fileUpload.readFile(fullPath);
                    records = parseDeletedConvosCSV(text);
                    form.dataset.sourceDir = dirPath;
                    form.dataset.sourceName = fileName;
                    uploadInfo.textContent = `Ready: ${fileName}`;
                    restoreBtn.disabled = records.length === 0;
                }
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