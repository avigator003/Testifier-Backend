const Category = require('../../../Models/category')
const multer = require('multer');
const { deletePhoto, getPhoto, putPhoto } = require('../../../index');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })



exports.list = (req, res) => {
  Category.find().then(data => {
    res.status(200).json({ 'success': true, 'message': 'All category fetched', data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.deleteCategory = (req, res) => {
  Category.findByIdAndRemove(req.params.id).then(data => {
    deletePhoto(data.category_photo_name)
    res.status(200).json({ 'success': true, 'message': 'category removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })

}


exports.createCategory = async (req, res) => {
  try {
    upload.single('category_photo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
      }
      const categoryData = { ...req.body };
      if (req.file) {
        const fileName = req.file.originalname;
        await putPhoto(fileName, req.file.buffer, req.file.mimetype)
        const url = await getPhoto(fileName);
        categoryData.category_photo = url;
        categoryData.category_photo_name = fileName
      }
      const category = await Category.create({ ...categoryData });
      res.status(200).json({ success: true, message: 'Category Created', data: category });
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


// Update category
exports.updateCategory = (req, res) => {
  upload.single('category_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }

    const categoryData = { ...req.body };

    // Check if a new file was uploaded
    if (req.file) {
      await Category.findById(req.params.id).then(data => {
        deletePhoto(data.category_photo_name)
      })

      const fileName = req.file.originalname;
      await putPhoto(fileName, req.file.buffer, req.file.mimetype)
      const url = await getPhoto(fileName);
      categoryData.category_photo = url;
      categoryData.category_photo_name = fileName
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
    res.status(200).json({ 'success': true, 'message': 'category fetched', 'categories': data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}


