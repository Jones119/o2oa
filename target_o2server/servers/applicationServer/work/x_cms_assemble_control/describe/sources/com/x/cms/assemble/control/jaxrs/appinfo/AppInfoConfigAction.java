package com.x.cms.assemble.control.jaxrs.appinfo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
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
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.http.HttpMediaType;
import com.x.base.core.project.jaxrs.ResponseFactory;
import com.x.base.core.project.jaxrs.StandardJaxrsAction;
import com.x.base.core.project.jaxrs.WoText;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

@Path("appconfig")
@JaxrsDescribe("信息发布(CMS)-栏目配置支持信息(APPINFOCONFIG)管理服务")
public class AppInfoConfigAction extends StandardJaxrsAction {

	private static  Logger logger = LoggerFactory.getLogger(AppInfoConfigAction.class);

	@JaxrsMethodDescribe(value = "更新栏目配置支持信息，JSON格式。", action = ActionSaveConfig.class)
	@POST
	@Path("{appId}")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void save( @Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request,
					  @JaxrsParameterDescribe("栏目ID") @PathParam("appId") String appId,
					  JsonElement jsonElement ) {
		EffectivePerson effectivePerson = this.effectivePerson(request);
		ActionResult<ActionSaveConfig.Wo> result = new ActionResult<>();
		Boolean check = true;
		if (check) {
			try {
				result = new ActionSaveConfig().execute( request, effectivePerson, appId, jsonElement );
			} catch (Exception e) {
				result = new ActionResult<>();
				Exception exception = new ExceptionAppInfoProcess(e, "栏目信息保存时发生异常。");
				result.error(exception);
				logger.error(e, effectivePerson, request, null);
			}
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

	@JaxrsMethodDescribe(value = "根据栏目ID获取栏目配置支持信息对象.", action = ActionGetConfig.class)
	@GET
	@Path("{id}")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void get( @Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request, 
			@JaxrsParameterDescribe("栏目ID") @PathParam("id") String id) {
		EffectivePerson effectivePerson = this.effectivePerson(request);
		ActionResult<WoText> result = new ActionResult<>();
		try {
			result = new ActionGetConfig().execute( request, effectivePerson, id );
		} catch (Exception e) {
			result = new ActionResult<>();
			Exception exception = new ExceptionAppInfoProcess(e, "根据指定ID查询应用栏目配置支持信息时发生异常。id:" + id );
			result.error(exception);
			logger.error(e, effectivePerson, request, null);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}
}