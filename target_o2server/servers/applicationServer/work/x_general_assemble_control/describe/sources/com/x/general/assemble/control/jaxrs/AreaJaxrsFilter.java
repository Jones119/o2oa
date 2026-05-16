package com.x.general.assemble.control.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.AnonymousCipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/area/*", asyncSupported = true)
public class AreaJaxrsFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
