const express = require('express');
const path = require('path'); // 引入 path 模組
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 載入 .env 檔案中的環境變數
dotenv.config();

// 連線到 MongoDB
connectDB();

// 引入所有路由
const questionsRouter = require('./routes/questions');
const quizResultsRouter = require('./routes/quizResults');

const app = express();

// --- 中介軟體 (Middleware) ---

// 啟用 CORS，允許跨來源請求
app.use(cors());

// 使用 Express 內建的 body-parser 來解析 JSON 格式的請求主體
// 這取代了舊的 `bodyParser.json()`
app.use(express.json());


// --- API 路由 ---
// 將對應的路由模組掛載到指定的路徑下
app.use('/api/questions', questionsRouter);
app.use('/api/quiz-results', quizResultsRouter);


// --- 靜態檔案服務 ---
// 將 'public' 資料夾設為靜態資源的根目錄，用於提供 HTML, CSS, 前端 JS 等檔案
app.use(express.static(path.join(__dirname, 'public')));


// --- 伺服器啟動 ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器正在 ${PORT} 埠上運行`);
});
