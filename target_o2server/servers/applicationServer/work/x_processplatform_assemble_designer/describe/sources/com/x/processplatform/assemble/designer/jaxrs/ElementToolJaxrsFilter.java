package com.x.processplatform.assemble.designer.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/elementtool/*", asyncSupported = true)
public class ElementToolJaxrsFilter extends CipherManagerJaxrsFilter {

}
