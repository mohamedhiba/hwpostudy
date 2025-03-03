import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import prisma from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user?.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return user;
      }
    })
  ],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // @ts-ignore - Fixing "Binding element 'token' implicitly has an 'any' type" error
    session: ({ session, token }) => {
      if (token) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            totalStudyTime: token.totalStudyTime,
            totalTasksDone: token.totalTasksDone
          }
        };
      }
      return session;
    },
    // @ts-ignore - Fixing "Binding element 'token' implicitly has an 'any' type" error
    jwt: ({ token, user }) => {
      if (user) {
        return {
          ...token,
          id: user.id,
          totalStudyTime: user.totalStudyTime,
          totalTasksDone: user.totalTasksDone
        };
      }
      return token;
    }
  }
};

// @ts-ignore - Suppressing type errors with NextAuth configuration
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 