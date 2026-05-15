package com.x.portal.assemble.surface.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.AnonymousCipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/page/*", asyncSupported = true)
public class PageJaxrsFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
