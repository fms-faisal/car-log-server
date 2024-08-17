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
        const { search, category, brandName, priceRange, sort, page = 1, limit = 10 } = req.query;
    
        const skip = (page - 1) * limit;
        const filter = {};
        const sortOption = {};
    
        if (brandName) filter.brandName = brandName;
        if (category) filter.category = category;
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
        if (sort) {
            if (sort === 'price-low-high') sortOption.price = 1;
            else if (sort === 'price-high-low') sortOption.price = -1;
            else if (sort === 'newest-first') sortOption.releaseDate = -1;
            else if (sort === 'oldest-first') sortOption.releaseDate = 1;
        }
    
        try {
            const [totalItems, cars] = await Promise.all([
                carsCollection.countDocuments(filter),
                carsCollection.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit)).toArray()
            ]);
    
            res.send({
                cars,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: parseInt(page)
            });
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