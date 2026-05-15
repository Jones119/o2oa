package com.x.base.core.project.jaxrs;

import java.io.IOException;
import java.lang.ScopedValue;

import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;

import com.x.base.core.project.config.Config;
import com.x.base.core.project.exception.ExceptionUnauthorized;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.http.FilterTools;
import com.x.base.core.project.http.HttpToken;
import com.x.base.core.project.http.TokenType;

/**
 * 必须由前台已经登陆的用户访问
 */
public abstract class ManagerUserJaxrsFilter extends TokenFilter {

	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
			throws IOException, ServletException {
		try {
			HttpServletRequest request = (HttpServletRequest) req;
			HttpServletResponse response = (HttpServletResponse) res;
			httpRequestCheck(request);
			FilterTools.allow(request, response);
			if (!request.getMethod().equalsIgnoreCase("options")) {
				HttpToken httpToken = new HttpToken();
				EffectivePerson effectivePerson = httpToken.who(request, response, Config.token().getCipher());
				if (TokenType.anonymous.equals(effectivePerson.getTokenType())) {
					/** 401 Unauthorized 未登录访问被拒绝 */
					response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
					response.setHeader("Content-Type", "application/json;charset=UTF-8");
					ActionResult result = new ActionResult();
					ExceptionUnauthorized e = new ExceptionUnauthorized();
					result.error(e);
					String message = e.getFormatMessage(result.getPrompt(), request.getHeader(ResponseFactory.Accept_Language));
					if(StringUtils.isNotBlank(message)) {
						result.setMessage(message);
					}
					response.getWriter().write(result.toJson());
				}  else {
					ScopedValue.where(EffectivePerson.SCOPED, effectivePerson).run(() -> {
						try {
							chain.doFilter(request, response);
						} catch (ServletException | IOException e) {
							throw new RuntimeException(e);
						}
					});
				}
			} else {
				options(request,response);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void destroy() {
	}

	public void init(FilterConfig config) throws ServletException {
	}
}
