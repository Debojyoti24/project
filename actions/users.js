// "use server";

// import { db } from "@/lib/prisma";
// import { auth, clerkClient } from "@clerk/nextjs/server";

// export async function updateUsername(username) {
//   const { userId } = auth();
//   if (!userId) {
//     throw new Error("Unauthorized");
//   }

//   // Check if username is already taken
//   const existingUser = await db.user.findUnique({
//     where: { username },
//   });

//   if (existingUser && existingUser.id !== userId) {
//     throw new Error("Username is already taken");
//   }

//   // Update username in database
//   await db.user.update({
//     where: { clerkUserId: userId },
//     data: { username },
//   });

//   // Update username in Clerk
//   await clerkClient.users.updateUser(userId, {
//     username,
//   });

//   return { success: true };
// }

// export async function getUserByUsername(username) {
//   const user = await db.user.findUnique({
//     where: { username },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       imageUrl: true,
//       events: {
//         where: {
//           isPrivate: false,
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//         select: {
//           id: true,
//           title: true,
//           description: true,
//           duration: true,
//           isPrivate: true,
//           _count: {
//             select: { bookings: true },
//           },
//         },
//       },
//     },
//   });

//   return user;
// }

// p->02
// "use server";

// import { db } from "@/lib/prisma";
// import { auth, clerkClient } from "@clerk/nextjs/server";

// export async function updateUsername(username) {
//   // Fix 1: Await the auth() function call
//   const { userId } = await auth();

//   if (!userId) {
//     throw new Error("Unauthorized");
//   }

//   // Fix 2: Add input validation
//   if (!username || typeof username !== "string") {
//     throw new Error("Invalid username");
//   }

//   const trimmedUsername = username.trim();

//   if (trimmedUsername.length < 2 || trimmedUsername.length > 50) {
//     throw new Error("Username must be between 2 and 50 characters");
//   }

//   // Check if username is already taken
//   const existingUser = await db.user.findUnique({
//     where: { username: trimmedUsername },
//   });

//   if (existingUser && existingUser.clerkUserId !== userId) {
//     throw new Error("Username is already taken");
//   }

//   // Fix 3: Wrap in try-catch for better error handling
//   try {
//     // Update username in database
//     await db.user.update({
//       where: { clerkUserId: userId },
//       data: { username: trimmedUsername },
//     });

//     // Fix 4: Await clerkClient initialization and update
//     const client = await clerkClient();
//     await client.users.updateUser(userId, {
//       username: trimmedUsername,
//     });

//     return { success: true };
//   } catch (error) {
//     // Handle Prisma errors
//     if (error.code === "P2002") {
//       throw new Error("Username already exists");
//     }
//     if (error.code === "P2025") {
//       throw new Error("User not found");
//     }
//     throw error;
//   }
// }

// export async function getUserByUsername(username) {
//   const user = await db.user.findUnique({
//     where: { username },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       imageUrl: true,
//       events: {
//         where: {
//           isPrivate: false,
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//         select: {
//           id: true,
//           title: true,
//           description: true,
//           duration: true,
//           isPrivate: true,
//           _count: {
//             select: { bookings: true },
//           },
//         },
//       },
//     },
//   });

//   return user;
// }

//p->3

"use server";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function updateUsername(username) {
  try {
    // Must await auth()
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Input validation
    if (!username || typeof username !== "string") {
      return { success: false, error: "Invalid username" };
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 2 || trimmedUsername.length > 50) {
      return {
        success: false,
        error: "Username must be between 2 and 50 characters",
      };
    }

    // First, find the user by clerkUserId to ensure they exist
    const currentUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!currentUser) {
      return { success: false, error: "User not found in database" };
    }

    // Case-insensitive username check
    const existingUser = await db.user.findFirst({
      where: {
        username: {
          equals: trimmedUsername,
          mode: "insensitive",
        },
      },
    });

    // Check if username is taken by someone else
    if (existingUser && existingUser.clerkUserId !== userId) {
      return { success: false, error: "Username is already taken" };
    }

    // Update username in database using the correct identifier
    await db.user.update({
      where: {
        clerkUserId: userId, // Make sure this matches your schema
        // OR use: id: currentUser.id
      },
      data: { username: trimmedUsername },
    });

    // Update username in Clerk
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      username: trimmedUsername,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating username:", error);

    // Handle Prisma specific errors
    if (error.code === "P2002") {
      return { success: false, error: "Username already exists" };
    }
    if (error.code === "P2025") {
      return { success: false, error: "User record not found" };
    }

    return {
      success: false,
      error: "Failed to update username. Please try again.",
    };
  }
}

export async function getUserByUsername(username) {
  const user = await db.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      events: {
        where: {
          isPrivate: false,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          isPrivate: true,
          _count: {
            select: { bookings: true },
          },
        },
      },
    },
  });

  return user;
}
