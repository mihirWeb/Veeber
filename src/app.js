import express from "express";
import cors from "cors";
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


// importing routes
import userRouter from "./routes/user.routes.js"


// routes declaration
app.use("/api/v1/users", userRouter); // we have to use .use instead of .get bcz we have declared route in other file hence we have to get it by middleware if it was in the same file we can use .get

//URL will be
// http://localhost:8000/api/v1/users/register

export { app };