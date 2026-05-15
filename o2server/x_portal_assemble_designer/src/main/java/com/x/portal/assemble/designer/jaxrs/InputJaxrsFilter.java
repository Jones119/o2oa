package com.x.portal.assemble.designer.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/input/*", asyncSupported = true)
public class InputJaxrsFilter extends CipherManagerJaxrsFilter {

}
