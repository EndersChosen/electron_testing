// ****************************************
//
// User endpoints
//
// ****************************************
function userTemplate(e) {
    switch (e.target.id) {
        case 'page-view':
            getPageViews(e);
            break;
        case 'user-notifications':
            userNotifications(e);
            break;
        default:
            break;
    }
}

async function getPageViews(e) {
    hideEndpoints(e)

    const eContent = document.querySelector('#endpoint-content');
    let getPageViewsForm = eContent.querySelector('#get-page-views-form');

    if (!getPageViewsForm) {

        getPageViewsForm = document.createElement('form');
        getPageViewsForm.id = 'get-page-views-form';
        // eContent.innerHTML = `
        //     <div>
        //         <h3>Get User Page Views</h3>
        //     </div>
        //     <hr />
        //     `;

        // const eForm = document.createElement('form');

        getPageViewsForm.innerHTML = `
            <div>
                <h3>Get User Page Views</h3>
            </div>
            <div class="row align-items-center" >
                <div class="col-auto">
                    <label for="user-id" class="form-label">Canvas user ID</label>
                </div>
                <div class="col-2">
                    <input type="text" id="user-id" class="form-control" aria-describedby="input-checker">
                </div>
                <div class="col-auto" >
                    <span id="input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
            </div >
            <div class="row mt-3 align-items-center">
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
            </div>
            <button type="button" class="btn btn-primary mt-3" id="action-btn">Search</button>
            <div id="response-container" class="mt-5">
            </div>
            `;

        eContent.append(getPageViewsForm);
    }
    getPageViewsForm.hidden = false;

    const uID = getPageViewsForm.querySelector('#user-id');
    uID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkCourseID(uID, getPageViewsForm);
    })

    const searchBtn = getPageViewsForm.querySelector('#action-btn');
    searchBtn.addEventListener('click', async function (e) {
        e.stopPropagation();
        e.preventDefault();


        console.log('renderer.js > getPageViews > searchBtn');



        const domain = document.querySelector('#domain').value.trim();
        const apiToken = document.querySelector('#token').value.trim();
        const userID = parseInt(getPageViewsForm.querySelector('#user-id').value.trim());
        const startDate = getPageViewsForm.querySelector('#start-date').value;
        const endDate = getPageViewsForm.querySelector('#end-date').value;
        const responseContainer = getPageViewsForm.querySelector('#response-container');

        const searchData = {
            domain: domain,
            token: apiToken,
            user: userID,
            start: startDate,
            end: endDate
        };

        searchBtn.disabled = true;

        // const pageViews = await window.axios.getPageViews(searchData);
        try {
            responseContainer.innerHTML = 'Searching...';
            const response = await window.axios.getPageViews(searchData);
            if (response === 'cancelled') {
                responseContainer.innerHTML = 'Page views found, saving was cancelled.';
            } else if (response) {
                responseContainer.innerHTML = 'Page Views saved.';
            } else {
                responseContainer.innerHTML = 'No page views found.';
            }
        } catch (error) {
            responseContainer.innerHTML = '';
            errorHandler(error, responseContainer);
        } finally {
            searchBtn.disabled = false;
        }


        // if (!result) {
        //     searchBtn.disabled = false;
        //     responseContainer.innerHTML = 'Search failed. Check domain, token or user id.';
        // } else if (result === 'empty') {
        //     searchBtn.disabled = false;
        //     responseContainer.innerHTML = 'No page views found for user.';
        // } else if (result === 'cancelled') {
        //     searchBtn.disabled = false;
        //     responseContainer.innerHTML = 'Save cancelled.';
        // } else {
        //     responseContainer.innerHTML = 'Page views saved to file.';
        // }

    });
}

