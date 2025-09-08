
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const createUserService = async (userData: any) => {
  const { first_name, last_name, email, password, age, education_level, goal, role = 'student', gender, math_level } = userData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const parsedAge = parseInt(age, 10);
  if (isNaN(parsedAge)) {
    throw new Error('Invalid age provided');
  }

  const newUser = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash: hashedPassword,
      age: parsedAge,
      education_level,
      goal,
      role,
      gender,
      math_level,
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

export const updatePasswordService = async (userId: number, passwordData: any) => {
  const { currentPassword, newPassword } = passwordData;

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Invalid current password');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { user_id: userId },
    data: { password_hash: hashedNewPassword },
  });
};
