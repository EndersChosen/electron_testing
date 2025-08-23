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

// valid frequency values: 'daily', 'weekly', 'never', 'immediately'
async function updateNotifications(frequency, domain, user, commChannel, token) {
    console.log('inside updateNotifications');

    const notificationCategories = [
        "announcement",
        "due_date",
        "course_content",
        "grading_policies",
        "grading",
        "calendar",
        "invitation",
        "registration",
        "discussion",
        "late_grading",
        "submission_comment",
        "summaries",
        "reminder",
        "membership_update",
        "other",
        "discussionentry",
        "migration",
        "all_submissions",
        "conversation_message",
        "added_to_conversation",
        "alert",
        "student_appointment_signups",
        "appointment_cancelations",
        "appointment_availability",
        "appointment_signups",
        "files",
        "announcement_created_by_you",
        "conversation_created",
        "recording_ready",
        "blueprint",
        "content_link_error",
        "account_notification",
        "discussion_mention",
        "reported_reply"
    ]

    const notificationPreferences = {
        "notification_preferences": [
            {
                "frequency": frequency,
                "notification": "new_announcement",
                "category": "announcement"
            },
            {
                "frequency": frequency,
                "notification": "assignment_due_date_changed",
                "category": "due_date"
            },
            {
                "frequency": frequency,
                "notification": "assignment_changed",
                "category": "course_content"
            },
            {
                "frequency": frequency,
                "notification": "assignment_created",
                "category": "due_date"
            },
            {
                "frequency": frequency,
                "notification": "grade_weight_changed",
                "category": "grading_policies"
            },
            {
                "frequency": frequency,
                "notification": "assignment_graded",
                "category": "grading"
            },
            {
                "frequency": frequency,
                "notification": "new_event_created",
                "category": "calendar"
            },
            {
                "frequency": frequency,
                "notification": "event_date_changed",
                "category": "calendar"
            },
            {
                "frequency": frequency,
                "notification": "collaboration_invitation",
                "category": "invitation"
            },
            {
                "frequency": frequency,
                "notification": "web_conference_invitation",
                "category": "invitation"
            },
            {
                "frequency": frequency,
                "notification": "confirm_email_communication_channel",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "confirm_registration",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "forgot_password",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "new_discussion_topic",
                "category": "discussion"
            },
            {
                "frequency": frequency,
                "notification": "enrollment_invitation",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "enrollment_notification",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "assignment_submitted_late",
                "category": "late_grading"
            },
            {
                "frequency": frequency,
                "notification": "group_assignment_submitted_late",
                "category": "late_grading"
            },
            {
                "frequency": frequency,
                "notification": "submission_graded",
                "category": "grading"
            },
            {
                "frequency": frequency,
                "notification": "submission_comment",
                "category": "submission_comment"
            },
            {
                "frequency": frequency,
                "notification": "submission_grade_changed",
                "category": "grading"
            },
            {
                "frequency": frequency,
                "notification": "new_wiki_page",
                "category": "course_content"
            },
            {
                "frequency": frequency,
                "notification": "updated_wiki_page",
                "category": "course_content"
            },
            {
                "frequency": frequency,
                "notification": "summaries",
                "category": "summaries"
            },
            {
                "frequency": frequency,
                "notification": "enrollment_registration",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "rubric_assessment_submission_reminder",
                "category": "invitation"
            },
            {
                "frequency": frequency,
                "notification": "rubric_assessment_invitation",
                "category": "invitation"
            },
            {
                "frequency": frequency,
                "notification": "rubric_association_created",
                "category": "invitation"
            },
            {
                "frequency": frequency,
                "notification": "new_account_user",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "assignment_publishing_reminder",
                "category": "reminder"
            },
            {
                "frequency": frequency,
                "notification": "assignment_grading_reminder",
                "category": "reminder"
            },
            {
                "frequency": frequency,
                "notification": "assignment_due_date_reminder",
                "category": "reminder"
            },
            {
                "frequency": frequency,
                "notification": "teacher_context_message",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "new_context_group_membership",
                "category": "membership_update"
            },
            {
                "frequency": frequency,
                "notification": "submission_comment_for_teacher",
                "category": "submission_comment"
            },
            {
                "frequency": frequency,
                "notification": "enrollment_accepted",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "new_context_group_membership_invitation",
                "category": "invitation"
            },
            {
                "frequency": frequency,
                "notification": "group_membership_accepted",
                "category": "membership_update"
            },
            {
                "frequency": frequency,
                "notification": "group_membership_rejected",
                "category": "membership_update"
            },
            {
                "frequency": frequency,
                "notification": "new_student_organized_group",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "new_course",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "new_user",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "new_teacher_registration",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "new_discussion_entry",
                "category": "discussion_entry"
            },
            {
                "frequency": frequency,
                "notification": "migration_export_ready",
                "category": "migration"
            },
            {
                "frequency": frequency,
                "notification": "migration_import_finished",
                "category": "migration"
            },
            {
                "frequency": frequency,
                "notification": "merge_email_communication_channel",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "migration_import_failed",
                "category": "migration"
            },
            {
                "frequency": frequency,
                "notification": "assignment_submitted",
                "category": "all_submissions"
            },
            {
                "frequency": frequency,
                "notification": "assignment_resubmitted",
                "category": "all_submissions"
            },
            {
                "frequency": frequency,
                "notification": "new_teacher_registration_immediate",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "report_generated",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "report_generation_failed",
                "category": "other"
            },
            {
                "frequency": frequency,
                "notification": "account_user_registration",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "account_user_notification",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "pseudonym_registration",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "content_export_finished",
                "category": "migration"
            },
            {
                "frequency": frequency,
                "notification": "content_export_failed",
                "category": "migration"
            },
            {
                "frequency": frequency,
                "notification": "conversation_message",
                "category": "conversation_message"
            },
            {
                "frequency": frequency,
                "notification": "added_to_conversation",
                "category": "added_to_conversation"
            },
            {
                "frequency": frequency,
                "notification": "alert",
                "category": "alert"
            },
            {
                "frequency": frequency,
                "notification": "assignment_unmuted",
                "category": "grading"
            },
            {
                "frequency": frequency,
                "notification": "appointment_canceled_by_user",
                "category": "student_appointment_signups"
            },
            {
                "frequency": frequency,
                "notification": "appointment_deleted_for_user",
                "category": "appointment_cancelations"
            },
            {
                "frequency": frequency,
                "notification": "appointment_group_deleted",
                "category": "appointment_cancelations"
            },
            {
                "frequency": frequency,
                "notification": "appointment_group_published",
                "category": "appointment_availability"
            },
            {
                "frequency": frequency,
                "notification": "appointment_group_updated",
                "category": "appointment_availability"
            },
            {
                "frequency": frequency,
                "notification": "appointment_reserved_by_user",
                "category": "student_appointment_signups"
            },
            {
                "frequency": frequency,
                "notification": "appointment_reserved_for_user",
                "category": "appointment_signups"
            },
            {
                "frequency": frequency,
                "notification": "new_file_added",
                "category": "files"
            },
            {
                "frequency": frequency,
                "notification": "new_files_added",
                "category": "files"
            },
            {
                "frequency": frequency,
                "notification": "assignment_due_date_override_changed",
                "category": "due_date"
            },
            {
                "frequency": frequency,
                "notification": "canvasnet_migration",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "course_started",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "course_starts_in_week",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "course_required_materials",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "course_already_started",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "submission_needs_grading",
                "category": "all_submissions"
            },
            {
                "frequency": frequency,
                "notification": "quiz_regrade_finished",
                "category": "grading"
            },
            {
                "frequency": frequency,
                "notification": "self_enrollment_registration",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "twd_migration_new",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "twd_migration_existing",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "twd_migration_new_late",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "twd_migration_existing_late",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "peer_review_invitation",
                "category": "invitation"
            },
            {
                "frequency": frequency,
                "notification": "announcement_created_by_you",
                "category": "announcement_created_by_you"
            },
            {
                "frequency": frequency,
                "notification": "announcement_reply",
                "category": "announcement_created_by_you"
            },
            {
                "frequency": frequency,
                "notification": "conversation_created",
                "category": "conversation_created"
            },
            {
                "frequency": frequency,
                "notification": "web_conference_recording_ready",
                "category": "recording_ready"
            },
            {
                "frequency": frequency,
                "notification": "pseudonym_registration_done",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "blueprint_content_added",
                "category": "blueprint"
            },
            {
                "frequency": frequency,
                "notification": "blueprint_sync_complete",
                "category": "blueprint"
            },
            {
                "frequency": frequency,
                "notification": "account_user_notification",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "content_link_error",
                "category": "content_link_error"
            },
            {
                "frequency": frequency,
                "notification": "submission_posted",
                "category": "grading"
            },
            {
                "frequency": frequency,
                "notification": "submissions_posted",
                "category": "grading"
            },
            {
                "frequency": frequency,
                "notification": "account_notification",
                "category": "account_notification"
            },
            {
                "frequency": frequency,
                "notification": "manually_created_access_token_created",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "annotation_notification",
                "category": "submission_comment"
            },
            {
                "frequency": frequency,
                "notification": "annotation_teacher_notification",
                "category": "submission_comment"
            },
            {
                "frequency": frequency,
                "notification": "upcoming_assignment_alert",
                "category": "due_date"
            },
            {
                "frequency": frequency,
                "notification": "discussion_mention",
                "category": "discussion_mention"
            },
            {
                "frequency": frequency,
                "notification": "reported_reply",
                "category": "reported_reply"
            },
            {
                "frequency": frequency,
                "notification": "account_verification",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "checkpoints_created",
                "category": "due_date"
            },
            {
                "frequency": frequency,
                "notification": "access_token_created_on_behalf_of_user",
                "category": "registration"
            },
            {
                "frequency": frequency,
                "notification": "access_token_deleted",
                "category": "registration"
            }
        ]

    }

    // loop through all categories and set them to the frequency
    // for (const category of notificationCategories) {

    //     let url = `${domain}/api/v1/users/self/communication_channels/${commChannel}/notification_preference_categories/${category}?as_user_id=${user}`;

    //     try {
    //         const response = await fetch(url, {
    //             method: 'PUT',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'X-Csrf-Token': token
    //             },
    //             body: JSON.stringify({
    //                 "notification_preferences": [
    //                     {
    //                         "frequency": frequency
    //                     }
    //                 ],
    //             })
    //         });
    //     } catch (err) {
    //         throw err;
    //     }
    // }
    let url = `https://${domain}/api/v1/users/self/communication_channels/${commChannel}/notification_preferences/?as_user_id=${user}`;
    
    const axiosConfig = {
        method: 'PUT',
        url: url,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        data: notificationPreferences
    };

    try {
        const request = async () => {
            return await axios(axiosConfig);
        };
        const response = await errorCheck(request);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function getCommChannels(
    domain,
    user,
    token
) {
    let url = `https://${domain}/api/v1/users/self/communication_channels/?as_user_id=${user}`;

    const axiosConfig = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    try {
        const response = await axios(url, axiosConfig);
        return response.data;
    } catch (error) {
        throw error;
    }
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
    addUsers, createUsers, enrollUser, getPageViews, getCommChannels, updateNotifications
};
