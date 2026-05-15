package com.x.organization.assemble.control.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/unit/*", asyncSupported = true)
public class UnitFilter extends CipherManagerUserJaxrsFilter {

}
