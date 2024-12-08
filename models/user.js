const bcrypt = require('bcrypt');
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4},
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            get() {
                const rawValue = this.getDataValue('name');
                return rawValue ? rawValue : null;
            },
            set(value) {
                this.setDataValue('name', value);
            }
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            get() {
                const rawValue = this.getDataValue('email');
                return rawValue ? rawValue : null;
            },
            set(value) {
                this.setDataValue('email', value.toLowerCase());
            }
        },
        username: {type: DataTypes.STRING, allowNull: true},
        password: {type: DataTypes.STRING, allowNull: false},
        photo: {type: DataTypes.STRING, allowNull: true},
        googleId: {type: DataTypes.STRING, unique: true, allowNull: true},
        verified: {
            type: DataTypes.BOOLEAN, 
            defaultValue: 1,
            get() {
                const rawValue = this.getDataValue('verified');
                return (rawValue == 1) ? true : false;
            }
        },
        contributions: {type: DataTypes.INTEGER, defaultValue: 0},
        points: {type: DataTypes.INTEGER, defaultValue: 0},
        upvoteCount: {type: DataTypes.INTEGER, defaultValue: 0},
        downvoteCount: {type: DataTypes.INTEGER, defaultValue: 0},
        badge: {
            type: DataTypes.ENUM(
                'newbie', 
                'learner', 
                'student',
                'scholar',
                'specialist',
                'mentor',
                'expert',
                'master',
                'sage',
                'genius',
                'icon',
                'virtuosso',
                'legend'
            ),
            defaultValue: 'newbie'
        },
        email_verified_at: {type: DataTypes.DATE, allowNull: true}
    },{
        hooks: {
            beforeCreate: async (user) => {
                if(user.password){
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                };
            },
            beforeUpdate: async (user) => {
                if(user.changed('password')){
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        },
        defaultScope: {
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        },
    })
    User.prototype.getBadge = async function(points) {
        const badges = [
            { threshold: 0, name: 'newbie' },
            { threshold: 50, name: 'learner' },
            { threshold: 200, name: 'student' },
            { threshold: 500, name: 'scholar' },
            { threshold: 1000, name: 'specialist' },
            { threshold: 2000, name: 'mentor' },
            { threshold: 4000, name: 'expert' },
            { threshold: 7500, name: 'master' },
            { threshold: 15000, name: 'sage' },
            { threshold: 30000, name: 'genius' },
            { threshold: 70000, name: 'icon' },
            { threshold: 150000, name: 'virtuosso' },
            { threshold: 500000, name: 'legend' }
        ];
        // for (let i = badges.length - 1; i >= 0; i--) {
        //     if (points >= badges[i].threshold) {
        //         return badges[i].name;
        //     }
        // }
        for (const badge of badges.reverse()) {
            if (points >= badge.threshold) {
              return badge.name;
            }
        }
        return 'newbie';
    };
    User.associate = models => {
        User.hasMany(models.Question, {
            as: 'questions',
            foreignKey: 'user_id'
        });
    };
    return User;
}