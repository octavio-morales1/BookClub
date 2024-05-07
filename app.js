import * as userAPI from './data/user.js'

import * as bookClubAPI from './data/book_club.js'

import * as bookAPI from './data/books.js'

import { 
    CREATE_REVIEW, 
    DELETE_REVIEW
} from './data/reviews.js'

import session from 'express-session';
import express from 'express';
import path from 'path';
const app = express();
import configRoutes from './routes/index.js';
import exphbs from 'express-handlebars';


import { dirname } from 'path';
import { fileURLToPath } from 'url';
    
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(
  session({
    name: "AuthCookie",
    secret: "This is a secret.. shhh don't tell anyone",
    resave: false,
    saveUninitialized: true,
  })
);

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
  if (req.body && req.body._method) {
    req.method = req.body._method;
    delete req.body._method;
  }

  next();
};

app.set("view engine", "handlebars");
app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(rewriteUnsupportedBrowserMethods);
app.use(express.static(path.join(__dirname, 'public'), { type: 'module' }));
app.engine('handlebars', exphbs.engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use((req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} `);
  next();
});
 
app.use("/login", (req, res, next) => {
  if(req.session.user){
    return res.redirect(`/user/${req.session.user.username}`);
  }
  next();
})

app.use("/register", (req, res, next) => {
  if(req.session.user){
    return res.redirect(`/user/${req.session.user.username}`);
  }
  next();
})
 
app.use("/user/:username", (req, res, next) => {
  if (!req.session.user) return res.redirect("/login")
  next()
});

app.use("/user/:username", (req, res, next) => {
  if (req.session.user.book_clubs.length == 0) return res.redirect("/search")
  next()
});

//  // Middleware 6
app.use('/logout', (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
});

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});
