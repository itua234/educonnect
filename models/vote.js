module.exports = (sequelize, DataTypes) => {
    const Vote = sequelize.define('Vote', {
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
        type: {type: DataTypes.ENUM('upvote', 'downvote'), allowNull: false},
        voteable_id: {type: DataTypes.UUID, allowNull: false},
        voteable_type: {type: DataTypes.ENUM('Question', 'Answer'), allowNull: false},
    }, {
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'voteable_type', 'voteable_id']
            }
        ],
        hooks: {
            afterCreate: async (vote, options) => {
                //await vote.updateVoteCount('increment');
            },
            afterDestroy: async (vote, options) => {
                //await vote.updateVoteCount('decrement');
            }
        }
    });
    Vote.prototype.updateVoteCount = async function(operation, transaction) {
        const { Question, Answer, User } = sequelize.models;
        const Model = this.voteable_type === 'Question' ? Question : Answer;
    
        const item = await Model.findByPk(this.voteable_id, { transaction });
        if (item) {
            const incrementValue = this.type === 'upvote' ? 1 : 1;
            const updateField = this.type === 'upvote' ? 'upvoteCount' : 'downvoteCount';
            await item.increment(updateField, {
                by: operation === 'increment' ? incrementValue : incrementValue,
                transaction
            });
    
            const user = await User.findByPk(item.user_id, { transaction });
            await user.increment(updateField, {
                by: operation === 'increment' ? incrementValue : incrementValue,
                transaction
            });
            await user.reload({ transaction });
    
            const points = user.contributions + user.upvoteCount - user.downvoteCount;
            const badge = await user.getBadge(points);
            await user.update({ points, badge }, { transaction });
        }
    };
    
    return Vote;
};