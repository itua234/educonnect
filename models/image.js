module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define('Image', {
        id: {type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4},
        imageable_id: {type: DataTypes.UUID, allowNull: false},
        imageable_type: {type: DataTypes.STRING, allowNull: false},
        url: {type: DataTypes.STRING, allowNull: false}
    },{
        tableName: 'images',
        timestamps: false
    })
    Image.associate = models => {
        Image.belongsTo(models.Question, {
            foreignKey: 'imageable_id',
            constraints: false,
            scope: {
                imageable_type: 'Question'
            },
            as: 'question'
        });
        Image.belongsTo(models.Answer, {
            foreignKey: 'imageable_id',
            constraints: false,
            scope: {
                imageable_type: 'Answer'
            },
            as: 'answer'
        });
    };
    return Image;
}