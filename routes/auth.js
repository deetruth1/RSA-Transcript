const express = require('express')
const bcrypt = require('bcrypt')
const user = require('../models/users')

const router = express.Router()

router.post('/adduser', async (req, res) =>{
    try {
        const {username, email,password} = req.body
        if (!username || !email || !password) {
            return
            res.status(400).send('All fields required')
        }

        // validation 
        if (password.length < 8) {
            return 
            res.status(400).send('Password must be atleast 8 characters')
        }

        //if user exist
        const userExists = await user.findOne({$or: [{email}, {username}] })
        if (userExists) {
            return 
            res.status(400).send('Username or Email already taken choose another one')
        }
        
        // password hash
        const hashedpassword = await bcrypt.hash(password, 12)

        const newUser = new user({
            username,
            email,
            password: hashedpassword
        })
        
        // save user
        await newUser.save()
        console.log('User Created', newUser._id);
        
    // error handling
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error')
    }
})

module.exports = router