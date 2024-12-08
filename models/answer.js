module.exports = (sequelize, DataTypes) => {
    const Answer = sequelize.define('Answer', {
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
        question_id: {
            type: DataTypes.UUID, 
            foreignKey: true,
            references: {
                model: {tableName: 'questions'},
                key: 'id'
            },
            allowNull: false
        },
        text: {type: DataTypes.TEXT, allowNull: false},
        upvoteCount: {type: DataTypes.INTEGER, defaultValue: 0},
        downvoteCount: {type: DataTypes.INTEGER, defaultValue: 0}
    },{
        tableName: 'answers'
    })
    Answer.prototype.getImages = function() {
        return sequelize.models.Image.findAll({
            where: {
                imageable_id: this.id,
                imageable_type: 'Answer'
            }
        });
    };
    Answer.prototype.setImages = async function(images, transaction) {
        if(!Array.isArray(images)) throw new Error('Images must be an array');
        // Remove existing image if exists
        await sequelize.models.Image.destroy({
            where: {
                imageable_id: this.id,
                imageable_type: 'Answer'
            }
        });
        const imagePromises = images.map(image => 
            sequelize.models.Image.create({
                url: image.url,
                imageable_id: this.id,
                imageable_type: 'Answer'
            }, { transaction })
        );
        return Promise.all(imagePromises);
    };
    Answer.associate = (models) => {
        Answer.belongsTo(models.User, {
            as: 'user',
            foreignKey: 'user_id'
        });
        Answer.belongsTo(models.Question, {
            as: 'question',
            foreignKey: 'question_id'
        });
        Answer.hasMany(models.Image, {
            foreignKey: 'imageable_id',
            constraints: false,
            scope: {
                imageable_type: 'Answer'
            },
            as: 'images'
        });
        Answer.hasMany(models.Vote, {
            foreignKey: 'voteable_id',
            constraints: false,
            scope: {
              voteable_type: 'Answer'
            },
            as: 'votes'
        });
    };
    return Answer;
}

