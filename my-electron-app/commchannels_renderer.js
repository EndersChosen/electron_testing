// ****************************************
//
// Communication Channel endpoints
//
// ****************************************
async function commChannelTemplate(e) {
    switch (e.target.id) {
        case 'check-commchannel':
            checkComm(e);
            break;
        case 'reset-commchannel':
            resetComm(e);
            break;
        case 'unconfirm-commchannels':
            unconfirmed(e);
            break;
        case 'download-conversations-csv':
            downloadConvos(e);
            break;
        case 'gc-between-users':
            getConvos(e);
            break;
        default:
            break;
    }
}

function checkComm(e) {
    hideEndpoints(e);

    // const eHeader = document.createElement('div');
    // eHeader.innerHTML = `<h3>${e.target.id}</h3>`;
    const eContent = document.querySelector('#endpoint-content');
    let checkSuppressionListForm = eContent.querySelector('#check-suppressionlist-form');

    if (!checkSuppressionListForm) {
        checkSuppressionListForm = document.createElement('form');
        checkSuppressionListForm.id = 'check-suppressionlist-form';

        // eContent.append(eHeader);
        // eContent.innerHTML = `
        //     <div>
        //         <h3>Check suppression and bounce list</h3>
        //     </div>
        // `;

        // const eForm = document.createElement('form');
        checkSuppressionListForm.innerHTML = `
            <div>
                <h3>Check suppression and bounce list</h3>
            </div>
                <div class="row">
                    <div class="mb-3">
                        <div class="col-auto">
                            <label for="region" class="form-label">Region: </label>
                        </div>
                        <div class="col-2">
                            <select id="region" class="form-select" aria-label="Region info">
                                <option value="iad_pdx" selected>IAD/PDX</option>
                                <option value="dub_fra">DUB/FRA</option>
                                <option value="syd_sin">SYD/SIN</option>
                                <option value="yul" selected>YUL</option>
                            </select>
                        </div>
                    </div>
                    <div id="email-options">
                        <div class="form-check form-switch">
                            <label class="form-label" for="single-email-chkbx">Single Email</label>
                            <input id="single-email-chkbx" type="checkbox" class="form-check-input" role="switch">
                        </div>
                        <div class="form-check form-switch">
                            <label class="form-label" for="domain-email-chkbx">Domain</label>
                            <input id="domain-email-chkbx" type="checkbox" class="form-check-input" role="switch">
                        </div>
                    </div>
                    <div class="">
                        <div class="col-auto">
                            <label id="email-label" for="email" class="form-label">Email</label>
                        </div>
                        <div class="w-100"></div>
                        <div class="col-5">
                            <input disabled type="text" id="email" class="form-control" aria-describedby="email-form-text">
                        </div>
                        <div class="form-text" id="email-form-text">
                            Enter the full email address you want to check
                        </div>
                    </div>
                </div>
            <button type="button" class="btn btn-primary mt-3" id="email-check" disabled>Check</button>
            <div id="progress-div" hidden>
                <div id="loading-wheel">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
            <div id="response-container" class="mt-5">
            </div>
            `

        eContent.append(checkSuppressionListForm);
    }
    checkSuppressionListForm.hidden = false;

    const emailInput = checkSuppressionListForm.querySelector('#email');
    emailInput.addEventListener('input', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.target.value === '') {
            checkBtn.disabled = true;
        } else {
            checkBtn.disabled = false;
        }
    })

    function handleQueryType(e) {

        const formMessgae = checkSuppressionListForm.querySelector('#email-form-text')
        const emailLabel = checkSuppressionListForm.querySelector('#email-label')
        const emailChbx = checkSuppressionListForm.querySelector('#single-email-chkbx');
        const domainChbx = checkSuppressionListForm.querySelector('#domain-email-chkbx');

        if (emailChbx.checked === false && domainChbx.checked === false) {
            emailInput.value = '';
            emailInput.disabled = true;
            checkBtn.disabled = true;
        } else {
            if (e.target.id === 'single-email-chkbx') {
                checkSuppressionListForm.querySelector('#domain-email-chkbx').checked = false;
                formMessgae.innerHTML = "Enter the full email address you want to check";
                emailLabel.innerHTML = "Email";
            } else {
                checkSuppressionListForm.querySelector('#single-email-chkbx').checked = false;
                formMessgae.innerHTML = "Enter the domain pattern you want to check. You can use a wildcard at the beginning and end, for example *student* will match anything that has student in the email. <p><p>NOTE: This queries the entire aws region and will take some time, we're talking hours in some cases.</p></p>";
                emailLabel.innerHTML = "Domain";
            }
            emailInput.disabled = false;
            if (emailInput.value !== '') {
                checkBtn.disabled = false;
            }
        }
    }

    const emailOptions = checkSuppressionListForm.querySelector('#email-options');
    emailOptions.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        handleQueryType(e);
    })

    const checkBtn = checkSuppressionListForm.querySelector('button');
    checkBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        checkBtn.disabled = true;

        const domain = document.querySelector('#domain').value.trim();
        const apiToken = document.querySelector('#token').value.trim();
        const region = checkSuppressionListForm.querySelector('#region').value;
        const email = checkSuppressionListForm.querySelector('#email').value.trim().toLowerCase();
        const responseContainer = checkSuppressionListForm.querySelector('#response-container');
        const progresDiv = checkSuppressionListForm.querySelector('#progress-div');
        const progressBar = progresDiv.querySelector('.progress-bar');
        const progressInfo = checkSuppressionListForm.querySelector('#progress-info');

        responseContainer.innerHTML = '';

        const options = checkSuppressionListForm.querySelectorAll('input[type="checkbox"]');
        const checkedOption = Array.from(options).find(checkbox => checkbox.checked);
        const option = checkedOption ? checkedOption.id.split('-')[0] : undefined;

        const data = {
            domain: domain,
            token: apiToken,
            region: region,
            pattern: email
        }

        let response;
        let hasError = false;
        if (option === 'single') {
            try {
                responseContainer.innerHTML = 'Checking email....';
                progresDiv.hidden = false;
                response = await window.axios.checkCommChannel(data);
            } catch (error) {
                hasError = true;
                errorHandler(error, responseContainer);
            } finally {
                checkBtn.disabled = false;
                responseContainer.innerHTML += '<p>Done.</p>';
                progresDiv.hidden = true;
            }

            if (!hasError) {
                responseContainer.innerHTML += `<p>Suppressed: <span style="color: ${response.suppressed ? 'red' : 'green'}">${response.suppressed ? 'Yes' : 'No'}</span></p>`;
                responseContainer.innerHTML += `<p>Bounced: <span style="color: ${response.bounced ? 'red' : 'green'}">${response.bounced ? 'Yes' : 'No'}</span></p>`;
            }
        } else {
            progresDiv.hidden = false;
            // progressBar.style.width = '0%';
            // let progress = 0;
            try {
                responseContainer.innerHTML = 'Checking domain pattern....';
                response = await window.axios.checkCommDomain(data);
                responseContainer.innerHTML += 'Done.';
            } catch (error) {
                errorHandler(error, responseContainer);
                hasError = true;
            } finally {
                checkBtn.disabled = false;
                progresDiv.hidden = true;
            }

            if (response) {
                responseContainer.innerHTML += `<p>Found suppressed email. Download them here: <button id="download-emails">Download Emails</button>.</p>`;
                const downloadEmails = responseContainer.querySelector('#download-emails');
                downloadEmails.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    window.csv.sendToText();
                });
            } else if (!hasError) {
                responseContainer.innerHTML += `<p>Didn't find any emails matching the specified pattern.</p>`;
            }
        }
    });
}

