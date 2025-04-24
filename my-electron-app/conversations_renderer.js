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
        case 'gc-between-users': // Not complete
            getConvos(e);
            break;
        default:
            break;
    }
};

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

            removeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('inside remove');
                // const responseDetails = responseContainer.querySelector('#response-details');
                // responseDetails.innerHTML = `Removing ${messages.length} conversations...`;

                // const messageIDs = messages.map((message) => {
                //     return message.node.conversation;
                // });

                progressInfo.innerHTML += `<p>Removing ${messages.length} conversations.</p>`;
                progressBar.parentElement.hidden = false;
                const messageData = {
                    domain: domain,
                    token: apiToken,
                    messages: messages
                }

                window.progressAPI.onUpdateProgress((progress) => {
                    progressBar.style.width = `${progress}%`;
                });

                try {
                    const result = await window.axios.deleteConvos(messageData);
                    if (result.successful.length > 0) {
                        progressInfo.innerHTML += `<p>Successfully removed ${result.successful.length} messages</p>`
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