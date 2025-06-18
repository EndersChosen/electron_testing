// users.js
// const config = require('./config.js');
const pagination = require('./pagination.js');
// const random_user = require('../random_user');
// const error_check = require('../error_check');
// const questionAsker = require('../questionAsker');
// const csvExporter = require('../csvExporter');

const axios = require('axios');
const { errorCheck } = require('./utilities.js');

// let userData = {
//     user: {
//         terms_of_use: true,
//         skip_registration: true
//     },
//     pseudonym: {
//         send_confirmation: false
//     },
//     communication_channel: {
//         skip_confirmation: true
//     },
//     enable_sis_reactivation: true
// };

// async function getUsers(courseID, url = null, userList = []) {
//     let users = userList;
//     let myURL = url;
//     if (myURL === null) {
//         myURL = `/courses/${courseID}/users?per_page=100&include[]=enrollments`;
//     }
//     console.log(myURL);
//     try {
//         const response = await axios.get(myURL);
//         users.push(...response.data);
//         const nextPage = pagination.getNextPage(response.headers.get('link'));
//         if (nextPage !== false) {
//             users = await getUsers(null, nextPage, users);
//         }
//     } catch (error) {
//         if (error.response) {
//             console.log(error.response.status);
//             console.log(error.response.request);
//         } else if (error.request) {
//             console.log(error.request);
//         } else {
//             console.log('A different error', error.message);
//         }
//     }
//     return users;
// }

