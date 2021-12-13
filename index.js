const express = require('express')
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config()
const { initializeApp } = require('firebase-admin/app');

const app = express()
app.use(cors())
app.use(bodyParser.json())

const admin = require("firebase-admin");
const serviceAccount = require("./configs/burj-al-arab-5fce5-firebase-adminsdk-8eswj-db58ad31a9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.FIRE_DB}`
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p8xf6.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookingsCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_devices}`);
  // console.log("db connected")
  
  // UI tekhe fetch er post method e data gula server side e collect kore app.post er maddome database mongodb ta patanu hocce
  app.post('/addBooking',(req,res)=>{
      const newBooking=req.body;
      // console.log(newBooking);

      //ekn back-end mongodb te patanu hobe
      bookingsCollection.insertOne(newBooking)
      // .then(result=>{
      //     // console.log(result)
      //     res.send(result.acknowledged)
      // })
  });

  //ekn database tekhe data gula app.get er maddome read kore UI te patanu hobe
  app.get('/bookingInfo',(req,res)=>{
           // console.log(req.headers.authorization)//headers er authorization tekha req tekhe newa hocce
          const bearer=req.headers.authorization;

          // // console.log(req.query.email)// bookingInfo tekhe ?email=loggedInUser.email ei kane req a patanu hocce

          if(bearer && bearer.startsWith("Bearer ")){//ei kane bearer mane authorize token takhe and er jodi "Bearer "(Bearer space) diye shuru hoi tahole ei ta k space diye split kore 0 index e Bearer space takbe, [1] index e just token ta takbe krn Bearer er por ek ta space ace console kore deka jabe space er por token ta ace.headers er oi kane authorize e Bearer er por space diye token likha hoice
            const idToken=bearer.split(' ')[1];
            // console.log({idToken})
            // idToken comes from the client app(login tekhe session e save kore bookingInfo tekhe pacce ei kane)
            admin.auth().verifyIdToken(idToken) //module-49(vid-5/6/7)
            .then((decodedToken) => {//token k jwt token e decode korle uid,email etc sob deka jabe
              // const uid = decodedToken.uid;
              // console.log({uid})//ei kane {uid} dice krn upore destruct kore nai.
              const tokenEmail=decodedToken.email
              if(tokenEmail==req.query.email){//ei kane tokenEmail ?email=loggedInUser.email mille tarpor database tekhe same email tar book kora info find kore UI te patanu hobe.ei ta aro secure kora hocce ei kane
                //ei kane sob data find kore res.send er maddome UI/'/bookingInfo' te patai dewa hocce 
                  bookingsCollection.find({email:req.query.email})//find({}) ei ta dile sob data find kore anbe.ekn find({email:req.query.email}) dile bookingInfo er ?email=loggedInUser.email tar info gula find kore niye jabe
                  .toArray((err,documents)=>{
                    res.status(200).send(documents)
                  })
              }
            })
            .catch((error) => {
              res.status(401).send("Un-authorize Access")
            });

          }
          else{
            res.status(401).send("Un-authorize Access")
          }

        


    
  });

});

app.get('/', function (req, res) {
  res.send('hello world')
})

app.listen(process.env.PORT || 5000,console.log("listen to port 5000"))

