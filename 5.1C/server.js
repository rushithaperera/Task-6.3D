const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const Requester = require("./models/requester")
const https = require('https')


const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))

//landing page as the login
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/login.html")
})

//getting data from the register page
app.get('/register.html', (req, res) => {
    res.sendFile(__dirname + "/register.html")
})


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
        number: number
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
app.post('/', function(req,res){
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

app.listen(8080, function(request, response) {
    console.log("Server is running on port 8080")
})