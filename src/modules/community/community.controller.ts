import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { auditAdminAction } from "../admin/admin.middleware.js";
import {
  adminReportUpdateSchema,
  commentParamsSchema,
  commentsSchema,
  communityPostCreateSchema,
  communityPostPatchSchema,
  outfitParamsSchema,
  postParamsSchema,
  postsQuerySchema,
  reportSchema
} from "./community.schema.js";
import * as service from "./community.service.js";

export async function createPost(request: FastifyRequest, reply: FastifyReply) {
  const input = communityPostCreateSchema.parse(request.body);
  const post = await service.createPost(request.user!.id, input);
  return ok(reply, "Community post created", { post }, 201);
}

export async function listPosts(request: FastifyRequest, reply: FastifyReply) {
  const input = postsQuerySchema.parse(request.query);
  const posts = await service.listPosts(input);
  return ok(reply, "Community posts fetched", { posts });
}

export async function getPost(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  const post = await service.getPost(request.user?.id ?? null, id);
  return ok(reply, "Community post fetched", { post });
}

export async function updatePost(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  const input = communityPostPatchSchema.parse(request.body);
  const post = await service.updatePost(request.user!.id, id, input);
  return ok(reply, "Community post updated", { post });
}

export async function deletePost(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  await service.deletePost(request.user!.id, id);
  return ok(reply, "Community post deleted");
}

export async function likePost(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  await service.likePost(request.user!.id, id);
  return ok(reply, "Community post liked");
}

export async function unlikePost(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  await service.unlikePost(request.user!.id, id);
  return ok(reply, "Community post unliked");
}

export async function savePost(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  await service.savePost(request.user!.id, id);
  return ok(reply, "Community post saved");
}

export async function unsavePost(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  await service.unsavePost(request.user!.id, id);
  return ok(reply, "Community post unsaved");
}

export async function addComment(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  const input = commentsSchema.parse(request.body);
  const comment = await service.addComment(request.user!.id, id, input.content);
  return ok(reply, "Comment added", { comment }, 201);
}

export async function listComments(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  const comments = await service.listComments(id);
  return ok(reply, "Comments fetched", { comments });
}

export async function deleteComment(request: FastifyRequest, reply: FastifyReply) {
  const { id } = commentParamsSchema.parse(request.params);
  await service.deleteComment(request.user!.id, id);
  return ok(reply, "Comment deleted");
}

export async function reportPost(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  const input = reportSchema.parse(request.body);
  const report = await service.reportPost(request.user!.id, id, input);
  return ok(reply, "Community post reported", { report }, 201);
}

export async function shareOutfit(request: FastifyRequest, reply: FastifyReply) {
  const { outfitId } = outfitParamsSchema.parse(request.params);
  const post = await service.shareOutfit(request.user!.id, outfitId);
  return ok(reply, "Outfit shared to community", { post }, 201);
}

export async function adminPosts(_request: FastifyRequest, reply: FastifyReply) {
  const posts = await service.adminListPosts();
  return ok(reply, "Admin community posts fetched", { posts });
}

export async function adminReports(_request: FastifyRequest, reply: FastifyReply) {
  const reports = await service.adminListReports();
  return ok(reply, "Admin community reports fetched", { reports });
}

export async function adminUpdateReport(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  const input = adminReportUpdateSchema.parse(request.body);
  const report = await service.adminUpdateReport(request.admin!.id, id, input);
  await auditAdminAction(request, {
    action: "COMMUNITY_REPORT_UPDATED",
    entity_type: "community_report",
    entity_id: id,
    metadata: input
  });
  return ok(reply, "Community report updated", { report });
}

export async function adminDeletePost(request: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(request.params);
  await service.deletePost(request.admin!.id, id, true);
  await auditAdminAction(request, {
    action: "COMMUNITY_POST_DELETED",
    entity_type: "community_post",
    entity_id: id
  });
  return ok(reply, "Community post deleted by admin");
}
