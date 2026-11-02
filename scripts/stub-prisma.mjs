// Minimal stand-in for the Prisma client: every lookup finds nothing.
export const prisma = {
  user: {
    findUnique: async () => null,
    create: async () => {
      throw new Error("stub prisma: create is not supported");
    },
  },
};
