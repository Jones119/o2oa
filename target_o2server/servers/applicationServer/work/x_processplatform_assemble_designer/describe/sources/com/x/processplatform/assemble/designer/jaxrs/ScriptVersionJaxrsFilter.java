package com.x.processplatform.assemble.designer.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/scriptversion/*", asyncSupported = true)
public class ScriptVersionJaxrsFilter extends ManagerUserJaxrsFilter {

}
