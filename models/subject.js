module.exports = (sequelize, DataTypes) => {
    const Subject = sequelize.define('Subject', {
        id: {type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4},
        name: {type: DataTypes.STRING, allowNull: false}
    },{
        tableName: 'subjects',
        timestamps: false
    })
    Subject.associate = (models) => {
        Subject.hasMany(models.Question, {
            as: 'questions',
            foreignKey: 'subject_id'
        });
    };
    return Subject;
}