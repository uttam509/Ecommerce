const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail.js");
const crypto = require("crypto");
const cloudinary = require("cloudinary");

// Register a User 

exports.registerUser = catchAsyncErrors(async (req, res, next) => {

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
    });

    const { name, email, password } = req.body;

    const user = await User.create({
        name, email, password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    });

    sendToken(user, 201, res);
});

// Login User 

exports.loginUser = catchAsyncErrors(async (req, res, next) => {

    const { email, password } = req.body;

    // checking if user has given password and email both 

    if (!email || !password) {
        return next(new ErrorHander("Please Enter Email and Password", 400))
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHander("Invalid email or password", 401))
    }

    const isPasswordMatch = await user.comparePassword(password);
    // console.log(isPasswordMatch);

    if (!isPasswordMatch) {
        return next(new ErrorHander("Invalid email or password", 401))
    }

    sendToken(user, 200, res);

    // const token = user.getJWTToken();

    // res.status(200).json({
    //     success: true,
    //     token
    // })
});

// logout User

exports.logout = catchAsyncErrors(async (req, res, next) => {

    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    })

    res.status(200).json({
        success: true,
        message: "Logged Out"
    })

})

// forgot password

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new ErrorHander("User not found", 404))
    }

    // Get ResetPassword Token 

    const resetToken = await user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;
    // const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    const message = `Your Password reset token is :- \n\n  ${resetPasswordUrl} \n\n If you have not requested this email then, please ignore it`;
    // const message = `Your Password reset token is`;

    try {

        await sendEmail({
            email: user.email,
            subject: `Ecommerce Password Recovery`,
            message,

        });
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully..`
        })


    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorHander(error.message, 500))
    }

});

// Reset Password

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

    // Creating Token Hash
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now()
        }
    });

    if (!user) {
        return next(new ErrorHander("Reset Passowrd Token is invalid or has been expired", 404))
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHander("Password does not password", 404))
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendToken(user, 200, res)

})


// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    });

});

// Update User Password

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {


    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatch = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatch) {
        return next(new ErrorHander("Old password is incorrect", 400))
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHander("password does not match", 400))
    }

    user.password = req.body.newPassword;
    await user.save();

    sendToken(user, 200, res)

});

// Update User Profile

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {

    // console.log(req.body)
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    if (req.body.avatar !== "") {
        const user = await User.findById(req.user.id)
        const imageId = user.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId);

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }

    }
  
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    })

});


// Get All User -- Admin
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {

    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })

});

// Get Single User -- Admin
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHander(`User does not Exist with ID: ${req.params.id}`, 400))
    }
    res.status(200).json({
        success: true,
        user
    })

});


// Update User Role -- Admin
exports.updateUser = catchAsyncErrors(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }

    // let user = await User.findById(req.params.id);
 

    // if (!user) {
    //     return next(new ErrorHander(`User does not Exist with ID: ${req.params.id}`, 400))
    // }

     await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    })

});

// Delete User Role -- Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.params.id)

    

    if (!user) {
        return next(new ErrorHander(`User does not Exist with ID: ${req.params.id}`, 400))
    }
    
        const imageId = user.avatar.public_id;
        await cloudinary.v2.uploader.destroy(imageId);

    await user.remove();

    res.status(200).json({
        success: true,
        message: "User Deleted Successfully.."
    })

});
