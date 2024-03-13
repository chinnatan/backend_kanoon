import {
  Jwt,
  JwtPayload,
  Secret,
  sign,
  SignOptions,
  verify,
} from "jsonwebtoken";
import { User } from "../model/user/user.model";
import { loggerUtil } from "./logger.util";
import pool from "./db.util";
import { Permission } from "../model/user/permission.model";
import { ForbiddenException } from "../exception/forbidden.exception";

const JWT_SECRET_KEY: Secret = process.env.JWT_SECRET_KEY || "";
const JWT_EXPIRED_IN: string = process.env.JWT_EXPIRE_IN || "1h";

const JWT_REFERSH_TOKEN_SECRET_KEY: Secret =
  process.env.JWT_REFERSH_TOKEN_SECRET_KEY || "";
const JWT_REFRESH_EXPIRE_IN: string = process.env.JWT_REFRESH_EXPIRE_IN || "1h";

const signOptions: SignOptions = {
  expiresIn: JWT_EXPIRED_IN,
};

const refreshSignOptions: SignOptions = {
  expiresIn: JWT_REFRESH_EXPIRE_IN,
};

export default class AuthUtil {
  static generateToken(userInfo: User): string {
    const payload = JSON.stringify(userInfo);
    return sign(JSON.parse(payload), JWT_SECRET_KEY, signOptions);
  }

  static generateRefreshToken(userInfo: User): string {
    const payload = JSON.stringify(userInfo);
    return sign(
      JSON.parse(payload),
      JWT_REFERSH_TOKEN_SECRET_KEY,
      refreshSignOptions
    );
  }

  static verifyToken(token: string): Jwt | JwtPayload | string {
    return verify(token, JWT_SECRET_KEY);
  }

  static async updateRefreshToken(token: string, userId: number) {
    const client = await pool.connect();
    try {
      let updateRefreshToken = {
        text: `update users set refresh_token = $1 where id = $2`,
        values: [token, userId],
      };
      const updated = await client
        .query(updateRefreshToken)
        .then((result) => {
          return result.rowCount;
        })
        .catch((error) => {
          throw new Error(error);
        });
      loggerUtil.info(`updated refresh token ${updated} rows`);
    } catch (error) {
      loggerUtil.error(error);
    } finally {
      client.release();
    }
  }

  // === สำหรับตรวจสอบว่าผู้ใช้งานมีสิทธิ์ทำอะไรบ้าง === //
  static async getPermissions(userId: number) {
    const client = await pool.connect();
    let permissions: Array<Permission> = [];
    try {
      const query = {
        text: `select p.id, p.permission_name, p.permission_desc from users u 
                inner join users_roles ur ON ur.user_id  = u.id 
                inner join roles r on r.id = ur.role_id 
                inner join roles_permissions rp on rp.role_id = r.id
                inner join permissions p on p.id = rp.permission_id
                where u.id = $1`,
        values: [userId],
      };

      const raw = await client
        .query(query)
        .then((result) => {
          return result.rows;
        })
        .catch((error) => {
          throw new Error(error);
        });

      if (raw.length === 0) {
        throw new ForbiddenException("คุณไม่มีสิทธิ์");
      }

      raw.forEach((permission) => {
        permissions.push(
          new Permission(permission.id, permission.permission_name)
        );
      });
    } catch (ex: any) {
      loggerUtil.error(ex);
    } finally {
      client.release;
    }
    return permissions;
  }

  static isHavePermission(
    permissionId: number,
    permissions: Permission[]
  ): boolean {
    return permissions.find((permission) => permission.id == permissionId) ? true : false
  }
}
