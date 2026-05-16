package com.x.server.console.server.web;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.eclipse.jetty.client.Request;
import org.eclipse.jetty.http.HttpHeader;
import org.eclipse.jetty.ee10.proxy.ProxyServlet;

import com.x.base.core.project.tools.EscapeStringTools;

public class Proxy extends ProxyServlet {

	private static final long serialVersionUID = 2737360000716631564L;
	private static final String X_Real_IP = "X-Real-IP";

	@Override
	public void init() throws ServletException {
		super.init();
		// 如果没有扩大requestBufferSize那么会有下面的报错.默认为4096增加到32K
		// 把responseBufferSize也增加到32K,默认16K.
		// {
		// "servlet":"com.x.server.console.server.web.Proxy-2d14237e",
		// "message":"Bad Gateway",
		// "url":"/x_program_center/jaxrs/distribute/assemble/source/abc.com",
		// "status":"502"
		// }
		this.getHttpClient().setRequestBufferSize(1024 * 32);
		this.getHttpClient().setResponseBufferSize(1024 * 32);
	}

	@Override
	protected String rewriteTarget(HttpServletRequest request) {
		String url = EscapeStringTools.escapeURLQuery(request.getRequestURL().toString());
		if(url==null){
			url = request.getRequestURL().toString();
		}
		String parameter = EscapeStringTools.escapeURLQuery(request.getQueryString());
		if (parameter == null){
			parameter = request.getQueryString();
		}
		return target(url, parameter, this.getServletConfig().getInitParameter("port"));

	}

	private String target(String url, String parameter, String port) {
		int x = StringUtils.indexOf(url, "://");
		int y = StringUtils.indexOf(url, "/", 8);
		if ((x > 0) && (y > 0)) {
			return url.substring(0, x + 3) + "127.0.0.1" + port(url, port) + url.substring(y)
					+ (StringUtils.isBlank(parameter) ? "" : "?" + parameter);
		} else {
			return null;
		}
	}

//	private String target(String url, String parameter, String port) {
//		int x = StringUtils.indexOf(url, ":", 8);
//		int y = StringUtils.indexOf(url, "/", 8);
//		if ((x > 0) && (y > 0)) {
//			return url.substring(0, x) + port(url, port) + url.substring(y)
//					+ (StringUtils.isBlank(parameter) ? "" : "?" + parameter);
//		} else if (y > 0) {
//			return url.substring(0, y) + port(url, port) + url.substring(y)
//					+ (StringUtils.isBlank(parameter) ? "" : "?" + parameter);
//		} else {
//			return null;
//		}
//	}

	private String port(String url, String port) {
		if (StringUtils.startsWithIgnoreCase(url, "https://") || StringUtils.startsWithIgnoreCase(url, "wss://")) {
			if (StringUtils.equals(port, "443")) {
				return "";
			}
		} else if (StringUtils.startsWithIgnoreCase(url, "http://") || StringUtils.startsWithIgnoreCase(url, "ws://")) {
			if (StringUtils.equals(port, "80")) {
				return "";
			}
		}
		return ":" + port;
	}

	@Override
	protected void addProxyHeaders(HttpServletRequest clientRequest, Request proxyRequest) {
		if (StringUtils.isNotEmpty(clientRequest.getHeader(HttpHeader.X_FORWARDED_FOR.asString()))) {
			proxyRequest.headers(headers -> headers.put(HttpHeader.X_FORWARDED_FOR,
					clientRequest.getHeader(HttpHeader.X_FORWARDED_FOR.asString())));
		} else {
			proxyRequest.headers(headers -> headers.put(HttpHeader.X_FORWARDED_FOR, clientRequest.getRemoteAddr()));
		}
		if (StringUtils.isNotEmpty(clientRequest.getHeader(HttpHeader.X_FORWARDED_PROTO.asString()))) {
			proxyRequest.headers(headers -> headers.put(HttpHeader.X_FORWARDED_PROTO,
					clientRequest.getHeader(HttpHeader.X_FORWARDED_PROTO.asString())));
		} else {
			proxyRequest.headers(headers -> headers.put(HttpHeader.X_FORWARDED_PROTO, clientRequest.getScheme()));
		}
		if (StringUtils.isNotEmpty(clientRequest.getHeader(HttpHeader.X_FORWARDED_HOST.asString()))) {
			proxyRequest.headers(headers -> headers.put(HttpHeader.X_FORWARDED_HOST,
					clientRequest.getHeader(HttpHeader.X_FORWARDED_HOST.asString())));
		} else {
			proxyRequest.headers(headers -> headers.put(HttpHeader.X_FORWARDED_HOST, clientRequest.getHeader(HttpHeader.HOST.asString())));
		}
		if (StringUtils.isNotEmpty(clientRequest.getHeader(HttpHeader.X_FORWARDED_SERVER.asString()))) {
			proxyRequest.headers(headers -> headers.put(HttpHeader.X_FORWARDED_SERVER,
					clientRequest.getHeader(HttpHeader.X_FORWARDED_SERVER.asString())));
		} else {
			proxyRequest.headers(headers -> headers.put(HttpHeader.X_FORWARDED_SERVER, clientRequest.getLocalName()));
		}

		if (StringUtils.isNotEmpty(clientRequest.getHeader(HttpHeader.HOST.asString()))) {
			proxyRequest.headers(headers -> headers.put(HttpHeader.HOST, clientRequest.getHeader(HttpHeader.HOST.asString())));
		}

		if (StringUtils.isNotEmpty(clientRequest.getHeader(X_Real_IP))) {
			proxyRequest.headers(headers -> headers.put(X_Real_IP, clientRequest.getHeader(X_Real_IP)));
		} else {
			proxyRequest.headers(headers -> headers.put(X_Real_IP, clientRequest.getRemoteAddr()));
		}

		if (StringUtils.isNotEmpty(clientRequest.getHeader(HttpHeader.SEC_WEBSOCKET_VERSION.asString()))) {
			proxyRequest.headers(headers -> headers.put(HttpHeader.SEC_WEBSOCKET_VERSION,
					clientRequest.getHeader(HttpHeader.SEC_WEBSOCKET_VERSION.asString())));
		}

	}

}