function generateRandomUser() {
    const firstNames = [
        'Aaron', 'Abigail', 'Adam', 'Adrian', 'Aiden', 'Alex', 'Alexa', 'Alexander', 'Alexandra', 'Alice',
        'Alicia', 'Allison', 'Alyssa', 'Amanda', 'Amber', 'Amelia', 'Amy', 'Andrea', 'Andrew', 'Angela',
        'Anna', 'Anthony', 'Ashley', 'Austin', 'Ava', 'Barbara', 'Benjamin', 'Brandon', 'Brayden',
        'Brianna', 'Brittany', 'Brooke', 'Bryan', 'Caleb', 'Cameron', 'Carlos', 'Carly', 'Carmen', 'Caroline',
        'Carter', 'Catherine', 'Charles', 'Charlotte', 'Chase', 'Chloe', 'Christian', 'Christina', 'Christopher',
        'Clara', 'Cole', 'Colin', 'Connor', 'Courtney', 'Daniel', 'David', 'Dean', 'Derek', 'Diana',
        'Dominic', 'Dylan', 'Edward', 'Elena', 'Eli', 'Elijah', 'Elizabeth', 'Ella', 'Emily', 'Emma',
        'Eric', 'Erica', 'Ethan', 'Eva', 'Evan', 'Evelyn', 'Faith', 'Fiona', 'Gabriel', 'Gavin',
        'Genesis', 'George', 'Grace', 'Grayson', 'Hailey', 'Hannah', 'Harper', 'Hayden', 'Henry', 'Holly',
        'Hudson', 'Hunter', 'Ian', 'Isaac', 'Isabella', 'Isaiah', 'Jack', 'Jackson', 'Jacob', 'James',
        'Jasmine', 'Jason', 'Jayden', 'Jeffrey', 'Jenna', 'Jennifer', 'Jessica', 'Jillian', 'John', 'Jonathan',
        'Jordan', 'Joseph', 'Joshua', 'Julia', 'Julian', 'Justin', 'Kaitlyn', 'Katherine', 'Kayla', 'Kaylee',
        'Kevin', 'Kimberly', 'Kyle', 'Kylie', 'Landon', 'Laura', 'Lauren', 'Layla', 'Leah', 'Liam',
        'Lillian', 'Lily', 'Logan', 'Lucas', 'Lucy', 'Luke', 'Mackenzie', 'Madeline', 'Madison', 'Makayla',
        'Maria', 'Mason', 'Matthew', 'Megan', 'Melanie', 'Melissa', 'Michael', 'Mia', 'Michelle', 'Mikayla',
        'Molly', 'Morgan', 'Nathan', 'Nathaniel', 'Nicholas', 'Nicole', 'Noah', 'Nolan', 'Olivia', 'Owen',
        'Paige', 'Parker', 'Patrick', 'Paul', 'Peter', 'Peyton', 'Rachel', 'Reagan', 'Rebecca', 'Riley',
        'Robert', 'Ryan', 'Samantha', 'Samuel', 'Sara', 'Sarah', 'Savannah', 'Sean', 'Sebastian', 'Serenity',
        'Seth', 'Shane', 'Sierra', 'Sophia', 'Sophie', 'Spencer', 'Stephanie', 'Stephen', 'Steven', 'Sydney',
        'Taylor', 'Thomas', 'Travis', 'Trinity', 'Tyler', 'Valeria', 'Vanessa', 'Victoria', 'Vincent', 'William',
        'Wyatt', 'Xavier', 'Zachary', 'Zoe', 'Zoey', 'Aaliyah', 'Abby', 'Addison', 'Adeline', 'Adriana',
        'Ainsley', 'Alana', 'Alayna', 'Alison', 'Alivia', 'Allie', 'Alondra', 'Alyson', 'Amara', 'Amari',
        'Amaya', 'Amira', 'Anastasia', 'Angel', 'Angelina', 'Anika', 'Annabelle', 'Annie', 'April', 'Arianna',
        'Ariel', 'Ariella', 'Arya', 'Ashlyn', 'Aspen', 'Athena', 'Aubree', 'Aubrey', 'Audrey', 'Aurora',
        'Autumn', 'Ava', 'Avery', 'Bailey', 'Bella', 'Bianca', 'Blake', 'Blakely', 'Braelyn', 'Braylee',
        'Brianna', 'Brielle', 'Brinley', 'Bristol', 'Brooke', 'Brooklyn', 'Brynn', 'Cadence', 'Caitlin', 'Callie',
        'Camila', 'Camille', 'Carina', 'Carla', 'Carmen', 'Carolina', 'Caroline', 'Cassandra', 'Cassidy', 'Catalina',
        'Cecilia', 'Celeste', 'Celia', 'Chelsea', 'Cheyenne', 'Christina', 'Claire',
        'Clarissa', 'Clementine', 'Colette', 'Cora', 'Coraline', 'Crystal', 'Daisy', 'Dakota',
        'Dalia', 'Dallas', 'Dana', 'Daniela', 'Daniella', 'Danielle', 'Daphne', 'Darla', 'Darlene', 'Davina'
    ];
    const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
        'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
        'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
        'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
        'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
        'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
        'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
        'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
        'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez',
        'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes',
        'Gonzales', 'Fisher', 'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham',
        'Reynolds', 'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson',
        'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro', 'Marshall', 'Owens',
        'Harrison', 'Fernandez', 'McDonald', 'Woods', 'Washington', 'Kennedy', 'Wells', 'Vargas', 'Henry', 'Chen',
        'Freeman', 'Webb', 'Tucker', 'Guzman', 'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter',
        'Gordon', 'Mendez', 'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Muñoz', 'Hunt', 'Hicks',
        'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose', 'Stone', 'Salazar', 'Fox',
        'Warren', 'Mills', 'Meyer', 'Rice', 'Schmidt', 'Garza', 'Daniels', 'Ferguson', 'Nichols', 'Stephens',
        'Soto', 'Weaver', 'Ryan', 'Gardner', 'Payne', 'Grant', 'Dunn', 'Kelley', 'Spencer', 'Hawkins',
        'Arnold', 'Pierce', 'Vazquez', 'Hansen', 'Peters', 'Santos', 'Hart', 'Bradley', 'Knight', 'Elliott',
        'Cunningham', 'Duncan', 'Armstrong', 'Hudson', 'Carroll', 'Lane', 'Riley', 'Andrews', 'Alvarado', 'Ray',
        'Delgado', 'Berry', 'Perkins', 'Hoffman', 'Johnston', 'Matthews', 'Pena', 'Richards', 'Contreras', 'Willis',
        'Carpenter', 'Lawrence', 'Sandoval', 'Guerrero', 'George', 'Chapman', 'Rios', 'Estrada', 'Ortega', 'Watkins',
        'Greene', 'Nunez', 'Wheeler', 'Valdez', 'Harper', 'Burke', 'Larson', 'Santiago', 'Maldonado', 'Morrison',
        'Franklin', 'Carlson', 'Austin', 'Dominguez', 'Carr', 'Lawson', 'Jacobs', 'O’Brien', 'Lynch', 'Singh',
        'Vega', 'Bishop', 'Montgomery', 'Oliver', 'Jensen', 'Harvey', 'Williamson', 'Gilbert', 'Dean', 'Sims',
        'Espinoza', 'Howell', 'Li', 'Wong', 'Reid', 'Hanson', 'Le', 'McCoy', 'Garrett', 'Burton',
        'Fuller', 'Wang', 'Weber', 'Welch', 'Rojas', 'Lucas', 'Marquez', 'Fields', 'Park', 'Yang',
        'Little', 'Banks', 'Padilla', 'Day', 'Walsh', 'Bowman', 'Schultz', 'Luna', 'Fowler', 'Mejia',
        'Davidson', 'Acosta', 'Brewer', 'May', 'Holland', 'Juarez', 'Newman', 'Pearson', 'Curtis', 'Cortez',
        'Douglas', 'Schneider', 'Joseph', 'Barrett', 'Navarro', 'Figueroa', 'Keller', 'Avila', 'Wade', 'Molina',
        'Stanley', 'Hopkins', 'Campos', 'Barnett', 'Bates', 'Chambers', 'Caldwell', 'Beck', 'Lambert', 'Miranda',
        'Byrd', 'Craig', 'Ayala', 'Lowe', 'Frazier', 'Powers', 'Neal', 'Leonard', 'Gregory', 'Carrillo',
        'Sutton', 'Fleming', 'Rhodes', 'Shelton', 'Schwartz', 'Norris', 'Jennings', 'Watts', 'Duran', 'Walters',
        'Cohen', 'McDaniel', 'Moran', 'Parks', 'Steele', 'Vaughn', 'Becker', 'Holt', 'DeLeon', 'Barker'
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return {
        user: {
            name: firstName + lastName,
            skip_registration: true
        },
        pseudonym: {
            unique_id: firstName + lastName + Math.floor(Math.random() * 1000),
            send_confirmation: false
        },
        communication_channel: {
            type: 'email',
            address: '',
            skip_confirmation: true
        }
    };
}

