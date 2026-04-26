const User = require("../models/User");

exports.createUser = async (req, res) => {
    const user = await User.create(req.body);
    res.json(user);
};

exports.getUsers = async (req, res) => {
    const users = await User.find();
    res.json(users);
};

exports.getUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
};

exports.updateUser = async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(user);
};

exports.deleteUser = async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "deleted" });
};
