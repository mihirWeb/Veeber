// import mongoose from "mongoose";  only used in second approach
// import { DB_NAME } from "./constants";  only used in second approach

import dotenv from 'dotenv';

dotenv.config({
    path: './env'
})


// In FIRST APPROACH we will set connection in seperate file that is
// inside db folder and in index.js file 

import connectDB from "./db/index.js";
import { app } from "./app.js"

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`MongoDB connected! App listening on: ${process.env.PORT}`);
    });

    app.on(error, () => {
        console.log("Err: ", error);
    })
})
.catch(err, () => {
    console.error("MongoDB connection failed!! ", err);
})




/*    SECOND APPROACH

import express from "express";

const app = express();
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error", (error) => {
            console.error("Err: ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port: ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERR: ", error);
        throw error;
    }
})()
*/