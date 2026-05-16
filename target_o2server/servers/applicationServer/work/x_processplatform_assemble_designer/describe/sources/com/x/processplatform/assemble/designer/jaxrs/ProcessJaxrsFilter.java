package com.x.processplatform.assemble.designer.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/process/*", asyncSupported = true)
public class ProcessJaxrsFilter extends ManagerUserJaxrsFilter {

}
