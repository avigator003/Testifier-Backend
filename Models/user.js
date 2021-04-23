const mongoose = require('mongoose')
const Schema = mongoose.Schema
const crypto = require('crypto')
const config = require('../config')
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  };
const User = new Schema({
    name:String,
    userName: String,
    emailAddress:{type:String, unique:true},
    password: String,
    admin: { type: Boolean, default: false },
    phoneNumber:String,
    upscAttempts:Number,
    additionalSubjects:String,
    blocked: {type: Boolean, default: false},
    verified: {type: Boolean, default: true},
    courseSubscribed: {type: Boolean, default: false},
    testSubscribed: {type: Boolean, default: false},
    testSubscribedOn:Date,
    courseSubscribedOn:Date,
    numberOfShares:[{number:Number,testId:String}],
    testsGiven:[{testId:String,Right:Number,Wrong:Number,Percentage:Number,Confidence:Number}]
}, schemaOptions)


// crypto.createHmac('sha1', 'secret')
//              .update('mypasswssord')
//              .digest('base64')


// create new User document
User.statics.create = function(password,
    name,
  userName,
  emailAddress,
  phoneNumber,
  upscAttempts,
  additionalSubjects,
  admin) {
    const encrypted = crypto.createHmac('sha1', config.secret)
                      .update(password)
                      .digest('base64')

    const user = new this({
      name,
    userName,
    emailAddress,
        password: encrypted,
        phoneNumber,
        upscAttempts,
    additionalSubjects,
    
        admin
    })

    // return the Promise
    return user.save()
}

// find one user by using username
User.statics.findOneByEmailAddress = function(emailAddress) {
    return this.findOne({
        emailAddress
    }).exec()
}

// verify the password of the User documment
User.methods.verify = function(password) {
    const encrypted = crypto.createHmac('sha1', config.secret)
                      .update(password)
                      .digest('base64')
    console.log(this.password === encrypted)

    return this.password === encrypted
}

User.methods.assignAdmin = function() {
    this.admin = true
    return this.save()
}

module.exports = mongoose.model('User', User)