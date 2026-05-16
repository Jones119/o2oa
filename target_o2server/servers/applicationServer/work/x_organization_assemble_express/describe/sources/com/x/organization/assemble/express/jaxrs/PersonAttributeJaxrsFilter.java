package com.x.organization.assemble.express.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/personattribute/*", asyncSupported = true)
public class PersonAttributeJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
