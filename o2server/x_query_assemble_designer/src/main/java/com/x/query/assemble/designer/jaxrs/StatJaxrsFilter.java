package com.x.query.assemble.designer.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/stat/*", asyncSupported = true)
public class StatJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
