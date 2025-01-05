const Expense = require('../../../Models/expense')
const { putPhoto, getPhoto, deletePhoto } = require('../../..');
const multer = require('multer');
const { raw } = require('express');

// Set up multer storage engine
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


exports.list = (req, res) => {
  Expense.find().then(data => {
    res.status(200).json({ 'success': true, 'message': 'All Expenses fetched', data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.deleteExpense = (req, res) => {
  Expense.findByIdAndRemove(req.params.id).then(data => {
    deletePhoto(data.expense_photo_name)
    res.status(200).json({ 'success': true, 'message': 'expense removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

// Create New Raw Material Bill
exports.createExpense = (req, res) => {
  upload.single('expense_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }
    const expenseData = { ...req.body };
    if (req.file) {
      const fileName = req.file.originalname;
      await putPhoto(fileName, req.file.buffer, req.file.mimetype)
      const url = await getPhoto(fileName);
      expenseData.expense_photo = url;
      expenseData.expense_photo_name = fileName
    }
    
    Expense.create({ ...expenseData })
      .then((data) => {
        res.status(200).json({ success: true, message: 'Expense Created', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
  });
};

exports.updateExpense = (req, res) => {
  upload.single('expense_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }
 
    const expenseData = { ...req.body };

    if (req.file) {
      await Expense.findById(req.params.id).then(data => {
        deletePhoto(data.expense_photo_name)
      })

      const fileName = req.file.originalname;
      await putPhoto(fileName, req.file.buffer, req.file.mimetype)
      const url = await getPhoto(fileName);
      expenseData.expense_photo = url;
      expenseData.expense_photo_name = fileName
    }
    console.log(expenseData)
    Expense.findByIdAndUpdate(
      req.params.id,
      {...expenseData},
      { new: true }
    )
      .then((data) => {
        res.status(200).json({ success: true, message: 'Expense Updated', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
  });
};

exports.viewExpense = (req, res) => {
  Expense.findById(req.params.id).exec().then(data => {
    res.status(200).json({ 'success': true, 'message': 'Expense fetched', 'expense': data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

