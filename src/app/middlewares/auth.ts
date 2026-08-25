import { NextFunction, Request, Response } from 'express';
import { JwtPayload, Secret } from 'jsonwebtoken';
import AppError from '../error/appError';
import config from '../config';
import { jwtHelpers } from '../helper/jwtHelpers';
import User from '../modules/user/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | any;
    }
  }
}

const auth = (...role: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) throw new AppError(401, 'You are not authorized');

      const varifiedToken = jwtHelpers.verifyToken(
        token,
        config.jwt.accessTokenSecret as Secret,
      ) as JwtPayload;

      const currentUser = await User.findById(varifiedToken.id).select('role status verified');
      if (!currentUser) throw new AppError(401, 'User account no longer exists');
      if (currentUser.status !== 'approved') throw new AppError(403, 'Your account is not approved');
      if (!currentUser.verified) throw new AppError(403, 'Email verification is required');

      // Defensive check for role
      if (
        role.length &&
        (!varifiedToken ||
          !varifiedToken.role ||
          !role.includes(currentUser.role as string))
      ) {
        throw new AppError(
          401,
          'You are not authorized to access this resource',
        );
      }
      req.user = { ...varifiedToken, id: currentUser._id.toString(), role: currentUser.role };
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
