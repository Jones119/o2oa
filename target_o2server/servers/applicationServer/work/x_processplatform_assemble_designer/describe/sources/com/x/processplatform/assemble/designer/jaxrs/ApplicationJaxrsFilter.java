package com.x.processplatform.assemble.designer.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/application/*", asyncSupported = true)
public class ApplicationJaxrsFilter extends ManagerUserJaxrsFilter {

}