function resetComm(e) {
    console.log('The target is: ', e.target);
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let resetCommForm = eContent.querySelector('#reset-comm-form');

    if (!resetCommForm) {
        // const resetCommHeader = document.createElement('div');
        // resetCommHeader.id = 'reset-comm-header';
        // resetCommHeader.innerHTML = `<h3>Reset Communication Channels</h3>`;

        resetCommForm = document.createElement('form');
        resetCommForm.id = 'reset-comm-form';
        resetCommForm.innerHTML = `
        <div>
            <h3>Reset Communication Channels</h3>
        </div>
        <div>
            <div class="col-2">
                <select id="region" class="form-select" aria-label="Region info">
                    <option value="iad_pdx" selected>IAD/PDX</option>
                    <option value="dub_fra">DUB/FRA</option>
                    <option value="syd_sin">SYD/SIN</option>
                    <option value="yul" selected>YUL</option>
                </select>
            </div>
            <div id="reset-switches" class="mt-2">
                <div class="form-check form-switch">
                    <label clas="form-label" for="reset-single-email">Reset single email</label>
                    <input id="reset-single-email" type="checkbox" role="switch" class="form-check-input">
                </div>
                <div class="form-check form-switch">
                    <label clas="form-label" for="reset-upload-input">Upload file to reset</label>
                    <input id="reset-upload-input" type="checkbox" role="switch" class="form-check-input">
                </div>
            </div>
            <div id="reset-data-inputs" hidden>
                <div id="reset-single-div">
                    <input id="reset-single-input" type="text" class="form-control">
                </div>
            </div>
        </div>
        <div id="reset-btns">
            <button id="reset-upload-btn" class="btn btn-primary mt-3" hidden>Upload</button>
            <button id="reset-single-btn" class="btn btn-primary mt-3" hidden>Reset</button>
        </div>
        <div hidden id="progress-div">
            <p id="progress-info"></p>
            <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
        </div>
        <div id="reset-single-comm-response-container" class="mt-3" hidden></div>
        <div id="reset-upload-comm-response-container" class="mt-3" hidden></div>
        `;

        eContent.append(resetCommForm);
    }
    resetCommForm.hidden = false;


    const singleContainer = resetCommForm.querySelector('#reset-single-comm-response-container');
    const uploadContainer = resetCommForm.querySelector('#reset-upload-comm-response-container');
    const resetSwitches = resetCommForm.querySelector('#reset-switches');
    const inputs = resetSwitches.querySelectorAll('input');
    const dataInputs = resetCommForm.querySelector('#reset-data-inputs');
    const resetBtns = resetCommForm.querySelector('#reset-btns');
    const allBtns = resetBtns.querySelectorAll('button');
    const resetBtn = resetCommForm.querySelector('#reset-single-btn');
    const uploadBtn = resetCommForm.querySelector('#reset-upload-btn');
    const resetSingleInput = resetCommForm.querySelector('#reset-single-input');
    const progresDiv = resetCommForm.querySelector('#progress-div');
    const progressInfo = resetCommForm.querySelector('#progress-info');
    const progressBar = resetCommForm.querySelector('.progress-bar');

    // listener for the toggle switches
    resetSwitches.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // if the change was to disable the switch
        // disable all inputs
        if (e.target.checked === false) {
            dataInputs.hidden = true;
            resetBtns.hidden = true;
            singleContainer.hidden = true;
            uploadContainer.hidden = true;
        } else {
            resetBtns.hidden = false;
            for (let input of inputs) {
                if (input.id !== e.target.id) {
                    input.checked = false;
                }
            }
            if (e.target.id === 'reset-single-email') {
                dataInputs.hidden = false;
                singleContainer.hidden = false;
                uploadContainer.hidden = true;
                handleResetOptions(allBtns, resetBtn);
                resetBtn.disabled = true;
            } else {
                dataInputs.hidden = true;
                singleContainer.hidden = true;
                uploadContainer.hidden = false;
                handleResetOptions(allBtns, uploadBtn);
            }
        }

    });

    // disabled or enabled the buttons and inputs based on toggle switches
    function handleResetOptions(allBtns, theButton) {
        for (let button of allBtns) {
            if (button.id !== theButton.id) {
                button.disabled = true;
                button.hidden = true;
            } else {
                theButton.disabled = false;
                theButton.hidden = false;
            }
        }
    }

    resetSingleInput.addEventListener('input', (e) => {
        resetBtn.disabled = resetSingleInput.value.trim().length < 1;
    })

    resetBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const resetValue = resetSingleInput.value.trim();
        const regionVal = resetCommForm.querySelector('#region').value;

        const requestData = {
            domain: domain,
            token: token,
            email: resetValue,
            region: regionVal
        };

        try {
            const response = await window.axios.resetCommChannel(requestData);
            // { bounce: { status: reset},suppression: {status, reset}}
            singleContainer.innerHTML = `<h5>Bounce</h5>`;
            if (response.bounce.error != null) {
                errorHandler(response.bounce.error, singleContainer);
            } else if (response.bounce.reset < 1) {
                singleContainer.innerHTML += `Email wasn't on the bounce list.`;
            } else {
                singleContainer.innerHTML += `Cleared email from bounce list.`;
            }
            singleContainer.innerHTML += '<h5>Suppression</h5>'
            if (response.suppression.error != null) {
                errorHandler(response.suppression.error, singleContainer);
            } else if (response.suppression.status === '404') {
                singleContainer.innerHTML += 'Email wasn\'t found on suppression list.';
            } else {
                singleContainer.innerHTML += 'Cleared email from suppression list.';
            }
        } catch (error) {
            errorHandler(error, singleContainer);
        };
    });

    uploadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        uploadBtn.disabled = true;

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const regionVal = resetCommForm.querySelector('#region').value;

        const requestData = {
            domain: domain,
            token: token,
            region: regionVal
        };

        window.progressAPI.onUpdateProgress((progress) => {
            progressBar.style.width = `${progress}%`;
        });

        try {
            progresDiv.hidden = false;
            uploadContainer.innerHTML = "Working...";
            const response = await window.axios.resetEmails(requestData);
            progresDiv.hidden = true;
            // const successful = response.successful.map((success) => {
            //     const newSuccess = {
            //         status: success.status,
            //         value: { ...success.value }
            //     };
            //     return newSuccess;
            // });
            // const failed = response.failed.map((failed) => {
            //     const newFailed = {
            //         status: failed.status,
            //         value: { ...failed.value }
            //     };
            //     return newFailed;
            // });
            // const successful = { ...response.successful };
            // const failed = response.failed.map((failed) => failed.id);
            // const failed = { ...response.failed };
            const totalProcessed = response.successful.length + response.failed.length;
            let totalBounceReset = 0;
            let totalAWSReset = 0;
            // for (let success of successful) {
            //     totalBounceReset += success.value.bounce.reset;
            //     totalAWSReset += success.value.suppression.reset;
            // };
            response.successful.forEach(success => {
                totalBounceReset += success.value.bounce.reset;
                totalAWSReset += success.value.suppression.reset;
            });

            const errorBounce = response.successful.filter((email) => email.value.bounce.error != null);
            const errorSuppressed = response.successful.filter((email) => email.value.suppression.error != null);
            // { bounce: { status: reset},suppression: {status, reset}}
            uploadContainer.innerHTML = `<p>Total Processed: ${totalProcessed}</p>`;
            uploadContainer.innerHTML += `<h5>Bounce</h5>`;
            // handle any that errored
            errorBounce.forEach(element => {
                errorHandler(element.value.bounce.error, uploadContainer);
            });

            if (totalBounceReset < 1) {
                uploadContainer.innerHTML += `No Emails were cleared from the bounce list.`;
            } else {
                uploadContainer.innerHTML += `Cleared ${totalBounceReset} email(s) from bounce list.`;
            }

            uploadContainer.innerHTML += '<h5 class="mt-3">Suppression</h5>'
            errorSuppressed.forEach(email => {
                errorHandler(email.value.suppression.error, uploadContainer);
            })

            if (totalAWSReset < 1) {
                uploadContainer.innerHTML += 'No Emails were found on suppression list.';
            } else {
                uploadContainer.innerHTML += `Cleared ${totalAWSReset} emails from suppression list.`;
            }

        } catch (error) {
            if (error.message.toLowerCase().includes('cancelled')) {
                progresDiv.hidden = true;
                uploadContainer.innerHTML = 'Upload was cancelled.';
            } else {
                errorHandler(error, uploadContainer);
            }
        } finally {
            uploadBtn.disabled = false;
            progressBar.style.width = '0%';
        };
    });
}

