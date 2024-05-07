import { ObjectId } from 'mongodb';
import * as mongoCollections from '../config/mongoCollections.js';
import * as bookAPI from './books.js';
import * as bookClubAPI from './book_club.js';
import * as userAPI from './user.js';

const bookClubCollection = await mongoCollections.books_clubs();
const bookCollection = await mongoCollections.books();

const createDiscussion = async (clubId, bookId) => {
    if (!clubId || typeof clubId !== 'string' || clubId.trim() === "") throw 'Error: user id does not exist or is not a valid string';
    if (!bookId || typeof bookId !== 'string' || bookId.trim().length === 0) throw 'Invalid book key';
    if (!bookAPI.IS_EXIST_BOOK(bookId) || !bookClubAPI.IS_EXIST_BOOK_CLUB(clubId)) throw "Either the book club or book does not exist";

    const book_club = bookClubAPI.GET_BOOK_CLUB_BY_ID(clubId);
    const book = bookAPI.BOOK_SEARCH_BY_KEY(bookId);

    const discussion = {
        _id: new ObjectId(),
        book: {
            _id: bookId,
            title: book.title,
            author: book.author,
            img: book.img
        },
        active: true,
        threads: [],
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const insertResult = await bookClubCollection.updateOne(
        { _id: new ObjectId(clubId) },
        { $push: { discussions: discussion } }
    );

    if (insertResult.modifiedCount === 0) throw 'Error: Failed to create discussion';

    return discussion;
};

const createThread = async (bookClubId, discussionId, userId, content) => {
    if (!bookClubId || typeof bookClubId !== 'string' || bookClubId.trim() === "") throw 'Error: bookClubId does not exist or is not a valid string';
    if (!discussionId || typeof discussionId !== 'string' || discussionId.trim() === "") throw 'Error: discussionId does not exist or is not a valid string';
    if (!userId || typeof userId !== 'string' || userId.trim() === "") throw 'Invalid user id';
    if (!content || typeof content !== 'string' || content.trim() === "") throw 'Invalid content key';

    const user = await userAPI.GET_USER_BY_ID(userId);
    const thread = {
        _id: new ObjectId(),
        createdBy: user.first_name,
        content,
        comments: [],
        createdAt: new Date()
    };

    const updateResult = await bookClubCollection.updateOne(
        { _id: new ObjectId(bookClubId), 'discussions._id': new ObjectId(discussionId) },
        { $push: { 'discussions.$.threads': thread } }
    );

    if (updateResult.modifiedCount === 0) throw 'Error: Failed to create thread';

    return thread;
};

const commentThread = async (bookClubId, discussionId, threadId, userId, comment) => {
    const commentObj = {
        _id: new ObjectId(),
        poster: userId,
        text: comment,
        createdAt: new Date()
    };

    const updateResult = await bookClubCollection.updateOne(
        {
          _id: new ObjectId(bookClubId),
          'discussions._id': new ObjectId(discussionId),
          'discussions.threads._id': new ObjectId(threadId)
        },
        {
          $push: {
            'discussions.$.threads.$[thread].comments': commentObj
          }
        },
        {
          arrayFilters: [{ 'thread._id': new ObjectId(threadId) }]
        }
      );

    if (updateResult.modifiedCount === 0) throw 'Error: Failed to add comment';

    return commentObj;
};

const updateDiscussionStatus = async (bookClubId, discussionId, newStatus) => {
    const updateResult = await bookClubCollection.updateOne(
        { _id: new ObjectId(bookClubId), 'discussions._id': new ObjectId(discussionId) },
        { $set: { 'discussions.$.active': newStatus } }
    );

    if (updateResult.modifiedCount === 0) throw 'Error: Failed to update discussion status';
};

const getThread = async (bookClubId, discussionId, threadId) => {
    const bookClub = await bookClubCollection.findOne(
        { _id: new ObjectId(bookClubId) },
        { projection: { 'discussions.$': 1 } }
    );

    if (!bookClub) throw 'Error: Book club not found';

    const discussion = bookClub.discussions.find(d => d._id.equals(new ObjectId(discussionId)));
    if (!discussion) throw 'Error: Discussion not found';

    const thread = discussion.threads.find(t => t._id.equals(new ObjectId(threadId)));
    if (!thread) throw 'Error: Thread not found';

    return thread;
};

export { createDiscussion, createThread, commentThread, getThread, updateDiscussionStatus };