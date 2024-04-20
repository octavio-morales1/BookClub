import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import * as mongoCollections from '../config/mongoCollections.js';
const userCollection = await mongoCollections.users();


const saltRounds = 10; // Define the number of salt rounds

const HASHPASSWORD = async(password) => {
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error('Error hashing password');
    }
}

const IS_VALID_EMAIL = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

const GET_ALL_USERS = async() => {
    return await userCollection.find({}).toArray();
}

const GET_USER_BY_ID = async(id) => {
    if (!id || typeof id !== 'string' || id.trim() === "") throw 'Error: id does not exist or is not a valid string'
    if (!IS_EXIST_USER) throw "Error: User with ID does not exist" 
    return await userCollection.findOne({ _id: new ObjectId(id) });
}


const IS_EXIST_USER = async(id) => {
    if (!id || typeof id !== 'string' || id.trim() === "") throw 'Error: id does not exist or is not a valid string'
    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (user === null) return false
    return true;
}

const CREATE_USER = async(firstName, lastName, email, username, password) => {
    if (typeof firstName !== 'string' || firstName.trim().length === 0) throw new Error('Invalid first name')
    if (typeof lastName !== 'string' || lastName.trim().length === 0) throw new Error('Invalid last name')
    if (typeof email !== 'string' || !IS_VALID_EMAIL(email)) throw new Error('Invalid email')
    if (typeof username !== 'string' || username.trim().length === 0) throw new Error('Invalid username')
    if (typeof password !== 'string' || password.trim().length < 8) throw new Error('Invalid password (must be at least 8 characters)')
  
    const passwordHash = await HASHPASSWORD(password);
    const joinedDate = new Date().toISOString().slice(0, 10);

    const user = {
        _id: new ObjectId(),
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

    const users = await GET_ALL_USERS()
    const usersByUsername = users.map(user => user.username);
    if (usersByUsername.find(element => element === username)) throw "Error: Username is already taken"

    const newInsertInformation = await userCollection.insertOne(user);
    if (!newInsertInformation.insertedId) throw 'Error: Insert failed!';
    return user;
}

export {CREATE_USER, GET_ALL_USERS, GET_USER_BY_ID, IS_EXIST_USER};