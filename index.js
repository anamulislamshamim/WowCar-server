require("dotenv").config();
const express = require("express");
const PORT = process.env.PORT || 5000;
const cors = require("cors");


// create app:
const app = express();
// implement the cors middleware
app.use(cors());
// to read the json data
app.use(express.json());
// to read form data
app.use(express.urlencoded({ extended: true }));


// home route for the server
app.get("/", (req, res) => {
    res.status(200).json({
        status:"success",
        message:"The WowCar server is running!"
    })
});



// connect the app to the PORT and also set the success message:
app.listen(PORT, () => {
    console.log(`The server is successfully running at http://localhost:${ PORT }`);
});