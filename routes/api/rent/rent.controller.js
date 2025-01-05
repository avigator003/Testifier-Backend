const Rent = require('../../../Models/rent')

exports.list = (req, res) => {
  Rent.find().then(data => {
    res.status(200).json({ 'success': true, 'message': 'All Rent fetched', data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.deleteRent = (req, res) => {
  Rent.findByIdAndRemove(req.params.id).then(data => {
    res.status(200).json({ 'success': true, 'message': 'Rent removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.createRent = (req, res) => {
    const rentData = { ...req.body };

    Rent.create({ ...rentData })
      .then((data) => {
        res.status(200).json({ success: true, message: 'Rent Created', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
};

exports.updateRent = (req, res) => {
  const rentData = { ...req.body };

  Rent.findByIdAndUpdate(
    req.params.id,
    {...rentData},
    { new: true }
  )
    .then((data) => {
      res.status(200).json({ success: true, message: 'Rent Updated', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err });
    });
};

exports.viewRent = (req, res) => {
  Rent.findById(req.params.id).exec().then(data => {
    res.status(200).json({ 'success': true, 'message': 'Rent fetched', 'expense': data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}
