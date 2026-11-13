import { Comment } from "../model/Comment.js";
import { Post } from "../model/postModel.js";
import { User } from "../model/User.js";

const MAX_DAYS = 90;

const parseDays = (value) => {
  if (value === undefined) return 30;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const days = Number(value);
  return Number.isSafeInteger(days) && days >= 1 && days <= MAX_DAYS
    ? days
    : null;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

export const getCreatorAnalytics = async (req, res) => {
  const days = parseDays(req.query.days);
  if (days === null) {
    return res.status(400).json({
      success: false,
      message: `The days parameter must be an integer from 1 to ${MAX_DAYS}.`,
    });
  }

  try {
    const creatorId = req.user?._id;
    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const today = new Date();
    const end = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)
    );
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days);

    const [creator, [analytics = {}]] = await Promise.all([
      User.findById(creatorId).select("followers followerHistory createdAt").lean(),
      Post.aggregate([
        { $match: { author: creatorId } },
        {
          $project: {
            caption: 1,
            createdAt: 1,
            likes: 1,
          },
        },
        {
          $lookup: {
            from: Comment.collection.name,
            let: { postId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$post", "$$postId"] } } },
              { $count: "count" },
            ],
            as: "commentTotals",
          },
        },
        {
          $lookup: {
            from: Comment.collection.name,
            let: { postId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$post", "$$postId"] },
                      { $gte: ["$createdAt", start] },
                      { $lt: ["$createdAt", end] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$createdAt",
                      timezone: "UTC",
                    },
                  },
                  count: { $sum: 1 },
                },
              },
            ],
            as: "dailyCommentTotals",
          },
        },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalPosts: { $sum: 1 },
                  totalLikes: {
                    $sum: { $size: { $ifNull: ["$likes", []] } },
                  },
                  totalComments: {
                    $sum: {
                      $ifNull: [{ $arrayElemAt: ["$commentTotals.count", 0] }, 0],
                    },
                  },
                },
              },
            ],
            dailyComments: [
              { $unwind: "$dailyCommentTotals" },
              {
                $group: {
                  _id: "$dailyCommentTotals._id",
                  comments: { $sum: "$dailyCommentTotals.count" },
                },
              },
            ],
            topPosts: [
              {
                $addFields: {
                  likesCount: { $size: { $ifNull: ["$likes", []] } },
                  commentsCount: {
                    $ifNull: [{ $arrayElemAt: ["$commentTotals.count", 0] }, 0],
                  },
                },
              },
              {
                $addFields: {
                  engagement: { $add: ["$likesCount", "$commentsCount"] },
                },
              },
              { $sort: { engagement: -1, createdAt: -1, _id: 1 } },
              { $limit: 10 },
              {
                $project: {
                  _id: 0,
                  postId: "$_id",
                  caption: 1,
                  createdAt: 1,
                  likes: "$likesCount",
                  comments: "$commentsCount",
                  engagement: 1,
                },
              },
            ],
          },
        },
      ]),
    ]);

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator not found.",
      });
    }

    const summary = analytics.summary?.[0] ?? {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
    };
    const commentsByDate = new Map(
      (analytics.dailyComments ?? []).map(({ _id, comments }) => [_id, comments])
    );
    const daily = [];

    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + offset);
      const dateLabel = formatDate(date);
      daily.push({
        date: dateLabel,
        likes: null,
        comments: commentsByDate.get(dateLabel) ?? 0,
        engagement: null,
      });
    }

    const totalEngagement = summary.totalLikes + summary.totalComments;
    const followerSnapshots = (creator.followerHistory || [])
      .filter(({ date }) => date >= start && date < end)
      .sort((first, second) => first.date - second.date)
      .map(({ date, count }) => ({ date: formatDate(date), count }));

    return res.json({
      success: true,
      data: {
        range: {
          days,
          startDate: formatDate(start),
          endDate: formatDate(new Date(end.getTime() - 1)),
          timezone: "UTC",
        },
        summary: {
          totalPosts: summary.totalPosts,
          totalLikes: summary.totalLikes,
          totalComments: summary.totalComments,
          totalEngagement,
        },
        daily,
        topPosts: analytics.topPosts ?? [],
        followerGrowth: {
          available: followerSnapshots.length > 0,
          currentFollowers: creator.followers?.length ?? 0,
          accountCreatedAt: creator.createdAt,
          series: followerSnapshots,
          reason: followerSnapshots.length
            ? "Follower snapshots are recorded from the time analytics tracking was enabled."
            : "Follower growth tracking starts with the first follow or unfollow event after this feature was enabled.",
        },
        availability: {
          dailyLikes: false,
          dailyEngagement: false,
          dailyLikesReason:
            "Post likes have no per-like timestamps, so historical daily likes cannot be derived.",
        },
      },
    });
  } catch (error) {
    console.error("Creator analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load creator analytics.",
    });
  }
};
