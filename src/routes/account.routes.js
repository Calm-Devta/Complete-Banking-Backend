const express = require("express");

const router = express.Router();

// Controller required
const accountController = require("../controller/account.controller");

//Middleware required
const authMiddleware = require("../middleware/auth.middleware");



// POST /api/account
router.post("/", authMiddleware.userAutheticatorMiddleware ,accountController.createAccountController);

// GET /api/account/balance
router.get("/balance", authMiddleware.userAutheticatorMiddleware, accountController.getBalanceController);

module.exports = router;