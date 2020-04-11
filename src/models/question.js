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
  correct_answer: {
    type: String,
  },
  incorrect_answers: {
    type: [String],
  },
});

mongoose.model('Question', Question);
