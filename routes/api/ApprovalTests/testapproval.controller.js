const ApprovalTests = require('../../../Models/approvaltests')


// Create New Test
exports.saveApproval = (req, res) => {
   let dbbody=req.body
   console.log(dbbody,"boiyd")
   ApprovalTests.create(dbbody,(err,data)=>{
        if(err)
        {
     res.status(500).send("Not Saved")
        }
        else
         res.status(200).send(data)
    })  
}

//Delete a Test
exports.deleteApproval = (req, res) => {
// console.log(req.params.id)
ApprovalTests.findByIdAndRemove(req.params.id).
        then(data => {
            res.status(200).json({status: true, message:"Approval  Removed", data})

        }).catch(error => {
        res.status(200).json({status: false, message:error})

        })
}

//Show all 
exports.showAll = (req, res) => {

    ApprovalTests.find({}).populate('approvalUser').
        then(data => {
            res.status(200).json({status: true, message:"Approval list fetched", data})
      }).catch(error => {
        res.status(200).json({status: false, message:error})

        })
}




//View Test By Id
exports.viewApproval = (req, res) => {
    
    ApprovalTests.findById(req.params.id).populate('approvalUser')
    .then(data =>
        {
    res.status(200).json({ 'success': true, 'message': 'Approval fetched', data });
        }).catch(err =>{
    res.status(400).json({ 'success': false, 'message': err });
             
        })
         
      }