function userNotifications(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let userNotificationsForm = eContent.querySelector('#user-notifications-form');

    if (!userNotificationsForm) {
        userNotificationsForm = document.createElement('form');
        userNotificationsForm.id = 'user-notifications-form';

        userNotificationsForm.innerHTML = `
            <div>
                <h3>User Notification Preferences</h3>
                <p>Enable or disable all notifications for a user across all communication channels.</p>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
                    <label for="user-id" class="form-label">Canvas User ID</label>
                </div>
                <div class="col-2">
                    <input type="text" id="user-id" class="form-control" aria-describedby="user-input-checker">
                </div>
                <div class="col-auto">
                    <span id="user-input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="col-auto">
                    <button type="button" class="btn btn-outline-primary" id="fetch-comm-channels-btn" disabled>
                        Fetch Comm Channels
                    </button>
                </div>
            </div>
            <div class="row mt-3 align-items-center">
                <div class="col-auto">
                    <label for="comm-channel-select" class="form-label">Communication Channel</label>
                </div>
                <div class="col-4">
                    <select id="comm-channel-select" class="form-select" disabled>
                        <option value="">Select a communication channel...</option>
                    </select>
                </div>
                <div class="col-auto">
                    <span class="form-text text-muted">Or enter manually:</span>
                </div>
            </div>
            <div class="row mt-2 align-items-center">
                <div class="col-auto">
                    <label for="comm-channel-id" class="form-label">Communication Channel ID</label>
                </div>
                <div class="col-2">
                    <input type="text" id="comm-channel-id" class="form-control" aria-describedby="comm-input-checker">
                </div>
                <div class="col-auto">
                    <span id="comm-input-checker" class="form-text" style="display: none;">Must only contain numbers</span>
                </div>
                <div class="col-auto">
                    <small class="form-text text-muted">Usually the user's email communication channel</small>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-auto">
                    <button type="button" class="btn btn-success" id="enable-all-btn">Enable All Notifications</button>
                </div>
                <div class="col-auto">
                    <button type="button" class="btn btn-danger" id="disable-all-btn">Disable All Notifications</button>
                </div>
            </div>
            <div hidden id="notifications-progress-div">
                <p id="notifications-progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="notifications-response-container" class="mt-3">
                <!-- Response will be displayed here -->
            </div>
        `;

        eContent.append(userNotificationsForm);
    }
    userNotificationsForm.hidden = false;

    const userID = userNotificationsForm.querySelector('#user-id');
    const commChannelID = userNotificationsForm.querySelector('#comm-channel-id');
    const commChannelSelect = userNotificationsForm.querySelector('#comm-channel-select');
    const fetchCommChannelsBtn = userNotificationsForm.querySelector('#fetch-comm-channels-btn');
    const enableAllBtn = userNotificationsForm.querySelector('#enable-all-btn');
    const disableAllBtn = userNotificationsForm.querySelector('#disable-all-btn');
    const progressDiv = userNotificationsForm.querySelector('#notifications-progress-div');
    const progressInfo = userNotificationsForm.querySelector('#notifications-progress-info');
    const progressBar = userNotificationsForm.querySelector('.progress-bar');
    const responseContainer = userNotificationsForm.querySelector('#notifications-response-container');

    // Input validation
    userID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        validateUserID();
        updateButtonStates();
        updateFetchButtonState();
        clearCommChannelsWhenUserChanges();
    });

    userID.addEventListener('input', (e) => {
        validateUserID();
        updateButtonStates();
        updateFetchButtonState();
        clearCommChannelsWhenUserChanges();
    });

    commChannelID.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        validateCommChannelID();
        updateButtonStates();
    });

    // Communication channel dropdown change handler
    commChannelSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        if (selectedValue) {
            commChannelID.value = selectedValue;
            validateCommChannelID();
            updateButtonStates();
        }
    });

    // Fetch communication channels button handler
    fetchCommChannelsBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await fetchCommunicationChannels();
    });

    function validateUserID() {
        const userChecker = userNotificationsForm.querySelector('#user-input-checker');
        const trimmedValue = userID.value.trim();
        if (trimmedValue === '') {
            userChecker.style.display = 'none';
        } else if (!isNaN(Number(trimmedValue))) {
            userChecker.style.display = 'none';
        } else {
            userChecker.style.display = 'inline';
        }
    }

    function validateCommChannelID() {
        const commChecker = userNotificationsForm.querySelector('#comm-input-checker');
        const trimmedValue = commChannelID.value.trim();
        if (trimmedValue === '') {
            commChecker.style.display = 'none';
        } else if (!isNaN(Number(trimmedValue))) {
            commChecker.style.display = 'none';
        } else {
            commChecker.style.display = 'inline';
        }
    }

    function updateButtonStates() {
        const userValid = userID.value.trim().length > 0 && /^\d+$/.test(userID.value.trim());
        const commValid = commChannelID.value.trim().length > 0 && /^\d+$/.test(commChannelID.value.trim());
        const bothValid = userValid && commValid;

        enableAllBtn.disabled = !bothValid;
        disableAllBtn.disabled = !bothValid;

        // Ensure user ID field is never disabled
        userID.disabled = false;
    }

    function updateFetchButtonState() {
        const userValid = userID.value.trim().length > 0 && /^\d+$/.test(userID.value.trim());
        fetchCommChannelsBtn.disabled = !userValid;

        // Ensure user ID field is never disabled
        userID.disabled = false;
    } function clearCommChannelsWhenUserChanges() {
        // Clear the dropdown and reset it to default state when user ID changes
        commChannelSelect.innerHTML = '<option value="">Select a communication channel...</option>';
        commChannelSelect.disabled = true;
        commChannelID.value = ''; // Also clear the manual input field
        updateButtonStates(); // Update button states since comm channel is now empty
    }

    async function fetchCommunicationChannels() {
        const user = userID.value.trim();
        const domain = document.querySelector('#domain').value;
        const token = document.querySelector('#token').value;

        if (!user || !domain || !token) {
            alert('Please ensure all required fields are filled.');
            return;
        }

        // Check if axios is available
        if (!window.axios || !window.axios.getCommChannels) {
            console.error('axios or getCommChannels function not available');
            alert('Error: Communication functions not yet loaded. Please try again in a moment.');
            return;
        }

        try {
            fetchCommChannelsBtn.disabled = true;
            fetchCommChannelsBtn.innerHTML = 'Fetching...';

            const response = await window.axios.getCommChannels({
                domain,
                token,
                user
            });

            if (response.success) {
                populateCommChannelDropdown(response.data);
            } else {
                throw new Error(response.error || 'Failed to fetch communication channels');
            }
        } catch (error) {
            console.error('Error fetching communication channels:', error);
            alert(`Error fetching communication channels: ${error.message}`);
        } finally {
            fetchCommChannelsBtn.disabled = false;
            fetchCommChannelsBtn.innerHTML = 'Fetch Comm Channels';
            updateFetchButtonState();
            // Ensure user ID field remains enabled and editable
            userID.disabled = false;
        }
    }

    function populateCommChannelDropdown(channels) {
        // Clear existing options except the first one
        commChannelSelect.innerHTML = '<option value="">Select a communication channel...</option>';

        if (channels && channels.length > 0) {
            channels.forEach(channel => {
                const option = document.createElement('option');
                option.value = channel.id;
                option.textContent = `${channel.type}: ${channel.address} (ID: ${channel.id})`;
                commChannelSelect.appendChild(option);
            });
            commChannelSelect.disabled = false;
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No communication channels found';
            commChannelSelect.appendChild(option);
            commChannelSelect.disabled = true;
        }
    }

    // Initially disable buttons and ensure user ID field is enabled
    updateButtonStates();
    updateFetchButtonState();

    // Explicitly ensure user ID field is enabled and editable
    userID.disabled = false;
    userID.readOnly = false;

    // Enable All Notifications button handler
    enableAllBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleNotificationUpdate('immediately', 'enabled');
    });

    // Disable All Notifications button handler
    disableAllBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleNotificationUpdate('never', 'disabled');
    });

    async function handleNotificationUpdate(frequency, action) {
        const domain = document.querySelector('#domain').value.trim();
        const apiToken = document.querySelector('#token').value.trim();
        const user = userID.value.trim();
        const commChannel = commChannelID.value.trim();

        // Disable buttons during processing
        enableAllBtn.disabled = true;
        disableAllBtn.disabled = true;

        // Show progress
        progressDiv.hidden = false;
        progressInfo.innerHTML = `${action === 'enabled' ? 'Enabling' : 'Disabling'} all notifications...`;
        updateProgressWithPercent(progressBar, 0);

        const requestData = {
            domain: domain,
            token: apiToken,
            user: user,
            commChannel: commChannel,
            frequency: frequency
        };

        try {
            const response = await window.axios.updateNotifications(requestData);

            if (response.success) {
                progressInfo.innerHTML = `Successfully ${action} all notifications.`;
                responseContainer.innerHTML = `<div class="alert alert-success" role="alert">
                    All notifications have been ${action} for user ${user}.
                </div>`;
                updateProgressWithPercent(progressBar, 100);
            } else {
                throw new Error(response.error || 'Failed to update notifications');
            }
        } catch (error) {
            progressDiv.hidden = true;
            responseContainer.innerHTML = '';
            errorHandler(error, responseContainer);
        } finally {
            // Re-enable buttons
            updateButtonStates();

            // Hide progress after a delay
            setTimeout(() => {
                progressDiv.hidden = true;
                updateProgressWithPercent(progressBar, 0);
            }, 2000);
        }
    }
}