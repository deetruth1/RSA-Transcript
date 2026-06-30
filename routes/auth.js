const express = require('express')
const bcrypt = require('bcrypt')
// const user = require('../models/users')
const router = express.Router()
const path = require('path')
const User = require('../models/users')
const profile = require('../models/profile')
// const { log } = require('console') 

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

router.post('/login', async (req, res) => {
    try {
        console.log("Incoming request body:", req.body);

        // 🌟 CHANGE THIS LINE to look for 'email' matching your terminal logs!
        const email = req.body.email || "";
        const password = req.body.password || "";

        const inputIdentity = String(email).trim();
        const inputPassword = String(password).trim();

        if (!inputIdentity || !inputPassword) {
            return res.status(400).json({ message: "Email and Password fields are required." });
        }

        // 1. Check Administrative Users (theTruthDb.users)
        const staffUser = await User.findOne({ email: inputIdentity.toLowerCase() });

        if (staffUser) {
            const match = await bcrypt.compare(inputPassword, staffUser.password);
            if (!match) return res.status(401).json({ message: "Invalid staff password details." });

            return res.status(200).json({
                success: true,
                user: { 
                    role: staffUser.role || "admin", 
                    name: staffUser.username, 
                    email: staffUser.email 
                }
            });
        }

        // 2. Fallback: Check Student Profiles (theTruthDb.profiles)
        // Checks if the typed email matches, and if the password matches their studentId
        const studentUser = await Profile.findOne({ 
            email: inputIdentity, 
            studentId: inputPassword 
        });
        
        if (!studentUser) return res.status(401).json({ message: "No matching credentials found." });

        return res.status(200).json({
            success: true,
            user: { 
                role: "student", 
                studentId: studentUser.studentId, 
                firstName: studentUser.firstName, 
                surname: studentUser.surname, 
                email: studentUser.email 
            }
        });

    } catch (error) {
        console.error("Authentication system fault:", error);
        return res.status(500).json({ message: "Internal application authorization crash." });
    }
});

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

router.get('/search/profile', async (req, res) =>{
    try {
        const {studentId} = req.query
        // console.log(studentId); 
        const record = await profile.findOne({studentId: studentId});
        // console.log(record);
        if (!record) {
            return res.status(400).json({message: "Student record not found"})
        }
        return res.status(200).json(record)
    
    } catch (error) {
        res.status(500).json({message: "Internal Server error"})
    }
})

router.get('/profile/:id', async (req, res) =>{
    try {
        const record = await profile.findById(req.params.id)
        if (!record) {
            return res.status(400).json({message: "record not found"})
        }
        return res.status(200).json(record)
    } catch (error) {
        return res.status(500).json({message: "Internal Server Error"})
    }
})

router.put('/profile/:id', async (req, res) =>{
    try {
        const {surname, firstName, otherName, term, results} = req.body

        const updatedRecords = await profile.findByIdAndUpdate(
            req.params.id,
            {
                $set:{
                    surname,
                    firstName,
                    otherName,
                    term,
                    results: results
                }
            },
            {new: true, runValidators: true}
        )

        if (!updatedRecords) {
            return res.status(400).json({message: "Document Reference Missing!"})
        }
        return res.status(200).json(updatedRecords)
    } catch (error) {
        return res.status(500).json({message: "Failed to persist document modifications."})
    }
})

router.delete('/profile/:id', async (req, res) => {
    try {
        const deletedRecords = await profile.findByIdAndDelete(req.params.id)

        if (!deletedRecords) {
            return res.status(400).json({message: "Profile Records could not br found!"})
        }
        
        console.log(`Deleted entire profile for document ID: ${req.params.id}`);
        return res.status(200).json({ success: true, message: "Entire profile row cleared successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error occurred during deletion." });
    }
})

// GET COMBINED DASHBOARD METRICS FROM MONGODB
// GET TOTAL UNIQUE STUDENTS COUNT FROM MONGO
router.get('/dashboard/stats', async (req, res) => {
    try {
        // 1. Get an array of all unique studentIds present across your profiles collection
        const uniqueStudentIds = await profile.distinct("studentId");
        
        // 2. Count how many items are in that unique list
        const totalStudents = uniqueStudentIds.length;

        // 3. Count total nested subject rows across every single document profile
        const totalSubjectEntries = await profile.aggregate([
            { $project: { numberOfSubjects: { $size: { $ifNull: ["$results", []] } } } },
            { $group: { _id: null, total: { $sum: "$numberOfSubjects" } } }
        ]);

        const subjectCount = totalSubjectEntries.length > 0 ? totalSubjectEntries[0].total : 0;

        // 4. Send metrics safely over to your admin page frontend
        return res.status(200).json({
            success: true,
            totalStudents: totalStudents,
            totalSubjectsLogged: subjectCount
        });

    } catch (error) {
        console.error("Failed to build dashboard analytics:", error);
        return res.status(500).json({ message: "Internal server dashboard query failure." });
    }
});

// 1. CHECK IF STUDENT ALREADY HAS A PENDING REQUEST
router.get('/requests/status', async (req, res) => {
    try {
        const { studentId } = req.query;
        // Search your transcript database model for an open pending row
        const pendingRequest = await TranscriptRequest.findOne({ studentId, status: "pending" });
        
        return res.status(200).json({ hasPending: !!pendingRequest });
    } catch (error) {
        return res.status(500).json({ message: "Error checking request status." });
    }
});

// 2. CREATE A SUCCESSFUL PAID TRANSCRIPT ENTRY
router.post('/requests/create', async (req, res) => {
    try {
        const { studentId, terms, paymentStatus, paymentReference } = req.body;
        
        const newRequest = new TranscriptRequest({
            studentId,
            terms,
            paymentStatus,
            paymentReference,
            status: "pending",
            createdAt: new Date()
        });

        await newRequest.save();
        return res.status(201).json({ success: true, message: "Transcript request successfully saved." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to record transaction payload." });
    }
});

// 3. FETCH ALL REQUEST HISTORIES FOR A LOGGED-IN STUDENT
router.get('/requests/list', async (req, res) => {
    try {
        const { studentId } = req.query;
        const history = await TranscriptRequest.find({ studentId }).sort({ createdAt: -1 });
        
        return res.status(200).json(history);
    } catch (error) {
        return res.status(500).json({ message: "Error loading request log histories." });
    }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 🌟 THE FIX: Map 'username' from the form into the 'name' field your database expects!
    const newUser = new User({
      name: username || "Staff Member", // Changed from username: username
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "user"
    });

    await newUser.save();
    return res.status(201).json({ message: "User registered successfully!" });

  } catch (error) {
    console.error("Registration route error:", error);
    return res.status(500).json({ message: "Internal server registry error." });
  }
});

module.exports = router