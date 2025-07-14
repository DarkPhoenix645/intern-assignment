import SuccessResponse from '@custom-types/successResponses';
import titles from '@constants/CONSTANTS';
import { Response } from 'express';

const successHandler = (obj: SuccessResponse, res: Response, fields: Record<string, any> = {}) => {
  // Ensure statusCode is a valid number (default to 200)
  const statusCode: number = obj.statusCode ? Number(obj.statusCode) : 200;

  // Send response with title from `titles` if it exists, otherwise default to 'OK'
  res.status(statusCode).json({
    title: titles[statusCode] || 'OK',
    message: obj.message || '',
    ...fields, // Additional data fields
  });
};

export default successHandler;
