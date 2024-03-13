import { Permission } from "../../model/user/permission.model";
import { User } from "../../model/user/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: User,
      permissions?: Permission[]
    }
  }
}
