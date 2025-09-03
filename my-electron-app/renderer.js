window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (window.menus && window.menus.rightclick) {
        window.menus.rightclick();
    } else {
        console.warn('window.menus API not available for context menu');
    }
});

// formatting the domain 
const domain = document.querySelector('#domain');
domain.addEventListener('change', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // console.log('The domain value: ', e.target.value);
    const domainString = e.target.value;
    if (domainString.length > 0) {
        const httpsRemoved = domainString.match(/https:\/\/([^/\/\s]+)|([^/\/\s]+)/)[1];
        if (httpsRemoved) {
            e.target.value = httpsRemoved;
        }
    }
});

// used to detect which input you're in for pasting
let focusedTextBox = null;
document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
        focusedTextBox = e.target;
    }
})

// cut, copy, paste
function setupMenuHandlers() {
    if (window.menus && window.menus.onMenuCommand) {
        window.menus.onMenuCommand(async (data) => {
            console.log('Returned from context Menu. The command is: ', data.command);

            switch (data.command) {
                case 'copy':
                    getSelectedText();
                    break;
                case 'cut':
                    const selectedText = window.getSelection();
                    window.menus.writeText(selectedText.toString());
                    selectedText.deleteFromDocument();
                    break;
                case 'paste':
                    console.log('The clipboard is ', data.text);
                    if (focusedTextBox) {
                        focusedTextBox.value += data.text;
                    }
                    break;
                default:
                    console.log('failed to paste');
            }
        });
    } else {
        console.warn('window.menus API not available, retrying...');
        setTimeout(setupMenuHandlers, 100);
    }
}

