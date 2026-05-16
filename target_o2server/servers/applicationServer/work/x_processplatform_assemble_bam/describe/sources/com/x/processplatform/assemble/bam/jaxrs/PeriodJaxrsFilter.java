package com.x.processplatform.assemble.bam.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/period/*", asyncSupported = true)
public class PeriodJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
