const User = require('../models/User');

// GET /auth/admin/users?role=Doctor&is_active=false
const listUsers = async (req, res) => {
  try {
    const users = await User.findAll(req.query);
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /auth/admin/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /auth/admin/users/:id/activate
const toggleActive = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) {
      return res.status(400).json({ message: 'is_active field is required' });
    }

    const user = await User.setActive(req.params.id, is_active);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const action = is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
    await User.addLog({
      adminId:      req.user.id,
      action,
      targetUserId: req.params.id,
      details:      `Admin ${req.user.email} ${action.toLowerCase()} user ${user.email}`,
    });

    res.json({ user, message: `User ${is_active ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /auth/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const deleted = await User.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    await User.addLog({
      adminId:      req.user.id,
      action:       'DELETE_USER',
      targetUserId: req.params.id,
      details:      `Admin ${req.user.email} deleted user ${deleted.email}`,
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /auth/admin/stats
const getStats = async (_req, res) => {
  try {
    const stats = await User.getStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /auth/admin/logs
const getLogs = async (_req, res) => {
  try {
    const logs = await User.getLogs();
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { listUsers, getUser, toggleActive, deleteUser, getStats, getLogs };
