import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { environment } from "../config/environment.js";

const adapter = new PrismaPg({ connectionString: environment.databaseUrl });

export const prisma = new PrismaClient({ adapter });
