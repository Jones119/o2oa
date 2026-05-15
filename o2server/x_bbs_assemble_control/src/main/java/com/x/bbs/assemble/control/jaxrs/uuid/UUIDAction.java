package com.x.bbs.assemble.control.jaxrs.uuid;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.AsyncResponse;
import jakarta.ws.rs.container.Suspended;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.http.HttpMediaType;
import com.x.base.core.project.jaxrs.ResponseFactory;
import com.x.base.core.project.jaxrs.StandardJaxrsAction;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

/**
 * 该类旨在提供一个服务创建唯一的UNID
 */
@Path("uuid")
public class UUIDAction extends StandardJaxrsAction {

	private static Logger logger = LoggerFactory.getLogger(UUIDAction.class);

	// @HttpMethodDescribe(value = "根据随机ID的.", response = JsonElement.class)
	@GET
	@Path("random")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void getUUID(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request) {
		ActionResult<List<String>> result = new ActionResult<>();
		List<String> data = new ArrayList<String>();
		String uuid = null;
		EffectivePerson currentPerson = this.effectivePerson(request);
		try {
			uuid = UUID.randomUUID().toString();
			data.add(uuid);
			result.setData(data);
		} catch (Exception e) {
			logger.warn(STR."user[\{currentPerson.getDistinguishedName()}] get a new UUID error！", e);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}
}