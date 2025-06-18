// conversations.js
const pagination = require('./pagination');
const csvExporter = require('./csvExporter');
//const questionAsker = require('./questionAsker');
const { deleteRequester, errorCheck } = require('./utilities');

const axios = require('axios');

async function getConversations(user, url, scope, token) {
    console.log('Getting conversations: ');

    let pageCounter = 1;
    const myConversations = [];
    let nextPage = `${url}&scope=${scope}`;
    console.log('My next page ', nextPage);


    // if (url === 'conversations') {
    //     myURL = `${url}?scope=${scope}&as_user_id=${user}&per_page=100`;
    // } else {
    //     myURL = url;
    // }
    // try {
    //     const response = await axios.get(nextPage, {
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${token}`
    //         }
    //     });
    //     for (let message of response.data) {
    //         myConversations.push(message);
    //     }


    while (nextPage) {
        console.log('Page: ', pageCounter);
        try {
            const response = await axios.get(nextPage, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            for (let message of response.data) {
                myConversations.push(message);
            }
            nextPage = pagination.getNextPage(response.headers.get('link'));
            if (nextPage !== false) {
                pageCounter++;
                // myConversations = await getConversations(user, nextPage, null, myConversations, pageCount);
            } else {
                console.log('Last page.');
            }
        } catch (error) {
            console.log('ERROR: ', error);
            return false;
        }
    }

    console.log('Finshished');
    return myConversations;
}

// gets all messages with the specific scope (inbox, sent, etc.) for a single user
async function getConversationsGraphQL(data) {

    const domain = data.domain;
    const token = data.token;
    const subject = data.subject;
    const user = data.user_id;

    const query = `
            query getMessages($userID: ID!, $nextPage: String) {
                legacyNode(_id: $userID, type: User) {
                    ... on User {
                        id
                        email
                        conversationsConnection(scope: "sent", first: 200, after: $nextPage) {
                            pageInfo {
                                hasNextPage
                                endCursor
                                startCursor
                            }
                            nodes {
                                conversation {
                                    subject
                                    _id
                                }
                            }
                        }
                    }
                }
            }
        `;

    const variables = {
        "userID": user,
        "nextPage": ""
    };

    const axiosConfig = {
        method: 'post',
        url: `https://${domain}/api/graphql?as_user_id=${user}`,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        data: {
            query: query,
            variables: variables
        }
    };

    let sentMessages = [];
    let nextPage = true;
    while (nextPage) {
        try {
            const request = async () => {
                return await axios(axiosConfig);
            };

            const response = await errorCheck(request);
            const data = response.data.data.legacyNode.conversationsConnection;

            sentMessages.push(...data.nodes.map((conversation) => {
                return { subject: conversation.conversation.subject, id: conversation.conversation._id };
            }).filter((message) => {
                return message.subject === subject;
            }));

            if (!data.pageInfo.hasNextPage) {
                nextPage = false;
            } else {
                variables.nextPage = data.pageInfo.endCursor;
            }
        } catch (error) {
            throw error
        }
    }

    // const filteredMessages = sentMessages.filter((message) => {
    //     return (message.subject === subject);
    // });

    // const formattedMesages = filteredMessages.map((message) => {
    //     return { subject: message.node.conversation.subject, id: message.node.conversation._id };
    // });

    return sentMessages;

    // const url = url;
    // const query = query;
    // let response = '';
    // const responseData = [];
    // const headers = {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    // };



    // console.log('The Query: ', query);

    // const config = {
    //     method: 'post',
    //     url: url,
    //     headers: headers,
    //     data: JSON.stringify({
    //         query: query,
    //         variables: variables
    //     })
    // };

    // const response = await axios(config);

    // console.log('The graphql data response: ', response.data);

    // responseData.push(...response.data.data.legacyNode.conversationsConnection.edges);
    // console.log('The response data is ', responseData);

    // console.log('The Next Page: ', response.data.data.legacyNode.conversationsConnection.pageInfo.endCursor);
    // const variables = variables;
    // let nextPage = true;


    // while (nextPage) {
    //     const config = {
    //         method: 'post',
    //         url: url,
    //         headers: headers,
    //         data: JSON.stringify({
    //             query: query,
    //             variables: variables
    //         })
    //     };

    //     response = await axios(config);

    //     // console.log('The graphql data response: ', response.data);
    //     // const data = await response.json();
    //     // console.log('The data is : ', data);
    //     responseData.push(...response.data.data.legacyNode.conversationsConnection.edges);
    //     //console.log('The response data is ', responseData);

    //     if (response.data.data.legacyNode.conversationsConnection.pageInfo.hasNextPage === true) {
    //         variables.nextPage = response.data.data.legacyNode.conversationsConnection.pageInfo.endCursor;
    //         console.log('The variables are: ', variables);
    //         //console.log('The next page is ', variables.nextPage);
    //     } else {
    //         nextPage = false;
    //     }
    // }



    // console.log('Total filtered messages ', formattedMesages.length);

    //console.log('The completed response data is: ', response);

    // return responseData;



}

