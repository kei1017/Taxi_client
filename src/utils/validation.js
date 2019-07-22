export const validation = {
    input: {
        presence: {
            message: 'This field is required'
        },        
    },
    email: {
        presence: {
            message: 'This field is required'
        },
        format: {
            pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            message: "Please enter a valid email address"
        }
    },
    password: {
        presence: {
            message: "This field is required"
        },
        // length: {
        //     minimum: {
        //         val: 5,
        //         message: "Your password must be at least 5 characters"
        //     }
        // }
    },
    number: {
        presence: {
            message: 'This field is required'
        },
        format: {
            pattern:/^\d+$/,
            message: "Please enter a valid number"
        }
    }
}

export function validate(nameField, value) {
    let result = null;
    if( validation.hasOwnProperty(nameField) ) {
        console.log("Validation")
        let v = validation[nameField];        
        if(value == '' || value == null || value == undefined) {
            console.log("Validation Null")            
            result = v['presence']['message']
        }
        else if (v.hasOwnProperty('format') && !v['format']['pattern'].test(value)) {            
            console.log("Validation format")            
            result = v['format']['message']
        }
        else if (v.hasOwnProperty('length')) {
            console.log("Validation length")
            let l = v['length'];
            if (l.hasOwnProperty('minimum') && value.length < l['minimum']['val']) {                
                result = v['length']['minimum']['message']
            }
            else if (l.hasOwnProperty('maximum') && value.length > l['maximum']['val']) {                
                result = v['length']['maximum']['message']
            }
        }
        else {
            result = null
        }
    }
    else {
        result = null
    }

    return result
}