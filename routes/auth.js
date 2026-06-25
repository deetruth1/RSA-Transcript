const express = require('express')
const bcrypt = require('bcrypt')
const user = require('../models/users')
const router = express.Router()
const path = require('path')

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/login.html'))
})

router.post('/adduser', async (req, res) =>{
    try {
        const {username, email,password,confirmPassword} = req.body
        
        console.log(req.body);
        
        if (!username || !email || !password) {
            return
            res.status(400).send('All fields required')
        }

        // validation 
        if (password.trim().length < 8) {
            return res.status(400).send('Password must be atleast 8 characters')
        }

        //if user exist
        const userExists = await user.findOne({$or: [{email}, {username}] })
        if (userExists) {
            return res.status(400).send('Username or Email already taken choose another one')
        }
        
        if (password !== confirmPassword) {
            return res.status(400).send('password mismatch ')
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
       return res.redirect('/login')

    // error handling
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error')
    }
})

module.exports = router