const express = require("express");

const router = express.Router();

// Controller required
const transactionController = require("../controller/transaction.controller");

//Middleware required
const authMiddleware = require("../middleware/auth.middleware");

// POST /api/transaction
router.post("/", authMiddleware.userAutheticatorMiddleware, transactionController.createTransactionController);

/**
 * - POST /api/transaction/system/initial-funds
 * - This route is used to add initial funds to the system account.
 */
router.post("/system/initial-funds", authMiddleware.systemAccountAuthenticatorMiddleware, transactionController.createInitialFunds);


module.exports = router;