const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
const PORT = 8080; // default port 8080;

const urlDatabase = {
  b2xVn2: "https://www.lighthouselabs.ca",
  "9sm5xK": "https://www.google.com",
};

const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send(generateRandomString());
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies.username,
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const randomShortURL = generateRandomString();
  urlDatabase[randomShortURL] = req.body.longURL;
  res.redirect(`/urls/${randomShortURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies.username,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies.username,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  console.log(req.body);
  urlDatabase[req.params.shortURL] = req.body.updateURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
