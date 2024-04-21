import { 
    CREATE_USER, 
    GET_ALL_USERS, 
    GET_USER_BY_ID
} from './data/user.js'

import { 
    IS_EXIST_BOOK_CLUB, 
    GET_BOOK_CLUB_BY_ID, 
    CREATE_BOOK_CLUB, 
    JOIN_BOOK_CLUB, 
    UPDATE_BOOK_CLUB_CURRENT_BOOK, 
    DELETE_BOOK_CLUB, 
    REMOVE_USER_FROM_BOOKCLUB
} from './data/book_club.js'

import { 
    BOOK_SEARCH, 
    BOOK_SEARCH_BY_KEY, 
    CREATE_BOOK_DATA, 
    IS_EXIST_BOOK 
} from './data/books.js'


import { dbConnection, closeConnection } from './config/mongoConnection.js';
const db = await dbConnection();
await db.dropDatabase();

try {
    const user1 = await CREATE_USER( 'Allan', 'Joseph', 'john.doe@example.com', 'johndoe', 'mySecurePassword123'); 
    const user2 = await CREATE_USER( 'Birva', 'Patel', 'john.doe@example.com', 'johndoe1', 'mySecurePassword123'); 
    const user3 = await CREATE_USER( 'Octavio', 'Moralas', 'john.doe@example.com', 'johndoe2', 'mySecurePassword123');
    await BOOK_SEARCH("Lion King", 1)
    const book_club1 = await CREATE_BOOK_CLUB(user1._id.toString(), "Book Club1", "Testing Testing Testing", "Every Friday", "/works/OL27448W");
    console.log(user1.firstname)
    await JOIN_BOOK_CLUB(user2._id.toString(), book_club1._id.toString())
    await UPDATE_BOOK_CLUB_CURRENT_BOOK('/works/OL15450151W', book_club1._id.toString())
    await REMOVE_USER_FROM_BOOKCLUB(book_club1._id.toString(), user1._id.toString())
    //await DELETE_BOOK_CLUB(book_club1._id.toString())

    console.log("Success")
} catch(e) {
    console.log(e)
}
await closeConnection();