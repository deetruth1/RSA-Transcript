const express = require('express')
const bcrypt = require('bcrypt')
// const user = require('../models/users')
const router = express.Router()
const path = require('path')
const mongoose = require('mongoose')
const User = require('../models/users')
const Transcript = require('../models/Request')
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
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Both credentials are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const credentialInput = password.trim(); // This contains either the password OR Student ID

    // ─── STRATEGY 1: CHECK FOR ADMIN / STAFF (Email + Password) ───
    let user = await User.findOne({ email: cleanEmail });
    
    if (user) {
      // If found in users collection, authenticate using standard bcrypt matching
      const isMatch = await bcrypt.compare(credentialInput, user.password);
      if (isMatch) {
        return res.status(200).json({
          message: "Sign in successful!",
          user: {
            _id: user._id,
            username: user.username || user.name,
            email: user.email,
            role: user.role || "user"
          }
        });
      }
    }

    const studentProfile = await mongoose.connection.collection('profiles').findOne({
      email: cleanEmail,
      studentId: credentialInput 
    });

    if (studentProfile) {
      return res.status(200).json({
        message: "Student sign in successful!",
        user: {
          _id: studentProfile._id,
          username: `${studentProfile.firstName || ''} ${studentProfile.surname || ''}`.trim() || "Student",
          email: studentProfile.email,
          studentId: studentProfile.studentId,
          role: "student" // Hardcode the client routing flag to student
        }
      });
    }

    // If neither strategy handles the transaction parameters, deny access
    return res.status(401).json({ message: "Invalid Email, Password, or Student ID." });

  } catch (error) {
    console.error("Unified login handler failure:", error);
    return res.status(500).json({ message: "Internal authentication system error." });
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

    const newUser = new User({
      name: username || "Staff Member",     
      username: username || "Staff Member",
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

// ================= FETCH ALL REGISTERED USERS =================
router.get('/all-users', async (req, res) => {
  try {
    // Fetch all users from the database, leaving out the password for security
    const users = await User.find({}, '-password'); 
    
    // Send the list of users back to the frontend
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users from database:", error);
    res.status(500).json({ message: "Internal server error fetching users." });
  }
});

// ================= DELETE A USER BY ID =================
router.delete('/staff/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Use Mongoose to find and remove the user by their unique _id
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User account profile not found in database." });
    }

    return res.status(200).json({ message: "Clearance dropped. Account terminated successfully." });
  } catch (error) {
    console.error("Backend delete route error:", error);
    return res.status(500).json({ message: "Internal server error deleting user account." });
  }
});

// 1. CHECK PENDING REQUEST STATUS
// Endpoint: GET http://localhost:3000/users/requests/status?studentId=...
router.get('/requests/status', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ message: "Missing studentId parameter." });

    // Look for any request that isn't finished yet
    const pendingRequest = await Request.findOne({ 
      studentId: studentId, 
      status: { $in: ['pending', 'processing'] } 
    });

    return res.status(200).json({ hasPending: !!pendingRequest });
  } catch (error) {
    console.error("Error checking request status:", error);
    return res.status(500).json({ message: "Internal server error checking track states." });
  }
});

// 1. CREATE NEW TRANSCRIPT RECORD
router.post('/requests/create', async (req, res) => {
  try {
    const { studentId, terms, paymentStatus, paymentReference } = req.body;

    // Use our uniquely named model variable here:
    const newRequest = new Transcript({
      studentId,
      terms,
      paymentStatus,
      paymentReference
    });

    await newRequest.save();
    return res.status(201).json(newRequest);
  } catch (error) {
    console.error("CRITICAL BACKEND SHOWING ERROR:", error); // Forces visibility in terminal
    return res.status(500).json({ message: error.message });
  }
});

// 2. FETCH STUDENT'S HISTORICAL LOGS LIST
router.get('/requests/list', async (req, res) => {
  try {
    const { studentId } = req.query;

    // Use our uniquely named model variable here:
    const list = await Transcript.find({ studentId }).sort({ createdAt: -1 });
    return res.status(200).json(list);
  } catch (error) {
    console.error("CRITICAL BACKEND SHOWING ERROR:", error); // Forces visibility in terminal
    return res.status(500).json({ message: error.message });
  }
});


module.exports = router