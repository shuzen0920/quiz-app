const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true, // 為 userId 加上索引
  },
  userName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  correctRate: {
    type: Number,
    required: true,
  },
  answers: {
    type: [Number],
  },
  lang: {
    type: String,
  },
  category: {
    type: String,
    index: true, // 為 category 加上索引
  },
  ip: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('QuizResult', QuizResultSchema);