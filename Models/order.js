const mongoose = require('mongoose')
const Schema = mongoose.Schema
const schemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  timezone: 'Asia/Kolkata' // change this to your desired timezone
};
const Order = new Schema({
    products: [{
      product: { type: Schema.Types.ObjectId,ref:"Product"},
      quantity: { type: Number, default: 0 }
    }],
    status: {type:String,default:'Pending'},
    invoiceNumber:{type:Number},
    user: { type: Schema.Types.ObjectId, ref: "User"},
    totalPrice:{type:Number , default:0},
    paymentStatus : {type:String,default:'Unpaid'},
    duePayment: {type:Number , default:0},
    orderDate : Date,
    paymentDate : Date
  }, schemaOptions);
  
  module.exports = mongoose.model('Order', Order);
  