// Initialize menu handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupMenuHandlers();
    // Auto-attach global progress listener if containers exist
    // Do not auto-wire global progress to avoid cross-form bleed
    if (window.progressAPI && window.progressAPI.removeAllProgressListeners) {
        window.progressAPI.removeAllProgressListeners();
    }

    // Sidebar collapse toggle
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('endpoint-content');
    const mainRow = document.getElementById('main-row');

    function setButtonState(collapsed) {
        toggleBtn.setAttribute('aria-pressed', String(collapsed));
        toggleBtn.setAttribute('title', collapsed ? 'Show menu' : 'Hide menu');
        toggleBtn.textContent = collapsed ? '»' : '«';
    }

    // Endpoint search filter
    const searchInput = document.getElementById('endpoint-search');
    if (searchInput) {
        const accordion = document.getElementById('endpoints');
        const collapseElems = () => Array.from(accordion.querySelectorAll('.accordion-collapse'));
        const headerButtonFor = (collapseEl) => {
            const id = collapseEl.id;
            return accordion.querySelector(`[data-bs-target="#${id}"]`);
        };

        function setCollapseState(collapseEl, expand) {
            // Use Bootstrap Collapse API if available; else fallback by toggling classes/inline style
            try {
                const bsCollapse = bootstrap?.Collapse ? bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false }) : null;
                if (bsCollapse) {
                    if (expand) bsCollapse.show(); else bsCollapse.hide();
                } else {
                    collapseEl.classList.toggle('show', expand);
                }
                const headerBtn = headerButtonFor(collapseEl);
                if (headerBtn) headerBtn.classList.toggle('collapsed', !expand);
            } catch (e) {
                collapseEl.classList.toggle('show', expand);
            }
        }

        function filterEndpoints(query) {
            const q = query.trim().toLowerCase();
            const sections = collapseElems();
            // If empty, reset: show all buttons and collapse sections
            if (!q) {
                sections.forEach(sec => {
                    // show every button
                    sec.querySelectorAll('.list-group > button').forEach(btn => btn.classList.remove('d-none'));
                    // keep collapsed by default
                    setCollapseState(sec, false);
                    // show all categories
                    const item = sec.closest('.accordion-item');
                    if (item) item.classList.remove('d-none');
                });
                return;
            }

            sections.forEach(sec => {
                let anyMatch = false;
                sec.querySelectorAll('.list-group > button').forEach(btn => {
                    const text = btn.textContent.trim().toLowerCase();
                    const match = text.includes(q);
                    btn.classList.toggle('d-none', !match);
                    if (match) anyMatch = true;
                });
                // expand sections with matches, collapse others
                setCollapseState(sec, anyMatch);
                // hide categories (accordion-item) with no matches
                const item = sec.closest('.accordion-item');
                if (item) item.classList.toggle('d-none', !anyMatch);
            });
        }

        // Debounce input for snappier UX
        let t;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(t);
            const val = e.target.value;
            t = setTimeout(() => filterEndpoints(val), 100);
        });
    }

    // Resizable sidebar functionality
    const resizeHandle = document.getElementById('resize-handle');
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let containerLeft = 0;
    const minWidth = 0; // Minimum width in pixels (allow any size)
    const maxWidth = 600; // Maximum width in pixels
    const collapseThresholdPx = 0; // Collapse only when releasing at the left edge

    function getSidebarWidth() {
        const el = mainRow || document.documentElement;
        const computedStyle = getComputedStyle(el);
        const currentWidth = (computedStyle.getPropertyValue('--sidebar-width') || '').trim();
        const parsed = parseInt(currentWidth, 10);
        return Number.isNaN(parsed) ? 300 : parsed;
    }

    function setSidebarWidth(widthPixels) {
        // Clamp width between minimum and maximum
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, widthPixels));
        // Apply on the same element where the CSS variable is defined so it takes effect
        const target = mainRow || document.documentElement;
        target.style.setProperty('--sidebar-width', `${clampedWidth}px`);

        // Save the width to localStorage
        localStorage.setItem('sidebarWidth', clampedWidth.toString());
    }

    function initializeResizer() {
        if (!resizeHandle) return;

        // Load saved width
        const savedWidth = localStorage.getItem('sidebarWidth');
        if (savedWidth) {
            setSidebarWidth(parseInt(savedWidth));
        }

        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();

            // If sidebar is collapsed, expand it instead of resizing
            if (mainRow.classList.contains('sidebar-collapsed')) {
                applySidebarState(false, { animate: true });
                return;
            }

            isResizing = true;
            startX = e.clientX;
            startWidth = getSidebarWidth();
            const rect = mainRow.getBoundingClientRect();
            containerLeft = rect.left;

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            // Add overlay to prevent iframe interference
            const overlay = document.createElement('div');
            overlay.id = 'resize-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                cursor: col-resize;
            `;
            document.body.appendChild(overlay);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            e.preventDefault();
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;

            setSidebarWidth(newWidth);
        });

        document.addEventListener('mouseup', (e) => {
            if (!isResizing) return;

            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Remove overlay
            const overlay = document.getElementById('resize-overlay');
            if (overlay) {
                overlay.remove();
            }

            // If released at the left edge, collapse the sidebar
            if (e && (e.clientX - containerLeft) <= collapseThresholdPx) {
                // Store current width before collapsing for restore
                const currentWidth = getSidebarWidth();
                localStorage.setItem('sidebarWidthBeforeCollapse', currentWidth.toString());
                applySidebarState(true, { animate: true });
            }
        });
    }

    // Enhanced sidebar toggle to handle resizing
    function applySidebarState(collapsed, { animate } = { animate: true }) {
        console.log('applySidebarState called with collapsed:', collapsed); // Debug log
        if (!mainRow) {
            console.log('mainRow not found!'); // Debug log
            return;
        }
        // The CSS transition handles smooth slide; JS only toggles the state class
        mainRow.classList.toggle('sidebar-collapsed', collapsed);
        console.log('mainRow classes after toggle:', mainRow.className); // Debug log

        // Update button state
        const currentToggleBtn = document.getElementById('sidebar-toggle');
        if (currentToggleBtn) {
            currentToggleBtn.setAttribute('aria-pressed', String(collapsed));
            currentToggleBtn.setAttribute('title', collapsed ? 'Show menu' : 'Hide menu');
            currentToggleBtn.textContent = collapsed ? '»' : '«';
        }

        localStorage.setItem('sidebarCollapsed', String(collapsed));

        if (collapsed) {
            // Store current width before collapsing
            const currentWidth = getSidebarWidth();
            localStorage.setItem('sidebarWidthBeforeCollapse', currentWidth.toString());
        } else {
            // Restore width when expanding, but ensure it's above minimum width
            const savedWidth = parseInt(localStorage.getItem('sidebarWidthBeforeCollapse')) || 300;
            const widthToRestore = Math.max(minWidth, savedWidth);
            setSidebarWidth(widthToRestore);
        }
    }

    // Override the existing toggle functionality
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Toggle button clicked'); // Debug log
            const willCollapse = !mainRow.classList.contains('sidebar-collapsed');
            console.log('Will collapse:', willCollapse); // Debug log
            applySidebarState(willCollapse, { animate: true });
        });
    }

    // Initialize the resizer
    initializeResizer();

    // Load saved state and apply initial sidebar state
    const saved = localStorage.getItem('sidebarCollapsed');
    const initialCollapsed = saved === 'true';
    applySidebarState(initialCollapsed, { animate: false });
});

function getSelectedText() {
    const selectedText = window.getSelection();
    if (window.menus && window.menus.writeText) {
        window.menus.writeText(selectedText.toString());
    } else {
        console.warn('window.menus.writeText not available');
    }
}

const endpointSelect = document.querySelector('#endpoints');
endpointSelect.addEventListener('click', (e) => {

    const parentEl = e.target.parentElement.id;
    console.log('Selected ', parentEl);
    switch (parentEl) {
        case 'assignment-endpoints':
            assignmentTemplate(e);
            break;
        case 'assignment-group-endpoints':
            assignmentGroupTemplate(e);
            break;
        case 'user-endpoints':
            userTemplate(e);
            break;
        case 'conversation-endpoints':
            conversationTemplate(e);
            break;
        case 'commchannel-endpoints':
            commChannelTemplate(e);
            break;
        case 'course-endpoints':
            courseTemplate(e);
            break;
        case 'quiz-endpoints':
            quizTemplate(e);
            break;
        case 'module-endpoints':
            moduleTemplate(e);
            break;
        case 'sis-import-endpoints':
            sisImportsTemplate(e);
            break;
        case 'imports-endpoints':
            importsTemplate(e);
            break;
        case 'discussion-endpoints':
            discussionTemplate(e);
            break;
        case 'announcement-endpoints':
            announcementTemplate(e);
            break;
        case 'pages-endpoints':
            pagesTemplate(e);
            break;
        case 'sections-endpoints':
            sectionsTemplate(e);
            break;
        default:
            break;
    }
});

function setHeader(header, eContent) {
    let eHeader = eContent.querySelector(`h3`);

    if (!eHeader) {
        const headerDiv = document.createElement('div');
        eHeader = document.createElement('h3');
        headerDiv.append(eHeader);
        eContent.append(headerDiv);
    }

    eHeader.innerHTML = header;
}
// create a boilerplate form based on what the endpoint needs
// the parameter is the div for the 'endpoint-content' and the endpoint name
// current valid endpoints are:
// -- createAssignments, deleteNoSubmissionAssignments, deleteUnpublishedAssignments,
// -- deleteNonModuleAssignments, moveAssignmentsToSingleGroup
function createForm(endpoint, eContent) {
    switch (endpoint) {
        case 'createAssignments':
            createAssignments(eContent);
            break;
        case 'deleteNoSubmissionAssignments':
            deleteNoSubmissionAssignments(eContent);
            break;
        case 'deleteUnpublishedAssignments':
        case 'deleteNonModuleAssignments':
        case 'moveAssignmentsToSingleGroup':
            assignmentCourse(eContent);
            break;
        default:
            break;
    }
}

function assignmentCourse(eContent) {
    let eForm = eContent.querySelector('form');
    if (!eForm) {
        eForm = document.createElement('form');

        eForm.innerHTML = `
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
            <div class="col-auto">
                <button id="action-btn" class="btn btn-primary mt-3">Check</button>
            </div>
        </div>
        <div hidden id="progress-div">
            <p id="progress-info"></p>
            <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">

                <div class="progress-bar" style="width: 0%"></div>
            </div>
        </div>
        <div id="response-container" class="mt-5">
        </div>
    `;

        eContent.append(eForm);

        // Enhance the progress bar with percent label
        const progressBar = eForm.querySelector('.progress-bar');
        if (progressBar) {
            enhanceProgressBarWithPercent(progressBar);
        }
    }


}

// check if the course ID is a number
function checkCourseID(courseID, eContent) {
    if (courseID != null) {

        const courseChecker = eContent.querySelector(`#input-checker`);
        const trimmedValue = courseID.value.trim();
        if (trimmedValue === '') {
            courseChecker.style.display = 'none';
            eContent.querySelector('button').disabled = true;
        } else if (!isNaN(Number(trimmedValue))) {
            courseChecker.style.display = 'none';
            eContent.querySelector('button').disabled = false;
        } else {
            courseChecker.style.display = 'inline';
            eContent.querySelector('button').disabled = true;
        }
    }
}

