import React, { useState } from 'react';

function EnglishToUrduTranslator() {
  const [englishText, setEnglishText] = useState('');
  const [urduText, setUrduText] = useState('');

  const handleTranslate = async () => {
    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        body: JSON.stringify({
          q: englishText,
          source: 'en',
          target: 'ur',
          format: 'text'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      setUrduText(data.translatedText);
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h2>English to Urdu Translator</h2>
      <textarea
        rows="4"
        cols="50"
        value={englishText}
        onChange={(e) => setEnglishText(e.target.value)}
        placeholder="Enter English text here"
      />
      <br />
      <button onClick={handleTranslate}>Translate</button>
      <h3>Urdu Translation:</h3>
      <div style={{ border: '1px solid #ccc', padding: '10px' }}>{urduText}</div>
    </div>
  );
}

export default EnglishToUrduTranslator;
