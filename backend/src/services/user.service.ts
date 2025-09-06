
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const createUserService = async (userData: any) => {
  const { first_name, last_name, email, password, age, education_level, goal, role } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash: hashedPassword,
      age,
      education_level,
      goal,
      role,
    },
  });

  return newUser;
};

export const getUserById = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
      age: true,
      education_level: true,
      goal: true,
      role: true,
      created_at: true,
    },
  });

  return user;
};

export const updateUserService = async (userId: number, userData: any) => {
  const { password, ...dataToUpdate } = userData;

  if (password) {
    dataToUpdate.password_hash = await bcrypt.hash(password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { user_id: userId },
    data: dataToUpdate,
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
      age: true,
      education_level: true,
      goal: true,
      role: true,
      created_at: true,
    },
  });

  return updatedUser;
};
