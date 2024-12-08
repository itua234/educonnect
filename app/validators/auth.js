const { sequelize, models: { User } } = require('@models');
const {Op} = require('sequelize');
const {QueryTypes} = require('sequelize');
const {returnValidationError} = require("@util/helper");

const niv = require('node-input-validator');
niv.extend('hasSpecialCharacter', ({value}) => {
    if(!value.match(/[^a-zA-Z0-9]/)){
        //Return an error if the value does not contain a special character
        return false;
    }
    return true;
})
niv.extend('containsNumber', ({value}) => {
    if(!value.match(/\d/)){
        //Return an error if the value does not contain a special character
        return false;
    }
    return true;
})
niv.extend('isSingleWord', ({value}) => {
    if(value.includes(" ")){
        //Return an error if the value does not contain a special character
        return false;
    }
    return true;
})
niv.extend('unique', async ({value, args}) => {
    const field = args[1] || attr;
    let emailExist;
    if(args[2]){
        emailExist = await sequelize.query(`SELECT * FROM ${args[0]} WHERE ${field}=? AND id != ? LIMIT 1`,{
            replacements: [value, args[2]],
            type: QueryTypes.SELECT
        })
    }else{
        emailExist = await sequelize.query(`SELECT * FROM ${args[0]} WHERE ${field}=? LIMIT 1`,{
            replacements: [value],
            type: QueryTypes.SELECT
        })
    }
    
    if(emailExist.length !== 0){
        return false;
    }
    return true;
})
niv.extend('exists', async ({attr, value, args}) => {
    const field = args[1] || attr;
    let emailExist = await sequelize.query(`SELECT * FROM ${args[0]} WHERE ${field}=? LIMIT 1`,{
        replacements: [value],
        type: QueryTypes.SELECT
    })
    if(emailExist.length === 0){
        return false;
    }
    return true;
})
niv.extend('confirmed', ({attr, value}, validator) => {
    const possibleFields = [
        `${attr}_confirmation`,
        `confirm_${attr}`,
        `confirmation_${attr}`
    ];
    const secondValue = possibleFields
        .map(field => validator.inputs[field])
        .find(value => value !== undefined);
    if(value !== secondValue){
        return false;
    }
    return true;
})
niv.extend('phoneWithCountryCode', ({ value }) => {
    const phoneWithCountryCodeRegex = /^\+[1-9]{1}[0-9]{1,14}$/; // Adjust regex based on your requirements
    return phoneWithCountryCodeRegex.test(value);
});
niv.extendMessages({
    hasSpecialCharacter: 'The :attribute field must have a special character',
    containsNumber: 'The :attribute field must contain a number',
    isSingleWord: 'The :attribute field must be a single word',
    exists: 'The selected :attribute is invalid.',
    phoneWithCountryCode: 'The phone number must include a valid country code and be in the correct format.'
});

//export the schemas
module.exports = {
    register: async(req, res, next) => {
        const v = new niv.Validator(req.body, {
            email: 'required|string|email|unique:users,email',
            name: 'required|string',
            password: 'required|string|minLength:8|hasSpecialCharacter|containsNumber|confirmed',
            confirm_password: 'required'
        });

        let matched = await v.check();
        if(!matched){
            let errors = v.errors;
            returnValidationError(errors, res, "user onboarding failed");
        }else{
            if(!req.value){
                req.value = {}
            }
            req.body = v.inputs;
            next();
        }
    },

    login: async(req, res, next) => {
        const v = new niv.Validator(req.body, {
            email: 'required|email',
            password: 'required|string',
        });

        let matched = await v.check();
        if(!matched){
            let errors = v.errors;
            returnValidationError(errors, res, "Login failed");
        }else{
            if(!req.value){
                req.value = {}
            }
            req.body = v.inputs;
            next();
        }
    },

    google_login: async(req, res, next) => {
        const v = new niv.Validator(req.body, {
            code: 'required|string'
        });

        let matched = await v.check();
        if(!matched){
            let errors = v.errors;
            returnValidationError(errors, res, "Google authentication failed");
        }else{
            if(!req.value){
                req.value = {}
            }
            req.body = v.inputs;
            next();
        }
    },

    changePassword: async(req, res, next) => {
        const v = new niv.Validator(req.body, {
            current_password: 'required|string',
            password: 'required|string|minLength:8|hasSpecialCharacter|containsNumber|confirmed',
            password_confirmation: 'required'
        });

        let matched = await v.check();
        if(!matched){
            let errors = v.errors;
            returnValidationError(errors, res, "Oops!, password change failed");
        }else{
            if(!req.value){
                req.value = {}
            }
            req.body = v.inputs;
            next();
        }
    },
}