package com.x.organization.assemble.personal.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;

@WebFilter(urlPatterns = { "/jaxrs/custom/*" }, asyncSupported = true)
public class CustomJaxrsFilter extends ManagerUserJaxrsFilter {

}
