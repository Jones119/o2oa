package com.x.meeting.assemble.control.jaxrs;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;

import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = "/jaxrs/config/*", asyncSupported = true)
public class ConfigJaxrsFilter extends ManagerUserJaxrsFilter {

}
