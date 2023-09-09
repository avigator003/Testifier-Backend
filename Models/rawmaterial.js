const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };


const RawMaterial = new Schema({
    raw_material_name:String,
    raw_material_description:String,
    raw_material_photo:String,
    category:[{ type: Schema.Types.ObjectId, ref: 'RawMaterialCategory' }],
    raw_material_photo_name:String,
    raw_material_min_quantity:Number,
    quantity_type:String,
    total_quantity:{type: Number , default :0 },
    history:[{ history_type: String, quantity:Number,created_at: { type: Date, default: Date.now } }],
},schemaOptions)

module.exports = mongoose.model('RawMaterial', RawMaterial)





