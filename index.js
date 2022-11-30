require("dotenv").config();
const express = require("express");
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');

// create app:
const app = express();
// implement the cors middleware
app.use(cors());
// to read the json data
app.use(express.json());
// to read form data
app.use(express.urlencoded({ extended: true }));


// mongodb start
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.od9o8tu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    client.connect(err => {
        if (err) {
            console.log("MongoDB connection failed!");
        } else {
            console.log("MongoDB connected successfully!");
        }
    });
    try {
        // created a database
        const db = client.db("WowCar");
        // car-for-sell connection
        const carForSell = db.collection("car-for-sell");
        // users collection
        const userColl = db.collection("users");
        // bookCars connection
        const bookedCars = db.collection("bookedCars");
        // create all api below:
        // store the use to the database:
        app.post("/create-user", async(req, res) => {
            const user = req.body;
            const result = await userColl.insertOne(user);
            res.status(201).send(result);  
        });
        // check the role:
        app.get("/user/role/:email", async(req, res) => {
            const email = req.params.email;
            const query = { email:email };
            const result = await userColl.findOne(query);
            // console.log(result);
            res.send({role:result.role});
        });
        // get the products for the particular seller by the email
        app.get("/seller/products/:email", async(req, res) => {
            const query = { sellerEmail:req.params.email};
            const myProducts = await carForSell.find(query).toArray();
            res.send(myProducts);
        });
        // get all sellers
        app.get("/all/sellers", async(req, res) => {
            const query={ role:"seller"};
            const sellers = await userColl.find(query).toArray();
            res.send(sellers);
        })
        // load six car for home page:
        app.get("/home/usedCar", async(req, res) => {
            const result = await carForSell.find({}).limit(6).toArray();
            res.send(result);
        });
        app.get("/used-cars/:category", async(req, res) => {
            const category = req.params.category;
            let query;
            if(category=='all'){
                query = {};
            }else{
                query = { category:category};
            };
            const result = await carForSell.find(query).toArray();
            res.send(result);
        });
        // store the booked cars:
        app.post("/used-car/booked", async(req,res) => {
            const bookData = req.body;
            const result = await bookedCars.insertOne(bookData);
            res.status(200).send(result);
        });
    } finally {
        // client.close(); 
    }
};
run().catch(err => console.log(err));
// mongodb end



// home route for the server
app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "The WowCar server is running!"
    })
});



// connect the app to the PORT and also set the success message:
app.listen(PORT, () => {
    console.log(`The server is successfully running at http://localhost:${PORT}`);
});