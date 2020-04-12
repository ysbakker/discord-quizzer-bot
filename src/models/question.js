const mongoose = require('mongoose');

const Question = new mongoose.Schema({
  type: {
    type: String,
  },
  difficulty: {
    type: String,
  },
  question: {
    type: String,
  },
  correctAnswer: {
    type: String,
  },
  incorrectAnswers: {
    type: [String],
  },
});

mongoose.model('Question', Question);
