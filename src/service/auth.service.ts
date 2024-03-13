import { Request, Response } from "express";
import { HandleService } from "../handle/handle";
import { MessageResponse } from "../model/service/message.rs..model";
import pool from "../util/db.util";
import { User } from "../model/user/user.model";
import AuthUtil from "../util/auth.util";
import { InvalidDataException } from "../exception/invaliddata.exception";
import { ForbiddenException } from "../exception/forbidden.exception";
import StringUtil from "../util/string.util";
import { loggerUtil } from "../util/logger.util";
import { DataNotFoundException } from "../exception/datanotfound.exception";
import { UserAuthen } from "../model/user/user_authen.mode";
import bcrypt from "bcrypt";
import { UnauthorizeException } from "../exception/unauthorize.exception";

export class AuthService {
  async login(req: Request, res: Response) {
    const h = new HandleService("login", req, res);
    const client = await pool.connect();
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        throw new InvalidDataException("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
      }

      let queryFindUser = {
        text: `select u.id as user_id, u.username, u."password",
                  u.fullname, u.refresh_token, s.id as store_id,
                  s.store_name, s.store_desc
                from users u 
                inner join stores s on s.user_id = u.id
                where username = $1`,
        values: [username],
      };
      const rawFindUser = await client
        .query(queryFindUser)
        .then((result) => {
          return result.rows[0];
        })
        .catch((error) => {
          throw new Error(error);
        });

      if (rawFindUser === null || rawFindUser === undefined) {
        throw new DataNotFoundException("ไม่พบผู้ใช้งาน");
      }

      const findUser = new UserAuthen(
        rawFindUser.user_id,
        rawFindUser.username,
        rawFindUser.fullname,
        rawFindUser.password,
        rawFindUser.store_id,
        rawFindUser.store_name
      );

      const validPass = await bcrypt.compare(password, findUser.password);

      if (!validPass) {
        throw new UnauthorizeException("รหัสผ่านไม่ถูกต้อง");
      }

      let user = new User(
        findUser.id,
        findUser.username,
        findUser.fullname,
        findUser.storeId,
        findUser.storeName
      );

      const token = AuthUtil.generateToken(user);
      const refreshToken = AuthUtil.generateRefreshToken(user);
      user.token = token;
      user.refreshToken = refreshToken;

      await AuthUtil.updateRefreshToken(refreshToken, user.id);

      h.handleSuccess(new MessageResponse(true, user));
    } catch (err: any) {
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }

  async refreshToken(req: Request, res: Response) {
    const h = new HandleService("refreshToken", req, res);
    const client = await pool.connect();
    try {
      const queryRefreshToken = {
        text: `select refresh_token from users where id = $1`,
        values: [req.user?.id],
      };
      const oldRefreshToken = await client
        .query(queryRefreshToken)
        .then((result) => {
          return result.rows[0].refresh_token;
        })
        .catch((error) => {
          throw new Error(error);
        });

      if (StringUtil.isNullOrEmpty(oldRefreshToken)) {
        throw new ForbiddenException("คุณไม่มีสิทธิ์");
      }

      if (req.user?.refreshToken !== oldRefreshToken) {
        throw new ForbiddenException("token ของคุณไม่ถูกต้อง");
      }

      if (req.user != undefined) {
        delete req.user.token;
        delete req.user.refreshToken;

        const accessToken = AuthUtil.generateToken(req.user);
        const refreshToken = AuthUtil.generateRefreshToken(req.user);

        req.user.token = accessToken;
        req.user.refreshToken = refreshToken;

        await AuthUtil.updateRefreshToken(refreshToken, req.user.id);

        h.handleSuccess(
          new MessageResponse(true, {
            accessToken,
            refreshToken,
          })
        );
      }
    } catch (err: any) {
      h.handleError(err);
    } finally {
      client.release();
    }
  }
}

export const authService = new AuthService();
