const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const app = express();
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = 8080; // default port 8080;

app.use(cookieSession({
  name: 'session',
  keys: ["purple-monkey-dishwasher"],
  maxAge: 10 * 60 * 1000, // expires after 10 minutes
}));

const urlDatabase = {
  b2xVn2: { longURL: "https://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "https://www.google.com", userID: "user2RandomID" },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    username: "Jake",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    username: "Frank",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Generates a random 6 character string.
const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Checks to make sure that neither the email or password text field is blank
// when submitted.  Returns true if one is missing.
const missingNameOrEmailOrPassword = (req, res) => {
  if (!req.body.username || !req.body.email || !req.body.password) {
    return true;
  }
  return false;
};

// Checks through users object to make sure the same email has not been used already.
// If email has been used, will return true.
const checkForSameEmail = (req, res) => {
  for (const user in users) {
    if (req.body.email === users[user].email) {
      return true;
    }
  }
  return false;
};

// filters through urlDatabase and returns only the URLs belonging to that user
const urlsForUsers = (id) => {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

const isUserLoggedIn = (req, res) => {
  if (req.session.user_id) {
    return true;
  }
  return false;
};

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send(generateRandomString());
});

app.get("/urls", (req, res) => {
  if (isUserLoggedIn(req)) {
    const templateVars = {
      urls: urlsForUsers(req.session.user_id.id),
      user_id: req.session.user_id,
    };
    res.render("urls_index", templateVars);
    console.log(req.body);
  } else {
    res.send(`Please <a href="/login">log in</a> or <a href="/register">register</a> first!`);
    console.log(req.body);
  }
});

app.post("/urls", (req, res) => {
  const randomShortURL = generateRandomString();
  urlDatabase[randomShortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id.id,
  };
  res.redirect(`/urls/${randomShortURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.session.user_id,
  };
  if (isUserLoggedIn(req)) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: req.session.user_id,
  };
  if (!isUserLoggedIn(req) || req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    res.send("You are not authorized to see this!");
  } else {
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!isUserLoggedIn(req) || req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    res.send("You are not authorized to delete this!");
  } else {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  if (!isUserLoggedIn(req) || req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    res.send("You are not authorized to update this!");
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.updateURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const { longURL } = urlDatabase[req.params.shortURL];
  console.log(urlDatabase[req.params.shortURL]);
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.session.user_id,
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  if (req.body.email && req.body.password) {
    for (const user in users) {
      if (req.body.email === users[user].email && bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session.user_id = users[user];
        res.redirect("/urls");
      }
    }
  }
  res.status(403).send(`Ooops, check your email or password!  Try <a href="/login">logging in</a> again!`);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.session.user_id,
  };
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  const randomUserID = generateRandomString();
  if (missingNameOrEmailOrPassword(req, res)) {
    res.status(400).send("You are missing your name, email or password");
  } else if (checkForSameEmail(req, res)) {
    res.status(400).send("This email has been used before");
  } else {
    users[randomUserID] = {
      id: randomUserID,
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
    };
    req.session.user_id = users[randomUserID];
  }
  console.log(users);

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
