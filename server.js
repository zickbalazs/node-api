require('dotenv').config();
const express = require('express');
const app = require('express')(), port = 3000;
let mysql = require('mysql');
const Pool = require('mysql/lib/Pool');
const token = process.env.token;
const sha1 = require('sha1');
const debug = process.env.DEBUG
const ver = process.env.VER
app.use(express.urlencoded({extended:true}));

function log(message){
    if (debug==1){
        console.log('>>>', message , `[${new Date(new Date().setHours(new Date().getHours() + (new Date().getTimezoneOffset() / 60)*-1)).toISOString()}]`)
    }
}


function tokenCheck(){
    return (req, res, next)=>{
        if (req.headers.authorization=='Basic' + token){
            log(req.socket.remoteAddress + ' ' + 'Successful Authentication')
            next();
        }
        else {
            log(req.socket.remoteAddress + ' ' + 'Token error')
            res.status(500).json({message:'Unauthorized access!'});
        }
    }
}

app.get('/', (req,res)=>{res.status(200).send(ver); log(req.socket.remoteAddress + ' requested version')});



let connection = mysql.createPool({
    connectionLimit:process.env.DBLIMIT,
    host:process.env.DBHOST,
    user:process.env.DBUSER,
    database:process.env.DBNAME,
    password:process.env.DBPASS
});


app.post('/logincheck', tokenCheck(), (req,res)=>{
    let table = req.body.table;
    let email = req.body.email;
    let passwd = req.body.passwd;
    connection.query(`select * from ${table} where email='${email}' and passwd='${sha1(passwd)}'`, (err,data)=>{
        if (err) res.status(500).send(err.message);
        else data.length>0 ? res.status(200).send('Successful login!') : res.status(401).send('Incorrect login')
    })
})

//get all
app.get('/:table', tokenCheck(), (req,res)=>{
    connection.query(`select * from ${req.params.table}`,(err,data)=>{
        if (err) {
            log(req.socket.remoteAddress + ' ' + err.message);
            res.status(500).send(err.message)
        }

        else res.status(200).send(data);
    })
})
//get one
app.get('/:table/:id', tokenCheck(),(req,res)=>{
    connection.query(`select * from ${req.params.table} where id=${req.params.id}`, (err,data)=>{
        if (err) res.status(500).send(err.message);
        else res.status(200).send(data);
    })
})
//get by field
app.get('/:table/:field/:value', tokenCheck() ,(req,res)=>{
    connection.query(`select * from ${req.params.table} where ${req.params.field}='${req.params.value}'`, (err,data)=>{
        if (err) res.status(500).send(err.message);
        else res.status(200).send(data);
    })
})
//get by ambigious field
app.get('/like/:table/:field/:value', tokenCheck(),(req,res)=>{
    connection.query(`select * from ${req.params.table} where ${req.params.field} like '%${req.params.value}%'`, (err,data)=>{
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
app.post('/:table', tokenCheck(),(req,res)=>{
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
app.patch('/:table/:id', tokenCheck(),(req,res)=>{
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
app.delete('/:table/:id', tokenCheck(),(req,res)=>{
    connection.query(`delete from ${req.params.table} where id=${req.params.id}`, (err, data)=>{
        if (err) res.status(500).send(err.message);
        else res.status(200).send(data);
    })
})
//delete all
app.delete('/:table', tokenCheck(),(req,res)=>{
    connection.query(`delete from ${req.params.table}`, (err,data)=>{
        if (err) res.status(500).send(err);
        else res.status(200).send(data);
    })
})

app.listen(port, log('server started'));