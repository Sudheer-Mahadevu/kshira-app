const express = require('express');
const app = express();

const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT;

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}))

const getBill = require('./controller/controller');
app.get('/',(req,res)=>{
    res.send('Hello World!')
})
app.post('/',getBill);

app.listen(port,()=>{
    console.log(`App listening on port ${port}`)
})