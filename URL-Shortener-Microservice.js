require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env['PORT'] || 3000;

//mongoose connection
const mongouri = process.env['MONGOURI']; /* you can use your own mongo connection settings*/
mongoose.connect(mongouri);

//schema for the db
const websiteSchema = new mongoose.Schema({
  websiteUrl : String,
  shortUrl : Number
});

// model for db
const myModel = mongoose.model("ShortUrlDB",websiteSchema);


app.use(cors());
app.use(express.urlencoded({extended:false}))
app.use('/public', express.static(`${process.cwd()}/public`));



//HomePage
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


let index = 0 ;
/* So I thought that if the shortend id could be +1 the existing database arrays/objects collection numbers */
myModel.find({},(err,data)=>{
  if(err) throw err;
  index = index+data.length;
});

 
app.post("/api/shorturl/", (req,res)=>{
 const url = req.body.url;
  let myregex = /^(https|http)/ig;

    if(myregex.test(url)){  
 myModel.findOne({websiteUrl:url},(err,data)=>{
   if(err) throw err;

   if(!data){  // if data is null or empty
     index +=1;
     let mydoc = new myModel({websiteUrl:url,shortUrl:index});
     mydoc.save((err,data)=>{
if(err) throw err;
     return data});
     res.json({original_url :url, short_url : index});
   }
   else{
     console.log('doc found')
     res.json({original_url :data.websiteUrl, short_url : data.shortUrl})
   }
 })   
  }
  else{
    res.json({error: 'invalid url'});
  }
});

app.get(`/api/shorturl/:input`,(req,res)=>{
  let input = parseInt(req.params.input);
  myModel.findOne({shortUrl:input},(err,data)=>{
  if(err) throw err;
    if(!data){
      res.json({error:"No short url for this number"})
    }
    else{
      res.redirect(data.websiteUrl);
    }  
  });
});





app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
