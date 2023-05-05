const Labour = require('../../../Models/labour')
const multer = require('multer');

// Set up multer storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/labour');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
      }
  });

  // Initialize multer
const upload = multer({ storage });


exports.list = (req, res) => {
    Labour.find().then(data => {
        res.status(200).json({ 'success': true, 'message': 'All Labour fetched', data});
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })

}

exports.deleteLabour = (req, res) => {
    Labour.findByIdAndRemove(req.params.id).then(data => {
        res.status(200).json({ 'success': true, 'message': 'Labour removed' });
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })

}


// Create New Labour
exports.createLabour = (req, res) => {
    const uploadMiddleware = upload.single('labour_profile');
    uploadMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'Error uploading file.' });
      }
      const labourData = { ...req.body };
      let filePath = null; 
      if (req.file) {
       const fileName = req.file.filename;
       const filePath = "public/uploads/labour/" + fileName;
       labourData.labour_profile = filePath;
     }

     
    // Check if mobile number already exists
    Labour.findOne({ mobile_number: labourData.mobile_number }, (err, labour) => {
      if (err) {
        return res.status(400).json({ success: false, message: err });
      }
      if (labour) {
        return res.status(200).json({ success: false, message: `Mobile number already registered with ${labour?.user_name}` });
      }

      Labour.create({ ...labourData, labour_profile: filePath })
        .then((data) => {
          res.status(200).json({ success: true, message: 'Labour Created Successfully', data });
        })
        .catch((err) => {
          res.status(400).json({ success: false, message: err });
        });
    });
    });
  };


// Update labour
exports.updateLabour = (req, res) => {
  const uploadMiddleware = upload.single('labour_profile');
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.' });
    }

    const labourData = { ...req.body };  

    // Check if a new file was uploaded
    if (req.file) {
      const fileName = req.file.filename;
      const filePath = "public/uploads/labour/" + fileName;
      labourData.labour_profile = filePath;
    }

     // Check if mobile number already exists
     Labour.findOne({ mobile_number: labourData.mobile_number }, (err, labour) => {
      if (err) {
        return res.status(400).json({ success: false, message: err });
      }
      if (labour && labour._id.toString() !== req.params.id) {
        return res.status(200).json({ success: false, message: `Mobile number already registered with ${labour?.user_name}` });
      }

      Labour.findByIdAndUpdate(
        req.params.id,
        labourData,
        { new: true }
      )
        .then((data) => {
          res.status(200).json({ success: true, message: 'Labout Updated Successfully', data });
        })
        .catch((err) => {
          res.status(400).json({ success: false, message: err });
        });
    });
  });
};


exports.viewLabour = (req, res) => {
    Labour.findById(req.params.id).then(data => {
        res.status(200).json({ 'success': true, 'message': 'Labour fetched','labour':data });
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })
}

