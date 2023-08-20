const { putPhoto, getPhoto, deletePhoto } = require('../../..');
const Labour = require('../../../Models/labour')
const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })



exports.list = (req, res) => {
  const { month } = req.body;
  const query = {};

  if (month) {
    query['salary_history.created_at'] = month;
  }

  Labour.find(query)
    .populate({
      path: 'salary_history',
      match: { created_at: month },
      select: 'created_at status advance_payment',
    })
    .then((labours) => {
      const salaryHistoryByUser = {};
      labours.forEach((labour) => {
        const salaryHistory = labour.salary_history.find((history) => history.created_at === month);

        const attendanceDays = labour.attendance_history.filter((attendance) => {
          return attendance?.created_at?.getMonth() === new Date(month).getMonth();
        }).length;

        const salaryPerDay = labour.salary / 30;
        const payableAmount = salaryPerDay * attendanceDays;
        const advancePayment = salaryHistory ? salaryHistory.advance_payment : 0;
        const dueAmount = payableAmount - advancePayment;

        salaryHistoryByUser[labour._id] = {
          ...labour._doc,
          advancePayment,
          payableAmount,
          dueAmount,
        };
      });

      res.status(200).json({ success: true, message: `Labour fetched for month: ${month}`, data: Object.values(salaryHistoryByUser) });
    })
    .catch((err) => {
      console.log("err", err);
      res.status(400).json({ success: false, message: err.message });
    });
};



