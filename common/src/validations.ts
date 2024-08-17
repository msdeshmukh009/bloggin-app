import { z } from "zod";

const signupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const blogSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(3),
});

export { signupSchema, signinSchema, blogSchema };

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type BlogInput = z.infer<typeof blogSchema>;
