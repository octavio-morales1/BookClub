import * as mongoCollections from '../config/mongoCollections.js';
import { BOOK_SEARCH_BY_KEY, IS_EXIST_BOOK } from './books.js';
import { IS_EXIST_USER, GET_USER_BY_ID } from './user.js';
import { createDiscussion } from './discussions.js';
import { ObjectId } from 'mongodb';

const userCollection = await mongoCollections.users();
const bookClubCollection = await mongoCollections.books_clubs();

const checkDiscussionExists = (discussions, discussionId) => {
    for (let discussion of discussions) {
        if (discussion._id.toString() === discussionId) {
            return true;
        }
    }
    return false;
}

const IS_EXIST_BOOK_CLUB = async (id) => {
    if (!id || typeof id !== 'string' || id.trim() === "") throw 'Error: is not a valid string';
    const bookClub = await bookClubCollection.findOne({ _id: new ObjectId(id) });
    return bookClub !== null;
}

const GET_BOOK_CLUB_BY_ID = async (id) => {
    if (!id || typeof id !== 'string' || id.trim() === "") throw 'Error: is not a valid string';
    if (!await IS_EXIST_BOOK_CLUB(id)) throw 'Error: book club does not exist or is not a valid string';
    return await bookClubCollection.findOne({ _id: new ObjectId(id) });
}

const CREATE_BOOK_CLUB = async (userId, name, description, currentBookKey) => {
    if (!userId || typeof userId !== 'string' || userId.trim() === "") throw 'Error: id does not exist or is not a valid string';
    if (!name || typeof name !== 'string' || name.trim() === "") throw 'Error: name does not exist or is not a valid string';
    if (!description || typeof description !== 'string' || description.trim() === "") throw 'Error: description text does not exist or is not a valid string';
    if (!IS_EXIST_USER(userId)) throw "Error: User does not exist";
    if (!IS_EXIST_BOOK(currentBookKey)) throw "Error: Book does not exist";

    const user = await GET_USER_BY_ID(userId);
    const book = await BOOK_SEARCH_BY_KEY(currentBookKey);

    const bookClub = {
        _id: new ObjectId(),
        name,
        moderator: user,
        description,
        currentBook: book,
        members: [user],
        discussions: []
    };

    const newInsertInformation = await bookClubCollection.insertOne(bookClub);
    if (!newInsertInformation.insertedId) throw 'Error: Insert failed!';

    const filterForUser = { _id: new ObjectId(userId) };
    const updateForUser = { $push: { book_clubs: bookClub } };
    const resultForUser = await userCollection.updateOne(filterForUser, updateForUser);
    if (resultForUser.modifiedCount === 0) throw "Error: appending book club failed";

    const initialDiscussion = await createDiscussion(bookClub._id.toString(), currentBookKey);

    const updateResult = await bookClubCollection.updateOne(
        { _id: bookClub._id },
        { $push: { discussions: initialDiscussion } }
    );

    if (updateResult.modifiedCount === 0) throw 'Error: Failed to create initial discussion';

    return bookClub;


    return bookClub;
}

const JOIN_BOOK_CLUB = async (userId, bookClubId) => {
    if (!userId || typeof userId !== 'string' || userId.trim() === "") throw 'Error: user id does not exist or is not a valid string';
    if (!bookClubId || typeof bookClubId !== 'string' || bookClubId.trim() === "") throw 'Error: book club id does not exist or is not a valid string';
    if (!await IS_EXIST_BOOK_CLUB(bookClubId)) throw "Error: Book club does not exist";

    const user = await GET_USER_BY_ID(userId);
    let bookClub = await GET_BOOK_CLUB_BY_ID(bookClubId);

    const filterForBookClub = { _id: new ObjectId(bookClubId) };
    const updateForBookClub = { $push: { members: user } };
    const resultForBookClub = await bookClubCollection.updateOne(filterForBookClub, updateForBookClub);
    if (resultForBookClub.modifiedCount === 0) throw "Error: appending user failed";

    const filterForUser = { _id: new ObjectId(userId) };
    const updateForUser = { $push: { bookClubsJoined: bookClub } };
    const resultForUser = await userCollection.updateOne(filterForUser, updateForUser);
    if (resultForUser.modifiedCount === 0) throw "Error: appending book club failed";

    return await GET_BOOK_CLUB_BY_ID(bookClubId);
}

