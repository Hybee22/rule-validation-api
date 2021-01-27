// Check if rule field is a valid JSON
const isValidJSONString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// Check if data field is either an array, object or string
const isValidData = (data) => {
    if (typeof data === 'object' || typeof data === 'string') {
        return true
    } else {
        return false
    }
}

const getFieldNestingLevel = (obj) => {
    let depth = 0;
    if (obj.field && typeof obj.field === 'object') {
        obj.field.forEach((d) => {
            let tmpDepth = getDepth(d)
            if (tmpDepth > depth) {
                depth = tmpDepth
            }
        })
        return 1 + depth
    }
}

// Check match between rule object field and data passed
const checkRuleDataMatch = (res, payload) => {
    const { rule } = payload
    // let rules = Object.values(payload.rule);
    let data = Object.keys(payload.data)

    data.forEach(val => {
        console.log(val)
        if (!data.includes(rule.field)) {
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
const validateRule = (res, payload) => {
    const rule = payload.rule;
    let data = payload.data

    if (rule.condition === 'gte') {
        return data[rule.field] >= rule.condition_value ? true : false;
    }

    if (rule.condition === 'gt') {
        return data[rule.field] > rule.condition_value ? true : false;
    }

    if (rule.condition === 'eq') {
        return data[rule.field] === rule.condition_value ? true : false;
    }

    if (rule.condition === 'neq') {
        return data[rule.field] !== rule.condition_value ? true : false;
    }

    if (rule.condition === 'contains') {
        const tempArray = []    
        tempArray.push(data[rule.field])
        return tempArray.includes(rule.condition_value) ? true : false;
    }
}

// Check if rule field is valid
const isValidRule = (res, payload) => {
    const rule = payload.rule;

    const ruleString = JSON.stringify(rule);
    if (isValidJSONString(ruleString)) {
        // Check conditions
        // Check nesting depth level
        if (getFieldNestingLevel(rule) > 2) {
            return res.status(400).json({
                "message": `field nesting level has exceeded limit of 2.`,
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

        // Check if rule field is a valid object
        if (!isValidData(rule.field)) {
            return res.status(400).json({
                "message": `${[rule.field]} should be a|an object.`,
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

const validateJSON = (req, res, payload) => {
// Check if the rule and data fields are in the payload
    console.log('Validating JSON')
    if (!payload.rule) {
        return res.status(400).json({
            "message": `${[payload.rule]} is required.`,
            "status": "error",
            "data": null
        })
    }
    if (!payload.data) {
        return res.status(400).json({
            "message": `${[payload.data]} is required.`,
            "status": "error",
            "data": null
        })
    }
    // Valid Rule and Data Field
    if (isValidRule(res, payload) && isValidData(payload.data)) {
        // Check conditions against Rule and Return response
        const { rule, data } = payload
        if (validateRule(res, payload)) {
            return res.status(200).json(
                {
                    "message": "field missions successfully validated.",
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
                    "message": "field missions failed validation.",
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
                  }
            )
        }
    }
}

module.exports = {
    validateJSON
}