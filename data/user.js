import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import * as mongoCollections from '../config/mongoCollections.js';
const userCollection = await mongoCollections.users();

const saltRounds = 10; // Define the number of salt rounds

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

const CREATE_USER = async(first_name, last_name, email, username, password) => {
    if (!first_name || !last_name || !email || !username || !password) throw 'All fields must be provided';
    if (!/^[a-zA-Z]{2,25}$/.test(first_name)) throw 'Invalid first name. It should be a valid string (no strings with just spaces, should not contain numbers) and should be at least 2 characters long with a max of 25 characters.'
    if (!/^[a-zA-Z]{2,25}$/.test(last_name)) throw 'Invalid last name. It should be a valid string (no strings with just spaces, should not contain numbers) and should be at least 2 characters long with a max of 25 characters.'
    if (!/^[a-zA-Z]{3,10}$/.test(username)) throw 'Invalid username. It should be a valid string (no strings with just spaces, should not contain numbers) and should be at least 3 characters long with a max of 10 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw 'Invalid email'
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) throw 'Invalid password. Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character.'
    
    first_name = first_name.title()
    last_name = last_name.title()
    username = username.toLowerCase()
    email = email.toLowerCase()


    const passwordHash = await HASHPASSWORD(password);
    const joinedDate = new Date().toISOString().slice(0, 10);

    const user = {
        _id: new ObjectId(),
        first_name: first_name,
        last_name: last_name,
        email: email,
        username: username,
        password: await bcrypt.hash(password, saltRounds),
        joined_date: joinedDate,
        reading_list: [],
        book_clubs: [],
        reviews: [],
        bookmarks: {
            clubs: [],
            events: [],
            books: []
        }
    };

    const taken_username = await userCollection.findOne({username: username})
    if (!taken_username) throw "Error: Username is already taken"

    const newInsertInformation = await userCollection.insertOne(user);
    if (!newInsertInformation.insertedId) throw 'Error: Insert failed!';
    return user;
}

const LOGIN_IN = async (email, password) => {
    if (!email || !password) throw 'All fields must be provided';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw 'Invalid email'
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) throw 'Invalid password. Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character.'

    email = email.toLowerCase()

    const users = await userCollection.find({email: email}).toArray()
    if (!users) throw "Either the email or password is invalid"

    let user = null
    for (let user_email of users) {
        const match = await bcrypt.compare(password, user_email.password);
        if (match) {
            user = user_email
            break
        }
      }
      

    const {first_name, last_name, username, joined_date } = user;
    return await bcrpyt.compare(password, user.password) ? {firstName, lastName, username, favoriteQuote, themePreference, role} : "Either the username or password is invalid"
} 
export {CREATE_USER, GET_ALL_USERS, GET_USER_BY_ID, IS_EXIST_USER, LOGIN_IN};