function unconfirmed(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let unconfirmedEmailForm = eContent.querySelector('#unconfirmed-emails-form');

    if (!unconfirmedEmailForm) {
        unconfirmedEmailForm = document.createElement('form');
        unconfirmedEmailForm.id = 'unconfirmed-emails-form';

        // eContent.append(eHeader);
        // eContent.innerHTML = `
        //     <div>
        //         <h3>Unconfirmed emails</h3>
        //     </div>
        // `;

        // const eForm = document.createElement('form');
        unconfirmedEmailForm.innerHTML = `
            <div>
                <h3>Unconfirmed emails</h3>
            </div>
            <div id="switches">
                <div class="form-check form-switch">
                    <label class="form-check-label" for="uncofirmed-email-switch">Check for unconfirmed emails</label>
                    <input class="form-check-input" type="checkbox" role="switch" id="unconfirmed-email-switch">
                    <div id="email-pattern-div" hidden>
                        <input id="unconfirmed-email-pattern" type="text" class="form-control" placeholder="email.domain.edu" aria-describedby="unconfirmed-pattern-description">
                        <div id="email-warning" style="color: red;" class="form-text" hidden>***Must enter a pattern***</div>
                        <span id="unconfirmed-pattern-description" class="form-text">Email domain pattern to search for unconfirmed emails (wildcards accepted *pattern*edu)</span>
                    </div>
                </div>
                <div class="form-check form-switch">
                    <label class="form-check-label" for="confirm-email-switch">Upload file of emails to confirm</label>
                    <input class="form-check-input" type="checkbox" role="switch" id="upload-email-switch" aria-describedby="confirm-file-description">
                    <div id="confirm-file-description" class="form-text" hidden>Must be a simple text file only containing a list of emails. Emails may be comma separated or on individual lines</div>
                </div>
                <div class="form-check form-switch">
                    <label class="form-check-label" for="confirm-email-list-switch">Input list of emails to confirm</label>
                    <input class="form-check-input" type="checkbox" role="switch" id="confirm-email-list-switch" aria-describedby="confirm-email-list-desc">
                    <div id="confirm-email-list-box" hidden>
                        <textarea class="form-control" id="email-list-box" rows="3" placeholder="example1@example.com,example2@example.com, etc."></textarea>
                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-primary mt-3" id="unconfirmed-check-btn" disabled>Check</button>
            <button type="button" class="btn btn-primary mt-3" id="upload-email-btn" hidden disabled>Upload</button>
            <button type="button" class="btn btn-primary mt-3" id="confirm-email-btn" hidden disabled>Confirm</button>
    
            <div hidden id="progress-div">
                <p id="progress-info"></p>
                <div class="progress mt-3" style="width: 75%" role="progressbar" aria-label="progress bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
            <div id="response-container" class="mt-5">
                <div id="loading-wheel" hidden>
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div id="response"></div>
            </div>
            `
        eContent.append(unconfirmedEmailForm);
    }
    unconfirmedEmailForm.hidden = false;

    const switchListener = unconfirmedEmailForm.querySelector('#switches');
    switchListener.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('inside switchListerner');
        console.log('the target', e.target);
        if (e.target.id === "unconfirmed-email-pattern") {
            return;
        }

        handleSwitches(e);
    })

    function handleSwitches(e) {
        const inputs = switchListener.querySelectorAll('input');
        const patternDiv = unconfirmedEmailForm.querySelector('#email-pattern-div');
        const fileSpan = unconfirmedEmailForm.querySelector('#confirm-file-description');
        const confirmDiv = unconfirmedEmailForm.querySelector('#confirm-email-list-box')
        // disable all other inputs inputs
        for (let input of inputs) {
            if (input.id !== e.target.id) {
                input.checked = false;
            }
        }

        // showing the correct button
        if (e.target.checked === false) {
            unconfirmBtn.disabled = true;
            confirmBtn.disabled = true;
            uploadBtn.disabled = true;
        } else if (e.target.id.includes('unconfirm')) {
            unconfirmBtn.hidden = false;
            unconfirmBtn.disabled = false;
            patternDiv.hidden = false;
            confirmBtn.hidden = true;
            confirmBtn.disabled = true;
            confirmDiv.hidden = true;
            uploadBtn.hidden = true;
            uploadBtn.disabled = true;
            fileSpan.hidden = true;
        } else if (e.target.id.includes('upload')) {
            unconfirmBtn.hidden = true;
            unconfirmBtn.disabled = true;
            patternDiv.hidden = true;
            confirmBtn.hidden = true;
            confirmBtn.disabled = true;
            confirmDiv.hidden = true;
            uploadBtn.disabled = false;
            uploadBtn.hidden = false;
            fileSpan.hidden = false;
        } else {
            unconfirmBtn.hidden = true;
            unconfirmBtn.disabled = true;
            patternDiv.hidden = true;
            confirmBtn.hidden = false;
            // confirmBtn.disabled = false;
            confirmDiv.hidden = false;
            uploadBtn.disabled = true;
            uploadBtn.hidden = true;
            fileSpan.hidden = true;
        }
    }


    const unconfirmBtn = unconfirmedEmailForm.querySelector('#unconfirmed-check-btn');
    const uploadBtn = unconfirmedEmailForm.querySelector('#upload-email-btn');
    const confirmBtn = unconfirmedEmailForm.querySelector('#confirm-email-btn');
    unconfirmBtn.addEventListener('click', handleUnconfirmedCheck);
    confirmBtn.addEventListener('click', handleConfirmCheck);
    uploadBtn.addEventListener('click', handleUploadCheck);

    const emailBox = unconfirmedEmailForm.querySelector('#email-list-box');
    emailBox.addEventListener('input', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const inputSwitch = unconfirmedEmailForm.querySelector('#confirm-email-list-switch');

        confirmBtn.disabled = emailBox.value.length < 1 || !inputSwitch.checked;
    })

    async function handleUnconfirmedCheck(e) {
        e.preventDefault();
        e.stopPropagation();
        unconfirmBtn.disabled = true;

        console.log('Inside handleUnonfirmedCheck');
        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const emailPatternInput = unconfirmedEmailForm.querySelector('#unconfirmed-email-pattern');
        const emailPattern = emailPatternInput.value.trim();
        const emailWarning = unconfirmedEmailForm.querySelector('#email-warning');
        const progresDiv = unconfirmedEmailForm.querySelector('#progress-div');
        const responseContainer = unconfirmedEmailForm.querySelector('#response-container');
        const responseDetails = unconfirmedEmailForm.querySelector('#response');

        if (emailPattern.length < 1) {
            emailWarning.hidden = false;
            emailPatternInput.focus();
            unconfirmBtn.disabled = false;
            return;
        } else {
            emailWarning.hidden = true;
        }

        const requestData = {
            domain: domain,
            token: token,
            pattern: emailPattern
        };

        try {
            // progresDiv.hidden = false;
            responseContainer.querySelector('div').hidden = false; // showing the spinning wheel
            const response = await window.axios.checkUnconfirmedEmails(requestData)
            responseContainer.querySelector('div').hidden = true;
            responseDetails.innerHTML = 'List of unconfirmed emails saved.';
        } catch (error) {
            console.log('There was an error', error);
            responseContainer.querySelector('div').hidden = true;
            errorHandler(error, responseDetails);
        } finally {
            unconfirmBtn.disabled = false;
            progresDiv.hidden = true;
        }
    }

    async function handleUploadCheck(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadBtn.disabled = true;

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const progresDiv = unconfirmedEmailForm.querySelector('#progress-div');
        const progressBar = progresDiv.querySelector('.progress-bar');
        const progressInfo = unconfirmedEmailForm.querySelector('#progress-info');

        progressInfo.innerHTML = '';

        const requestData = {
            domain: domain,
            token: token
        }

        progresDiv.hidden = false;
        window.progressAPI.onUpdateProgress((progress) => {
            progressBar.style.width = `${progress}%`;
        });

        let totalEmails = 0;
        window.dataUpdate.onUpdate((data) => {
            totalEmails = data;
        });
        try {
            const result = await window.fileUpload.confirmEmails(requestData);
            progressInfo.innerHTML += `<h5>Results:</h5><p class="mb-1">Processed:  ${totalEmails}</p>`;
            progressInfo.innerHTML += `<p class="mb-1">Confirmed: ${result.confirmed} <div class="form-text">NOTE: Number of emails confirmed may be different than the number processed if the email didn't need to be confirmed</div></p>`;
            if (result.failed.length > 0) {
                progressBar.parentElement.hidden = true;
                progressInfo.innerHTML += `Failed to confirm ${result.failed.length} emails`;
                errorHandler({ message: `${result.failed[0].reason}` }, progressInfo);
            }
        } catch (error) {
            errorHandler(error, progressInfo);
        } finally {
            uploadBtn.disabled = false;
        }

    }

    async function handleConfirmCheck(e) {
        e.preventDefault();
        e.stopPropagation();
        confirmBtn.disabled = true;

        const domain = document.querySelector('#domain').value.trim();
        const token = document.querySelector('#token').value.trim();
        const progresDiv = unconfirmedEmailForm.querySelector('#progress-div');
        const progressBar = progresDiv.querySelector('.progress-bar');
        const progressInfo = unconfirmedEmailForm.querySelector('#progress-info');
        const emails = emailBox.value.split(/\r?\n|\n|\,/)
            .map((email) => email.trim());

        progressInfo.innerHTML = '';

        const requestData = {
            domain: domain,
            token: token,
            emails: emails
        }

        progresDiv.hidden = false;
        window.progressAPI.onUpdateProgress((progress) => {
            progressBar.style.width = `${progress}%`;
        });

        try {
            const result = await window.axios.confirmEmails(requestData);
            progressInfo.innerHTML += `<h5>Results:</h5><p class="mb-1">Processed:  ${requestData.emails.length}</p>`;
            progressInfo.innerHTML += `<p class="mb-1">Confirmed: ${result.confirmed} <div class="form-text">NOTE: Number of emails confirmed may be different than the number processed if the email didn't need to be confirmed</div></p>`;
            if (result.failed.length > 0) {
                progressBar.parentElement.hidden = true;
                progressInfo.innerHTML += `Failed to confirm ${result.failed.length} emails`;
                errorHandler({ message: `${result.failed[0].reason}` }, progressInfo);
            }
        } catch (error) {
            errorHandler(error, progressInfo);
        } finally {
            confirmBtn.disabled = false;
        }

    }
}