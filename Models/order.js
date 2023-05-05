const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  timezone: 'Asia/Kolkata' // change this to your desired timezone
};

const orderProductSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 0 }
}, { _id: false });

const OrderSchema = new Schema({
  products: [orderProductSchema],
  status: { type: String, default: 'Pending' },
  invoiceNumber: { type: Number },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  totalPrice: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'Unpaid' },
  duePayment: { type: Number, default: 0 },
  paidAmount :{type: Number, default: 0 },
  orderDate: { type: Date },
  paymentDate: { type: Date }
}, schemaOptions);

module.exports = mongoose.model('Order', OrderSchema);
