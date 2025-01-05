const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };


const Rent = new Schema({
    user:String,
    amount:String,
    rent_Date_time:Date,
    rent_status:String,
    history:[{ history_type: String,created_at: { type: Date, default: Date.now } }],
},schemaOptions)

module.exports = mongoose.model('Rent', Rent)





