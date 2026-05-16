package com.x.processplatform.service.processing.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/workcompleted/*", asyncSupported = true)
public class WorkCompletedJaxrsFilter extends CipherManagerJaxrsFilter {

}
