const express = require('express');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors({
   origin:['http://localhost:5173'],
   credentials:true
}))
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ewhtdrn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   }
});

async function run() {
   try {

      const serviceCollection = client.db('carDoctorDB').collection('services');
      const checkoutsCollection = client.db('carDoctorDB').collection('checkouts');

      //json web token related api.

      app.post('/jwt', async (req, res) => {
         const user = req.body;
         console.log(user)
         const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '1h'
         })
         res
            .cookie('token', token, {
               httpOnly: true,
               secure: false
            })
            .send({ success: true })
      })


      //services related api.

      app.get('/services', async (req, res) => {
         const result = await serviceCollection.find().toArray();
         res.send(result)
      })

      app.get('/services/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) }
         const options = {
            projection: { service_id: 1, title: 1, price: 1, img: 1 },
         };
         const result = await serviceCollection.findOne(query, options);
         res.send(result)
      })

      //checkouts
      app.post('/checkouts', async (req, res) => {
         const checkout = req.body;
         const result = await checkoutsCollection.insertOne(checkout)
         res.send(result)
      })

      app.get('/checkouts', async (req, res) => {
         console.log(req.cookies.token)
         let query = {}
         if (req.query.email) {
            query = { email: req.query.email }
         }
         const result = await checkoutsCollection.find(query).toArray();
         res.send(result)
      })

      app.delete('/checkouts/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) }
         const result = await checkoutsCollection.deleteOne(query)
         res.send(result)
      })

      app.patch('/checkouts/:id', async (req, res) => {
         const id = req.params.id;
         const filter = { _id: new ObjectId(id) }
         const updatedCheckout = req.body;
         console.log(updatedCheckout)
         const updatedDoc = {
            $set: {
               status: updatedCheckout.status
            }
         }
         const result = await checkoutsCollection.updateOne(filter, updatedDoc)
         res.send(result)
      })


      await client.db("admin").command({ ping: 1 });
      console.log("You successfully connected to MongoDB!");
   } finally {
      //noting..
   }
}
run().catch(console.dir);





app.get('/', (req, res) => {
   res.send('My server is running....')
})

app.listen(port, () => {
   console.log("My server is running...", port);
})