// function checkInputs(num, date) {
//     for (let arg of args) {
//         switch (typeof(arg)) {
//             case 'number':
//                 check
//                 break;

//             default:
//                 break;
//         }
//     }
// }

// function checkInt(value) {

// }

// function checkDate(value) {

// }

function validateInput(value, errorText) {
    let valid = false;
    if (value.length < 1 || isNaN(value)) {
        valid = false;
        errorText.hidden = false;
    } else {
        valid = true;
        errorText.hidden = true;
    }
    return valid;
}

function getInputs(eContent) {
    const data = {};
    data.domain = document.querySelector('#domain').value.trim();
    data.token = document.querySelector('#token').value.trim();

    // data.courseID = eContent.querySelector('#course-id').value.trim();

    for (let input of eContent.querySelectorAll('input')) {
        if (input.type === 'checkbox') {
            data[input.id] = input.checked;
        } else {
            data[input.id] = input.value.trim();
        }
    }

    return data;
}

function errorHandler(error, progressInfo) {
    console.error(error)
    const lastIndex = error.message.lastIndexOf(':');
    let errorInfo = 'If you need assistance message Caleb and tell him to fix it.';
    const statusCode = error.message.match(/(?<=status code )[0-9]+/);
    if (statusCode) {
        switch (statusCode[0]) {
            case '401':
                errorInfo = 'Check your token';
                if (document.querySelector('#user-id')) {
                    errorInfo += ' and the User ID.';
                }
                break;
            case '403':
                errorInfo = 'Check to make sure you have permissions for the request and try again.';
                break;
            case '404':
                errorInfo = 'Check your inputs to make sure they\'re valid.';
                break;
            default:
                errorInfo = 'If you need assistance message Caleb and tell him to fix it.'
                break;
        }

    }
    progressInfo.innerHTML += `<p>There was an error: <span class="error">${error.message.slice(lastIndex + 1)}</span></p><p>${errorInfo}</p>`;
}

function hideEndpoints() {
    const eContent = document.querySelector('#endpoint-content');
    const forms = eContent.querySelectorAll('form');
    // hide all forms
    for (let form of forms) {
        form.hidden = true;
    }
}