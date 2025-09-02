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
        case 'restore-deleted-conversations':
            restoreDeletedConversations(e);
            break;
        case 'gc-between-users': // Not complete
            getConvos(e);
            break;
        default:
            break;
    }
};

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

    async function parseDeletedConvosCSV(text, sourceFileName = '') {
        // For very large files, show progress
        const isLargeFile = text.length > 5000000; // ~5MB threshold
        if (isLargeFile) {
            console.log(`Processing large CSV file: ${sourceFileName} (${Math.round(text.length / 1024 / 1024)}MB)`);
        }

        const rows = parseCSV(text).filter(r => r && r.length > 0);
        if (rows.length === 0) return [];

        if (isLargeFile) {
            console.log(`Parsed ${rows.length} rows from large file: ${sourceFileName}`);
        }

        const headers = rows[0].map(normalizeHeader);
        const idx = {
            user_id: headers.indexOf('user_id'),
            message_id: headers.indexOf('id'),
            conversation_id: headers.indexOf('conversation_id')
        };
        if (idx.user_id === -1 || idx.message_id === -1 || idx.conversation_id === -1) {
            throw new Error(`CSV must include headers: user_id, id, conversation_id. Found: ${headers.join(', ')}`);
        }

        // Debug: Show which column indexes we found
        console.log(`Column indexes detected: user_id=${idx.user_id}, message_id=${idx.message_id}, conversation_id=${idx.conversation_id}`);
        console.log(`Headers: ${headers.join(', ')}`);

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
        const totalRows = rows.length - 1; // Excluding header

        // Process rows in chunks for large files to avoid blocking UI
        const chunkSize = isLargeFile ? 1000 : totalRows;

        for (let startIdx = 1; startIdx <= totalRows; startIdx += chunkSize) {
            const endIdx = Math.min(startIdx + chunkSize, totalRows + 1);

            for (let i = startIdx; i < endIdx; i++) {
                const row = rows[i];
                if (!row || row.every(cell => String(cell || '').trim() === '')) continue;
                const user_id = parseCanvasId(row[idx.user_id]);
                const message_id = parseCanvasId(row[idx.message_id]);
                const conversation_id = parseCanvasId(row[idx.conversation_id]);

                // Only log for smaller files or periodically for large files
                if (!isLargeFile || i % 10000 === 1) {
                    console.log(`Row ${i}: user_id="${row[idx.user_id]}" -> ${user_id}, message_id="${row[idx.message_id]}" -> ${message_id}, conversation_id="${row[idx.conversation_id]}" -> ${conversation_id}`);
                }

                // Always add the record, even if some fields are missing
                out.push({
                    user_id: user_id,
                    message_id: message_id,
                    conversation_id: conversation_id,
                    _rawRow: {
                        user_id: row[idx.user_id],
                        message_id: row[idx.message_id],
                        conversation_id: row[idx.conversation_id]
                    },
                    _rowNumber: i
                });
            }

            // For large files, yield control periodically to prevent UI freezing
            if (isLargeFile && startIdx + chunkSize <= totalRows) {
                await new Promise(resolve => setTimeout(resolve, 5));
                console.log(`Processed ${Math.min(endIdx - 1, totalRows)} of ${totalRows} rows in ${sourceFileName}`);
            }
        }

        if (isLargeFile) {
            console.log(`Completed processing ${sourceFileName}: ${out.length} valid records`);
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
                    let totalRecordsLoaded = 0;

                    uploadInfo.textContent = `Processing 0/${total} files...`;

                    // Process files one at a time to avoid call stack issues
                    for (const name of csvFiles) {
                        try {
                            const entry = zip.files[name];
                            const content = await entry.async('string');
                            const rows = await parseDeletedConvosCSV(content, name);

                            if (rows.length > 0) {
                                // Add source file information to each record
                                const rowsWithSource = rows.map(row => ({
                                    ...row,
                                    _sourceFile: name
                                }));
                                records.push(...rowsWithSource);
                                totalRecordsLoaded += rows.length;
                            }

                            processed++;
                            uploadInfo.textContent = `Processing ${processed}/${total} files (${rows.length} records from ${name})`;

                            // Give the UI a chance to update after each file
                            await new Promise(resolve => setTimeout(resolve, 1));
                        } catch (error) {
                            console.error(`Error processing file ${name}:`, error);
                            processed++;
                            uploadInfo.textContent = `Processing ${processed}/${total} files (ERROR in ${name})`;
                        }
                    }

                    uploadInfo.textContent = `Completed ${total}/${total} files. Removing duplicates from ${totalRecordsLoaded} records...`;

                    // Use a more memory-efficient approach for very large datasets
                    const seenMap = new Map();
                    const originalCount = records.length;
                    const uniqueRecords = [];

                    // Process in chunks to avoid blocking UI with massive datasets
                    const chunkSize = 10000;
                    for (let i = 0; i < records.length; i += chunkSize) {
                        const chunk = records.slice(i, i + chunkSize);

                        for (const record of chunk) {
                            const key = `${record.message_id}-${record.user_id}`;
                            if (!seenMap.has(key)) {
                                seenMap.set(key, true);
                                uniqueRecords.push(record);
                            }
                        }

                        // Update progress for large datasets
                        if (records.length > 50000 && i % (chunkSize * 5) === 0) {
                            const progress = Math.round((i / records.length) * 100);
                            uploadInfo.textContent = `Removing duplicates... ${progress}% (${uniqueRecords.length} unique so far)`;
                            await new Promise(resolve => setTimeout(resolve, 1));
                        }
                    }

                    records = uniqueRecords;
                    const duplicatesRemoved = originalCount - records.length;

                    uploadInfo.textContent = `Completed! Processed ${total} files, loaded ${totalRecordsLoaded} records, ${duplicatesRemoved} duplicates removed. ${records.length} unique records ready.`;
                } else {
                    const text = await window.fileUpload.readFile(fullPath);
                    records = await parseDeletedConvosCSV(text);
                    uploadInfo.textContent = `Ready: ${fileName}`;
                }
                form.dataset.sourceDir = dirPath;
                form.dataset.sourceName = fileName;
                restoreBtn.disabled = records.length === 0;

                // Show summary of loaded records
                if (records.length > 0) {
                    uploadInfo.textContent += ` - Ready to restore ${records.length} conversation messages.`;
                }
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
            const validRecords = [];
            const invalidRecords = [];
            const missingFieldRecords = [];

            // Enhanced validation with detailed logging
            records.forEach((r, index) => {
                const userIdValid = r.user_id && isNum(r.user_id);
                const messageIdValid = r.message_id && isNum(r.message_id);
                const conversationIdValid = r.conversation_id && isNum(r.conversation_id);

                // Check for missing fields first
                const missingFields = [];
                if (!r.user_id) missingFields.push('user_id');
                if (!r.message_id) missingFields.push('id');
                if (!r.conversation_id) missingFields.push('conversation_id');

                if (missingFields.length > 0) {
                    missingFieldRecords.push({
                        index: index + 1,
                        record: r,
                        rowNumber: r._rowNumber,
                        sourceFile: r._sourceFile,
                        missingFields: missingFields,
                        rawValues: r._rawRow
                    });
                } else if (userIdValid && messageIdValid && conversationIdValid) {
                    validRecords.push(r);
                } else {
                    invalidRecords.push({
                        index: index + 1,
                        record: r,
                        rowNumber: r._rowNumber,
                        sourceFile: r._sourceFile,
                        issues: {
                            user_id: !userIdValid ? r.user_id : null,
                            message_id: !messageIdValid ? r.message_id : null,
                            conversation_id: !conversationIdValid ? r.conversation_id : null
                        }
                    });
                }
            });

            const skipped = invalidRecords.length + missingFieldRecords.length;

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
                console.log(`Sending ${validRecords.length} records to API with throttling protection...`);

                // Implement Canvas API throttling protection
                // Canvas allows ~700 requests per 10-minute window
                // We'll batch requests and add delays to stay under limits
                const batchSize = 50; // Smaller batches to avoid overwhelming the API
                const delayBetweenBatches = 2000; // 2 second delay between batches
                const maxRetries = 3;

                let allSuccessful = [];
                let allFailed = []; // Start with empty array, we'll add validation failures later
                let totalProcessed = 0;

                // Process records in small batches with throttling
                for (let i = 0; i < validRecords.length; i += batchSize) {
                    const batch = validRecords.slice(i, i + batchSize);
                    const batchNumber = Math.floor(i / batchSize) + 1;
                    const totalBatches = Math.ceil(validRecords.length / batchSize);

                    progressInfo.innerHTML = `Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`;
                    progressBar.style.width = `${Math.round((i / validRecords.length) * 100)}%`;

                    let retryCount = 0;
                    let batchResult = null;

                    // Retry logic for API failures
                    while (retryCount <= maxRetries && !batchResult) {
                        try {
                            if (retryCount > 0) {
                                const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                                progressInfo.innerHTML = `Retrying batch ${batchNumber}/${totalBatches} (attempt ${retryCount + 1}/${maxRetries + 1}) - waiting ${retryDelay / 1000}s...`;
                                await new Promise(resolve => setTimeout(resolve, retryDelay));
                            }

                            batchResult = await window.axios.restoreDeletedConversations({
                                domain,
                                token,
                                rows: batch
                            });

                            // Success - add to results
                            if (batchResult?.successful) allSuccessful.push(...batchResult.successful);
                            if (batchResult?.failed) allFailed.push(...batchResult.failed);

                        } catch (error) {
                            retryCount++;
                            console.log(`Batch ${batchNumber} attempt ${retryCount} failed:`, error);

                            // Check if it's a rate limiting error (Canvas returns 403 for rate limits)
                            if (error.message && (
                                error.message.includes('403') ||
                                error.message.includes('Rate Limit Exceeded') ||
                                error.message.includes('Forbidden') ||
                                error.message.includes('rate limit') ||
                                error.message.includes('throttle') ||
                                error.status === 403 ||
                                error.response?.status === 403
                            )) {
                                const throttleDelay = 60000; // Wait 1 minute for rate limit
                                progressInfo.innerHTML = `Rate limited (403 Forbidden) - waiting ${throttleDelay / 1000}s before retry...`;
                                await new Promise(resolve => setTimeout(resolve, throttleDelay));
                            }

                            if (retryCount > maxRetries) {
                                // Mark all records in this batch as failed
                                batch.forEach(record => {
                                    allFailed.push({
                                        message_id: record.message_id,
                                        user_id: record.user_id,
                                        conversation_id: record.conversation_id,
                                        source_file: record._sourceFile || 'Unknown',
                                        reason: `API error after ${maxRetries} retries: ${error.message || 'Unknown error'}`
                                    });
                                });
                            }
                        }
                    }

                    totalProcessed += batch.length;

                    // Add delay between batches to respect rate limits (except for last batch)
                    if (i + batchSize < validRecords.length) {
                        progressInfo.innerHTML = `Completed batch ${batchNumber}/${totalBatches}. Waiting ${delayBetweenBatches / 1000}s before next batch...`;
                        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                    }
                }

                // Create result object in expected format
                const result = {
                    successful: allSuccessful,
                    failed: allFailed.filter(f => !f.source_file || f.source_file === 'Unknown' ? !f.reason?.includes('Missing required fields') && !f.reason?.includes('Invalid values') : true)
                };

                const success = result?.successful?.length || 0;
                const failed = result?.failed?.length || 0;
                const totalReturned = success + failed;
                const missing = validRecords.length - totalReturned;

                // Create synthetic failed records for any still missing ones (shouldn't happen with new approach)
                const silentlyFailed = [];
                if (missing > 0) {
                    // Get the IDs of successful records to identify which ones are missing
                    const successfulIds = new Set();
                    if (result?.successful) {
                        result.successful.forEach(item => {
                            if (item.value && Array.isArray(item.value)) {
                                item.value.forEach(msg => successfulIds.add(msg.id.toString()));
                            }
                        });
                    }

                    // Get the IDs of explicitly failed records
                    const explicitlyFailedIds = new Set();
                    if (result?.failed) {
                        result.failed.forEach(item => {
                            if (item.message_id) {
                                explicitlyFailedIds.add(item.message_id.toString());
                            }
                        });
                    }

                    // Find records that weren't returned at all
                    validRecords.forEach(record => {
                        const messageId = record.message_id.toString();
                        if (!successfulIds.has(messageId) && !explicitlyFailedIds.has(messageId)) {
                            silentlyFailed.push({
                                message_id: record.message_id,
                                user_id: record.user_id,
                                conversation_id: record.conversation_id,
                                source_file: record._sourceFile || 'Unknown',
                                reason: `Not processed (likely API issue)`
                            });
                        }
                    });
                }

                // Add validation failures to the failed records list

                // Add missing field records as failed
                missingFieldRecords.forEach(inv => {
                    allFailed.push({
                        message_id: inv.rawValues?.message_id || 'N/A',
                        user_id: inv.rawValues?.user_id || 'N/A',
                        conversation_id: inv.rawValues?.conversation_id || 'N/A',
                        source_file: inv.sourceFile || 'Unknown',
                        reason: `Missing required fields: ${inv.missingFields.join(', ')} (Row ${inv.rowNumber})`
                    });
                });

                // Add invalid value records as failed
                invalidRecords.forEach(inv => {
                    const issues = Object.entries(inv.issues).filter(([k, v]) => v !== null).map(([k, v]) => `${k}="${v}"`).join(', ');
                    allFailed.push({
                        message_id: inv.record.message_id || 'N/A',
                        user_id: inv.record.user_id || 'N/A',
                        conversation_id: inv.record.conversation_id || 'N/A',
                        source_file: inv.sourceFile || 'Unknown',
                        reason: `Invalid values: ${issues} (Row ${inv.rowNumber})`
                    });
                });

                // Add any silent failures
                allFailed.push(...silentlyFailed);

                const totalFailed = allFailed.length;

                progressBar.style.width = '100%';
                progressInfo.innerHTML = `Done. Restored ${success}, failed ${totalFailed}.${skipped > 0 ? ` Skipped ${skipped}.` : ''} (Sent: ${validRecords.length})`;

                // Show failed records (explicit API failures, silent failures, and validation failures)
                if (totalFailed > 0) {
                    const allFailedRecords = allFailed;

                    const failedDiv = document.createElement('div');
                    failedDiv.className = 'mt-3';

                    const failedTitle = document.createElement('h5');
                    failedTitle.textContent = `Failed Records (${totalFailed}):`;
                    failedDiv.appendChild(failedTitle);

                    const ul = document.createElement('ul');
                    allFailedRecords.slice(0, 5).forEach(f => {
                        const li = document.createElement('li');
                        if (f.message_id && f.user_id) {
                            // Silent failure format with source file
                            const sourceInfo = f.source_file ? ` [${f.source_file}]` : '';
                            li.innerHTML = `<strong>Message ID ${f.message_id}</strong> (User: ${f.user_id}, Conversation: ${f.conversation_id})${sourceInfo}: ${f.reason}`;
                        } else {
                            // Explicit failure format
                            li.textContent = f.reason || 'Unknown error';
                        }
                        ul.appendChild(li);
                    });
                    failedDiv.appendChild(ul);

                    if (allFailedRecords.length > 5) {
                        const moreText = document.createElement('p');
                        moreText.textContent = `...and ${allFailedRecords.length - 5} more failed records`;
                        failedDiv.appendChild(moreText);
                    }

                    responseDiv.appendChild(failedDiv);

                    // Write error file if possible
                    if (allFailedRecords.length > 5) {
                        const dirPath = form.dataset.sourceDir || '';
                        const baseName = form.dataset.sourceName || 'restore_upload.csv';
                        if (dirPath && window.fileUpload?.writeErrorsFile) {
                            try {
                                const outPath = await window.fileUpload.writeErrorsFile(dirPath, baseName, allFailedRecords);
                                const p = document.createElement('p');
                                p.textContent = `Full error list written to: ${outPath}`;
                                failedDiv.appendChild(p);
                            } catch (e) {
                                const p = document.createElement('p');
                                p.textContent = `Failed to write errors file: ${e?.message || e}`;
                                failedDiv.appendChild(p);
                            }
                        }
                    }
                }

                // Log details for debugging
                if (missing > 0) {
                    console.log(`${missing} records were silently ignored by the API:`, silentlyFailed);
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