// create random users
function createUsers(count, email) {
    const users = [];
    for (let i = 0; i < count; i++) {
        const newUser = generateRandomUser();
        if (email != null) {
            newUser.communication_channel.address = `${email}+${newUser.pseudonym.unique_id}@instructure.com`;
        }
        users.push(newUser);
    }
    return users;
}

async function addStudents(data) {
    const numToAdd = data.course.addUsers.addStudents;
    const usersToAdd = createUsers(numToAdd);
    const students = [];
    for (let user of usersToAdd) {
        const student = {
            user: {
                name: theUser.firstName + theUser.lastName,
                skip_registration: true
            },
            pseudonym: {
                unique_id: theUser.login_id,
                send_confirmation: false
            }
        }
        students.push(student);
    }
    return students;
}

async function addTeachers(data) {
    const numToAdd = data.course.addUsers.addTeachers;
    const usersToAdd = createUsers(numToAdd);
    const teachers = [];
    for (let user of usersToAdd) {
        const teacher = {
            user: {
                name: theUser.firstName + theUser.lastName,
                skip_registration: true
            },
            pseudonym: {
                unique_id: theUser.login_id,
                send_confirmation: false
            }
        }
        students.push(student);
    }
    return students;
}

// adds new users to Canvas
async function addUsers(data) {
    const url = `https://${data.domain}/api/v1/accounts/self/users`;
    const axiosConfig = {
        method: 'post',
        url: url,
        headers: {
            'Authorization': `Bearer ${data.token}`
        },
        data: data.user
    };

    try {
        const request = async () => {
            return await axios(axiosConfig);
        }
        const response = await errorCheck(request);
        return response.data.id;
    } catch (error) {
        throw error;
    }
}

