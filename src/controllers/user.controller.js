// controllers generally handles the http request send by users and after that they send response like 200 i.e. OK etc

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";



const generateRefreshAndAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(505, "Something went wrong while generating refresh and access token")
  }
}



const registerUser = asyncHandler( async (req, res) => {
    
  // **To check wheather everything is working or not using postman use this code :-
  // res.status(200).json({ 
    //     message: 'OK'
    // })

    // **Logic and 9 steps involved while registering a user in database:-
    // STEP 1: get user details from frontend

    const {fullName, email, username, password} = req.body; // req.body handles incoming data from forms and JSON but for URL we have to do something else
    console.log("username: ", username);

    // STEP 2: validation - not empty

    if(
      [fullName, email, username, password].some((field) => {
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

    const existedUser = await User.findOne({ // .findOne returns whatever field it finds first out of the given no. of fields
      $or: [{username}, {email}]
    })

    if(existedUser){
      throw new ApiError(409, "User with email or username already exists");
    }


    // STEP 4: check for images, check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path;

    //  const coverImageLocalPath = req.files?.coverImageLocalPath[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

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

    console.log(avatar);
    console.log(coverImage);

    // STEP 6: create user object - create entry in db

    const user = await User.create({
      username,
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password
    })

    console.log("The user is: ", user)

    // STEP 7 & 8: remove password and refresh token field from response + check if user is created in db

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken" // means we dont want these field by default every field is selected
    )

    console.log(createdUser);

    if(!createdUser){
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    // STEP 8: check for user creation // done in above step

    // STEP 9:  return res

    return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
    )

} )

const loginUser = asyncHandler( async (req, res) => {
  // Steps involved while logging in the user

  // STEP 1: take data/credentials from user
  const {email, fullName, username} = req.body;

  // STEP 2: check atleast email or username must be send by user
  if(!(username || email)){
    throw new ApiError(400, "username or email is required")
  }

  // STEP 3: check username/email should exists in db
  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  // STEP 4: check password
  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401, "Invalid user credentials")
  }

  // STEP 5: generate refresh and access tokens
  // we created a method for this step for our convinience
  const {accessToken, refreshToken} = await generateRefreshAndAccessToken(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken"); // to get the updated user with refresh token but remember it may increase the cost

  // STEP 6: send cookies
  const options = {
    httpOnly: true, // with this the cookies will be read only and can only be changed in backend
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options) // we can use .cookie here bcz we have set a middleware in the app.js file i.e. app.use(cookieParser())
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, refreshToken, accessToken
      },
      "User successfully logged in"
    )
  )

})

const logOutUser = asyncHandler(async (req, res) => {
  // now we have access to req.user bcz of auth middleware

  await User.findByIdAndUpdate(  // takes 2 args 1st is id and then what to update
    req.user._id,
    {
      $set: { // all the fields you want to set put inside it
        refreshToken: undefined
      }
    },
    {
      new: true // this will give us the updated values in response(res)
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  // now we will remove the cookies
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged out"))

})

export { 
  registerUser,
  loginUser,
  logOutUser
}


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