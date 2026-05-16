package com.x.base.core.project.jaxrs;

import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = { "/jaxrs/openapi/*" }, asyncSupported = true)
public class OpenApiJaxrsFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
