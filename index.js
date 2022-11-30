require("dotenv").config();
const express = require("express");
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const secret_key = process.env.JWT_KEY;
const jwt = require("jsonwebtoken");
// create app:
const app = express();
// implement the cors middleware
app.use(cors());
// to read the json data
app.use(express.json());
// to read form data
app.use(express.urlencoded({ extended: true }));

// verifyJWT(req, res, next);
const verifyJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(401).send({message:"unauthorized!"});
    };
    jwt.verify(token, secret_key, (err, decoded) => {
        if(err){
            return res.send(403).send({ message:"invalid" });
        };
        req.decoded = decoded;
        next();
    });
};

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
        // verifyAdmin(req, res, next);
        const verifyAdmin = async(req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await userColl.findOne(query);
            if(user.role !== 'admin'){
                return res.status(403).send("Forbidden!");
            };
            next();
        }
        // json web token:
        app.get("/jwt", async (req, res) => {
            console.log(req.query.email);
            const email = req.query.email;
            const query = { email: email };
            const user = await userColl.findOne(query);
            if (user) {
                const token = jwt.sign(user, secret_key, {expiresIn:"1h"});
                res.send({ access_token: token })
            }else{
                res.status(403).send({
                    status:403,
                    error:"Invalid user"
                })
            }
        });
        // store the use to the database:
        app.post("/create-user", async (req, res) => {
            const user = req.body;
            const result = await userColl.insertOne(user);
            res.status(201).send(result);
        });
        // check the role:
        app.get("/user/role/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userColl.findOne(query);
            // console.log(result);
            res.send({ role: result.role });
        });
        // get the products for the particular seller by the email
        app.get("/seller/products/:email",verifyJWT, async (req, res) => {
            const query = { sellerEmail: req.params.email };
            const myProducts = await carForSell.find(query).toArray();
            res.send(myProducts);
        });
        // product advertise status updated:
        app.put("/update/:id",verifyJWT, async (req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const options = {
                upsert: true
            };
            const updateDoc = {
                $set: {
                    add: true
                }
            }
            const update = await carForSell.updateOne(query, updateDoc, options);
            res.send(update);
        })
        // insert a new car to the carForSell
        app.post("/add-car", async (req, res) => {
            const carData = req.body;
            const result = await carForSell.insertOne(carData);
            res.send(result);
        });
        // get all sellers
        app.get("/all/sellers", async (req, res) => {
            const query = { role: "seller" };
            const sellers = await userColl.find(query).toArray();
            res.send(sellers);
        });
        // delete the seller
        app.delete("/seller/delete/:email",verifyJWT, verifyJWT, verifyAdmin, async (req, res) => {
            const query = { email: req.params.email };
            const deleteResult = await userColl.deleteOne(query);
            res.send(deleteResult);
        });
        app.get("/all/buyers", async (req, res) => {
            const query = { role: "buyer" };
            const buyers = await userColl.find(query).toArray();
            res.send(buyers);
        });
        // delete the seller
        app.delete("/buyer/delete/:email",verifyJWT, verifyAdmin, async (req, res) => {
            const query = { email: req.params.email };
            const deleteResult = await userColl.deleteOne(query);
            res.send(deleteResult);
        });
        // load six car for home page:
        app.get("/home/usedCar", async (req, res) => {
            const result = await carForSell.find({ add: true }).toArray();
            res.send(result);
        });
        app.get("/used-cars/:category", async (req, res) => {
            const category = req.params.category;
            let query;
            if (category == 'all') {
                query = {};
            } else {
                query = { category: category };
            };
            const result = await carForSell.find(query).toArray();
            res.send(result);
        });
        // store the booked cars:
        app.post("/used-car/booked", async (req, res) => {
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