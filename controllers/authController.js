const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });
    createSendToken(newUser, 201, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // check if email and password exists
    if (!email || !password) {
      return next(new AppError('Please you write email and password', 400));
    }

    // check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    const correct = await user.correctPassword(password, user.password);

    if (!user || !correct) {
      return next(
        new AppError('Please you write correct email or password', 401)
      );
    }

    // If everything is ok, send token to client
    createSendToken(user, 200, res);
    const token = signToken(user._id);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // getting token check of it is there
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // console.log(token);

    if (!token) {
      return next(
        new AppError('You are not log in!Please log in to access', 401)
      );
    }
    // verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist',
          401
        )
      );
    }
    // check if user changed password after the token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently change password!Please log in again'),
        401
      );
    }

    // grant access to route
    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin','lead-guide'] role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // get user based on postedemail
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email adress'), 404);
  }

  // generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // send it to user's mail
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forget your password? Submit a PATCH request with your new password and 
  password confirm to =${resetURL} \nIf you didn't forget your password, please ignore this email`;

    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email.Try again later'),
      500
    );
  }
};
exports.resetPassword = async (req, res, next) => {
  try {
    // get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    // if token has not expired and there is user set the new password

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();
    // update changePasswordAt property for user
    // log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // get user from collection
    const user = await User.findById(req.user.id).select('+password');
    // check if posted current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Your current password is wrong', 401));
    }
    // if so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: error,
    });
  }
};
