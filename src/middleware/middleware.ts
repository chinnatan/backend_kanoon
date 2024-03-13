import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { User } from "../model/user/user.model";
import AuthUtil from "../util/auth.util";
import { authService } from "../service/auth.service";
import { Permission } from "../model/user/permission.model";

const privateKey: string = process.env.JWT_SECRET_KEY || "";
const jwtRefreshTokenKey: string =
  process.env.JWT_REFERSH_TOKEN_SECRET_KEY || "";

export const middleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader) {
      return res
        .status(403)
        .send(
          "<center>You do not have permission to use this section.</center>"
        );
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, privateKey, (err, decoded) => {
      if (err && err instanceof TokenExpiredError) {
        let refreshToken = AuthUtil.generateToken(decoded as User);
        req.headers.authorization = `Bearer ${refreshToken}`;
        req.user = decoded as User;
      } else {
        req.user = decoded as User;
      }
    });

    if (req.user !== undefined) {
      req.permissions = (await AuthUtil.getPermissions(
        req.user?.id
      )) as Array<Permission>;
    }
  } catch (err) {
    return res
      .status(403)
      .send("<center>You do not have permission to use this section.</center>");
  }
  return next();
};

export const refreshTokenValidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader) {
      return res
        .status(403)
        .send(
          "<center>You do not have permission to use this section.</center>"
        );
    }

    const token = authHeader.replace("Bearer ", "");
    jwt.verify(token, jwtRefreshTokenKey, (err, decoded) => {
      if (err) throw new Error(err.stack);
      req.user = decoded as User;
      req.user.refreshToken = token;

      delete req.user?.exp;
      delete req.user?.iat;
    });
  } catch (err) {
    return res
      .status(403)
      .send("<center>You do not have permission to use this section.</center>");
  }
  return next();
};
