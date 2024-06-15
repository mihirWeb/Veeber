// this utility folder contains generally helper and wrapper functions
// this file deals or wraps the db connection that we have done in index.js inside db folder
// helps in better code writting

// FIRST approach
const asyncHandler = (requestHandler) => async (req, res, next) => {
    try {   
        await requestHandler(req, res, next);        
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })        
    }
}


// SECOND approach
/*
const asyncHandler = (requestHandler) => { (req, res, next) => {
    Promise
    .resolve(requestHandler(req, res, next)) // if request is seccuessful
    .catch((err) => next(err)) // if request fails   
}}
*/

export { asyncHandler };