const mongoose = require('mongoose')
const Schema = mongoose.Schema
const schemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};
const Stock = new Schema({
  product:{ type: Schema.Types.ObjectId, ref: "Product" },
  quantity: Number,
  quantity_type: String,
}, schemaOptions)

module.exports = mongoose.model('Stock', Stock)