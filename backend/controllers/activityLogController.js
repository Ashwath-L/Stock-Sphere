const ActivityLog = require('../models/ActivityLog');

// GET /activity-logs - Retrieve all activity logs (Owner only, searchable, sorted newest first)
exports.getActivityLogs = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    // Apply regex search if search query is provided
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter = {
        $or: [
          { username: searchRegex },
          { role: searchRegex },
          { action: searchRegex },
          { productName: searchRegex },
          { details: searchRegex }
        ]
      };
    }

    const logs = await ActivityLog.find(filter).sort({ Timestamp: -1 }).lean();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving activity logs', error: error.message });
  }
};
