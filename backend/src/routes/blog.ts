import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { jwt, sign } from "hono/jwt";
import { blogSchema } from "@maheshdesh/blogging-common";

const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
  });

  return jwtMiddleware(c, next);
});

blogRouter.post("/", async c => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const reqBody = await c.req.json();
    const parsedBody = blogSchema.safeParse(reqBody);

    if (!parsedBody.success) {
      return c.json(parsedBody.error, 400);
    }

    const { title, content } = parsedBody.data;

    const blog = await prisma.post.create({
      data: {
        title,
        content,
        authorId: c.get("jwtPayload").id,
      },
    });

    if (blog === null) {
      return c.json({ message: "Error creating blog" }, 400);
    }

    return c.json({ message: "Blog created successfully", blog }, 201);
  } catch (error) {
    return c.json({ message: "Error creating blog" }, 500);
  }
});

blogRouter.put("/:id", async c => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const reqBody = await c.req.json();
    const parsedBody = blogSchema.safeParse(reqBody);

    if (!parsedBody.success) {
      return c.json(parsedBody.error, 400);
    }

    const { title, content } = parsedBody.data;

    const blog = await prisma.post.update({
      where: {
        id: c.req.param("id"),
      },
      data: {
        title,
        content,
      },
    });

    if (blog === null) {
      return c.json({ message: "Error updating blog" }, 400);
    }

    return c.json({ message: "Blog updated successfully", blog }, 201);
  } catch (error) {
    return c.json({ message: "Error updating blog" }, 500);
  }
});

blogRouter.get("/bulk", async c => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.post.findMany();

    if (blog === null) {
      return c.json({ message: "Blog not found" }, 400);
    }

    return c.json({ message: "Success", blog }, 200);
  } catch (error) {
    return c.json({ message: "Blog not found" }, 500);
  }
});

blogRouter.get("/:id", async c => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.post.findFirst({
      where: {
        id: c.req.param("id"),
      },
      select: {
        title: true,
        content: true,
        author: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (blog === null) {
      return c.json({ message: "Blog not found" }, 400);
    }

    return c.json({ message: "Success", blog }, 200);
  } catch (error) {
    return c.json({ message: "Blog not found" }, 500);
  }
});

export default blogRouter;
