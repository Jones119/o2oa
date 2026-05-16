package com.x.organization.assemble.control.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/role/*", asyncSupported = true)
public class RoleFilter extends ManagerUserJaxrsFilter {

}