exports.viewLabourByMobileNumber = (req, res) => {
    Labour.findOne({ mobileNumber: req.params.mobileNumber }).then(data => {
      if (!data) {
        return res.status(404).json({ 'success': false, 'message': 'Labour not found' });
      }
      res.status(200).json({ 'success': true, 'message': 'Labour fetched', data });
    }).catch(err => {
      res.status(400).json({ 'success': false, 'message': err });
    })
  }

  exports.updateSalaryHistory = (req, res) => {
    const { month, salaryStatus } = req.body;
  
    // Find all labours to get their attendance history
    Labour.find()
      .then((labours) => {
        // Find the attendance history for the given date for each user
        const salaryHistoryPromises = labours.map((labour) => {
          return Labour.findOne(
            { _id: labour._id, "salary_history.created_at": month },
            { "salary_history.$": 1 }
          ).lean();
        });
  
        // Resolve all the promises to get the attendance history for all users
        Promise.all(salaryHistoryPromises)
          .then((salaryHistory) => {
            // Create an object to hold the attendance history for each user
            const salaryHistoryByUser = {};
            salaryHistory.forEach((history) => {
              if (history) {
                // If attendance history for the date is found, update it
                salaryHistoryByUser[history._id] = history.salary_history[0]._id;
              } else {
                // If attendance history for the date is not found, insert a new entry
                salaryHistoryByUser[history?._id] = null;
              }
            });
  
            // Iterate over the attendanceStatus array and update each user's attendance history
            Promise.all(
              salaryStatus.map((status) => {
                const userId = status.id;
                const salaryStatusValue = status.status;
                const salaryAdvancePayment = status.payment;
  
                if (salaryHistoryByUser[userId]) {
                  // If attendance history for the date is found, update it
                  return Labour.findOneAndUpdate(
                    { _id: userId, "salary_history._id": salaryHistoryByUser[userId] },
                    { $set: { "salary_history.$.status": salaryStatusValue, "salary_history.$.advance_payment": salaryAdvancePayment } },
                    { new: true }
                  ).exec();
                } else {
                  // If attendance history for the date is not found, insert a new entry
                  return Labour.findOneAndUpdate(
                    { _id: userId },
                    { $push: { salary_history: { created_at: month, status: salaryStatusValue, advance_payment: salaryAdvancePayment } } },
                    { new: true }
                  ).exec();
                }
              })
            )
              .then((updatedLabours) => {
                res.status(200).json({
                  success: true,
                  message: "Salary history updated for all users",
                  updatedLabours,
                });
              })
              .catch((err) => {
                console.log("err", err);
                res.status(400).json({ success: false, message: err.message });
              });
          })
          .catch((err) => {
            console.log("err", err);
            res.status(400).json({ success: false, message: err.message });
          });
      })
      .catch((err) => {
        console.log("err", err);
        res.status(400).json({ success: false, message: err.message });
      });
  };
  

  exports.updateAttendanceHistory = (req, res) => {
    const { date, attendanceStatus } = req.body;
   
    // Find all labours to get their attendance history
    Labour.find()
      .then((labours) => {
        // Find the attendance history for the given date for each user
        const attendanceHistoryPromises = labours.map((labour) => {
          return Labour.findOne(
            { _id: labour._id, "attendance_history.created_at": date },
            { "attendance_history.$": 1 }
          ).lean();
        });
  
        // Resolve all the promises to get the attendance history for all users
        Promise.all(attendanceHistoryPromises)
          .then((attendanceHistory) => {
            // Create an object to hold the attendance history for each user
            const attendanceHistoryByUser = {};
            attendanceHistory.forEach((history) => {
              if (history) {
                // If attendance history for the date is found, update it
                attendanceHistoryByUser[history._id] = history.attendance_history[0]._id;
              } else {
                // If attendance history for the date is not found, insert a new entry
                attendanceHistoryByUser[history?._id] = null;
              }
            });
  
            // Iterate over the attendanceStatus array and update each user's attendance history
            Promise.all(
              attendanceStatus.map((status) => {
                const userId = status.id;
                const attendanceStatusValue = status.status;
  
                if (attendanceHistoryByUser[userId]) {
                  // If attendance history for the date is found, update it
                  return Labour.findOneAndUpdate(
                    { _id: userId, "attendance_history._id": attendanceHistoryByUser[userId] },
                    { $set: { "attendance_history.$.status": attendanceStatusValue } },
                    { new: true }
                  );
                } else {
                  // If attendance history for the date is not found, insert a new entry
                  return Labour.findOneAndUpdate(
                    { _id: userId },
                    { $push: { attendance_history: { created_at: date, status: attendanceStatusValue } } },
                    { new: true }
                  );
                }
              })
            )
              .then((updatedLabours) => {
                res.status(200).json({
                  success: true,
                  message: "Attendance history updated for all users",
                  updatedLabours,
                });
              })
              .catch((err) => {
                console.log("err", err);
                res.status(400).json({ success: false, message: err.message });
              });
          })
          .catch((err) => {
            console.log("err", err);
            res.status(400).json({ success: false, message: err.message });
          });
      })
      .catch((err) => {
        console.log("err", err);
        res.status(400).json({ success: false, message: err.message });
      });
  };



  exports.getAttendanceHistoryByDate = (req, res) => {
    const { date } = req.params;
  
    Labour.find({})
      .populate({
        path: 'attendance_history',
        match: { created_at: new Date(date) },
        select: 'created_at status',
      })
      .then((labours) => {
        const attendanceHistoryByUser = {};
        labours.forEach((labour) => {
          const attendanceHistory = labour.attendance_history.find((history) => history.created_at.getTime() === new Date(date).getTime());
          attendanceHistoryByUser[labour._id] = attendanceHistory ? attendanceHistory.status : null;
        });
        res.status(200).json({ success: true, attendanceHistoryByUser });
      })
      .catch((err) => {
        console.log("err", err);
        res.status(400).json({ success: false, message: err.message });
      });
  };


  
  exports.getSalaryHistoryByMonth = (req, res) => {
    const { month } = req.params;
    Labour.find({})
      .populate({
        path: 'salary_history',
        match: { created_at: month },
        select: 'created_at status',
      })
      .then((labours) => {
        const salaryHistoryByUser = {};
        labours.forEach((labour) => {
          const salaryHistory = labour.salary_history.find((history) => history.created_at === month);
          salaryHistoryByUser[labour._id] = salaryHistory ? salaryHistory : null;
        });
        res.status(200).json({ success: true, salaryHistoryByUser });
      })
      .catch((err) => {
        console.log("err", err);
        res.status(400).json({ success: false, message: err.message });
      });
  };
  