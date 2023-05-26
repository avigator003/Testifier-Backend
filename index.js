/* =======================
    LOAD THE DEPENDENCIES
==========================*/
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const mongoose = require('mongoose')
var cors = require('cors');
const { S3Client,PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
/* =======================
LOAD THE CONFIG
==========================*/
const config = require('./config')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const port = process.env.PORT || 5001
process.env.TZ = 'Asia/Kolkata'; 

const bucketName=process.env.AWS_BUCKET_NAME;
const bucketRegion=process.env.AWS_BUCKET_REGION;
const accessKey=process.env.ACCESS_KEY;
const secretAccessKey=process.env.SECRET_ACCESS_KEY;

const s3=new S3Client({
    credentials:{    
        accessKeyId:accessKey,
        secretAccessKey:secretAccessKey
    },
    region:bucketRegion
});


const deletePhoto = (photoName) => {
    const getDeleteParama = {
      Bucket: bucketName,
      Key: photoName,
    };
     const deleteCommand = new DeleteObjectCommand(getDeleteParama);
     s3.send(deleteCommand);
  }

  const getPhoto =  async (photoName) => {
    const getObjectParams = {
        Bucket: bucketName,
        Key: photoName,
      };

      const getCommand = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
      return url;
  }

  const putPhoto = async (fileName,buffer,mimetype) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body:buffer,
        ContentType: mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
  }

  module.exports={s3,bucketName,deletePhoto,getPhoto,putPhoto}


/* =======================
EXPRESS CONFIGURATION
==========================*/
const app = express()
// app.use(cors({
//     origin: 'http://localhost:3000'
//   }));

const corsOptions = {
    origin: true,
    optionsSuccessStatus: 204,
    credentials: true,
  };
  
app.use(cors(corsOptions));

// parse JSON and url-encoded query
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// print the request log on console
app.use(morgan('dev'))

// set the secret key variable for jwt
app.set('jwt-secret', config.secret)

// index page, just for testing
app.get('/', (req, res) => {
    res.send('Hello JWT')
})

// configure api router
app.use('/api', require('./routes/api'))
app.use('/uploads', express.static('public/uploads'));


// open the server
app.listen(port, () => {
    console.log(`Express is running on port ${port}`)
})



/* =======================
    CONNECT TO MONGODB SERVER
==========================*/
mongoose.connect(config.mongodbUri,
    {useNewUrlParser: true, 
     useUnifiedTopology: true ,
     useCreateIndex:true,
     timezone: 'Asia/Kolkata' })
     
mongoose.Promise = global.Promise
const db = mongoose.connection
db.on('error', console.error)
db.once('open', ()=>{
    console.log('connected to mongodb server')
})


