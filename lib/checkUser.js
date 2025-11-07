// import { clerkClient, currentUser } from "@clerk/nextjs/server";
// import { db } from "@/lib/prisma";

// export const checkUser = async () => {
//   const user = await currentUser();

//   if (!user) {
//     return null;
//   }

//   try {
//     const loggedInUser = await db?.user.findUnique({
//       where: {
//         clerkUserId: user.id,
//       },
//     });

//     if (loggedInUser) {
//       return loggedInUser;
//     }

//     const name = `${user.firstName} ${user.lastName}`;

//     await clerkClient().users.updateUser(user.id, {
//       username: name.split(" ").join("-") + user.id.slice(-4),
//     });

//     const newUser = await db.user.create({
//       data: {
//         clerkUserId: user.id,
//         name,
//         imageUrl: user.imageUrl,
//         email: user.emailAddresses[0].emailAddress,
//         username: name.split(" ").join("-") + user.id.slice(-4),
//       },
//     });

//     return newUser;
//   } catch (error) {
//     console.log(error);
//   }
// };
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) return null;

  try {
    const loggedInUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (loggedInUser) return loggedInUser;

    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const safeUsername =
      (name || "user").toLowerCase().replace(/[^a-z0-9_-]/g, "-") +
      "-" +
      user.id.slice(-4);

    // ✅ No parentheses — correct Clerk client usage
    await clerkClient.users.updateUser(user.id, { username: safeUsername });

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        username: safeUsername,
      },
    });

    return newUser;
  } catch (error) {
    console.error("❌ Error in checkUser:", JSON.stringify(error, null, 2));
    if (error.errors) console.error("🔍 Clerk API errors:", error.errors);
    throw new Error("Failed to check or create user");
  }
};
