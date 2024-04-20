import axios from 'axios'; 

import {ObjectId} from 'mongodb';
import {books} from '../config/mongoCollections.js';

const CLEAN = (paragraph) => {
    if (!paragraph) return ''; // Return an empty string if the input is falsy
  
    return paragraph
      .replace(/\[.*?\]|\(.*?\)|\{.*?\}|https?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g, '')
      .replace(/[-\r\n|\r|\n]|:/g, '')
      .replace(/\*\*Contains\*\*.*?/g, '');
  };

function PAGE_SECTION(page) {
    let increment = 25 * ((page - 1) % 4 + 1);
    let page_number = Math.floor((page - 1) / 4) + 1;
    
    return {
        section: increment,
        page: page_number
    }
}

const GET_AUTHOR_DATA = async(key) => {
    if (typeof key !== 'string' || key.trim().length === 0) throw 'Invalid author key';
    try {
        const response = await axios.get(`https://openlibrary.org${key}.json`);
        const author = response.data
        return {author_key: key, name : author.name, img: author.photos? author.photos[0] : null}
    } catch {
        throw error ? error : `Failled to retrieve book data ${key}`
    }
} 

// const ITERATE_THROUGH_AUTHORS = async(authors) => {
//     if (!authors) return null
//     try {
//         const author_keys = authors.map((author) => author.author)
//         const author_data = [];
//         for (const key of author_keys) {
//             const author = await GET_AUTHOR_DATA(key.key);
//             author_data.push(author);
//         }
//         return author_data
//     } catch (error) {
//         error
//     }
// }

const ITERATE_THROUGH_AUTHORS = async (authors) => {
    if (!authors) return null;
    try {
        const author_keys = authors.map((author) => author.author);
        const author_data = [];
        for (const key of author_keys) {
            const author = await GET_AUTHOR_DATA(key.key);
            author_data.push(author);
        }
        return author_data;
    } catch (error) {
        throw error; // Throw the error instead of just logging it
    }
};

const CREATE_BOOK_DATA = async(key) => {
    if (typeof key !== 'string' || key.trim().length === 0) throw 'Invalid book key';
    const bookCollection = await books();
    try {
        const response = await axios.get(`https://openlibrary.org${key}.json`);
        const book = response.data
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const bookobj = {
            _id: key,
            title: book.title,
            author: book.authors ? await ITERATE_THROUGH_AUTHORS(book.authors) : null,
            publishedDate: book.created ? new Date(book.created.value).toLocaleDateString('en-US', options) : null,
            synopsis: book.description ? CLEAN(book.description.text) : null,
            ratings: [],
            reviews: [],
            genre: book.subject? book.subject : [],
            img: book.covers ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-M.jpg`: null
        }

        const newInsertInformation = await bookCollection.insertOne(bookobj);
        if (!newInsertInformation.insertedId) throw 'Error: Insert failed!';
        return bookobj

    } catch (error){
        throw error ? error : `Failled to retrieve book data ${key}`
    }
}

const BOOK_SEARCH_BY_KEY = async(key) => {
    if (!key || typeof key !== 'string' || key.trim() === "") throw 'Error: id does not exist or is not a valid string'
    const bookCollection = await books();
    let book = await bookCollection.findOne({ _id: key });
    if (book === null) {
        book = await CREATE_BOOK_DATA(key)
    }
    return book
}

const BOOK_SEARCH = async (title, site_page = 1) => {
    if (typeof title !== 'string' || title.trim().length === 0) throw 'Error: Invalid title';
    if (typeof site_page !== 'number' || site_page <= 0) throw 'Error: Invalid page number';
    const {section, page} = PAGE_SECTION(site_page)

    const encodedTitle = title.trim().replace(/ /g, '+').replace(/!$/, '');
    const url = `https://openlibrary.org/search.json?q=${encodedTitle}&page=${page}`;

    try {
        const response = await axios.get(url);
        const books_keys = response.data['docs'].map((book) => book.key)
        const bookDetails = [];
        for (const key of books_keys) {
            const bookData = await BOOK_SEARCH_BY_KEY(key);
            bookDetails.push(bookData);
        }
        return bookDetails;
    } catch (error) {
        throw `Failed to fetch data: ${error}`;
    }
}


const results = await BOOK_SEARCH("The lord of the rings", 1)
console.log(results)