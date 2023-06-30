const express = require('express');
const app = express();
const cors = require('cors')

const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT;

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}))
app.use(cors())

const getBill = require('./controller/controller');
app.post('/',getBill);

app.listen(port,()=>{
    console.log(`App listening on port ${port}`)
})