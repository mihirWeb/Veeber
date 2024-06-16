import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true
        },
        fullname: {
            type: String,
            required: true,
            index: true,
            trim: true
        },
        avatar: {
            type: String, // cloudnary url
            required: true
        },
        coverimage: {
            type: String, // cloudinary url
        },
        watchhistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

export const User = mongoose.model('User', userSchema);