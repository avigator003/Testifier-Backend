const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('../config')
const schemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};

const ApprovalTests = new Schema({
  instituteName: String,
  testName: String,
  testCategory: String,
  categoryType: String,
  numberOfQuestions: Number,
  questionPaperLink: String,
  answerPaperLink: String,
  paid: { type: Boolean, default: false },
  answers: [{ number: Number, options: String, category: String }],
  approvalUser: { type: Schema.Types.ObjectId, ref: "User" },

}, schemaOptions)

module.exports = mongoose.model('ApprovalTests', ApprovalTests)



