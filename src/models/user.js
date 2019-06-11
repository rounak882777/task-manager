const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
        name:{
            type: String,
            required: true,
            trim : true
        },

        email:{
            
            type: String,
            unique: true,
            required: true,   
            trim: true,
            lowercase: true,
            validate(value){
                if(!validator.isEmail(value)){
                    throw Error('Email is invalid!')
                }
            }
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minlength: 6,
            lowercase: true,
            validate(value){
                if(value.includes('password')){
                    throw Error('Password is invalid')
                }
            }
        },
        age: {
            type: Number,
            default: 0,
            validate(value){
                if(value < 0){
                    throw Error('Age is invalid!')
                }
            }
        },
        tokens: [{
            token:{
                type:String,
                required: true
            }
        }]
    }
)

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function (){
    const user = this

    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}


userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token =  jwt.sign({_id: user._id.toString()}, 'thisismysecret')
    
    console.log(token)

    user.tokens = user.tokens.concat({ token })

    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})

    console.log(user.email)

    if(!user){
        throw new Error('Unable to login')
    }

    const isMatch =  await bcrypt.compare(password , user.password)

    // if(!isMatch){
    //     throw new Error('Unable to login')
    // }


    return user
}


userSchema.pre('save', async function (next) {
    const user = this

    if(user.isModified('password')){
        console.log(user.password)
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User