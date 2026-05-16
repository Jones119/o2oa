package com.x.processplatform.assemble.surface.jaxrs.anonymous;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.AsyncResponse;
import jakarta.ws.rs.container.Suspended;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import com.x.base.core.project.annotation.JaxrsDescribe;
import com.x.base.core.project.annotation.JaxrsMethodDescribe;
import com.x.base.core.project.annotation.JaxrsParameterDescribe;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.http.HttpMediaType;
import com.x.base.core.project.jaxrs.ResponseFactory;
import com.x.base.core.project.jaxrs.StandardJaxrsAction;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "AnonymousAction", description = "匿名接口.")
@Path("anonymous")
@JaxrsDescribe("匿名接口.")
public class AnonymousAction extends StandardJaxrsAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(AnonymousAction.class);
	private static final String OPERATIONID_PREFIX = "AnonymousAction::";

	@Operation(summary = "获取指定人员的待办数量,没有权限限制.", operationId = OPERATIONID_PREFIX + "taskCountWithPerson", responses = {
			@ApiResponse(content = {
					@Content(schema = @Schema(implementation = ActionTaskCountWithPerson.Wo.class)) }) })
	@JaxrsMethodDescribe(value = "获取指定人员的待办数量,没有权限限制.", action = ActionTaskCountWithPerson.class)
	@GET
	@Path("task/count/{credential}")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void taskCountWithPerson(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request,
			@JaxrsParameterDescribe("个人标识") @PathParam("credential") String credential) {
		ActionResult<ActionTaskCountWithPerson.Wo> result = new ActionResult<>();
		EffectivePerson effectivePerson = this.effectivePerson(request);
		try {
			result = new ActionTaskCountWithPerson().execute(effectivePerson, credential);
		} catch (Exception e) {
			LOGGER.error(e, effectivePerson, request, null);
			result.error(e);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

	@Operation(summary = "获取指定人员的待阅数量,没有权限限制.", operationId = OPERATIONID_PREFIX + "readCountWithPerson", responses = {
			@ApiResponse(content = {
					@Content(schema = @Schema(implementation = ActionReadCountWithPerson.Wo.class)) }) })
	@JaxrsMethodDescribe(value = "获取指定人员的待阅数量,没有权限限制.", action = ActionReadCountWithPerson.class)
	@GET
	@Path("read/count/{credential}")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void readCountWithPerson(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request,
			@JaxrsParameterDescribe("个人标识") @PathParam("credential") String credential) {
		ActionResult<ActionReadCountWithPerson.Wo> result = new ActionResult<>();
		EffectivePerson effectivePerson = this.effectivePerson(request);
		try {
			result = new ActionReadCountWithPerson().execute(effectivePerson, credential);
		} catch (Exception e) {
			LOGGER.error(e, effectivePerson, request, null);
			result.error(e);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

}
