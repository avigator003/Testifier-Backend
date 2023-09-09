const mongoose = require('mongoose')
const Schema = mongoose.Schema
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};

const AdvancePayment = new Schema({
    amount: { type: Number, default: 0 },
    date: { type:String},
});


const Labour = new Schema({
    labour_name: String,
    labour_profile: String,
    labour_photo_name: String,
    adhar_number: String,
    adhar_front: String,
    adhar_front_name: String,
    adhar_back: String,
    adhar_back_name: String,
    mobile_number: { type: Number, unique: true },
    state: String,
    city: String,
    address: String,
    salary: Number,
    payableAmount: Number,
    dueAmount: Number,
    date_of_birth: { type: Date, required: false, null: true },
    salary_history: [{
        created_at: { type: String }, 
        status: String,
        advance_payment: [AdvancePayment], 
    }],
    attendance_history: [{ created_at: { type: Date }, status: String, payableAmount: Number }],
    status: { type: String, default: "Active" },
}, schemaOptions)


module.exports = mongoose.model('Labour', Labour)