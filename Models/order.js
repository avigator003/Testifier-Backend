const mongoose = require('mongoose')
const Schema = mongoose.Schema
const schemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};
const Order = new Schema({
    products: [{
      product: { type: Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 0 }
    }],
    status: {type:String,default:'Pending'},
    invoiceNumber:{type:Number},
    user: { type: Schema.Types.ObjectId, ref: "User",default:'642f390117bb910d48869cfe'}
  }, schemaOptions);
  
  module.exports = mongoose.model('Order', Order);
  