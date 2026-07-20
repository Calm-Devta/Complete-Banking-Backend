const userModel = require("../models/user.model");
const tokenBlackListModel = require("../models/blacklist.model");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


async function userAutheticatorMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
            status: "failed"
        })
    }

    const isTokenBlacklisted = await tokenBlackListModel.findOne({
        token: token
    });

    if(isTokenBlacklisted){
        return res.status(401).json({
            message: "Token is blacklisted, don't be a hacker (LOGIN AGAIN)",
            status: "failed"
        })
    }
        
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: "failed"
            })
        }

        req.user = user;

        next();
    }
    catch (error) {
        return res.status(401).json({
            message : "Invalid user",
            status: "failed"
        })
    }
}

async function systemAccountAuthenticatorMiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
            status: "failed"
        })
    }

    const isTokenBlacklisted = await tokenBlackListModel.findOne({
        token: token
    });

    if(isTokenBlacklisted){
        return res.status(401).json({
            message: "Token is blacklisted, don't be a hacker (LOGIN AGAIN)",
            status: "failed"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId).select("+systemUser");

        if(!user.systemUser){
            return res.status(403).json({
                message: "Forbidden",
                status: "failed"
            })
        }

        req.user = user;

        next();

    }catch(error){
        return res.status(401).json({
            message : "Invalid user",
            status: "failed"
        })
    }

}

module.exports = {
    userAutheticatorMiddleware,
    systemAccountAuthenticatorMiddleware
}