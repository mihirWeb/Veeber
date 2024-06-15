// The purpose of this file is to send custom and better api response to user by making a class

class ApiResponse {
    constructor(statusCode, data, message){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}