
/// In this file we are going to extend Error class of Nodejs
/// so that we can get our own custom errors and get specific issues we are facing

class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong", // if no error is passed to constructor then this message will run
        errors= [],
        stack= ""
    ){
        super(message) // super means jo overwright krna hi karna h
        this.statusCode = statusCode
        this.errors = errors
        this.data = null
        this.message = message
        this.success = false

        // ye ser ke uper se gaya
        if(stack){
            this.stack = stack;    
        } else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError }