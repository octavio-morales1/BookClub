import * as mongoCollections from '../config/mongoCollections.js';

import { BOOK_SEARCH_BY_KEY, IS_EXIST_BOOK} from './books.js'
import { IS_EXIST_USER, GET_USER_BY_ID } from './user.js';
import { createDiscussion, updateDiscussionStatus} from './discussions.js';
import { ObjectId } from 'mongodb';

const userCollection = await mongoCollections.users();
const bookClubCollection = await mongoCollections.books_clubs();
const discussionCollection = await mongoCollections.discussions();



const checkDiscussionExists = (discussions, discussionId) => {
    for (let discussion of discussions) {
        if (discussion._id === discussionId) {
            return true;
        }
    }
    return false;
}

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

const CREATE_BOOK_CLUB = async(user_id, name, description, currentBook_key) => {
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === "") throw 'Error: id does not exist or is not a valid string'
    if (!name || typeof name !== 'string' || name.trim() === "") throw 'Error: name does not exist or is not a valid string'
    if (!description || typeof description !== 'string' || description.trim() === "") throw 'Error: description text does not exist or is not a valid string'
    if (!IS_EXIST_USER(user_id)) throw "Error: User does not exist"
    if (!IS_EXIST_BOOK(currentBook_key)) throw "Error: Book does not exist"
    
    const user = await GET_USER_BY_ID(user_id)
    const book = await BOOK_SEARCH_BY_KEY(currentBook_key)

    const book_club = {
        _id: new ObjectId(),
        name: name,
        moderator: user,
        description: description,
        currentBook: book,
        members: [user],
        discussions: [] 
    };

    const newInsertInformation = await bookClubCollection.insertOne(book_club);
    if (!newInsertInformation.insertedId) throw 'Error: Insert failed!';

    const filter_for_user = { _id: new ObjectId(user_id) };
    const update_for_user = { $set: { book_clubs: user.book_clubs ? [...user.book_clubs, book_club] : [book_club]} };
    const result_for_user = await userCollection.updateOne(filter_for_user, update_for_user);
    if (result_for_user.modifiedCount == 0) throw "Error: appending book club failed"

    const initialDiscussion = await createDiscussion(user_id, currentBook_key);
    book_club.discussions.push(initialDiscussion);

    await bookClubCollection.updateOne(
        { _id: book_club._id },
        { $set: { discussions: book_club.discussions } }
    );
    
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

const GET_DISCUSSION_BY_BOOKCLUB_ID = async(bookClubId, discussionID) => {
    if (!bookClubId || typeof bookClubId !== 'string' || bookClubId.trim() === "") throw 'Error: bookclub id does not exist or is not a valid string'
    if (!discussionID || typeof discussionID !== 'string' || discussionID.trim() === "") throw 'Error: discussion id does not exist or is not a valid string'

    const book_club = await GET_BOOK_CLUB_BY_ID(bookClubId);
    if (!checkDiscussionExists(book_club.discussions, discussionID)) throw "discussion does not exist in book club"

    const discussion = await discussionCollection.findOne({ _id: new ObjectId(discussionID) });
    if (discussion === null) throw "Error"

    checkDiscussionExists

    return
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

const START_NEW_SESSION = async (bookClubId, newBookKey) => {
    // Validate book ID and check existence
    if (!book_id || typeof book_id !== 'string' || book_id.trim() === "") throw 'Error: book id does not exist or is not a valid string'
    if (!newBookKey || typeof newBookKey !== 'string' || key.trim().newBookKey === 0) throw 'Invalid book key';
    if (!ObjectId.isValid(bookClubId) || !await BOOK_SEARCH_BY_KEY(newBookKey)) throw 'Invalid book club ID or book key'

    // Create a new discussion for the new session
    let book_club = await GET_BOOK_CLUB_BY_ID(book_club_id)
    const newDiscussion = await createDiscussion(bookClubId, newSessionBook._id, newSessionBook.title, newSessionBook.author);

    const updateResult = await bookClubCollection.updateOne(
        { _id: new ObjectId(bookClubId) },
        {
            $set: {
                currentBook: newSessionBook,
                moderator: newModerator,
            },
            $push: {
                moderatorsHistory: newModerator,
                discussions: newDiscussion
            }
        }
    );

    if (updateResult.modifiedCount === 0) throw new Error('Failed to start a new session');
    return await bookClubCollection.findOne({ _id: new ObjectId(bookClubId) });

};



const END_CURRENT_SESSION = async (moderatorId, bookClubId) => {
    if (!await IS_EXIST_BOOK_CLUB(bookClubId)) throw 'Book club does not exist';
    const bookClub = await GET_BOOK_CLUB_BY_ID(bookClubId);
    if (bookClub.moderator._id.toString() !== moderatorId) throw 'Only the moderator can end the session';

    // Mark the current discussion as closed
    const currentDiscussion = bookClub.discussions.find(d => d.status === 'active');
    if (!currentDiscussion) throw 'No active discussion to close';

    await updateDiscussionStatus(currentDiscussion._id, 'closed');

    return 'Session ended successfully';
};



const DELETE_BOOK_CLUB = async(book_club_id) => {
    if (!book_club_id || typeof book_club_id !== 'string' || book_club_id.trim() === "") throw 'Error: id is not a valid string'
    if (!IS_EXIST_BOOK_CLUB(book_club_id)) throw "Error: book id does not exist"
    
    let book_club = await GET_BOOK_CLUB_BY_ID(book_club_id)
    const filter = { _id: new ObjectId(book_club_id) };
    const result = await bookClubCollection.deleteOne(filter);
    if (result.modifiedCount == 0) throw "Error: Failed Book Failed"
    return
}

const REMOVE_USER_FROM_BOOKCLUB = async(book_club_id, user_id) => {
    if (!book_club_id || typeof book_club_id !== 'string' || book_club_id.trim() === "") throw 'Error: book club id does not exist or is not a valid string'
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === "") throw 'Error: user id does not exist or is not a valid string'
    
    let book_club = await GET_BOOK_CLUB_BY_ID(book_club_id)
    const user = await GET_USER_BY_ID(user_id)
    const filter = { _id: new ObjectId(book_club_id) };

    if(user._id == book_club.moderator._id.toString()){
        const new_moderator = book_club.members[1]
        const update_moderator = { $set: {moderator: new_moderator}}
        const result1 = await bookClubCollection.updateOne(filter, update_moderator)
        if (result1.modifiedCount == 0) throw "Error: failed to update moderator"
    }
    const update = { $pull: {members: { _id: new ObjectId(user_id)}}}
    const result = await bookClubCollection.updateOne(filter, update);
    if (result.modifiedCount == 0) throw "Error: failed to remove user"
    return await GET_BOOK_CLUB_BY_ID(book_club_id)
}

export { IS_EXIST_BOOK_CLUB, GET_BOOK_CLUB_BY_ID, CREATE_BOOK_CLUB, JOIN_BOOK_CLUB, UPDATE_BOOK_CLUB_CURRENT_BOOK, DELETE_BOOK_CLUB, REMOVE_USER_FROM_BOOKCLUB, END_CURRENT_SESSION, START_NEW_SESSION}
