// questionAsker.js
import { createInterface } from 'readline';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});


async function questionAsker(question) {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer);
        });
    });
}


async function questionDetails(myQuestion) {
    let theAnswer = await questionAsker(myQuestion);
    return theAnswer;
};

function close() {
    rl.close();
}
export default {
    questionDetails, close
};
