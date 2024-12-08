const { sequelize } = require('@models');
const {QueryTypes, Op} = require('sequelize');
const {returnValidationError} = require("@util/helper");
const niv = require('node-input-validator');

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
});
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
});
niv.extendMessages({
    exists: 'The selected :attribute is invalid.'
});
//export the schemas
module.exports = {
    createQuestion: async(req, res, next) => {
        req.body.images = req.files && req.files['images'] ? req.files['images'] : [];
        const validationRules = {
            subject_id: 'required|string',
            class_id: 'required|string',
            text: 'required|string',
            topic: 'required|string',
            ...(req.body["images"] ? { 
                images: 'array',
                "images.*": 'mime:jpeg,jpg,svg,png|size:3mb'
            } : {})
        };
        const v = new niv.Validator(req.body, validationRules);
        // Custom validation for attachment file types
        niv.extend('supportedFileType', ({ value }) => {
            const supportedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg'];
            return supportedTypes.includes(value.mimetype);
        });
        let matched = await v.check();
        if(!matched){
            let errors = v.errors;
            console.log("Validation failed:", errors);
            let images = req.body.images;
            if(images.length !== 0){
                images.forEach(async(image) => {
                    const filePath = path.join(__dirname, "../..", "public", "images", "uploads", image.filename);
                    deleteFile(filePath);
                });
            }
            returnValidationError(errors, res, "failed to post question");
        }else{
            if(!req.value){
                req.value = {}
            }
            req.body = v.inputs;
            next();
        }
    },
    createAnswer: async(req, res, next) => {
        req.body.images = req.files && req.files['images'] ? req.files['images'] : [];
        const validationRules = {
            text: 'required|string',
            ...(req.body["images"] ? { 
                images: 'array',
                "images.*": 'mime:jpeg,jpg,svg,png|size:3mb'
            } : {})
        };
        const v = new niv.Validator(req.body, validationRules);
        // Custom validation for attachment file types
        niv.extend('supportedFileType', ({ value }) => {
            const supportedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg'];
            return supportedTypes.includes(value.mimetype);
        });
        let matched = await v.check();
        if(!matched){
            let errors = v.errors;
            console.log("Validation failed:", errors);
            let images = req.body.images;
            if(images.length !== 0){
                images.forEach(async(image) => {
                    const filePath = path.join(__dirname, "../..", "public", "images", "uploads", image.filename);
                    deleteFile(filePath);
                });
            }
            returnValidationError(errors, res, "failed to post answer");
        }else{
            if(!req.value){
                req.value = {}
            }
            req.body = v.inputs;
            next();
        }
    }
}