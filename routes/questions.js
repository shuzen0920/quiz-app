const express = require('express');
const path = require('path');
// 假設 utils.js 與 routes 資料夾同層級
const { readJsonFile, writeJsonFile } = require('../utils'); 
const router = express.Router();

// 使用 path.join 確保路徑在不同作業系統下都能正常運作
const questionsPath = path.join(__dirname, '../data/questions.json');

// 輔助函數：Fisher-Yates 洗牌演算法
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// 輔助函數：將題目本地化
const localizeQuestions = (questions, lang) => {
  return questions.map(q => {
    // 確保 question 和 options 物件存在
    if (!q.question || !q.options) {
      return { ...q, question: 'Invalid Question', options: [] };
    }
    
    // 檢查請求的語言是否存在，若不存在則提供一個 fallback
    const questionText = q.question[lang] || q.question['zh'] || 'Question not available';
    const optionsList = q.options[lang] || q.options['zh'] || [];
    
    return {
      id: q.id,
      question: questionText,
      options: optionsList,
      answerIndex: q.answerIndex,
      category: q.category
    };
  });
};


// GET / - 取得所有題目 (供管理頁面使用，回傳完整多語言物件)
router.get('/', (req, res) => {
  try {
    const questions = readJsonFile(questionsPath, []);
    res.json(questions);
  } catch (error) {
    console.error('Error reading questions file:', error);
    res.status(500).json({ error: '無法讀取題庫資料' });
  }
});

// GET /random - 隨機取得指定數量的題目 (供答題頁面使用，支援多國語言)
router.get('/random', (req, res) => {
  try {
    const count = parseInt(req.query.count, 10) || 10;
    const lang = req.query.lang || 'zh'; // 預設語言為中文
    const allQuestions = readJsonFile(questionsPath, []);

    const localized = localizeQuestions(allQuestions, lang);
    const shuffled = shuffleArray(localized);
    
    res.json(shuffled.slice(0, count));
  } catch (error) {
    console.error('Error getting random questions:', error);
    res.status(500).json({ error: '無法取得隨機題目' });
  }
});

// GET /category/:category - 取得指定分類的所有題目 (本地化)
router.get('/category/:category', (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    const lang = req.query.lang || 'zh';
    const questions = readJsonFile(questionsPath, []);
    const filtered = questions.filter(q => q.category && q.category.toLowerCase() === category);
    res.json(localizeQuestions(filtered, lang));
  } catch (error) {
    console.error(`Error getting questions for category ${req.params.category}:`, error);
    res.status(500).json({ error: '無法依分類取得題目' });
  }
});

// GET /category/:category/random - 隨機取得指定分類的題目 (本地化)
router.get('/category/:category/random', (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    const count = parseInt(req.query.count, 10) || 5;
    const lang = req.query.lang || 'zh';
    const questions = readJsonFile(questionsPath, []);
    const filtered = questions.filter(q => q.category && q.category.toLowerCase() === category);
    const localized = localizeQuestions(filtered, lang);
    const shuffled = shuffleArray(localized);
    res.json(shuffled.slice(0, count));
  } catch (error) {
    console.error(`Error getting random questions for category ${req.params.category}:`, error);
    res.status(500).json({ error: '無法依分類取得隨機題目' });
  }
});

// GET /:id - 取得單一題目 (供管理頁面使用，回傳完整多語言物件)
router.get('/:id', (req, res) => {
  try {
    const questions = readJsonFile(questionsPath, []);
    const id = parseInt(req.params.id, 10);
    const question = questions.find(q => q.id === id);
    if (!question) {
      return res.status(404).json({ error: '題目不存在' });
    }
    res.json(question);
  } catch (error) {
    console.error(`Error getting question ${req.params.id}:`, error);
    res.status(500).json({ error: '無法取得指定題目' });
  }
});

// POST / - 新增題目 (儲存為多語言結構)
router.post('/', (req, res) => {
  try {
    const questions = readJsonFile(questionsPath, []);
    const newQuestion = req.body;

    // 檢查基本欄位，現在 question 和 options 應為物件
    if (!newQuestion.question || typeof newQuestion.question !== 'object' || 
        !newQuestion.options || typeof newQuestion.options !== 'object' || 
        newQuestion.answerIndex == null) {
        return res.status(400).json({ error: '缺少必要的題目資訊或格式不符 (question, options, answerIndex)' });
    }

    const maxId = questions.reduce((max, q) => (q.id > max ? q.id : max), 0);
    newQuestion.id = maxId + 1;

    questions.push(newQuestion);
    writeJsonFile(questionsPath, questions);
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error adding new question:', error);
    res.status(500).json({ error: '新增題目失敗' });
  }
});

// PUT /:id - 更新題目
router.put('/:id', (req, res) => {
  try {
    const questions = readJsonFile(questionsPath, []);
    const id = parseInt(req.params.id, 10);
    const index = questions.findIndex(q => q.id === id);

    if (index === -1) {
      return res.status(404).json({ error: '題目不存在' });
    }

    const updatedQuestion = { id: id, ...questions[index], ...req.body };
    questions[index] = updatedQuestion;

    writeJsonFile(questionsPath, questions);
    res.json(updatedQuestion);
  } catch (error) {
    console.error(`Error updating question ${req.params.id}:`, error);
    res.status(500).json({ error: '更新題目失敗' });
  }
});

// DELETE /:id - 刪除題目
router.delete('/:id', (req, res) => {
  try {
    const questions = readJsonFile(questionsPath, []);
    const id = parseInt(req.params.id, 10);
    const initialLength = questions.length;
    const filtered = questions.filter(q => q.id !== id);

    if (filtered.length === initialLength) {
        return res.status(404).json({ error: '找不到要刪除的題目' });
    }

    writeJsonFile(questionsPath, filtered);
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting question ${req.params.id}:`, error);
    res.status(500).json({ error: '刪除題目失敗' });
  }
});

module.exports = router;
