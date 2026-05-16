package com.x.base.core.project.jaxrs;

import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = "/jaxrs/fireschedule/*", asyncSupported = true)
public class FireScheduleJaxrsFilter extends CipherManagerJaxrsFilter {

}
