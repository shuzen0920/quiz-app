const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const questionsRouter = require('./routes/questions');
const quizResultsRouter = require('./routes/quizResults');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/questions', questionsRouter);
app.use('/api/quiz-results', quizResultsRouter);

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
