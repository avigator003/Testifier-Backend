const Product = require('../../../Models/product')
const multer = require('multer');

// Set up multer storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/products');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
      }
  });

  // Initialize multer
const upload = multer({ storage });


// Create New Product
exports.createProduct = (req, res) => {
    const uploadMiddleware = upload.single('product_photo');
    uploadMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'Error uploading file.' });
      }
      const productData = { ...req.body };  
      let filePath = null; 
   
      if (req.file) {
       const fileName = req.file.filename;
       const filePath = "public/uploads/products/"+fileName
       productData.product_photo = filePath;
     }
 
      Product.create({ ...productData, product_photo: filePath,prices:JSON.parse(productData.prices)})
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
            res.status(200).json({ status: true, message: "Product Removed", data })
        }).catch(error => {
            res.status(400).json({ status: false, message: error })
        })
}

// Update Product
exports.updateProduct = (req, res) => {
  const uploadMiddleware = upload.single('product_photo');
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.' });
    }
    const productData = { ...req.body };

    // Check if a new file was uploaded
    if (req.file) {
      const fileName = req.file.filename;
      const filePath="/uploads/products/"+fileName;
      productData.product_photo = filePath;
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
        console.log("errr",err)
        res.status(400).json({ success: false, message: err });
      });
  });
};


//Show all 
exports.showAll = (req, res) => {
    Product.find({})
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
    .populate('product_category')
    .exec((err, data) => {
      if (err) {
        res.status(400).json({ status: false, message: error })
        return;
      }
      res.status(200).json({ status: true, message: "Product fetched", data })
    });
}