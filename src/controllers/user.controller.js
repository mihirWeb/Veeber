// controllers generally handles the http request send by users and after that they send response like 200 i.e. OK etc

import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler( (req, res) => {
    res.status(200).json({
        message: 'OK'
    })
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