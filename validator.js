// Check if rule field is a valid JSON
const isValidJSONString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// Return Condition Check
const conditionCheck = (data, payload) => {
    const { rule, data: dataArr } = payload
    if (rule.condition === 'gte') {
        return data >= rule.condition_value ? true : false;
    }

    if (rule.condition === 'gt') {
        return data > rule.condition_value ? true : false;
    }

    if (rule.condition === 'eq') {
        return data === rule.condition_value ? true : false;
    }

    if (rule.condition === 'neq') {
        return data !== rule.condition_value ? true : false;
    }

    if (rule.condition === 'contains') {
        const tempArray = []    
        tempArray.push(...dataArr)
        return tempArray.includes(rule.condition_value) ? true : false;
    }
}

// Check if data field is either an array, object or string
const isValidData = (data) => {
    if (typeof data === 'object' || typeof data === 'string') {
        return true
    } else {
        return false
    }
}

const charCount = (letter, str) => 
{
 let count = 0;
 for (let position = 0; position < str.length; position++) {
    if (str.charAt(position) == letter) count += 1
}
  return count;
}

// Check match between rule object field and data passed
const checkRuleDataMatch = (res, payload) => {
    const { rule: { field }, rule, data } = payload
    let dataArr;

    if (Array.isArray(data)) {
        dataArr = data
        dataArr.forEach(val => { 
            if (!dataArr.includes(rule.field)) {
                return res.status(400).json({
                    "message": `field ${rule.field} is missing from data.`,
                    "status": "error",
                    "data": null
                })
            }
        })
        return true
    }

    dataArr = Object.keys(payload.data)
    
    const fieldToArr = field.split('')

    if (fieldToArr.includes('.')) {
        // get word before and after fullstop
        const stopIndex = fieldToArr.indexOf('.')
        const wordBeforeStop = fieldToArr.slice(0, stopIndex).join('')
        // const wordAfterStop = fieldToArr.slice(stopIndex + 1).join('')

        // Check if data contains nested field
        if (data[wordBeforeStop]) {

            dataArr.forEach(val => {
                if (!dataArr.includes(wordBeforeStop)) {
                    return res.status(400).json({
                        "message": `field ${wordBeforeStop} is missing from data.`,
                        "status": "error",
                        "data": null
                    })
                }
            })
        }
        return true
    }

    dataArr.forEach(val => { 
        if (!dataArr.includes(rule.field)) {
            return res.status(400).json({
                "message": `field ${rule.field} is missing from data.`,
                "status": "error",
                "data": null
            })
        }
    })
    
    return true
}

// Validate Data with Rule
// ["data.field"] ["rule.condition"] ["rule.condition_value"]
// ['eq', 'neq', 'gt', 'gte', 'contains']
const validateRuleConditions = (payload) => {
    const rule = payload.rule;
    let data = payload.data

    const fieldToArr = rule.field.split('')

    if (fieldToArr.includes('.')) {
        // get word before and after fullstop
        const stopIndex = fieldToArr.indexOf('.')
        const wordBeforeStop = fieldToArr.slice(0, stopIndex).join('')
        const wordAfterStop = fieldToArr.slice(stopIndex + 1).join('')

        const dataToCheck = data[wordBeforeStop][wordAfterStop]

        return conditionCheck(dataToCheck, payload)
    }

    const dataToCheck = data[rule.field]

    return conditionCheck(dataToCheck, payload)
    
}

// Check if rule field is valid
const isValidRule = (res, payload) => {
    const { rule, data } = payload;

    const ruleString = JSON.stringify(rule);
    if (isValidJSONString(ruleString)) {
        // Check conditions
        if (!payload.rule) {
            return res.status(400).json({
                "message": `rule is required.`,
                "status": "error",
                "data": null
            })
        }
        if (!payload.data) {
            return res.status(400).json({
                "message": `data is required.`,
                "status": "error",
                "data": null
            })
        }
        // Check if rule and data fields are objects
        if (!isValidData(rule)) {
            return res.status(400).json({
                "message": `rule should be a|an object.`,
                "status": "error",
                "data": null
            })
        }
        if (!isValidData(data)) {
            return res.status(400).json({
                "message": `field should be a|an object.`,
                "status": "error",
                "data": null
            })
        }

        // Checking condition values
        const conditions = ['eq', 'neq', 'gt', 'gte', 'contains']
        if (!conditions.includes(rule.condition)) {
            return res.status(400).json({
                "message": `${rule.condition} not a valid condition.`,
                "status": "error",
                "data": null
            }) 
        }

        // G. Check is Data and Specified Field Match
        checkRuleDataMatch(res, payload) 
        return true
    
    } else {
        return res.status(400).json({
            "message": "Invalid JSON payload passed.",
            "status": "error",
            "data": null
        })
    }
}

// Validate Rule and Data Field
const validateJSON = (req, res, payload) => {

    // Check conditions against Rule and Return response
    const { rule, data } = payload
    
    if (isValidRule(res, payload) && validateRuleConditions(payload)) {
        return res.status(200).json(
            {
                "message": `field ${rule.field} successfully validated.`,
                "status": "success",
                "data": {
                    "validation": {
                    "error": false,
                    "field": rule.field,
                    "field_value": data[rule.field],
                    "condition": rule.condition,
                    "condition_value": rule.condition_value
                    }
                }
            }
        )
    } else {
        return res.status(400).json(
            {
                "message": `field ${rule.field} failed validation.`,
                "status": "error",
                "data": {
                    "validation": {
                    "error": true,
                    "field": rule.field,
                    "field_value": data[rule.field],
                    "condition": rule.condition,
                    "condition_value": rule.condition_value
                    }
                }
            })
    }
    
}
const validateNestedJSON = (req, res, payload) => {
    // Check conditions against Rule and Return response
    const { rule, data } = payload

    const nestingDepth = charCount('.', rule.field)

    // Check nesting depth level
    if (nestingDepth > 1) {
        return res.status(400).json({
            "message": `field nesting level has exceeded limit of 2.`,
            "status": "error",
            "data": null
        })
    }
    
    const fieldToArr = rule.field.split('')
    const stopIndex = fieldToArr.indexOf('.')
    const wordBeforeStop = fieldToArr.slice(0, stopIndex).join('')
    const wordAfterStop = fieldToArr.slice(stopIndex + 1).join('')

    if (isValidRule(res, payload) && validateRuleConditions(payload)) {

        return res.status(200).json(
            {
                "message": `field ${rule.field} successfully validated.`,
                "status": "success",
                "data": {
                    "validation": {
                    "error": false,
                    "field": rule.field,
                    "field_value": data[wordBeforeStop][wordAfterStop],
                    "condition": rule.condition,
                    "condition_value": rule.condition_value
                    }
                }
            }
        )
    } else {
         res.status(400).json(
            {
                "message": `field ${rule.field} failed validation.`,
                "status": "error",
                "data": {
                    "validation": {
                    "error": true,
                    "field": rule.field,
                    "field_value": data[wordBeforeStop][wordAfterStop],
                    "condition": rule.condition,
                    "condition_value": rule.condition_value
                    }
                }
            })
    }
}

module.exports = {
    validateJSON,
    validateNestedJSON
}