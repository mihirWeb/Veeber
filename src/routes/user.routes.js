import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, logOutUser, loginUser, refreshAccessToken, registerUser, updateAccountDetail, updateCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([ // injecting middleware bcz while registering user we also have to deal with files like coverImage and avatar
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// Secure routes i.e. that requires authentication
router.route("/logout").post(verifyJWT, logOutUser); // auth middleware added
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/update-account-detail").post(verifyJWT, updateAccountDetail);
router.route("/update-avatar").post(verifyJWT, upload.single("avatar"), updateAccountDetail);
router.route("/update-cover-image").post(verifyJWT, upload.single("coverImage") , updateCoverImage);


export default router;