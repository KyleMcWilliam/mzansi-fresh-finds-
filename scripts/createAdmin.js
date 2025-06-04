#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

async function createAdmin() {
  const argv = yargs(hideBin(process.argv))
    .option('name', {
      alias: 'n',
      description: 'Admin\'s name',
      type: 'string',
      demandOption: true,
    })
    .option('email', {
      alias: 'e',
      description: 'Admin\'s email address',
      type: 'string',
      demandOption: true,
    })
    .option('password', {
      alias: 'p',
      description: 'Admin\'s password',
      type: 'string',
      demandOption: true,
    })
    .help()
    .alias('help', 'h')
    .argv;

  try {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose 6 always behaves as if `useCreateIndex: true` and `useFindAndModify: false` are true
      // So, they are no longer needed.
    });
    console.log('MongoDB Connected...');

    const { name, email, password } = argv;

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('Error: User with this email already exists.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Create admin user object
    const adminUser = new User({
      name,
      email,
      password, // Password will be hashed by the pre-save hook in the User model
      role: 'admin',
    });

    // Save the user
    await adminUser.save();
    console.log(`Admin user "${adminUser.name}" created successfully with email "${adminUser.email}" and role "${adminUser.role}".`);

  } catch (error) {
    console.error('Error creating admin user:', error.message);
    if (error.name === 'ValidationError') {
        console.error('Details:', error.errors);
    }
    process.exitCode = 1; // Indicate failure
  } finally {
    // Disconnect MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
}

createAdmin();
