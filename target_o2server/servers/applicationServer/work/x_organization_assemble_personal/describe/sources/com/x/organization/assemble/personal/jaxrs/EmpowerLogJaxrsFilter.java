package com.x.organization.assemble.personal.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/empowerlog/*", asyncSupported = true)
public class EmpowerLogJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
