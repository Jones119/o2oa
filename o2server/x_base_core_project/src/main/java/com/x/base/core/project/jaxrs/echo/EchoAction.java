package com.x.base.core.project.jaxrs.echo;

import jakarta.servlet.ServletContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.container.AsyncResponse;
import jakarta.ws.rs.container.Suspended;
import jakarta.ws.rs.core.Context;

import com.x.base.core.project.annotation.DescribeScope;
import com.x.base.core.project.annotation.JaxrsDescribe;
import com.x.base.core.project.annotation.JaxrsMethodDescribe;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.ResponseFactory;
import com.x.base.core.project.jaxrs.StandardJaxrsAction;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "EchoAction", description = "应用响应接口.")
@Path("echo")
@JaxrsDescribe(value = "应用响应接口.", scope = DescribeScope.system)
public class EchoAction extends StandardJaxrsAction {

	private static final String OPERATIONID_PREFIX = "EchoAction::";

	private static final Logger LOGGER = LoggerFactory.getLogger(EchoAction.class);

	@Operation(summary = "获取应答.", operationId = OPERATIONID_PREFIX + "get", responses = {
			@ApiResponse(content = @Content(schema = @Schema(implementation = ActionGet.Wo.class))) })
	@JaxrsMethodDescribe(value = "获取应答.", action = ActionGet.class)
	@GET
	public void get(@Suspended final AsyncResponse asyncResponse, @Context ServletContext servletContext,
			@Context HttpServletRequest request) {
		ActionResult<ActionGet.Wo> result = new ActionResult<>();
		EffectivePerson effectivePerson = this.effectivePerson(request);
		try {
			result = new ActionGet().execute(effectivePerson, servletContext);
		} catch (Exception e) {
			LOGGER.error(e, effectivePerson, request, null);
			result.error(e);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}
}