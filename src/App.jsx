import { useState } from "react";
import "./App.css";

function App() {
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState({});
  const [score, setScore] = useState(0);

  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [isRetest, setIsRetest] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic or paste your notes.");
      return;
    }

    setLoading(true);
    setError("");
    setQuiz(null);
    setSelectedAnswers({});
    setAnsweredQuestions({});
    setScore(0);
    setWrongQuestions([]);
    setIsRetest(false);

    try {
      const response = await fetch(
        "https://ai-studymate-k0cz.onrender.com/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
            questionCount: Number(questionCount),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      setQuiz(data);
    } catch (error) {
      console.error("Quiz generation error:", error);
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (question, optionIndex) => {
    if (answeredQuestions[question.id]) {
      return;
    }

    setSelectedAnswers((previous) => ({
      ...previous,
      [question.id]: optionIndex,
    }));

    setAnsweredQuestions((previous) => ({
      ...previous,
      [question.id]: true,
    }));

    if (optionIndex === question.correctAnswer) {
      setScore((previous) => previous + 1);
    } else {
      setWrongQuestions((previous) => [
        ...previous,
        question,
      ]);
    }
  };

  const handleRetest = () => {
    if (wrongQuestions.length === 0) {
      return;
    }

    setQuiz({
      title: "Retest - Wrong Answers",
      questions: wrongQuestions,
    });

    setSelectedAnswers({});
    setAnsweredQuestions({});
    setScore(0);
    setWrongQuestions([]);
    setIsRetest(true);
  };

  const handleNewQuiz = () => {
    setQuiz(null);
    setSelectedAnswers({});
    setAnsweredQuestions({});
    setScore(0);
    setWrongQuestions([]);
    setIsRetest(false);
    setError("");
  };

  return (
    <div className="app">

      {/* Hero Section */}
      {!quiz && (
        <div className="hero">
          <div className="logo">AI</div>

          <h1>AI StudyMate</h1>

          <p>
            Turn any topic into an interactive quiz
          </p>

          <span className="badge">
            Powered by Google Gemini
          </span>
        </div>
      )}

      {/* Quiz Heading */}
      {quiz && (
        <div className="quiz-header">
          <div className="small-logo">AI</div>

          <h1>AI StudyMate</h1>

          <p>{isRetest ? "Review your mistakes" : "Interactive Quiz"}</p>
        </div>
      )}

      {/* Input Section */}
      {!quiz && (
        <div className="input-section">

          <label htmlFor="topic">
            Topic or Study Notes
          </label>

          <textarea
            id="topic"
            value={topic}
            onChange={(event) =>
              setTopic(event.target.value)
            }
            placeholder="Enter a topic or paste your notes..."
          />

          <div className="controls">

            <div className="question-control">
              <label htmlFor="questionCount">
                Number of Questions
              </label>

              <select
                id="questionCount"
                value={questionCount}
                onChange={(event) =>
                  setQuestionCount(event.target.value)
                }
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
              </select>
            </div>

            <button
              className="generate-button"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                "Generate Quiz"
              )}
            </button>

          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error">
          ⚠️ {error}
        </div>
      )}

      {/* Quiz */}
      {quiz && (
        <div className="quiz">

          <div className="quiz-title">
            <h2>{quiz.title}</h2>

            <div className="score">
              Score: {score} / {quiz.questions.length}
            </div>
          </div>

          {quiz.questions.map((question, index) => {
            const selectedAnswer =
              selectedAnswers[question.id];

            const isAnswered =
              answeredQuestions[question.id];

            return (
              <div
                className="question-card"
                key={question.id}
              >

                <div className="question-number">
                  Question {index + 1}
                </div>

                <h3>
                  {question.question}
                </h3>

                <div className="options">

                  {question.options.map(
                    (option, optionIndex) => {

                      let className = "option";

                      if (isAnswered) {
                        if (
                          optionIndex ===
                          question.correctAnswer
                        ) {
                          className =
                            "option correct";
                        } else if (
                          optionIndex ===
                          selectedAnswer
                        ) {
                          className =
                            "option wrong";
                        }
                      }

                      return (
                        <button
                          key={optionIndex}
                          className={className}
                          onClick={() =>
                            handleAnswer(
                              question,
                              optionIndex
                            )
                          }
                          disabled={isAnswered}
                        >
                          <span className="option-letter">
                            {String.fromCharCode(
                              65 + optionIndex
                            )}
                          </span>

                          <span>{option}</span>
                        </button>
                      );
                    }
                  )}

                </div>

                {isAnswered && (
                  <div className="explanation">

                    <strong>
                      {selectedAnswer ===
                      question.correctAnswer
                        ? "Correct! 🎉"
                        : "Wrong Answer"}
                    </strong>

                    <p>
                      {question.explanation}
                    </p>

                  </div>
                )}

              </div>
            );
          })}

          {/* Final Result */}
          <div className="result">

            <div className="result-icon">
              {score === quiz.questions.length
                ? "🏆"
                : "📚"}
            </div>

            <h2>Quiz Completed!</h2>

            <div className="final-score">
              {score}
              <span>
                / {quiz.questions.length}
              </span>
            </div>

            <p>
              {score === quiz.questions.length
                ? "Perfect score! Great job!"
                : "Keep practicing and improve your score!"}
            </p>

            <div className="result-buttons">

              {wrongQuestions.length > 0 && (
                <button
                  className="retest-button"
                  onClick={handleRetest}
                >
                  Retest Wrong Answers
                </button>
              )}

              <button
                className="new-quiz-button"
                onClick={handleNewQuiz}
              >
                Create New Quiz
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;