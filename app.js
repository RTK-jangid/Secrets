//jshint esversion:6
require("dotenv").config();
const express=require("express");
const parser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");
const { log } = require("console");
// const md5=require("md5");
const app=express();
// const bcrypt=require("bcrypt");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

app.set("view engine","ejs");
app.use(parser.urlencoded({extended:true}));
app.set(express.static("public"));
app.use(session({
    secret:"My name is Ritik Jangid.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});
// mongoose.set("useCreateIndex",true);
const userSchema=new mongoose.Schema({
    email:String,
    password:String
});


// userSchema.plugin(encrypt,{requireAuthenticationCode: false,secret:process.env.SECRET,encryptedFields:["password"]})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User=mongoose.model("user",userSchema);

passport.use(User.createStrategy());
passport.serializeUser((user, done) => {
    done(null, user);
});
  
passport.deserializeUser((user, done) => {
done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));
app.get("/",function(req,res){
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
// Successful authentication, redirect home.
res.redirect('/secrets');
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/secrets",function (req,res) {
    if (req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get('/logout', function(req, res){
    req.logout(function(err) {
      if (err) { console.log(err); }
      res.redirect('/');
    });
});
app.post("/login",function (req,res) {
    // User.findOne({email:req.body.username},function (err,results) {
    //     if (err){
    //         console.log(err);
    //     }
    //     else{
    //         if (results){
    //             bcrypt.compare(req.body.password, results.password, function(err, result) {
    //                 if (result==true) {
    //                     res.render("secrets")
    //                 }
    //                 else{
    //                     res.redirect("/register")
    //                 }
    //             });
                
    //         }
    //         else{
    //             res.redirect("/register")
    //         }
    //     }
    // })

    const user= new User({
        email:req.body.username,
        password:req.body.password
    });

    req.login(user,function (err) {
        if (err){
            console.log(err);
            res.redirect("/login");
        }
        else{
            passport.authenticate("local")(req,res,function () {
                res.redirect("/secrets");
            });
            
        }
    });

});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function (req,res) {
    // bcrypt.hash(req.body.password, 10, function(err, hash) {
    //     const user=new User({
    //         email:req.body.username,
    //         password:hash
    //     }) 
    //     user.save();
    // });
    
    
    // res.redirect("/");


    User.register({username:req.body.username},req.body.password,function (err,user) {
       if(err){
        console.log(err);
       } 
       else{
        passport.authenticate("local")(req,res,function () {
            res.redirect("/secrets")
        })
       }
    });

});

app.listen(3000,function () {
    console.log("Server is running on port 3000");
})