exports.deleteLabour = (req, res) => {
  Labour.findByIdAndRemove(req.params.id).then(data => {
    if (data?.labour_photo_name !== undefined) {
      deletePhoto(data?.labour_photo_name)
    }
    if (data?.adhar_front_name !== undefined) {
      deletePhoto(data?.adhar_front_name)
    }
    if (data?.adhar_back_name !== undefined) {
      deletePhoto(data?.adhar_back_name)
    }
    res.status(200).json({ 'success': true, 'message': 'Labour removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

// Create New Labour
exports.createLabour = (req, res) => {
  upload.fields([
    { name: 'labour_profile', maxCount: 1 },
    { name: 'adhar_front', maxCount: 1 },
    { name: 'adhar_back', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }


    const labourData = { ...req.body };
    // Check if a new user_profile file was uploaded
    if (req.files['labour_profile']) {
      const labourPhotoFile = req.files['labour_profile'][0];
      const fileName = labourPhotoFile.originalname;
      await putPhoto(fileName, labourPhotoFile.buffer, labourPhotoFile.mimetype);
      const url = await getPhoto(fileName);
      labourData.labour_profile = url;
      labourData.labour_photo_name = fileName;
    }

      // Check if a new adhar_front file was uploaded
      if (req.files['adhar_front']) {
        const adharFrontFile = req.files['adhar_front'][0];
        const fileName = adharFrontFile.originalname;
        await putPhoto(fileName, adharFrontFile.buffer, adharFrontFile.mimetype);
        const url = await getPhoto(fileName);
        labourData.adhar_front = url;
        labourData.adhar_front_name = fileName;
      }
  
      // Check if a new adhar_back file was uploaded
      if (req.files['adhar_back']) {
        const adharBackFile = req.files['adhar_back'][0];
        const fileName = adharBackFile.originalname;
        await putPhoto(fileName, adharBackFile.buffer, adharBackFile.mimetype);
        const url = await getPhoto(fileName);
        labourData.adhar_back = url;
        labourData.adhar_back_name = fileName;
      }

    // Check if mobile number already exists
    Labour.findOne({ mobile_number: labourData.mobile_number }, (err, labour) => {
      if (err) {
        return res.status(400).json({ success: false, message: err });
      }
      if (labour) {
        return res.status(200).json({ success: false, message: `Mobile number already registered with ${labour?.user_name}` });
      }

      Labour.create({ ...labourData })
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

  upload.fields([
    { name: 'labour_profile', maxCount: 1 },
    { name: 'adhar_front', maxCount: 1 },
    { name: 'adhar_back', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }

    const labourData = { ...req.body };

   
    // Check if a new user_profile file was uploaded
    if (req.files['labour_profile']) {
      await Labour.findById(req.params.id).then(data => {
        deletePhoto(data.labour_photo_name);
      });

      const userPhotoFile = req.files['labour_profile'][0];
      const fileName = userPhotoFile.originalname;
      await putPhoto(fileName, userPhotoFile.buffer, userPhotoFile.mimetype);
      const url = await getPhoto(fileName);
      labourData.labour_profile = url;
      labourData.labour_photo_name = fileName;
    }

    // Check if a new adhar_front file was uploaded
    if (req.files['adhar_front']) {
      await Labour.findById(req.params.id).then(data => {
        deletePhoto(data.adhar_front_name);
      });

      const adharFrontFile = req.files['adhar_front'][0];
      const fileName = adharFrontFile.originalname;
      await putPhoto(fileName, adharFrontFile.buffer, adharFrontFile.mimetype);
      const url = await getPhoto(fileName);
      labourData.adhar_front = url;
      labourData.adhar_front_name = fileName;
    }

    // Check if a new adhar_back file was uploaded
    if (req.files['adhar_back']) {
      await Labour.findById(req.params.id).then(data => {
        deletePhoto(data.adhar_back_name);
      });

      const adharBackFile = req.files['adhar_back'][0];
      const fileName = adharBackFile.originalname;
      await putPhoto(fileName, adharBackFile.buffer, adharBackFile.mimetype);
      const url = await getPhoto(fileName);
      labourData.adhar_back = url;
      labourData.adhar_back_name = fileName;
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
  const { month } = req.body;
  const { id } = req.params
  const query = {};

  if (month) {
    query['salary_history.created_at'] = month;
  }

  Labour.find(query)
    .populate({
      path: 'salary_history',
      match: { created_at: month },
      select: 'created_at status advance_payment',
    })
    .then((labours) => {
      const salaryHistoryByUser = {};
      labours.forEach((labour) => {
        const salaryHistory = labour.salary_history.find((history) => history.created_at === month);
         
        const attendanceDays = labour.attendance_history.filter((attendance) => {
          return attendance?.created_at?.getMonth() === new Date(month).getMonth();
        }).length;

        const salaryPerDay = labour.salary / 30;
        const payableAmount = salaryPerDay * attendanceDays;
        const advancePayment = salaryHistory ? salaryHistory.advance_payment : 0;
        const dueAmount = payableAmount - advancePayment;

        salaryHistoryByUser[labour._id] = {
          ...labour._doc,
          advancePayment,
          payableAmount,
          dueAmount,
        };
      });

      console.log("d")
      res.status(200).json({ success: true, message: `Labour fetched for month: ${month}`, labour: salaryHistoryByUser[id] });
    })
    .catch((err) => {
      console.log("err", err);
      res.status(400).json({ success: false, message: err.message });
    });
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
        const attendanceHistory = labour.attendance_history.find((history) => history.created_at?.getTime() === new Date(date).getTime());
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
      match: { created_at: month, advance_payment_date: { $gte: month, $lt: month } },
      select: 'created_at status advance_payment',
    })
    .then((labours) => {
      const salaryHistoryByUser = {};
      labours.forEach((labour) => {
        const salaryHistory = labour.salary_history.find((history) => history.created_at === month);

        const attendanceDays = labour.attendance_history.filter((attendance) => {
          return attendance.created_at?.getMonth() === new Date(month).getMonth();
        }).length;

        const salaryPerDay = labour.salary / 30;
        const payableAmount = (salaryPerDay * attendanceDays).toFixed(2);
        const advancePayment = salaryHistory ? salaryHistory.advance_payment : 0;
        const dueAmount = (payableAmount - advancePayment).toFixed(2);

        salaryHistoryByUser[labour._id] = {
          ...labour._doc,
          advancePayment,
          payableAmount,
          dueAmount,
        };
      });


      res.status(200).json({ success: true, salaryHistoryByUser: Object.values(salaryHistoryByUser) });
    })
    .catch((err) => {
      console.log("err", err);
      res.status(400).json({ success: false, message: err.message });
    });
};

