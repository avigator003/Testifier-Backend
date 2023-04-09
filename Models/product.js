const mongoose = require('mongoose')
const Schema = mongoose.Schema
const schemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};
const Product = new Schema({
  product_photo: String,
  product_name: String,
  product_description: String,
  product_category:{ type: Schema.Types.ObjectId, ref: "Category" },
  prices: [{ price: Number, users: [{ type: Schema.Types.ObjectId, ref: "User" }]}]
}, schemaOptions)

module.exports = mongoose.model('Product', Product)