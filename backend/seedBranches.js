const mongoose = require('mongoose');
const Branch = require('./models/Branch');

mongoose.connect('mongodb://localhost/bakery', { useNewUrlParser: true, useUnifiedTopology: true });

const seedBranches = async () => {
  try {
    const branches = [];
    for (let i = 1; i <= 10; i++) {
      const branchId = `B${String(i).padStart(3, '0')}`; // e.g., B001
      branches.push({
        branchId,
        name: `Branch ${i}`,
        location: `Location ${i}`,
      });
    }

    await Branch.deleteMany({}); // Clear existing branches (optional)
    await Branch.insertMany(branches);

    console.log('10 branches seeded successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding branches:', error);
  }
};

seedBranches();