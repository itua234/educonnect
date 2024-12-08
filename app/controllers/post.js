const { sequelize, Sequelize, models: { User, Question, Image, Answer, Vote } } = require('@models');
const {Op} = require("sequelize");
const { uploadToBlob } = require('@services/blob_storage');
const wsManager = require('../services/wsManager');
const io = wsManager.getIo();

exports.createQuestion = async (req, res) => {
    const {
        class_id,
        subject_id,
        text,
        topic
    } = req.body;
    await sequelize.transaction(async function(transaction) {
        try{
            const processedImages = await Promise.all(
                req.body.images.map(async (image) => {
                    const imageResult = await uploadToBlob(image);
                    return {
                        url: imageResult.secure_url
                    };
                })
            );
            const question = await Question.create({
                user_id: req.user.id,
                class_id,
                subject_id,
                text, 
                topic
            }, {transaction});
            const images = await question.setImages(processedImages, transaction);
            await User.increment({
                contributions: 1,
                points: 1  
            }, {
                where: { id: req.user.id },
                transaction
            });
            
            question.dataValues.images = images;
            return res.status(200).json({
                message: 'post has been created:',
                results: question,
                error: false
            });
        }catch(error){
            // Rollback the transaction in case of an error
            await transaction.rollback();
            console.error('Error creating post:', error);
            return res.status(500).json({
                message: 'An error occurred while creating the post',
                error: true
            });
        }
    });
};

exports.createAnswer = async (req, res) => {
    const questionId = req.params.questionId;
    const {text} = req.body;
    await sequelize.transaction(async function(transaction) {
        try{
            const question = await Question.findByPk(questionId);
            if (!question) return res.status(404).json({error: true, message: 'Post not found'});
            
            const processedImages = await Promise.all(
                req.body.images.map(async (image) => {
                    const imageResult = await uploadToBlob(image);
                    return {
                        url: imageResult.secure_url
                    };
                })
            );
            const answer = await Answer.create({
                user_id: req.user.id,
                question_id: question.id,
                text
            }, {transaction});
            const images = await answer.setImages(processedImages, transaction);
            await User.increment({
                contributions: 1,
                points: 1  
            }, {
                where: { id: req.user.id },
                transaction
            });

            const user = await User.findByPk(question.user_id);
            // Emit an event to the user through Socket.IO
            io.to(user.id).emit('question_answered', answer);
            
            answer.dataValues.images = images;
            return res.status(200).json({
                message: 'post has been created:',
                results: answer,
                error: false
            });
        }catch(error){
            // Rollback the transaction in case of an error
            await transaction.rollback();
            console.error('Error creating post:', error);
            return res.status(500).json({
                message: 'An error occurred while creating the post',
                error: true
            });
        }
    });
};

