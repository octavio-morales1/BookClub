import { ObjectId } from 'mongodb';
import * as mongoCollections from '../config/mongoCollections.js';

import { GET_USER_BY_ID, IS_EXIST_USER } from './user.js'
import { BOOK_SEARCH_BY_KEY, IS_EXIST_BOOK } from './books.js'

const userCollection = await mongoCollections.users();
const bookCollection = await mongoCollections.books();
const bookClubCollection = await mongoCollections.books_clubs();

const CREATE_REVIEW = async(user_id, book_id, title, rating, reivew_description) => {
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === "") throw 'Error: user id does not exist or is not a valid string'
    if (!book_id || typeof book_id !== 'string' || book_id.trim() === "") throw 'Error: book id does not exist or is not a valid string'
    if (!title || typeof title !== 'string' || title.trim() === "") throw 'Error: user id does not exist or is not a valid string'
    if (!rating || typeof rating !== 'number' || rating <= 0 || rating > 5) throw 'Error: number does not exist or number is not a number'
    if (!reivew_description || typeof reivew_description !== 'string' || reivew_description.trim() === "") throw 'Error: user id does not exist or is not a valid string'
    if (!IS_EXIST_BOOK(book_id)) throw 'Error: book does not exist'
    if (!IS_EXIST_USER(user_id)) throw 'Error: user does not exist'

    const book = await BOOK_SEARCH_BY_KEY(book_id)
    const user = await GET_USER_BY_ID(user_id)

    const review = {
        _id: new ObjectId(),
        book_id: book._id,
        reviewer_first_name: user.first_name,
        reviewer_last_name: user.last_name,
        rating:rating, 
        title:title,
        review:reivew_description, 
        review_date: new Date().toISOString().slice(0, 10)
    }

    const filter_for_user = { _id: new ObjectId(user_id) };
    const update_for_user = { $set: { reviews: user.reviews ? [...user.reviews, review] : [review]} };
    const result_for_user = await userCollection.updateOne(filter_for_user, update_for_user);
    if (result_for_user.modifiedCount == 0) throw "Error: appending review into user failed"


    const filter_for_book = { _id: book_id };
    const update_for_book = { $set: { reviews: book.reviews ? [...book.reviews, review] : [review]} };
    const result_for_book = await bookCollection.updateOne(filter_for_book, update_for_book);
    if (result_for_book.modifiedCount == 0) throw "Error: appending review into book failed"
    return await BOOK_SEARCH_BY_KEY(book_id);
}

const DELETE_REVIEW = async(book_id, user_id, review_id) => {
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === "") throw 'Error: user id does not exist or is not a valid string'
    if (!book_id || typeof book_id !== 'string' || book_id.trim() === "") throw 'Error: book id does not exist or is not a valid string'
    if (!review_id || typeof review_id !== 'string' || review_id.trim() === "") throw 'Error: book id does not exist or is not a valid string'
    if (!IS_EXIST_BOOK(book_id)) throw 'Error: book does not exist'
    if (!IS_EXIST_USER(user_id)) throw 'Error: user does not exist'

    const filter_for_user = { _id: new ObjectId(user_id) };
    const update_for_user = { $pull: {reviews: { _id: new ObjectId(review_id)}}}
    const result_for_user = await userCollection.updateOne(filter_for_user, update_for_user);
    if (result_for_user.modifiedCount == 0) throw "Error: failed to remove user"

    const filter_for_book = { _id: book_id };
    const update_for_book = { $pull: {reviews: { _id: new ObjectId(review_id)}}}
    const result_for_book = await bookCollection.updateOne(filter_for_user, update_for_user);
    if (result_for_user.modifiedCount == 0) throw "Error: failed to remove user"

    return await GET_BOOK_CLUB_BY_ID(book_id)
}


export {CREATE_REVIEW, DELETE_REVIEW}