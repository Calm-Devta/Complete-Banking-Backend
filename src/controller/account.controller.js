const accountModel = require("../models/account.model");


/* *
 * - POST /api/account/
 * - Create a new account for the authenticated user
 * - protected route
*/
async function createAccountController(req, res) {

    const { status, currency } = req.body || {};
    const user = req.user;

    const isExistingAccount = await accountModel.findOne({ user: user._id}).populate("user", "name");

    if (isExistingAccount) {
        return res.status(400).json({
            message: "Account already exists for this user",
            AccountName: isExistingAccount.user.name,
            accountStatus: isExistingAccount.status,
        })
    }
    const account = await accountModel.create({
        user: user._id,
        status,
        currency
    })

    res.status(201).json({
        message: "Account created successfully",
        account
    })

}

async function getBalanceController(req, res) {

    try{    
    const account = await accountModel.findOne({ user: req.user._id });

        if (!account) {
            console.log("Account not found for user:", req.user._id);
            return res.status(404).json({
                message: "Account not found for this user",
                status: "failed"
            })
        }

        const balance = await account.getBalance();

        res.status(200).json({
            message: "Balance fetched successfully",
            balance: balance,
            status: "success"
        })
    }
    catch (error) {
        console.error("Error fetching balance:", error);
        res.status(500).json({
            message: "Internal server error",
            status: "failed"
        })
    }
}


module.exports = {
  createAccountController,
  getBalanceController
}