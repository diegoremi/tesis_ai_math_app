import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { submitSurvey } from '../services/api';
import './Survey.css';

const Survey = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState([
    { id: 1, text: 'The platform is easy to use.', answer: 3 },
    { id: 2, text: 'I feel motivated to learn using this platform.', answer: 3 },
    { id: 3, text: 'The platform helps me achieve my learning goals.', answer: 3 },
    { id: 4, text: 'I feel autonomous in my learning process.', answer: 3 },
    { id: 5, text: 'I would recommend this platform to others.', answer: 3 },
  ]);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
    // In a real app, you would fetch questions from the backend here
  }, [isAuthenticated, navigate]);

  const handleAnswerChange = (questionId, value) => {
    setQuestions(questions.map(q => q.id === questionId ? { ...q, answer: value } : q));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    const surveyData = {
      perceived_utility: questions[0].answer,
      ease_of_use: questions[1].answer,
      motivation: questions[2].answer,
      autonomy: questions[3].answer,
      comments: comments,
    };

    try {
      await submitSurvey(surveyData);
      setMessage('Survey submitted successfully!');
    } catch (error) {
      console.error('Error submitting survey:', error);
      setMessage('Failed to submit survey.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="survey-container">
      <h2>User Survey</h2>
      <form onSubmit={handleSubmit} className="survey-form">
        {questions.map(q => (
          <div key={q.id} className="survey-question">
            <p>{q.text}</p>
            <div className="likert-scale">
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value}>
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={value}
                    checked={q.answer === value}
                    onChange={() => handleAnswerChange(q.id, value)}
                    required
                  />
                  {value}
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="survey-comments">
          <label htmlFor="comments">Additional Comments:</label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows="4"
          ></textarea>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Survey'}
        </button>
        {message && <p className="survey-message">{message}</p>}
      </form>
    </div>
  );
};

export default Survey;
