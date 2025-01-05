const User = require('../../../Models/user')
const Labour = require('../../../Models/labour');
const Order = require('../../../Models/order');
const Product = require('../../../Models/product');
const config = require("../../../config")
const nodemailer = require("nodemailer")
const crypto = require('crypto')
const multer = require('multer');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3, bucketName, putPhoto, getPhoto, deletePhoto } = require('../../../index');
// Set up multer storage engine
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

var sesTransport = require('nodemailer-ses-transport');

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
  const { admin } = req.body
  var isAdminFilter = admin === undefined || null
  if (!isAdminFilter) {
    User.find({ admin: admin })
      .then(
        users => {
          res.json({ users })
        }
      )
  }
  else {
    User.find()
      .then(
        users => {
          res.json({ users })
        }
      )
  }
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
    if (data?.user_photo_name !== undefined) {
      deletePhoto(data?.user_photo_name)
    }
    if (data?.adhar_front_name !== undefined) {
      deletePhoto(data?.adhar_front_name)
    }
    if (data?.adhar_back_name !== undefined) {
      deletePhoto(data?.adhar_back_name)
    }
    res.status(200).json({ 'success': true, 'message': 'user removed' });
  }).catch(err => {
    console.log("Erro",err)
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.createUser = (req, res) => {
  upload.fields([
    { name: 'user_profile', maxCount: 1 },
    { name: 'adhar_front', maxCount: 1 },
    { name: 'adhar_back', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }
    const userData = { ...req.body };

    // Check if a new user_profile file was uploaded
    if (req.files['user_profile']) {
      const userPhotoFile = req.files['user_profile'][0];
      const fileName = userPhotoFile.originalname;
      await putPhoto(fileName, userPhotoFile.buffer, userPhotoFile.mimetype);
      const url = await getPhoto(fileName);
      userData.user_profile = url;
      userData.user_photo_name = fileName;
    }

    // Check if a new adhar_front file was uploaded
    if (req.files['adhar_front']) {
      const adharFrontFile = req.files['adhar_front'][0];
      const fileName = adharFrontFile.originalname;
      await putPhoto(fileName, adharFrontFile.buffer, adharFrontFile.mimetype);
      const url = await getPhoto(fileName);
      userData.adhar_front = url;
      userData.adhar_front_name = fileName;
    }

    // Check if a new adhar_back file was uploaded
    if (req.files['adhar_back']) {
      const adharBackFile = req.files['adhar_back'][0];
      const fileName = adharBackFile.originalname;
      await putPhoto(fileName, adharBackFile.buffer, adharBackFile.mimetype);
      const url = await getPhoto(fileName);
      userData.adhar_back = url;
      userData.adhar_back_name = fileName;
    }

    // Check if mobile number already exists
    User.findOne({ mobile_number: userData.mobile_number }, (err, user) => {
      if (err) {
        return res.status(400).json({ success: false, message: err });
      }
      if (user) {
        return res.status(200).json({ success: false, message: `Mobile number already registered with ${user?.user_name}` });
      }

      User.create({ ...userData })
        .then((data) => {
          res.status(200).json({ success: true, message: 'User Created Successfully', data });
        })
        .catch((err) => {
          res.status(400).json({ success: false, message: err });
        });
    });
  });
};


exports.updateUser = (req, res) => {
  upload.fields([
    { name: 'user_profile', maxCount: 1 },
    { name: 'adhar_front', maxCount: 1 },
    { name: 'adhar_back', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }

    const userData = { ...req.body };

    // Check if a new user_profile file was uploaded
    if (req.files['user_profile']) {
      await User.findById(req.params.id).then(data => {
        deletePhoto(data.user_photo_name);
      });

      const userPhotoFile = req.files['user_profile'][0];
      const fileName = userPhotoFile.originalname;
      await putPhoto(fileName, userPhotoFile.buffer, userPhotoFile.mimetype);
      const url = await getPhoto(fileName);
      userData.user_profile = url;
      userData.user_photo_name = fileName;
    }

    // Check if a new adhar_front file was uploaded
    if (req.files['adhar_front']) {
      await User.findById(req.params.id).then(data => {
        deletePhoto(data.adhar_front_name);
      });

      const adharFrontFile = req.files['adhar_front'][0];
      const fileName = adharFrontFile.originalname;
      await putPhoto(fileName, adharFrontFile.buffer, adharFrontFile.mimetype);
      const url = await getPhoto(fileName);
      userData.adhar_front = url;
      userData.adhar_front_name = fileName;
    }

    // Check if a new adhar_back file was uploaded
    if (req.files['adhar_back']) {
      await User.findById(req.params.id).then(data => {
        deletePhoto(data.adhar_back_name);
      });

      const adharBackFile = req.files['adhar_back'][0];
      const fileName = adharBackFile.originalname;
      await putPhoto(fileName, adharBackFile.buffer, adharBackFile.mimetype);
      const url = await getPhoto(fileName);
      userData.adhar_back = url;
      userData.adhar_back_name = fileName;
    }

    // Check if mobile number already exists
    User.findOne({ mobile_number: userData.mobile_number }, (err, user) => {
      if (err) {
        return res.status(400).json({ success: false, message: err });
      }
      if (user && user._id.toString() !== req.params.id) {
        return res.status(200).json({ success: false, message: 'Mobile number already registered', username: user.user_name });
      }

      User.findByIdAndUpdate(
        req.params.id,
        userData,
        { new: true }
      )
        .then((data) => {
          res.status(200).json({ success: true, message: 'User Updated Successfully', data });
        })
        .catch((err) => {
          console.log("eerr1", err)
          res.status(400).json({ success: false, message: err });
        });
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

  console.log("nekjfjew",req.body)

  User.find({ mobile_number: mobileNumber, password: password }).then(data => {
    console.log("data",data)
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

exports.dashboardDetails = (req, res) => {
  const userCountPromise = User.countDocuments({});
  const layoutCountPromise = Labour.countDocuments({});
  const orderCountPromise = Order.countDocuments({});
  const productCountPromise = Product.countDocuments({});

  Promise.all([userCountPromise, layoutCountPromise, orderCountPromise, productCountPromise])
    .then(counts => {
      const dashboardData = {
        users: counts[0],
        labours: counts[1],
        orders: counts[2],
        products: counts[3]
      };
      res.status(200).json({ 'success': true, 'data': dashboardData });
    })
    .catch(err => {
      console.log("err", err)
      res.status(400).json({ 'success': false, 'message': err });
    });
};