async function deleteForAll(data) {
    const domain = data.domain;
    const token = data.token;
    const messageID = data.message;

    const axiosConfig = {
        method: 'delete',
        url: `https://${domain}/api/v1/conversations/${messageID}/delete_for_all`,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const request = async () => {
            return await axios(axiosConfig);
        }

        const response = await errorCheck(request);
        return `${response.status} - ${response.statusText}`;
    } catch (error) {
        throw error
    }
    // console.log('Deleting Conversation....');


    // let myURL = `conversations/${conversationID}/delete_for_all`;
    // await axios.delete(myURL);
}

async function bulkDelete(userID, messageFilter) {
    let allConversations = [];

    // getting all messages in the inbox and sent
    allConversations.push(await getConversations(userID, 'conversations', 'inbox'));
    allConversations.push(await getConversations(userID, 'conversations', 'sent'));
    allConversations = allConversations.flat();

    console.log('done getting converations. Total: ', allConversations.length);
    let myFilter = messageFilter;
    let filteredConversations = [];
    let more = '';


    // continue looping for any exta messages that need to be deleted
    while (true) {
        console.log('filtering converations by ', myFilter);
        let counter = 0;
        filteredConversations = allConversations.filter((conversation) => {
            if (counter % 100 === 0)
                console.log('Done with ', counter);
            // console.log('looking at: ', conversation.id, conversation.subject);
            if (conversation.subject === myFilter) {
                console.log('conversation found', conversation.id)
                return conversation;
            }
            counter++;
        });
        let areYouSure = await questionAsker.questionDetails(`Found ${filteredConversations.length} are you sure you want to delete them?(y/n) `);
        if (areYouSure === 'n') {
            more = await questionAsker.questionDetails('Want to try another filter string?(y/n) ');
            if (more === 'y') {
                myFilter = await questionAsker.questionDetails('What filter do you want to use?');
                continue;
            } else
                break;
        }
        csvExporter.exportToCSV(filteredConversations, `${myFilter}`);

        // let loops = Math.floor(filteredConversations.length / 40);
        // let requests = [];
        // let index = 0;


        // ******************************
        // deleteRequester(filtersConversations, 'conversations)
        // *******************************
        await deleteRequester(filteredConversations, 'conversations', 'delete_for_all');

        // adding requests to an array to process in parallel
        // while (loops > 0) {
        //     console.log('Inside while');
        //     for (let i = 0; i < 40; i++) {
        //         console.log('adding reqeusts to promise');
        //         try {
        //             requests.push(deleteForAll(filteredConversations[index].id));
        //         } catch (error) {
        //             console.log(`Error adding ${url}`, error.message);
        //         }
        //         index++;
        //     }
        //     try {
        //         await Promise.all(requests);
        //     } catch (error) {
        //         console.log('There was an error', error.message, error.url);
        //         return;
        //     }
        //     console.log('Processed requests');
        //     await (function wait() {
        //         return new Promise(resolve => {
        //             setTimeout(() => {
        //                 resolve();
        //             }, 2000);
        //         })
        //     })();
        //     requests = [];
        //     loops--;
        // }
        // for (let i = 0; i < filteredConversations.length % 40; i++) {
        //     console.log('adding reqeusts to promise');
        //     try {
        //         requests.push(deleteForAll(filteredConversations[index].id));
        //     } catch (error) {
        //         console.log(`error adding ${filteredConversations[index]} to array`);
        //     }
        //     index++;
        // }
        // try {
        //     await Promise.all(requests);
        // } catch (error) {
        //     console.log('There was an error', error.message, error.url);
        //     return;
        // }

        if (filteredConversations.length > 0)
            console.log(`Deleted: ${filteredConversations.length} conversations`);
        more = await questionAsker.questionDetails('Do you have more?(y/n) ');
        if (more === 'y') {
            myFilter = await questionAsker.questionDetails('What filter do you want to use? ');
        } else
            break;
    }

    questionAsker.close();
}

