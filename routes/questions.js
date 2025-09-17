const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// GET / - 取得所有題目 (供管理頁面使用，回傳完整多語言物件)
router.get('/', async (req, res) => {
  try {
    // .sort({ id: 1 }) 確保回傳的題目按 ID 排序
    const questions = await Question.find({}).sort({ id: 1 });
    res.json(questions);
  } catch (error) {
    console.error('讀取題庫資料時發生錯誤:', error);
    res.status(500).json({ error: '無法讀取題庫資料' });
  }
});

// GET /random - 隨機取得指定數量的題目 (供答題頁面使用)
router.get('/random', async (req, res) => {
  try {
    const count = parseInt(req.query.count, 10) || 10;
    const lang = req.query.lang || 'zh';

    // 使用 MongoDB Aggregation Pipeline 高效地隨機抽樣
    const randomQuestions = await Question.aggregate([{ $sample: { size: count } }]);

    // 將抽樣結果本地化為指定語言
    const localized = randomQuestions.map(q => ({
      id: q.id,
      question: q.question[lang] || q.question.zh,
      options: q.options[lang] || q.options.zh,
      answerIndex: q.answerIndex,
      category: q.category,
    }));

    res.json(localized);
  } catch (error) {
    console.error('取得隨機題目時發生錯誤:', error);
    res.status(500).json({ error: '無法取得隨機題目' });
  }
});

// GET /category/:category/random - 從指定分類隨機抽題
router.get('/category/:category/random', async (req, res) => {
  try {
    const category = req.params.category;
    const count = parseInt(req.query.count, 10) || 10;
    const lang = req.query.lang || 'zh';

    const randomQuestions = await Question.aggregate([
      { $match: { category: category } }, // 先篩選出符合分類的題目
      { $sample: { size: count } },      // 再從中隨機抽樣
    ]);

    const localized = randomQuestions.map(q => ({
      id: q.id,
      question: q.question[lang] || q.question.zh,
      options: q.options[lang] || q.options.zh,
      answerIndex: q.answerIndex,
      category: q.category,
    }));

    res.json(localized);
  } catch (error) {
    console.error(`依分類取得隨機題目時發生錯誤 (${req.params.category}):`, error);
    res.status(500).json({ error: '無法依分類取得隨機題目' });
  }
});

// GET /:id - 取得單一題目 (供管理頁面使用)
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findOne({ id: req.params.id });
    if (!question) {
      return res.status(404).json({ error: '題目不存在' });
    }
    res.json(question);
  } catch (error) {
    console.error(`取得題目 ${req.params.id} 時發生錯誤:`, error);
    res.status(500).json({ error: '無法取得指定題目' });
  }
});

// POST / - 新增題目
router.post('/', async (req, res) => {
  try {
    const newQuestionData = req.body;

    // 驗證... (此處省略)

    // 找到目前最大的 ID 並加 1，以生成新的自訂 ID
    // 注意：在高併發環境下，此方法可能產生衝突。更穩健的做法是使用專門的計數器 collection。
    const lastQuestion = await Question.findOne().sort({ id: -1 });
    const newId = lastQuestion ? lastQuestion.id + 1 : 1;

    const question = new Question({
      ...newQuestionData,
      id: newId,
    });

    await question.save();
    res.status(201).json(question);
  } catch (error) {
    console.error('新增題目時發生錯誤:', error);
    // 處理 'unique' 欄位重複的錯誤
    if (error.code === 11000) {
      return res.status(400).json({ error: '題目 ID 已存在，無法重複新增。' });
    }
    res.status(500).json({ error: '新增題目失敗' });
  }
});

// PUT /:id - 更新題目
router.put('/:id', async (req, res) => {
  try {
    const updatedQuestion = await Question.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true } // `new: true` 回傳更新後的文件
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: '題目不存在' });
    }

    res.json(updatedQuestion);
  } catch (error) {
    console.error(`更新題目 ${req.params.id} 時發生錯誤:`, error);
    res.status(500).json({ error: '更新題目失敗' });
  }
});

// DELETE /:id - 刪除題目
router.delete('/:id', async (req, res) => {
  try {
    const result = await Question.deleteOne({ id: req.params.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: '找不到要刪除的題目' });
    }

    res.status(204).send(); // 成功刪除，回傳 204 No Content
  } catch (error) {
    console.error(`刪除題目 ${req.params.id} 時發生錯誤:`, error);
    res.status(500).json({ error: '刪除題目失敗' });
  }
});

module.exports = router;