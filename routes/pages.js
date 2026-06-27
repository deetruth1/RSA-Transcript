const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const profile = require("../models/profile")
const path = require("path")
const { log } = require("console")


router.get('/', (req, res) =>{
    const filepath = path.join(__dirname, '../pages/index.html')
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File error:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/login', (req, res) => {
    const filepath = path.join(__dirname, '../pages/login.html')
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:'. err);
            return res.status(404).send('File not found')
        }
    })
})

router.get('/adduser', (req, res) => {
    const filepath = path.join(__dirname, "../pages/adduser.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')            
        }
    })
})

router.get('/admindash', (req, res) => {
    const filepath = path.join(__dirname, "../pages/admindash.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/profile', (req, res) => {
    const filepath = path.join(__dirname, "../pages/profile.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/request', (req, res) => {
    const filepath = path.join(__dirname, "../pages/request.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/sent', (req, res) => {
    const filepath = path.join(__dirname, "../pages/sent.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/student', (req, res) => {
    const filepath = path.join(__dirname, "../pages/student.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/terms', (req, res) => {
    const filepath = path.join(__dirname, "../pages/terms.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/transcript', (req, res) => {
    const filepath = path.join(__dirname, "../pages/transcript.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/generate', (req, res) => {
    const filepath = path.join(__dirname, "../pages/generate.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/edituser', (req, res) => {
    const filepath = path.join(__dirname, "../pages/edituser.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/edit', (req, res) => {
    const filepath = path.join(__dirname, "../pages/edit.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/cookies', (req, res) => {
    const filepath = path.join(__dirname, "../pages/cookies.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/faq', (req, res) => {
    const filepath = path.join(__dirname, "../pages/faq.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})

router.get('/privacy-policy', (req, res) => {
    const filepath = path.join(__dirname, "../pages/privacy-policy.html")
    res.sendFile(filepath, (err) => {
        if (err) {
            console.log('File ERROR:', err);
            return res.status(404).send('File not Found')
        }
    })
})


module.exports = router