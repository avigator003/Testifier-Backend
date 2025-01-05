const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };


const RawMaterialBill = new Schema({
    seller_name:[{ type: Schema.Types.ObjectId, ref: 'sellers' }],
    amount:String,
    raw_material_bill_photo:String,
    raw_material_photo_bill_name:String,
    raw_material_bill_Date_time:Date,
    bill_type:String,
    history:[{ history_type: String,created_at: { type: Date, default: Date.now } }],
},schemaOptions)

module.exports = mongoose.model('RawMaterialBill', RawMaterialBill)