exports.getQuestions = async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        subject,
        level,
        search
    } = req.query;
    try {
        // Build query object based on provided filters
        const query = {
            ...(level && { class_id: level }),
            ...(subject && { subject_id: subject })
        };
        if (search) {
            query[Sequelize.Op.or] = [
                { topic: { [Sequelize.Op.like]: `%${search}%` } },
                { text: { [Sequelize.Op.like]: `%${search}%` } }
            ];
        }
        const { count, rows: questions } = await Question.findAndCountAll({
            where: query,
            include: [
                {
                    model: Image, 
                    as: "images", 
                    attributes: ['id','url']
                }
            ],
            limit: Number(limit),
            offset: Number((page - 1) * limit),
            order: [['createdAt', 'DESC']],
            raw: false,
            distinct: true
        });
        const totalPages = Math.ceil(count / limit);
        const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/questions`;

        return res.status(200).json({
            message: 'Posts:',
            results: {
                data: questions,
                perPage: parseInt(limit),
                totalPages: totalPages,
                currentPage: parseInt(page),
                lastPage: totalPages,
                total: count,
                first_page_url: `${baseUrl}?page=1`,
                last_page_url: `${baseUrl}?page=${totalPages}`,
                next_page_url: page < totalPages 
                ? `${baseUrl}?page=${parseInt(page) + 1}` 
                : null,
                prev_page_url: page > 1 
                ? `${baseUrl}?page=${parseInt(page) - 1}` 
                : null
            },
            error: false
        });
    }catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ 
            message: error.message || 'Error fetching posts', 
            error: true 
        });
    }
};

exports.getQuestionData = async (req, res) => {
    try {
        const question = await Question.findOne({
            where: {id: req.params.questionId},
            include: [
                {
                    model: Image, 
                    as: "images", 
                    attributes: ['id','url']
                },
                {
                    model: Answer, 
                    as: "answers",
                    include:[
                        {
                            model: Image, 
                            as: "images", 
                            attributes: ['id','url']
                        }
                    ]
                }
            ]
        });
        if (!question) return res.status(404).json({error: true, message: 'Post not found'});

        return res.status(200).json({
            message: 'Post:',
            results: question,
            error: false
        });
    }catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ 
            message: error.message || 'Error fetching posts', 
            error: true 
        });
    }
};

exports.getUserQuestions = async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        subject,
        level,
        search
    } = req.query;
    try {
        // Build query object based on provided filters
        const query = {
            ...(level && { class_id: level }),
            ...(subject && { subject_id: subject }),
            user_id: req.user.id
        };
        if (search) {
            query[Sequelize.Op.or] = [
                { topic: { [Sequelize.Op.like]: `%${search}%` } },
                { text: { [Sequelize.Op.like]: `%${search}%` } }
            ];
        }
        const { count, rows: questions } = await Question.findAndCountAll({
            where: query,
            include: [
                {
                    model: Image, 
                    as: "images", 
                    attributes: ['id','url']
                }
            ],
            limit: Number(limit),
            offset: Number((page - 1) * limit),
            order: [['createdAt', 'DESC']],
            raw: false,
            distinct: true
        });
        
        const totalPages = Math.ceil(count / limit);
        const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/user/questions`;

        return res.status(200).json({
            message: 'Posts:',
            results: {
                data: questions,
                perPage: parseInt(limit),
                totalPages: totalPages,
                currentPage: parseInt(page),
                lastPage: totalPages,
                total: count,
                first_page_url: `${baseUrl}?page=1`,
                last_page_url: `${baseUrl}?page=${totalPages}`,
                next_page_url: page < totalPages 
                ? `${baseUrl}?page=${parseInt(page) + 1}` 
                : null,
                prev_page_url: page > 1 
                ? `${baseUrl}?page=${parseInt(page) - 1}` 
                : null
            },
            error: false
        });
    }catch (error) {
        res.status(500).json({ 
            message: 'Error fetching posts', 
            error: true 
        });
    }
};

exports.vote = async (req, res) => {
    try {
        const { itemId, itemType } = req.params;
        const { voteType } = req.body;
        // Validate input
        if(!['Question', 'Answer'].includes(itemType)) {
            return res.status(400).json({ message: 'Invalid item type' });
        }
        if(!['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({ message: 'Invalid vote type' });
        }
        // Find existing vote
        const existingVote = await Vote.findOne({
            where: { 
                user_id: req.user.id, 
                voteable_type: itemType,
                voteable_id: itemId
            }
        });
        const result = await sequelize.transaction(async (transaction) => {
            if (existingVote) {
                if (existingVote.type === voteType) {
                    await existingVote.destroy({ transaction });
                    await existingVote.updateVoteCount("decrement", transaction);
                    return { action: 'removed' };
                }
                await existingVote.update(
                    { type: voteType }, 
                    { transaction }
                );
                await existingVote.updateVoteCount("increment", transaction);
                return { action: 'changed' };
            }
            // Create new vote
            const vote = await Vote.create({
                user_id: req.user.id, 
                voteable_type: itemType,
                voteable_id: itemId,
                type: voteType
            }, { transaction });

            await vote.updateVoteCount("increment", transaction);

            return { action: 'added' };
        });

        res.json({
            message: `Vote ${result.action} successfully`,
            results: null,
            error: false
        });
    }catch(error){
        console.error('Error voting on question:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: true
        });
    }
};