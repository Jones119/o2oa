package com.x.organization.assemble.authentication.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.AnonymousCipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/dingding/*", asyncSupported = true)
public class DingdingJaxrsFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
