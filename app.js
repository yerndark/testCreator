const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = 3000;

// Connect to the SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/test.db', // Adjust this path based on your setup
});

// Define models
const Form = sequelize.define('Form', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  
  const Question = sequelize.define('Question', {
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    option1: DataTypes.STRING,
    option2: DataTypes.STRING,
    option3: DataTypes.STRING,
    correctOption: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'questions', // Specify the correct table name
  });
  
  const TestResult = sequelize.define('TestResult', {
    username: DataTypes.STRING,
    correctCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
  });

  Form.hasMany(Question, { foreignKey: 'formId' });
  Question.belongsTo(Form, { foreignKey: 'formId' });
  Form.hasMany(TestResult, { foreignKey: 'formId' });
  TestResult.belongsTo(Form, { foreignKey: 'formId' });

sequelize.sync().then(() => {
  console.log('Database synchronized successfully.');

  app.set('view engine', '.hbs');

  app.use(express.static('public'));

  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', async (req, res) => {  // all form
    const forms = await Form.findAll();
    res.render('main.hbs', {
        forms
    });
  });

  app.get('/form/create', (req, res) => {  // all form
    res.render('form-create.hbs');
  });

  app.post('/form/create', async (req, res) => {
    const formName = req.body.formName;

    try {
      const createdForm = await Form.create({ name: formName });
      const formId = createdForm.id;

      res.redirect('/form/' + formId + '/question');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/form/:formId/question', async (req, res) => {  // all form
    const formId = req.params.formId;
    const questions = await Question.findAll({ where: { formId } });
    res.render('form-questions.hbs', {
        formId,
        questions
    });
  });

  app.get('/form/:formId/questions', async (req, res) => {  // all form
    const formId = req.params.formId;
    const questions = await Question.findAll({ where: { formId } });
    res.json(questions);
  });

  app.post('/form/:formId/questions', async (req, res) => {
    const formId = req.params.formId;
    const { question, option1, option2, option3, correctOption } = req.body;

    try {
      const createdQuestion = await Question.create({
        question,
        option1,
        option2,
        option3,
        correctOption,
        formId,
      });

      const questions = await Question.findAll({ where: { formId } });
      res.redirect('/form/' + formId + '/question');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/test/:formId', async (req, res) => {  // all form
    const formId = req.params.formId;

    try {
      const questions = await Question.findAll({ where: { formId } });
      console.log(questions);
      res.render('test.hbs', { formId, questions });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
    }
  });

  // Handle POST requests for submitting test results
  app.post('/test/:formId', async (req, res) => {
    const formId = req.params.formId;
    const userAnswers = req.body;
    const username = userAnswers['username']

    try {
      const correctAnswers = await Question.findAll({
        attributes: ['id', 'correctOption'],
        where: { formId },
      });

      let correctCount = 0;
      
      correctAnswers.forEach((correctAnswer) => {
        const questionId = correctAnswer.id;
        const userAnswer = parseInt(userAnswers['q' + questionId]);

        if (userAnswer === correctAnswer.correctOption) {
          correctCount++;
        }
      });
      
      const questionsCount = Object.keys(userAnswers).length - 1;
      const createdTestResult = await TestResult.create({ formId, correctCount, username, questionsCount });
      const testResults = await TestResult.findAll({ where: { formId } });
      
      res.render('result.hbs', { formId, correctCount, questionsCount, username });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/test/:formId/results', async (req, res) => {  // all form
    const formId = req.params.formId;
    const testResults = await TestResult.findAll({ where: { formId } });
    
    console.log(testResults);
    res.render('test-results.hbs', {
        formId,
        testResults
    });
  });

  app.get('/result/:resultId', (req, res) => {  // all form
    res.render('test-result.hbs');
  });




  app.delete('/form/:formId', async (req, res) => {  // all form

    const formId = req.params.formId;
    const form = await Form.findByPk(formId);

    if (!form) {
      // If the form does not exist, respond with a 404 status
      return res.status(404).send('Form not found');
    }

    // Delete the form
    await form.destroy();
    res.status(200).send('Form deleted successfully');
  });

  app.delete('/questions/:questionId', async (req, res) => {  // all form

    const questionId = req.params.questionId;
    const question = await Question.findByPk(questionId);

    if (!question) {
      return res.status(404).send('Question not found');
    }

    await question.destroy();
    res.status(200).send('Question deleted successfully');
  });
  

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
