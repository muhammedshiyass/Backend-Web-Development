//commentsService.js

exports.addComment = async (postId, userId, body) => {
  // checks first
  const post = await postsRepo.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  if (post.locked)
    throw new AppError('Post is locked for new comments', 409);

  // writes after, in order
  const comment = await commentsRepo.insert({ postId, authorId: userId, body });
  await postsRepo.incrementCommentCount(postId);

  return comment;
};