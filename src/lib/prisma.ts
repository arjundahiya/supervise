import { PrismaClient } from "@/app/generated/client"
import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

const createPrismaClient = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  })
  
  const client = new PrismaClient({ adapter })
  
  if (process.env.NODE_ENV === 'production') {
    // Extend with Accelerate in production
    return client.$extends(withAccelerate())
  }
  
  return client
}

const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma