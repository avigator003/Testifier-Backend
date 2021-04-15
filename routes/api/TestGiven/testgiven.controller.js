const TestGiven = require('../../../Models/giventest')


// Create New Test
exports.saveTest = (req, res) => {
   let dbbody=req.body
   TestGiven.create(dbbody,(err,data)=>{
        if(err)
         res.status(500).send("Not Saved")
        else
         res.status(200).send(data)
    })  
}

//Delete a Test
exports.deleteList = (req, res) => {
// console.log(req.params.id)
TestGiven.findByIdAndRemove(req.params.id).
        then(data => {
            res.status(200).json({status: true, message:"Tests list Removed", data})

        }).catch(error => {
        res.status(200).json({status: false, message:error})

        })
}

//Show all 
exports.showAll = (req, res) => {

    TestGiven.find({}).
        then(data => {
            res.status(200).json({status: true, message:"Tests list fetched", data})
      }).catch(error => {
        res.status(200).json({status: false, message:error})

        })
}

//Edit Test
exports.editTest = (req, res) => {

    TestGiven.findByIdAndUpdate(req.params.id, req.body, {new: true}).
        then(data => {
            res.status(200).json({status: true, message:"Test updated", data})

        }).catch(error => {
        res.status(400).json({status: false, message:error})

        })
}

//View Test By Id
exports.viewTest = (req, res) => {
    
    TestGiven.findById(req.params.id).then(data =>
        {
    res.status(200).json({ 'success': true, 'message': 'Test fetched', data });
        }).catch(err =>{
    res.status(400).json({ 'success': false, 'message': err });
             
        })
         
      }