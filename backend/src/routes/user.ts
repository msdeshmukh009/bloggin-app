import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { jwt, sign } from "hono/jwt";
import { signinSchema, signupSchema } from "@maheshdesh/blogging-common";
import hashPassword from "../utils/hashing";

const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.get("/", c => {
  return c.text("Hello Hono!");
});

userRouter.post("/signup", async c => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const res = signupSchema.safeParse(body);

    if (!res.success) {
      return c.json(res.error, 400);
    }

    const { name, email, password } = res.data;

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ message: "User created successfully", token }, 201);
  } catch (error) {
    return c.json({ message: "Error creating user" }, 500);
  }
});

userRouter.post("/signin", async c => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const res = signinSchema.safeParse(body);

    if (!res.success) {
      return c.json(res.error, 400);
    }

    const { email, password } = res.data;

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.findUnique({
      where: {
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (user === null) {
      return c.json({ message: "User not found" }, 404);
    }

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ message: "User signed in successfully", token, user }, 200);
  } catch (error) {
    return c.json({ message: "Error singning in user" }, 500);
  }
});

export default userRouter;
