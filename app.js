    const express = require("express")
    const os = require("os")
    const path = require("path")
    const multer = require("multer")
    const mongoose = require("mongoose")
    const pageRoutes = require('./routes/pages')
    const bodyParser = require('body-parser')
    const authRoutes = require('./routes/auth')


    const app = express()

    const port = 3000
    app.use(express.static(path.join(__dirname, 'public')))
    app.use(express.urlencoded({extended:true}))
    app.use(express.json())
    app.use('/', pageRoutes)
    app.use('/users', authRoutes)




    // connect database
    const url = 'mongodb://localhost:27017/theTruthDb'

    mongoose.connect(url)
    .then(async () => {
        console.log('Database connected successfully');
        
        // try {
        //     await mongoose.model('profile').cleanIndexes();
        //     console.log('Old database indexes cleared and synchronized successfully.');
        // } catch (indexErr) {
        //     console.log('Error clearing old indexes', indexErr.message);
        // }
    })
    .catch(err => console.log(err));


    app.listen(port, () => {
        console.log(`server running on Port ${port}`);
        
    })



