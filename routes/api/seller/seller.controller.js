const Seller = require('../../../Models/seller')
const { raw } = require('express');



exports.list = (req, res) => {
  Seller.find().then(data => {
    res.status(200).json({ 'success': true, 'message': 'All Seller fetched', data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.deleteSeller = (req, res) => {
  Seller.findByIdAndRemove(req.params.id).then(data => {
    res.status(200).json({ 'success': true, 'message': 'Seller removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.createSeller = (req, res) => {
    const SellerData = { ...req.body };

    Seller.create({ ...SellerData })
      .then((data) => {
        res.status(200).json({ success: true, message: 'Seller Created', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
};

exports.updateSeller = (req, res) => {
  const sellerData = { ...req.body };


  Seller.findByIdAndUpdate(
    req.params.id,
    {...sellerData},
    { new: true }
  )
    .then((data) => {
      res.status(200).json({ success: true, message: 'Seller Updated', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err });
    });
};

exports.viewSeller = (req, res) => {
  Seller.findById(req.params.id).exec().then(data => {
    res.status(200).json({ 'success': true, 'message': 'Seller fetched', 'expense': data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}
