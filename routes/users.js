var express = require('express');
var router = express.Router();
const pool = require('../db/pool');

const Joi = require('joi');
const schema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().integer().min(0).required
}).unknown(true);

/* GET users listing. */
router.get('/users', async function(req, res, next) {
  (await pool).query("select * from users", (err, respdb)=>{
    const users = respdb.rows;
    console.log(users);
    res.send(JSON.stringify(users));
  });
});

let id = 0;
async function getLastId(){
  (await pool).query("select max(id) from users", (err, respdb)=>{
    id = respdb.rows[0].max;
  });
}
getLastId();

router.post('/users', async(req, res) => {
  let b = schema.validate(req.body);
  if (b.error)
    return res.status(400).send(b.error.details[0].message);
  let row = [
    ++id, 
    req.body.name, 
    req.body.age
  ];
  (await pool).query("insert into users values($1, $2, $3)", row, (err, respdb)=>{
    if(err) return res.status(400).send(err);
    let resp = {
      id: row[0], 
      name: row[1], 
      age: row[2]
    }
    res.send("Usuario creado<br/>" + JSON.stringify(resp));
  });
});

router.put('/users/:id', async(req, res) => {
  const {id} = req.params;
  let b = schema.validate(req.body);
  if (b.error)
    return res.status(400).send(b.error.details[0].message);
  (await pool).query("update users set name = $1, age = $2 where id = $3",
    [req.body.name, req.body.age, id],
    (err, respdb)=>{
      if(err) return res.status(400).send(err);
      res.send("Usuario actualizado<br/>" + JSON.stringify(req.body));
    });
});

router.delete('/users/:id', async(req,res)=>{
  const {id} = req.params;
  (await pool).query("select * from users where id=$1", [id], async(err, respdb)=>{
    if(err) return res.status(400).send(err);
    let user = respdb.rows[0];
    (await pool).query("delete from users where id = $1", [id], (err2, respdb2)=>{
      if(err2) return res.status(400).send(err2);
      if(!user) return res.status(404).send("no encontrado");
      return res.send("Usuario borrado<br/>id:"+ JSON.stringify(user));
    });
  });
});


module.exports = router;
