const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const redisService = require("../services/redis.service");
const mongoose = require("mongoose");
/**
 * - Create a new transaction between two accounts
 * - Steps:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */
async function createTransactionController(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  /**
   * - Validate request
   */

  try {
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
      return res.status(400).json({
        message: "Missing required fields",
        status: "failed",
      });
    }

    const fromUser = await accountModel
      .findById({
        _id: fromAccount,
      })
      .populate("user", "name email");

    const toUser = await accountModel
      .findById({
        _id: toAccount,
      })
      .populate("user", "name email");

    if (!fromUser) {
      return res.status(404).json({
        message: "Create an account before making a transaction",
        status: "failed",
      });
    }

    if (!toUser) {
      return res.status(404).json({
        message: "Recipient account does not exist",
        status: "failed",
      });
    }

    /**
     * - Validate idempotency key
     */
    const existingTransaction = await transactionModel.findOne({
      idempotencyKey: idempotencyKey,
    });

    if (existingTransaction) {
      if (existingTransaction.status === "completed") {
        return res.status(200).json({
          message: "Transaction already completed",
          transaction: existingTransaction,
          status: "success",
        });
      }

      if (existingTransaction.status === "pending") {
        return res.status(409).json({
          message: "Duplicate transaction detected",
          status: "failed",
        });
      }

      if (existingTransaction.status === "failed") {
        return res.status(409).json({
          message: "Please retry the transaction",
          status: "failed",
        });
      }

      if (existingTransaction.status === "reversed") {
        return res.status(409).json({
          message: "Transaction has been reversed",
          status: "failed",
        });
      }
    }

    /**
     * - Check account status
     */
    if (fromUser.status !== "active" || toUser.status !== "active") {
      return res.status(403).json({
        message: "One or both accounts are not active",
        status: "failed",
      });
    }

    /**
     * - Derive sender balance from ledger
     */
    const balance = await fromUser.getBalance();

    if (balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance for the transaction",
        status: "failed",
      });
    }

    /**
     * - Create transaction (PENDING)
     */
    let transaction;

    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      transaction = (
        await transactionModel.create(
          [
            {
              fromAccount,
              toAccount,
              amount,
              status: "pending",
              idempotencyKey,
            },
          ],
          { session },
        )
      )[0];

      const debitLedgerEntry = await ledgerModel.create(
        [
          {
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "debit",
          },
        ],
        { session },
      );

      await (() => {
        return new Promise((resolve) => setTimeout(resolve, 10 * 1000));
      })();

      const creditLedgerEntry = await ledgerModel.create(
        [
          {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "credit",
          },
        ],
        { session },
      );

      transaction.status = "completed";
      await transaction.save({ session });

      await transactionModel.findOneAndUpdate(
        { _id: transaction._id },
        { status: "completed" },
        { session },
      );
    } catch (error) {
      res.status(400).json({
        message: "Transaction in progress, please try wait",
      });
    }

    //Redis cache update for both accounts
    const fromUserBalance = await fromUser.getBalance();
    const toUserBalance = await toUser.getBalance();

    await redisService.setBalanceCache(fromUser._id, fromUserBalance);
    await redisService.setBalanceCache(toUser._id, toUserBalance);
    /*
     * - Send email notification
     */
    emailService.sendTransactionEmail(
      fromUser.user.email,
      fromUser.user.name,
      amount,
      toUser.user.name,
    );

    res.status(201).json({
      message: "Transaction completed successfully",
      transaction: transaction,
      status: "success",
    });

    /*
     * - In case trnasaction fails
     */
  } catch (error) {
    console.error("Transaction error:", error);
    await session.abortTransaction();
    session.endSession();

    emailService.sendTransactionFailureEmail(
      fromUser.user.email,
      fromUser.user.name,
      amount,
      toUser.user.name,
    );

    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "failed" },
      { session },
    );

    res.status(500).json({
      message: "Transaction failed",
      error: error.message,
      status: "failed",
    });
  }
}

async function createInitialFunds(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body || {};

  console.log(req.body);
  console.log({ toAccount, amount, idempotencyKey });

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "Missing required fields",
      status: "failed",
    });
  }

  const toUser = await accountModel
    .findById({
      _id: toAccount,
    })
    .populate("user", "name");

  if (!toUser) {
    return res.status(404).json({
      message: "Recipient account does not exist",
      status: "failed",
    });
  }

  const fromUser = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUser) {
    return res.status(404).json({
      message: "System account does not exist",
      status: "failed",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = await transactionModel({
    fromAccount: fromUser._id,
    toAccount: toUser._id,
    amount,
    status: "pending",
    idempotencyKey,
  });

  const createDebitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUser._id,
        amount: amount,
        transaction: transaction._id,
        type: "debit",
      },
    ],
    { session },
  );

  const createCreditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toUser._id,
        amount: amount,
        transaction: transaction._id,
        type: "credit",
      },
    ],
    { session },
  );

  transaction.status = "completed";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "Initial funds transfer completed successfully",
    transaction: transaction,
    status: "success",
  });
}

async function getTransactionHistoryController(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const account = await accountModel.findOne({
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
        status: "failed",
      });
    }

    const transactions = await ledgerModel
      .find({
        account: account._id,
      })
      .populate({
        path: "transaction",
        populate: [
          {
            path: "fromAccount",
            select: "user",
          },
          {
            path: "toAccount",
            select: "user",
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalTransactions = await ledgerModel.countDocuments({
      account: account._id,
    });

    return res.status(200).json({
      message: "Transaction history fetched successfully",
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTransactions / limit),
        totalTransactions,
        limit,
      },
      status: "success",
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);

    return res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
    });
  }
}

module.exports = {
  createTransactionController,
  createInitialFunds,
  getTransactionHistoryController,
};
