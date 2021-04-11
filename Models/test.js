const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };

const Tests = new Schema({
    instituteName:String,
    testName:String,
    testCategory:String,
    categoryType:String,
    numberOfQuestions:Number,
    questionPaperLink:String,
    answerPaperLink:String,
    answers:[{number:Number,options:String,category:String}]
},schemaOptions)

module.exports = mongoose.model('Tests', Tests)



