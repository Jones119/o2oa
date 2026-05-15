package com.x.jpush.assemble.control.jaxrs.message;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.AsyncResponse;
import jakarta.ws.rs.container.Suspended;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import com.google.gson.JsonElement;
import com.x.base.core.project.annotation.JaxrsDescribe;
import com.x.base.core.project.annotation.JaxrsMethodDescribe;
import com.x.base.core.project.annotation.JaxrsParameterDescribe;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.HttpMediaType;
import com.x.base.core.project.jaxrs.ResponseFactory;
import com.x.base.core.project.jaxrs.StandardJaxrsAction;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

@Path("message")
@JaxrsDescribe("极光推送消息服务模块")
public class MessageAction extends StandardJaxrsAction {

	private static Logger logger = LoggerFactory.getLogger(MessageAction.class);

	@JaxrsMethodDescribe(value = "测试发送消息", action = ActionSendMessage.class)
	@POST
	@Path("test/send")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void sendMessageTest(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request,
			@JaxrsParameterDescribe("发送的消息内容") JsonElement jsonElement) {

		ActionResult<ActionSendMessageTest.Wo> result = new ActionResult<>();
		try {
			result = new ActionSendMessageTest().execute(request, this.effectivePerson(request), jsonElement);
		} catch (Exception e) {
			result = new ActionResult<>();
			Exception exception = new ExceptionSendMessage(e, "发送测试消息时发生异常！");
			result.error(exception);
			logger.error(e, this.effectivePerson(request), request, null);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

	@JaxrsMethodDescribe(value = "发送消息", action = ActionSendMessage.class)
	@POST
	@Path("send")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void sendMessage(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request,
			@JaxrsParameterDescribe("发送的消息内容") JsonElement jsonElement) {
		ActionResult<ActionSendMessage.Wo> result = new ActionResult<>();
		try {
			result = new ActionSendMessage().execute(jsonElement);
		} catch (Exception e) {
			result = new ActionResult<>();
			Exception exception = new ExceptionSendMessage(e, "发送消息时发生异常！");
			result.error(exception);
			logger.error(e, this.effectivePerson(request), request, null);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

}
