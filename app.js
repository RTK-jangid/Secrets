//jshint esversion:6
require("dotenv").config();
const express=require("express");
const parser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");
const { log } = require("console");

const app=express();

app.set("view engine","ejs");
app.use(parser.urlencoded({extended:true}));
app.set(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

const userSchema=new mongoose.Schema({
    email:String,
    password:String
})

userSchema.plugin(encrypt,{requireAuthenticationCode: false,secret:process.env.SECRET,encryptedFields:["password"]})

const User=mongoose.model("user",userSchema);


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});



app.post("/login",function (req,res) {
    User.findOne({email:req.body.username},function (err,results) {
        if (err){
            console.log(err);
        }
        else{
            if (results){
                if (req.body.password===results.password) {
                    res.render("secrets")
                }
                else{
                    res.redirect("/register")
                }
            }
            else{
                res.redirect("/register")
            }
        }
    })
})

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function (req,res) {
    const user=new User({
        email:req.body.username,
        password:req.body.password
    }) 
    user.save();
    res.redirect("/");
})

app.listen(3000,function () {
    console.log("Server is running on port 3000");
})