const express = require('express');
const path = require('path');
// 引入共用的檔案讀寫工具
const { readJsonFile, writeJsonFile } = require('../utils');
const router = express.Router();

// 定義答題紀錄檔案的路徑
const resultsPath = path.join(__dirname, '../data/quiz_results.json');

/**
 * 輔助函數：取得乾淨的 IPv4 位址
 * @param {string} ip - 原始 IP 位址
 * @returns {string} 清理後的 IPv4 位址
 */
const getCleanIPv4 = (ip) => {
  if (!ip) return ip;
  // 處理 IPv6 映射的 IPv4 位址，例如 '::ffff:192.168.1.1' -> '192.168.1.1'
  if (ip.substr(0, 7) === "::ffff:") {
    return ip.substr(7);
  }
  // 處理本地主機的 IPv6 表示
  if (ip === '::1') {
    return '127.0.0.1';
  }
  return ip;
};

/**
 * POST /
 * 儲存一筆新的答題結果
 */
router.post('/', (req, res) => {
  try {
    // 讀取現有的紀錄
    const results = readJsonFile(resultsPath, []);
    // 建立新的紀錄物件
    const newResult = {
      ...req.body,
      ip: getCleanIPv4(req.ip), // 儲存清理後的 IPv4 位址
      timestamp: new Date().toISOString() // 加上時間戳
    };
    results.push(newResult);
    // 將更新後的紀錄寫回檔案
    writeJsonFile(resultsPath, results);
    res.status(201).json({ message: '答題結果已儲存' });
  } catch (error) {
    console.error('儲存答題結果時發生錯誤:', error);
    res.status(500).json({ error: '儲存答題結果失敗' });
  }
});

/**
 * GET /
 * 取得所有答題結果
 */
router.get('/', (req, res) => {
  try {
    const results = readJsonFile(resultsPath, []);
    res.json(results);
  } catch (error)
 {
    console.error('讀取答題結果時發生錯誤:', error);
    res.status(500).json({ error: '讀取答題結果失敗' });
  }
});

/**
 * GET /status/ip
 * 根據請求的 IP 位址和測驗分類，檢查是否已完美通關
 */
router.get('/status/ip', (req, res) => {
  try {
    const userIp = getCleanIPv4(req.ip);
    const { category } = req.query; // 從查詢參數中獲取分類

    const results = readJsonFile(resultsPath, []);
    // 尋找第一筆符合 IP、分類且正確率為 100 的紀錄
    const perfectScoreRecord = results.find(r => {
      const ipMatch = r.ip === userIp;
      const scoreMatch = r.correctRate === 100;
      // 分類必須完全匹配 (包含兩者都未定義的情況)
      const categoryMatch = r.category === category;
      return ipMatch && scoreMatch && categoryMatch;
    });

    if (perfectScoreRecord) {
      // 如果找到紀錄，回傳不允許作答，並附上當時的語言和姓名
      res.json({
        canTakeQuiz: false,
        lang: perfectScoreRecord.lang || 'zh',
        userName: perfectScoreRecord.userName || '',
        message: 'This IP address has already achieved a perfect score for this category.'
      });
    } else {
      // 否則，允許作答
      res.json({ canTakeQuiz: true });
    }
  } catch (error) {
    console.error(`檢查 IP (${req.ip}) 狀態時發生錯誤:`, error);
    res.status(500).json({ error: '檢查使用者作答狀態失敗' });
  }
});

/**
 * GET /status/:userId
 * 根據使用者 ID 和測驗分類，檢查是否已完美通關
 */
router.get('/status/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { category } = req.query; // 從查詢參數中獲取分類

    if (!userId) {
      return res.status(400).json({ error: '需要提供使用者 ID' });
    }

    const results = readJsonFile(resultsPath, []);
    // 檢查是否存在符合使用者 ID、分類且正確率為 100 的紀錄
    const hasPerfectScore = results.some(r => {
        const userMatch = r.userId === userId;
        const scoreMatch = r.correctRate === 100;
        const categoryMatch = r.category === category;
        return userMatch && scoreMatch && categoryMatch;
    });

    if (hasPerfectScore) {
      res.json({
        canTakeQuiz: false,
        message: 'User has already achieved a perfect score for this category.'
      });
    } else {
      res.json({ canTakeQuiz: true });
    }
  } catch (error) {
    console.error(`檢查使用者 (${req.params.userId}) 狀態時發生錯誤:`, error);
    res.status(500).json({ error: '檢查使用者作答狀態失敗' });
  }
});

/**
 * DELETE /
 * 清空所有答題紀錄
 */
router.delete('/', (req, res) => {
  try {
    writeJsonFile(resultsPath, []);
    res.status(200).json({ message: '所有答題紀錄已成功刪除' });
  } catch (error) {
    console.error('清除答題紀錄時發生錯誤:', error);
    res.status(500).json({ error: '清除答題紀錄失敗' });
  }
});

/**
 * DELETE /user/:userId
 * 刪除特定使用者的所有答題紀錄
 */
router.delete('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const results = readJsonFile(resultsPath, []);
    const initialLength = results.length;
    const filteredResults = results.filter(r => r.userId !== userId);

    if (results.length === initialLength) {
      return res.status(404).json({ error: `找不到使用者 ${userId} 的答題紀錄` });
    }

    writeJsonFile(resultsPath, filteredResults);
    res.status(200).json({ message: `使用者 ${userId} 的所有答題紀錄已成功刪除` });
  } catch (error) {
    console.error(`刪除使用者 (${req.params.userId}) 紀錄時發生錯誤:`, error);
    res.status(500).json({ error: '依使用者刪除答題紀錄失敗' });
  }
});

/**
 * DELETE /:timestamp
 * 根據時間戳刪除單筆答題紀錄
 */
router.delete('/:timestamp', (req, res) => {
  try {
    const { timestamp } = req.params;
    const results = readJsonFile(resultsPath, []);
    const initialLength = results.length;
    const filteredResults = results.filter(r => r.timestamp !== timestamp);

    if (results.length === initialLength) {
      return res.status(404).json({ error: '找不到指定的答題紀錄' });
    }

    writeJsonFile(resultsPath, filteredResults);
    res.status(200).json({ message: '答題紀錄已成功刪除' });
  } catch (error) {
    console.error(`刪除答題紀錄 (${req.params.timestamp}) 時發生錯誤:`, error);
    res.status(500).json({ error: '刪除答題紀錄失敗' });
  }
});


module.exports = router;
