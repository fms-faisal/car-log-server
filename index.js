const express = require('express')
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

const app = express()

const corsOptions = {
    origin: ['http://localhost:5173'],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json()) //convert json to normal object

app.get('/', (req, res) => {
    res.send("hello server")
})

app.listen(port, ()=> console.log(`server running on port ${port}`))