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