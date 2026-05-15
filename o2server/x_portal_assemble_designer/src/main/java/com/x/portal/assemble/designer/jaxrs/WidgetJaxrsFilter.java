package com.x.portal.assemble.designer.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/widget/*", asyncSupported = true)
public class WidgetJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
