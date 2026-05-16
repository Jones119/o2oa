package com.x.general.assemble.control.jaxrs.upgrade;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.AsyncResponse;
import jakarta.ws.rs.container.Suspended;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import com.x.base.core.project.annotation.JaxrsDescribe;
import com.x.base.core.project.annotation.JaxrsMethodDescribe;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.http.HttpMediaType;
import com.x.base.core.project.jaxrs.ResponseFactory;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

@Path("upgrade")
@JaxrsDescribe("升级")
public class UpgradeAction extends BaseAction {

	private static Logger logger = LoggerFactory.getLogger(UpgradeAction.class);

	@JaxrsMethodDescribe(value = "在流程引擎路由中增加字段defaultSelected,将defaultSelected的值直接设置成sole的值.", action = Action2021090901.class)
	@GET
	@Path("2021090901")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void action2021090901(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request) {
		ActionResult<Action2021090901.Wo> result = new ActionResult<>();
		EffectivePerson effectivePerson = this.effectivePerson(request);
		try {
			result = new Action2021090901().execute(effectivePerson);
		} catch (Exception e) {
			logger.error(e, effectivePerson, request, null);
			result.error(e);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

	@JaxrsMethodDescribe(value = "在流程引擎路由中将route.getProperties().getSoleDirect()的值强制全部设置为false.", action = Action2021090902.class)
	@GET
	@Path("2021090902")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void action2021090902(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request) {
		ActionResult<Action2021090902.Wo> result = new ActionResult<>();
		EffectivePerson effectivePerson = this.effectivePerson(request);
		try {
			result = new Action2021090902().execute(effectivePerson);
		} catch (Exception e) {
			logger.error(e, effectivePerson, request, null);
			result.error(e);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

}