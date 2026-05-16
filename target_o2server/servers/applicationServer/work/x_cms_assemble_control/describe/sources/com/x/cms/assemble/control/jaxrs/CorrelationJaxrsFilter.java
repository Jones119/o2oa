package com.x.cms.assemble.control.jaxrs;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = "/jaxrs/correlation/*", asyncSupported = true)
public class CorrelationJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
