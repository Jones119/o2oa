package com.x.processplatform.assemble.surface.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.AnonymousCipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/anonymous/*", asyncSupported = true)
public class AnonymousJaxrsFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
