const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  // 我們保留這個自訂的數字 ID，以便與前端的編輯/刪除功能保持相容
  id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  question: {
    zh: { type: String, required: true },
    en: { type: String, required: true },
  },
  options: {
    zh: { type: [String], required: true },
    en: { type: [String], required: true },
  },
  answerIndex: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true, // 為分類加上索引，以加速查詢
  },
});

module.exports = mongoose.model('Question', QuestionSchema);