const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mongoose 6+ 不再需要這些選項，但加上也無妨
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB 已連線: ${conn.connection.host}`);
  } catch (error) {
    console.error(`資料庫連線錯誤: ${error.message}`);
    process.exit(1); // 讓程式在連線失敗時直接退出
  }
};

module.exports = connectDB;