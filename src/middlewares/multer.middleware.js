import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) { // handling req as well as file which is the main reason of using multer
      cb(null, './public/temp') // where to store file locally
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // used to generate a random name/id for the file user uploaded but we will avoid it for now
    //   cb(null, file.fieldname + '-' + uniqueSuffix) // the name by which it is going to save the file
        cb(null, file.originalname) // we will save it from the name user uploaded however it is not a best practice because there can be many files from same name but we will upload it instantly on cloud and then remove it so it will work
    }
  })
  
  export const upload = multer({ storage, })