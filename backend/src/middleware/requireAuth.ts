import { NotFoundError, UserError } from "@custom-types/errorResponses";
import jwt from "jsonwebtoken";
import User from "@models/User";
import { NextFunction, Request, Response } from "express";

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.jwt;
  let decodedTokenVal;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };
      decodedTokenVal = decoded.id;
    } catch (err) {
      return next(new UserError("Invalid JWT", "403"));
    }
  } else {
    return next(
      new UserError(
        "JWT does not exist, please login using your credentials first",
        "403"
      )
    );
  }

  const userObj = await User.findOne({ _id: decodedTokenVal });
  if (userObj && userObj._id) {
    return next();
  } else {
    return next(new UserError("Invalid Credentials"));
  }
}

export default requireAuth;
