package com.x.program.center.jaxrs.storagemappings;

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
import com.x.base.core.project.config.StorageMappings;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.HttpMediaType;
import com.x.base.core.project.jaxrs.ResponseFactory;
import com.x.base.core.project.jaxrs.StandardJaxrsAction;

@Path("storagemappings")
@JaxrsDescribe("存储映射")
public class StorageMappingsAction extends StandardJaxrsAction {

	@GET
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	@JaxrsMethodDescribe(value = "获取StorageMappings.", action = ActionGet.class)
	public void get(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request) {
		ActionResult<StorageMappings> result = new ActionResult<>();
		StorageMappings wrap = null;
		try {
			wrap = new ActionGet().execute();
			result.setData(wrap);
		} catch (Throwable th) {
			th.printStackTrace();
			result.error(th);
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

}