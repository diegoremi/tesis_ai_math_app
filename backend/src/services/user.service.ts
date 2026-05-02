
import bcrypt from 'bcrypt';
import { autoAssignParticipant } from './study.service.js';
import { prisma } from '../lib/prisma.js';

export const createUserService = async (userData: any) => {
  const { first_name, last_name, email, password, age, education_level, goal, gender, math_level, agree_terms } = userData;
  const role = 'student';

  if (!agree_terms) {
    throw new Error('User must agree to terms and conditions');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const parsedAge = age !== undefined && age !== null ? Number.parseInt(age, 10) : null;
  if (age !== undefined && age !== null && Number.isNaN(parsedAge)) {
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

  try {
    await autoAssignParticipant(newUser.user_id);
  } catch (error) {
    console.error('autoAssignParticipant failed', error);
  }

  // Auto-record consent since user accepted terms during registration
  try {
    await prisma.consent.create({
      data: {
        user_id: newUser.user_id,
        document_version: 'v1',
        accepted: true,
      },
    });
  } catch (error) {
    console.error('Auto-consent recording failed', error);
  }

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
      gender: true,
      math_level: true,
    },
  });

  return user;
};

export const updateUserService = async (userId: number, userData: any) => {
  const { password, role, participant_code, email, ...rest } = userData;

  const dataToUpdate: Record<string, unknown> = {};

  const allowedFields = ['first_name', 'last_name', 'age', 'education_level', 'goal', 'gender', 'math_level'];
  for (const field of allowedFields) {
    if (rest[field] !== undefined) {
      dataToUpdate[field] = rest[field];
    }
  }

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
