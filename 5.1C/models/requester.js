const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcrypt")


const requesterSchema = new mongoose.Schema({
    country: String,
    fname: String,
    lname: String,
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email")
            }
        }
    },
    password: {
        type: String,
        minlength: 8
    },
    passwordRepeat: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zip: Number,
    number: Number
})


//hashing the password using bcrypt
requesterSchema.pre('save', async function (next){
    try{
        const salt = await bcrypt.genSalt(10)
        const hashedPassword  = await bcrypt.hash(this.password, salt)
        this.password = hashedPassword
        next()
    }catch(error){
        next(error)
    }
})


module.exports = mongoose.model("Requester", requesterSchema)