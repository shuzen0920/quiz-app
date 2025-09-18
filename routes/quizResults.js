const express = require('express');
const router = express.Router();
const QuizResult = require('../models/QuizResult');
// 從共用 utils 模組引入輔助函數
const { getCleanIPv4 } = require('../utils');

// POST / - 儲存一筆新的答題結果
router.post('/', async (req, res) => {
  try {
    const newResultData = {
      ...req.body,
      ip: getCleanIPv4(req.ip),
    };
    const newResult = await QuizResult.create(newResultData);
    res.status(201).json({ message: '答題結果已儲存', data: newResult });
  } catch (error) {
    console.error('儲存答題結果時發生錯誤:', error);
    res.status(500).json({ error: '儲存答題結果失敗' });
  }
});

// GET / - 取得所有答題結果
router.get('/', async (req, res) => {
  try {
    const results = await QuizResult.find({}).sort({ timestamp: -1 });
    res.json(results);
  } catch (error) {
    console.error('讀取答題結果時發生錯誤:', error);
    res.status(500).json({ error: '讀取答題結果失敗' });
  }
});

// GET /status/ip - 根據 IP 和分類檢查是否已完美通關
router.get('/status/ip', async (req, res) => {
  try {
    const userIp = getCleanIPv4(req.ip);
    const { category } = req.query;

    const perfectScoreRecord = await QuizResult.findOne({
      ip: userIp,
      category: category,
      correctRate: 100,
    });

    if (perfectScoreRecord) {
      res.json({
        canTakeQuiz: false,
        lang: perfectScoreRecord.lang || 'zh',
        userName: perfectScoreRecord.userName || '',
      });
    } else {
      res.json({ canTakeQuiz: true });
    }
  } catch (error) {
    console.error(`檢查 IP (${req.ip}) 狀態時發生錯誤:`, error);
    res.status(500).json({ error: '檢查使用者作答狀態失敗' });
  }
});

// GET /status/:userId - 根據使用者 ID 和分類檢查是否已完美通關
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category } = req.query;

    const perfectScoreRecord = await QuizResult.findOne({
      userId: userId,
      category: category,
      correctRate: 100,
    });

    if (perfectScoreRecord) {
      res.json({ canTakeQuiz: false });
    } else {
      res.json({ canTakeQuiz: true });
    }
  } catch (error) {
    console.error(`檢查使用者 (${req.params.userId}) 狀態時發生錯誤:`, error);
    res.status(500).json({ error: '檢查使用者作答狀態失敗' });
  }
});

// DELETE / - 清空所有答題紀錄
router.delete('/', async (req, res) => {
  try {
    await QuizResult.deleteMany({});
    res.status(200).json({ message: '所有答題紀錄已成功刪除' });
  } catch (error) {
    console.error('清除答題紀錄時發生錯誤:', error);
    res.status(500).json({ error: '清除答題紀錄失敗' });
  }
});

// DELETE /user/:userId - 刪除特定使用者的所有答題紀錄
router.delete('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await QuizResult.deleteMany({ userId: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: `找不到使用者 ${userId} 的答題紀錄` });
    }

    res.status(200).json({ message: `使用者 ${userId} 的所有答題紀錄已成功刪除` });
  } catch (error) {
    console.error(`刪除使用者 (${req.params.userId}) 紀錄時發生錯誤:`, error);
    res.status(500).json({ error: '依使用者刪除答題紀錄失敗' });
  }
});

// DELETE /:timestamp - 根據時間戳刪除單筆答題紀錄
router.delete('/:timestamp', async (req, res) => {
  try {
    const { timestamp } = req.params;
    const result = await QuizResult.deleteOne({ timestamp: timestamp });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: '找不到指定的答題紀錄' });
    }

    res.status(200).json({ message: '答題紀錄已成功刪除' });
  } catch (error) {
    console.error(`刪除答題紀錄 (${req.params.timestamp}) 時發生錯誤:`, error);
    res.status(500).json({ error: '刪除答題紀錄失敗' });
  }
});

module.exports = router;