const GET_DISCUSSION_BY_BOOKCLUB_ID = async (bookClubId, discussionId) => {
    if (!bookClubId || typeof bookClubId !== 'string' || bookClubId.trim() === "") throw 'Error: bookclub id does not exist or is not a valid string';
    if (!discussionId || typeof discussionId !== 'string' || discussionId.trim() === "") throw 'Error: discussion id does not exist or is not a valid string';

    const bookClub = await GET_BOOK_CLUB_BY_ID(bookClubId);
    if (!checkDiscussionExists(bookClub.discussions, discussionId)) throw "discussion does not exist in book club";

    const discussion = bookClub.discussions.find(d => d._id.toString() === discussionId);
    return discussion;
}

const UPDATE_BOOK_CLUB_CURRENT_BOOK = async (bookId, bookClubId) => {
    if (!bookId || typeof bookId !== 'string' || bookId.trim() === "") throw 'Error: user id does not exist or is not a valid string';
    if (!bookClubId || typeof bookClubId !== 'string' || bookClubId.trim() === "") throw 'Error: book club id does not exist or is not a valid string';
    if (!await IS_EXIST_BOOK_CLUB(bookClubId)) throw "Error: Book club does not exist";
    if (!IS_EXIST_BOOK(bookId)) throw "Error: Book does not exist";

    const book = await BOOK_SEARCH_BY_KEY(bookId);

    const filter = { _id: new ObjectId(bookClubId) };
    const update = { $set: { currentBook: book } };

    const result = await bookClubCollection.updateOne(filter, update);
    if (result.modifiedCount === 0) throw "Error: Updating book failed";
    return await GET_BOOK_CLUB_BY_ID(bookClubId);
}
    
const DELETE_BOOK_CLUB = async (bookClubId) => {
    if (!bookClubId || typeof bookClubId !== 'string' || bookClubId.trim() === "") throw 'Error: id is not a valid string';
    if (!await IS_EXIST_BOOK_CLUB(bookClubId)) throw "Error: book club does not exist";

    const filter = { _id: new ObjectId(bookClubId) };
    const result = await bookClubCollection.deleteOne(filter);
    if (result.deletedCount === 0) throw "Error: Failed to delete book club";
}
    
const REMOVE_USER_FROM_BOOKCLUB = async (bookClubId, userId) => {
    if (!bookClubId || typeof bookClubId !== 'string' || bookClubId.trim() === "") throw 'Error: book club id does not exist or is not a valid string';
    if (!userId || typeof userId !== 'string' || userId.trim() === "") throw 'Error: user id does not exist or is not a valid string';

    const bookClub = await GET_BOOK_CLUB_BY_ID(bookClubId);
    const user = await GET_USER_BY_ID(userId);

    const filterForBookClub = { _id: new ObjectId(bookClubId) };
    const updateForBookClub = { $pull: { members: { _id: new ObjectId(userId) } } };

    if (user._id.toString() === bookClub.moderator._id.toString()) {
        const newModerator = bookClub.members.find(m => m._id.toString() !== userId);
        if (!newModerator) throw "Error: Cannot remove the only member of the book club";
        updateForBookClub.$set = { moderator: newModerator };
    }

    const resultForBookClub = await bookClubCollection.updateOne(filterForBookClub, updateForBookClub);
    if (resultForBookClub.modifiedCount === 0) throw "Error: failed to remove user";

    const filterForUser = { _id: new ObjectId(userId) };
    const updateForUser = { $pull: { bookClubsJoined: { _id: new ObjectId(bookClubId) } } };
    const resultForUser = await userCollection.updateOne(filterForUser, updateForUser);
    if (resultForUser.modifiedCount === 0) throw "Error: failed to remove book club from user";

    return await GET_BOOK_CLUB_BY_ID(bookClubId);
}
    
    export { IS_EXIST_BOOK_CLUB, GET_BOOK_CLUB_BY_ID, CREATE_BOOK_CLUB, JOIN_BOOK_CLUB, UPDATE_BOOK_CLUB_CURRENT_BOOK, DELETE_BOOK_CLUB, REMOVE_USER_FROM_BOOKCLUB, GET_DISCUSSION_BY_BOOKCLUB_ID }