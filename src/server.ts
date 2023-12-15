import express from 'express';
import { auth, requiresAuth } from 'express-openid-connect';
import path from 'path';
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client';

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;
const baseURL = host == 'localhost' ? `http://${host}:${port}` : `https://${host}`;

const app = express();
const viewsPath = path.join(__dirname, '/public/views');
app.set("views", viewsPath);
app.set("view engine", "ejs");
app.use("/styles", express.static(__dirname + '/public/styles'));
app.use("/images", express.static(__dirname + '/public/images'));
app.use(express.urlencoded({ extended: true }));

dotenv.config()

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: baseURL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: 'https://dev-gzizuvkh2i7yo8yr.us.auth0.com',
    clientSecret: process.env.CLIENT_SECRET,
    authorizationParams: {
        response_type: 'code',
        scope: 'openid profile email',
    },
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.get("/", (req, res) => {
    if (req.oidc.isAuthenticated()) {
        res.redirect("/posts");
    } else {
        console.log(JSON.stringify(req.oidc.user, null, 2));
        res.render("index", { user: req.oidc.user });
    }
});

app.get("/posts", requiresAuth(), async (req, res) => {
    console.log(JSON.stringify(req.oidc.user, null, 2));
    res.render("posts", { user: req.oidc.user });
});

app.get("/signup", (req, res) => {
    res.oidc.login({
        returnTo: req.get('referer') || '/',
        authorizationParams: {      
            screen_hint: "signup",
        },
    });
});

app.listen(port, () => {
    console.log(`Listening at ${baseURL}`);
});