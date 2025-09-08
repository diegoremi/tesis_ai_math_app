import React, { useState, useEffect } from 'react';
import { getExercise, submitAnswer } from '../services/api';
import './Exercises.css';

const Exercises = () => {
  const [exercise, setExercise] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExercise();
  }, []);

  const fetchExercise = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setUserAnswer('');
    try {
      const response = await getExercise();
      setExercise(response.data);
    } catch (err) {
      setError('Failed to fetch exercise');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await submitAnswer({ exerciseId: exercise.id, userAnswer });
      if (response.data.correct) {
        setResult('Correct!');
      } else {
        setResult('Incorrect. Try again!');
      }
    } catch (err) {
      setError('Failed to submit answer');
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading exercise...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="exercises-container">
      <h2>Adaptive Exercises</h2>
      <div className="exercise-card">
        {exercise ? (
          <form onSubmit={handleSubmit}>
            <p>{exercise.question}</p>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              required
            />
            <button type="submit">Submit</button>
          </form>
        ) : (
          <p>No exercise loaded.</p>
        )}
        {result && <p>{result}</p>}
        <button onClick={fetchExercise}>Next Exercise</button>
      </div>
    </div>
  );
};

export default Exercises;
