// cloudinary is a 3rd party app which we use to upload our/users files for better optimization
// professionally we will take file from user and upload it on our local server using multer(a package used for file handling)
// after that we will take file from our local server and upload it to cloudinary
// and then we will unlink(delete) the file from local server

import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; // fs is an inbuilt nodejs package that is used to read, write, unlink etc the files

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return "Path not found";

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // console.log("File has been uploaded successfully: ", response.url);
        fs.unlinkSync(localFilePath); // only add this when your code runs successfully first add files without this dlt bcz it helps in debugging
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // removing the locally saved file path as the uploadation failed
        return "Cloudinary uploadation failed";
    }
}

export { uploadOnCloudinary }