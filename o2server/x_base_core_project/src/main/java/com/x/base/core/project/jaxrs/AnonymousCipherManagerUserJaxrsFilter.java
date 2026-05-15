package com.x.base.core.project.jaxrs;

import java.io.IOException;
import java.util.ScopedValue;

import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;

import com.google.common.net.HttpHeaders;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.http.FilterTools;
import com.x.base.core.project.http.HttpToken;

public abstract class AnonymousCipherManagerUserJaxrsFilter extends TokenFilter {

	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
			throws IOException, ServletException {
		try {
			HttpServletRequest request = (HttpServletRequest) req;
			HttpServletResponse response = (HttpServletResponse) res;
			httpRequestCheck(request);
			FilterTools.allow(request, response);
			if (!request.getMethod().equalsIgnoreCase(HTTP_OPTIONS)) {
				HttpToken httpToken = new HttpToken();
				EffectivePerson effectivePerson = httpToken.whoNotRefreshToken(request, response, Config.token().getCipher());
				ScopedValue.where(EffectivePerson.SCOPED, effectivePerson).run(() -> {
					try {
						chain.doFilter(request, response);
					} catch (ServletException | IOException e) {
						throw new RuntimeException(e);
					}
				});
			} else {
				options(request, response);
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
