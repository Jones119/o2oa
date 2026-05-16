package com.x.processplatform.assemble.surface.jaxrs;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = "/jaxrs/datarecord/*", asyncSupported = true)
public class DataRecordJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
