


import React, { useState } from 'react';
import './App.css';

const Card = ({ flashcard }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className="flashcard-container flex-grow cursor-pointer"
      onClick={handleFlip}
    >
      <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}>
        <div className="flashcard-face flashcard-front">
          <p>{flashcard.front}</p>
        </div>
        <div className="flashcard-face flashcard-back">
          <p>{flashcard.back}</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [notes, setNotes] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setFlashcards([]);
    try {
      const response = await fetch('http://127.0.0.1:5000/generate_flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flashcards. Please check the backend.');
      }

      const data = await response.json();
      setFlashcards(data.flashcards);
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Flashify</h1>
        <p>AI-powered flashcards from your notes</p>
      </header>
      <main>
        <textarea
          className="notes-input"
          placeholder="Paste your notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          className="generate-button"
          onClick={handleGenerate}
          disabled={isLoading || notes.trim() === ''}
        >
          {isLoading ? 'Generating...' : 'Generate Flashcards'}
        </button>

        {error && <p className="error-message">Error: {error}</p>}

        {flashcards.length > 0 && (
          <div className="flashcards-container">
            <h2>Your Flashcards</h2>
            <div className="flashcards-grid">
              {flashcards.map((card, index) => (
                <Card key={index} flashcard={card} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
