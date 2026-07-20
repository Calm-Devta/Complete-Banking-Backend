const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userModel = require("../models/user.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../models/blacklist.model");

/**
 * - User Registration Controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
  const { email, name, password } = req.body;

  const isExists = await userModel.findOne({ email: email });

  if (isExists) {
    return res.status(422).json({
      message: "User already exists",
      status: "failed",
    });
  }

  const user = await userModel.create({
    email,
    name,
    password,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {expiresIn: "3D"})

  res.cookie("token", token, { maxAge: 259200000, httpOnly: true });

  res.status(201).json({
    message: "User created successfully",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name
    },
    token: token
  });

  emailService.sendRegistrationEmail(user.email, user.name);
}

/**
 * - User Login Controller
 * - POST /api/auth/login
*/
async function userLoginController(req, res){
    
    const {email, password} = req.body

    const user = await userModel.findOne({email: email}).select("+password")

    if(!user){
        return res.status(404).json({
            message: "Invalid email or User does not exist",
            status: "failed"
        })
    }

    const isPasswordValid = await user.comparePassword(password)

    if(!isPasswordValid){
        return res.status(401).json({
            message: "Invalid password",
            status: "failed"
        })
    }

    const token = jwt.sign({
        userId : user._id
    }, process.env.JWT_SECRET, {expiresIn: "3D"})

    res.cookie("token", token, { maxAge: 259200000, httpOnly: true });

    res.status(200).json({
        message: "User logged in successfully"
    })

}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */
async function userLogoutController(req, res) {

    const token = req.cookies.token || req.headers.authorrization?.split(" ")[ 1 ];

    if (!token) {
      res.status(200).json({
        message: "User logged out successfully",
      })
    }

    res.clearCookie("token");

    await tokenBlackListModel.create({
      token: token
    })
    
    res.status(200).json({
        message: "User logged out successfully",
        status: "success"
    });

}






module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController
};
