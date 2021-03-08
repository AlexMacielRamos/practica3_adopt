const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/login', (_, res)=>{
    res.render('login');
});

router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));

router.get(
    '/google/callback',
    passport.authenticate('google', {failureRedirect: '/login'}),
    function(req, res){
        console.log(req.user);
        res.redirect('/profile');
    }
); 

router.get('/google/logout', (req, res)=>{
    req.logout();
    res.redirect('/');
});

module.exports = router;