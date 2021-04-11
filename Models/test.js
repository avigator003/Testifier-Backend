const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };

const Tests = new Schema({
    InstituteName:String,
    TestName:String,
    TestCategory:String,
    CategoryType:String,
    NumberOfQuestions:Number,
    Answers:[{number:Number,option:String,category:String}]
},schemaOptions)

module.exports = mongoose.model('Tests', Tests)



