const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };

const TestGiven = new Schema({
    userId:String,
    testId:String,
    Attempted:Number,
    Correct:Number,
    Wrong:Number,
    Marks:Number,
    Accuracy:Number,
},schemaOptions)

module.exports = mongoose.model('TestGiven', TestGiven)



