const express = require('express');
const app = express()

app.get('/', (req,res) =>{
    res.render("Home") 
})

app.listen(3000, (err)=>{
    console.log("A aplicação esta rodando na porta 3000")
});