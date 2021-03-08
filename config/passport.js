const passport=require('passport');
const  GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db/pool');

passport.serializeUser(async(user, done)=>{
    let newid = parseInt(user.id%50);
    (await pool).query('select * from users where id=$1', [newid], async (err, respdb)=>{
        if(err) {
            console.error(err);
            return;
        }
        let u = respdb.rows[0];
        if(!u){
            (await pool).query('insert into users ("id", "name", "email", "image") values($1, $2, $3, $4)', 
            [newid, user.displayName, user.emails[0].value, user.photos[0].value], async (err2, respdb2)=>{
                if(err2) {
                    console.error(err2);
                    return;
                }
            });
        }
      });
    done(null, newid);
});

passport.deserializeUser(async(id, done)=>{
    console.log('este es el id ' +id);   
    (await pool).query('select u.id, u.name "displayName", u.email, u.image from users u where id=$1', [id], async(err, respdb)=>{
        if(!err){
            const u = respdb.rows[0];
            if(u)
                done(null, u);
            else
                done();
        }else console.error(err);
    });
});

passport.use(
    new  GoogleStrategy(
        {
            clientID:process.env.CLIENT_ID,
            clientSecret:process.env.CLIENT_SECRET,
            callbackURL:'http://localhost:3001/auth/google/callback'},
        function(accessToken, refreshToken, profile,done){
            console.log(profile);
            done(null,profile);
        }
    )
);