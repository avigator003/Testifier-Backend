const RawMaterialBill = require('../../../Models/rawmaterialbill')
const { putPhoto, getPhoto, deletePhoto } = require('../../..');
const multer = require('multer');
const { raw } = require('express');

// Set up multer storage engine
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


exports.list = (req, res) => {
  RawMaterialBill.aggregate([{ $lookup: {
    from: "sellers",
    localField: "seller_name",
    foreignField: "_id",
    as: "sellers"
  }},{$project: {
    _id: 1,
    amount: 1,
    raw_material_bill_photo: 1,
    bill_type:1,
    raw_material_bill_Date_time:1,
    raw_material_photo_bill_name:1,
    seller_name: '$sellers.seller_name'
  }}])
  .then(data => {
    res.status(200).json({ 'success': true, 'message': 'All raw material bill fetched', data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.deleteRawMaterialBill = (req, res) => {
  RawMaterialBill.findByIdAndRemove(req.params.id).then(data => {
    deletePhoto(data.raw_material_photo_bill_name)
    res.status(200).json({ 'success': true, 'message': 'raw material bill removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

// Create New Raw Material Bill
exports.createRawMaterialBill = (req, res) => {
  upload.single('raw_material_bill_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }
    const rawMaterialBillData = { ...req.body };
    if (req.file) {
      const fileName = req.file.originalname;
      await putPhoto(fileName, req.file.buffer, req.file.mimetype)
      const url = await getPhoto(fileName);
      rawMaterialBillData.raw_material_bill_photo = url;
      rawMaterialBillData.raw_material_photo_bill_name = fileName
    }
    const SellerIds = rawMaterialBillData.seller_name.split(",").map((id) => id.trim());
    delete rawMaterialBillData.seller_name;

    RawMaterialBill.create({ ...rawMaterialBillData,seller_name:SellerIds })
      .then((data) => {
        res.status(200).json({ success: true, message: 'Raw Material Bill Created', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
  });
};

exports.updateRawMaterialBill = (req, res) => {
  upload.single('raw_material_bill_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }
 
    const rawMaterialBillData = { ...req.body };

    // Check if a new file was uploaded
    if (req.file) {
      await RawMaterialBill.findById(req.params.id).then(data => {
        deletePhoto(data.raw_material_photo_bill_name)
      })

      const fileName = req.file.originalname;
      await putPhoto(fileName, req.file.buffer, req.file.mimetype)
      const url = await getPhoto(fileName);
      rawMaterialBillData.raw_material_bill_photo = url;
      rawMaterialBillData.raw_material_photo_bill_name = fileName
    }
    const SellerIds = rawMaterialBillData.seller_name.split(",").map((id) => id.trim());
    delete rawMaterialBillData.seller_name;

    delete rawMaterialBillData.history
    RawMaterialBill.findByIdAndUpdate(
      req.params.id,
      {...rawMaterialBillData,seller_name:SellerIds},
      { new: true }
    )
      .then((data) => {
        res.status(200).json({ success: true, message: 'Raw Material Bill Updated', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
  });
};

exports.viewRawMaterialBil = (req, res) => {
  RawMaterialBill.findById(req.params.id).exec().then(data => {
    res.status(200).json({ 'success': true, 'message': 'Raw Material Bill fetched', 'rawmaterial': data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

