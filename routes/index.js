const express = require('express');
//const data = require('../data/data.json');
const axios = require('axios');
const pool = require('../db/pool');

const Joi = require('joi');
const schema = Joi.object({
  animalname: Joi.string().required(),
  animalage: Joi.string().required(),
  breedname: Joi.string(),
  basecolour: Joi.string()
}).unknown(true);

const router = express.Router();
/*let animals = []
for (let i = 0; i< 100; i++) {
  animals.push(data[i]);
}*/

/* GET home page. */
router.get('/animals', async function(req, res, next) {
  const {owner} = req.query;
  const {animal} = req.query;
  if(owner&&animal){
    (await pool).query("update animals set user_id = $1 where id = $2", [owner, animal], (err, respdb)=>{
      if(err) return res.status(400).send(err);
    });
  }

  (await pool).query("select a.*, u.name from animals a, users u where a.user_id = u.id", (err, respdb)=>{
    const animals = respdb.rows;
    const animalsPromises = animals.map(() => {
      return new Promise((resolve, reject) => {
        axios.get('https://api.thecatapi.com/v1/images/search')
        .then(function({data}) {
          const [cat] = data;
          const {url} = cat;
          resolve(url);
        }).catch(function(error) {
          reject(error);
        });
      });
    });
    Promise.all(animalsPromises)
    .then(function(urls) {
      const animalsWithImage = animals.map((animal, index) => ({...animal, image: urls[index]}));
      res.render('index', { animalsWithImage });
    })
    .catch(function(errors) {
      res.send(`${errors}`)
    });
  });
});

router.get('/animals/:id', async(req, res) => {
  const {id} = req.params;
  const {url} = req.query;
  const {adopt} = req.query;
  (await pool).query("select a.*, u.name from animals a, users u where a.id=$1 and a.user_id = u.id", [id], (err, respdb)=>{
    if(!respdb) return res.status(404).send("no encontrado");
    const animals = respdb.rows[0];
    if(!animals) return res.status(404).send("no encontrado");
    if(adopt) return res.render("adoptar",{animalname: animals.animalname, id: id})
    const properties = Object.keys(animals).map(property => animals[property]);
    res.render('animal', {animalname: animals.animalname, properties, image: url, id: id});
  });
});

function cutAnimal(animal){
  let resp = {
    id: animal[0], 
    name: animal[1], 
    breed: animal[2], 
    specie: animal[3],
    age: animal[4],
    color: animal[5],
    owner: animal[6]
  }
  return resp;
}

let id = 0;
async function getLastId(){
  (await pool).query("select max(id) from animals", (err, respdb)=>{
    id = respdb.rows[0].max;
  });
}
getLastId();

router.post('/animals', async(req, res) => {
  let b = schema.validate(req.body);
  if (b.error)
    return res.status(400).send(b.error.details[0].message);
  let row = [
    ++id, 
    req.body.animalname, 
    req.body.breedname, 
    req.body.basecolour, 
    req.body.speciesname, 
    req.body.animalage, 
    req.body.owner? req.body.owner:0
  ];
  (await pool).query("insert into animals values($1, $2, $3, $4, $5, $6, $7)", row, (err, respdb)=>{
    if(err) return res.status(400).send(err);
    res.send("Animal creado<br/>" + JSON.stringify(cutAnimal(row)));
  });
});

router.put('/animals/:id', async(req, res) => {
  const {id} = req.params;
  let b = schema.validate(req.body);
  if (b.error)
    return res.status(400).send(b.error.details[0].message);
  (await pool).query("update animals set animalname = $1, breedname = $2, basecolour = $3, speciesname = $4, animalage = $5, user_id = $6 where id = $7",
    [req.body.animalname, req.body.breedname, req.body.basecolour, req.body.speciesname, req.body.animalage, req.body.owner_id, id],
    (err, respdb)=>{
      if(err) return res.status(400).send(err);
      res.send("Animal actualizado<br/>" + JSON.stringify(req.body));
    });
});

router.delete('/:id', async(req,res)=>{
  const {id} = req.params;
  (await pool).query("select a.* from animals a where a.id=$1", [id], async(err, respdb)=>{
    if(err) return res.status(400).send(err);
    let animal = respdb.rows[0];
    (await pool).query("delete from animals where id = $1", [id], (err2, respdb2)=>{
      if(err2) return res.status(400).send(err2);
      if(!animal) return res.status(404).send("no encontrado");
      return res.send("Animal borrado<br/>id:"+ JSON.stringify(animal));
    });
  });
});

module.exports = router;
