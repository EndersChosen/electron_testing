// observer.js
const axios = require('axios');
const { getAPIData } = require('./utilities');
const { getEnrollments } = require('./enrollments');

const questionAsker = require('./questionAsker_electron');

console.log('Inside observer.js');

async function getAlerts(data) {
    console.log('inside getAlerts()');

    data.url = `https://${data.domain}/api/v1/users/self/observer_alerts/${data.observee}?as_user_id=${data.observer}&per_page=100`

    const alerts = await getAPIData(data);
    return alerts;
}

// prompt for data
(async () => {
    const data = {
        domain: null,
        token: null,
        observee: null,
        observer: null,
        user: null,
        state: 'active'
    }

    data.domain = await questionAsker.questionDetails('What domain: ');
    data.token = await questionAsker.questionDetails('Enter your token: ');
    data.observee = await questionAsker.questionDetails('Student ID you\'re observing: ');
    data.observer = await questionAsker.questionDetails('Observer ID: ');

    const alerts = await getAlerts(data)
    console.log('Total alerts: ', alerts.length);

    data.user = data.observer;
    const activeEnrollments = await getEnrollments(data);
    console.log('Active enrollments: ', activeEnrollments.length);

})();