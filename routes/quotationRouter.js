const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dbPath = path.join(__dirname,'..','data','quotations.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath,'[]','utf8');

const readDB   = () => JSON.parse(fs.readFileSync(dbPath,'utf8'));
const writeDB  = data => fs.writeFileSync(dbPath,JSON.stringify(data,null,2));

router.get('/',(_,res)=> res.json(readDB()));

router.post('/',(req,res)=>{
  try{
    const db = readDB();
    const id = db.length?Math.max(...db.map(q=>q.id))+1:1;
    db.push({id,...req.body,created:new Date()});
    writeDB(db);
    res.status(201).json({message:'Quotation saved',id});
  }catch(err){
    console.error(err); res.status(500).json({error:'Save failed'});
  }
});

module.exports = router;
