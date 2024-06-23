// controllers generally handles the http request send by users and after that they send response like 200 i.e. OK etc

import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    
  // **To check wheather everything is working or not using postman use this code :-
  // res.status(200).json({ 
    //     message: 'OK'
    // })

    // **Logic and 9 steps involved while registering a user in database:-
    // STEP 1: get user details from frontend

    const {fullName, email, userName, password} = req.body; // req.body handles incoming data from forms and JSON but for URL we have to do something else
    console.log("Email: ", email);

    // STEP 2: validation - not empty

    if(
      [fullName, email, userName, password].some((field) => {
        field?.trim() ===""
      })
    ){
      throw new ApiError(400, "All fields are required");
    }

    // Alternative validation:-
    // if (fullName.trim === "") {
    //   throw new ApiError(400, "FullName is required")
    // } and so on for each field


    // STEP 3: check if user already exists: username, email

    const existedUser = User.findOne({ // .findOne returns whatever field it finds first out of the given no. of fields
      $or: [{userName}, {email}]
    })

    if(existedUser){
      throw new ApiError(409, "User with email or userName already exists");
    }


    // STEP 4: check for images, check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImageLocalPath[0]?.path;
    console.log(avatarLocalPath);
    console.log(coverImageLocalPath);

    if(!avatarLocalPath){
      throw new ApiError(400, "Avatar image is required");
    }

    // STEP 5: upload them to cloudinary, avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath); // that's why we used async method in the parent func bcz it will take tym
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
      throw new ApiError(400, "Avatar image is required");
    }

    // STEP 6: create user object - create entry in db

    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      userName: userName.toLowerCase()
    })

    // STEP 7 & 8: remove password and refresh token field from response + check if user is created in db

    const createdUser = User.findById(user._id).select(
      "-password -refreshToken" // means we dont want these field by default every field is selected
    )

    if(!createdUser){
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    // STEP 8: check for user creation // done in above step

    // STEP 9:  return res

    return res.status(201).json(
      new ApiResponse(201, createdUser, "User registered successfully")
    )

} )

export {registerUser}


// If we have to do it in one file:-
/*
const registerUser = async (req, res) => {
  try {
    res.status(200).json({
      message: 'User registered successfully' // Or a more specific message
    });
  } catch (err) {
    // Handle errors here (e.g., log the error, send an error response)
    console.error(err);
    res.status(500).json({ message: 'Error registering user' });
  }
};

*/