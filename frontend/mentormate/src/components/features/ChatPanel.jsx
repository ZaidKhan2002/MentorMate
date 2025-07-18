import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChatPanel = ({ isUser, title, messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };
      recognitionRef.current.onerror = (event) => {
        setError('Speech recognition error: ' + event.error);
        setIsRecording(false);
      };
    } else {
      setError('Speech recognition not supported');
    }
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const tempMessage = { _id: Date.now(), text: input, isMentor: false, createdAt: new Date() };
    setMessages((prev) => [...prev, tempMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in again');
        return navigate('/');
      }

      const response = await axios.post(
        'http://localhost:5000/api/messages',
        { text: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { userMessage, mentorMessage, audio } = response.data;

      setMessages((prev) => [
        ...prev.filter((msg) => msg._id !== tempMessage._id),
        { ...userMessage, isMentor: false },
        { ...mentorMessage, isMentor: true, audio: `data:audio/mpeg;base64,${audio}` },
      ]);
      setIsLoading(false);

      const audioElement = new Audio(`data:audio/mpeg;base64,${audio}`);
      audioElement.play().catch(() => setError('Failed to play audio'));
    } catch (err) {
      setError(err.response?.status === 401 ? 'Invalid session, please log in' : 'Failed to send message');
      setIsLoading(false);
      if (err.response?.status === 401) navigate('/');
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl">
      <h2 className="text-lg font-semibold text-gray-700 px-6 pt-4">{title}</h2>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages
            .filter((msg) => msg.isMentor !== isUser)
            .map((msg) => (
              <div
                key={msg._id}
                className={`p-4 rounded-xl max-w-full transition-all duration-300 animate-slide-in ${
                  (!isUser && msg.isMentor)
                    ? 'bg-blue-100 text-left ml-4 border-l-4 border-blue-600'
                    : 'bg-green-100 text-right mr-4 border-r-4 border-green-600'
                }`}
              >
                <p className="text-gray-800 text-base">{msg.text}</p>
                <span className="text-md text-gray-500 mt-2 block">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
                {msg.isMentor && msg.audio && (
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => new Audio(msg.audio).play()}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                      title="Play Audio"
                    >
                      ▶️
                    </button>
                    <audio controls autoPlay src={msg.audio} className="w-full h-9 rounded-md" />
                  </div>
                )}
              </div>
            ))}

      {isLoading && !isUser && (
          <div className="p-4 rounded-xl max-w-md bg-blue-100 ml-4 border-l-4 border-blue-600 animate-pulse">
            <div className="flex space-x-3">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && <p className="text-red-500 text-sm text-center py-3">{error}</p>}

      {isUser && (
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type or speak your message..."
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm"
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-3 rounded-lg ${
                isRecording ? 'bg-red-600' : 'bg-blue-600'
              } text-white hover:bg-opacity-90 transition-colors shadow-sm`}
            >
              {isRecording ? 'Stop' : '🎤'}
            </button>
            <button
              type="submit"
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
