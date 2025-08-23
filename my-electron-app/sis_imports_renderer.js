function sisImportsTemplate(e) {
    switch (e.target.id) {
        case 'create-single-sis-file':
            createSingleSISFile(e);
            break;
        case 'create-bulk-sis-files':
            createBulkSISFiles(e);
            break;
        default:
            break;
    }
}

async function createSingleSISFile(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let createSISForm = eContent.querySelector('#create-single-sis-form');

    if (!createSISForm) {
        createSISForm = document.createElement('form');
        createSISForm.id = 'create-single-sis-form';
        createSISForm.innerHTML = `
            <div>
                <h3>Create Single SIS Import File</h3>
                <p class="text-muted">Generate a single CSV file for SIS import with random sample data.</p>
            </div>
            <div class="row mb-3">
                <div class="col-4">
                    <label for="file-type" class="form-label">File Type</label>
                    <select id="file-type" class="form-select" required>
                        <option value="">Select file type...</option>
                        <option value="users">Users</option>
                        <option value="accounts">Accounts</option>
                        <option value="terms">Terms</option>
                        <option value="courses">Courses</option>
                        <option value="sections">Sections</option>
                        <option value="enrollments">Enrollments</option>
                        <option value="group_categories">Group Categories</option>
                        <option value="groups">Groups</option>
                        <option value="group_memberships">Group Memberships</option>
                        <option value="differentiation_tag_sets">Differentiation Tag Sets</option>
                        <option value="differentiation_tags">Differentiation Tags</option>
                        <option value="differentiation_tag_membership">Differentiation Tag Membership</option>
                        <option value="xlists">Cross-listings (Xlists)</option>
                        <option value="user_observers">User Observers</option>
                        <option value="logins">Logins</option>
                        <option value="change_sis_id">Change SIS ID</option>
                        <option value="admins">Admins</option>
                    </select>
                </div>
                <div class="col-4">
                    <label for="row-count" class="form-label">Number of Rows</label>
                    <input type="number" id="row-count" class="form-control" min="1" max="10000" value="10" required>
                    <div class="form-text">How many data rows to generate (1-10,000)</div>
                </div>
                <div class="col-4">
                    <label for="email-domain" class="form-label">Email Domain</label>
                    <input type="text" id="email-domain" class="form-control" value="@school.edu" placeholder="@school.edu">
                    <div class="form-text">Domain for generated email addresses</div>
                </div>
            </div>
            <div class="row mb-3" id="auth-provider-row" style="display: none;">
                <div class="col-8">
                    <label for="auth-provider" class="form-label">Authentication Provider</label>
                    <select id="auth-provider" class="form-select">
                        <option value="">None (Default Canvas Authentication)</option>
                    </select>
                    <div class="form-text">Authentication provider for user logins (applies to Users and Logins CSV types)</div>
                </div>
                <div class="col-4">
                    <button type="button" id="fetch-auth-providers" class="btn btn-outline-info mt-4">
                        Fetch Providers
                    </button>
                    <div class="form-text">Uses domain and token from main form</div>
                </div>
            </div>
            <div class="row mb-3" id="enrollment-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Enrollment Options</h5>
                </div>
                <div class="col-3">
                    <label for="enrollment-type" class="form-label">Enrollment Type</label>
                    <select id="enrollment-type" class="form-select">
                        <option value="mixed">Mixed (Random IDs)</option>
                        <option value="course">Course-based</option>
                        <option value="section">Section-based</option>
                    </select>
                    <div class="form-text">Course/section assignment</div>
                </div>
                <div class="col-3">
                    <label for="specific-id" class="form-label">Course/Section ID</label>
                    <input type="text" id="specific-id" class="form-control" placeholder="e.g., MATH101 or SEC001">
                    <div class="form-text">Leave empty for random IDs</div>
                </div>
                <div class="col-3">
                    <label for="role-type" class="form-label">Role Type</label>
                    <select id="role-type" class="form-select">
                        <option value="mixed">Mixed (Random)</option>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="ta">Teaching Assistant</option>
                    </select>
                    <div class="form-text">User role assignment</div>
                </div>
                <div class="col-3">
                    <label for="specific-user-id" class="form-label">User ID</label>
                    <input type="text" id="specific-user-id" class="form-control" placeholder="e.g., USER123">
                    <div class="form-text">Leave empty for random IDs</div>
                </div>
                <div class="col-3">
                    <label for="enrollment-status" class="form-label">Status</label>
                    <select id="enrollment-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                        <option value="completed">Completed</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <div class="form-text">Enrollment status</div>
                </div>
            </div>
            <div class="row mb-3" id="users-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Users Options</h5>
                </div>
                <div class="col-6">
                    <label for="user-status" class="form-label">Status</label>
                    <select id="user-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">User account status</div>
                </div>
            </div>
            <div class="row mb-3" id="account-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Account Options</h5>
                </div>
                <div class="col-6">
                    <label for="parent-account-id" class="form-label">Parent Account ID</label>
                    <input type="text" id="parent-account-id" class="form-control" placeholder="e.g., ROOT_ACCOUNT or PARENT_123">
                    <div class="form-text">Leave empty for random parent IDs</div>
                </div>
                <div class="col-6">
                    <label for="account-status" class="form-label">Status</label>
                    <select id="account-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Account status</div>
                </div>
            </div>
            <div class="row mb-3" id="terms-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Terms Options</h5>
                </div>
                <div class="col-12 mb-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="terms-no-dates">
                        <label class="form-check-label" for="terms-no-dates">
                            Don't include dates in CSV (leave start_date and end_date empty)
                        </label>
                    </div>
                </div>
                <div class="col-6">
                    <label for="term-start-date" class="form-label">Start Date</label>
                    <input type="datetime-local" id="term-start-date" class="form-control">
                    <div class="form-text">Leave empty for season-based dates</div>
                </div>
                <div class="col-6">
                    <label for="term-end-date" class="form-label">End Date</label>
                    <input type="datetime-local" id="term-end-date" class="form-control">
                    <div class="form-text">Leave empty for season-based dates</div>
                </div>
                <div class="col-6">
                    <label for="term-status" class="form-label">Status</label>
                    <select id="term-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                        <option value="completed">Completed</option>
                    </select>
                    <div class="form-text">Term status</div>
                </div>
            </div>
            <div class="row mb-3" id="courses-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Courses Options</h5>
                </div>
                <div class="col-6">
                    <label for="course-status" class="form-label">Status</label>
                    <select id="course-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                        <option value="completed">Completed</option>
                    </select>
                    <div class="form-text">Course status</div>
                </div>
                <div class="col-6">
                    <label for="course-account-id" class="form-label">Account ID</label>
                    <input type="text" id="course-account-id" class="form-control" placeholder="e.g., ACCT123">
                    <div class="form-text">Leave empty for random account IDs</div>
                </div>
                <div class="col-6">
                    <label for="course-term-id" class="form-label">Term ID</label>
                    <input type="text" id="course-term-id" class="form-control" placeholder="e.g., TERM123">
                    <div class="form-text">Leave empty for random term IDs</div>
                </div>
            </div>
            <div class="row mb-3" id="sections-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Sections Options</h5>
                </div>
                <div class="col-6">
                    <label for="section-course-id" class="form-label">Course ID</label>
                    <input type="text" id="section-course-id" class="form-control" placeholder="e.g., MATH101">
                    <div class="form-text">Leave empty for random course IDs</div>
                </div>
                <div class="col-6">
                    <label for="section-status" class="form-label">Status</label>
                    <select id="section-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                        <option value="completed">Completed</option>
                    </select>
                    <div class="form-text">Section status</div>
                </div>
            </div>
            <div class="row mb-3" id="group-categories-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Group Categories Options</h5>
                    <div class="alert alert-info" style="font-size: 0.9em; padding: 8px 12px; margin-bottom: 15px;">
                        <strong>Scope Selection:</strong> Group categories can be scoped to either an Account OR a Course, but not both. 
                        If both fields are filled, Account ID takes priority and Course ID will be ignored.
                    </div>
                </div>
                <div class="col-4">
                    <label for="group-category-account-id" class="form-label">Account ID</label>
                    <input type="text" id="group-category-account-id" class="form-control" placeholder="e.g., MAIN_ACCOUNT">
                    <div class="form-text">Leave empty for random account IDs</div>
                    <div class="form-text text-warning" id="account-priority-warning" style="display: none;">
                        <small><strong>Account ID takes priority</strong> - Course ID will be ignored</small>
                    </div>
                </div>
                <div class="col-4">
                    <label for="group-category-course-id" class="form-label">Course ID</label>
                    <input type="text" id="group-category-course-id" class="form-control" placeholder="e.g., MATH101">
                    <div class="form-text">Leave empty for random course IDs</div>
                    <div class="form-text text-muted" id="course-disabled-warning" style="display: none;">
                        <small><em>Course ID ignored when Account ID is specified</em></small>
                    </div>
                </div>
                <div class="col-4">
                    <label for="group-category-status" class="form-label">Status</label>
                    <select id="group-category-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Group category status</div>
                </div>
            </div>
            <div class="row mb-3" id="groups-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Groups Options</h5>
                </div>
                <div class="col-6">
                    <label for="group-account-id" class="form-label">Account ID</label>
                    <input type="text" id="group-account-id" class="form-control" placeholder="e.g., MAIN_ACCOUNT">
                    <div class="form-text">Leave empty for random account IDs</div>
                </div>
                <div class="col-6">
                    <label for="group-status" class="form-label">Status</label>
                    <select id="group-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="available">Available</option>
                        <option value="closed">Closed</option>
                        <option value="completed">Completed</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Group status</div>
                </div>
            </div>
            <div class="row mb-3" id="group-memberships-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Group Memberships Options</h5>
                </div>
                <div class="col-4">
                    <label for="group-membership-group-id" class="form-label">Group ID</label>
                    <input type="text" id="group-membership-group-id" class="form-control" placeholder="e.g., GROUP_001">
                    <div class="form-text">Leave empty for random group IDs</div>
                </div>
                <div class="col-4">
                    <label for="group-membership-user-id" class="form-label">User ID</label>
                    <input type="text" id="group-membership-user-id" class="form-control" placeholder="e.g., USER123">
                    <div class="form-text">Leave empty for random user IDs</div>
                </div>
                <div class="col-4">
                    <label for="group-membership-status" class="form-label">Status</label>
                    <select id="group-membership-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="accepted">Accepted</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Membership status</div>
                </div>
            </div>
            <div class="row mb-3" id="admins-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Admins Options</h5>
                </div>
                <div class="col-3">
                    <label for="admin-user-id" class="form-label">User ID</label>
                    <input type="text" id="admin-user-id" class="form-control" placeholder="e.g., USER123">
                    <div class="form-text">Leave empty for random user IDs</div>
                </div>
                <div class="col-3">
                    <label for="admin-account-id" class="form-label">Account ID</label>
                    <input type="text" id="admin-account-id" class="form-control" placeholder="e.g., MAIN_ACCOUNT">
                    <div class="form-text">Leave empty for random account IDs</div>
                </div>
                <div class="col-3">
                    <label for="admin-role" class="form-label">Role</label>
                    <select id="admin-role" class="form-select">
                        <option value="">Random Role</option>
                        <option value="AccountAdmin">Account Admin</option>
                        <option value="CustomAdmin">Custom Admin</option>
                        <option value="SubAccountAdmin">Sub Account Admin</option>
                    </select>
                    <div class="form-text">Admin role</div>
                </div>
                <div class="col-3">
                    <label for="admin-status" class="form-label">Status</label>
                    <select id="admin-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Admin status</div>
                </div>
            </div>
            <div class="row mb-3" id="logins-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Logins Options</h5>
                </div>
                <div class="col-6">
                    <label for="login-user-id" class="form-label">User ID</label>
                    <input type="text" id="login-user-id" class="form-control" placeholder="e.g., USER123">
                    <div class="form-text">Leave empty for random user IDs</div>
                </div>
            </div>
            <div class="row mb-3" id="cross-listings-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Cross-listings Options</h5>
                </div>
                <div class="col-4">
                    <label for="cross-listing-course-id" class="form-label">Course ID</label>
                    <input type="text" id="cross-listing-course-id" class="form-control" placeholder="e.g., MATH101">
                    <div class="form-text">Leave empty for random course IDs</div>
                </div>
                <div class="col-4">
                    <label for="cross-listing-section-id" class="form-label">Section ID</label>
                    <input type="text" id="cross-listing-section-id" class="form-control" placeholder="e.g., SEC001">
                    <div class="form-text">Leave empty for random section IDs</div>
                </div>
                <div class="col-4">
                    <label for="cross-listing-status" class="form-label">Status</label>
                    <select id="cross-listing-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Cross-listing status</div>
                </div>
            </div>
            <div class="row mb-3" id="user-observers-options-row" style="display: none;">
                <div class="col-12">
                    <h5>User Observers Options</h5>
                </div>
                <div class="col-4">
                    <label for="user-observer-observer-id" class="form-label">Observer ID</label>
                    <input type="text" id="user-observer-observer-id" class="form-control" placeholder="e.g., OBS123">
                    <div class="form-text">Leave empty for random observer IDs</div>
                </div>
                <div class="col-4">
                    <label for="user-observer-student-id" class="form-label">Student ID</label>
                    <input type="text" id="user-observer-student-id" class="form-control" placeholder="e.g., STU456">
                    <div class="form-text">Leave empty for random student IDs</div>
                </div>
                <div class="col-4">
                    <label for="user-observer-status" class="form-label">Status</label>
                    <select id="user-observer-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Observer relationship status</div>
                </div>
            </div>
            <div class="row mb-3" id="change-sis-id-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Change SIS ID Options</h5>
                </div>
                <div class="col-4">
                    <label for="change-sis-old-id" class="form-label">Old ID</label>
                    <input type="text" id="change-sis-old-id" class="form-control" placeholder="e.g., OLD123">
                    <div class="form-text">Leave empty for random old IDs</div>
                </div>
                <div class="col-4">
                    <label for="change-sis-new-id" class="form-label">New ID</label>
                    <input type="text" id="change-sis-new-id" class="form-control" placeholder="e.g., NEW123">
                    <div class="form-text">Leave empty for random new IDs</div>
                </div>
                <div class="col-4">
                    <label for="change-sis-type" class="form-label">Type</label>
                    <select id="change-sis-type" class="form-select">
                        <option value="">Random Type</option>
                        <option value="user">User</option>
                        <option value="course">Course</option>
                        <option value="section">Section</option>
                        <option value="account">Account</option>
                    </select>
                    <div class="form-text">SIS ID change type</div>
                </div>
            </div>
            <div class="row mb-3" id="differentiation-tag-sets-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Differentiation Tag Sections Options</h5>
                </div>
                <div class="col-6">
                    <label for="diff-tag-set-course-id" class="form-label">Course ID</label>
                    <input type="text" id="diff-tag-set-course-id" class="form-control" placeholder="e.g., MATH101">
                    <div class="form-text">Leave empty for random course IDs</div>
                </div>
                <div class="col-6">
                    <label for="diff-tag-set-status" class="form-label">Status</label>
                    <select id="diff-tag-set-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Tag set status</div>
                </div>
            </div>
            <div class="row mb-3" id="differentiation-tags-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Differentiation Tags Options</h5>
                </div>
                <div class="col-6">
                    <label for="diff-tag-course-id" class="form-label">Course ID</label>
                    <input type="text" id="diff-tag-course-id" class="form-control" placeholder="e.g., MATH101">
                    <div class="form-text">Leave empty for random course IDs</div>
                </div>
                <div class="col-6">
                    <label for="diff-tag-status" class="form-label">Status</label>
                    <select id="diff-tag-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Tag status</div>
                </div>
            </div>
            <div class="row mb-3" id="differentiation-tag-membership-options-row" style="display: none;">
                <div class="col-12">
                    <h5>Differentiation Tag Memberships Options</h5>
                </div>
                <div class="col-6">
                    <label for="diff-tag-member-user-id" class="form-label">User ID</label>
                    <input type="text" id="diff-tag-member-user-id" class="form-control" placeholder="e.g., USER123">
                    <div class="form-text">Leave empty for random user IDs</div>
                </div>
                <div class="col-6">
                    <label for="diff-tag-member-status" class="form-label">Status</label>
                    <select id="diff-tag-member-status" class="form-select">
                        <option value="">Random Status</option>
                        <option value="active">Active</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <div class="form-text">Membership status</div>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-12">
                    <label for="output-path" class="form-label">Output Folder</label>
                    <div class="input-group">
                        <input type="text" id="output-path" class="form-control" placeholder="Select output folder..." readonly>
                        <button type="button" id="browse-folder" class="btn btn-outline-secondary">Browse</button>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <button type="submit" id="generate-single-file" class="btn btn-primary">Generate CSV File</button>
                    <button type="button" id="preview-data" class="btn btn-outline-info ms-2">Preview Sample Data</button>
                </div>
            </div>
            <div id="preview-container" class="mt-4" style="display: none;">
                <h5>Preview (First 5 Rows)</h5>
                <pre id="preview-content" class="bg-light p-3 border rounded" style="max-height: 300px; overflow-y: auto;"></pre>
            </div>
            <div id="result-container" class="mt-4" style="display: none;">
                <div id="result-message" class="alert"></div>
            </div>
        `;
        eContent.appendChild(createSISForm);
    } else {
        // Form already exists, just show it
        createSISForm.hidden = false;
    }

    // Event listeners (moved outside the if block so they work for both new and existing forms)
    if (!createSISForm.hasAttribute('data-listeners-added')) {
        document.getElementById('browse-folder').addEventListener('click', async () => {
            const result = await window.electronAPI.selectFolder();
            if (result) {
                document.getElementById('output-path').value = result;
            }
        });

        // Show/hide auth provider selector and enrollment options based on file type
        document.getElementById('file-type').addEventListener('change', (e) => {
            const authProviderRow = document.getElementById('auth-provider-row');
            const enrollmentOptionsRow = document.getElementById('enrollment-options-row');
            const usersOptionsRow = document.getElementById('users-options-row');
            const accountOptionsRow = document.getElementById('account-options-row');
            const termsOptionsRow = document.getElementById('terms-options-row');
            const coursesOptionsRow = document.getElementById('courses-options-row');
            const sectionsOptionsRow = document.getElementById('sections-options-row');
            const groupCategoriesOptionsRow = document.getElementById('group-categories-options-row');
            const groupsOptionsRow = document.getElementById('groups-options-row');
            const groupMembershipsOptionsRow = document.getElementById('group-memberships-options-row');
            const adminsOptionsRow = document.getElementById('admins-options-row');
            const loginsOptionsRow = document.getElementById('logins-options-row');
            const crossListingsOptionsRow = document.getElementById('cross-listings-options-row');
            const userObserversOptionsRow = document.getElementById('user-observers-options-row');
            const changeSisIdOptionsRow = document.getElementById('change-sis-id-options-row');
            const differentiationTagSetsOptionsRow = document.getElementById('differentiation-tag-sets-options-row');
            const differentiationTagsOptionsRow = document.getElementById('differentiation-tags-options-row');
            const differentiationTagMembershipOptionsRow = document.getElementById('differentiation-tag-membership-options-row');

            if (e.target.value === 'users' || e.target.value === 'logins') {
                authProviderRow.style.display = 'block';
            } else {
                authProviderRow.style.display = 'none';
            }

            if (e.target.value === 'users') {
                usersOptionsRow.style.display = 'block';
            } else {
                usersOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'enrollments') {
                enrollmentOptionsRow.style.display = 'block';
                // Initialize Course/Section ID field visibility based on current enrollment type
                const enrollmentType = document.getElementById('enrollment-type').value;
                const specificIdColumn = document.getElementById('specific-id').closest('.col-3');
                if (enrollmentType === 'mixed') {
                    specificIdColumn.style.display = 'none';
                } else {
                    specificIdColumn.style.display = 'block';
                }
            } else {
                enrollmentOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'accounts') {
                accountOptionsRow.style.display = 'block';
            } else {
                accountOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'terms') {
                termsOptionsRow.style.display = 'block';
            } else {
                termsOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'courses') {
                coursesOptionsRow.style.display = 'block';
            } else {
                coursesOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'sections') {
                sectionsOptionsRow.style.display = 'block';
            } else {
                sectionsOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'group_categories') {
                groupCategoriesOptionsRow.style.display = 'block';
            } else {
                groupCategoriesOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'groups') {
                groupsOptionsRow.style.display = 'block';
            } else {
                groupsOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'group_memberships') {
                groupMembershipsOptionsRow.style.display = 'block';
            } else {
                groupMembershipsOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'admins') {
                adminsOptionsRow.style.display = 'block';
            } else {
                adminsOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'logins') {
                loginsOptionsRow.style.display = 'block';
            } else {
                loginsOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'xlists') {
                crossListingsOptionsRow.style.display = 'block';
            } else {
                crossListingsOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'user_observers') {
                userObserversOptionsRow.style.display = 'block';
            } else {
                userObserversOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'change_sis_id') {
                changeSisIdOptionsRow.style.display = 'block';
            } else {
                changeSisIdOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'differentiation_tag_sets') {
                differentiationTagSetsOptionsRow.style.display = 'block';
            } else {
                differentiationTagSetsOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'differentiation_tags') {
                differentiationTagsOptionsRow.style.display = 'block';
            } else {
                differentiationTagsOptionsRow.style.display = 'none';
            }

            if (e.target.value === 'differentiation_tag_membership') {
                differentiationTagMembershipOptionsRow.style.display = 'block';
            } else {
                differentiationTagMembershipOptionsRow.style.display = 'none';
            }
        });

        // Show/hide Course/Section ID field based on enrollment type
        document.getElementById('enrollment-type').addEventListener('change', (e) => {
            const specificIdColumn = document.getElementById('specific-id').closest('.col-3');

            if (e.target.value === 'mixed') {
                // Hide Course/Section ID field for mixed mode since random IDs are used
                specificIdColumn.style.display = 'none';
            } else {
                // Show Course/Section ID field for course-based and section-based modes
                specificIdColumn.style.display = 'block';
            }
        });

        // Fetch authentication providers
        document.getElementById('fetch-auth-providers').addEventListener('click', async () => {
            const button = document.getElementById('fetch-auth-providers');
            const select = document.getElementById('auth-provider');

            // Get domain and token from main form
            const domain = document.getElementById('domain').value;
            const token = document.getElementById('token').value;

            if (!domain || !token) {
                showResult('Please enter Canvas domain and token in the main form first.', 'warning');
                return;
            }

            try {
                button.disabled = true;
                button.textContent = 'Fetching...';

                const providers = await window.electronAPI.fetchAuthProviders(domain, token);

                // Clear existing options except the default
                select.innerHTML = '<option value="">None (Default Canvas Authentication)</option>';

                // Add fetched providers
                providers.forEach(provider => {
                    const option = document.createElement('option');
                    option.value = provider.id;
                    option.textContent = provider.display_name;
                    select.appendChild(option);
                });

                showResult(`Found ${providers.length} authentication provider(s).`, 'success');

            } catch (error) {
                showResult(`Error fetching authentication providers: ${error.message}`, 'danger');
            } finally {
                button.disabled = false;
                button.textContent = 'Fetch Providers';
            }
        });

        // Group Categories field interaction handling
        const accountIdField = document.getElementById('group-category-account-id');
        const courseIdField = document.getElementById('group-category-course-id');
        const accountWarning = document.getElementById('account-priority-warning');
        const courseWarning = document.getElementById('course-disabled-warning');

        function updateGroupCategoryFields() {
            const accountValue = accountIdField.value.trim();
            const courseValue = courseIdField.value.trim();

            if (accountValue && courseValue) {
                // Both fields filled - show priority warning
                accountWarning.style.display = 'block';
                courseWarning.style.display = 'block';
                courseIdField.style.opacity = '0.6';
            } else if (accountValue) {
                // Only account filled
                accountWarning.style.display = 'none';
                courseWarning.style.display = 'none';
                courseIdField.style.opacity = '1';
            } else {
                // Account empty or both empty
                accountWarning.style.display = 'none';
                courseWarning.style.display = 'none';
                courseIdField.style.opacity = '1';
            }
        }

        accountIdField.addEventListener('input', updateGroupCategoryFields);
        courseIdField.addEventListener('input', updateGroupCategoryFields);

        document.getElementById('preview-data').addEventListener('click', async () => {
            const fileType = document.getElementById('file-type').value;
            const rowCount = Math.min(5, parseInt(document.getElementById('row-count').value) || 5);
            const emailDomain = document.getElementById('email-domain').value.trim() || '@school.edu';
            const authProviderId = document.getElementById('auth-provider').value || '';

            // Get enrollment options
            const enrollmentOptions = {};
            if (fileType === 'enrollments') {
                enrollmentOptions.enrollmentType = document.getElementById('enrollment-type').value || 'mixed';
                enrollmentOptions.specificId = document.getElementById('specific-id').value.trim() || '';
                enrollmentOptions.roleType = document.getElementById('role-type').value || 'mixed';
                enrollmentOptions.specificUserId = document.getElementById('specific-user-id').value.trim() || '';
                enrollmentOptions.specificStatus = document.getElementById('enrollment-status').value || '';
            }

            // Get users options
            const userOptions = {};
            if (fileType === 'users') {
                userOptions.specificStatus = document.getElementById('user-status').value || '';
            }

            // Get account options
            const accountOptions = {};
            if (fileType === 'accounts') {
                accountOptions.specificParentAccountId = document.getElementById('parent-account-id').value.trim() || '';
                accountOptions.specificStatus = document.getElementById('account-status').value || '';
            }

            // Get terms options
            const termOptions = {};
            if (fileType === 'terms') {
                termOptions.noDates = document.getElementById('terms-no-dates').checked;
                termOptions.specificStatus = document.getElementById('term-status').value || '';

                if (!termOptions.noDates) {
                    const startDate = document.getElementById('term-start-date').value;
                    const endDate = document.getElementById('term-end-date').value;
                    if (startDate && endDate) {
                        // Convert to the format expected by the backend (with seconds)
                        termOptions.specificStartDate = startDate.replace('T', ' ') + ':00';
                        termOptions.specificEndDate = endDate.replace('T', ' ') + ':00';
                    }
                }
            }

            // Get courses options
            const courseOptions = {};
            if (fileType === 'courses') {
                courseOptions.specificStatus = document.getElementById('course-status').value || '';
                courseOptions.specificAccountId = document.getElementById('course-account-id').value.trim() || '';
                courseOptions.specificTermId = document.getElementById('course-term-id').value.trim() || '';
            }

            // Get sections options
            const sectionOptions = {};
            if (fileType === 'sections') {
                sectionOptions.specificCourseId = document.getElementById('section-course-id').value.trim() || '';
                sectionOptions.specificStatus = document.getElementById('section-status').value || '';
            }

            // Get group categories options
            const groupCategoryOptions = {};
            if (fileType === 'group_categories') {
                groupCategoryOptions.specificAccountId = document.getElementById('group-category-account-id').value.trim() || '';
                groupCategoryOptions.specificCourseId = document.getElementById('group-category-course-id').value.trim() || '';
                groupCategoryOptions.specificStatus = document.getElementById('group-category-status').value || '';
            }

            // Get groups options
            const groupOptions = {};
            if (fileType === 'groups') {
                groupOptions.specificAccountId = document.getElementById('group-account-id').value.trim() || '';
                groupOptions.specificStatus = document.getElementById('group-status').value || '';
            }

            // Get group memberships options
            const groupMembershipOptions = {};
            if (fileType === 'group_memberships') {
                groupMembershipOptions.specificGroupId = document.getElementById('group-membership-group-id').value.trim() || '';
                groupMembershipOptions.specificUserId = document.getElementById('group-membership-user-id').value.trim() || '';
                groupMembershipOptions.specificStatus = document.getElementById('group-membership-status').value || '';
            }

            // Get admins options
            const adminOptions = {};
            if (fileType === 'admins') {
                adminOptions.specificUserId = document.getElementById('admin-user-id').value.trim() || '';
                adminOptions.specificAccountId = document.getElementById('admin-account-id').value.trim() || '';
                adminOptions.specificRole = document.getElementById('admin-role').value || '';
                adminOptions.specificStatus = document.getElementById('admin-status').value || '';
            }

            // Get logins options
            const loginOptions = {};
            if (fileType === 'logins') {
                loginOptions.specificUserId = document.getElementById('login-user-id').value.trim() || '';
            }

            // Get cross-listings options
            const crossListingOptions = {};
            if (fileType === 'xlists') {
                crossListingOptions.specificCourseId = document.getElementById('cross-listing-course-id').value.trim() || '';
                crossListingOptions.specificSectionId = document.getElementById('cross-listing-section-id').value.trim() || '';
                crossListingOptions.specificStatus = document.getElementById('cross-listing-status').value || '';
            }

            // Get user observers options
            const userObserverOptions = {};
            if (fileType === 'user_observers') {
                userObserverOptions.specificObserverId = document.getElementById('user-observer-observer-id').value.trim() || '';
                userObserverOptions.specificStudentId = document.getElementById('user-observer-student-id').value.trim() || '';
                userObserverOptions.specificStatus = document.getElementById('user-observer-status').value || '';
            }

            // Get change SIS ID options
            const changeSisIdOptions = {};
            if (fileType === 'change_sis_id') {
                changeSisIdOptions.specificOldId = document.getElementById('change-sis-old-id').value.trim() || '';
                changeSisIdOptions.specificNewId = document.getElementById('change-sis-new-id').value.trim() || '';
                changeSisIdOptions.specificType = document.getElementById('change-sis-type').value || '';
            }

            if (!fileType) {
                showResult('Please select a file type first.', 'warning');
                return;
            }

            try {
                const allOptions = { enrollmentOptions, userOptions, accountOptions, termOptions, courseOptions, sectionOptions, groupCategoryOptions, groupOptions, groupMembershipOptions, adminOptions, loginOptions, crossListingOptions, userObserverOptions, changeSisIdOptions };
                const previewData = await window.electronAPI.previewSISData(fileType, rowCount, emailDomain, authProviderId, allOptions);
                document.getElementById('preview-content').textContent = previewData;
                document.getElementById('preview-container').style.display = 'block';
            } catch (error) {
                showResult(`Error generating preview: ${error.message}`, 'danger');
            }
        });

        createSISForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const fileType = document.getElementById('file-type').value;
            const rowCount = parseInt(document.getElementById('row-count').value);
            const outputPath = document.getElementById('output-path').value;
            const emailDomain = document.getElementById('email-domain').value.trim() || '@school.edu';
            const authProviderId = document.getElementById('auth-provider').value || '';

            // Get enrollment options
            const enrollmentOptions = {};
            if (fileType === 'enrollments') {
                enrollmentOptions.enrollmentType = document.getElementById('enrollment-type').value || 'mixed';
                enrollmentOptions.specificId = document.getElementById('specific-id').value.trim() || '';
                enrollmentOptions.roleType = document.getElementById('role-type').value || 'mixed';
                enrollmentOptions.specificUserId = document.getElementById('specific-user-id').value.trim() || '';
                enrollmentOptions.specificStatus = document.getElementById('enrollment-status').value || '';
            }

            // Get users options
            const userOptions = {};
            if (fileType === 'users') {
                userOptions.specificStatus = document.getElementById('user-status').value || '';
            }

            // Get account options
            const accountOptions = {};
            if (fileType === 'accounts') {
                accountOptions.specificParentAccountId = document.getElementById('parent-account-id').value.trim() || '';
                accountOptions.specificStatus = document.getElementById('account-status').value || '';
            }

            // Get terms options
            const termOptions = {};
            if (fileType === 'terms') {
                termOptions.noDates = document.getElementById('terms-no-dates').checked;
                termOptions.specificStatus = document.getElementById('term-status').value || '';

                if (!termOptions.noDates) {
                    const startDate = document.getElementById('term-start-date').value;
                    const endDate = document.getElementById('term-end-date').value;
                    if (startDate && endDate) {
                        // Convert to the format expected by the backend (with seconds)
                        termOptions.specificStartDate = startDate.replace('T', ' ') + ':00';
                        termOptions.specificEndDate = endDate.replace('T', ' ') + ':00';
                    }
                }
            }

            // Get courses options
            const courseOptions = {};
            if (fileType === 'courses') {
                courseOptions.specificStatus = document.getElementById('course-status').value || '';
                courseOptions.specificAccountId = document.getElementById('course-account-id').value.trim() || '';
                courseOptions.specificTermId = document.getElementById('course-term-id').value.trim() || '';
            }

            // Get sections options
            const sectionOptions = {};
            if (fileType === 'sections') {
                sectionOptions.specificCourseId = document.getElementById('section-course-id').value.trim() || '';
                sectionOptions.specificStatus = document.getElementById('section-status').value || '';
            }

            // Get group categories options
            const groupCategoryOptions = {};
            if (fileType === 'group_categories') {
                groupCategoryOptions.specificAccountId = document.getElementById('group-category-account-id').value.trim() || '';
                groupCategoryOptions.specificCourseId = document.getElementById('group-category-course-id').value.trim() || '';
                groupCategoryOptions.specificStatus = document.getElementById('group-category-status').value || '';
            }

            // Get groups options
            const groupOptions = {};
            if (fileType === 'groups') {
                groupOptions.specificAccountId = document.getElementById('group-account-id').value.trim() || '';
                groupOptions.specificStatus = document.getElementById('group-status').value || '';
            }

            // Get group memberships options
            const groupMembershipOptions = {};
            if (fileType === 'group_memberships') {
                groupMembershipOptions.specificGroupId = document.getElementById('group-membership-group-id').value.trim() || '';
                groupMembershipOptions.specificUserId = document.getElementById('group-membership-user-id').value.trim() || '';
                groupMembershipOptions.specificStatus = document.getElementById('group-membership-status').value || '';
            }

            // Get admins options
            const adminOptions = {};
            if (fileType === 'admins') {
                adminOptions.specificUserId = document.getElementById('admin-user-id').value.trim() || '';
                adminOptions.specificAccountId = document.getElementById('admin-account-id').value.trim() || '';
                adminOptions.specificRole = document.getElementById('admin-role').value || '';
                adminOptions.specificStatus = document.getElementById('admin-status').value || '';
            }

            // Get logins options
            const loginOptions = {};
            if (fileType === 'logins') {
                loginOptions.specificUserId = document.getElementById('login-user-id').value.trim() || '';
            }

            // Get cross-listings options
            const crossListingOptions = {};
            if (fileType === 'xlists') {
                crossListingOptions.specificCourseId = document.getElementById('cross-listing-course-id').value.trim() || '';
                crossListingOptions.specificSectionId = document.getElementById('cross-listing-section-id').value.trim() || '';
                crossListingOptions.specificStatus = document.getElementById('cross-listing-status').value || '';
            }

            // Get user observers options
            const userObserverOptions = {};
            if (fileType === 'user_observers') {
                userObserverOptions.specificObserverId = document.getElementById('user-observer-observer-id').value.trim() || '';
                userObserverOptions.specificStudentId = document.getElementById('user-observer-student-id').value.trim() || '';
                userObserverOptions.specificStatus = document.getElementById('user-observer-status').value || '';
            }

            // Get change SIS ID options
            const changeSisIdOptions = {};
            if (fileType === 'change_sis_id') {
                changeSisIdOptions.specificOldId = document.getElementById('change-sis-old-id').value.trim() || '';
                changeSisIdOptions.specificNewId = document.getElementById('change-sis-new-id').value.trim() || '';
                changeSisIdOptions.specificType = document.getElementById('change-sis-type').value || '';
            }

            // Get differentiation tag sets options
            const differentiationTagSetOptions = {};
            if (fileType === 'differentiation_tag_sets') {
                differentiationTagSetOptions.specificCourseId = document.getElementById('diff-tag-set-course-id').value.trim() || '';
                differentiationTagSetOptions.specificStatus = document.getElementById('diff-tag-set-status').value || '';
            }

            // Get differentiation tags options
            const differentiationTagOptions = {};
            if (fileType === 'differentiation_tags') {
                differentiationTagOptions.specificCourseId = document.getElementById('diff-tag-course-id').value.trim() || '';
                differentiationTagOptions.specificStatus = document.getElementById('diff-tag-status').value || '';
            }

            // Get differentiation tag membership options
            const differentiationTagMembershipOptions = {};
            if (fileType === 'differentiation_tag_membership') {
                differentiationTagMembershipOptions.specificUserId = document.getElementById('diff-tag-member-user-id').value.trim() || '';
                differentiationTagMembershipOptions.specificStatus = document.getElementById('diff-tag-member-status').value || '';
            }

            if (!fileType || !rowCount || !outputPath) {
                showResult('Please fill in all required fields.', 'warning');
                return;
            }

            try {
                const button = document.getElementById('generate-single-file');
                button.disabled = true;
                button.textContent = 'Generating...';

                const allOptions = { enrollmentOptions, userOptions, accountOptions, termOptions, courseOptions, sectionOptions, groupCategoryOptions, groupOptions, groupMembershipOptions, adminOptions, loginOptions, crossListingOptions, userObserverOptions, changeSisIdOptions, differentiationTagSetOptions, differentiationTagOptions, differentiationTagMembershipOptions };
                const result = await window.electronAPI.createSISFile(fileType, rowCount, outputPath, emailDomain, authProviderId, allOptions);
                showResult(`Successfully created ${result.fileName} with ${rowCount} rows at ${result.filePath}`, 'success');

                button.disabled = false;
                button.textContent = 'Generate CSV File';
            } catch (error) {
                showResult(`Error creating file: ${error.message}`, 'danger');
                document.getElementById('generate-single-file').disabled = false;
                document.getElementById('generate-single-file').textContent = 'Generate CSV File';
            }
        });

        // Mark that event listeners have been added
        createSISForm.setAttribute('data-listeners-added', 'true');
    }

    function showResult(message, type) {
        const resultContainer = document.getElementById('result-container');
        const resultMessage = document.getElementById('result-message');

        resultMessage.className = `alert alert-${type}`;
        resultMessage.textContent = message;
        resultContainer.style.display = 'block';

        // Auto hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                resultContainer.style.display = 'none';
            }, 5000);
        }
    }
}

