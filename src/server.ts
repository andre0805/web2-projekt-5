import express from 'express';
import { auth, requiresAuth } from 'express-openid-connect';
import path from 'path';
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client';
import Post from './models/Post';

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;
const baseURL = host == 'localhost' ? `http://${host}:${port}` : `https://${host}`;

const app = express();
const viewsPath = path.join(__dirname, '/public/views');
app.set("views", viewsPath);
app.set("view engine", "ejs");
app.use("/scripts", express.static(__dirname + '/public/scripts'));
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

const prisma = new PrismaClient();

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
    const posts: Post[] = await prisma.posts.findMany({
        include: {
            likes: true
        },
        orderBy: {
            published_at: 'desc'
        }
    })
    .then((posts) => {
        return posts.map((post) => {
            const likes = post.likes.length;
            const userLiked = post.likes.some((like) => like.user_id == req.oidc.user!.sub);
            return new Post(post.id, post.author, post.published_at, post.title, post.description, likes, userLiked);
        });
    });

    // console.log(JSON.stringify(posts, null, 2));
    
    res.render("posts", { user: req.oidc.user, posts: posts });
});

app.get("/posts/:id", requiresAuth(), async (req, res) => {
    console.log("id", req.params.id);

    const post: Post | null = await prisma.posts.findUnique({
        include: {
            likes: true
        },
        where: {
            id: req.params.id
        }
    })
    .then((post) => {
        if (post) {
            const likes = post.likes.length;
            const userLiked = post.likes.some((like) => like.user_id == req.oidc.user!.sub);
            return new Post(post.id, post.author, post.published_at, post.title, post.description, likes, userLiked);
        } else {
            return null;
        }
    });

    if (!post) {
        res.status(404).send("Post not found!");
        return;
    }

    res.render("post", { user: req.oidc.user, post: post });
});

app.get("/like/:postId", requiresAuth(), async (req, res) => {
    const postId = req.params.postId;

    const post: Post | null = await prisma.posts.findUnique({
        include: {
            likes: true
        },
        where: {
            id: postId
        }
    })
    .then((post) => {
        if (post) {
            const likes = post.likes.length;
            const userLiked = post.likes.some((like) => like.user_id == req.oidc.user!.sub);
            return new Post(post.id, post.author, post.published_at, post.title, post.description, likes, userLiked);
        } else {
            return null;
        }
    });

    if (!post) {
        res.status(404).send("Post not found!");
        return;
    }

    if (post.userLiked) {
        await prisma.likes.deleteMany({
            where: {
                post_id: postId,
                user_id: req.oidc.user!.sub
            }
        });
    } else {
        await prisma.likes.create({
            data: {
                post_id: postId,
                user_id: req.oidc.user!.sub
            }
        });
    }

    res.status(200).send();
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