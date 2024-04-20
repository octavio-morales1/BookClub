import { BOOK_SEARCH_BY_KEY, IS_EXIST_BOOK} from './books.js'
import { IS_EXIST_USER, GET_USER_BY_ID } from './user.js';
import { ObjectId } from 'mongodb';
import * as mongoCollections from '../config/mongoCollections.js';

const userCollection = await mongoCollections.users();
const bookCollection = await mongoCollections.books();
const bookClubCollection = await mongoCollections.books_clubs();

const IS_EXIST_BOOK_CLUB = async(id) => {
    if (!id || typeof id !== 'string' || id.trim() === "") throw 'Error: is not a valid string'
    const book_clubs = await bookClubCollection.findOne({ _id: new ObjectId(id) });
    if (book_clubs === null) return false
    return true;
}

const GET_BOOK_CLUB_BY_ID = async(id) => {
    if (!id || typeof id !== 'string' || id.trim() === "") throw 'Error: is not a valid string'
    if (!IS_EXIST_BOOK_CLUB(id)) throw 'Error: book club does not exist or is not a valid string'
    return await bookClubCollection.findOne({ _id: new ObjectId(id) });;
}

const CREATE_BOOK_CLUB = async(user_id, name, description, meeting, currentBook_key) => {
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === "") throw 'Error: id does not exist or is not a valid string'
    if (!name || typeof name !== 'string' || name.trim() === "") throw 'Error: name does not exist or is not a valid string'
    if (!description || typeof description !== 'string' || description.trim() === "") throw 'Error: description text does not exist or is not a valid string'
    if (!meeting || typeof meeting !== 'string' || meeting.trim() === "") throw 'Error: meetings text does not exist or is not a valid string'
    if (!IS_EXIST_USER(user_id)) throw "Error: User does not exist"
    if (!IS_EXIST_BOOK(currentBook_key)) throw "Error: Book does not exist"
    
    const creator = await GET_USER_BY_ID(user_id)
    const book = await BOOK_SEARCH_BY_KEY(currentBook_key)

    const book_club = {
        _id: new ObjectId(),
        name:name,
        creator: creator,
        description:description,
        meeting:meeting,
        currentBook: book,
        members: [creator],
        discussions: []
    }

    const newInsertInformation = await bookClubCollection.insertOne(book_club);
    if (!newInsertInformation.insertedId) throw 'Error: Insert failed!';

    const filter_for_user = { _id: new ObjectId(user_id) };
    const update_for_user = { $set: { bookClubsJoined: creator.bookClubsJoined ? [...creator.bookClubsJoined, book_club] : [book_club]} };
    const result_for_user = await userCollection.updateOne(filter_for_user, update_for_user);
    if (result_for_user.modifiedCount == 0) throw "Error: appending book club failed"

    return book_club
}

const JOIN_BOOK_CLUB = async(user_id, book_club_id) => {
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === "") throw 'Error: user id does not exist or is not a valid string'
    if (!book_club_id || typeof book_club_id !== 'string' || book_club_id.trim() === "") throw 'Error: book club id does not exist or is not a valid string'
    if (!IS_EXIST_BOOK_CLUB(book_club_id)) throw "Error: Book club does not exist"

    const user = await GET_USER_BY_ID(user_id)
    let book_club = await GET_BOOK_CLUB_BY_ID(book_club_id)

    const filter_for_book_club = { _id: new ObjectId(book_club_id) };
    const update_for_book_club = { $set: { members: [...book_club.members, user] } };
    const result_for_book_club = await bookClubCollection.updateOne(filter_for_book_club, update_for_book_club);
    if (result_for_book_club.modifiedCount == 0) throw "Error: appending user failed"

    const filter_for_user = { _id: new ObjectId(user_id) };
    const update_for_user = { $set: { bookClubsJoined: user.bookClubsJoined ? [...user.bookClubsJoined, book_club] : [book_club]} };
    const result_for_user = await userCollection.updateOne(filter_for_user, update_for_user);
    if (result_for_user.modifiedCount == 0) throw "Error: appending book club failed"

    return await GET_BOOK_CLUB_BY_ID(book_club_id)
}


const UPDATE_BOOK_CLUB_CURRENT_BOOK = async(book_id, book_club_id) => {
    if (!book_id || typeof book_id !== 'string' || book_id.trim() === "") throw 'Error: user id does not exist or is not a valid string'
    if (!book_club_id || typeof book_club_id !== 'string' || book_club_id.trim() === "") throw 'Error: book club id does not exist or is not a valid string'
    if (!IS_EXIST_BOOK_CLUB(book_club_id)) throw "Error: Book club does not exist"
    if (!IS_EXIST_BOOK(book_id)) throw "Error: Book does not exist"

    const book = await BOOK_SEARCH_BY_KEY(book_id)

    const filter = { _id: new ObjectId(book_club_id) };
    const update = { $set: { currentBook: book } };
    
    const result = await bookClubCollection.updateOne(filter, update);
    if (result.modifiedCount == 0) throw "Error: Joining Book Failed"
    return await GET_BOOK_CLUB_BY_ID(book_club_id)
}


const DELETE_BOOK_CLUB = async(book_club_id) => {
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === "") throw 'Error: user id does not exist or is not a valid string'
    if (!book_club_id || typeof book_club_id !== 'string' || book_club_id.trim() === "") throw 'Error: book club id does not exist or is not a valid string'
    
    let book_club = await GET_BOOK_CLUB_BY_ID(book_club_id)
    const filter = { _id: new ObjectId(book_club_id) };
    const result = await collection.deleteOne(filter);
    if (result.modifiedCount == 0) throw "Error: Joining Book Failed"
    return book_club
}

export { IS_EXIST_BOOK_CLUB, GET_BOOK_CLUB_BY_ID, CREATE_BOOK_CLUB, JOIN_BOOK_CLUB, UPDATE_BOOK_CLUB_CURRENT_BOOK, DELETE_BOOK_CLUB }