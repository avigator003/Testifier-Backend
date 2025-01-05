const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };


const Seller = new Schema({
    seller_name:String,
    email:String,
    contactNo:String, 
    history:[{ history_type: String,created_at: { type: Date, default: Date.now } }],
},schemaOptions)

module.exports = mongoose.model('Seller', Seller)





