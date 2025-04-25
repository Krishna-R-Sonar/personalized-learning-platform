# EduPath
**Tagline:** *Learn Smarter, Teach Easier*

EduPath is an AI-powered learning platform built for the 2025 Hackathon. It empowers students with personalized learning through an AI chatbot (**Gradus**) and assignment management, while enabling teachers to create content efficiently with AI tools (**SmartChalk**) and track progress in real-time.

Built with **React**, **Node.js**, **MongoDB**, and **Google Gemini AI**, EduPath aims to make education more engaging, accessible, and efficient.

---

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Usage](#usage)

---

## Features

- **Student Dashboard**: Manage assignments (tests, homework, learning paths, resources) with tabs for easy navigation.
- **Gradus AI Chatbot**: Get step-by-step answers to any question, powered by Google Gemini AI.
- **SmartChalk**: AI-driven quiz generator for teachers to create assignments quickly.
- **Real-Time Progress Tracking**: Teachers can monitor student completion and scores instantly.
- **Accessibility**: Text-to-speech for quiz questions to support diverse learners.
- **Responsive Design**: Light/dark theme support with a clean, user-friendly interface.

---

## Technologies

### Frontend

- React  
- Axios (API requests)  
- react-toastify (notifications)  
- CSS (custom styles with light/dark themes)  
- Web Speech API (text-to-speech)

### Backend

- Node.js  
- Express  
- MongoDB (via Mongoose)  
- JSON Web Tokens (JWT) for authentication  
- Multer (file uploads)  
- dotenv (environment variables)

### APIs

- Google Generative AI (Gemini 1.5-flash-latest) for Gradus and SmartChalk  
- Custom REST API for authentication, assignments, and AI queries

### Other

- CORS  
- MongoDB connection via `MONGO_URI`

---

## Installation

### Prerequisites

- Node.js (v16 or higher)  
- MongoDB (local or cloud via MongoDB Atlas)  
- Google Gemini API key  
- Git

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/edupath.git
   cd edupath

2. **Set up the server**
    ````
    cd server
    npm install

    Create a .env file in server/ with the following:
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    GEMINI_API_KEY=your_gemini_api_key
    PORT=5000
    
    Start the server:
    npm start
    
3. Set Up the Client
   ````
   cd ../client
    npm install
    npm start


Usage
Teacher Account
Login with:

Role: teacher

Username: teacher1

Password: password123

Create assignments using the Assignment Form or generate quizzes with SmartChalk.

Track student progress in the Progress Tracking section.

Student Account
Login with:

Role: student

Username: student1

Password: password123

Roll No: S001

Class: 10A

Navigate through tabs: Tests, Homework, Learning Paths, Resources, Gradus.

Use Gradus to ask questions like:
"What is photosynthesis?"

Features in Action
Ask Gradus for help via the Gradus tab.

Use SmartChalk to generate quiz questions like:
"Generate 3 math questions"

Complete assignments and view real-time progress updates.
