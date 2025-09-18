const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 載入環境變數
dotenv.config();

// 載入所有 Mongoose 模型
const Question = require('./models/Question');
const QuizResult = require('./models/QuizResult');

// 載入 JSON 檔案讀取工具
const { readJsonFile } = require('./utils');

// 連線到 MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 定義舊資料檔案的路徑
const questionsPath = path.join(__dirname, 'data', 'questions.json');
const quizResultsPath = path.join(__dirname, 'data', 'quiz_results.json');

// 匯入資料到資料庫的函數
const importData = async () => {
  let exitCode = 0;
  try {
    // 讀取所有 JSON 檔案
    const questions = readJsonFile(questionsPath, []);
    const quizResults = readJsonFile(quizResultsPath, []);

    // 為了避免重複匯入，我們先清空相關的 collection
    console.log('正在清空舊資料...');
    await Question.deleteMany();
    await QuizResult.deleteMany();

    // 使用 insertMany 進行高效的批次匯入
    console.log('正在匯入新資料...');
    await Question.insertMany(questions);
    await QuizResult.insertMany(quizResults);

    console.log('✅ 資料匯入成功！');
  } catch (error) {
    console.error(`❌ 匯入錯誤: ${error}`);
    exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('資料庫連線已關閉。');
    process.exit(exitCode);
  }
};

// 從資料庫刪除所有資料的函數
const deleteData = async () => {
  let exitCode = 0;
  try {
    await Question.deleteMany();
    await QuizResult.deleteMany();
    console.log('✅ 資料已成功刪除！');
  } catch (error) {
    console.error(`❌ 刪除錯誤: ${error}`);
    exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('資料庫連線已關閉。');
    process.exit(exitCode);
  }
};

// 根據指令行參數決定執行哪個函數
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('請使用 -i 參數匯入資料，或使用 -d 參數刪除資料。');
  process.exit();
}