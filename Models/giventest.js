const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };

const TestGiven = new Schema({
    userId:String,
    testId:String,
    overallAnalysis:{Correct:Number,Incorrect:Number,Skipped:Number},
    sectionalAnalysis:[{percentageCorrect:Number,
                      section:[{value:String,percentage:String,questionNumber:Number,category:String}]
                    }],
    confidenceLevelAnalysis:[{attempted:Number,correct:Number,wrong:Number,
      accuracy:Number,marks:Number,percentage:String,avatar:[{value:String,questionNumber:Number}]}],
    userInfoAnalysis:[{correctAnswer:String,userAnswer:String}],
    percentageArray:[]
},schemaOptions)

module.exports = mongoose.model('TestGiven', TestGiven)



