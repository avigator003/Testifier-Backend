const mongoose = require('mongoose')
const Schema = mongoose.Schema
const crypto = require('crypto')
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};
const User = new Schema({
    user_name: String,
    user_profile: String,
    password: String,
    admin: { type: Boolean, default: false },
    user_type: String,
    mobile_number: { type: Number, unique: true },
    route_name: String,
    state:String,
    city:String,
    address: String,
    date_of_birth: {type: Date,required: false},
    vehicle_number: String,
}, schemaOptions)


User.virtual('decrypted_password').get(function() {
    const encryptedPassword = this.password;
    const decryptedPassword = crypto.createHmac('sha1', config.secret)
      .update(encryptedPassword)
      .digest('base64');
    return decryptedPassword;
});

module.exports = mongoose.model('User', User)