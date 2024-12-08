module.exports = (sequelize, DataTypes) => {
    const Class = sequelize.define('Class', {
        id: {type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4},
        name: {type: DataTypes.STRING, allowNull: false}
    },{
        tableName: 'classes',
        timestamps: false
    })
    Class.associate = (models) => {
        Class.hasMany(models.Question, {
            as: 'questions',
            foreignKey: 'class_id'
        });
    };
    return Class;
}