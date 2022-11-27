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
        // create all api below:
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