const mongoose = require('mongoose');
const validator = require('validator');

//name,mail,photo,password,passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please write your name'],
  },
  mail: {
    type: String,
    required: [true, 'Please write your e-mail'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please write a valid e-mail'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please write your password'],
    minlength:8
  },
  passwordConfirm: {
      type:String,
      required:[true,'Please confirm your password']
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
