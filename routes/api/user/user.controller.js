const User = require('../../../Models/user')
const config = require("../../../config")
const nodemailer = require("nodemailer")
const crypto = require('crypto')
const multer = require('multer');

// Set up multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/users');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

// Initialize multer
const upload = multer({ storage });


var sesTransport = require('nodemailer-ses-transport');

var SESCREDENTIALS = {
  accessKeyId: "accesskey",
  secretAccessKey: "secretkey"
};

var transporter = nodemailer.createTransport(sesTransport({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
}));


exports.count = (req, res) => {

  // refuse if not an admin
  // if(!req.decoded.admin) {
  //     return res.status(403).json({
  //         message: 'you are not an admin'
  //     })
  // }

  User.find({ admin: false }).count({}).then(data =>
    res.status(200).json({ status: true, data })
  ).catch(error => {
    res.status(400).json({ status: false, message: error })
  })
}


/* 
    GET /api/user/list
*/

exports.list = (req, res) => {
  User.find({}, '-password').exec()
    .then(
      users => {
        res.json({ users })
      }
    )
}


/*
    POST /api/user/assign-admin/:username
*/
exports.assignAdmin = (req, res) => {
  // refuse if not an admin
  if (!req.decoded.admin) {
    return res.status(403).json({
      message: 'you are not an admin'
    })
  }

  User.findOneByUsername(req.params.username)
    .then(
      user => {
        if (!user) throw new Error('user not found')
        user.assignAdmin()
      }
    ).then(
      res.json({
        success: true
      })
    ).catch(
      (err) => { res.status(404).json({ message: err.message }) }
    )
}

exports.resetpassword = (req, res) => {


  User.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
    if (err) {
      res.json({ 'success': false, 'message': err });
    }
    if (!user) {
      res.status(404).json({ status: false, message: 'No user found' });
    } else {
      var url = "https://precedentonline.com" + '/setpassword/?token=' + user._id;
      var userEmail = user.emailAddress;
      // var emailText = 'please click on the below link for the forget password link';
      emailText += '<p><a href="' + url + '">click here</a>';
      var emailText = `<p>Hi ${user.firstName}</p><p>Please <a href="${url}">click here</a> to reset your password and continue using our portal</p><p>Regards</p>Precedent Team`

      var mailOptions = {
        from: 'informatics003@gmail.com',
        to: userEmail,
        subject: 'Forget Password Link',
        html: emailText
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          res.json({ 'success': false, 'message': error });
        } else {
          res.json({ 'success': true, 'message': 'email sent successfully' });
        }
      });
    }
  });

}


exports.setpassword = (req, res) => {
  User.findById(req.body.userid, function (err, user) {
    if (err) {
      res.json({ 'success': false, 'message': err });
    }
    if (!user) {
      res.json({ 'success': false, 'message': 'No user found' });
    } else {
      // bcrypt.genSalt(10, function(err, salt){
      //   bcrypt.hash(req.body.newpassword, salt, function(err, hash){
      //     if(err){
      //       res.json({ 'success': false, 'message': err });
      //     }
      const encrypted = crypto.createHmac('sha1', config.secret)
        .update(req.body.newPassword)
        .digest('base64')

      let userobject = {};
      userobject.password = encrypted;
      let query = { _id: req.body.userid }
      User.update(query, userobject, function (err) {
        if (err) {
          res.json({ 'success': false, 'message': err });
          return;
        } else {
          res.json({ 'success': true, 'message': 'Password Successfully Changed' });
        }
      });
      //   });
      // });
    }
  });

}
// };



exports.verify = (req, res) => {
  User.findByIdAndUpdate(req.body.userid, { $set: { verified: true } }).then(data => {
    res.json({ 'success': true, 'message': 'Profile verified' });
  }).catch(err => {
    res.json({ 'success': false, 'message': err });
  })

}


exports.deleteUser = (req, res) => {
  User.findByIdAndRemove(req.params.id).then(data => {
    res.status(200).json({ 'success': true, 'message': 'user removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })

}


// Update user
exports.createUser = (req, res) => {
  const uploadMiddleware = upload.single('user_profile');
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.' });
    }
    const userData = { ...req.body };
     // Check if a new file was uploaded
     let filePath = null; 
     if (req.file) {
      const fileName = req.file.filename;
      const filePath = "public/uploads/users/" + fileName;
      userData.user_profile = filePath;
    }

    User.create({ ...userData, user_profile: filePath})
      .then((data) => {
        res.status(200).json({ success: true, message: 'User Updated', data });
      })
      .catch((err) => {
        console.log("error1", err)

        res.status(400).json({ success: false, message: err });
      });
  });
};

// Update user
exports.updateUser = (req, res) => {
  const uploadMiddleware = upload.single('user_profile');
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.' });
    }
    const userData = { ...req.body };

    // Check if a new file was uploaded
    if (req.file) {
      const fileName = req.file.filename;
      const filePath = "public/uploads/users/" + fileName;
      userData.user_profile = filePath;
    }

    User.findByIdAndUpdate(
      req.params.id,
      userData,
      { new: true }
    )
      .then((data) => {
        res.status(200).json({ success: true, message: 'User Updated', data });
      })
      .catch((err) => {
        console.log("eerr1",err)
        res.status(400).json({ success: false, message: err });
      });
  });
};


exports.viewUser = (req, res) => {
  User.findById(req.params.id).then(data => {
    res.status(200).json({ 'success': true, 'message': 'user fetched', data });
  }).catch(err => {
    console.log(err)
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.loginByMobileNumber = (req, res) => {
  const mobileNumber = req.params.mobileNumber;
  
  User.findOne({ mobile_number: mobileNumber }).then(data => {
    if (data) {
      res.status(200).json({ 'success': true, 'message': 'user fetched', 'data': data });
    } else {
      res.status(400).json({ 'success': false, 'message': 'user not found', 'data': null });
    }
  }).catch(err => {
    console.log(err)
    res.status(400).json({ 'success': false, 'message': err });
  });
}

exports.loginByMobileNumberAndPassword = (req, res) => {
  const mobileNumber = req.body.mobileNumber;
  const password = req.body.password;

  User.find({ mobile_number: mobileNumber, password: password }).then(data => {
    if (data.length > 0) {
      res.status(200).json({ 'success': true, 'message': 'user fetched', 'data': data });
    } else {
      res.status(200).json({ 'success': false, 'message': 'user not found', 'data': null });
    }
  }).catch(err => {
    console.log(err)
    res.status(400).json({ 'success': false, 'message': err });
  });
}

exports.viewUserByMobileNumber = (req, res) => {
  User.findOne({ mobileNumber: req.params.mobileNumber }).then(data => {
    if (!data) {
      return res.status(404).json({ 'success': false, 'message': 'User not found' });
    }
    res.status(200).json({ 'success': true, 'message': 'User fetched', data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.sendmail = (req, res) => {

  var mailOptions = {
    from: req.body.email,
    to: "rapidIASAcademy@gmail.com",
    subject: 'Test Feedback',
    html: req.body.text
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res.json({ 'success': false, 'message': error });
    } else {
      res.json({ 'success': true, 'message': 'email sent successfully' });
    }
  });

}