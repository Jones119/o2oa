package com.x.server.console.node;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map.Entry;
import java.util.concurrent.StructuredTaskScope;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;

import org.eclipse.jetty.quickstart.QuickStartWebApp;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.gzip.GzipHandler;

import com.google.gson.Gson;
import com.x.base.core.project.AbstractContext;
import com.x.base.core.project.Application;
import com.x.base.core.project.annotation.FieldDescribe;
import com.x.base.core.project.config.CenterServer;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.connection.CipherConnectionAction;
import com.x.base.core.project.exception.RunningException;
import com.x.base.core.project.gson.XGsonBuilder;
import com.x.base.core.project.jaxrs.WrapBoolean;
import com.x.base.core.project.jaxrs.WrapString;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.tools.ListTools;
import com.x.server.console.server.Servers;

public class RegistApplicationsEvent implements Event {

	private static Logger logger = LoggerFactory.getLogger(RegistApplicationsEvent.class);

	private static final Gson gson = XGsonBuilder.instance();

	public final String type = Event.TYPE_REGISTAPPLICATIONS;

	@Override
	public void execute() {
		this.execute(Servers.getApplicationServer());
	}

	public void execute(Server applicationServer) {
		try {
			if (BooleanUtils.isTrue(Servers.applicationServerIsStarted())
					&& (null != Config.resource_node_applications())) {
				List<Application> list = listApplication(applicationServer);
				if (ListTools.isEmpty(list)) {
					logger.warn("applications on node:{} is empty.", Config.node());
				}
				if (BooleanUtils.isTrue(Config.currentNode().getSelfHealthCheckEnable()) && (!this.healthCheck(list))) {
					logger.warn("health check result is false.");
					list.clear();
				}

				Req req = new Req();

				req.setServerTime(new Date());

				req.setNode(Config.node());

				req = new WrapString(gson.toJson(list));

				for (Entry<String, CenterServer> entry : Config.nodes().centerServers().orderedEntry()) {
					toCenter(entry, req);
				}

			}
		} catch (Exception e) {
			logger.error(e);
		}
	}

	private void toCenter(Entry<String, CenterServer> entry, Req req) {
		try {
			CipherConnectionAction
					.put(false, 2000, 4000,
							Config.url_x_program_center_jaxrs(entry, "center", "regist", "applications"), req)
					.getData(WrapBoolean.class);
		} catch (Exception e) {
			logger.warn("registerToCenter error, node:{}, message:{}.", entry.getKey(), e.getMessage());
		}
	}

	private List<Application> listApplication(Server applicationServer) throws Exception {
		List<Application> list = new ArrayList<>();
		GzipHandler gzipHandler = (GzipHandler) applicationServer.getHandler();
		HandlerList hanlderList = (HandlerList) gzipHandler.getHandler();
		for (Handler handler : hanlderList.getHandlers()) {
			if (QuickStartWebApp.class.isAssignableFrom(handler.getClass())) {
				QuickStartWebApp app = (QuickStartWebApp) handler;
				if (app.isStarted() && (!StringUtils.equalsIgnoreCase(app.getContextPath(), "/x_program_center"))
						&& (!StringUtils.equalsIgnoreCase(app.getContextPath(), "/"))) {
					try {
						list.add(gson.fromJson(
								app.getServletContext()
										.getAttribute(AbstractContext.SERVLETCONTEXT_ATTRIBUTE_APPLICATION).toString(),
								Application.class));
					} catch (Exception e) {
						logger.error(new RunningException("cannot read application attribute contextPath:{}.",
								app.getContextPath()));
					}
				}
			}
		}
		return list;
	}

	private boolean healthCheck(List<Application> list) {
		try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
			List<StructuredTaskScope.Subtask<Long>> subtasks = new ArrayList<>();
			for (Application o : list) {
				subtasks.add(scope.fork(() -> healthCheckTask(o)));
			}
			scope.joinUntil(Instant.now().plusSeconds(3));
			scope.throwIfFailed();
			long max = Long.MIN_VALUE;
			for (StructuredTaskScope.Subtask<Long> subtask : subtasks) {
				long difference = subtask.get();
				if (difference < 0) {
					return false;
				}
				max = Math.max(max, difference);
			}
			if (max > 2 * 1000) {
				logger.warn("response time is too long: {}ms.", max);
			}
		} catch (Exception e) {
			logger.error(new RunningException(e, "health check error."));
			Thread.currentThread().interrupt();
			return false;
		}
		return true;
	}

	private Long healthCheckTask(Application application) {
		try {
			Resp resp = CipherConnectionAction.get(false, 2000, 4000, application, "echo").getData(Resp.class);
			Date date = resp.getServerTime();
			return Math.abs(date.getTime() - ((new Date()).getTime()));
		} catch (Exception e) {
			logger.error(new RunningException(e, "health check failure:{},{}.", application.getNode(),
					application.getContextPath()));
		}
		return -1L;
	}

	public static class Resp {

		@FieldDescribe("上下文根")
		private String servletContextName;

		@FieldDescribe("服务器时间")
		private Date serverTime;

		public String getServletContextName() {
			return servletContextName;
		}

		public void setServletContextName(String servletContextName) {
			this.servletContextName = servletContextName;
		}

		public Date getServerTime() {
			return serverTime;
		}

		public void setServerTime(Date serverTime) {
			this.serverTime = serverTime;
		}

	}

	public static class Req extends WrapString {

		private static final long serialVersionUID = -2855209663719641934L;

		@FieldDescribe("节点名")
		private String node;

		@FieldDescribe("服务器时间")
		private Date serverTime;

		public String getNode() {
			return node;
		}

		public void setNode(String node) {
			this.node = node;
		}

		public Date getServerTime() {
			return serverTime;
		}

		public void setServerTime(Date serverTime) {
			this.serverTime = serverTime;
		}

	}

}
