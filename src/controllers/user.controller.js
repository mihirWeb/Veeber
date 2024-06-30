// controllers generally handles the http request send by users and after that they send response like 200 i.e. OK etc

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateRefreshAndAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // console.log("user Id is: ", userId)

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      505,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // **To check wheather everything is working or not using postman use this code :-
  // res.status(200).json({
  //     message: 'OK'
  // })

  // **Logic and 9 steps involved while registering a user in database:-
  // STEP 1: get user details from frontend

  const { fullName, email, username, password } = req.body; // req.body handles incoming data from forms and JSON but for URL we have to do something else
  console.log("username: ", username);

  // STEP 2: validation - not empty

  if (
    [fullName, email, username, password].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Alternative validation:-
  // if (username.trim === "") {
  //   throw new ApiError(400, "username is required");
  //   console.log("username: ", username);
  // } // and so on for each field

  // STEP 3: check if user already exists: username, email

  const existedUser = await User.findOne({
    // .findOne returns whatever field it finds first out of the given no. of fields
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // STEP 4: check for images, check for avatar

  const avatarLocalPath = req.files?.avatar[0]?.path;

  //  const coverImageLocalPath = req.files?.coverImageLocalPath[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // console.log(avatarLocalPath);
  // console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  // STEP 5: upload them to cloudinary, avatar

  const avatar = await uploadOnCloudinary(avatarLocalPath); // that's why we used async method in the parent func bcz it will take tym
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
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
    password,
  });

  // alternate method

  // const user = new User({
  //   username,
  //   fullName,
  //   avatar: avatar.url,
  //   coverImage: coverImage?.url || "",
  //   email,
  //   password
  // });

  // try {
  //   await user.save();
  //   // Handle successful user creation (e.g., send a response)
  // } catch (error) {
  //   console.log("ERR: ", error);
  // }

  // console.log("The user is: ", user)

  // STEP 7 & 8: remove password and refresh token field from response + check if user is created in db

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // means we dont want these field by default every field is selected
  );

  console.log(createdUser);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // STEP 8: check for user creation // done in above step

  // STEP 9:  return res

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Steps involved while logging in the user

  // STEP 1: take data/credentials from user
  const { email, username, password } = req.body;

  // STEP 2: check atleast email or username must be send by user
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  // STEP 3: check username/email should exists in db
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // STEP 4: check password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // STEP 5: generate refresh and access tokens
  // we created a method for this step for our convinience
  // console.log("user is: ", user);
  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // to get the updated user with refresh token but remember it may increase the cost

  // STEP 6: send cookies
  const options = {
    httpOnly: true, // with this the cookies will be read only and can only be changed in backend
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // we can use .cookie here bcz we have set a middleware in the app.js file i.e. app.use(cookieParser())
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "User successfully logged in"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  // now we have access to req.user bcz of auth middleware

  await User.findByIdAndUpdate(
    // takes 2 args 1st is id and then what to update
    req.user._id,
    {
      $set: {
        // all the fields you want to set put inside it
        refreshToken: undefined,
      },
    },
    {
      new: true, // this will give us the updated values in response(res)
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // now we will remove the cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // route used when we have refresh token but access token is expired

  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken; // if coming from mobile
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (decodedToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired");
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          201,
          {
            accessToken,
            refreshToken,
          },
          "Access Token generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    throw new ApiError(401, "New password and confirm password should be same");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Incorrect old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(401, "Both credentials are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email, // above line and this one will do the same task
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(200, user, "Details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(500, "Something went wrong while uploading avatar file");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(500, "Something went wrong while uploading cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(401, "Username doesnt exist");
  }

  const channel = await User.aggregate([
    // {}, {}, {} ...so on // these are the stages of aggregation previous stage acts as the db source of next stage just like filters
    {
      $match: {
        // it returns the matched databases with matching the query field
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        // it performs join-like operation between collections
        from: "subscriptions", // name of the collection you want to join data from
        localField: "_id", // the field in the current collection that should match in the foreign collection
        foreignField: "channel", // the field in the foreign collection that should match the local feild
        as: "subscribers", // assigning the resulting array of matched document to the new field of current document
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        // used to project or give only selected fields from the newly formed databse
        fullName: 1,
        username: 1,
        email: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  console.log(channel);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      channel[0], // because aggregation returns the array of db
      "channels details fetched successfully"
    )
  );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if(!user){
    throw new ApiError(401, "Invalid user to search for watch history");
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      201,
      user[0]?.watchHistory,
      "Watch history fetched successfully"
    )
  )
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getUserWatchHistory
};

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
