const Category = require('../../../Models/category')
const multer = require('multer');

// Set up multer storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads/categories');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
      }
  });

  // Initialize multer
const upload = multer({ storage });


exports.list = (req, res) => {
    Category.find().then(data => {
        res.status(200).json({ 'success': true, 'message': 'All category fetched', data});
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })

}

exports.deleteCategory = (req, res) => {
    Category.findByIdAndRemove(req.params.id).then(data => {
        res.status(200).json({ 'success': true, 'message': 'category removed' });
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })

}


// Create New Product
exports.createCategory = (req, res) => {
    const uploadMiddleware = upload.single('category_photo');
    uploadMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'Error uploading file.' });
      }
      const categoryData = { ...req.body };  
      const fileName = req.file.filename; // Get the name of the uploaded file
      const filePath="/uploads/categories/"+fileName
      Category.create({ ...categoryData, category_photo: filePath})
        .then((data) => {
          res.status(200).json({ success: true, message: 'Category Created', data });
        })
        .catch((err) => {
          res.status(400).json({ success: false, message: err });
        });
    });
  };


// Update category
exports.updateCategory = (req, res) => {
  const uploadMiddleware = upload.single('category_photo');
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.' });
    }

    const categoryData = { ...req.body };  

    // Check if a new file was uploaded
    if (req.file) {
      const fileName = req.file.filename;
      const filePath = "/uploads/categories/" + fileName;
      categoryData.category_photo = filePath;
    }

    Category.findByIdAndUpdate(
      req.params.id,
      categoryData,
      { new: true }
    )
      .then((data) => {
        res.status(200).json({ success: true, message: 'Category Updated', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
  });
};


exports.viewCategory = (req, res) => {
    Category.findById(req.params.id).then(data => {
        res.status(200).json({ 'success': true, 'message': 'category fetched','categories':data });
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })
}

