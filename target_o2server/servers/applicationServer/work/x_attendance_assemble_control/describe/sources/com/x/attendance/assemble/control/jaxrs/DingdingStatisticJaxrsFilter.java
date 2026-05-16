package com.x.attendance.assemble.control.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;


@WebFilter(urlPatterns = "/jaxrs/dingdingstatistic/*", asyncSupported = true)
public class DingdingStatisticJaxrsFilter extends ManagerUserJaxrsFilter {
}
