# AI StudyMate

AI StudyMate is an AI-powered interactive quiz and flashcard-style study application built with React and Google Gemini.

## Features

- Enter any topic or study notes
- Generate AI-powered multiple-choice quizzes
- Choose 5, 10, or 15 questions
- Four options for every question
- Instant correct/wrong answer feedback
- Explanation for every answer
- Automatic score calculation
- Retest wrong answers
- Create a new quiz
- Loading and error handling
- AI response JSON validation
- Retry handling for temporary Gemini errors
- Request protection against stale responses
- Responsive user interface

## Technology Stack

### Frontend
- React.js
- JavaScript
- CSS
- Vite

### Backend
- Node.js
- Express.js
- CORS
- dotenv

### AI
- Google Gemini API
- `@google/genai`

## How It Works

1. The user enters a topic or study notes.
2. The user selects the number of questions.
3. React sends the request to the backend.
4. The backend sends the prompt to Google Gemini.
5. Gemini returns structured JSON.
6. The backend parses and validates the JSON.
7. The validated quiz is sent to the React frontend.
8. The frontend displays the interactive quiz.
9. The user selects answers and receives instant feedback.
10. The application calculates the score and allows wrong answers to be retested.

## AI Response Validation

The backend validates:

- Quiz title
- Number of questions
- Question text
- Exactly four options
- Correct answer index
- Explanation

Invalid or malformed AI responses are rejected instead of being displayed directly to the user.

## Project Structure

```text
AI-StudyMate
│
├── server
│   └── generate.js
│
├── src
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── public
├── .env
├── package.json
├── vite.config.js
└── README.md