async function createBulkSISFiles(e) {
    hideEndpoints(e);

    const eContent = document.querySelector('#endpoint-content');
    let createBulkSISForm = eContent.querySelector('#create-bulk-sis-form');

    if (!createBulkSISForm) {
        createBulkSISForm = document.createElement('form');
        createBulkSISForm.id = 'create-bulk-sis-form';
        createBulkSISForm.innerHTML = `
            <div>
                <h3>Create Bulk SIS Import Files</h3>
                <p class="text-muted">Generate multiple CSV files for a complete SIS import package.</p>
            </div>
            <div class="row mb-3">
                <div class="col-12">
                    <label class="form-label">Select File Types and Row Counts</label>
                    <div class="border rounded p-3">
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-users" class="form-check-input" checked>
                            </div>
                            <div class="col-3">
                                <label for="include-users" class="form-check-label">Users</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="users-count" class="form-control form-control-sm" min="1" max="10000" value="50">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Student and teacher user accounts</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-accounts" class="form-check-input" checked>
                            </div>
                            <div class="col-3">
                                <label for="include-accounts" class="form-check-label">Accounts</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="accounts-count" class="form-control form-control-sm" min="1" max="1000" value="10">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Department and organizational accounts</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-terms" class="form-check-input" checked>
                            </div>
                            <div class="col-3">
                                <label for="include-terms" class="form-check-label">Terms</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="terms-count" class="form-control form-control-sm" min="1" max="100" value="4">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Academic terms (Fall, Spring, etc.)</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-courses" class="form-check-input" checked>
                            </div>
                            <div class="col-3">
                                <label for="include-courses" class="form-check-label">Courses</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="courses-count" class="form-control form-control-sm" min="1" max="5000" value="25">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Course listings</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-sections" class="form-check-input" checked>
                            </div>
                            <div class="col-3">
                                <label for="include-sections" class="form-check-label">Sections</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="sections-count" class="form-control form-control-sm" min="1" max="10000" value="50">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Course sections</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-enrollments" class="form-check-input" checked>
                            </div>
                            <div class="col-3">
                                <label for="include-enrollments" class="form-check-label">Enrollments</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="enrollments-count" class="form-control form-control-sm" min="1" max="50000" value="200">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Student and teacher enrollments</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-groups" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-groups" class="form-check-label">Groups</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="groups-count" class="form-control form-control-sm" min="1" max="1000" value="15">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Student groups</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-group-categories" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-group-categories" class="form-check-label">Group Categories</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="group-categories-count" class="form-control form-control-sm" min="1" max="100" value="5">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Group category definitions</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-admins" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-admins" class="form-check-label">Admins</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="admins-count" class="form-control form-control-sm" min="1" max="100" value="5">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Administrative user roles</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-group-memberships" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-group-memberships" class="form-check-label">Group Memberships</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="group-memberships-count" class="form-control form-control-sm" min="1" max="1000" value="30">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">User group membership assignments</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-differentiation-tag-sets" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-differentiation-tag-sets" class="form-check-label">Differentiation Tag Sets</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="differentiation-tag-sets-count" class="form-control form-control-sm" min="1" max="50" value="5">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Tag set definitions for differentiation</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-differentiation-tags" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-differentiation-tags" class="form-check-label">Differentiation Tags</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="differentiation-tags-count" class="form-control form-control-sm" min="1" max="200" value="15">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Individual differentiation tags</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-differentiation-tag-membership" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-differentiation-tag-membership" class="form-check-label">Differentiation Tag Membership</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="differentiation-tag-membership-count" class="form-control form-control-sm" min="1" max="500" value="25">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">User tag assignments</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-xlists" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-xlists" class="form-check-label">Cross-listings (Xlists)</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="xlists-count" class="form-control form-control-sm" min="1" max="200" value="10">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Course cross-listing assignments</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-user-observers" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-user-observers" class="form-check-label">User Observers</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="user-observers-count" class="form-control form-control-sm" min="1" max="500" value="20">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Observer-student relationships</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-logins" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-logins" class="form-check-label">Logins</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="logins-count" class="form-control form-control-sm" min="1" max="1000" value="25">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">Additional login credentials</small>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-1">
                                <input type="checkbox" id="include-change-sis-id" class="form-check-input">
                            </div>
                            <div class="col-3">
                                <label for="include-change-sis-id" class="form-check-label">Change SIS ID</label>
                            </div>
                            <div class="col-3">
                                <input type="number" id="change-sis-id-count" class="form-control form-control-sm" min="1" max="500" value="10">
                            </div>
                            <div class="col-5">
                                <small class="text-muted">SIS ID change requests</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-12">
                    <label for="bulk-output-path" class="form-label">Output Folder</label>
                    <div class="input-group">
                        <input type="text" id="bulk-output-path" class="form-control" placeholder="Select output folder..." readonly>
                        <button type="button" id="browse-bulk-folder" class="btn btn-outline-secondary">Browse</button>
                    </div>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <label for="bulk-email-domain" class="form-label">Email Domain</label>
                    <input type="text" id="bulk-email-domain" class="form-control" value="@school.edu" placeholder="@school.edu">
                    <div class="form-text">Domain for generated email addresses</div>
                </div>
                <div class="col-6">
                    <label for="bulk-auth-provider" class="form-label">Authentication Provider</label>
                    <select id="bulk-auth-provider" class="form-select">
                        <option value="">None (Default Canvas Authentication)</option>
                    </select>
                    <div class="form-text">Auth provider for user accounts (only applies if Users is selected)</div>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <button type="button" id="fetch-bulk-auth-providers" class="btn btn-outline-info">
                        Fetch Authentication Providers
                    </button>
                    <div class="form-text">Uses domain and token from main form</div>
                </div>
                <div class="col-6">
                    <div class="form-check mt-4">
                        <input type="checkbox" id="create-zip" class="form-check-input" checked>
                        <label for="create-zip" class="form-check-label">Create ZIP file for upload</label>
                        <div class="form-text">Recommended for Canvas SIS import</div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <button type="submit" id="generate-bulk-files" class="btn btn-primary">Generate SIS Import Package</button>
                    <button type="button" id="select-all-files" class="btn btn-outline-secondary ms-2">Select All</button>
                    <button type="button" id="select-none-files" class="btn btn-outline-secondary ms-1">Select None</button>
                </div>
            </div>
            <div id="bulk-result-container" class="mt-4" style="display: none;">
                <div id="bulk-result-message" class="alert"></div>
                <div id="files-created-list"></div>
            </div>
            <div id="bulk-progress" class="mt-3" style="display: none;">
                <div class="progress">
                    <div id="bulk-progress-bar" class="progress-bar" role="progressbar" style="width: 0%"></div>
                </div>
                <small id="bulk-progress-text" class="text-muted">Preparing...</small>
            </div>
        `;
        eContent.appendChild(createBulkSISForm);
    } else {
        // Form already exists, just show it
        createBulkSISForm.hidden = false;
    }

    // Event listeners (moved outside the if block so they work for both new and existing forms)
    if (!createBulkSISForm.hasAttribute('data-listeners-added')) {
        document.getElementById('browse-bulk-folder').addEventListener('click', async () => {
            const result = await window.electronAPI.selectFolder();
            if (result) {
                document.getElementById('bulk-output-path').value = result;
            }
        });

        document.getElementById('select-all-files').addEventListener('click', () => {
            const checkboxes = createBulkSISForm.querySelectorAll('input[type="checkbox"][id^="include-"]');
            checkboxes.forEach(cb => cb.checked = true);
        });

        document.getElementById('select-none-files').addEventListener('click', () => {
            const checkboxes = createBulkSISForm.querySelectorAll('input[type="checkbox"][id^="include-"]');
            checkboxes.forEach(cb => cb.checked = false);
        });

        // Fetch authentication providers for bulk form
        document.getElementById('fetch-bulk-auth-providers').addEventListener('click', async () => {
            const button = document.getElementById('fetch-bulk-auth-providers');
            const select = document.getElementById('bulk-auth-provider');

            // Get domain and token from main form
            const domain = document.getElementById('domain').value;
            const token = document.getElementById('token').value;

            if (!domain || !token) {
                showBulkResult('Please enter Canvas domain and token in the main form first.', 'warning');
                return;
            }

            try {
                button.disabled = true;
                button.textContent = 'Fetching...';

                const providers = await window.electronAPI.fetchAuthProviders(domain, token);

                // Clear existing options except the default
                select.innerHTML = '<option value="">None (Default Canvas Authentication)</option>';

                // Add fetched providers
                providers.forEach(provider => {
                    const option = document.createElement('option');
                    option.value = provider.id;
                    option.textContent = provider.display_name;
                    select.appendChild(option);
                });

                showBulkResult(`Found ${providers.length} authentication provider(s).`, 'success');

            } catch (error) {
                showBulkResult(`Error fetching authentication providers: ${error.message}`, 'danger');
            } finally {
                button.disabled = false;
                button.textContent = 'Fetch Authentication Providers';
            }
        });

        createBulkSISForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const outputPath = document.getElementById('bulk-output-path').value;
            const createZip = document.getElementById('create-zip').checked;
            const emailDomain = document.getElementById('bulk-email-domain').value.trim() || '@school.edu';
            const authProviderId = document.getElementById('bulk-auth-provider').value || '';

            if (!outputPath) {
                showBulkResult('Please select an output folder.', 'warning');
                return;
            }

            // Collect selected file types and counts
            const fileTypes = [];
            const rowCounts = [];

            const fileTypeConfigs = [
                { id: 'users', name: 'users' },
                { id: 'accounts', name: 'accounts' },
                { id: 'terms', name: 'terms' },
                { id: 'courses', name: 'courses' },
                { id: 'sections', name: 'sections' },
                { id: 'enrollments', name: 'enrollments' },
                { id: 'groups', name: 'groups' },
                { id: 'group-categories', name: 'group_categories' },
                { id: 'admins', name: 'admins' },
                { id: 'group-memberships', name: 'group_memberships' },
                { id: 'differentiation-tag-sets', name: 'differentiation_tag_sets' },
                { id: 'differentiation-tags', name: 'differentiation_tags' },
                { id: 'differentiation-tag-membership', name: 'differentiation_tag_membership' },
                { id: 'xlists', name: 'xlists' },
                { id: 'user-observers', name: 'user_observers' },
                { id: 'logins', name: 'logins' },
                { id: 'change-sis-id', name: 'change_sis_id' }
            ];

            fileTypeConfigs.forEach(config => {
                const checkbox = document.getElementById(`include-${config.id}`);
                const countInput = document.getElementById(`${config.id}-count`);

                if (checkbox.checked) {
                    fileTypes.push(config.name);
                    rowCounts.push(parseInt(countInput.value) || 10);
                }
            });

            if (fileTypes.length === 0) {
                showBulkResult('Please select at least one file type.', 'warning');
                return;
            }

            try {
                const button = document.getElementById('generate-bulk-files');
                button.disabled = true;
                button.textContent = 'Generating...';

                showProgress(0, 'Preparing files...');

                const result = await window.electronAPI.createBulkSISFiles(fileTypes, rowCounts, outputPath, createZip, emailDomain, authProviderId);

                hideProgress();
                showBulkResult(
                    `Successfully created ${result.files.length} SIS import files${createZip ? ' and ZIP package' : ''}!`,
                    'success'
                );

                // Show list of created files
                const filesList = document.getElementById('files-created-list');
                filesList.innerHTML = `
                    <h6>Created Files:</h6>
                    <ul class="list-group list-group-flush">
                        ${result.files.map(file => `<li class="list-group-item py-1"><code>${file}</code></li>`).join('')}
                    </ul>
                    ${result.zipPath ? `<div class="mt-2"><strong>ZIP Package:</strong> <code>${result.zipPath}</code></div>` : ''}
                `;

                button.disabled = false;
                button.textContent = 'Generate SIS Import Package';
            } catch (error) {
                hideProgress();
                showBulkResult(`Error creating files: ${error.message}`, 'danger');
                document.getElementById('generate-bulk-files').disabled = false;
                document.getElementById('generate-bulk-files').textContent = 'Generate SIS Import Package';
            }
        });

        // Mark that event listeners have been added
        createBulkSISForm.setAttribute('data-listeners-added', 'true');
    }

    function showBulkResult(message, type) {
        const resultContainer = document.getElementById('bulk-result-container');
        const resultMessage = document.getElementById('bulk-result-message');

        resultMessage.className = `alert alert-${type}`;
        resultMessage.textContent = message;
        resultContainer.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                resultContainer.style.display = 'none';
            }, 10000);
        }
    }

    function showProgress(percent, text) {
        const progressContainer = document.getElementById('bulk-progress');
        const progressBar = document.getElementById('bulk-progress-bar');
        const progressText = document.getElementById('bulk-progress-text');

        progressContainer.style.display = 'block';
        progressBar.style.width = `${percent}%`;
        progressText.textContent = text;
    }

    function hideProgress() {
        document.getElementById('bulk-progress').style.display = 'none';
    }
}
