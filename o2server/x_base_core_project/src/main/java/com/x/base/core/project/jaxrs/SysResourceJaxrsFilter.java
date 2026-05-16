package com.x.base.core.project.jaxrs;

import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = { "/jaxrs/sysresource/*" }, asyncSupported = true)
public class SysResourceJaxrsFilter extends CipherManagerJaxrsFilter {

}
