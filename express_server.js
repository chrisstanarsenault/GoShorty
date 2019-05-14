let express = require("express");
let app = express();
let PORT = 8080; //default port 8080;

let urlDatabase = {
  "b2xVn2": "https://www.lighthouselabs.ca",
  "9sm5xK": "https://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});