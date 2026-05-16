package com.x.processplatform.assemble.surface.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.AnonymousCipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/service/*", asyncSupported = true)
public class ApplicationServiceFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
