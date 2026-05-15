package com.x.attendance.assemble.control.jaxrs.qywx;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
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
import com.x.base.core.project.jaxrs.WrapBoolean;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

@Path("qywx")
@JaxrsDescribe("企业微信打卡数据管理（已弃用）")
public class QywxAttendanceAction  extends StandardJaxrsAction {

    private static final Logger logger = LoggerFactory.getLogger(QywxAttendanceAction.class);


    //删除所有打卡数据
    @JaxrsMethodDescribe(value = "删除所有打卡数据", action = ActionDeleteAllQywxAttendanceData.class)
    @DELETE
    @Path("all")
    @Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
    @Consumes(MediaType.APPLICATION_JSON)
    public void deleteAllData(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request) {
        ActionResult<WrapBoolean> result = new ActionResult<>();
        EffectivePerson effectivePerson = this.effectivePerson(request);
        try {
            result = new ActionDeleteAllQywxAttendanceData().execute(effectivePerson);
        }catch (Exception e) {
            logger.error(e, effectivePerson, request, null);
            result.error(e);
        }
        asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
    }


    //
    @JaxrsMethodDescribe(value = "同步企业微信考勤结果", action = ActionSyncQywxData.class)
    @GET
    @Path("sync/from/{dateFrom}/to/{dateTo}/start")
    @Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
    @Consumes(MediaType.APPLICATION_JSON)
    public void syncData(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request,
                         @JaxrsParameterDescribe("开始时间: yyyy-MM-dd") @PathParam("dateFrom") String dateFrom,
                         @JaxrsParameterDescribe("结束时间: yyyy-MM-dd") @PathParam("dateTo") String dateTo) {
        ActionResult<WrapBoolean> result = new ActionResult<>();
        EffectivePerson effectivePerson = this.effectivePerson(request);
        try {
            result = new ActionSyncQywxData().execute(effectivePerson, dateFrom, dateTo);
        }catch (Exception e) {
            logger.error(e, effectivePerson, request, null);
            result.error(e);
        }
        asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
    }

    @JaxrsMethodDescribe(value = "查询企业微信同步记录信息", action = ActionListQywxSyncRecord.class)
    @GET
    @Path("sync/list")
    @Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
    @Consumes(MediaType.APPLICATION_JSON)
    public void listDingdingSyncRecord(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request) {
        ActionResult<List<ActionListQywxSyncRecord.Wo>> result = new ActionResult<>();
        EffectivePerson effectivePerson = this.effectivePerson(request);
        try {
            result = new ActionListQywxSyncRecord().execute(effectivePerson);
        }catch (Exception e) {
            logger.error(e, effectivePerson, request, null);
            result.error(e);
        }
        asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
    }

    @JaxrsMethodDescribe(value = "查询企业微信打卡结果", action = ActionListQywxAttendanceDetail.class)
    @PUT
    @Path("attendance/list/{id}/next/{count}")
    @Produces(HttpMediaType.APPLICATION_JSON_UTF_8)
    @Consumes(MediaType.APPLICATION_JSON)
    public void listDingdingAttendance(@Suspended final AsyncResponse asyncResponse, @Context HttpServletRequest request,
                                       @JaxrsParameterDescribe("最后一条数据ID") @PathParam("id") String id,
                                       @JaxrsParameterDescribe("每页显示的条目数量") @PathParam("count") Integer count,
                                       JsonElement jsonElement) {
        ActionResult<List<ActionListQywxAttendanceDetail.Wo>> result = new ActionResult<>();
        EffectivePerson effectivePerson = this.effectivePerson(request);
        try {
            result = new ActionListQywxAttendanceDetail().execute(effectivePerson, id, count, jsonElement);
        }catch (Exception e) {
            logger.error(e, effectivePerson, request, null);
            result.error(e);
        }
        asyncResponse.resume(ResponseFactory.getEntityTagActionResultResponse(request, result));
    }
}
