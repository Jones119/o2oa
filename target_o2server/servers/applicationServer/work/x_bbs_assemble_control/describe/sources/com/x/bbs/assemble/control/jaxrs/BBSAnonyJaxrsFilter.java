package com.x.bbs.assemble.control.jaxrs;

import java.io.IOException;
import java.lang.ScopedValue;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;

import com.x.base.core.project.config.Config;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.http.FilterTools;
import com.x.base.core.project.http.HttpToken;
import com.x.base.core.project.http.TokenType;
import com.x.base.core.project.jaxrs.AnonymousCipherManagerUserJaxrsFilter;
import com.x.bbs.assemble.control.ThisApplication;

@WebFilter(urlPatterns = { 
		"/jaxrs/image/encode/*", 
		"/servlet/image/encode/*", 
		"/jaxrs/setting/*",
		"/jaxrs/uuid/*"
		}, asyncSupported = true)
public class BBSAnonyJaxrsFilter extends AnonymousCipherManagerUserJaxrsFilter {
	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
		try {
			HttpServletRequest request = (HttpServletRequest) req;
			HttpServletResponse response = (HttpServletResponse) res;
			FilterTools.allow(request, response);
			if (!request.getMethod().equalsIgnoreCase("options")) {
				HttpToken httpToken = new HttpToken();
				EffectivePerson effectivePerson = httpToken.who(request, response, Config.token().getCipher());

				if ( TokenType.anonymous.equals(effectivePerson.getTokenType()) &&
						StringUtils.equalsAnyIgnoreCase( ThisApplication.CONFIG_BBS_ANONYMOUS_PERMISSION, "NO")) {
					response.setStatus(500);
					response.setHeader("Content-Type", "application/json;charset=UTF-8");
					response.getWriter().write(FilterTools.APPLICATION_NOT_MANAGERUSER_JSON);
				}else{
					ScopedValue.where(EffectivePerson.SCOPED, effectivePerson).run(() -> {
						try {
							chain.doFilter(request, response);
						} catch (ServletException | IOException e) {
							throw new RuntimeException(e);
						}
					});
				}

			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
