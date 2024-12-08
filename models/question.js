module.exports = (sequelize, DataTypes, Sequelize) => {
    const Question = sequelize.define('Question', {
        id: {type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4},
        user_id: {
            type: DataTypes.UUID, 
            foreignKey: true,
            references: {
                model: {tableName: 'users'},
                key: 'id'
            },
            allowNull: false
        },
        subject_id: {
            type: DataTypes.UUID, 
            foreignKey: true,
            references: {
                model: {tableName: 'subjects'},
                key: 'id'
            },
            allowNull: false
        },
        class_id: {
            type: DataTypes.UUID, 
            foreignKey: true,
            references: {
                model: {tableName: 'classes'},
                key: 'id'
            },
            allowNull: false
        },
        text: {type: DataTypes.TEXT, allowNull: false},
        topic: {type: DataTypes.STRING, allowNull: false},
        upvoteCount: {type: DataTypes.INTEGER, defaultValue: 0},
        downvoteCount: {type: DataTypes.INTEGER, defaultValue: 0}
    },{
        tableName: 'questions'
    })
    Question.prototype.getImages = function() {
        return sequelize.models.Image.findAll({
            where: {
                imageable_id: this.id,
                imageable_type: 'Question'
            }
        });
    };
    Question.prototype.setImages = async function(images, transaction) {
        if(!Array.isArray(images)) throw new Error('Images must be an array');
        // Remove existing image if exists
        await sequelize.models.Image.destroy({
            where: {
                imageable_id: this.id,
                imageable_type: 'Question'
            }
        });
        const imagePromises = images.map(image => 
            sequelize.models.Image.create({
                url: image.url,
                imageable_id: this.id,
                imageable_type: 'Question'
            }, { transaction })
        );
        return Promise.all(imagePromises);
    };
    Question.associate = (models) => {
        Question.belongsTo(models.User, {
            as: 'user',
            foreignKey: 'user_id'
        });
        Question.hasMany(models.Answer, {
            as: 'answers',
            foreignKey: 'question_id'
        });
        Question.hasMany(models.Image, {
            foreignKey: 'imageable_id',
            constraints: false,
            scope: {
                imageable_type: 'Question'
            },
            as: 'images'
        });
        Question.hasMany(models.Vote, {
            foreignKey: 'voteable_id',
            constraints: false,
            scope: {
              voteable_type: 'Question'
            },
            as: 'votes'
        });
    };
    return Question;
}

