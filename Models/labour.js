const mongoose = require('mongoose')
const Schema = mongoose.Schema
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};
const Labour = new Schema({
    labour_name: String,
    labour_profile: String,
    labour_photo_name: String,
    mobile_number: { type: Number, unique: true },
    state:String,
    city:String,
    address: String,
    salary:Number,
    payableAmount:Number,
    dueAmount:Number,
    date_of_birth: {type: Date,required: false, null: true },
    salary_history: [{ created_at: { type: String} ,status:String, advance_payment: { type: Number, default: 0} , advance_payment_date: { type: Date, default: Date.now }}],
    attendance_history: [{ created_at: { type: Date},status:String}],
}, schemaOptions)


module.exports = mongoose.model('Labour', Labour)