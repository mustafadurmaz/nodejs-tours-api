const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: '../../config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('DB connected');
  });

// Read JSON file

const tours = JSON.parse(fs.readFileSync('tours-simple.json', 'utf-8'));

// Import data into database

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfuly loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// Delete All data from database

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfuly deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
