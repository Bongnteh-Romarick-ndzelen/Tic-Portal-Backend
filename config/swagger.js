import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Tic Portal API Documentation',
            version: '1.0.0',
            description:
                'The TIC Portal is a centralized digital platform created to train students across diverse tech domains (AI, Cybersecurity, Web Development, IoT, etc.) through structured courses, hands-on projects, hackathons, internships, and mentorship programs.',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local development server'
            },
            {
                url: process.env.PRODUCTION_URL || 'https://ticportal.onrender.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        fullName: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string', enum: ['student', 'instructor', 'admin', 'employer', 'mentor'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Course: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        instructor: {
                            $ref: '#/components/schemas/User'
                        },
                        category: { type: 'string' },
                        videoUrl: { type: 'string' },
                        documentPath: { type: 'string' },
                        thumbnail: { type: 'string' },
                        duration: { type: 'string' },
                        pace: { type: 'string' },
                        price: { type: 'string', enum: ['Free', 'Paid'] },
                        level: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
                        features: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                        rating: { type: 'number' },
                        studentsEnrolled: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Module: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        courseId: {
                            type: 'string',
                            description: 'ID of the course this module belongs to',
                        },
                        content: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: ['text', 'video', 'pdf', 'summary', 'quiz'],
                                },
                                text: { type: 'string', nullable: true },
                                summary: { type: 'string', nullable: true },
                                videoUrl: { type: 'string', nullable: true },
                                pdfUrl: { type: 'string', nullable: true },
                                quiz: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Quiz' },
                                    nullable: true,
                                },
                            },
                            required: ['type'],
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Quiz: {
                    type: 'object',
                    properties: {
                        question: { type: 'string' },
                        options: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                        answer: { type: 'string' },
                    },
                    required: ['question', 'options', 'answer'],
                },
                Enrollment: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        student: {
                            $ref: '#/components/schemas/User',
                        },
                        course: {
                            $ref: '#/components/schemas/Course',
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                InternshipApplication: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        studentId: { type: 'string' },
                        internshipId: { type: 'string' },
                        resumeUrl: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                    required: ['studentId', 'internshipId', 'resumeUrl'],
                },
                Internship: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        company: { type: 'string' },
                        location: { type: 'string' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' },
                        stipend: { type: 'number' },
                        skills: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                        responsibilities: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                        qualifications: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                    required: ['title', 'description', 'company', 'location', 'startDate', 'endDate', 'stipend'],
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;