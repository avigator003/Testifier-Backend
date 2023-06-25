const { putPhoto, getPhoto, deletePhoto } = require('../../..');
const Product = require('../../../Models/product')
const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })



// Create New Product
exports.createProduct = (req, res) => {
  upload.single('product_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }

    const productData = { ...req.body };
    if (req.file) {
      const fileName = req.file.originalname;
      await putPhoto(fileName, req.file.buffer, req.file.mimetype)
      const url = await getPhoto(fileName);
      productData.product_photo = url;
      productData.product_photo_name = fileName
    }

    Product.create({ ...productData, prices: JSON.parse(productData.prices) })
      .then((data) => {
        res.status(200).json({ success: true, message: 'Product Updated', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
  });
};

//Delete a Product
exports.deleteProduct = (req, res) => {
  // console.log(req.params.id)
  Product.findByIdAndRemove(req.params.id).
    then(data => {
       deletePhoto(data.product_photo_name)
       res.status(200).json({ status: true, message: "Product Removed", data })
    }).catch(error => {
      res.status(400).json({ status: false, message: error })
    })
}

// Update Product
exports.updateProduct = (req, res) => {
  upload.single('product_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }
    const productData = { ...req.body };

    // Check if a new file was uploaded
    if (req.file) {
      await Product.findById(req.params.id).then(data => {
        deletePhoto(data.product_photo_name)
      })

      const fileName = req.file.originalname;
      await putPhoto(fileName, req.file.buffer, req.file.mimetype)
      const url = await getPhoto(fileName);
      productData.product_photo = url;
      productData.product_photo_name = fileName
    }

    Product.findByIdAndUpdate(
      req.params.id,
      { ...productData, prices: JSON.parse(productData.prices) },
      { new: true }
    )
      .then((data) => {
        res.status(200).json({ success: true, message: 'Product Updated', data });
      })
      .catch((err) => {
        console.log("errr", err)
        res.status(400).json({ success: false, message: err });
      });
  });
};


exports.showAll = (req, res) => {
  const { categoryId } = req.body;
  let query = {};

  if (categoryId) {
    query.product_category = categoryId;
  }

  Product.find(query)
    .populate('prices.users')
    .populate('product_category')
    .exec((err, data) => {
      if (err) {
        res.status(400).json({ status: false, message: err })
        return;
      }
      res.status(200).json({ status: true, message: "Product list fetched", data })
    });
}


//View Test By Id
exports.viewProduct = (req, res) => {
  Product.findById(req.params.id)
    .populate({
      path: 'prices.users',
      model: 'User',
      select: 'route_name' // Select the 'route_name' field from the User model
    })
    .exec((err, data) => {
      if (err) {
        res.status(400).json({ status: false, message: error });
        return;
      }
      res.status(200).json({ status: true, message: "Product fetched", data });
    });
};
