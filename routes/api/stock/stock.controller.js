const Stock = require('../../../Models/stock')


exports.list = (req, res) => {
    Stock.find().populate('product').then(data => {
        res.status(200).json({ 'success': true, 'message': 'All stock fetched', data});
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })

}

exports.deleteStock = (req, res) => {
    Stock.findByIdAndRemove(req.params.id).then(data => {
        res.status(200).json({ 'success': true, 'message': 'Stock removed' });
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })

}


// Create New Stock
exports.createStock = (req, res) => {
    Stock.create(req.body)
        .then((data) => {
          res.status(200).json({ success: true, message: 'Category Created', data });
        })
        .catch((err) => {
          res.status(400).json({ success: false, message: err });
        });
  };

exports.viewStock = (req, res) => {
    Stock.findById(req.params.id).populate('product').then(data => {
        res.status(200).json({ 'success': true, 'message': 'stock fetched','stock':data });
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })
}

