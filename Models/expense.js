const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };


const Expense = new Schema({
    expense_name:String,
    amount:String,
    expense_photo:String,
    expense_photo_name:String,
    expense_Date_time:Date,
    expense_type:String,
    expense_status:String,
    history:[{ history_type: String,created_at: { type: Date, default: Date.now } }],
},schemaOptions)

module.exports = mongoose.model('Expense', Expense)





