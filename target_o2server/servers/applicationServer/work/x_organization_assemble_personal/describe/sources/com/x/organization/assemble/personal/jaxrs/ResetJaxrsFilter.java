package com.x.organization.assemble.personal.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.AnonymousCipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/reset/*", asyncSupported = true)
public class ResetJaxrsFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
