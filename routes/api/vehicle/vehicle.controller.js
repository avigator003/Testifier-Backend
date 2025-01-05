const Vehicle = require('../../../Models/vehicle')
const { putPhoto, getPhoto, deletePhoto } = require('../../..');
const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({ storage: storage }).fields([
    { 
      name: 'rc_photo', 
      maxCount: 1 
    }, 
    { 
      name: 'inc_photo', 
      maxCount: 1 
    },
    { 
        name: 'puc_photo', 
        maxCount: 1 
    },
    { 
      name: 'fitness_photo', 
      maxCount: 1 
  }
  ])

// Create New Raw Material Bill
exports.createVehicle = (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
      }

        const vehicleData = { ...req.body };
        if (req.files) {
          console.log(req.files)
            const rcfileName = req.files.rc_photo[0].originalname;
            const incfileName = req.files.inc_photo[0].originalname;
            const pucfileName = req.files.puc_photo[0].originalname;
            const fitnessfileName = req.files.fitness_photo[0].originalname;
            await putPhoto(rcfileName, req.files.rc_photo[0].buffer, req.files.rc_photo[0].mimetype)
            await putPhoto(incfileName, req.files.inc_photo[0].buffer, req.files.inc_photo[0].mimetype)
            await putPhoto(pucfileName, req.files.puc_photo[0].buffer, req.files.puc_photo[0].mimetype)
            await putPhoto(fitnessfileName, req.files.fitness_photo[0].buffer, req.files.fitness_photo[0].mimetype)
            const rcurl = await getPhoto(rcfileName);
            const incurl = await getPhoto(incfileName);
            const pucurl = await getPhoto(pucfileName);
            const fitnessurl = await getPhoto(fitnessfileName);
            vehicleData.rc_photo = rcurl;
            vehicleData.rc_photo_name = rcfileName
            vehicleData.inc_photo = incurl;
            vehicleData.inc_photo_name = incfileName
            vehicleData.puc_photo = pucurl;
            vehicleData.puc_photo_name = pucfileName
            vehicleData.fitness_photo = fitnessurl;
            vehicleData.fitness_photo_name = fitnessfileName;
        }
  
        Vehicle.create({ ...vehicleData })
        .then((data) => {
          res.status(200).json({ success: true, message: 'Vehicle Created', data });
        })
        .catch((err) => {          
          res.status(400).json({ success: false, message: err });
        });
    });
  };

  exports.list = (req, res) => {
    Vehicle.find().then(data => {
      res.status(200).json({ 'success': true, 'message': 'All Vehicle fetched', data });
    }).catch(err => {
      res.status(400).json({ 'success': false, 'message': err });
    })
  }

  exports.deleteVehicle = (req, res) => {
    Vehicle.findByIdAndRemove(req.params.id).then(data => {
      res.status(200).json({ 'success': true, 'message': 'Vehicle removed' });
    }).catch(err => {
      res.status(400).json({ 'success': false, 'message': err });
    })
  }

  exports.viewVehicle = (req, res) => {
    Vehicle.findById(req.params.id).exec().then(data => {
      res.status(200).json({ 'success': true, 'message': 'Vehicle fetched', 'vehicle': data });
    }).catch(err => {
      res.status(400).json({ 'success': false, 'message': err });
    })
  }

  exports.updateVehicle = (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'Error uploading file.', error: err });
      }

        const vehicleData = { ...req.body };
        if (req.files) {
          console.log(req.files)
          await Vehicle.findById(req.params.id).then(async data => {
            
          
          if(req.files.rc_photo){
            deletePhoto(data.rc_photo_name);
            const rcfileName = req.files.rc_photo[0].originalname;
            await putPhoto(rcfileName, req.files.rc_photo[0].buffer, req.files.rc_photo[0].mimetype)
            const rcurl = await getPhoto(rcfileName);
            vehicleData.rc_photo = rcurl;
            vehicleData.rc_photo_name = rcfileName
          }

          if(req.files.inc_photo){
            deletePhoto(data.inc_photo_name);
            const incfileName = req.files.inc_photo[0].originalname;
            await putPhoto(incfileName, req.files.inc_photo[0].buffer, req.files.inc_photo[0].mimetype)
            const incurl = await getPhoto(incfileName);
            vehicleData.inc_photo = incurl;
            vehicleData.inc_photo_name = incfileName
          }
            
          if(req.files.puc_photo){
            deletePhoto(data.puc_photo_name);
            const pucfileName = req.files.puc_photo[0].originalname;
            await putPhoto(pucfileName, req.files.puc_photo[0].buffer, req.files.puc_photo[0].mimetype)
            const pucurl = await getPhoto(pucfileName);
            vehicleData.puc_photo = pucurl;
            vehicleData.puc_photo_name = pucfileName
          }

          if(req.files.fitness_photo){
            deletePhoto(data.fitness_photo_name);
            const fitnessfileName = req.files.fitness_photo[0].originalname;
            await putPhoto(fitnessfileName, req.files.fitness_photo[0].buffer, req.files.fitness_photo[0].mimetype)
            const fitnessurl = await getPhoto(fitnessfileName);
            vehicleData.fitness_photo = fitnessurl;
            vehicleData.fitness_photo_name = fitnessfileName
          }
        })
            
            
        }
      
        Vehicle.findByIdAndUpdate(req.params.id,{ ...vehicleData }, { new: true })
        .then((data) => {
          res.status(200).json({ success: true, message: 'Vehicle updated', data });
        })
        .catch((err) => {
          res.status(400).json({ success: false, message: err });
        });
      });

  };