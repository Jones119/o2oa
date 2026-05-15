package com.x.organization.assemble.control.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/group/*", asyncSupported = true)
public class GroupJaxrsFilter extends ManagerUserJaxrsFilter {

}