// enroll a user in a course
async function enrollUser(data) {
    const url = `https://${data.domain}/api/v1/courses/${data.course_id}/enrollments`;

    const axiosConfig = {
        method: 'post',
        url: url,
        headers: {
            'Authorization': `Bearer ${data.token}`
        },
        data: {
            enrollment: {
                user_id: data.user_id,
                type: data.type,
                enrollment_state: 'active'
            }
        }
    };

    try {
        const request = async () => {
            return await axios(axiosConfig);
        };

        const response = await errorCheck(request);
        return response.status;
    } catch (error) {
        throw error;
    }
}

async function getPageViews(data) {
    const domain = data.domain;
    const token = data.token;
    const user_id = data.user;
    const startDate = data.start;
    const endDate = data.end;
    const dupPage = [];
    let pageNum = 1;
    let pageViews = [];
    // let myUrl = url;
    let nextPage = `https://${domain}/api/v1/users/${user_id}/page_views?start_time=${startDate}&end_time=${endDate}&per_page=100`;
    console.log(nextPage);

    while (nextPage) {
        console.log(`Getting page ${pageNum}`);
        // const response = await error_check.errorCheck(async () => {
        //     return await axios.get(nextPage);
        // });
        try {
            const request = async () => {
                return await axios.get(nextPage, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }

            const response = await errorCheck(request);

            pageViews.push(...response.data);

            if (response.headers.get('link')) {
                nextPage = pagination.getNextPage(response.headers.get('link'));
            } else {
                nextPage = false;
            }

            if (nextPage != false) {
                pageNum++;
                if (dupPage.includes(nextPage)) {
                    console.log('This is a dupe page');
                } else {
                    dupPage.push(nextPage);
                }
            }
        } catch (error) {
            throw error;
        }
    }

    //console.log(response.data);

    // for (let view of response.data) {
    //     pageViews.push(view);
    // }


    // csvExporter.exportToCSV(pageViews, `${user_id}_pageViews`)
    return pageViews;
}

// function updateUserParams(person) {
//     console.log('Updating user...');
//     userData.user.name = person.firstName + ' ' + person.lastName;
//     userData.pseudonym.unique_id = person.loginID.toString();
//     userData.pseudonym.sis_user_id = person.email;
//     userData.communication_channel.address = person.email;

//     return;
// }

// async function clearUserCache(userID) {
//     console.log('Clearing user cache for ', userID);

//     await axios.post(`/users/${userID}/clear_cache`);
// }

// async function clearCourseUserCache(courseID) {
//     console.log('Clearing cache of every user in the course', courseID);

//     let userList = await getUsers(courseID);
//     for (let user of userList)
//         await clearUserCache(user.id);

//     return;
// }

// (async () => {
//     const curDomain = await questionAsker.questionDetails('What domain: ');
//     // const courseID = await questionAsker.questionDetails('What course: ');
//     const userID = await questionAsker.questionDetails('What user: ');
//     // const number = await questionAsker.questionDetails('How many users do you want to create: ');
//     const startDate = await questionAsker.questionDetails('Start date (yyyy-mm-dd): ');
//     const endDate = await questionAsker.questionDetails('End date (yyyy-mm-dd): ');
//     questionAsker.close();

//     axios.defaults.baseURL = `https://${curDomain}/api/v1`;


//     // for (let i = 0; i < numUsers; i++) {
//     //     let user = await createUser();
//     //     console.log(user.id);
//     // }
//     // let myUsers = await getUsers(2155);
//     // console.log(myUsers.length);

//     // let myPageViews = await getPageViews(26, null,
//     //     '2023-02-15T07:00:00.000', '2023-02-16T07:00:00.000');
//     // console.log(`${myPageViews.length} Page views`);
//     // csvExporter.exportToCSV(myPageViews);
//     // console.log(myPageViews.length);

//     // await clearCourseUserCache(2155);
//     await getPageViews(userID, startDate, endDate)
//     console.log('done');
// })();

module.exports = {
    addUsers, createUsers, enrollUser, getPageViews
};
