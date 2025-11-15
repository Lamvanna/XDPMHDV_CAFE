const Settings = require('../models/Settings');

// Get settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.get();
        res.json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.json({ success: true, settings });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
