const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();


// Middleware
app.use(express.json());
app.use(cookieParser());

// routes required
const authRouter = require('./routes/auth.routes');
const accountRouter = require('./routes/account.routes');
const transactionRouter = require('./routes/transaction.routes');

//Dummy
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Welcome to the Ledger API",
    status: "success",
  });
});

//Use routes

//Auth routes
app.use('/api/auth', authRouter);

//Account routes
app.use('/api/account', accountRouter);

//Transaction routes
app.use('/api/transaction', transactionRouter);

module.exports = app;