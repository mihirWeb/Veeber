import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: True
        },

        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: True            
        }
    },
    {
        timestamps: true
    }
)

export const Subscription = mongoose.model("subscription", subscriberSchema);