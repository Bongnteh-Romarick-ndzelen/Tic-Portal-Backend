
Tech Innovation Center (TIC) Portal
 For Educational Training, Skill Development & Internships
________________________________________
1. Introduction
1.1 Purpose
The TIC Portal is a centralized digital platform created to train students across diverse tech domains (AI, Cybersecurity, Web Development, IoT, etc.) through structured courses, hands-on projects, hackathons, internships, and mentorship programs.
1.2 Scope
●	Provides an interactive Learning Management System (LMS).

●	Facilitates hackathons, virtual labs, internships, and peer collaboration.

●	Connects students with industry mentors, internship programs, and job opportunities.

●	Supports gamification (badges, leaderboards) to enhance engagement and motivation.

1.3 Definitions
●	LMS: Learning Management System (course delivery & tracking).

●	Virtual Lab: Cloud-based coding environment (e.g., Jupyter, Docker).

●	Hackathon Hub: Competitive coding events with submissions & judging.

●	Internship Portal: Platform to apply for industry internships and track applications.

________________________________________
2. Overall Description
2.1 User Roles
Role	Permissions
Student	Enroll in courses, submit projects, join hackathons, apply for internships, interact in forums.
Instructor	Upload courses, grade assignments, host live sessions.
Admin	Manage users, approve events/internships, configure system settings.
Mentor	Provide guidance via forums or 1:1 sessions.
Employer	Post internships, review applicants, conduct interviews.
2.2 Use Cases
A. Student Use Cases
1.	Course Enrollment

2.	Virtual Lab Access

3.	Hackathon Participation

4.	Mentorship Request

5.	Internship Application

○	Browse internships → Submit resume/profile → Track application status.






# TIV Portal Backend

This is the backend API for the TIC Portal built using **Node.js**, **Express**, and **MongoDB Atlas**.

## 📦 Installation & Setup

1. **Download or clone this project from GitHub**
   ```bash
   git clone https://github.com/Bongnteh-Romarick-ndzelen/Tic-Portal-Backend

2.  **Navigate into the project directory**
### cd tic-portal-backend


3. **Install dependencies**
 ## npm install

4. **Create a .env file and add:**
   
   <!-- PORT=5000
    MONGO_URI=mongodb+srv://username:password@cluster0.ie18wqq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
    JWT_SECRET="F7jU$9dF!e8Dq#n3R9gT2lZwV@KxA4" -->

5. Run the server
   ## npm run dev 

6. 🧪 Testing the API with Postman
Use Postman to test the following endpoints:

Note: For protected routes, you must first log in and include the JWT token in the Authorization header as:
Bearer <your_token>

🧍 Authentication
| Method | Endpoint           | Description              |
| ------ | ------------------ | ------------------------ |
| POST   | `/api/auth/signup` | Register a new user      |
| POST   | `/api/auth/login`  | Login user and get token |

📚 Courses (Instructor Only)
| Method | Endpoint           | Description             |
| ------ | ------------------ | ----------------------- |
| POST   | `/api/courses`     | Create a new course     |
| GET    | `/api/courses`     | Get all courses         |
| GET    | `/api/courses/:id` | Get single course by ID |
| PUT    | `/api/courses/:id` | Update course by ID     |
| DELETE | `/api/courses/:id` | Delete course by ID     |

Course Object Example:
{
  "title": "Web Development Fundamentals",
  "description": "Learn HTML, CSS, and JavaScript from scratch.",
  "category": "Web Development",
  "videoUrl": "https://example.com/myvideo.mp4", // optional
  "docPath": "/docs/course-guide.pdf"           // optional
}

🔐 Auth Middleware
The API includes a middleware to protect routes and restrict actions to instructors (e.g. creating a course).

📎 Notes
Only users with role "instructor" can create, update, or delete courses.

All video extensions and document formats are allowed (handled as optional fields).

7. Enrollment
 ### A. Enroll in a course ###
Method: POST

URL: http://localhost:5000/api/enrollments/<COURSE_ID>

Headers:

Authorization: Bearer <your_token> //Your login token

Body: (none needed)

✅ Sample Response:
{
  "message": "Enrollment successful",
  "enrollment": {
    "_id": "662d923b4f0f0e34b8d112b4",
    "student": "662d91f84f0f0e34b8d112a9",
    "course": "662d920e4f0f0e34b8d112b1",
    "progress": 0,
    "enrolledAt": "2025-05-15T15:50:35.844Z",
    "__v": 0
  }
}


# View Enrollments
Method: GET

URL: http://localhost:5000/api/enrollments

Headers:

Authorization: Bearer <your_token>

✅ Sample Response:
[
  {
    "_id": "662d923b4f0f0e34b8d112b4",
    "student": "662d91f84f0f0e34b8d112a9",
    "course": {
      "_id": "662d920e4f0f0e34b8d112b1",
      "title": "React 101",
      "description": "Intro to React",
      "category": "Web Dev",
      ...
    },
    "progress": 0,
    "enrolledAt": "2025-05-15T15:50:35.844Z"
  }
]

## TIPS #
✅ Common Mistakes to Avoid
🔒 Make sure the JWT token is sent as Bearer <token> in Authorization header.

🧑 The user must be of type "student" (or anyone allowed to enroll).

🎯 Use the actual course ID from MongoDB when making the request.

## INSTRUCTOR ONLY TO ACCESS STUDENTS OR PEOPLE ENROLL IN THEIR COURSE
| Method | Route                                     | Access       | Purpose                               |
| Enroll in a course                    |
| GET    | `/api/enrollments/my-courses/enrollments` | Instructor   | See who enrolled in their own courses |

Uses MongoDB Atlas for cloud database.

📫 Contact
For issues or feature requests, feel free to open an issue on GitHub.

🛠️ Tech Stack
Node.js

Express.js

MongoDB Atlas

Mongoose

JWT Authentication

CORS (Cross-Origin Resource Sharing)"# Tic-portal" 
