import express from express;
import cors from cors;
import cookieParser from "cookie-parser";

const app = express()

// app.use is used to set the middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"})) // to tell the express that we will accept data in json format
app.use(express.urlencoded({extended: true, limit: "16kb"})) // to tell the express that we will accept data in url format
app.use(express.static("public")) // this is the static files that we want to provide to the client like favicon it accepts only one argument i.e. the path where are files here the path is "public" folder
app.use(cookieParser()); // this is used to put secure cookies in user browser like logged in sessions, user preferences etc.

export { app };