package com.x.cms.assemble.control.jaxrs.permission;

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

@Path("permission/management")
@JaxrsDescribe("文档权限操作服务（管理员）")
public class PermissionManagerAction extends StandardJaxrsAction {

	private static  Logger logger = LoggerFactory.getLogger( PermissionManagerAction.class );

	@JaxrsMethodDescribe(value = "重新计算所有文档的权限信息.", action = ActionRefreshAllDocumentPermission.class)
	@GET
	@Path("refresh/all")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void refreshAllDocument( @Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request ) {
		EffectivePerson effectivePerson = this.effectivePerson( request );
		ActionResult<ActionRefreshAllDocumentPermission.Wo> result = new ActionResult<>();
		Boolean check = true;
		if( check ){
			try {
				result = new ActionRefreshAllDocumentPermission().execute( request, effectivePerson );
			} catch (Exception e) {
				result = new ActionResult<>();
				Exception exception = new ExceptionAppCategoryAdminProcess( e, "查询登录用户是否指定栏目的管理员时发生异常。" );
				result.error( exception );
				logger.error( e, effectivePerson, request, null);
			}
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

	@JaxrsMethodDescribe(value = "重新计算指定分类文档的权限信息.", action = ActionRefreshCategoryDocPermission.class)
	@GET
	@Path("refresh/category/{categoryId}")
	@Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
	@Consumes(MediaType.APPLICATION_JSON)
	public void refreshCategoryDocument( @Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request,
										 @JaxrsParameterDescribe("分类ID") @PathParam("categoryId") String categoryId ) {
		EffectivePerson effectivePerson = this.effectivePerson( request );
		ActionResult<ActionRefreshCategoryDocPermission.Wo> result = new ActionResult<>();
		Boolean check = true;
		if( check ){
			try {
				result = new ActionRefreshCategoryDocPermission().execute( request, effectivePerson, categoryId);
			} catch (Exception e) {
				result = new ActionResult<>();
				Exception exception = new ExceptionAppCategoryAdminProcess( e, "查询登录用户是否指定栏目的管理员时发生异常。" );
				result.error( exception );
				logger.error( e, effectivePerson, request, null);
			}
		}
		asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
	}

}