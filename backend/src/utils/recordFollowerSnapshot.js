import { User } from "../model/User.js";

export const recordFollowerSnapshot = async (userId) => {
  const user = await User.findById(userId).select("followers").lean();
  if (!user) return;
  await User.updateOne(
    { _id: userId },
    { $push: { followerHistory: { $each: [{ date: new Date(), count: user.followers.length }], $slice: -365 } } }
  );
};
