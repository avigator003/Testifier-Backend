const Tests = require('../../../Models/test')


// Create New Test
exports.saveTest = (req, res) => {

    let dbbody=req.body
    Tests.create(dbbody,(err,data)=>{
        if(err)
         res.status(500).send("Not Saved")
        else
         res.status(200).send(data)
    })  
}

//Delete a Test
exports.deleteList = (req, res) => {
// console.log(req.params.id)
    Tests.findByIdAndRemove(req.params.id).
        then(data => {
            res.status(200).json({status: true, message:"Tests list Removed", data})

        }).catch(error => {
        res.status(200).json({status: false, message:error})

        })
}

//Show all 
exports.showAll = (req, res) => {

    Tests.find({}).
        then(data => {
            res.status(200).json({status: true, message:"Tests list fetched", data})
      }).catch(error => {
        res.status(200).json({status: false, message:error})

        })
}

//Edit Test
exports.editTest = (req, res) => {

    Tests.findByIdAndUpdate(req.params.id, req.body, {new: true}).
        then(data => {
            res.status(200).json({status: true, message:"Test updated", data})

        }).catch(error => {
        res.status(400).json({status: false, message:error})

        })
}

//View Test By Id
exports.viewTest = (req, res) => {
    
    Tests.findById(req.params.id).then(data =>
        {
    res.status(200).json({ 'success': true, 'message': 'Test fetched', data });
        }).catch(err =>{
    res.status(400).json({ 'success': false, 'message': err });
             
        })
         
      }