import mongoose from "mongoose";

// Logic - This schema creating will create a seperate document for each and every user which contain a "subscriber" and "channel" 
// now if we have to find the total subscribers of a channel then we have to raise a query in subscriberSchema model to search those
// documents whose channel value == "jis channel ke subscriber chahiye", for more info "subscriber schema video of chai and code" 

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

export const Subscription = mongoose.model("Subscription", subscriberSchema);