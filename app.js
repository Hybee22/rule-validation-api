const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Validator
const { validateJSON, validateNestedJSON } = require('./validator')


app.use(cors());

// ROUTES
// Home Route
app.get('/', (req, res) => {
return res.status(200).json(
    {
        "message": "My Rule-Validation API",
        "status": "success",
        "data": {
            "name": "Ibrahim Adekunle",
            "github": "@Hybee22",
            "email": "adefemi101@gmail.com",
            "mobile": "08131180177",
            "twitter": "@iam_hybee"
        }
    }
)
})

//   Rule Validation Route
app.post('/validate-rule', (req, res) => {
    const payload = req.body
    const { rule } = payload
    
    const fieldToArr = rule.field.split('')

    if (fieldToArr.includes('.')) {
        return validateNestedJSON(req, res, payload)
    }

    return validateJSON(req, res, payload) 
})

module.exports = app;