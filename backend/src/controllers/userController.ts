import bcrypt from 'bcryptjs';
import { ServerError, UserError } from '@custom-types/errorResponses';
import { NextFunction, Request, Response } from 'express';
import {
  UserAuthDTOValidator,
  UserRegisterDTOValidator,
  UserOTPAuthDTOValidator,
  UserEmailDTOValidator,
  UserResetPassDTOValidator,
} from '@custom-types/DTOs/userDTOValidator';
import logger from '@utils/logger';
import successHandler from '@middleware/successHandler';
import SuccessResponse from '@custom-types/successResponses';
import User from '@models/User';
import { createJwtToken, createRefreshToken, genSendOTPEmail, setCookies, verifyRefreshToken } from '@utils/helpers';
import { JwtPayload } from '@custom-types/JWTPayload';

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const validation = UserRegisterDTOValidator.safeParse(req.body);
  if (!validation.success) {
    return next(new UserError(validation.error.message));
  }

  const { name, email, password } = validation.data;
  logger.info.USER_REQ(`Creating a new user: ${name} (${email})`);

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      logger.warn.USER_ERR(`Attempt to register with existing email: ${email}`);
      return next(new UserError('A user with this email already exists.'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      favorites: { notes: [], bookmarks: [] },
    });

    await newUser.save();

    const redactedUser = {
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    logger.info.USER_REQ(`User registered successfully: ${name} (${email})`);
    successHandler(new SuccessResponse('User registered successfully', '201'), res, { redactedUser });
  } catch (err) {
    logger.error.SERVER_ERR(`Error registering user: ${err}`);
    next(new ServerError('Failed to register user.'));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const validation = UserAuthDTOValidator.safeParse(req.body);
  if (!validation.success) {
    return next(new UserError(validation.error.message));
  }

  const { email, password } = validation.data;
  logger.info.USER_REQ(`Login attempt for user: ${email}`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn.USER_ERR(`Login failed: user not found (${email})`);
      return next(new UserError('Invalid email or password.'));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn.USER_ERR(`Login failed: incorrect password (${email})`);
      return next(new UserError('Invalid email or password.'));
    }

    const redactedUser = {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const payload: JwtPayload = {
      id: user._id as string,
      email: user.email,
      hash: user.password,
    };

    const jwtToken = createJwtToken(payload);
    const refreshToken = createRefreshToken(payload);
    setCookies(jwtToken, refreshToken, res);

    logger.info.USER_REQ(`User logged in successfully: ${email}`);
    successHandler(new SuccessResponse('Login successful', '200'), res, {
      redactedUser,
    });
  } catch (err) {
    logger.error.SERVER_ERR('Error logging in user', { error: err });
    next(new ServerError('Failed to login user.'));
  }
};

const generateOTP = async (req: Request, res: Response, next: NextFunction) => {
  const validation = UserEmailDTOValidator.safeParse(req.body);
  if (!validation.success) {
    return next(new UserError(validation.error.message));
  }
  const { email } = validation.data;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new UserError('User not found.'));
    }

    await genSendOTPEmail(user, 6);

    logger.info.USER_REQ(`OTP sent to ${email}`);
    successHandler(new SuccessResponse('OTP sent to your email', '200'), res);
  } catch (err) {
    logger.error.SERVER_ERR('Error generating OTP', { error: err });
    next(new ServerError('Failed to generate OTP.'));
  }
};

const processOTPLogin = async (req: Request, res: Response, next: NextFunction) => {
  const validation = UserOTPAuthDTOValidator.safeParse(req.body);
  if (!validation.success) {
    return next(new UserError(validation.error.message));
  }
  const { email, otp } = validation.data;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otpExpires) {
      return next(new UserError('OTP not found or expired.'));
    }
    if (user.otp !== otp) {
      return next(new UserError('Invalid OTP.'));
    }
    if (Date.now() > user.otpExpires) {
      return next(new UserError('OTP has expired.'));
    }

    const redactedUser = {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Clear OTP fields
    user.otp = '';
    user.otpExpires = 0;
    await user.save();

    // Generate tokens
    const payload: JwtPayload = {
      id: user._id as string,
      email: user.email,
      hash: user.password,
    };

    const jwtToken = createJwtToken(payload);
    const refreshToken = createRefreshToken(payload);
    setCookies(jwtToken, refreshToken, res);

    logger.info.USER_REQ(`OTP login successful for ${email}`);

    successHandler(new SuccessResponse('Login successful', '200'), res, {
      redactedUser,
    });
  } catch (err) {
    logger.error.SERVER_ERR('Error processing OTP login', { error: err });
    next(new ServerError('Failed to process OTP login.'));
  }
};

const generateResetOTP = async (req: Request, res: Response, next: NextFunction) => {
  const validation = UserEmailDTOValidator.safeParse(req.body);
  if (!validation.success) {
    return next(new UserError(validation.error.message));
  }
  const { email } = validation.data;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new UserError('User not found.'));
    }

    await genSendOTPEmail(user, 6);

    logger.info.USER_REQ(`OTP sent to ${email}`);
    successHandler(new SuccessResponse('OTP sent to your email', '200'), res);
  } catch (err) {
    logger.error.SERVER_ERR('Error generating OTP', { error: err });
    next(new ServerError('Failed to generate OTP.'));
  }
};

const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const validation = UserResetPassDTOValidator.safeParse(req.body);
  if (!validation.success) {
    return next(new UserError(validation.error.message));
  }
  const { email, otp, newPassword } = validation.data;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otpExpires) {
      return next(new UserError('OTP not found or expired.'));
    }
    if (user.otp !== otp) {
      return next(new UserError('Invalid OTP.'));
    }
    if (Date.now() > user.otpExpires) {
      return next(new UserError('OTP has expired.'));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.otp = '';
    user.otpExpires = 0;
    user.password = hashedPassword;
    await user.save();

    logger.info.USER_REQ(`Password change successful for ${email}`);

    successHandler(new SuccessResponse('Password changed successfully', '200'), res);
  } catch (err) {
    logger.error.SERVER_ERR('Error processing OTP login', { error: err });
    next(new ServerError('Failed to process OTP login.'));
  }
};

const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return next(new UserError('Refresh token is required.', '403'));
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findOne({ _id: decoded.id });

    /*
    Check if the user we are refreshing the token for meets the conditions:
        1. Exists
        2. Has an active account
        3, The hashed password and the hash stored in the signed refresh token match (passwords have not been changed)
    */
    if (user && !user.deactivated && user.password === decoded.hash) {
      const payload: JwtPayload = {
        id: decoded.id,
        email: decoded.email,
        hash: decoded.hash,
      };
      const newJwtToken = createJwtToken(payload);
      const newRefreshToken = createRefreshToken(payload);
      setCookies(newJwtToken, newRefreshToken, res);

      logger.info.USER_REQ(`Refresh token successful for user: ${decoded.email}`);

      successHandler(new SuccessResponse('Token refreshed', '200'), res);
    } else {
      logger.warn.USER_ERR(`Deactivated user account (${decoded.email}) refresh token attempt`);
      return next(new UserError('Your account has been deactivated', '403'));
    }
  } catch (err) {
    logger.warn.USER_ERR('Invalid or expired refresh token', { error: err });
    return next(new UserError('Invalid or expired refresh token.'));
  }
};

export { registerUser, loginUser, generateOTP, processOTPLogin, generateResetOTP, resetPassword, refreshTokenHandler };
