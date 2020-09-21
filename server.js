const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const Requester = require("./models/requester")
const https = require('https')
const passport = require('passport');
const cookieSession = require('cookie-session')
var nodemailer = require('nodemailer')
var async = require('async')
var crypto = require('crypto')
const requester = require('./models/requester')
require('./passport')


const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))

app.use(cookieSession({
    name: 'iCrowdSession',
    keys: ['key1', 'key2']
  }))


const isLoggedIn = (req,res,next)=>{
    if(req.user){
        next()
    }else{
        res.sendStatus(401)
    }
}

app.use(passport.initialize())
app.use(passport.session())

//landing page as the login
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/login.html")
})

//getting data from the register page
app.get('/register.html', (req, res) => {
    res.sendFile(__dirname + "/register.html")
})


app.get('/success', isLoggedIn, (req, res) => {
    res.sendFile(__dirname + "/reqtask.html")
})

app.get('/failed', (req, res) => {
    res.sendFile("Failed to login")
})

app.get('/confirmEmail.html', (req, res) => {
    res.sendFile(__dirname + "/confirmEmail.html")
})



app.get('/google',
  passport.authenticate('google', { scope: 
      [ 'https://www.googleapis.com/auth/plus.login',
      , 'https://www.googleapis.com/auth/plus.profile.emails.read' ] }
));

app.get( '/google/callback', 
    passport.authenticate( 'google', { 
        successRedirect: '/success',
        failureRedirect: '/failed'
}));





mongoose.connect("mongodb://localhost:27017/iCrowdTaskDB", { useNewUrlParser: true })


app.post('/register', (req, res) => {
    const country = req.body.country
    const firstname = req.body.fname
    const lastname = req.body.lname
    const email = req.body.email
    const password = req.body.psw
    const passwordRepeat = req.body.pswrepeat
    const address1 = req.body.addressLine1
    const address2 = req.body.addressLine2
    const city = req.body.city
    const state = req.body.state
    const zip = req.body.zip
    const number = req.body.number

    const data = {
        members:[{
            email_address: email,
            status: "subscribed",
            merge_fields:{
                FNAME: firstname,
                LNAME: lastname
            } 
        }]
    }

    jsonData = JSON.stringify(data)
    const url = "https://us17.api.mailchimp.com/3.0/lists/c73e83d4b5"
    const options = {
        method: "POST",
        auth:"rush:a43f323e8020afbb1a8ce34c978f8eb0-us17" 
    }

    const request = https.request(url, options, (response)=>{
        response.on("data",(data)=>{
            console.log(JSON.parse(data))
        })

    })

    request.write(jsonData)
    request.end()

    const requester = new Requester({
        country: country,
        fname: firstname,
        lname: lastname,
        email: email,
        password: password,
        passwordRepeat: passwordRepeat,
        address1: address1,
        address2: address2,
        city: city,
        state: state,
        zip: zip,
        number: number,

    })

    //checing if the password and password repeat are the same
    if (password != passwordRepeat) {
        throw new Error("Password does not match")
    }
    //saving data to the database
    requester.save((err) => {
        if (err) {
            console.log(err)
        } else {
            res.sendFile(__dirname + "/login.html")
        }
    })
})


//verifying the login details during login
app.post('/',  function(req,res){
    const email = req.body.email
    const psw = req.body.psw

    Requester.findOne({email:email, passwordRepeat:psw}, function(err,Requester){
        if(err){
            throw new Error(err)
        }
        if(!Requester)
        {
            console.log("Invalid username or password. Please try again")
        }
        else
        {
            res.sendFile(__dirname + "/reqtask.html")
            console.log("User Found!")
        }
    })
})

//sending password reset email using nodemailer
app.post('/confirmEmail', function(req,res,next){
    async.waterfall([
        function(done){
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString('hex')
                done(err,token)
            })
        },
        function(token, done){
            const confEmail = req.body.confEmail
            Requester.findOne({email:confEmail}, function(err,requester){
                if(!requester)
                {
                    console.log("Does not exist")
                }
                requester.resetPasswordToken = token
                requester.save(function(err){
                    done(err,token,requester)
                })
            })
        },
        function(token, requester, done){
            var smtp = nodemailer.createTransport({
                service: 'Gmail',
                auth:{ 
                    user: 'dimia.rp@gmail.com',
                    pass: 'dwxlsgemiyprdfbr'
                }
            })
            var mail = {
                to: requester.email,
                from: 'dimia.rp@gmail.com',
                subject:'Password Reset',
                text:'http://localhost:8080/resetPassword.html'
            }
            smtp.sendMail(mail, function(err){
                console.log("mail sent")
                done(err,'done')
            })
        }
    ], function(err){
        if(err) return next(err)
        res.redirect('/confirmEmail.html')
    })
})

//rest password route
app.get('/resetPassword.html', function(req, res){
    Requester.findOne({resetPasswordToken: req.params.token}, function(err,requester){
        res.sendFile(__dirname + '/resetPassword.html', {token:req.params.token})
    })
})

//resetting the password
app.post('/resetPassword', function(req,res){
    async.waterfall([
        function(done){
            Requester.findOne({resetPasswordToken: req.params.token}, function(err,requester){
                if(req.body.newpsw == req.body.newpsw2){
                    Requester.updateOne({password: req.body.newpsw}, function(err){
                       requester.save((err) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.sendFile(__dirname + "/reqtask.html")
                        }
                        })
                    })
                }
            })
        }
    ])
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8080;
}

app.listen(port, function(request, response) {
    console.log("Server is running on port 8080")
})