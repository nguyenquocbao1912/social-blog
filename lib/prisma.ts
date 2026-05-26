import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (error) {
          // Ghi log chi tiết trên server cho dev
          console.error(`[Prisma Error] ${model}.${operation}:`, error);
          
          // Ném lỗi generic ra ngoài để giấu stack trace/thông tin DB
          throw new Error("Database operation failed");
        }
      },
    },
  });
};

export type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

export const prisma = globalForPrisma.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma as any
}