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
document.addEventListener('DOMContentLoaded', setupMenuHandlers);

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