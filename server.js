require('dotenv').config();
const express = require('express');
const app = require('express')(), port = 3000;
let mysql = require('mysql');
const Pool = require('mysql/lib/Pool');



app.use(express.urlencoded({extended:true}));

let connection = mysql.createPool({
    connectionLimit:process.env.DBLIMIT,
    host:process.env.DBHOST,
    user:process.env.DBUSER,
    database:process.env.DBNAME,
    password:process.env.DBPASS
});


//get all
app.get('/:table', (req,res)=>{
    connection.query(`select * from ${req.params.table}`,(err,data)=>{
        if (err) res.status(500).send(err.message)
        else res.status(200).send(data);
    })
})
//get one
app.get('/:table/:id', (req,res)=>{
    connection.query(`select * from ${req.params.table} where id=${req.params.id}`, (err,data)=>{
        if (err) res.status(500).send(err.message);
        else res.status(200).send(data);
    })
})

function MapFields(array){
    let str = ``;
    array.forEach(element => {
        str+=`, '${element}'`;
    });
    str;
}
//insert
app.post('/:table', (req,res)=>{
    let table = req.params.table;
    let records = Object.values(req.body);
    let fields = Object.keys(req.body);
    let str1 = MapFields(records);
    console.log(str1);
    connection.query(`insert into ${req.params.table} (${fields.join(', ')}) values (${str1})`, (err,data)=>{
        if (err) res.status(500).send(err.message);
        else res.status(200).send(data);
    })
})
//update
app.patch('/:table/:id', (req,res)=>{
    let table = req.params.table;
    let records = Object.values(req.body);
    let fields = Object.keys(req.body);
    console.log(records);
    console.log(fields)
    let str = "";
    for (let i = 0; i < fields.length; i++) {
        str += (`${fields[i]}='${records[i]}'`);
        str+=i==fields.length-1?'':',';
    }
    console.log(str);
    connection.query(`update ${req.params.table} set ${str} where id=?`, [req.params.id],(err,data)=>{
        if (err) res.status(500).send(err.message);
        else res.status(200).send(data);
    })
})
//delete one
app.delete('/:table/:id', (req,res)=>{
    connection.query(`delete from ${req.params.table} where id=${req.params.id}`, (err, data)=>{
        if (err) res.status(500).send(err.message);
        else res.status(200).send(data);
    })
})
//delete all
app.delete('/:table', (req,res)=>{
    connection.query(`delete from ${req.params.table}`, (err,data)=>{
        if (err) res.status(500).send(err);
        else res.status(200).send(data);
    })
})

app.listen(port, console.log(`Server: http://localhost:${port}`));