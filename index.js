const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload')
const admin = require('firebase-admin');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

// use app
const app = express()
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('servicePhoto'))
app.use(fileUpload())

const serviceAccount = require("./creative-agency-a1c8c-firebase-adminsdk-dwuw0-319af5f287.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bw56e.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const ServiceCollection = client.db("creativeAgency").collection("services");
  const UserServiceCollection = client.db("creativeAgency").collection("userServices");
  const UserReviewCollection = client.db("creativeAgency").collection("userReview");
  const AdminsCollection = client.db("creativeAgency").collection("admins");

  // Show Services in the home page
  app.get('/getServices', (req, res) => {
    ServiceCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  });
  //  Add Order in the home page
  app.post('/addOrder', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    };
    UserServiceCollection.insertOne({ image, name, email, title, price, description })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  });

  // Show Services in the home page
  app.get('/getUserServices', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      // idToken comes from the client app
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          let tokenEmail = decodedToken.email;
          UserServiceCollection.find({
            email: tokenEmail
          })
            .toArray((err, documents) => {
              res.send(documents)
            })
        }).catch((error) => {
          res.sendStatus(401);
        });
    } else {
      res.sendStatus(401);
    }
  });

  // Add Review
  app.post('/addReview', (req, res) => {
    const userInfo = req.body
    UserReviewCollection.insertOne(userInfo)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  });
  // Show Review in the home page
  app.get('/getReview', (req, res) => {
    UserReviewCollection.find({}).limit(6)
      .toArray((err, documents) => {
        res.send(documents)
      })
  });
  // Show AllServices in the home page
  app.get('/getAllServices', (req, res) => {
    UserServiceCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  });
  //  Add Order in the home page
  app.post('/AddService', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    };
    ServiceCollection.insertOne({ image, title, description })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  });
  // Add Admin
  app.post('/addAdmin', (req, res) => {
    const userInfo = req.body
    AdminsCollection.insertOne(userInfo)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  });
  // Find Admin
  app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    AdminsCollection.find({ email: email })
      .toArray((err, admins) => {
        res.send(admins.length > 0);
      })
  });
  // Find user
  app.post('/isUser', (req, res) => {
    const email = req.body.email;
    UserServiceCollection.find({ email: email })
      .toArray((err, user) => {
        res.send(user.length > 0);
      })
  });
  // Update status
  app.patch('/update/:id', (req, res) => {
    UserServiceCollection.updateOne({ _id: ObjectId(req.params.id) },
      {
        $set: { project: req.body.project }
      })
      .then(result => {
        console.log(result)
        res.send(result.modifiedCount > 0)
      })
  });

});

app.listen(process.env.PORT || 4000);