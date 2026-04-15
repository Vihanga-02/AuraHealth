const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { email, password, role, full_name, phone } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'email, password and role are required' });
    }
    if (!['Patient', 'Doctor', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const result = await User.registerUser({ email, password, role, full_name, phone });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const result = await User.loginUser({ email, password });
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    const user = await User.updateProfile(req.user.id, { full_name, phone });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    const result = await User.changePassword(req.user.id, { currentPassword, newPassword });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { register, login, me, updateMe, changeMyPassword };
