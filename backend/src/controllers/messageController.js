const axios = require('axios');
const Message = require('../models/Message');
const dotenv = require('dotenv');

dotenv.config();

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id;

    // Save user message
    const userMessage = new Message({ userId, text });
    await userMessage.save();

    // Generate mentor response (Gemini)
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text }] }],
        systemInstruction: {
          parts: [{ text: 'You are a mentor for Mentormate, providing concise, helpful advice.' }],
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (!geminiRes.data.candidates) {
      return res.status(500).json({ error: 'Gemini API failed', details: geminiRes.data });
    }
    const mentorText = geminiRes.data.candidates[0].content.parts[0].text;

    // Save mentor response
    const mentorMessage = new Message({ userId, text: mentorText, isMentor: true });
    await mentorMessage.save();

    // Generate mentor voice response (OpenAI TTS)
    const ttsRes = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        voice: 'nova',
        input: mentorText,
        response_format: 'mp3',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        responseType: 'arraybuffer',
      }
    );
    if (!ttsRes.data) {
      return res.status(500).json({ error: 'TTS API failed', details: ttsRes.statusText });
    }
    const audioBuffer = ttsRes.data;

    res.json({
      userMessage,
      mentorMessage,
      audio: Buffer.from(audioBuffer).toString('base64'),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({ userId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};