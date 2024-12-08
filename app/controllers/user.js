const { sequelize, models: { User } } = require('@models');

exports.getUser = async(req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({error: true, message: 'User not found'});

    return res.status(200).json({
        message: "user data:",
        results: user,
        error: false
    });
}

exports.changePassword = async(req, res) => {
    const { current_password, password } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({message: 'User not found', error: true});

    if (!await bcrypt.compare(current_password, user.password)) {
        var message = 'Check your current password.';
    }else if(await bcrypt.compare(password, user.password)){
        var message = 'Please enter a password which is not similar to your current password.';
    }else {
        user.password = password;
        await user.save();
    
        return res.status(200).json({
            message: 'Your password has been successfully changed',
            results: null,
            error: false
        });
    }

    return res.status(400).json({
        message: message,
        error: true
    });
};