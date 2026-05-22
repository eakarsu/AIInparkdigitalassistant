// Compatibility shim: some routes (crowdIntelligence, accessibilityAdvisor)
// import `../db`. The actual pool lives in `./models/database.js`.
module.exports = require('./models/database');
