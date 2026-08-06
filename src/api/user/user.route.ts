import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import {
  ChangePasswordResponseSchema,
  ChangePasswordSchema,
  ChangeUserRoleResponseSchema,
  ChangeUserRoleSchema,
  GetUserSchema,
  UserSchema,
} from "@/api/user/user.model";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { userController } from "./user.controller";
import { authenticate, authorize } from "@/common/middleware/authenticate";
import { uploadAvatar } from "@/common/middleware/upload";

export const userRegistry = new OpenAPIRegistry();
export const userRouter: Router = express.Router();

userRegistry.register("User", UserSchema);

userRegistry.registerPath({
  method: "get",
  path: "/users",
  tags: ["User"],
  responses: createApiResponse(z.array(UserSchema), "Success"),
});

userRouter.get(
  "/",
  authenticate,
  authorize(["admin"]),
  userController.getUsers,
);

userRegistry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  request: { params: GetUserSchema.shape.params },
  responses: createApiResponse(UserSchema, "Success"),
});

userRouter.get(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest(GetUserSchema),
  userController.getUser,
);

userRegistry.registerPath({
  method: "put",
  path: "/users/change-password",
  tags: ["User"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChangePasswordSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ChangePasswordResponseSchema, "Success"),
});

userRouter.put("/change-password", authenticate, userController.changePassword);

userRegistry.registerPath({
  method: "put",
  path: "/users/change-avatar",
  tags: ["User"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            avatar: z.string().openapi({ type: "string", format: "binary" }),
          }),
        },
      },
    },
  },
  responses: createApiResponse(UserSchema, "Success"),
});

userRouter.put(
  "/change-avatar",
  authenticate,
  uploadAvatar.single("avatar"),
  userController.changeAvatar,
);


userRegistry.registerPath({
  method: "put",
  path: "/users/change-user-role",
  tags: ["User"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChangeUserRoleSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ChangeUserRoleResponseSchema, "Success"),
});
userRouter.put(
  "/change-user-role",
  authenticate,
  authorize(["admin"]),
  validateRequest(ChangeUserRoleSchema),
  userController.changeUserRole,
);
