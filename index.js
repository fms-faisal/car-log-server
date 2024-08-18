const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 5000;

const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "https://car-log-40ff4.web.app"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json()); //convert json to normal object

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zedvr4o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {


    const carsCollection = client.db("carlog").collection("cars");

    // app.get('/cars', async (req, res)=> {
    //     const result = await carsCollection.find().toArray()
    //     res.send(result)
    // })

    app.get("/cars", async (req, res) => {
      const { search, category, brandName, priceRange, sort, page = 1, limit = 10 } = req.query;

      const skip = (page - 1) * limit;

      // Create a filter object for querying cars
      const filter = {};
      const sortOption = {};
      
      // Check if brandName and category is provided and add it to the filter if it is
      if (brandName) filter.brandName = brandName;
      if (category) filter.category = category;

      // Check if a search term is provided
      if (search) {

        // Add a search filter to match either productName or description using regular expressions
        filter.$or = [{ productName: { $regex: search, $options: "i" } },
                      { description: { $regex: search, $options: "i" } }];
      }

      // Check if a price range is specified
      if (priceRange) {
        filter.price = {};

        // Set price filter based on the provided price range
        if (priceRange === "below-50000") {
          filter.price.$lte = 50000; // Price less than or equal to 50,000
        } else if (priceRange === "50000-70000") {
          filter.price.$gte = 50000; // Price greater than or equal to 50,000
          filter.price.$lte = 70000;
        } else if (priceRange === "above-70000") {
          filter.price.$gte = 70000;
        }
      }

      // Check if a sort option is specified
      if (sort) {
        if (sort === "price-low-high") sortOption.price = 1; // Sort by price in ascending order
        else if (sort === "price-high-low") sortOption.price = -1; // Sort by price in descending order
        else if (sort === "newest-first") sortOption.releaseDate = -1; // Sort by release date with newest first
        else if (sort === "oldest-first") sortOption.releaseDate = 1; // Sort by release date with oldest first
      }

      try {
        // Execute the queries in parallel to get total item count and paginated results
        
        const [totalItems, cars] = await Promise.all([
            carsCollection.countDocuments(filter), // Get the total number of documents that match the filter
            carsCollection.find(filter)            // Find the documents that match the filter
                          .sort(sortOption)                   // Apply sorting based on the sort option
                          .skip(skip)                         // Skip documents based on pagination
                          .limit(parseInt(limit))             // Limit the number of documents per page
                          .toArray()                          // Convert the results to an array
          ]);

        // Send the response with the results and pagination information
        res.send({
          cars, // Array of cars
          totalPages: Math.ceil(totalItems / limit),
          currentPage: parseInt(page),
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch cars" });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {}
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello server");
});

app.listen(port, () => console.log(`server running on port ${port}`));
