import { JwtPayload } from '@custom-types/JWTPayload';
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import logger from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'changeme';

// Session JWT is valid for one day
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN) || 24 * 60 * 60 * 1000;

// Session Refresh JWT is valid for 14 days
const REFRESH_TOKEN_EXPIRES_IN = Number(process.env.REFRESH_TOKEN_EXPIRES_IN) || 14 * 24 * 60 * 60 * 1000;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

function createJwtToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN });
}

function createRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function verifyJwtToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

async function genSendOTPEmail(user, length: number = 6) {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Email template
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: 'Your OTP Code',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
            <h2>Verify your email address</h2>
            <p>You need to verify your email address to continue. Enter the following code to continue your action:</p>
            <h1 style="letter-spacing: 2px;">${otp}</h1>
            <p style="color: #888; font-size: 0.9em;">This code will expire in 10 minutes.</p>
          </div>
        `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error.SERVER_ERR('Email could not be sent', { error });
    throw error;
  }
}

function setCookies(jwtToken: string, refreshToken: string, res: Response) {
  res.cookie('jwt', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: JWT_EXPIRES_IN,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export {
  createJwtToken,
  createRefreshToken,
  verifyJwtToken,
  verifyRefreshToken,
  genSendOTPEmail,
  setCookies,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
};
