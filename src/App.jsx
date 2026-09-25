import { useState } from "react";
import { useRef } from "react";
import "./App.css";

function App() {
  const requestIdRef = useRef(0);
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
    const currentRequestId = ++requestIdRef.current;
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
      const response = await fetch("https://ai-studymate-k0cz.onrender.com/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          questionCount: Number(questionCount),
        }),
      });

      const data = await response.json();
      if (currentRequestId !== requestIdRef.current) {
  return;
}

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      setQuiz(data);
    } catch (error) {
      console.error("Quiz generation error:", error);
      setError(error.message || "Something went wrong.");
   } finally {
  if (currentRequestId === requestIdRef.current) {
    setLoading(false);
  }
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
      <h1>AI StudyMate</h1>

      <p>Turn any topic into an interactive quiz</p>

      {!quiz && (
        <>
          <textarea
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Enter a topic or paste your notes..."
          />

          <div>
            <label htmlFor="questionCount">
              Number of Questions:
            </label>

            <select
              id="questionCount"
              value={questionCount}
              onChange={(event) =>
                setQuestionCount(event.target.value)
              }
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </>
      )}

      {error && <p className="error">{error}</p>}

      {quiz && (
        <div className="quiz">
          <h2>{quiz.title}</h2>

          <div className="score">
            Score: {score} / {quiz.questions.length}
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
                <h3>
                  {index + 1}. {question.question}
                </h3>

                <div className="options">
                  {question.options.map(
                    (option, optionIndex) => {
                      let className = "option";

                      if (isAnswered) {
                        if (
                          optionIndex === question.correctAnswer
                        ) {
                          className =
                            "option correct";
                        } else if (
                          optionIndex === selectedAnswer
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
                          {option}
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
                        ? "Correct! ✅"
                        : "Wrong ❌"}
                    </strong>

                    <p>
                      Explanation:{" "}
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="result">
            <h2>
              Final Score: {score} /{" "}
              {quiz.questions.length}
            </h2>

            {wrongQuestions.length > 0 && (
              <button onClick={handleRetest}>
                Retest Wrong Answers
              </button>
            )}

            <button onClick={handleNewQuiz}>
              Create New Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;