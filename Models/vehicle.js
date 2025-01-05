const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };


const Vehicle = new Schema({
    vehicle_no:String,
    rc_photo:String,
    inc_photo:String,
    puc_photo:String,
    fitness_photo:String,
    rc_expire_date:String,
    inc_expire_date:String,
    puc_expire_date:String,
    fitness_expire_date:String,
    rc_photo_name:String,
    inc_photo_name:String,
    puc_photo_name:String,
    fitness_photo_name:String,
    vehicle_status:String,
    history:[{ history_type: String,created_at: { type: Date, default: Date.now } }],
},schemaOptions)

module.exports = mongoose.model('Vehicle', Vehicle)





