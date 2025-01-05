const RawMaterial = require('../../../Models/rawmaterial')
const RawMaterialCategory = require('../../../Models/rawmaterilacategory')
const { putPhoto, getPhoto, deletePhoto } = require('../../..');
const multer = require('multer');
const { raw } = require('express');

// Set up multer storage engine
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


exports.list = (req, res) => {
  RawMaterial.find().then(data => {
    res.status(200).json({ 'success': true, 'message': 'All raw material fetched', data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })

}

exports.deleteRawMaterial = (req, res) => {
  RawMaterial.findByIdAndRemove(req.params.id).then(data => {
    deletePhoto(data.raw_material_photo_name)
    res.status(200).json({ 'success': true, 'message': 'raw material removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

// Create New Raw Material
exports.createRawMaterial = (req, res) => {
  upload.single('raw_material_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }
    const rawMaterialData = { ...req.body };
    if (req.file) {
      const fileName = req.file.originalname;
      await putPhoto(fileName, req.file.buffer, req.file.mimetype)
      const url = await getPhoto(fileName);
      rawMaterialData.raw_material_photo = url;
      rawMaterialData.raw_material_photo_name = fileName
    }


    const categoryIds = rawMaterialData.category.split(",").map((id) => id.trim());
    delete rawMaterialData.category;
    RawMaterial.create({ ...rawMaterialData,category:categoryIds })
      .then((data) => {
        res.status(200).json({ success: true, message: 'Raw Material Created', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
  });
};

// Update Raw Material
exports.updateRawMaterial = (req, res) => {
  upload.single('raw_material_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
    }
 
    const rawMaterialData = { ...req.body };

    // Check if a new file was uploaded
    if (req.file) {
      await RawMaterial.findById(req.params.id).then(data => {
        deletePhoto(data.raw_material_photo_name)
      })

      const fileName = req.file.originalname;
      await putPhoto(fileName, req.file.buffer, req.file.mimetype)
      const url = await getPhoto(fileName);
      rawMaterialData.raw_material_photo = url;
      rawMaterialData.raw_material_photo_name = fileName
    }
   

    const categoryIds = rawMaterialData.category.split(",").map((id) => id.trim());
    

    delete rawMaterialData.category;
    delete rawMaterialData.history
    RawMaterial.findByIdAndUpdate(
      req.params.id,
      {...rawMaterialData,category:categoryIds},
      { new: true }
    )
      .then((data) => {
        res.status(200).json({ success: true, message: 'Raw Material Updated', data });
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
  });
};

exports.viewRawMaterial = (req, res) => {
  RawMaterial.findById(req.params.id).populate('category').exec().then(data => {
    res.status(200).json({ 'success': true, 'message': 'Raw Material fetched', 'rawmaterial': data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.viewRawMaterialHistory = (req, res) => {
  RawMaterial.findById(req.params.id).then(data => {
    const sortedHistory = data.history.sort((a, b) => b.created_at - a.created_at);
    console.log("sortedistory", sortedHistory)
    res.status(200).json({ 'success': true, 'message': 'Raw Material fetched', 'history': sortedHistory });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.buyRawMaterial = (req, res) => {
  const { quantity } = req.body;
  const rawMaterialId = req.params.id;

  RawMaterial.findOneAndUpdate(
    { _id: rawMaterialId },
    {
      $inc: { total_quantity: quantity },
      $push: { history: { history_type: "BUY", quantity: quantity } },
    },
    { new: true }
  )
    .then((data) => {
      res.status(200).json({ 'success': true, 'message': 'Raw Material updated', 'rawmaterial': data });
    })
    .catch((err) => {
      console.log("err", err)

      res.status(400).json({ 'success': false, 'message': err });
    });
};

exports.createRawMaterialCategory = (req, res) => {
  const {categoryName} = req.body
  RawMaterialCategory.create({ name:categoryName })
  .then((data) => {
    res.status(200).json({ success: true, message: 'Raw Material Category Created', data });
  })
  .catch((err) => {
    res.status(400).json({ success: false, message: err });
  });
}

exports.deleteRawMaterialCategory = (req, res) => {
  RawMaterialCategory.findByIdAndRemove(req.params.id).then(data => {
    res.status(200).json({ 'success': true, 'message': 'raw material category removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}


exports.updateRawMaterialCategory = (req, res) => {
  const {name} =req.body

  RawMaterialCategory.findByIdAndUpdate(
    req.params.id,
    {name:name},
    { new: true }
  )
    .then((data) => {
      res.status(200).json({ success: true, message: 'Category Updated', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err });
    });
}

exports.getRawMaterialCategories = (req, res) => {
  RawMaterialCategory.find().then(data => {
    res.status(200).json({ 'success': true, 'message': 'All raw material categories fetched', data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.useRawMaterial = (req, res) => {
  const { quantity } = req.body;
  const rawMaterialId = req.params.id;

  RawMaterial.findById(rawMaterialId)
    .then((rawMaterial) => {
      if (rawMaterial.total_quantity < quantity || rawMaterial.total_quantity === 0) {
        throw new Error('Insufficient quantity available');
      }

      return RawMaterial.findOneAndUpdate(
        { _id: rawMaterialId },
        {
          $inc: { total_quantity: -quantity },
          $push: { history: { history_type: "USE", quantity: quantity } },
        },
        { new: true }
      );
    })
    .then((data) => {
      res.status(200).json({ 'success': true, 'message': 'Raw Material updated', 'rawmaterial': data });
    })
    .catch((err) => {
      res.status(400).json({ 'success': false, 'message': err.message });
    });
};

