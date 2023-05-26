const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };

const Category = new Schema({
    category_name:String,
    category_description:String,
    category_photo_name:String,
    category_photo:String
},schemaOptions)

module.exports = mongoose.model('Category', Category)



