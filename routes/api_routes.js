import { Router } from "express";

import * as userAPI from '../data/user.js'

import * as booksAPI from '../data/books.js'

import * as bookClubAPI from '../data/book_club.js'

const router = Router();


router.get('/', (req, res) => {
    // Render the registration form
    if (!req.session.user) {
      return res.redirect('/login');
    } else {
      return res.redirect(`/user/${req.session.user.username}`);
    }
});

router.get('/register', (req, res) => {
  return res.status(400).render("register");
});

router.post('/register', async (req, res) => {
  const {
    firstName, 
    lastName,
    email,
    username,
    password,
  } = req.body;

  try {
    let create = await userAPI.CREATE_USER(firstName, lastName, email, username, password);
    if (create.signupCompleted === true) {
      return res.render("login");
    } else {
      return res.status(500).send("Internal Server Error");
    }
  } catch (error) {
    console.log(error);
    return res.status(400).render("register", { error: error.toString() });
  }
});

// Login view
router.get('/login', (req, res) => {
  return res.status(400).render("login");
});

router.post('/login', async (req, res) => { 
  const {email, password } = req.body;
  try {
    let user = await userAPI.LOGIN_IN(email, password); 
    // { id, first_name, last_name, username, joined_date, book_clubs, reviews }
    req.session.user = user;
    return res.redirect(`/user/${req.session.user.username}`);
  } catch(error) {
    console.log(error)
    return res.status(400).render("login", {error: 'Invalid Username or Password'});
  }
});

// User profile route
router.get('/user/:userId', (req, res) => {
  try {
    const user= userAPI.GET_USER_BY_ID(req.params.userId); //supposed to have await (come back to this later)
    res.render("userinformation", { user: user });  // Assume you have a userinformation.handlebars
  } catch (error) {
      res.status(500).render("error", { error: "User not found" });
  }
});

router.get('/search', async (req, res) => {
  //const key = req.params.key;
  return res.render('search');
});

router.post('/books/search', async (req, res) => {
  const searchTerm = req.body.searchBookByName.trim();
  try {
      const books = await booksAPI.BOOK_SEARCH(searchTerm);
      res.render("searchResults", { books });
  } catch (error) {
      res.status(500).render("error", { error: "Error searching books" });
  }
});

// Display book details and reviews
router.get('/book/:bookId', (req, res) => {
  // Fetch and display details of the specified book
  // Fetch and display reviews for the book
  // Render the form to post a new review
  try {
    const book = booksAPI.BOOK_SEARCH_BY_KEY(req.params.bookId); //supposed to have await (come back to this later)
    return res.render("bookHomepage", {img: book.img, title: book.title, author:book.author, publishDate:book.publishDate, genre:book.genre, synopsis:book.synopsis});  // Assume you have a bookHomepage.handlebars
  } catch (error) {
    res.status(500).render("error", { error: "Book not found" });
    }
  });

  router.get('/bookclubs', async (req, res) => {
    try {
        const bookClubs = await bookClubAPI.GET_ALL_BOOK_CLUBS();
        res.render('bookclubsHomepage', { bookClubs });  // Assume you have a bookclubsHomepage.handlebars
    } catch (error) {
        res.status(500).render("error", { error: "Failed to fetch book clubs" });
    }
});

router.post('/bookclubs/create', async (req, res) => {
  const { name, description, userId } = req.body;
  try {
      const bookClub = await bookClubAPI.CREATE_BOOK_CLUB(userId, name, description);
      res.redirect(`/bookclubs/${bookClub._id}`);
  } catch (error) {
      res.status(500).render("error", { error: "Failed to create book club" });
  }
});

router.post('/bookclubs/:bookClubId/join', async (req, res) => {
  const bookClubId = req.params.bookClubId;
  try {
      await bookClubAPI.JOIN_BOOK_CLUB(req.session.user._id, bookClubId);
      res.redirect(`/bookclubs/${bookClubId}`);
  } catch (error) {
      res.status(500).render("error", { error: "Failed to join book club" });
  }
});

export default router;

// router.post('/books/:bookId/reviews', (req, res) => {
// // Handle posting a new review for the book
// });


// // List all book clubs
// router.get('/bookclubs', (req, res) => {
//     const userId = req.session.userId; // Assuming you have a session set up
  
//     try {
//       const bookClubs = await getUserBookClubs(userId);
//       res.render('bookclubs', { bookClubs });
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal Server Error');
//     }
//   });
  
//   router.post('/bookclubs', async (req, res) => {
//     const { bookId, clubName } = req.body;
//     const userId = req.session.userId; // Assuming you have a session set up
  
//     try {
//       // Validate the input data
//       if (!bookId || !clubName) {
//         return res.status(400).send('Book ID and club name are required');
//       }
  
//       // Create a new book club
//       const newBookClub = await createBookClub(userId, bookId, clubName);
  
//       // Redirect or render a success message
//       res.redirect('/bookclubs/' + newBookClub._id);
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal Server Error');
//     }
//   });
  
//   // Create a new book club
//   router.get('/bookclubs/create', (req, res) => {
//     // Render the form to create a new book club
//   });
  
//   router.post('/bookclubs/create', (req, res) => {
//     // Handle creating a new book club
//   });
  
//   // Display discussions for a book club
//   router.get('/bookclubs/:bookclubId', (req, res) => {
//     const bookClubId = req.params.bookClubId;
  
//     try {
//       const bookClub = await getBookClubById(bookClubId);
//       res.render('book-club', { bookClub });
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal Server Error');
//     }
//   });
  
//   // Join a book club
//   router.post('/bookclubs/:bookclubId/join', (req, res) => {
//     // Handle a user joining the specified book club
//   });
  
//   // Display a specific discussion in a book club
//   router.get('/bookclubs/:bookclubId/:discussionId', (req, res) => {
//     const { bookclubId, discussionId } = req.params;
//     try {
//       const discussion = await getDiscussionById(bookclubId, discussionId);
//       res.render('discussion', { discussion });
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal Server Error');
//     }
  
//   });


