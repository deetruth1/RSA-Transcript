const express = require('express')
const bcrypt = require('bcrypt')
// const user = require('../models/users')
const router = express.Router()
const path = require('path')
const users = require('../models/users')
const profile = require('../models/profile')
const { log } = require('console')

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/login.html'))
})

router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/login.html'))
})

router.post('/adduser', async (req, res) =>{
    try {
        const {username, email,password,confirmPassword} = req.body
        
        console.log(req.body);
        
        if (!username || !email || !password) {
            return res.status(400).send('All fields required')
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

        const newUser = new User({
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

router.post('/login', async (req, res) =>{
    try {
        const email = req.body.email ? req.body.email.trim().toLowerCase():'';
        const password = req.body.password ? req.body.password.trim():'';

        if (!email || !password) {
            return res.status(400).send('Please enter both email and password')
        }

        const user = await users.findOne({email: email})
        if (!user) {
            res.status(401).send('Invalid Email or Password')
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if(!isPasswordCorrect){
            return res.status(401).send('Invalid Email or Password')
        }

        console.log(`User Login Validation successful! ID: ${user.id} `);

        return res.redirect('/admindash')
        
    } catch (error) {
        console.error('Critical Login Error:', error);
        return res.status(500).send('An unexpected server error occurred during login.')
    }

})

router.post('/profile', async (req, res) => {
    try {
        const { session, term, school, student, data } = req.body;

        // Validation check
        if (!session || !term || !school || !student || !data || data.length === 0) {
            return res.status(400).json({ message: "Please fill out all required fields." });
        }

        const newProfile = new profile({
            session,
            term,
            school,
            surname: student.surname,
            firstName: student.firstName,
            otherName: student.otherName,
            studentId: student.studentId,
            email: student.email,
            results: data
        });

        await newProfile.save();
        console.log("New student added successfully!", newProfile._id);
        
        return res.status(201).json({ success: true, message: "Record logged into Database successfully!" });
            
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ message: "Server error occurred." });
    }
});
module.exports = router