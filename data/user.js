import bcrypt from 'bcrypt';
import {ObjectId} from 'mongodb';
import {users} from '../config/mongoCollections.js';

const saltRounds = 10; // Define the number of salt rounds

async function hashPassword(password) {
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error('Error hashing password');
    }
}

function isValidEmail(email) {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
  

async function getAllUsers(){
    const userCollection = await users();
    return await userCollection.find({}).toArray();
}

async function getUser(id) {
    if (!id || typeof id !== 'string' || id.trim() === "") throw 'Error: id does not exist or is not a valid string'
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (user === null) throw "Error: User with ID does not exist"
    return user;
}


async function createUser(firstName, lastName, email, username, password) {
    // Validate input data
    if (typeof firstName !== 'string' || firstName.trim().length === 0) throw new Error('Invalid first name')
    if (typeof lastName !== 'string' || lastName.trim().length === 0) throw new Error('Invalid last name')
    if (typeof email !== 'string' || !isValidEmail(email)) throw new Error('Invalid email')
    if (typeof username !== 'string' || username.trim().length === 0) throw new Error('Invalid username')
    if (typeof password !== 'string' || password.trim().length < 8) throw new Error('Invalid password (must be at least 8 characters)')
  
    const passwordHash = await hashPassword(password);
    const joinedDate = new Date().toISOString().slice(0, 10); // Current date in YYYY-MM-DD format

    const user = {
        firstname:firstName,
        lastname:lastName,
        email:email,
        username:username,
        password:passwordHash,
        joinedDate:joinedDate,
        readingList: [],
        bookClubsJoined: [],
        reviewsPosted: [],
        Bookmarks: {
            clubs: [],
            events: [],
            books: []
        }
    };

    const users = await getAllUsers()
    const usersByUsername = users.map(user => user.username);
    if (usersByUsername.find(element => element === username)) throw "Error: Username is already taken"

    const userCollection = await users();
    const newInsertInformation = await userCollection.insertOne(user);
    if (!newInsertInformation.insertedId) throw 'Error: Insert failed!';
    return user;
}

try {   
    console.log(await getUser( '6622c313102ba524614f4419')); 
} catch(e) {
    console.log(e)
}

export {createUser, getAllUsers};