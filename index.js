const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000

const app = express()

const corsOptions = {
    origin: ['http://localhost:5173'],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json()) //convert json to normal object


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zedvr4o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const carsCollection = client.db("carlog").collection("cars");

    // app.get('/cars', async (req, res)=> {
    //     const result = await carsCollection.find().toArray()
    //     res.send(result)
    // })

    app.get('/cars', async (req, res) => {
        const { search, category, brandName, minPrice, maxPrice, sort, priceRange } = req.query;
    
        let filter = {};
        
        if (brandName) {
            filter.brandName = brandName;
        }
        
        if (category) {
            filter.category = category;
        }
    
        if (search) {
            filter.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
    
        if (priceRange) {
            filter.price = {};
            if (priceRange === 'below-50000') {
                filter.price.$lte = 50000;
            } else if (priceRange === '50000-70000') {
                filter.price.$gte = 50000;
                filter.price.$lte = 70000;
            } else if (priceRange === 'above-70000') {
                filter.price.$gte = 70000;
            }
        }
    
    
        let sortOption = {};
        if (sort) {
            if (sort === 'price-low-high') {
                sortOption.price = 1; // ascending
            } else if (sort === 'price-high-low') {
                sortOption.price = -1; // descending
            } else if (sort === 'newest-first') {
                sortOption.releaseDate = -1; // newest first
            } else if (sort === 'oldest-first') {
                sortOption.releaseDate = 1; // oldest first
            }
        }
    
        try {
            const result = await carsCollection.find(filter).sort(sortOption).toArray();
            res.send(result);
        } catch (error) {
            res.status(500).send({ error: 'Failed to fetch cars' });
        }
    });
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send("hello server")
})

app.listen(port, ()=> console.log(`server running on port ${port}`))