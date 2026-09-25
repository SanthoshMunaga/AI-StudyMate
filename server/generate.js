import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ------------------------------------
// Quiz JSON Schema
// ------------------------------------

const quizSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          question: {
            type: "string",
          },
          options: {
            type: "array",
            items: {
              type: "string",
            },
          },
          correctAnswer: {
            type: "integer",
          },
          explanation: {
            type: "string",
          },
        },
        required: [
          "id",
          "question",
          "options",
          "correctAnswer",
          "explanation",
        ],
      },
    },
  },
  required: ["title", "questions"],
};

// ------------------------------------
// Validate AI Response
// ------------------------------------

function validateQuiz(quiz, expectedCount) {
  if (!quiz || typeof quiz !== "object") {
    return false;
  }

  if (
    typeof quiz.title !== "string" ||
    !quiz.title.trim()
  ) {
    return false;
  }

  if (!Array.isArray(quiz.questions)) {
    return false;
  }

  if (
    quiz.questions.length !== Number(expectedCount)
  ) {
    return false;
  }

  for (const question of quiz.questions) {
    if (!question || typeof question !== "object") {
      return false;
    }

    if (
      typeof question.id !== "string" ||
      typeof question.question !== "string" ||
      typeof question.explanation !== "string"
    ) {
      return false;
    }

    if (!Array.isArray(question.options)) {
      return false;
    }

    if (question.options.length !== 4) {
      return false;
    }

    if (
      !question.options.every(
        (option) =>
          typeof option === "string" &&
          option.trim().length > 0
      )
    ) {
      return false;
    }

    if (
      !Number.isInteger(question.correctAnswer) ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 3
    ) {
      return false;
    }
  }

  return true;
}

// ------------------------------------
// Gemini Request with Retry
// ------------------------------------

async function generateWithRetry(
  prompt,
  maxAttempts = 3
) {
  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      console.log(
        `Gemini attempt ${attempt}/${maxAttempts}`
      );

      const generatePromise =
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: quizSchema,
          },
        });

      // Stop waiting if Gemini takes too long
      const timeoutPromise = new Promise(
        (_, reject) => {
          setTimeout(() => {
            const timeoutError = new Error(
              "Gemini request timed out"
            );
            timeoutError.status = 503;
            reject(timeoutError);
          }, 30000);
        }
      );

      return await Promise.race([
        generatePromise,
        timeoutPromise,
      ]);
    } catch (error) {
      console.error(
        `Gemini attempt ${attempt} failed:`,
        error.message
      );

      const status = error?.status;

      // Retry temporary errors and timeout errors
      if (
        status !== 503 ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      const waitTime = 1500 * attempt;

      console.log(
        `Retrying in ${waitTime}ms...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, waitTime)
      );
    }
  }
}

// ------------------------------------
// Generate Quiz API
// ------------------------------------

app.post(
  "/api/generate",
  async (req, res) => {
    try {
      const {
        topic,
        questionCount,
      } = req.body;

      // Validate user input
      if (
        typeof topic !== "string" ||
        !topic.trim()
      ) {
        return res.status(400).json({
          error:
            "Please provide a topic or notes.",
        });
      }

      const count = Number(questionCount);

      if (![5, 10, 15].includes(count)) {
        return res.status(400).json({
          error:
            "Question count must be 5, 10, or 15.",
        });
      }

      // ------------------------------------
      // Prompt for Gemini
      // ------------------------------------

      const prompt = `
You are an educational quiz generator for an application called AI StudyMate.

Create a multiple-choice quiz based on the user's topic or notes.

User topic:
${topic}

Number of questions:
${count}

Rules:

1. Generate exactly ${count} questions.
2. Every question must have exactly 4 options.
3. Only one option must be correct.
4. correctAnswer must be the zero-based index of the correct option.
5. correctAnswer must therefore be 0, 1, 2, or 3.
6. Provide a short and clear explanation for every answer.
7. Questions should be educational and relevant to the topic.
8. Avoid duplicate questions.
9. Return ONLY JSON matching the provided schema.
10. Do not return Markdown.
11. Do not add any text outside the JSON.

The user is using this for studying, so keep the questions clear and useful.
`;

      // ------------------------------------
      // Call Gemini
      // ------------------------------------

      const response =
        await generateWithRetry(prompt);

      // ------------------------------------
      // Parse JSON
      // ------------------------------------

      let quiz;

      try {
        quiz = JSON.parse(response.text);
      } catch (parseError) {
        console.error(
          "Invalid JSON from Gemini:",
          parseError
        );

        return res.status(502).json({
          error:
            "AI returned invalid JSON. Please try again.",
        });
      }

      // ------------------------------------
      // Validate Quiz
      // ------------------------------------

      if (
        !validateQuiz(
          quiz,
          count
        )
      ) {
        console.error(
          "Invalid quiz structure:",
          quiz
        );

        return res.status(502).json({
          error:
            "AI returned an invalid quiz structure. Please try again.",
        });
      }

      // ------------------------------------
      // Send Quiz to Frontend
      // ------------------------------------

      res.json(quiz);
    } catch (error) {
      console.error(
        "Gemini API error:",
        error
      );

      const status =
        error?.status;

      if (status === 503) {
        return res.status(503).json({
          error:
            "Gemini is temporarily busy. Please try again.",
        });
      }

      return res.status(500).json({
        error:
          "Failed to generate quiz.",
      });
    }
  }
);

// ------------------------------------
// Start Server
// ------------------------------------

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI StudyMate server running on port ${PORT}`);
});