async function bulkDeleteNew(messages, url, token) {
    console.log('Inside bulkDeleteNew');
    console.log('the token is ', token);

    return await deleteRequester(messages, url, 'delete_for_all', token);


    // let allConversations = [];

    // getting all messages in the inbox and sent
    // allConversations.push(await getConversations(userID, 'conversations', 'inbox'));
    // allConversations.push(await getConversations(userID, 'conversations', 'sent'));
    // allConversations = allConversations.flat();

    // console.log('done getting converations. Total: ', allConversations.length);
    // let myFilter = messageFilter;
    // let filteredConversations = [];
    // let more = '';


    // continue looping for any exta messages that need to be deleted
    //while (true) {
    //console.log('filtering converations by ', myFilter);
    //let counter = 0;
    // filteredConversations = allConversations.filter((conversation) => {
    //     if (counter % 100 === 0)
    //         console.log('Done with ', counter);
    //     // console.log('looking at: ', conversation.id, conversation.subject);
    //     if (conversation.subject === myFilter) {
    //         console.log('conversation found', conversation.id)
    //         return conversation;
    //     }
    //     counter++;
    // });
    // let areYouSure = await questionAsker.questionDetails(`Found ${filteredConversations.length} are you sure you want to delete them?(y/n) `);
    // if (areYouSure === 'n') {
    //     more = await questionAsker.questionDetails('Want to try another filter string?(y/n) ');
    //     if (more === 'y') {
    //         myFilter = await questionAsker.questionDetails('What filter do you want to use?');
    //         continue;
    //     } else
    //         break;
    // }
    //csvExporter.exportToCSV(filteredConversations, `${myFilter}`);

    // let loops = Math.floor(filteredConversations.length / 40);
    // let requests = [];
    // let index = 0;


    // ******************************
    // deleteRequester(filtersConversations, 'conversations)
    // *******************************
    //await deleteRequester(filteredConversations, 'conversations', 'delete_for_all');

    // adding requests to an array to process in parallel
    // while (loops > 0) {
    //     console.log('Inside while');
    //     for (let i = 0; i < 40; i++) {
    //         console.log('adding reqeusts to promise');
    //         try {
    //             requests.push(deleteForAll(filteredConversations[index].id));
    //         } catch (error) {
    //             console.log(`Error adding ${url}`, error.message);
    //         }
    //         index++;
    //     }
    //     try {
    //         await Promise.all(requests);
    //     } catch (error) {
    //         console.log('There was an error', error.message, error.url);
    //         return;
    //     }
    //     console.log('Processed requests');
    //     await (function wait() {
    //         return new Promise(resolve => {
    //             setTimeout(() => {
    //                 resolve();
    //             }, 2000);
    //         })
    //     })();
    //     requests = [];
    //     loops--;
    // }
    // for (let i = 0; i < filteredConversations.length % 40; i++) {
    //     console.log('adding reqeusts to promise');
    //     try {
    //         requests.push(deleteForAll(filteredConversations[index].id));
    //     } catch (error) {
    //         console.log(`error adding ${filteredConversations[index]} to array`);
    //     }
    //     index++;
    // }
    // try {
    //     await Promise.all(requests);
    // } catch (error) {
    //     console.log('There was an error', error.message, error.url);
    //     return;
    // }

    //     if (filteredConversations.length > 0)
    //         console.log(`Deleted: ${filteredConversations.length} conversations`);
    //     more = await questionAsker.questionDetails('Do you have more?(y/n) ');
    //     if (more === 'y') {
    //         myFilter = await questionAsker.questionDetails('What filter do you want to use? ');
    //     } else
    //         break;
    // }

    // questionAsker.close();
}


// (async () => {
//     // let theConversations = await getConversations(26);
//     // console.log('My user had this many', theConversations.length);

//     //await deleteForAll(1466);

//     let curDomain = await questionAsker.questionDetails('What Domain: ');
//     let user = await questionAsker.questionDetails('What user: ');
//     let filter = await questionAsker.questionDetails('What subject: ');

//     axios.defaults.baseURL = `https://${curDomain}/api/v1`;
//     await bulkDelete(user, filter)
//     console.log('finished');
//     questionAsker.close();
// })();


module.exports = {
    getConversations, getConversationsGraphQL, bulkDelete, bulkDeleteNew, deleteForAll
};
