const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser')
const path = require('path');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const User = require("./models/UserModel"); // user model for Mongoose
require("dotenv").config(); // for .env variable that is not released to public

// constants
const PORT = 8080;
const SESSION_SECRET = "secret123";
const SESSION_LIFETIME = 1000 * 60 * 60 * 2 // 2 hours
const SALTROUNDS = 10; // number of rounds of salting bcrypt performs

// application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(express.static(path.join(__dirname, '/views')));

// init sessions
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    cookie: {
        maxAge: SESSION_LIFETIME,
        sameSite: true,
        secure: false
    }
}));

// init mongoose
mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, (err) => {
    if (err) throw err;
    console.log("MongoDB connection established.")
});

// Load View Engine - Pug
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Index page route
app.get("/", async (req, res) => {
    const s = req.session;
    const profileUser = req.query.id;
    if(profileUser != undefined){
        const instance = await User.findOne({username: profileUser});
        res.render('index', {
            user: s.user,
            profileUser: {
                name: instance.name,
                username: instance.username,
                description: instance.description,
                image: instance.image,
            },
        });
    }
    else
    {
        res.redirect("/login")
    }
});

// Login page route
app.get("/login", (req, res) => {
    const s = req.session;
    if(s.user != undefined)
    {
        res.redirect(`/?id=${s.user.username}`)
    }
    else
    {
        res.render('login', {
            user: s.user,
        });
    }
});

// Register page route
app.get("/register", (req, res) => {
    const s = req.session;
    if(s.user != undefined)
    {
        res.redirect(`/?id=${s.user.username}`)
    }
    else
    {
        res.render('register', {
            user: s.user,
        });
    }
});

// Settings page route
app.get("/settings", (req, res) => {
    const s = req.session;
    if(s.user != undefined){
        res.render('settings', {
            user: s.user,
        });
    }
    else
    {
        res.redirect("/")
    }
});

// Register endpoint
app.post("/api/register", urlencodedParser, async (req, res) => {
    const {name, username, password} = req.body;
    const s = req.session;
    if((name && username && password) && (username.length >= 2 && username.length <= 20) && (password.length >= 6 && password.length <= 20) && (name.length <= 40))
    {
        // try and find object in database that has the username that is trying to register
        const instance = await User.findOne({username: username});
        // if not found
        if(instance == undefined)
        {
            // hash using bcrypt
            const salt = bcrypt.genSaltSync(SALTROUNDS);
            const hash = bcrypt.hashSync(password, salt);

            const newUser = new User({
                name: name,
                username: username,
                password: hash,
                description: "Placeholder description.",
                image: "https://media1.tenor.com/images/29047291777f636bc4176242baac61c0/tenor.gif"
            });
            const instance = await newUser.save();
            // update user object in session
            s.user = {
                id: instance._id,
                name: instance.name,
                username: instance.username,
                description: instance.description,
                image: instance.image
            };
            res.redirect(`/?id=${instance.username}`);
        }
        else
        {
            res.redirect("/login?register=error");
        }
    }
    else
    {
        res.redirect(`/login?register=error`)
    }
});

// Login endpoint
app.post("/api/login", urlencodedParser, async (req, res) => {
    const {username, password} = req.body;
    const s = req.session;
    if((username && password) && (username.length >= 2 && username.length <= 20) && (password.length >= 6 && password.length <= 20)){
        const instance = await User.findOne({username: username});
        if(instance != undefined){
            if(bcrypt.compareSync(password, instance.password))
            {
                // update session user object with User logging in
                s.user = {
                    id: instance._id,
                    name: instance.name,
                    username: instance.username,
                    description: instance.description,
                    image: instance.image
                };
                res.redirect(`/?id=${instance.username}`);
            }
            else
            {
                res.redirect(`/login?error=bad%credentials`)
            }
        }
        else{
            res.redirect("/");
        }
    }
    else
    {
        res.redirect(`/login?error=bad%credentials`)
    }
});

// Update endpoint
app.post("/api/update", urlencodedParser, async (req, res) => {
    const {name, description, image} = req.body;
    const s = req.session;
    const s3url = "REPLACE WITH GENERIC S3 URL TO YOUR BUCKET"
    console.log(`UPDATE QUERY: NAME=${name}, DESC=${description}, IMAGE=${image}`)
    if(s.user != undefined)
    {
        // check if any fields are undefined
        var n = s.user.name, d = s.user.description, i = s.user.image
        if(name != undefined)
            n = name
        if(description != undefined)
            d = description
        if(image != "")
            i = s3url + image

        console.log(`\nUpdating name=${n}, desc=${d}, image=${i}\n`)

        // update mongodb User object
        await User.updateOne({
            username: s.user.username
        },{
            name: n,
            description: d,
            image: i
        });

        // update session
        s.user = {
            id: s.user.id,
            name: n,
            username: s.user.username,
            description: d,
            image: i
        }

        res.redirect("/settings")
    }
    else
    {
        res.send("not logged in")
    }
});

// Logout endpoint
app.get("/api/logout", (req, res) => {
    const s = req.session;
    if(s.user)
        s.user = null; // empty user object inside session object
    res.redirect("/");
});

// listen on PORT
app.listen(PORT, () => console.log(`Server has started on port ${PORT}`));

module.exports = app;