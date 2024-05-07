import { ObjectId } from 'mongodb';
import * as mongoCollections from '../config/mongoCollections.js';
import { IS_EXIST_BOOK } from './books.js';
import { IS_EXIST_BOOK_CLUB } from './book_club.js';

const discussionCollection = await mongoCollections.discussions();
const bookClubCollection = await mongoCollections.books_clubs();
const bookCollection = await mongoCollections.books();

const getPopularDiscussions = async () => {
  const discussionCollection = await mongoCollections.discussions();
  return await discussionCollection.find().sort({participantCount: -1}).limit(5).toArray();
};


const createDiscussion = async (clubId, bookId) => {

    if (!clubId || typeof clubId !== 'string' || clubId.trim() === "") throw 'Error: user id does not exist or is not a valid string'
    if (!bookId || typeof bookId !== 'string' || key.trim().bookId === 0) throw 'Invalid book key';
    if (!IS_EXIST_BOOK(bookId) || !IS_EXIST_BOOK_CLUB(clubId)) throw "Either the book club or book does not exist"

    const book_club = bookClubCollection.findOne( {_id: new ObjectId(clubId)} )
    const book = bookCollection.findOne( {_id: new ObjectId(bookId)} )

    const discussion = {
        _id: new ObjectId(),
        clubId,
        book: {
            _id: bookId,
            title: book.title,
            author: book.author,
            img: book.img
        },
        status: 'active',
        threads: [],
        createdAt: new Date(),
        updatedAt: new Date()
    };

  const insertResult = await discussionCollection.insertOne(discussion);
  if (!insertResult.insertedId) throw 'Error: Failed to create discussion';

  return discussion;
};

const createThread = async (discussionId, userId, title, content) => {
  const thread = {
    _id: new ObjectId(),
    createdBy: userId,
    title,
    content,
    comments: [],
    createdAt: new Date()
  };

  const updateResult = await discussionCollection.updateOne(
    { _id: new ObjectId(discussionId) },
    { $push: { threads: thread }, $currentDate: { updatedAt: true } }
  );

  if (updateResult.modifiedCount === 0) throw 'Error: Failed to create thread';
  return thread;
};

const commentThread = async (discussionId, threadId, userId, comment) => {
  const commentObj = {
    _id: new ObjectId(),
    createdBy: userId,
    text: comment,
    createdAt: new Date()
  };

  const updateResult = await discussionCollection.updateOne(
    { _id: new ObjectId(discussionId), 'threads._id': new ObjectId(threadId) },
    { $push: { 'threads.$.comments': commentObj } }
  );

  if (updateResult.modifiedCount === 0) throw 'Error: Failed to add comment';

  return commentObj;
};

const updateDiscussionStatus = async (discussionId, newStatus) => {
    const updateResult = await discussionCollection.updateOne(
        { _id: new ObjectId(discussionId) },
        { $set: { status: newStatus } }
    );

    if (updateResult.modifiedCount === 0) throw 'Error: Failed to update discussion status';
};

const getThread = async (discussionId, threadId) => {
  const discussion = await discussionCollection.findOne(
    { _id: new ObjectId(discussionId) },
    { projection: { 'threads.$': 1 } }
  );

  if (!discussion) throw 'Error: Discussion not found';

  const thread = discussion.threads.find(t => t._id.equals(new ObjectId(threadId)));
  if (!thread) throw 'Error: Thread not found';

  return thread;
};

export { getPopularDiscussions, createDiscussion, createThread, commentThread, getThread, updateDiscussionStatus };
