const mopngoose = require("mongoose");

const ledgerSchema = new mopngoose.Schema({
  account: {
    type: mopngoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "Account is required"],
    index: true,
    immutable: true,
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount cannot be negative"],
    immutable: true,
  },
  transaction: {
    type: mopngoose.Schema.Types.ObjectId,
    ref: "transaction",
    required: [true, "Transaction is required"],
    index: true,
    immutable: true,
  },
  type: {
    type: String,
    enum: {
        values: ["credit", "debit"],
        message: "Type can only be credit or debit",
    },
    required: [true, "Type is required"],
    immutable: true,
},

});

function preventLedgerModification(){
    throw new Error("Ledger entries cannot be modified or deleted");
}

ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);   
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndRemove", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);


const ledgerModel = mopngoose.model("ledger", ledgerSchema);

module.exports = ledgerModel;
