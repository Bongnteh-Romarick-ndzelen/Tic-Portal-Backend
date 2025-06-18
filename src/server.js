// server.js (or index.js)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from '../config/db.js'; // 👈 NEW

// Route imports
import authRoutes from './routes/auth/Auth.js';
import courseRoutes from './routes/course/course.js';
import enrollmentRoutes from './routes/enrollment/enrollment.js';
import progressRoutes from './routes/course/progress.js';
import userRoutes from './routes/users/users.js';

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../config/swagger.js';
import errorHandler from './middleware/errorHandler.js';

import labRoutes from './routes/labs/labs.js';
import forumRoutes from './routes/forum/forum.js';

import moduleRoute from './routes/module/moduleRoute.js';
import moduleExtrasRoutes from './routes/module/moduleExtraRoute.js';

const app = express();

// Connect to MongoDB
connectDB(); // 👈 Replaces mongoose.connect()

// CORS
app.use(cors({
    origin: true, // or use a function
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.get('/', (req, res) => res.send('API Running on port 5000'));
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/users', userRoutes);
app.use('/uploads', express.static('uploads'));

app.use('/api/labs', labRoutes);
app.use('/api/forums', forumRoutes);

app.use('/api/modules', moduleRoute);
app.use('/api/modules', moduleExtrasRoutes); // 📌 Mounts summary & quiz routes under same path
// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global error handler
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${ PORT }`));
