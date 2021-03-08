const express = require('express');
const router = express.Router();

router.get('/', (req, res) =>{
    const name = req.user.displayName;
    const email = req.user.email;
    const imag = req.user.image;
    res.render('profile', {name:name, imag:imag, email:email});
});

module.exports = router;