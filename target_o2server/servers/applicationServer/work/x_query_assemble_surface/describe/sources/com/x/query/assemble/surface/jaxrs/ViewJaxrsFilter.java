package com.x.query.assemble.surface.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/view/*", asyncSupported = true)
public class ViewJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
